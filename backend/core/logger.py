from core.supabase import supabase
from datetime import datetime

async def log(trip_id: str, agent: str, action: str, detail: str):
    """
    Inserts one row to agent_logs in Supabase.
    Supabase Realtime picks it up and streams directly to the dashboard.
    """
    try:
        # Also print to terminal for immediate visibility during development
        print(f"[{agent.upper()}] {action}: {detail}")
        
        data = {
            "trip_id": trip_id,
            "agent": agent,
            "action": action,
            "detail": detail,
            "created_at": datetime.utcnow().isoformat()
        }
        supabase.table("agent_logs").insert(data).execute()
    except Exception as e:
        print(f"Error logging to Supabase: {e}")
