import hmac
import hashlib
import requests
import json
import os
from dotenv import load_dotenv

load_dotenv()

# Configuration
URL = "http://localhost:8000/duffel-webhook" # Or your cloudflared URL
SECRET = os.getenv("DUFFEL_WEBHOOK_SECRET")

if not SECRET:
    print("❌ Error: DUFFEL_WEBHOOK_SECRET not found in .env")
    exit(1)

payload = {
    "type": "order.flight_updated",
    "data": {
        "id": "ord_0000B4aT3x1BCi6A0F3Q12",
        "metadata": {"trip_id": "LDN-NYC-2026"}
    }
}

body = json.dumps(payload).encode()
signature = hmac.new(SECRET.encode(), body, hashlib.sha256).hexdigest()

print(f"Testing signed webhook at {URL}...")
print(f"Signature: {signature}")

try:
    response = requests.post(
        URL,
        data=body,
        headers={
            "Content-Type": "application/json",
            "Duffel-Signature": signature
        }
    )
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
except Exception as e:
    print(f"❌ Error: {str(e)}")
