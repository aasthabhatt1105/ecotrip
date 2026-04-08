import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { io } from 'socket.io-client';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LOCATION_TASK_NAME = 'background-location-task';
const SOCKET_URL = process.env.EXPO_PUBLIC_WS_URL || 'ws://localhost:3001';

class GPSTrackingService {
  constructor() {
    this.socket = null;
    this.currentTrip = null;
    this.locationSubscription = null;
    this.carbonStats = {
      distance: 0,
      carbonSaved: 0,
      ecoPoints: 0,
      treesEquivalent: 0
    };
  }

  // Initialize socket connection
  async initialize() {
    this.socket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnection: true,
    });

    this.socket.on('connect', () => {
      console.log('GPS Socket connected');
    });

    this.socket.on('trip:update', (data) => {
      this.handleTripUpdate(data);
    });

    this.socket.on('trip:milestone', (milestone) => {
      this.showMilestoneNotification(milestone);
    });

    return this.requestPermissions();
  }

  // Request location permissions
  async requestPermissions() {
    const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
    if (foregroundStatus !== 'granted') {
      throw new Error('Foreground location permission denied');
    }

    const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
    if (backgroundStatus !== 'granted') {
      console.warn('Background location permission denied - using foreground only');
    }

    return true;
  }

  // Start a new eco-trip
  async startTrip(tripConfig) {
    const { mode, destination, purpose } = tripConfig;
    
    this.currentTrip = {
      id: `trip_${Date.now()}`,
      startTime: new Date().toISOString(),
      mode,
      destination,
      purpose,
      waypoints: [],
      isActive: true
    };

    // Save to storage for persistence
    await AsyncStorage.setItem('activeTrip', JSON.stringify(this.currentTrip));

    // Emit to server
    this.socket.emit('trip:start', {
      userId: await this.getUserId(),
      tripId: this.currentTrip.id,
      mode,
      destination,
      estimatedRoute: tripConfig.route
    });

    // Start location tracking
    await this.startLocationTracking();
    
    // Start background task if supported
    if (Platform.OS === 'android') {
      await this.startBackgroundTracking();
    }

    return this.currentTrip;
  }

  // Real-time location tracking
  async startLocationTracking() {
    this.locationSubscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        timeInterval: 5000, // Update every 5 seconds
        distanceInterval: 10, // Or every 10 meters
      },
      this.handleLocationUpdate.bind(this)
    );
  }

  // Handle location updates
  async handleLocationUpdate(location) {
    if (!this.currentTrip || !this.currentTrip.isActive) return;

    const { latitude, longitude, altitude, speed, heading } = location.coords;
    const timestamp = new Date().toISOString();

    const waypoint = {
      lat: latitude,
      lng: longitude,
      altitude: altitude || 0,
      speed: speed || 0,
      heading: heading || 0,
      timestamp,
      accuracy: location.coords.accuracy
    };

    // Add to trip waypoints
    this.currentTrip.waypoints.push(waypoint);

    // Calculate distance from last point
    if (this.currentTrip.waypoints.length > 1) {
      const lastPoint = this.currentTrip.waypoints[this.currentTrip.waypoints.length - 2];
      const distance = this.calculateDistance(lastPoint, waypoint);
      this.updateCarbonStats(distance, this.currentTrip.mode);
    }

    // Emit real-time update
    this.socket.emit('location:update', {
      userId: await this.getUserId(),
      tripId: this.currentTrip.id,
      waypoint,
      stats: this.carbonStats,
      timestamp
    });

    // Save locally
    await AsyncStorage.setItem('activeTrip', JSON.stringify(this.currentTrip));
  }

  // Calculate distance between two coordinates (Haversine formula)
  calculateDistance(point1, point2) {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(point2.lat - point1.lat);
    const dLon = this.toRad(point2.lng - point1.lng);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.toRad(point1.lat)) * Math.cos(this.toRad(point2.lat)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  toRad(deg) { return deg * (Math.PI/180); }

  // Update carbon statistics
  updateCarbonStats(distanceKm, transportMode) {
    const emissionFactors = {
      'walking': 0,
      'cycling': 0,
      'electric_bus': 0.02,
      'train': 0.03,
      'electric_car': 0.05,
      'hybrid_car': 0.12,
      'car': 0.18,
      'motorcycle': 0.10
    };

    const carEmission = 0.18; // kg CO2 per km (baseline)
    const modeEmission = emissionFactors[transportMode] || 0.1;
    
    const carbonSaved = distanceKm * (carEmission - modeEmission);
    const ecoPoints = Math.floor(carbonSaved * 10);
    const treesEquivalent = carbonSaved / 20; // 1 tree absorbs ~20kg CO2/year

    this.carbonStats.distance += distanceKm;
    this.carbonStats.carbonSaved += carbonSaved;
    this.carbonStats.ecoPoints += ecoPoints;
    this.carbonStats.treesEquivalent += treesEquivalent;
  }

  // Get current stats
  getCurrentStats() {
    return {
      ...this.carbonStats,
      duration: this.currentTrip ? 
        (Date.now() - new Date(this.currentTrip.startTime).getTime()) / 1000 : 0,
      currentSpeed: this.currentTrip?.waypoints?.length > 0 ?
        this.currentTrip.waypoints[this.currentTrip.waypoints.length - 1].speed : 0
    };
  }

  // End trip
  async endTrip() {
    if (!this.currentTrip) return null;

    this.currentTrip.isActive = false;
    this.currentTrip.endTime = new Date().toISOString();
    this.currentTrip.finalStats = { ...this.carbonStats };

    // Emit to server
    this.socket.emit('trip:end', {
      userId: await this.getUserId(),
      tripId: this.currentTrip.id,
      tripData: this.currentTrip
    });

    // Cleanup
    if (this.locationSubscription) {
      this.locationSubscription.remove();
    }
    
    await AsyncStorage.removeItem('activeTrip');
    
    const completedTrip = { ...this.currentTrip };
    this.currentTrip = null;
    this.carbonStats = { distance: 0, carbonSaved: 0, ecoPoints: 0, treesEquivalent: 0 };

    return completedTrip;
  }

  // Background task definition
  async startBackgroundTracking() {
    try {
      await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 10000,
        distanceInterval: 50,
        foregroundService: {
          notificationTitle: 'EcoTrip Tracking',
          notificationBody: 'Recording your eco-friendly journey...',
          notificationColor: '#4CAF50'
        }
      });
    } catch (error) {
      console.error('Background tracking error:', error);
    }
  }

  async getUserId() {
    const user = await AsyncStorage.getItem('user');
    return user ? JSON.parse(user).id : 'anonymous';
  }

  showMilestoneNotification(milestone) {
    // Trigger local notification
    console.log('Milestone reached:', milestone);
  }
}

// Define background task
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error('Background task error:', error);
    return;
  }
  
  if (data) {
    const { locations } = data;
    // Process background locations
    console.log('Background location:', locations);
  }
});

export const gpsService = new GPSTrackingService();
