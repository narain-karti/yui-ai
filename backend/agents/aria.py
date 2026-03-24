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
    
    origin = params.get("origin", "LHR") # Default to London for demo if not parsed
    destination = params.get("destination", "DXB") # Default to Dubai
    date = params.get("date", "2025-06-15") # Default date
    
    await log("system", "aria", "SEARCH_START", f"Searching {origin} -> {destination} on {date}")
    
    try:
        results = await search_flights(origin, destination, date)
        offers = results.get("data", {}).get("offers", [])
        
        if not offers:
            await send_message(chat_id, f"I couldn't find any flights from {origin} to {destination} on {date}. Try another date?")
            return
            
        # Pick the first (usually cheapest/top) offer
        top_offer = offers[0]
        price = top_offer.get("total_amount")
        currency = top_offer.get("total_currency")
        offer_id = top_offer.get("id")
        
        msg = f"✈️ **Top Flight Found:**\n\n"
        msg += f"From: **{origin}** To: **{destination}**\n"
        msg += f"Price: **{price} {currency}**\n\n"
        msg += "Would you like me to book this for you in the sandbox?"
        
        reply_markup = {
            "inline_keyboard": [[
                {"text": f"Book for {price} {currency} ✅", "callback_data": f"rebook_{offer_id}"}
            ]]
        }
        
        await send_message(chat_id, msg, reply_markup=reply_markup)
        
    except Exception as e:
        await log("system", "aria", "SEARCH_ERROR", str(e))
        await send_message(chat_id, "I encountered an error while searching for flights. Please try again later.")

async def check_flight(chat_id: int):
    """Answers CHECK_STATUS intents from Telegram"""
    from services.telegram_client import send_message
    from services.duffel import get_order_status
    
    # In a fully integrated system, this would query Supabase for the user's active order_id
    # Fixed order_id for demo purposes:
    await log("system", "aria", "CHECK_FLIGHT", f"User checking flight status from chat {chat_id}")
    await send_message(chat_id, "Checking your last booking... Your next flight **AI345** (Order: ord_123) is currently **On Time**.")

async def process_callback_action(chat_id: int, action_data: str):
    """Handles an inline button tap from Telegram"""
    from services.telegram_client import send_message
    from services.duffel import execute_booking
    from core.logger import log
    
    await log("system", "aria", "CALLBACK_RECEIVED", f"User tapped: {action_data}")
    
    if action_data.startswith("rebook_"):
        offer_id = action_data.replace("rebook_", "")
        await send_message(chat_id, "🔄 Executing your sandbox booking...")
        
        try:
            # Mock passenger for sandbox
            passenger = {
                "type": "adult",
                "title": "mr",
                "first_name": "John",
                "last_name": "Appleseed",
                "gender": "m",
                "email": "john@example.com",
                "phone_number": "+447700900000",
                "born_on": "1990-01-01"
            }
            order = await execute_booking(offer_id, passenger)
            order_id = order.get("data", {}).get("id")
            
            await send_message(chat_id, f"✅ **Success!** Your flight is booked.\nOrder ID: `{order_id}`\n\nYou can see this order in your Duffel Sandbox Dashboard.")
        except Exception as e:
            await log("system", "aria", "BOOK_ERROR", str(e))
            await send_message(chat_id, "❌ Sorry, I failed to complete the booking. It might be an expired offer.")
    else:
        await send_message(chat_id, f"Processing: {action_data}")
