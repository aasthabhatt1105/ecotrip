const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const redis = require('redis');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

// Redis for real-time leaderboards and caching
const redisClient = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

// Real-time eco-trip tracking
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // Join user to their room
  socket.on('authenticate', (userId) => {
    socket.join(`user:${userId}`);
    console.log(`User ${userId} authenticated`);
  });
  
  // Real-time trip tracking
  socket.on('trip:start', async (tripData) => {
    const { userId, route, transportMode } = tripData;
    
    // Calculate real-time carbon savings
    const carbonData = calculateLiveCarbon(route, transportMode);
    
    // Broadcast to user's room
    io.to(`user:${userId}`).emit('trip:update', {
      distance: 0,
      carbonSaved: 0,
      ecoPoints: 0,
      status: 'active'
    });
    
    // Store in Redis for persistence
    await redisClient.hSet(`trip:${userId}`, {
      startTime: Date.now(),
      route: JSON.stringify(route),
      transport: transportMode
    });
  });
  
  // Location updates during trip
  socket.on('location:update', async (data) => {
    const { userId, coords, distance } = data;
    
    const trip = await redisClient.hGetAll(`trip:${userId}`);
    const carbonSaved = calculateCarbonSaved(distance, trip.transport);
    const points = calculatePoints(carbonSaved);
    
    // Update leaderboard in real-time
    await updateLeaderboard(userId, points);
    
    io.to(`user:${userId}`).emit('trip:progress', {
      distance,
      carbonSaved,
      points,
      nextMilestone: getNextMilestone(distance)
    });
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Leaderboard updates
async function updateLeaderboard(userId, points) {
  await redisClient.zIncrBy('leaderboard:global', points, userId);
  
  // Get top 10 and broadcast
  const topUsers = await redisClient.zRangeWithScores('leaderboard:global', 0, 9, { REV: true });
  io.emit('leaderboard:update', topUsers);
}

function calculateLiveCarbon(route, transport) {
  const factors = {
    'bicycle': 0,
    'walking': 0,
    'electric_bus': 0.02,
    'train': 0.03,
    'car': 0.12
  };
  return route.distance * (factors[transport] || 0.1);
}

function calculateCarbonSaved(distance, transport) {
  const carEmission = 0.12; // kg CO2 per km
  const transportEmission = {
    'bicycle': 0,
    'walking': 0,
    'electric_bus': 0.02,
    'train': 0.03
  }[transport] || 0.1;
  
  return distance * (carEmission - transportEmission);
}

function calculatePoints(carbonSaved) {
  return Math.floor(carbonSaved * 10); // 10 points per kg CO2 saved
}

function getNextMilestone(distance) {
  const milestones = [5, 10, 25, 50, 100];
  return milestones.find(m => m > distance) || null;
}

server.listen(3001, () => {
  console.log('WebSocket server running on port 3001');
});
