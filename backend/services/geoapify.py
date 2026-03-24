import httpx
from core.config import settings
from typing import Dict, Any

GEOAPIFY_URL = "https://api.geoapify.com/v2/places"

async def get_nearby_places(lat: float, lng: float, radius_meters: int, categories: str) -> Dict[str, Any]:
    """
    Fetch nearby places from Geoapify. 
    Categories could be 'catering.cafe', 'catering.restaurant', 'workplace', etc.
    """
    params = {
        "categories": categories,
        "filter": f"circle:{lng},{lat},{radius_meters}",
        "bias": f"proximity:{lng},{lat}",
        "conditions": "named", 
        "limit": 20,
        "apiKey": settings.geoapify_api_key
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.get(GEOAPIFY_URL, params=params)
        response.raise_for_status()
        return response.json()
