import asyncio
import os
import sys
# Add project root to path
sys.path.append('c:/Users/HARIHARAN/Desktop/IdeaVerse/Yui/backend')
from core.supabase import supabase

async def test_order_select_theory():
    print("Testing select(order_id).order(created_at)...")
    try:
        res = supabase.table("user_bookings").select("order_id").order("created_at", desc=True).limit(1).execute()
        print("✅ select(order_id).order(created_at) success.")
    except Exception as e:
        print(f"❌ select(order_id).order(created_at) failed: {e}")

    print("Testing select(order_id, created_at).order(created_at)...")
    try:
        res = supabase.table("user_bookings").select("order_id, created_at").order("created_at", desc=True).limit(1).execute()
        print("✅ select(order_id, created_at).order(created_at) success.")
    except Exception as e:
        print(f"❌ select(order_id, created_at).order(created_at) failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_order_select_theory())
