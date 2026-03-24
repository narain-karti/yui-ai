import json
from core.config import settings
from core.bedrock import invoke_agent
from core.tools import get_yui_tool_config
from services.telegram_client import send_message, send_dashboard_button

YUI_PROMPT = """You are Yui, the friendly interface of an autonomous travel agent system. 
Your ONLY job is to classify the user's intent and route it correctly. 
Never perform complex reasoning. Never look up flights. Never suggest places. 
Output a JSON object: { "intent": "string", "confidence": 0.0, "params": {} } 
Valid intents: BOOK_FLIGHT, CHECK_STATUS, DISRUPTION_ACK, SUGGEST_PLACES, WEB_QUESTION, VIEW_ITINERARY, PREFERENCES, GENERAL_CHAT.
Be brief in any conversational reply. Your tone is warm and efficient."""

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
    try:
        # Fallback if Nova Lite includes markdown codeblocks:
        clean_json = output_text.replace("```json", "").replace("```", "").strip()
        return json.loads(clean_json)
    except:
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
        # from agents.luma import run_luma_explicit
        # await run_luma_explicit(chat_id, classification.get("params"))
    elif intent in ["BOOK_FLIGHT", "CHECK_STATUS", "DISRUPTION_ACK"]:
        await send_message(chat_id, "Let me check on your flight...")
        # from agents.aria import check_flight
    elif intent == "GENERAL_CHAT":
        await send_message(chat_id, "I'm a bot! I can look up flights, suggest venues, and handle disruptions.")
    else:
        await send_message(chat_id, f"Intent classified as: {intent}")
