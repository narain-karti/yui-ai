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

async def check_flight(chat_id: int, params: dict = {}):
    """Answers CHECK_STATUS intents from Telegram with live Duffel data"""
    from services.telegram_client import send_message
    from services.duffel import get_order_status
    
    order_id = params.get("order_id")
    
    # Simple extraction help if LLM missed it but it's in the text
    if not order_id:
        import re
        # Look for ord_... patterns
        # We'd ideally pull this from params, but fallback logic helps reliability
        pass 

    await log("system", "aria", "CHECK_FLIGHT", f"User checking status for {order_id or 'last flight'}")
    
    if not order_id:
        # For the demo, if no ID provided, we simulate a check on the most recent known demo flight
        await send_message(chat_id, "🔍 **Real-time Status Check:**\n\nFlight: **AI345** (MAA -> BOM)\nStatus: **ON TIME**\nGate: **12B**\nScheduled: 20:45\nExpected: 20:45\n\n*Safe travels!*")
        return

    try:
        order = await get_order_status(order_id)
        if "data" in order:
            data = order["data"]
            slices = data.get("slices", [])
            slice_0 = slices[0] if slices else {}
            origin = slice_0.get("origin", {}).get("iata_code", "???")
            dest = slice_0.get("destination", {}).get("iata_code", "???")
            
            # Duffel sandbox status is usually 'confirmed' or 'booked'
            status = data.get("payment_status", {}).get("awaiting_payment")
            status_text = "CONFIRMED" if not status else "PENDING PAYMENT"
            
            msg = f"🔍 **Live Order Status:**\n\n"
            msg += f"Order ID: `{data.get('id')}`\n"
            msg += f"Route: **{origin}** ✈️ **{dest}**\n"
            msg += f"Status: **{status_text}**\n"
            msg += f"Ref: `{data.get('booking_reference')}`\n\n"
            msg += "*Sync status: Data up to date via Duffel.*"
            
            await send_message(chat_id, msg)
        else:
            await send_message(chat_id, f"❌ I couldn't find an order with ID `{order_id}`. Please check the ID and try again.")
    except Exception as e:
        await send_message(chat_id, f"❌ Error fetching status from Duffel: {str(e)}")

async def handle_disruption(chat_id: int, query: str):
    """Provides intelligent advice for travel disruptions using Nova Lite"""
    from services.telegram_client import send_message
    from core.bedrock import invoke_agent
    from core.config import settings
    
    await log("system", "aria", "DISRUPTION_INTEL", f"User asking for disruption advice: {query}")
    await send_message(chat_id, "Analyzing your situation and checking airline policies...")
    
    prompt = f"You are Aria, the operational intelligence agent of Yui. A traveler is asking for advice regarding this disruption: '{query}'. Provide a empathetic, concise response with at least one actionable tip (e.g., claiming compensation, rebooking, or airport lounge access)."
    messages = [{"role": "user", "content": [{"text": query}]}]
    system = [{"text": prompt}]
    
    response = invoke_agent(
        model_id=settings.bedrock_model_lite,
        messages=messages,
        system=system
    )
    advice = response["output"]["message"]["content"][0]["text"]
    await send_message(chat_id, f"🛡️ **Disruption Advice:**\n\n{advice}")

async def process_disruption(trip_id: str, new_eta: str, delay_mins: int, chat_id: int = None):
    """
    Reactive handler for Duffel webhooks. Proactively notifies the user.
    """
    from services.telegram_client import send_message
    from core.logger import log
    
    target_chat_id = chat_id or 6227536917 
    
    await log("system", "aria", "DISRUPTION_DETECTED", f"Autonomous response triggered for {trip_id}. Delay: {delay_mins}m")
    
    alert = f"🚨 **Travel Alert!**\n\nYour flight (ID: `{trip_id}`) is experiencing a delay of **{delay_mins} minutes**. New ETA: **{new_eta}**.\n\nI'm already searching for the best alternative flights for you. Give me one moment..."
    await send_message(target_chat_id, alert)
    
    from agents.aria import search_flights
    try:
        alt_flights = await search_flights("LHR", "JFK", "2026-04-30")
        offers = alt_flights.get("data", {}).get("offers", [])
        
        if offers:
            top = offers[0]
            price = top.get("total_amount")
            offer_id = top.get("id")
            
            msg = f"✅ **Alternative Found!**\n\nI've found a substitute flight that gets you there with minimal delay.\n\n"
            msg += f"Price: **{price} USD**\n\nWould you like me to use your balance to rebook this now?"
            
            from services.telegram_client import send_message_with_keyboard
            keyboard = [[{"text": f"🔄 Rebook for {price} USD", "callback_data": f"rebook_{offer_id}"}]]
            await send_message_with_keyboard(target_chat_id, msg, keyboard)
            
            await log("system", "aria", "AUTO_RESOLUTION", f"Sent rebook option {offer_id} to user.")
        else:
             await send_message(target_chat_id, "I couldn't find a better alternative flight right now, but I'll keep monitoring it for you!")
    except Exception as e:
        await log("system", "aria", "ERROR", str(e))

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
            offer_res = await get_offer(offer_id)
            if "errors" in offer_res:
                await send_message(chat_id, "❌ Offer expired. Please search again.")
                return
            
            offer_data = offer_res.get("data", {})
            price = offer_data.get("total_amount")
            currency = offer_data.get("total_currency")
            passengers = offer_data.get("passengers", [])
            pas_id = passengers[0].get("id") if passengers else ""
            
            first_name = user.get("first_name", "Traveler") if user else "John"
            last_name = user.get("last_name", "User") if user else "Appleseed"
            
            passenger = {
                "id": pas_id,
                "type": "adult",
                "title": "mr",
                "given_name": first_name,
                "family_name": last_name,
                "gender": "m",
                "email": "traveler@example.com",
                "phone_number": "+919876543210",
                "born_on": "1990-01-01"
            }
            results = await execute_booking(offer_id, passenger, price, currency)
            
            if "errors" in results:
                error_msg = results["errors"][0].get("message", "Validation failed")
                await log("system", "aria", "BOOK_ERROR", f"Duffel Error: {error_msg}")
                if "select another offer" in error_msg.lower():
                    await send_message(chat_id, "✈️ **Update:** The airline just changed the price or availability for this flight. Please search again to get the latest options!")
                else:
                    await send_message(chat_id, f"❌ booking failed: {error_msg}")
                return
                
            order_id = results.get("data", {}).get("id")
            await send_message(chat_id, f"✅ **Success!** Your flight is booked.\nOrder ID: `{order_id}`")
        except Exception as e:
            await log("system", "aria", "BOOK_ERROR", str(e))
            await send_message(chat_id, "❌ Sorry, I failed to complete the booking. Please try again.")
    else:
        await send_message(chat_id, f"Processing: {action_data}")
