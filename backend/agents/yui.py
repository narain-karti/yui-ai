import json
from core.config import settings
from core.bedrock import invoke_agent
from core.tools import get_yui_tool_config
from services.telegram_client import send_message, send_dashboard_button

YUI_PROMPT = """You are a specialized JSON router for an AI travel agent.
Current Date: 2026-03-24. 

CRITICAL: Output ONLY a valid JSON object. Do not include thinking tags. Do not include introductory text. 

Intent Rules:
- BOOK_FLIGHT: For searching or booking flights.
- CHECK_STATUS: For checking existing flight delays or order status.
- DISRUPTION_ADVICE: For user asking about delays, cancellations, or rights.
- SUGGEST_PLACES: For venue/dining/work suggestions.
- GENERAL_CHAT: For everything else (greetings, identity, random questions).

JSON Schema: { "intent": "string", "confidence": float, "params": { "origin": "string", "destination": "string", "departure_date": "YYYY-MM-DD", "query": "string", "order_id": "string" } }
"""

async def classify_intent(text: str) -> dict:
    """Uses Nova Lite to classify the incoming user message"""
    messages = [{"role": "user", "content": [{"text": text}]}]
    system = [{"text": YUI_PROMPT}]
    
    response = invoke_agent(
        model_id=settings.bedrock_model_lite,
        messages=messages,
        system=system
    )
    
    output_text = response["output"]["message"]["content"][0]["text"]
    
    from core.logger import log
    import asyncio
    
    try:
        start = output_text.find('{')
        end = output_text.rfind('}') + 1
        
        if start != -1 and end != 0:
            clean_json = output_text[start:end]
            classification = json.loads(clean_json)
            asyncio.create_task(log("system", "yui", "CLASSIFIED", f"Intent: {classification.get('intent')}"))
            return classification
        else:
            return {"intent": "GENERAL_CHAT", "confidence": 1.0, "params": {"query": text}}
            
    except Exception as e:
        asyncio.create_task(log("system", "yui", "PARSE_ERROR", f"Error: {str(e)}"))
        return {"intent": "GENERAL_CHAT", "confidence": 1.0, "params": {"query": text}}

async def get_dynamic_response(text: str) -> str:
    """Uses Nova Lite to generate a conversational response for general chat or identity questions"""
    prompt = "You are Yui, a friendly, professional AI travel agent assistant. Answer the following user query briefly and helpfully."
    messages = [{"role": "user", "content": [{"text": text}]}]
    system = [{"text": prompt}]
    
    response = invoke_agent(
        model_id=settings.bedrock_model_lite,
        messages=messages,
        system=system
    )
    return response["output"]["message"]["content"][0]["text"]

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
    params = classification.get("params", {})
    
    if intent == "SUGGEST_PLACES":
        await send_message(chat_id, "Looking up some places for you...")
        from agents.luma import run_luma_explicit
        await run_luma_explicit(chat_id, params)
    elif intent == "BOOK_FLIGHT":
        await send_message(chat_id, "Searching for the best flight options...")
        from agents.aria import handle_booking_request
        await handle_booking_request(chat_id, params)
    elif intent == "CHECK_STATUS":
        await send_message(chat_id, "Let me check on your flight status...")
        from agents.aria import check_flight
        await check_flight(chat_id, params)
    elif intent == "DISRUPTION_ADVICE":
        from agents.aria import handle_disruption
        await handle_disruption(chat_id, text)
    elif intent == "GENERAL_CHAT":
        response = await get_dynamic_response(text)
        await send_message(chat_id, response)
    else:
        await send_message(chat_id, "I can help with flight booking, status checks, and travel tips. What's on your mind?")
