import os
import sys
# Add project root to path
sys.path.append('c:/Users/HARIHARAN/Desktop/IdeaVerse/Yui/backend')
from core.supabase import supabase
import json

try:
    # Check for any logs from the duffel webhook or disruption handler
    res = supabase.table("agent_logs") \
        .select("*") \
        .or_("action.eq.DISRUPTION_DETECTED,action.eq.ROUTING_FAILED,action.eq.DB_ERROR") \
        .order("created_at", desc=True) \
        .limit(20) \
        .execute()
    print(f"✅ Webhook/Disruption Logs: {json.dumps(res.data, indent=2)}")
except Exception as e:
    print(f"❌ Error checking logs: {e}")
