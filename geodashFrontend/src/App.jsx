import React, { useState } from 'react';
import { FleetProvider } from './context/fleetContext';
import PassengerSidebar from './components/PassengerSidebar';
import TelemetryPanel from './components/TelemetryPanel';
import MapCanvas from './components/MapCanvas';

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

  const handleMapSelection = (location) => {
    if (selectionMode === 'pickup') {
      setPickup(location);
      return;
    }
    setDestination(location);
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
        />

        {/* Floating Left Uber-Style Booking Form */}
        <PassengerSidebar
          selectionMode={selectionMode}
          setSelectionMode={setSelectionMode}
          pickup={pickup}
          destination={destination}
        />

        {/* Floating Top-Right Performance Metric Deck */}
        <TelemetryPanel isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} />
      </div>
    </FleetProvider>
  );
}

export default App;
