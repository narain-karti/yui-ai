import os
import sys
# Add project root to path
sys.path.append('c:/Users/HARIHARAN/Desktop/IdeaVerse/Yui/backend')
from core.supabase import supabase
import json

try:
    # Check 'agent_logs' structure
    res = supabase.table("agent_logs").select("*").limit(1).execute()
    if res.data:
        print(f"✅ agent_logs Sample: {json.dumps(res.data[0], indent=2)}")
    else:
        print("✅ agent_logs is empty.")
except Exception as e:
    print(f"❌ Error checking 'agent_logs': {e}")
