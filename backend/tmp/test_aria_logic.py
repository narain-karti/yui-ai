import asyncio
import os
import sys
# Add project root to path
sys.path.append('c:/Users/HARIHARAN/Desktop/IdeaVerse/Yui/backend')

from agents.aria import check_flight
from core.supabase import supabase
import traceback

async def test_status_check_no_bookings():
    print("Testing status check for user with NO bookings...")
    # Use a random chat_id that likely has no bookings
    TEST_CHAT_ID = 999999999
    try:
        await check_flight(TEST_CHAT_ID, {})
    except Exception as e:
        print(f"Caught exception: {e}")
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_status_check_no_bookings())
