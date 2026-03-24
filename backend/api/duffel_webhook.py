from fastapi import APIRouter, Request
from core.config import settings
import logging

router = APIRouter(tags=["Duffel Webhook"])

@router.post("/duffel-webhook")
async def duffel_webhook(request: Request):
    """
    Receives simulated disruption webhooks from Duffel.
    Must verify HMAC signature in production using `Duffel-Signature`.
    """
    try:
        payload = await request.json()
        payload_type = payload.get("type", "")
        
        # In a real system you'd use HMAC with settings.duffel_webhook_secret
        
        if payload_type == "order.flight_updated":
            # Extract delay and trigger ARIA
            data = payload.get("data", {})
            # trip_id is implicitly derived in the real app, mocking here.
            trip_id = data.get("metadata", {}).get("trip_id", "trip_123")
            
            from agents.aria import process_disruption
            # We assume a 45 min delay to simulate
            await process_disruption(trip_id=trip_id, new_eta="11:15", delay_mins=45)
            
        return {"status": "received"}
    except Exception as e:
        logging.error(f"Duffel webhook error: {str(e)}")
        return {"status": "error"}
