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

async def run_luma_explicit(chat_id: int, params: dict):
    """Explicitly generates suggestions when asked via Telegram"""
    # 1. Determine location coords (lat, lng)
    # Default to Paris for the demo, but check if a destination was provided
    city = params.get("destination") or params.get("query")
    lat, lng = 48.8566, 2.3522 # Paris
    
    if city and "london" in city.lower():
        lat, lng = 51.5074, -0.1278
    elif city and "chennai" in city.lower():
        lat, lng = 13.0827, 80.2707
    elif city and "mumbai" in city.lower():
        lat, lng = 19.0760, 72.8777
        
    cards = await generate_suggestions("demo_trip", lat, lng, free_mins=120)
    
    if cards:
        msg = "Here are some top picks for you:\n\n"
        for category, details in cards.items():
            msg += f"🍽️ **{details.get('name', 'Unknown')}** ({category.title()})\n"
            msg += f"⭐ {details.get('rating', 'N/A')} - {details.get('distance_min', '?')} mins away\n"
            msg += f"💡 _{details.get('why_recommended', '')}_\n\n"
        
        await send_message(chat_id, msg)
    else:
        await send_message(chat_id, "I'm having trouble finding good spots right now. Try sharing your location!")

async def set_user_location(chat_id: int, lat: float, lng: float):
    """Handle explicit gps location share"""
    from services.telegram_client import send_message
    await send_message(chat_id, "📍 Location received! Let me find the best spots around you...")
    
    # Actually trigger the suggestion generation now that we have exact coords
    await run_luma_explicit(chat_id, {"lat": lat, "lng": lng})
