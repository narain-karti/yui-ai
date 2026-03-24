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

async def process_callback_action(chat_id: int, action_data: str):
    """Handles an inline button tap from Telegram"""
    # e.g., if action_data is "REBOOK_AI345", call duffel logic to execute the booking
    pass
