// backend/scripts/mockSimulator.js
const { io } = require('socket.io-client');

// Connects directly to the custom Express/HTTP port you established in server.js
const SERVER_URL = 'http://localhost:3000';
const NUMBER_OF_DRIVERS = 25;

// Center point of your simulation (Downtown San Francisco grid matching passenger inputs)
const CENTER_LNG = -122.4014;
const CENTER_LAT = 37.7885;

console.log(
  `🚗 Launching Fleet Tracking Simulation: Deploying ${NUMBER_OF_DRIVERS} units...`,
);

for (let i = 1; i <= NUMBER_OF_DRIVERS; i++) {
  const driverId = `DRV_MOCK_${String(i).padStart(2, '0')}`;

  // Distribute the vehicles randomly across the transit network boundary grid
  let lng = CENTER_LNG + (Math.random() - 0.5) * 0.05;
  let lat = CENTER_LAT + (Math.random() - 0.5) * 0.05;
  let angle = Math.random() * 360;

  // Open a distinct, long-polling WebSocket pipe straight to the ingestion gate
  const socket = io(SERVER_URL, {
    query: { userId: driverId, role: 'driver' },
  });

  socket.on('connect', () => {
    console.log(`✅ [${driverId}] Stream Pipeline Connected`);

    // Stream telemetry updates at high frequencies to test your architecture limits
    setInterval(() => {
      // Linear math vectors to create organic, smooth roads movement paths
      angle += (Math.random() - 0.5) * 35; // Steering calculations
      const speedFactor = 0.00015; // Rate of movement speed

      lng += Math.cos((angle * Math.PI) / 180) * speedFactor;
      lat += Math.sin((angle * Math.PI) / 180) * speedFactor;

      socket.emit('update-location', {
        driverId,
        longitude: lng,
        latitude: lat,
        bearing: Math.floor(angle % 360),
        status: Math.random() > 0.85 ? 'idle' : 'active',
      });
    }, 1500);
  });
}
