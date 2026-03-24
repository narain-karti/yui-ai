from apscheduler.schedulers.asyncio import AsyncIOScheduler
# from agents.luma import luma_cron_job
# from agents.aria import aria_watchdog_job
# from core.supabase import supabase

scheduler = AsyncIOScheduler()

# We will attach jobs after defining the agents to avoid circular imports.
# Example: 
# scheduler.add_job(luma_cron_job, "interval", minutes=15)
# scheduler.add_job(aria_watchdog_job, "interval", minutes=15)

def start_scheduler():
    scheduler.start()
    print("APScheduler started")
