import os
import sys
# Add project root to path
sys.path.append('c:/Users/HARIHARAN/Desktop/IdeaVerse/Yui/backend')
from core.supabase import supabase

try:
    # Try to select from a 'bookings' table
    res = supabase.table("bookings").select("*").limit(1).execute()
    print("✅ Table 'bookings' exists.")
except Exception as e:
    print(f"❌ Error or table DOES NOT exist: {e}")

try:
    # Check 'agent_logs' just to verify connection
    res = supabase.table("agent_logs").select("*").limit(1).execute()
    print("✅ Table 'agent_logs' exists.")
except Exception as e:
    print(f"❌ Error checking 'agent_logs': {e}")
