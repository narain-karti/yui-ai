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

## 3. Registering the Telegram Webhook
Run the automation script to tell Telegram where your server is:
```bash
python scripts/set_telegram_webhook.py https://<YOUR_TUNNEL_URL>
```
*Note: This automatically registers the `X-Telegram-Bot-Api-Secret-Token` for security.*

## 4. Registering the Duffel Webhook
1.  Go to the **Duffel Dashboard > Webhooks**.
2.  Set the URL to: `https://<YOUR_TUNNEL_URL>/duffel-webhook`.
3.  Ensure the following events are selected:
    *   `order.airline_initiated_change_detected`
    *   `order.created`
    *   `ping.triggered`
4.  Copy the **Webhook Secret** and update `DUFFEL_WEBHOOK_SECRET` in your `.env`.

## 5. Testing Core Abilities
### A. Searching & Booking (Interactive)
1.  Open your Telegram bot.
2.  Type: `book a flight from MAA to BOM on April 30th`.
3.  Click the **Book** button.
4.  Verify the Order ID appears and is logged in **Duffel Dashboard (Sandbox)**.

### B. Live Flight Status
1.  In Telegram, ask: `What is the status of my flight?`.
2.  Yui will query the live Duffel API and return the route/confirmation status.

## 6. Testing Autonomous Rebooking (The "Hero" Feature)
To verify the **proactive** side of the agent without waiting for a real airline delay:
1.  Ensure the server is running.
2.  In the **Duffel Dashboard**, go to your Webhook and click **"Ping"**.
3.  **Check Terminal**: You should see a `200 OK` and a `pong` message.
4.  To simulate a real disruption, use the `scripts/test_webhook.py` (for local simulation) or trigger a change in the Duffel Sandbox for the order you just made.

## 7. Monitoring
All AI thoughts, API calls, and errors are logged in real-time to your **Supabase `agent_logs` table**.
