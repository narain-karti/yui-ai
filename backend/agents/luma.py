import json
from core.config import settings
from core.bedrock import invoke_agent
from services.geoapify import get_nearby_places
from services.telegram_client import send_message
from core.logger import log

LUMA_PROMPT = """You are LUMA, the concierge agent of the Yui travel system. 
You are given a list of nearby venues from Geoapify.
Apply the Three-Card Rule: select exactly 3 venues — one food, one work, one explore. 
Return ONLY valid JSON: { "food": {...}, "work": {...}, "explore": {...} } 
Each card must include: name, type, distance_min, rating, why_recommended."""

async def generate_suggestions(trip_id: str, lat: float, lng: float, free_mins: int):
    """
    Finds places using Geoapify and filters/structs them via Nova Lite.
    """
    await log(trip_id, "luma", "STARTED", "Extracting free windows and scanning venues.")
    
    # 1. Fetch from Geoapify
    try:
        places_data = await get_nearby_places(lat, lng, 2000, "catering,workplace,tourism")
        venues = places_data.get("features", [])
        await log(trip_id, "luma", "PLACES_FETCHED", f"Found {len(venues)} raw venues from Geoapify.")
    except Exception as e:
        await log(trip_id, "luma", "ERROR", str(e))
        return None
        
    # 2. Filter via Bedrock
    prompt = f"Free time: {free_mins} mins. Places JSON: {json.dumps(venues[:15])}"
    messages = [{"role": "user", "content": [{"text": prompt}]}]
    system = [{"text": LUMA_PROMPT}]
    
    await log(trip_id, "luma", "THINKING", "Applying Three-Card rule via Nova Lite...")
    
    response = invoke_agent(
        model_id=settings.bedrock_model_lite,
        messages=messages,
        system=system
    )
    
    result = response["output"]["message"]["content"][0]["text"]
    try:
        clean_json = result.replace("```json", "").replace("```", "").strip()
        cards = json.loads(clean_json)
        await log(trip_id, "luma", "CARDS_READY", "Concierge cards generated successfully.")
        return cards
    except:
        await log(trip_id, "luma", "ERROR", "Failed to parse JSON off Nova Lite")
        return None

async def set_user_location(chat_id: int, lat: float, lng: float):
    """Handle explicit gps location share"""
    await send_message(chat_id, "Location received. Running LUMA to find nearby spots...")
    # Typically we find the active trip_id from Supabase and call generate_suggestions
    # Not persisting to DB here to respect the PRD privacy policy (Ephemeral Location)
