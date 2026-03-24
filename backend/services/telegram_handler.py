from typing import Dict, Any
import json
# For now, we mock the import of the yui agent, but due to decoupled structure,
# we can safely import it later without circular dependency.
# from agents.yui import process_telegram_message

async def handle_update(update: Dict[str, Any]):
    """
    Parses an incoming Telegram update.
    Extracts text, commands, inline button callbacks, or location shares,
    and routes them to the Yui Router agent.
    """
    if "message" in update:
        message = update["message"]
        chat_id = message["chat"]["id"]
        
        # Handle text messages or commands
        if "text" in message:
            text = message["text"]
            # To avoid circular import right now, we'll assume the caller (webhook)
            # or the handler can directly invoke `agents.yui`
            from agents.yui import process_telegram_intent
            await process_telegram_intent(chat_id, text)
            
        # Handle location sharing
        elif "location" in message:
            lat = message["location"]["latitude"]
            lng = message["location"]["longitude"]
            from agents.luma import set_user_location
            await set_user_location(chat_id, lat, lng)
            
    # Handle callback queries from inline buttons
    elif "callback_query" in update:
        query = update["callback_query"]
        chat_id = query["message"]["chat"]["id"]
        data = query["data"]
        # e.g., data = "rebook_offer_xyz123"
        from agents.aria import process_callback_action
        await process_callback_action(chat_id, data)
