// frontend/src/context/FleetContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const FleetContext = createContext(null);

export const FleetProvider = ({ children }) => {
  const [vehicles, setVehicles] = useState({});
  const [metrics, setMetrics] = useState({
    activeCount: 0,
    throughput: 0,
    redisLatency: '0.0ms',
    dbSyncCountdown: 5.0,
  });

  useEffect(() => {
    // Connect to our upcoming Express WebSocket server gateway
    const socket = io('http://localhost:5000', {
      query: { userId: 'dashboard_viewer', role: 'passenger' },
    });

    // Listen for high-frequency live coordinate broadcasts from the server
    socket.on('fleet-coordinates', (data) => {
      const { driverId, longitude, latitude, bearing, status, latencyMs } =
        data;

      // 1. Dynamic State Synchronization: Update or insert vehicle position tracking
      setVehicles((prev) => ({
        ...prev,
        [driverId]: {
          longitude,
          latitude,
          bearing,
          status,
          lastUpdated: Date.now(),
        },
      }));

      // 2. Telemetry Parsing: Continually recalculate engineering latency panels
      setMetrics((prev) => ({
        ...prev,
        activeCount: Object.keys(prev).length,
        redisLatency: `${latencyMs}ms`,
        throughput: prev.throughput + 1,
      }));
    });

    // Track data packet speed windows through standard intervals
    const interval = setInterval(() => {
      setMetrics((prev) => ({
        ...prev,
        // Mock a decaying countdown timer representing database background flush intervals
        dbSyncCountdown:
          prev.dbSyncCountdown <= 0.2
            ? 5.0
            : parseFloat((prev.dbSyncCountdown - 0.2).toFixed(1)),
        // Smooth throughput statistics across real time
        throughput: Math.floor(prev.throughput * 0.8),
      }));
    }, 200);

    return () => {
      socket.disconnect();
      clearInterval(interval);
    };
  }, []);

  return (
    <FleetContext.Provider value={{ vehicles, metrics }}>
      {children}
    </FleetContext.Provider>
  );
};

export const useFleet = () => useContext(FleetContext);
