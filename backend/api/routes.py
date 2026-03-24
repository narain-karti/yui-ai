from fastapi import APIRouter
from core.supabase import supabase
from agents.aria import process_disruption

router = APIRouter(tags=["Frontend API"])

@router.post("/api/demo/{scenario}")
async def trigger_demo(scenario: str):
    """
    Trigger a simulated disruption from the web dashboard demo buttons.
    Usually we'd lookup trip from user, but we'll mock 'trip_123'
    """
    if scenario == "severe_delay":
        await process_disruption("trip_123", new_eta="14:00", delay_mins=180)
        return {"status": "triggered_aria"}
        
    return {"status": "unknown_scenario"}

@router.get("/api/health")
async def health_check():
    """Simple health check for UptimeRobot"""
    return {"status": "healthy"}
