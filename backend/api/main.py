from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List
import uvicorn
from services.ai_itinerary_service import router as itinerary_router
from services.satellite_service import CopernicusService, WeatherService
from ml.trip_recommender import app as ml_app

app = FastAPI(title="EcoTrip Intelligence API", version="2.0.0")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(itinerary_router)
# Mount ML app as a sub-application
app.mount("/ml", ml_app)

@app.get("/health")
async def health_check():
    return {
        "status": "online",
        "environment": "production",
        "services": {
            "api": "healthy",
            "ml_engine": "healthy",
            "satellite_gateway": "ready"
        }
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
