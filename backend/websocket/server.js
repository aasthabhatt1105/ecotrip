const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const redis = require('redis');
const GPSTrackingHandler = require('./gpsHandler');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

const redisClient = redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));

(async () => {
  await redisClient.connect();
  console.log('Connected to Redis');
  
  const gpsHandler = new GPSTrackingHandler(io, redisClient);
  gpsHandler.initialize();
})();

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'WebSocket Gateway' });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`WebSocket server running on port ${PORT}`);
});
