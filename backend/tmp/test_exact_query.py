import asyncio
import os
import sys
# Add project root to path
sys.path.append('c:/Users/HARIHARAN/Desktop/IdeaVerse/Yui/backend')
from core.supabase import supabase

async def test_exact_query():
    chat_id = 999999999
    print(f"Testing exact query for chat_id={chat_id}...")
    try:
        res = supabase.table("user_bookings") \
            .select("order_id") \
            .eq("chat_id", chat_id) \
            .order("created_at", desc=True) \
            .limit(1) \
            .execute()
        print(f"✅ Exact query success. Data: {res.data}")
    except Exception as e:
        print(f"❌ Exact query failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_exact_query())
