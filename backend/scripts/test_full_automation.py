import os
import sys
import asyncio
import httpx
import json

# Add project root to path
sys.path.append('c:/Users/HARIHARAN/Desktop/IdeaVerse/Yui/backend')
from core.supabase import supabase
from core.config import settings

async def test_automation():
    print("🚀 Starting Full Automation Test...")
    
    # 1. Insert a mock booking into Supabase
    # We use a real chat_id if possible, otherwise we use a known one from your logs
    # For now, we'll ask the user to provide their chat_id or we'll find it in agent_logs
    try:
        logs = supabase.table("agent_logs").select("detail").eq("agent", "yui").limit(10).execute()
        # Find something like "Found recent order ... for user 123456"
        chat_id = None
        for log in logs.data:
            if "for user" in log["detail"]:
                chat_id = int(log["detail"].split("user")[-1].strip())
                break
        
        if not chat_id:
            print("⚠️ Could not find a real chat_id in logs. Please enter your Telegram Chat ID:")
            # In a non-interactive script, we'll just use a placeholder or fail
            chat_id = 6227536917 # Fallback to a common one found in aria.py
            
        order_id = "test_ord_12345"
        print(f"1. Creating mock booking for chat_id={chat_id}, order_id={order_id}...")
        
        # Clean up old test data
        supabase.table("user_bookings").delete().eq("order_id", order_id).execute()
        
        booking = {
            "order_id": order_id,
            "chat_id": chat_id,
            "origin": "LHR",
            "destination": "JFK",
            "departure_date": "2026-12-01",
            "status": "confirmed"
        }
        supabase.table("user_bookings").insert(booking).execute()
        print("✅ Mock booking created in Supabase.")
        
        # 2. Simulate a Duffel Webhook call to our local server
        print(f"2. Simulating Duffel Webhook for order {order_id}...")
        
        webhook_payload = {
            "type": "order.flight_updated",
            "data": {
                "id": order_id,
                "slices": [
                    {
                        "expected_arrival_time": "2026-12-01T22:30:00Z"
                    }
                ]
            }
        }
        
        # Calculate signature if secret is set
        secret = settings.duffel_webhook_secret
        import hmac
        import hashlib
        body = json.dumps(webhook_payload).encode()
        signature = hmac.new(secret.encode(), body, hashlib.sha256).hexdigest() if secret else "no-secret"
        
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                "http://localhost:8000/duffel-webhook",
                json=webhook_payload,
                headers={"Duffel-Signature": signature}
            )
            print(f"✅ Webhook sent. Status: {resp.status_code}")
            print(f"Response: {resp.json()}")
            
        print("\n🎉 Test complete! Check your Telegram for the Travel Alert.")
        
    except Exception as e:
        print(f"❌ Test failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_automation())
