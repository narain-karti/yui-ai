import os
import sys
# Add project root to path
sys.path.append('c:/Users/HARIHARAN/Desktop/IdeaVerse/Yui/backend')
from core.supabase import supabase
import json

try:
    res = supabase.table("agent_logs") \
        .select("*") \
        .order("created_at", desc=True) \
        .limit(50) \
        .execute()
    print(f"✅ Recent agent_logs: {json.dumps(res.data, indent=2)}")
except Exception as e:
    print(f"❌ Error checking logs: {e}")
