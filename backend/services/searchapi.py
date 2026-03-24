import httpx
from core.config import settings
from typing import Dict, Any

SEARCHAPI_URL = "https://www.searchapi.io/api/v1/search"

async def live_web_search(query: str) -> Dict[str, Any]:
    """Execute a live search using SearchApi.io"""
    params = {
        "engine": "google",
        "q": query,
        "api_key": settings.searchapi_key
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.get(SEARCHAPI_URL, params=params)
        response.raise_for_status()
        return response.json()
