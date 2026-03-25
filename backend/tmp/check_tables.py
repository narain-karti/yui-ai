import os
import sys
# Add project root to path
sys.path.append('c:/Users/HARIHARAN/Desktop/IdeaVerse/Yui/backend')
from core.supabase import supabase

print("Checking 'user_bookings'...")
try:
    res = supabase.table("user_bookings").select("*").limit(1).execute()
    print("✅ Table 'user_bookings' exists.")
except Exception as e:
    print(f"❌ Error checking 'user_bookings': {e}")

print("Checking 'bookings'...")
try:
    res = supabase.table("bookings").select("*").limit(1).execute()
    print("✅ Table 'bookings' exists.")
except Exception as e:
    print(f"❌ Error checking 'bookings': {e}")
