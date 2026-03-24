import json
from core.config import settings
from core.bedrock import invoke_agent
from core.tools import get_yui_tool_config
from services.telegram_client import send_message, send_dashboard_button

YUI_PROMPT = """You are a specialized JSON router for an AI travel agent.
Current Date: 2026-03-24. 

CRITICAL: Output ONLY a valid JSON object. Do not include thinking tags. Do not include introductory text. 

Intent Rules:
- BOOK_FLIGHT: For searching or booking flights. Use 3-letter IATA codes (Chennai -> MAA). Use 2026 for dates.
- CHECK_STATUS: For checking existing flight delays.
- SUGGEST_PLACES: For venue/dining/work suggestions.
- GENERAL_CHAT: For everything else.

JSON Schema: { "intent": "string", "confidence": float, "params": { "origin": "string", "destination": "string", "departure_date": "YYYY-MM-DD" } }

Example:
{"intent": "BOOK_FLIGHT", "confidence": 1.0, "params": {"origin": "MAA", "destination": "BOM", "departure_date": "2026-04-03"}}
"""

async def classify_intent(text: str) -> dict:
    """Uses Nova Lite to classify the incoming user message"""
    messages = [{"role": "user", "content": [{"text": text}]}]
    system = [{"text": YUI_PROMPT}]
    
    response = invoke_agent(
        model_id=settings.bedrock_model_lite,
        messages=messages,
        system=system,
        toolConfig=get_yui_tool_config()
    )
    
    # Simple extraction of the first text block, assuming JSON is safely returned
    # based on the prompt. Need stricter parsing in production.
    output_text = response["output"]["message"]["content"][0]["text"]
    print(f"\n--- YUI AI OUTPUT ---\n{output_text}\n--- END YUI OUTPUT ---\n")
    
    from core.logger import log
    import asyncio
    
    try:
        # Fallback if Nova Lite includes markdown codeblocks or extra text:
        start = output_text.find('{')
        end = output_text.rfind('}') + 1
        
        if start != -1 and end != 0:
            clean_json = output_text[start:end]
            classification = json.loads(clean_json)
            # Fire and forget a log event for visibility
            asyncio.create_task(log("system", "yui", "CLASSIFIED", f"Intent: {classification.get('intent')}"))
            return classification
        else:
            print("❌ No JSON brackets found in output!")
            return {"intent": "GENERAL_CHAT", "confidence": 1.0, "params": {}}
            
    except Exception as e:
        print(f"❌ JSON PARSE ERROR: {str(e)}")
        asyncio.create_task(log("system", "yui", "PARSE_ERROR", f"Failed to parse: {output_text} | Error: {str(e)}"))
        return {"intent": "GENERAL_CHAT", "confidence": 1.0, "params": {}}

async def process_telegram_intent(chat_id: int, text: str):
    """Entry point from the handler"""
    if text == "/start":
        await send_message(chat_id, "Welcome to Yui AI! Your autonomous travel companion. How can I help you today?")
        return
        
    if text == "/dashboard":
        await send_dashboard_button(chat_id)
        return
        
    await send_message(chat_id, "Thinking...")
    classification = await classify_intent(text)
    intent = classification.get("intent")
    
    if intent == "SUGGEST_PLACES":
        await send_message(chat_id, "Looking up some places for you...")
        from agents.luma import run_luma_explicit
        await run_luma_explicit(chat_id, classification.get("params", {}))
    elif intent == "BOOK_FLIGHT":
        await send_message(chat_id, "Searching for the best flight options...")
        from agents.aria import handle_booking_request
        await handle_booking_request(chat_id, classification.get("params", {}))
    elif intent == "CHECK_STATUS":
        await send_message(chat_id, "Let me check on your flight status...")
        from agents.aria import check_flight
        await check_flight(chat_id)
    elif intent == "GENERAL_CHAT":
        await send_message(chat_id, "I'm a bot! I can look up flights, suggest venues, and handle disruptions.")
    else:
        await send_message(chat_id, f"Intent classified: {intent}. How can I assist further?")
