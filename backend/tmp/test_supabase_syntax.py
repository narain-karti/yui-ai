import asyncio
import os
import sys
# Add project root to path
sys.path.append('c:/Users/HARIHARAN/Desktop/IdeaVerse/Yui/backend')
from core.supabase import supabase

async def test_simple_query():
    print("Testing simple select...")
    try:
        res = supabase.table("user_bookings").select("*").execute()
        print(f"✅ Simple select success. Data: {res.data}")
    except Exception as e:
        print(f"❌ Simple select error: {e}")

    print("Testing select with order...")
    try:
        # Try both common order styles
        try:
            res = supabase.table("user_bookings").select("*").order("created_at", desc=True).execute()
            print("✅ Order(desc=True) success.")
        except Exception as e1:
            print(f"❌ Order(desc=True) failed: {e1}")
            res = supabase.table("user_bookings").select("*").order("created_at", ascending=False).execute()
            print("✅ Order(ascending=False) success.")
    except Exception as e:
        print(f"❌ Both order styles failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_simple_query())
