import logging
import hmac
import hashlib
from fastapi import APIRouter, Request, Header, HTTPException
from core.config import settings

router = APIRouter(tags=["Duffel Webhook"])

@router.post("/duffel-webhook")
async def duffel_webhook(request: Request, duffel_signature: str = Header(None)):
    """
    Receives disruption webhooks from Duffel.
    Verifies HMAC signature using `Duffel-Signature` header.
    """
    body = await request.body()
    
    # 1. Verify Signature
    if not duffel_signature:
        raise HTTPException(status_code=401, detail="Missing Duffel-Signature")
        
    secret = settings.duffel_webhook_secret
    if secret:
        # Standard HMAC-SHA256 verification
        # Duffel-Signature is typically just the hex digest
        expected_signature = hmac.new(
            secret.encode(),
            body,
            hashlib.sha256
        ).hexdigest()
        
        if not hmac.compare_digest(expected_signature, duffel_signature):
            logging.warning("Invalid Duffel signature received.")
            raise HTTPException(status_code=401, detail="Invalid Signature")

    try:
        payload = await request.json()
        payload_type = payload.get("type", "")
        
        if payload_type == "order.flight_updated":
            # Extract delay and trigger ARIA
            data = payload.get("data", {})
            trip_id = data.get("id", "trip_123")
            
            from agents.aria import process_disruption
            # We assume a 45 min delay to simulate for now
            await process_disruption(trip_id=trip_id, new_eta="11:15", delay_mins=45)
            
        return {"status": "received"}
    except Exception as e:
        logging.error(f"Duffel webhook error: {str(e)}")
        return {"status": "error"}
