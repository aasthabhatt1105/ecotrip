const { createClient } = require('redis');

class GPSTrackingHandler {
  constructor(io, redis) {
    this.io = io;
    this.redis = redis;
    this.activeTrips = new Map();
  }

  initialize() {
    this.io.on('connection', (socket) => {
      console.log('GPS client connected:', socket.id);

      socket.on('trip:start', (data) => this.handleTripStart(socket, data));
      socket.on('location:update', (data) => this.handleLocationUpdate(socket, data));
      socket.on('trip:end', (data) => this.handleTripEnd(socket, data));
      socket.on('disconnect', () => this.handleDisconnect(socket));
    });
  }

  async handleTripStart(socket, { userId, tripId, mode, destination }) {
    socket.join(`trip:${tripId}`);
    
    const tripData = {
      userId,
      tripId,
      mode,
      destination,
      startTime: Date.now(),
      waypoints: [],
      stats: {
        distance: 0,
        carbonSaved: 0,
        ecoPoints: 0
      }
    };

    this.activeTrips.set(tripId, tripData);
    
    // Store in Redis for persistence
    await this.redis.hSet(`trip:${tripId}`, {
      ...tripData,
      waypoints: JSON.stringify([])
    });

    // Notify user
    socket.emit('trip:update', {
      status: 'active',
      message: 'Trip tracking started',
      stats: tripData.stats
    });

    console.log(`Trip ${tripId} started for user ${userId}`);
  }

  async handleLocationUpdate(socket, { userId, tripId, waypoint, stats }) {
    const trip = this.activeTrips.get(tripId);
    if (!trip) return;

    // Add waypoint
    trip.waypoints.push(waypoint);
    trip.stats = stats;

    // Update Redis
    await this.redis.hSet(`trip:${tripId}`, {
      waypoints: JSON.stringify(trip.waypoints),
      stats: JSON.stringify(stats),
      lastUpdate: Date.now()
    });

    // Check for milestones
    const milestones = this.checkMilestones(trip, stats);
    
    // Broadcast to trip room
    this.io.to(`trip:${tripId}`).emit('trip:progress', {
      waypoint,
      stats,
      milestones
    });

    // Update live leaderboard
    await this.updateLeaderboard(userId, stats.ecoPoints);
  }

  checkMilestones(trip, stats) {
    const milestones = [];
    
    // Distance milestones
    const distanceMilestones = [5, 10, 25, 50, 100];
    const lastDistance = trip.waypoints.length > 1 ? 
      this.calculateDistance(
        trip.waypoints[trip.waypoints.length - 2],
        trip.waypoints[trip.waypoints.length - 1]
      ) : 0;
    
    const totalDistance = stats.distance;
    
    distanceMilestones.forEach(m => {
      if (totalDistance >= m && (totalDistance - lastDistance) < m) {
        milestones.push({
          type: 'distance',
          value: m,
          message: `🎉 ${m}km milestone reached!`,
          bonusPoints: m * 10
        });
      }
    });

    // Carbon saving milestones
    const carbonMilestones = [1, 5, 10, 25, 50];
    carbonMilestones.forEach(m => {
      if (stats.carbonSaved >= m) {
        milestones.push({
          type: 'carbon',
          value: m,
          message: `🌿 ${m}kg CO₂ saved! Equivalent to ${(m/20).toFixed(1)} trees`,
          badge: m >= 10 ? 'Carbon Warrior' : null
        });
      }
    });

    return milestones;
  }

  calculateDistance(p1, p2) {
    const R = 6371;
    const dLat = this.toRad(p2.lat - p1.lat);
    const dLon = this.toRad(p2.lng - p1.lng);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(this.toRad(p1.lat)) * Math.cos(this.toRad(p2.lat)) * 
              Math.sin(dLon/2) * Math.sin(dLon/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }

  toRad(deg) { return deg * (Math.PI/180); }

  async updateLeaderboard(userId, points) {
    // Update daily leaderboard
    const today = new Date().toISOString().split('T')[0];
    await this.redis.zIncrBy(`leaderboard:daily:${today}`, points, userId);
    
    // Update weekly
    const week = this.getWeekNumber();
    await this.redis.zIncrBy(`leaderboard:weekly:${week}`, points, userId);
    
    // Get user's rank
    const dailyRank = await this.redis.zRevRank(`leaderboard:daily:${today}`, userId);
    
    // Broadcast if in top 10
    if (dailyRank !== null && dailyRank < 10) {
      this.io.emit('leaderboard:update', {
        type: 'daily',
        userId,
        rank: dailyRank + 1,
        points
      });
    }
  }

  async handleTripEnd(socket, { userId, tripId, tripData }) {
    const trip = this.activeTrips.get(tripId);
    if (!trip) return;

    // Final calculations
    const finalStats = {
      ...tripData.finalStats,
      duration: Date.now() - trip.startTime,
      averageSpeed: tripData.finalStats.distance / ((Date.now() - trip.startTime) / 3600000)
    };

    // Save to database (mock)
    await this.saveTripToDatabase({
      ...trip,
      finalStats,
      endTime: Date.now()
    });

    // Cleanup
    this.activeTrips.delete(tripId);
    await this.redis.del(`trip:${tripId}`);

    // Notify completion
    socket.emit('trip:complete', {
      tripId,
      finalStats,
      achievements: this.calculateAchievements(finalStats)
    });

    socket.leave(`trip:${tripId}`);
  }

  calculateAchievements(stats) {
    const achievements = [];
    
    if (stats.distance >= 50) achievements.push({ name: 'Half Century', icon: '🚴' });
    if (stats.carbonSaved >= 10) achievements.push({ name: 'Climate Hero', icon: '🌍' });
    if (stats.ecoPoints >= 500) achievements.push({ name: 'Eco Warrior', icon: '🏆' });
    
    return achievements;
  }

  handleDisconnect(socket) {
    console.log('GPS client disconnected:', socket.id);
  }

  getWeekNumber() {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 1);
    return Math.ceil((((now - start) / 86400000) + start.getDay() + 1) / 7);
  }

  async saveTripToDatabase(tripData) {
    console.log('Saving trip to database:', tripData.tripId);
  }
}

module.exports = GPSTrackingHandler;
