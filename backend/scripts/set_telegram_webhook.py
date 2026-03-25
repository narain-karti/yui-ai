import sys
import requests
import os
from dotenv import load_dotenv

# Add parent directory to path to import core.config
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from core.config import settings

def set_webhook(url: str):
    token = settings.telegram_bot_token
    if not token or token == "YOUR_TELEGRAM_BOT_TOKEN":
        print("❌ TELEGRAM_BOT_TOKEN not found in .env!")
        return

    # Ensure it uses the correct path
    webhook_url = f"{url.rstrip('/')}/telegram-webhook"
    
    # Same logic as api/telegram_webhook.py
    expected_secret = settings.telegram_webhook_secret or settings.telegram_bot_token
    expected_secret = "".join(c for c in expected_secret if c.isalnum() or c in "_-")

    api_url = f"https://api.telegram.org/bot{token}/setWebhook"
    params = {
        "url": webhook_url,
        "secret_token": expected_secret
    }
    
    print(f"Setting Telegram Webhook to: {webhook_url}")
    response = requests.post(api_url, json=params)
    
    if response.status_code == 200:
        print("✅ Webhook successfully set!")
        print(response.json())
    else:
        print(f"❌ Failed to set webhook: {response.status_code}")
        print(response.text)

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python scripts/set_telegram_webhook.py <your-tunnel-url>")
        print("Example: python scripts/set_telegram_webhook.py https://beliefs-corners-greatly-significant.trycloudflare.com")
        sys.exit(1)
    
    tunnel_url = sys.argv[1].strip()
    set_webhook(tunnel_url)
