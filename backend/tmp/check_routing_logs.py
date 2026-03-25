import os
import sys
# Add project root to path
sys.path.append('c:/Users/HARIHARAN/Desktop/IdeaVerse/Yui/backend')
from core.supabase import supabase
import json

try:
    res = supabase.table("agent_logs") \
        .select("*") \
        .eq("action", "ROUTING_FAILED") \
        .order("created_at", desc=True) \
        .limit(10) \
        .execute()
    print(f"✅ Routing Failed Logs: {json.dumps(res.data, indent=2)}")
except Exception as e:
    print(f"❌ Error checking logs: {e}")
