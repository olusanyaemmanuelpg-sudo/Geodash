import React from 'react';
import { useFleet } from '../context/fleetContext';
import { Navigation } from 'lucide-react';

export default function MapCanvas({ isDarkMode }) {
  const { vehicles } = useFleet();

  // If there's no live data yet, we render a clean array of static vehicles for the portfolio UI preview
  const demoVehicles =
    Object.keys(vehicles).length > 0
      ? Object.values(vehicles)
      : [
          { longitude: 40, latitude: 35, bearing: 45, status: 'active' },
          { longitude: 65, latitude: 20, bearing: 120, status: 'active' },
          { longitude: 25, latitude: 70, bearing: 290, status: 'idle' },
        ];

  return (
    <div
      className={`absolute inset-0 w-full h-full transition-colors duration-500
      ${
        isDarkMode
          ? 'bg-zinc-950 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px]'
          : 'bg-slate-50 bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px]'
      }`}
    >
      {/* Decorative Grid road-lines to resemble a digital transit layout map */}
      <div
        className={`absolute inset-0 opacity-20 border-t border-b border-l border-r pointer-events-none
        ${isDarkMode ? 'border-zinc-800' : 'border-slate-200'}`}
      ></div>

      {/* Render vehicles dynamically relative to canvas coordinates */}
      {demoVehicles.map((vehicle, idx) => (
        <div
          key={idx}
          className="absolute transition-all duration-1000 ease-out"
          style={{
            left: `${vehicle.longitude}%`,
            top: `${vehicle.latitude}%`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div
            className={`p-2 rounded-full shadow-lg border relative flex items-center justify-center transition
            ${
              vehicle.status === 'idle'
                ? 'bg-amber-500 border-amber-400 text-white'
                : 'bg-black dark:bg-white text-white dark:text-black border-zinc-700'
            }`}
          >
            {/* Navigational chevron pointing in the moving vehicle direction (bearing) */}
            <Navigation
              className="w-4 h-4 transition-transform duration-500"
              style={{ transform: `rotate(${vehicle.bearing}deg)` }}
            />

            {/* Radar Pulse circle element for active cars */}
            {vehicle.status !== 'idle' && (
              <span className="absolute inset-0 rounded-full bg-inherit animate-ping opacity-40 scale-150"></span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
