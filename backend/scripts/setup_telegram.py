import os
import sys
import asyncio
import argparse
import httpx

# Add the project root to the python path to import core config
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from core.config import settings

TELEGRAM_API_URL = f"https://api.telegram.org/bot{settings.telegram_bot_token}"

async def set_webhook(url: str):
    """Registers the webhook URL with Telegram"""
    print(f"Setting webhook to: {url}")
    
    # Check if a specific webhook secret is defined, else use bot token (less secure, but a fallback)
    secret_token = settings.telegram_webhook_secret or settings.telegram_bot_token
    
    # Telegram requires secret_token to be [a-zA-Z0-9_-]{1,256}
    # Bot tokens have a colon, which is invalid for secret_token. 
    # If the user didn't define a custom secret, we'll strip invalid chars from the bot token for the fallback.
    valid_secret = "".join(c for c in secret_token if c.isalnum() or c in "_-")
    
    payload = {
        "url": url,
        "secret_token": valid_secret,
        "drop_pending_updates": True
    }
    
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.post(f"{TELEGRAM_API_URL}/setWebhook", json=payload)
            resp.raise_for_status()
            data = resp.json()
            if data.get("ok"):
                print("✅ Webhook successfully set!")
            else:
                print(f"❌ Failed to set webhook: {data.get('description')}")
        except Exception as e:
            print(f"❌ HTTP Error setting webhook: {str(e)}")

async def setup_commands():
    """Configures the menu commands for the Telegram Bot"""
    print("Setting up bot commands...")
    commands = [
        {"command": "start", "description": "Start Yui AI"},
        {"command": "dashboard", "description": "Open your travel dashboard"},
    ]
    
    payload = {"commands": commands}
    
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.post(f"{TELEGRAM_API_URL}/setMyCommands", json=payload)
            resp.raise_for_status()
            data = resp.json()
            if data.get("ok"):
                print("✅ Bot commands successfully set!")
            else:
                print(f"❌ Failed to set commands: {data.get('description')}")
        except Exception as e:
            print(f"❌ HTTP Error setting commands: {str(e)}")

async def main():
    parser = argparse.ArgumentParser(description="Setup Telegram Bot Configuration")
    parser.add_argument("--url", help="The full public HTTPS URL to the webhook endpoint (e.g., https://your-ngrok.app/telegram-webhook)", required=False)
    args = parser.parse_args()

    if args.url:
        await set_webhook(args.url)
    else:
        print("⚠️ No --url provided. Skipping webhook registration.")
    
    await setup_commands()
    print("Setup complete.")

if __name__ == "__main__":
    asyncio.run(main())
