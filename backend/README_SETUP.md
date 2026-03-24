# Yui AI — Backend Setup & Testing Guide

This guide ensures a seamless end-to-end integration of the Yui AI Travel Agent.

## 1. Environment Configuration
Create a `.env` in the `backend/` directory with the following keys:
*   `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` (Bedrock access)
*   `TELEGRAM_BOT_TOKEN`, `TELEGRAM_MINI_APP_URL`
*   `DUFFEL_ACCESS_TOKEN`, `DUFFEL_WEBHOOK_SECRET`
*   `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`

## 2. Server & Connectivity
1.  **Start FastAPI**:
    ```bash
    cd Yui/backend
    uvicorn main:app --reload --port 8000
    ```
2.  **Start Public Tunnel** (Required for Telegram & Duffel webhooks):
    ```bash
    # Using Cloudflared (as used in development)
    npx -y cloudflared tunnel --url http://localhost:8000
    ```
    *Copy the public URL (e.g., `https://random-words.trycloudflare.com`).*

## 3. Registering the Webhook
Run the setup script one-time to tell Telegram where your server is:
```bash
python scripts/setup_telegram.py --url https://<YOUR_TUNNEL_URL>
```
*Note: This automatically registers the `X-Telegram-Bot-Api-Secret-Token` for security.*

## 4. Testing Core Abilities
### A. Searching & Booking (Interactive)
1.  Open your Telegram bot.
2.  Type: `book a flight from MAA to BOM on April 30th`.
3.  Click the **Book** button.
4.  Verify the Order ID appears and is logged in **Duffel Dashboard (Sandbox)**.

### B. Live Flight Status
1.  In Telegram, ask: `What is the status of my flight <ORDER_ID>?`.
2.  Yui will query the live Duffel API and return the route/confirmation status.

## 5. Testing Autonomous Rebooking (The "Hero" Feature)
To verify the **proactive** side of the agent without waiting for a real airline delay:
1.  Ensure the server is running.
2.  In a new terminal, run the local simulation script:
    ```bash
    cd Yui
    python backend/scripts/test_webhook.py
    ```
3.  **Check Telegram**: You should immediately receive a **🚨 Travel Alert!** followed by a proactive **✅ Alternative Found!** message with a rebooking button.

## 6. Monitoring
All AI thoughts, API calls, and errors are logged in real-time to your **Supabase `agent_logs` table**.
