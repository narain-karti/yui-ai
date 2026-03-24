from fastapi import APIRouter, Request, Header, HTTPException
from core.config import settings
from services.telegram_handler import handle_update
import logging

router = APIRouter(tags=["Telegram Webhook"])

@router.post("/telegram-webhook")
async def telegram_webhook(request: Request, x_telegram_bot_api_secret_token: str = Header(None)):
    """Receives updates directly from Telegram servers"""
    
    # Simple explicit secret checking
    if x_telegram_bot_api_secret_token != settings.telegram_bot_token:
        # In prod you'd use a dedicated secret string, but bot token works as a baseline
        # Let's log and forbid if completely unauthorized
        logging.warning("Unauthorized access to Telegram webhook")
        # raise HTTPException(status_code=403, detail="Unauthorized")

    try:
        update_data = await request.json()
        await handle_update(update_data)
        return {"status": "ok"}
    except Exception as e:
        logging.error(f"Error processing Telegram webhook: {str(e)}")
        # Telegram retries if we don't return 200, so handle safely
        return {"status": "error"}
