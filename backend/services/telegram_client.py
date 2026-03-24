import httpx
from core.config import settings
from typing import List, Dict, Any, Optional

TELEGRAM_API_URL = f"https://api.telegram.org/bot{settings.telegram_bot_token}"

async def send_message(chat_id: int, text: str, reply_markup: Optional[Dict[str, Any]] = None):
    """Sends a message to the specified Telegram chat ID."""
    payload = {
        "chat_id": chat_id,
        "text": text,
        "parse_mode": "HTML"
    }
    if reply_markup:
        payload["reply_markup"] = reply_markup

    async with httpx.AsyncClient() as client:
        resp = await client.post(f"{TELEGRAM_API_URL}/sendMessage", json=payload)
        resp.raise_for_status()
        return resp.json()

async def send_dashboard_button(chat_id: int):
    """Sends a message with an inline button that opens the Telegram Mini App."""
    reply_markup = {
        "inline_keyboard": [[
            {
                "text": "Open Dashboard 🚀",
                "web_app": {
                    "url": settings.telegram_mini_app_url
                }
            }
        ]]
    }
    await send_message(
        chat_id=chat_id, 
        text="Tap below to open your live travel dashboard:",
        reply_markup=reply_markup
    )
