from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.telegram_webhook import router as telegram_router
from api.duffel_webhook import router as duffel_router
from api.routes import router as frontend_router
from core.scheduler import start_scheduler
from core.config import settings

app = FastAPI(title="Yui AI API", version="2.0")

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.render_external_url, "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(telegram_router)
app.include_router(duffel_router)
app.include_router(frontend_router)

@app.on_event("startup")
async def startup_event():
    # Start the background APScheduler
    start_scheduler()
    print("Yui AI FastAPI server started")

if __name__ == "__main__":
    import uvicorn
    # Local dev
    uvicorn.run(app, host="0.0.0.0", port=8000)
