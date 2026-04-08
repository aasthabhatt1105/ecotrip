from openai import AsyncOpenAI
from typing import List, Dict, Optional
from datetime import datetime, timedelta
import json
from dataclasses import asdict
from .satellite_service import SatelliteData, WeatherForecast

class AIItineraryService:
    """GPT-4 powered itinerary generation with satellite data"""
    
    def __init__(self, openai_api_key: str, copernicus_service, weather_service):
        self.client = AsyncOpenAI(api_key=openai_api_key)
        self.copernicus = copernicus_service
        self.weather = weather_service
        
    async def generate_itinerary(
        self,
        destination: str,
        origin: str,
        start_date: datetime,
        duration_days: int,
        travelers: int,
        budget: str,  # 'budget', 'moderate', 'luxury'
        interests: List[str],
        eco_priority: float,  # 0-1
        mobility_constraints: List[str] = None
    ) -> Dict:
        """
        Generate comprehensive eco-friendly itinerary using:
        - Satellite environmental data
        - Weather predictions
        - AI optimization
        """
        
        # Get coordinates (simplified - use geocoding API in production)
        coords = await self._get_coordinates(destination)
        
        # Fetch environmental data
        satellite_data = await self.copernicus.get_satellite_assessment(
            coords["lat"], coords["lon"]
        )
        weather_forecast = await self.weather.get_forecast(
            coords["lat"], coords["lon"], duration_days
        )
        
        # Calculate optimal days based on weather
        optimal_days = self._find_optimal_days(weather_forecast, duration_days)
        
        # Build AI prompt with all data
        prompt = self._build_itinerary_prompt(
            destination=destination,
            origin=origin,
            start_date=start_date,
            duration_days=duration_days,
            travelers=travelers,
            budget=budget,
            interests=interests,
            eco_priority=eco_priority,
            satellite_data=satellite_data,
            weather_forecast=weather_forecast,
            optimal_days=optimal_days,
            mobility_constraints=mobility_constraints or []
        )
        
        # Generate with GPT-4
        response = await self.client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[
                {
                    "role": "system",
                    "content": """You are EcoTrip AI, an expert sustainable travel planner. 
                    Create detailed, eco-friendly itineraries using satellite data and weather forecasts.
                    Focus on low-carbon transport, local experiences, and environmental conservation.
                    Return JSON format only."""
                },
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.7
        )
        
        itinerary = json.loads(response.choices[0].message.content)
        
        # Enrich with real-time data
        enriched_itinerary = await self._enrich_itinerary(
            itinerary, 
            satellite_data, 
            weather_forecast,
            optimal_days
        )
        
        return enriched_itinerary
    
    def _build_itinerary_prompt(
        self,
        destination: str,
        origin: str,
        start_date: datetime,
        duration_days: int,
        travelers: int,
        budget: str,
        interests: List[str],
        eco_priority: float,
        satellite_data: SatelliteData,
        weather_forecast: List[WeatherForecast],
        optimal_days: List[int],
        mobility_constraints: List[str]
    ) -> str:
        
        weather_summary = "\n".join([
            f"Day {i+1} ({f.date.strftime('%Y-%m-%d')}): {f.condition}, "
            f"Temp: {f.temp_min:.0f}-{f.temp_max:.0f}°C, "
            f"Rain: {f.precipitation:.1f}mm, Travel Score: {self.weather.calculate_travel_score(f):.0f}/100"
            for i, f in enumerate(weather_forecast)
        ])
        
        return f"""
Create a sustainable travel itinerary with the following parameters:

DESTINATION: {destination}
ORIGIN: {origin}
DATES: {start_date.strftime('%Y-%m-%d')} to {(start_date + timedelta(days=duration_days-1)).strftime('%Y-%m-%d')}
DURATION: {duration_days} days
TRAVELERS: {travelers}
BUDGET LEVEL: {budget}
INTERESTS: {', '.join(interests)}
ECO-PRIORITY: {eco_priority:.0%} (0=comfort focused, 1=maximum sustainability)
MOBILITY CONSTRAINTS: {', '.join(mobility_constraints) if mobility_constraints else 'None'}

SATELLITE ENVIRONMENTAL DATA:
- Vegetation Health (NDVI): {satellite_data.ndvi:.2f}/1.0 {'✓ Healthy' if satellite_data.ndvi > 0.5 else '⚠ Check conditions'}
- Land Surface Temp: {satellite_data.land_surface_temp:.1f}°C
- Air Quality Index: {satellite_data.air_quality_index}/500 {'✓ Good' if satellite_data.air_quality_index < 50 else '⚠ Moderate'}
- Water Quality: {satellite_data.water_quality_score:.0f}/100
- Deforestation Risk: {satellite_data.deforestation_risk:.0%}

WEATHER FORECAST:
{weather_summary}

OPTIMAL TRAVEL DAYS: Days {', '.join(map(str, [d+1 for d in optimal_days]))} (best weather)

REQUIREMENTS:
1. Suggest LOW-CARBON transport (train, bus, cycling, walking)
2. Include eco-certified accommodations
3. Plan activities matching satellite data (e.g., avoid outdoor if poor air quality)
4. Suggest local, sustainable dining
5. Include carbon offset recommendations
6. Provide daily eco-tips based on real conditions

Return JSON with this structure:
{{
    "summary": {{
        "total_carbon_footprint": "kg CO2",
        "carbon_saved_vs_conventional": "kg CO2",
        "eco_score": 0-100,
        "best_travel_days": [1, 3, 5],
        "weather_warnings": ["Day 2: Heavy rain expected"]
    }},
    "transport": {{
        "to_destination": {{ "mode": "train", "carbon": 45, "duration": "4h", "cost": "€50" }},
        "local_transport": "Public transit + bike rental"
    }},
    "accommodation": {{
        "name": "Eco Lodge Name",
        "certification": "Green Key Gold",
        "eco_features": ["Solar power", "Rainwater harvesting"]
    }},
    "daily_plan": [
        {{
            "day": 1,
            "date": "2024-06-01",
            "weather": "Partly cloudy, 22°C",
            "transport_score": 85,
            "activities": [
                {{
                    "time": "09:00",
                    "activity": "Guided nature walk",
                    "location": "National Park",
                    "carbon_impact": "0 kg",
                    "eco_tip": "Bring reusable water bottle - refill stations available",
                    "satellite_note": "High vegetation health - excellent for hiking"
                }}
            ],
            "meals": [
                {{"type": "Lunch", "place": "Farm-to-table restaurant", "diet": "Plant-based options"}}
            ],
            "carbon_total": "2.5 kg"
        }}
    ],
    "sustainability_features": [
        "Trip supports local conservation project X",
        "Accommodation uses 100% renewable energy"
    ],
    "packing_list": ["Reusable utensils", "Solar charger", "Quick-dry towel"],
    "emergency_contacts": {{"local_ranger": "+1234567890"}}
}}
"""
    
    async def _enrich_itinerary(
        self,
        itinerary: Dict,
        satellite_data: SatelliteData,
        weather_forecast: List[WeatherForecast],
        optimal_days: List[int]
    ) -> Dict:
        """Add real-time data enrichment"""
        
        # Add satellite-based recommendations
        if satellite_data.ndvi < 0.3:
            itinerary["environmental_notes"] = [
                "⚠️ Low vegetation detected - consider indoor activities",
                "💧 Water conservation important in this area"
            ]
        
        if satellite_data.air_quality_index > 100:
            itinerary["health_advisory"] = "Poor air quality predicted - sensitive travelers should limit outdoor activities"
        
        # Add real booking links (mock)
        for day in itinerary.get("daily_plan", []):
            day["booking_links"] = await self._generate_booking_links(day["activities"])
        
        # Calculate accurate carbon budget
        itinerary["summary"]["carbon_budget_tracking"] = {
            "daily_allowance": 10,  # kg CO2 per day target
            "total_budget": 10 * len(itinerary["daily_plan"]),
            "projected_usage": sum([
                float(day["carbon_total"].replace(" kg", "")) 
                for day in itinerary["daily_plan"]
            ])
        }
        
        return itinerary
    
    async def _generate_booking_links(self, activities: List[Dict]) -> Dict:
        """Generate affiliate/booking links for activities"""
        links = {}
        for activity in activities:
            # In production, integrate with booking APIs
            links[activity["activity"]] = f"https://ecotrip.booking.com/{activity['location']}"
        return links
    
    def _find_optimal_days(self, forecasts: List[WeatherForecast], duration: int) -> List[int]:
        """Find days with best travel conditions"""
        scored_days = [
            (i, self.weather.calculate_travel_score(f)) 
            for i, f in enumerate(forecasts)
        ]
        scored_days.sort(key=lambda x: x[1], reverse=True)
        return [d[0] for d in scored_days[:duration//2 + 1]]
    
    async def _get_coordinates(self, location: str) -> Dict[str, float]:
        """Geocode location to coordinates"""
        # Use OpenStreetMap or Google Geocoding in production
        # Mock coordinates for popular destinations
        coordinates = {
            "costa rica": {"lat": 9.7489, "lon": -83.7534},
            "norway": {"lat": 60.4720, "lon": 8.4689},
            "new zealand": {"lat": -40.9006, "lon": 174.8860},
            "iceland": {"lat": 64.9631, "lon": -19.0208},
            "japan": {"lat": 36.2048, "lon": 138.2529}
        }
        return coordinates.get(location.lower(), {"lat": 45.0, "lon": 0.0})
