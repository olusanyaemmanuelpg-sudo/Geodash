import React, { useEffect, useState } from 'react';
import { FleetProvider } from './context/fleetContext';
import PassengerSidebar from './components/PassengerSidebar';
import TelemetryPanel from './components/TelemetryPanel';
import MapCanvas from './components/MapCanvas';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectionMode, setSelectionMode] = useState('pickup');
  const [pickup, setPickup] = useState({
    latitude: 37.7885,
    longitude: -122.4014,
  });
  const [destination, setDestination] = useState({
    latitude: 37.7955,
    longitude: -122.3937,
  });
  const [locationLabels, setLocationLabels] = useState({
    pickup: '540 Howard St, San Francisco',
    destination: 'SF Ferry Building, San Francisco',
  });
  const [selectedDriverId, setSelectedDriverId] = useState(null);
  const [isMatching, setIsMatching] = useState(false);
  const [matchMessage, setMatchMessage] = useState('');
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isTelemetryOpen, setIsTelemetryOpen] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const lookup = async (location, key) => {
      setLocationLabels((previous) => ({ ...previous, [key]: 'Locating...' }));

      try {
        const params = new URLSearchParams({
          format: 'jsonv2',
          lat: String(location.latitude),
          lon: String(location.longitude),
          zoom: '18',
          addressdetails: '1',
        });
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?${params}`,
          {
            headers: { Accept: 'application/json' },
            signal: controller.signal,
          },
        );
        if (!response.ok) throw new Error('Location lookup failed');
        const result = await response.json();
        setLocationLabels((previous) => ({
          ...previous,
          [key]:
            result.display_name ||
            `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`,
        }));
      } catch (error) {
        if (error.name !== 'AbortError') {
          setLocationLabels((previous) => ({
            ...previous,
            [key]: `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`,
          }));
        }
      }
    };

    const timer = setTimeout(() => {
      lookup(pickup, 'pickup');
      lookup(destination, 'destination');
    }, 350);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [pickup, destination]);

  const handleMapSelection = (location) => {
    if (selectionMode === 'pickup') {
      setPickup(location);
      return;
    }
    setDestination(location);
  };

  const handleRequestRide = async () => {
    setIsMatching(true);
    setMatchMessage('Searching for the closest available driver...');
    setSelectedDriverId(null);

    try {
      const response = await fetch(`${API_URL}/api/rides/match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...pickup,
          destination,
          fare: 14.2,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'No driver found');
      setSelectedDriverId(result.driverId);
      setMatchMessage(
        `${result.driverId} assigned • ${result.distanceKm.toFixed(2)} km away`,
      );
    } catch (error) {
      setMatchMessage(error.message);
    } finally {
      setIsMatching(false);
    }
  };

  return (
    <FleetProvider>
      <div
        className={`w-screen h-screen relative overflow-hidden font-sans select-none transition-colors duration-500
        ${isDarkMode ? 'bg-black text-white' : 'bg-gray-50 text-zinc-900'}`}
      >
        {/* The Street Mapping Layer */}
        <MapCanvas
          isDarkMode={isDarkMode}
          selectionMode={selectionMode}
          pickup={pickup}
          destination={destination}
          onMapSelection={handleMapSelection}
          selectedDriverId={selectedDriverId}
          isTelemetryOpen={isTelemetryOpen}
        />

        {/* Floating Left Uber-Style Booking Form */}
        <PassengerSidebar
          selectionMode={selectionMode}
          setSelectionMode={setSelectionMode}
          pickup={pickup}
          destination={destination}
          locationLabels={locationLabels}
          onRequestRide={handleRequestRide}
          isMatching={isMatching}
          matchMessage={matchMessage}
          isOpen={isBookingOpen}
          onClose={() => setIsBookingOpen(false)}
        />

        {/* Floating Top-Right Performance Metric Deck */}
        <TelemetryPanel
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
          isOpen={isTelemetryOpen}
          onClose={() => setIsTelemetryOpen(false)}
        />

        <div
          className={`mobile-panel-actions ${isBookingOpen || isTelemetryOpen ? 'is-hidden' : ''}`}
          aria-label="Open dashboard panels"
        >
          <button
            type="button"
            className={`mobile-panel-action ${isBookingOpen ? 'is-active' : ''}`}
            onClick={() => {
              setIsBookingOpen((isOpen) => !isOpen);
              setIsTelemetryOpen(false);
            }}
          >
            {isBookingOpen ? 'Close booking' : 'Book a ride'}
          </button>
          <button
            type="button"
            className={`mobile-panel-action ${isTelemetryOpen ? 'is-active' : ''}`}
            onClick={() => {
              setIsTelemetryOpen((isOpen) => !isOpen);
              setIsBookingOpen(false);
            }}
          >
            {isTelemetryOpen ? 'Close telemetry' : 'Telemetry'}
          </button>
        </div>
      </div>
    </FleetProvider>
  );
}

export default App;
