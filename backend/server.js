require('dotenv').config();

const express = require('express');
const { createServer } = require('http'); // Required for Socket.io mapping
const { Server } = require('socket.io'); // Required for Socket.io mapping
const app = express();
const port = 3000;
const cors = require('cors');
const connectDB = require('./config/db.js');

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello, World!');
});

const httpServer = createServer(app);

// Initialize Socket.io and point its cross-origin access strictly to your Vite dev server
const io = new Server(httpServer, {
  cors: {
    origin: 'http://localhost:5173', // Adjust this if your React app is running on a different port
    methods: ['GET', 'POST'],
  },
});

io.on('connection', (socket) => {
  const { userId, role } = socket.handshake.query;
  console.log(`🔌 Node Joined Network: [${userId}] authenticated as [${role}]`);

  if (role === 'driver') {
    // Catch high-speed telemetry packets emitted by the mock tracking script
    socket.on('update-location', async (data) => {
      const startTime = process.hrtime();
      const { driverId, longitude, latitude, bearing, status } = data;

      try {
        // 1. Core Optimization: Write vectors instantly to Redis Cloud Geospatial Index
        await client.geoadd('active_drivers', longitude, latitude, driverId);

        // 2. Cache vehicle direction and status variables in a Redis Hash map
        await client.hset(`driver:meta:${driverId}`, {
          bearing,
          status,
          updatedAt: Date.now(),
        });

        // Calculate absolute pipeline execution processing time for your recruiter metrics panel
        const diff = process.hrtime(startTime);
        const latencyMs = (diff * 1000 + diff / 1000000).toFixed(2);

        // 3. System Segregation: Broadcast moving coordinates straight to viewing passengers
        io.emit('fleet-coordinates', {
          driverId,
          longitude,
          latitude,
          bearing,
          status,
          latencyMs,
        });
      } catch (error) {
        console.error(
          `❌ Telemetry ingestion failure for ${driverId}:`,
          error.message,
        );
      }
    });
  }

  socket.on('disconnect', () => {
    console.log(`❌ Node Left Network: [${userId}]`);
  });
});

const Redis = require('ioredis');
const client = new Redis({
  username: 'default',
  password: process.env.REDIS_PASSWORD,
  host: process.env.REDIS_HOST_URL || '127.0.0.1',
  port: Number(process.env.REDIS_PORT) || 6379,
  lazyConnect: true,
});

client.on('error', (err) => console.error('Redis Client Error:', err.message));

async function startServer() {
  try {
    await client.connect();
    console.log('Redis Client Connected');
  } catch (error) {
    console.error('Redis connection failed:', error.message);
  }

  httpServer.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });
}

startServer();
