import httpx
from core.config import settings
from typing import Dict, Any

DUFFEL_BASE_URL = "https://api.duffel.com"
HEADERS = {
    "Duffel-Version": "v2",
    "Authorization": f"Bearer {settings.duffel_access_token}",
    "Content-Type": "application/json"
}

async def search_flights(origin: str, destination: str, departure_date: str) -> Dict[str, Any]:
    """Search for alternative flights on Duffel"""
    payload = {
        "data": {
            "slices": [
                {
                    "origin": origin,
                    "destination": destination,
                    "departure_date": departure_date
                }
            ],
            "passengers": [{"type": "adult"}],
        }
    }
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{DUFFEL_BASE_URL}/air/offer_requests",
            json=payload,
            headers=HEADERS
        )
        return response.json()

async def execute_booking(offer_id: str, passenger_details: Dict[str, Any], amount: str, currency: str) -> Dict[str, Any]:
    """Execute a real booking on Duffel (requires payment block in v2)"""
    payload = {
        "data": {
            "selected_offers": [offer_id],
            "passengers": [passenger_details],
            "payments": [
                {
                    "type": "balance",
                    "amount": amount,
                    "currency": currency
                }
            ]
        }
    }
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{DUFFEL_BASE_URL}/air/orders", 
            json=payload, 
            headers=HEADERS
        )
        # Return pure JSON so Aria can handle 422 errors gracefully
        return response.json()

async def get_order_status(order_id: str) -> Dict[str, Any]:
    """Fetch the status of an existing order"""
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{DUFFEL_BASE_URL}/air/orders/{order_id}",
            headers=HEADERS
        )
        response.raise_for_status()
        return response.json()
