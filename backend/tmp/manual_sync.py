import os
import sys
# Add project root to path
sys.path.append('c:/Users/HARIHARAN/Desktop/IdeaVerse/Yui/backend')
from core.supabase import supabase

try:
    chat_id = 6227536917
    order_id = "ord_0000B4aT3x1BCi6A0F3Q12"
    
    booking = {
        "order_id": order_id,
        "chat_id": chat_id,
        "origin": "LHR",
        "destination": "JFK",
        "departure_date": "2026-04-28",
        "status": "confirmed"
    }
    
    # Upsert to avoid duplicates
    supabase.table("user_bookings").upsert(booking, on_conflict="order_id").execute()
    print(f"✅ Successfully synced booking {order_id} for user {chat_id}")
except Exception as e:
    print(f"❌ Error syncing booking: {e}")
