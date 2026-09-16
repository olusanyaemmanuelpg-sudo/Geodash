// frontend/src/context/FleetContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const FleetContext = createContext(null);
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const FleetProvider = ({ children }) => {
  const [vehicles, setVehicles] = useState({});
  const [metrics, setMetrics] = useState({
    activeCount: 0,
    throughput: 0,
    redisLatency: '0.0ms',
    dbSyncCountdown: 5.0,
    connectionStatus: 'connecting',
  });

  useEffect(() => {
    // Connect to our upcoming Express WebSocket server gateway
    const socket = io(API_URL, {
      query: { userId: 'dashboard_viewer', role: 'passenger' },
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 5000,
    });

    socket.on('connect', () => {
      setMetrics((prevMetrics) => ({
        ...prevMetrics,
        connectionStatus: 'connected',
      }));
    });

    socket.on('connect_error', () => {
      setMetrics((prevMetrics) => ({
        ...prevMetrics,
        connectionStatus: 'disconnected',
      }));
    });

    socket.io.on('reconnect_failed', () => {
      setMetrics((prevMetrics) => ({
        ...prevMetrics,
        connectionStatus: 'offline',
      }));
    });

    // Listen for high-frequency live coordinate broadcasts from the server
    socket.on('fleet-coordinates', (data) => {
      const { driverId, longitude, latitude, bearing, status, latencyMs } =
        data;

      // 1. Dynamic State Synchronization: Update or insert vehicle position tracking
      setVehicles((prevVehicles) => {
        const updatedVehicles = {
          ...prevVehicles,
          [driverId]: {
            driverId,
            longitude,
            latitude,
            bearing,
            status,
            lastUpdated: Date.now(),
          },
        };

        // 2. Telemetry Parsing: Continually recalculate engineering latency panels
        // Moving this here allows us to count vehicles using the correct updated dataset
        setMetrics((prevMetrics) => ({
          ...prevMetrics,
          activeCount: Object.keys(updatedVehicles).length, // FIX: Counts vehicles, not metrics object keys
          redisLatency: `${latencyMs || '0.0'}ms`, // Formats fallback cleanly
          throughput: prevMetrics.throughput + 1,
        }));

        return updatedVehicles;
      });
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
