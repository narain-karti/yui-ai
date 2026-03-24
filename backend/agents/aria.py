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

async def check_flight(chat_id: int):
    """Answers CHECK_STATUS intents from Telegram"""
    from services.telegram_client import send_message
    
    # In a fully integrated system, this would query Supabase for the user's active trip
    # and call Duffel to check live status. For the demo, we mock the retrieval.
    await log("system", "aria", "CHECK_FLIGHT", f"User checking flight status from chat {chat_id}")
    await send_message(chat_id, "Your next flight **AI345** from Paris to Dubai is on-time. Departure is at 10:00 AM.")

async def process_callback_action(chat_id: int, action_data: str):
    """Handles an inline button tap from Telegram"""
    from services.telegram_client import send_message
    from core.logger import log
    
    await log("system", "aria", "CALLBACK_RECEIVED", f"User tapped: {action_data}")
    
    if action_data.startswith("rebook_"):
        await send_message(chat_id, "✅ I have initiated the rebooking process. I will send you the new itinerary shortly.")
    else:
        await send_message(chat_id, f"Processing your request: {action_data}")
