import asyncio
import os
import sys
# Add project root to path
sys.path.append('c:/Users/HARIHARAN/Desktop/IdeaVerse/Yui/backend')
from agents.aria import check_flight

async def test_status_after_sync():
    chat_id = 6227536917
    print(f"Testing status check for chat_id={chat_id} after manual sync...")
    try:
        # This should now fetch the real order from Duffel
        await check_flight(chat_id, {})
    except Exception as e:
        print(f"❌ Test failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_status_after_sync())
