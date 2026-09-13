// backend/scripts/mockSimulator.js
const { io } = require('socket.io-client');

// Connects directly to the custom Express/HTTP port you established in server.js
const SERVER_URL = 'http://localhost:3000';
const NUMBER_OF_DRIVERS = 25;

// Center point of your simulation (Downtown San Francisco grid matching passenger inputs)
const CENTER_LNG = -122.4014;
const CENTER_LAT = 37.7885;
const UPDATE_INTERVAL_MS = 500;
const SPEED_PER_UPDATE = 0.000035;

// Reusable road-shaped loops keep simulated cars on believable city streets.
const ROAD_LOOPS = [
  [
    [-122.414, 37.78],
    [-122.414, 37.798],
    [-122.395, 37.798],
    [-122.395, 37.78],
  ],
  [
    [-122.423, 37.786],
    [-122.405, 37.786],
    [-122.405, 37.804],
    [-122.423, 37.804],
  ],
  [
    [-122.408, 37.772],
    [-122.388, 37.772],
    [-122.388, 37.791],
    [-122.408, 37.791],
  ],
];

console.log(
  `🚗 Launching Fleet Tracking Simulation: Deploying ${NUMBER_OF_DRIVERS} units...`,
);

for (let i = 1; i <= NUMBER_OF_DRIVERS; i++) {
  const driverId = `DRV_MOCK_${String(i).padStart(2, '0')}`;

  const road = ROAD_LOOPS[i % ROAD_LOOPS.length];
  let segmentIndex = Math.floor(Math.random() * road.length);
  let progress = Math.random();
  let lng = road[segmentIndex][0];
  let lat = road[segmentIndex][1];

  // Open a distinct, long-polling WebSocket pipe straight to the ingestion gate
  const socket = io(SERVER_URL, {
    query: { userId: driverId, role: 'driver' },
  });

  socket.on('connect', () => {
    console.log(`✅ [${driverId}] Stream Pipeline Connected`);

    // Stream telemetry updates at high frequencies to test your architecture limits
    setInterval(() => {
      let start = road[segmentIndex];
      let end = road[(segmentIndex + 1) % road.length];
      const segmentLength = Math.hypot(end[0] - start[0], end[1] - start[1]);
      progress += SPEED_PER_UPDATE / segmentLength;

      if (progress >= 1) {
        progress -= 1;
        segmentIndex = (segmentIndex + 1) % road.length;
        start = road[segmentIndex];
        end = road[(segmentIndex + 1) % road.length];
      }

      lng = start[0] + (end[0] - start[0]) * progress;
      lat = start[1] + (end[1] - start[1]) * progress;
      const bearing =
        (Math.atan2(end[0] - start[0], end[1] - start[1]) * 180) / Math.PI;

      socket.emit('update-location', {
        driverId,
        longitude: lng,
        latitude: lat,
        bearing: (bearing + 360) % 360,
        status: Math.random() > 0.85 ? 'idle' : 'active',
      });
    }, UPDATE_INTERVAL_MS);
  });
}
