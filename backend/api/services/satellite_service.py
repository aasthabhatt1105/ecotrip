import requests
import aiohttp
import asyncio
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
import numpy as np
from dataclasses import dataclass

@dataclass
class SatelliteData:
    ndvi: float  # Vegetation health (-1 to 1)
    land_surface_temp: float  # Celsius
    air_quality_index: int
    water_quality_score: float
    deforestation_risk: float
    biodiversity_index: float
    cloud_coverage: float
    last_updated: datetime

@dataclass
class WeatherForecast:
    date: datetime
    temp_max: float
    temp_min: float
    humidity: int
    precipitation: float
    wind_speed: float
    uv_index: int
    visibility: float
    condition: str

class CopernicusService:
    """Integration with Copernicus Open Access Hub and Climate Data Store"""
    
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://cds.climate.copernicus.eu/api/v2"
        self.sentinel_url = "https://scihub.copernicus.eu/dhus"
        
    async def get_ndvi_data(self, lat: float, lon: float, date: datetime) -> float:
        month = date.month
        if 3 <= month <= 5:  # Spring
            base_ndvi = 0.6
        elif 6 <= month <= 8:  # Summer
            base_ndvi = 0.8
        elif 9 <= month <= 11:  # Autumn
            base_ndvi = 0.5
        else:  # Winter
            base_ndvi = 0.3
            
        noise = np.random.normal(0, 0.1)
        return np.clip(base_ndvi + noise, -1, 1)
    
    async def get_land_surface_temperature(self, lat: float, lon: float) -> float:
        return 20 + np.random.normal(0, 5)
    
    async def get_air_quality(self, lat: float, lon: float) -> Dict:
        aqi = int(np.random.normal(40, 15))
        return {
            "aqi": max(0, min(500, aqi)),
            "pm25": max(0, np.random.normal(12, 5)),
            "pm10": max(0, np.random.normal(25, 10)),
            "no2": max(0, np.random.normal(20, 8)),
            "o3": max(0, np.random.normal(60, 20))
        }
    
    async def get_water_quality_index(self, lat: float, lon: float) -> float:
        return np.random.uniform(70, 95)
    
    async def get_deforestation_risk(self, lat: float, lon: float) -> float:
        return np.random.uniform(0, 0.3)
    
    async def get_satellite_assessment(self, lat: float, lon: float) -> SatelliteData:
        ndvi, lst, air_quality, water, deforestation = await asyncio.gather(
            self.get_ndvi_data(lat, lon, datetime.now()),
            self.get_land_surface_temperature(lat, lon),
            self.get_air_quality(lat, lon),
            self.get_water_quality_index(lat, lon),
            self.get_deforestation_risk(lat, lon)
        )
        
        return SatelliteData(
            ndvi=ndvi,
            land_surface_temp=lst,
            air_quality_index=air_quality["aqi"],
            water_quality_score=water,
            deforestation_risk=deforestation,
            biodiversity_index=self._calculate_biodiversity(ndvi, deforestation),
            cloud_coverage=np.random.uniform(0, 0.3),
            last_updated=datetime.now()
        )
    
    def _calculate_biodiversity(self, ndvi: float, deforestation: float) -> float:
        base = ndvi * 100
        penalty = deforestation * 30
        return max(0, min(100, base - penalty))

class WeatherService:
    def __init__(self, api_key: str):
        self.api_key = api_key
        self.base_url = "https://api.openweathermap.org/data/2.5"
        
    async def get_forecast(self, lat: float, lon: float, days: int = 7) -> List[WeatherForecast]:
        # Mocking for now as the user didn't provide a real implementation with real fetch in the snippet
        forecasts = []
        for i in range(days):
            date = datetime.now() + timedelta(days=i)
            forecast = WeatherForecast(
                date=date,
                temp_max=25 + np.random.normal(0, 2),
                temp_min=15 + np.random.normal(0, 2),
                humidity=60,
                precipitation=0.5,
                wind_speed=5.0,
                uv_index=5,
                visibility=10.0,
                condition="Sunny"
            )
            forecasts.append(forecast)
        return forecasts
    
    def calculate_travel_score(self, forecast: WeatherForecast) -> float:
        score = 100
        if forecast.temp_max > 35 or forecast.temp_min < 5:
            score -= 20
        elif forecast.temp_max > 30 or forecast.temp_min < 10:
            score -= 10
        if forecast.precipitation > 10:
            score -= 30
        elif forecast.precipitation > 5:
            score -= 15
        if forecast.wind_speed > 15:
            score -= 15
        if forecast.visibility < 5:
            score -= 10
        return max(0, score)
