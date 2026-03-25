import os
import sys
# Add project root to path
sys.path.append('c:/Users/HARIHARAN/Desktop/IdeaVerse/Yui/backend')
from core.supabase import supabase
import json

try:
    res = supabase.table("user_bookings").select("*").execute()
    print(f"✅ user_bookings Data: {json.dumps(res.data, indent=2)}")
except Exception as e:
    print(f"❌ Error checking 'user_bookings': {e}")
