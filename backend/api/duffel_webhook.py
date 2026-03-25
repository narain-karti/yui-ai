import logging
import hmac
import hashlib
from fastapi import APIRouter, Request, Header, HTTPException
from core.config import settings

router = APIRouter(tags=["Duffel Webhook"])

@router.post("/duffel-webhook")
async def duffel_webhook(request: Request, x_duffel_signature: str = Header(None)):
    """
    Receives disruption webhooks from Duffel.
    Verifies HMAC signature using `X-Duffel-Signature` header.
    """
    body = await request.body()
    
    # 1. Verify Signature (only if secret is set)
    secret = settings.duffel_webhook_secret
    if secret:
        if not x_duffel_signature:
            logging.warning("Missing X-Duffel-Signature header.")
            raise HTTPException(status_code=401, detail="Missing X-Duffel-Signature")
            
        try:
            # Format: t=1616202842,v1=8aebaa7ecaf3...
            # Use strip() to handle potential spaces after commas
            pairs = {}
            for pair in x_duffel_signature.split(','):
                if '=' in pair:
                    k, v = pair.split('=', 1)
                    pairs[k.strip()] = v.strip()

            timestamp = pairs.get('t')
            v1_signature = pairs.get('v1') or pairs.get('v2')
            
            if not timestamp or not v1_signature:
                logging.error(f"Incomplete Duffel signature. Header: {x_duffel_signature}")
                raise ValueError("Incomplete signature header")
                
            # Recreate the signature: HMAC-SHA256(secret, timestamp + "." + body)
            signed_payload = f"{timestamp}.".encode() + body
            expected_signature = hmac.new(
                secret.encode(),
                signed_payload,
                hashlib.sha256
            ).hexdigest()
            
            if not hmac.compare_digest(v1_signature, expected_signature):
                logging.warning(f"Invalid Duffel signature. Expected {expected_signature} but got {v1_signature}")
                raise HTTPException(status_code=401, detail="Invalid Signature")
        except Exception as e:
            logging.error(f"Error parsing Duffel signature: {str(e)}")
            raise HTTPException(status_code=401, detail="Invalid Signature Format")

    try:
        payload = await request.json()
        payload_type = payload.get("type", "")
        
        # Handle ping from Duffel dashboard
        if payload_type == "ping.triggered":
            return {"status": "success", "message": "pong"}

        if payload_type == "order.flight_updated":
            data = payload.get("data", {})
            order_id = data.get("id")
            
            # Extract actual ETA changes if they exist in slices
            slices = data.get("slices", [])
            first_slice = slices[0] if slices else {}
            
            # Duffel sandbox provides expected_arrival_time when delays happen
            new_eta = first_slice.get("expected_arrival_time") or "Check Dashboard"
            
            from agents.aria import process_disruption
            # We pass the order_id (trip_id) to ARIA to find the correct chat_id
            await process_disruption(trip_id=order_id, new_eta=new_eta, delay_mins=30)
            
        return {"status": "received"}
    except Exception as e:
        logging.error(f"Duffel webhook error: {str(e)}")
        return {"status": "error"}
