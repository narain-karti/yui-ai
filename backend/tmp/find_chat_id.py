import os
import sys
# Add project root to path
sys.path.append('c:/Users/HARIHARAN/Desktop/IdeaVerse/Yui/backend')
from core.supabase import supabase
import json

try:
    # Get all logs and look for anything that looks like a chat_id (bigint)
    res = supabase.table("agent_logs") \
        .select("*") \
        .order("created_at", desc=True) \
        .limit(100) \
        .execute()
    
    potential_chat_ids = set()
    for log in res.data:
        detail = log["detail"]
        import re
        ids = re.findall(r'\b\d{9,12}\b', detail)
        for id_str in ids:
            potential_chat_ids.add(id_str)
            
    print(f"✅ Potential Chat IDs found in logs: {list(potential_chat_ids)}")
except Exception as e:
    print(f"❌ Error searching for IDs: {e}")
