import os
import sys
# Add project root to path
sys.path.append('c:/Users/HARIHARAN/Desktop/IdeaVerse/Yui/backend')
from core.supabase import supabase
import json

try:
    # Search for the user's order ID in logs
    res = supabase.table("agent_logs") \
        .select("*") \
        .ilike("detail", "%ord_0000B4aT3x1BCi6A0F3Q12%") \
        .execute()
    print(f"✅ Filtered Logs: {json.dumps(res.data, indent=2)}")
except Exception as e:
    print(f"❌ Error filtering logs: {e}")
