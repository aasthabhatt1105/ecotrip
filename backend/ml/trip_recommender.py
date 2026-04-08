from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Optional
import numpy as np
from sklearn.ensemble import RandomForestRegressor
import joblib

app = FastAPI(title="EcoTrip ML API")

class TripPreferences(BaseModel):
    origin: str
    destination: str
    budget: float
    duration_days: int
    traveler_count: int
    eco_priority: float  # 0-1 scale
    activity_types: List[str]  # ['hiking', 'cycling', 'wildlife', 'cultural']

class EcoRecommendation(BaseModel):
    route_id: str
    transport_mode: str
    carbon_footprint: float
    eco_score: float
    estimated_cost: float
    activities: List[dict]
    sustainability_badges: List[str]

class TripRecommender:
    def __init__(self):
        self.model = RandomForestRegressor()
        self.transport_modes = ['electric_bus', 'train', 'bicycle', 'walking', 'hybrid_car']
        
    def calculate_carbon_score(self, distance: float, transport: str) -> float:
        """Calculate carbon footprint in kg CO2"""
        emission_factors = {
            'electric_bus': 0.02,
            'train': 0.03,
            'bicycle': 0,
            'walking': 0,
            'hybrid_car': 0.12,
            'flight': 0.25
        }
        return distance * emission_factors.get(transport, 0.1)
    
    def recommend(self, preferences: TripPreferences) -> List[EcoRecommendation]:
        """AI-powered eco-friendly trip recommendations"""
        
        # Mock distance calculation (replace with real API)
        distance = np.random.uniform(50, 500)  # km
        
        recommendations = []
        
        for transport in self.transport_modes[:4]:  # Exclude high-carbon options
            carbon = self.calculate_carbon_score(distance, transport)
            
            # Calculate eco score (0-100)
            eco_score = max(0, 100 - (carbon * 10))
            if transport in ['bicycle', 'walking']:
                eco_score = 100
            elif transport == 'electric_bus':
                eco_score = 95
            
            # Adjust for user preference
            if preferences.eco_priority > 0.7:
                eco_score = min(100, eco_score * 1.2)
            
            rec = EcoRecommendation(
                route_id=f"ECO_{transport.upper()}_{hash(preferences.destination)}",
                transport_mode=transport,
                carbon_footprint=round(carbon, 2),
                eco_score=round(eco_score, 1),
                estimated_cost=round(self._estimate_cost(distance, transport, preferences), 2),
                activities=self._suggest_activities(preferences),
                sustainability_badges=self._get_badges(transport, eco_score)
            )
            recommendations.append(rec)
        
        # Sort by eco score descending
        return sorted(recommendations, key=lambda x: x.eco_score, reverse=True)
    
    def _estimate_cost(self, distance: float, transport: str, prefs: TripPreferences) -> float:
        base_costs = {
            'electric_bus': 0.1 * distance,
            'train': 0.15 * distance,
            'bicycle': 0,
            'walking': 0,
            'hybrid_car': 0.3 * distance
        }
        return base_costs.get(transport, 50) * prefs.traveler_count
    
    def _suggest_activities(self, prefs: TripPreferences) -> List[dict]:
        eco_activities = {
            'hiking': {'name': 'Guided Nature Hike', 'eco_impact': 'positive', 'cost': 25},
            'cycling': {'name': 'Bike Tour', 'eco_impact': 'positive', 'cost': 30},
            'wildlife': {'name': 'Wildlife Conservation Visit', 'eco_impact': 'positive', 'cost': 40},
            'cultural': {'name': 'Local Community Experience', 'eco_impact': 'neutral', 'cost': 20}
        }
        return [eco_activities.get(act, {}) for act in prefs.activity_types if act in eco_activities]
    
    def _get_badges(self, transport: str, score: float) -> List[str]:
        badges = []
        if transport in ['bicycle', 'walking']:
            badges.extend(['Zero Emission', 'Fitness Boost'])
        if score > 90:
            badges.append('Eco Warrior')
        if score > 80:
            badges.append('Green Choice')
        return badges

recommender = TripRecommender()

@app.post("/api/recommend", response_model=List[EcoRecommendation])
async def get_recommendations(preferences: TripPreferences):
    try:
        return recommender.recommend(preferences)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "EcoTrip ML API"}
