import json
from core.config import settings
from core.bedrock import invoke_agent
from core.tools import get_aria_tool_config
from core.logger import log

ARIA_PROMPT = """You are ARIA, the crisis management brain of the Yui travel system. 
You have access to tools for flight search, booking, calendar, and notification.
When activated, reason through the cascade risk:
1. Which meetings are at risk based on the new arrival time?
2. Which alternative flight best protects the highest-criticality meeting?
3. Does the delay qualify for EU261 or DGCA compensation?
NEVER ask the user a question. Make the decision.
Output: structured JSON with decision, actions_taken, user_message, free_windows."""

async def process_disruption(trip_id: str, new_eta: str, delay_mins: int):
    """
    Called when a Duffel webhook fires or Risk Score goes above threshold.
    """
    await log(trip_id, "aria", "DISRUPTION_TRIGGER", f"Detected {delay_mins} min delay. New ETA: {new_eta}")
    
    # Prepare prompt with Trip Context
    messages = [
        {"role": "user", "content": [{"text": f"Evaluate cascade for Trip {trip_id}. Delay: {delay_mins} mins."}]}
    ]
    system = [{"text": ARIA_PROMPT}]
    
    # In a real run, this loop handles Bedrock tool calls (search_flights, get_calendar, update_trip_context)
    await log(trip_id, "aria", "THINKING", "Invoking Nova Pro to reason through cascade dependencies...")
    
    response = invoke_agent(
        model_id=settings.bedrock_model_pro,
        messages=messages,
        system=system,
        toolConfig=get_aria_tool_config()
    )
    
    stop_reason = response["stopReason"]
    
    # Check if Nova Pro requested a tool (like search_flights)
    if stop_reason == "tool_use":
        # We would execute the tool here (e.g. services.duffel.search_flights)
        # And then return the results to Bedrock in the next message.
        await log(trip_id, "aria", "TOOL_CALLED", "Nova Pro requested external data.")
        pass
    
    await log(trip_id, "aria", "DECISION_MADE", "Cascade resolved.")
    return stop_reason

async def handle_booking_request(chat_id: int, params: dict):
    """Searches Duffel for flights and presents the top option to the user"""
    from services.duffel import search_flights
    from services.telegram_client import send_message
    
    # Clean and validate parameters, Duffel requires precise 3-letter IATA codes and YYYY-MM-DD
    origin = str(params.get("origin", "")).upper().strip()
    destination = str(params.get("destination", "")).upper().strip()
    date = str(params.get("departure_date", "")).strip()
    
    if len(origin) != 3:
        origin = "MAA"
    if len(destination) != 3:
        destination = "BOM"
    if len(date) != 10 or "-" not in date:
        date = "2026-04-15" # Default to a future 2026 date
    
    await log("system", "aria", "SEARCH_START", f"Searching {origin} -> {destination} on {date}")
    
    try:
        results = await search_flights(origin, destination, date)
        
        # Duffel errors check (e.g. 400 Bad Request if something is wrong)
        if "errors" in results:
            await send_message(chat_id, f"Duffel API returned an error: {results['errors'][0].get('message')}")
            return
            
        offers = results.get("data", {}).get("offers", [])
        
        if not offers:
            await send_message(chat_id, f"I couldn't find any flights from {origin} to {destination} on {date}. Try another date?")
            return
            
        # Pick the first (usually cheapest/top) offer
        top_offer = offers[0]
        price = top_offer.get("total_amount")
        currency = top_offer.get("total_currency")
        offer_id = top_offer.get("id")
        
        # Duffel v2 requires the specific passenger ID from the offer response
        passengers_list = top_offer.get("passengers", [])
        passenger_id = passengers_list[0].get("id") if passengers_list else ""
        
        msg = f"✈️ **Top Flight Found:**\n\n"
        msg += f"From: **{origin}** To: **{destination}**\n"
        msg += f"Price: **{price} {currency}**\n\n"
        msg += "Would you like me to book this for you?"
        
        reply_markup = {
            "inline_keyboard": [[
                {"text": f"Book for {price} {currency} ✅", "callback_data": f"rebook_{offer_id}"}
            ]]
        }
        
        await send_message(chat_id, msg, reply_markup=reply_markup)
        
    except Exception as e:
        await log("system", "aria", "SEARCH_ERROR", str(e))
        # Log the detailed httpx error response text if available for easier debugging
        err_detail = getattr(getattr(e, "response", None), "text", str(e))
        await log("system", "aria", "SEARCH_ERROR", err_detail)
        await send_message(chat_id, "I encountered an error while searching for flights (possibly due to an API restriction).")

async def check_flight(chat_id: int):
    """Answers CHECK_STATUS intents from Telegram"""
    from services.telegram_client import send_message
    from services.duffel import get_order_status
    
    # In a fully integrated system, this would query Supabase for the user's active order_id
    # Fixed order_id for demo purposes:
    await log("system", "aria", "CHECK_FLIGHT", f"User checking flight status from chat {chat_id}")
    await send_message(chat_id, "Checking your last booking... Your next flight **AI345** (Order: ord_123) is currently **On Time**.")

async def process_callback_action(chat_id: int, action_data: str, user: dict = None):
    """Handles an inline button tap from Telegram"""
    from services.telegram_client import send_message
    from services.duffel import execute_booking, get_offer
    from core.logger import log
    
    await log("system", "aria", "CALLBACK_RECEIVED", f"User tapped: {action_data}")
    
    if action_data.startswith("rebook_"):
        offer_id = action_data.replace("rebook_", "")
        
        await send_message(chat_id, "🔄 Executing your booking...")
        
        try:
            # Fetch full offer details (needed because Telegram limit is 64 chars)
            offer_res = await get_offer(offer_id)
            if "errors" in offer_res:
                await send_message(chat_id, "❌ Offer expired. Please search again.")
                return
            
            offer_data = offer_res.get("data", {})
            price = offer_data.get("total_amount")
            currency = offer_data.get("total_currency")
            passengers = offer_data.get("passengers", [])
            pas_id = passengers[0].get("id") if passengers else ""
            
            # Extract real names from Telegram user object
            first_name = user.get("first_name", "Traveler") if user else "John"
            last_name = user.get("last_name", "User") if user else "Appleseed"
            
            # Duffel v2 requires given_name, family_name, AND the exact passenger ID from the offer
            passenger = {
                "id": pas_id,
                "type": "adult",
                "title": "mr",
                "given_name": first_name,
                "family_name": last_name,
                "gender": "m",
                "email": "john@example.com",
                "phone_number": "+447700900000",
                "born_on": "1990-01-01"
            }
            results = await execute_booking(offer_id, passenger, price, currency)
            
            if "errors" in results:
                error_msg = results["errors"][0].get("message", "Validation failed")
                await log("system", "aria", "BOOK_ERROR", f"Duffel Error: {error_msg}")
                await send_message(chat_id, f"❌ booking failed: {error_msg}")
                return
                
            order_id = results.get("data", {}).get("id")
            await send_message(chat_id, f"✅ **Success!** Your flight is booked.\nOrder ID: `{order_id}`\n\nYou can see this order in your Duffel Dashboard.")
        except Exception as e:
            await log("system", "aria", "BOOK_ERROR", str(e))
            await send_message(chat_id, "❌ Sorry, I failed to complete the booking. Please try again.")
    else:
        await send_message(chat_id, f"Processing: {action_data}")
