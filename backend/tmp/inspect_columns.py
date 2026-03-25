import asyncio
import os
import sys
# Add project root to path
sys.path.append('c:/Users/HARIHARAN/Desktop/IdeaVerse/Yui/backend')
from core.supabase import supabase

async def inspect_columns():
    print("Inspecting columns of 'user_bookings'...")
    try:
        # We can't easily use information_schema via the client without RPC,
        # but we can try to select one row and check the keys.
        # Since it's empty, we can try to insert a dummy row and then delete it,
        # or just try to select each column individually to see which one fails.
        columns = ["order_id", "chat_id", "origin", "destination", "departure_date", "status", "created_at"]
        for col in columns:
            try:
                res = supabase.table("user_bookings").select(col).limit(0).execute()
                print(f"✅ Column '{col}' exists.")
            except Exception as e:
                print(f"❌ Column '{col}' check failed: {e}")
    except Exception as e:
        print(f"❌ Inspection failed: {e}")

if __name__ == "__main__":
    asyncio.run(inspect_columns())
