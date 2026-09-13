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

const isAllowedOrigin = (origin, callback) => {
  if (!origin) {
    callback(null, true);
    return;
  }

  try {
    const { hostname, port: originPort } = new URL(origin);
    const allowed =
      (hostname === 'localhost' || hostname === '127.0.0.1') &&
      (!originPort || originPort === '5173' || originPort === '5174');
    callback(null, allowed);
  } catch {
    callback(null, false);
  }
};

// Keep local Vite instances connected during development.
const io = new Server(httpServer, {
  cors: {
    origin: isAllowedOrigin,
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
        if (client.status === 'ready') {
          await client.geoadd('active_drivers', longitude, latitude, driverId);
          await client.hset(`driver:meta:${driverId}`, {
            bearing,
            status,
            updatedAt: Date.now(),
          });
        }
      } catch (error) {
        console.error(
          `❌ Telemetry ingestion failure for ${driverId}:`,
          error.message,
        );
      } finally {
        const diff = process.hrtime(startTime);
        const latencyMs = (diff[0] * 1000 + diff[1] / 1000000).toFixed(2);

        // A Redis outage should not hide live coordinates from passengers.
        io.emit('fleet-coordinates', {
          driverId,
          longitude,
          latitude,
          bearing,
          status,
          latencyMs,
        });
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
