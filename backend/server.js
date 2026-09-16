const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const { createServer } = require('http'); // Required for Socket.io mapping
const { Server } = require('socket.io'); // Required for Socket.io mapping
const app = express();
const port = Number(process.env.PORT) || 3000;
const cors = require('cors');
const connectDB = require('./config/db.js');
const mongoose = require('mongoose');
const RideRequest = require('./models/RideRequest.js');
const driverPositions = new Map();
const DRIVER_STALE_AFTER_MS = 10_000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello, World!');
});

app.post('/api/rides/match', async (req, res) => {
  const {
    latitude,
    longitude,
    destination,
    passengerId = 'demo-passenger',
    fare = 14.2,
    radiusKm = 5,
  } = req.body;

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return res
      .status(400)
      .json({ error: 'Valid pickup latitude and longitude are required.' });
  }

  try {
    let rideRequest = null;
    if (mongoose.connection.readyState === 1) {
      rideRequest = await RideRequest.create({
        passengerId,
        pickupLocation: {
          type: 'Point',
          coordinates: [longitude, latitude],
        },
        dropoffLocation: {
          type: 'Point',
          coordinates: [
            Number(destination?.longitude ?? longitude),
            Number(destination?.latitude ?? latitude),
          ],
        },
        fare,
        status: 'SEARCHING',
      });
    }

    let candidates = [];

    if (client.status === 'ready') {
      candidates = await client.geosearch(
        'active_drivers',
        'FROMLONLAT',
        longitude,
        latitude,
        'BYRADIUS',
        radiusKm,
        'km',
        'ASC',
        'COUNT',
        25,
        'WITHDIST',
        'WITHCOORD',
      );
    }

    for (const candidate of candidates) {
      const [driverId, distanceKm, coordinates] = candidate;
      const status = await client.hget(`driver:meta:${driverId}`, 'status');
      const updatedAt = Number(
        await client.hget(`driver:meta:${driverId}`, 'updatedAt'),
      );
      const isFresh = Date.now() - updatedAt <= DRIVER_STALE_AFTER_MS;

      if (status === 'idle' && isFresh) {
        const match = {
          driverId,
          distanceKm: Number(distanceKm),
          longitude: Number(coordinates[0]),
          latitude: Number(coordinates[1]),
          status: status || 'active',
        };

        if (rideRequest) {
          rideRequest.driverId = driverId;
          rideRequest.status = 'ACCEPTED';
          await rideRequest.save();
        }

        return res.json({ ...match, rideRequestId: rideRequest?._id });
      }
    }

    const fallback = [...driverPositions.values()]
      .filter((driver) => driver.status === 'idle')
      .filter((driver) => Date.now() - driver.lastSeen <= DRIVER_STALE_AFTER_MS)
      .map((driver) => ({
        ...driver,
        distanceKm:
          Math.sqrt(
            (driver.latitude - latitude) ** 2 +
              (driver.longitude - longitude) ** 2,
          ) * 111,
      }))
      .sort((first, second) => first.distanceKm - second.distanceKm)[0];

    if (!fallback || fallback.distanceKm > radiusKm) {
      return res.status(404).json({
        error: 'No available driver found nearby.',
        rideRequestId: rideRequest?._id,
      });
    }

    if (rideRequest) {
      rideRequest.driverId = fallback.driverId;
      rideRequest.status = 'ACCEPTED';
      await rideRequest.save();
    }

    return res.json({ ...fallback, rideRequestId: rideRequest?._id });
  } catch (error) {
    console.error('Ride matching failed:', error.message);
    return res
      .status(503)
      .json({ error: 'Matching service is temporarily unavailable.' });
  }
});

app.get('/api/rides/:rideRequestId', async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.rideRequestId)) {
    return res.status(400).json({ error: 'Invalid ride request ID.' });
  }

  try {
    const rideRequest = await RideRequest.findById(
      req.params.rideRequestId,
    ).lean();
    if (!rideRequest)
      return res.status(404).json({ error: 'Ride request not found.' });
    return res.json(rideRequest);
  } catch (error) {
    console.error('Ride request lookup failed:', error.message);
    return res
      .status(503)
      .json({ error: 'Ride history is temporarily unavailable.' });
  }
});

const httpServer = createServer(app);

const configuredOrigins = new Set(
  (process.env.FRONTEND_ORIGINS || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean),
);

const isAllowedOrigin = (origin, callback) => {
  if (!origin) {
    callback(null, true);
    return;
  }

  try {
    const { hostname, port: originPort } = new URL(origin);
    const isLocalDevelopment =
      (hostname === 'localhost' || hostname === '127.0.0.1') &&
      (!originPort || originPort === '5173' || originPort === '5174');
    const allowed = isLocalDevelopment || configuredOrigins.has(origin);
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
      driverPositions.set(driverId, {
        socketId: socket.id,
        driverId,
        longitude,
        latitude,
        bearing,
        status,
        lastSeen: Date.now(),
      });

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
    if (role === 'driver') {
      const driver = driverPositions.get(userId);
      if (driver?.socketId === socket.id) {
        driverPositions.delete(userId);
        if (client.status === 'ready') {
          client
            .zrem('active_drivers', userId)
            .catch((error) =>
              console.error(
                `Failed to remove ${userId} from Redis:`,
                error.message,
              ),
            );
          client
            .del(`driver:meta:${userId}`)
            .catch((error) =>
              console.error(
                `Failed to remove metadata for ${userId}:`,
                error.message,
              ),
            );
        }
      }
    }
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

setInterval(() => {
  const now = Date.now();
  for (const [driverId, driver] of driverPositions) {
    if (now - driver.lastSeen > DRIVER_STALE_AFTER_MS) {
      driverPositions.delete(driverId);
      if (client.status === 'ready') {
        client.zrem('active_drivers', driverId).catch(() => {});
        client.del(`driver:meta:${driverId}`).catch(() => {});
      }
    }
  }
}, DRIVER_STALE_AFTER_MS);

async function startServer() {
  try {
    await client.connect();
    console.log('Redis Client Connected');
  } catch (error) {
    console.error('Redis connection failed:', error.message);
  }

  httpServer.listen(port, '0.0.0.0', () => {
    console.log(`Server is running on port ${port}`);
  });
}

startServer();
