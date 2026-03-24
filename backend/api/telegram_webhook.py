from fastapi import APIRouter, Request, Header, HTTPException
from core.config import settings
from services.telegram_handler import handle_update
import logging

router = APIRouter(tags=["Telegram Webhook"])

@router.post("/telegram-webhook")
async def telegram_webhook(request: Request, x_telegram_bot_api_secret_token: str = Header(None)):
    """Receives updates directly from Telegram servers"""
    
    # Determine the expected secret
    expected_secret = settings.telegram_webhook_secret or settings.telegram_bot_token
    # Telegram requires secret_token to be alphanumeric + _ or -
    expected_secret = "".join(c for c in expected_secret if c.isalnum() or c in "_-")
    
    if x_telegram_bot_api_secret_token != expected_secret:
        logging.warning("Unauthorized access to Telegram webhook")
        # Ensure it actually raises an exception in production
        raise HTTPException(status_code=403, detail="Unauthorized")

    try:
        update_data = await request.json()
        await handle_update(update_data)
        return {"status": "ok"}
    except Exception as e:
        logging.error(f"Error processing Telegram webhook: {str(e)}")
        # Telegram retries if we don't return 200, so handle safely
        return {"status": "error"}
