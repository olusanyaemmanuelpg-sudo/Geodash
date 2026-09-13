import { Routes, Route } from 'react-router';
import React, { useState } from 'react';
import { FleetProvider } from './context/fleetContext';
import PassengerSidebar from './components/PassengerSidebar';
import TelemetryPanel from './components/TelemetryPanel';
import MapCanvas from './components/MapCanvas';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);

  return (
    <FleetProvider>
      <div
        className={`w-screen h-screen relative overflow-hidden font-sans select-none transition-colors duration-500
        ${isDarkMode ? 'bg-black text-white' : 'bg-gray-50 text-zinc-900'}`}
      >
        {/* The Street Mapping Layer */}
        <MapCanvas isDarkMode={isDarkMode} />

        {/* Floating Left Uber-Style Booking Form */}
        <PassengerSidebar />

        {/* Floating Top-Right Performance Metric Deck */}
        <TelemetryPanel isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
      </div>
    </FleetProvider>
  );
}

export default App;
