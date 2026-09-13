import React from 'react';
import { useFleet } from '../context/fleetContext';
import { MapPin, Navigation } from 'lucide-react';

export default function MapCanvas({ isDarkMode }) {
  const { vehicles } = useFleet();

  // If there's no live data yet, we render a clean array of static vehicles for the portfolio UI preview
  const demoVehicles =
    Object.keys(vehicles).length > 0
      ? Object.values(vehicles)
      : [
          { longitude: 46, latitude: 42, bearing: 45, status: 'active' },
          { longitude: 64, latitude: 62, bearing: 120, status: 'active' },
          { longitude: 82, latitude: 76, bearing: 290, status: 'idle' },
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
      {/* A restrained road grid gives the fleet a believable surface to move across. */}
      <svg
        className="absolute inset-0 h-full w-full opacity-30 pointer-events-none"
        viewBox="0 0 1000 700"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <g
          fill="none"
          stroke={isDarkMode ? '#334155' : '#cbd5e1'}
          strokeWidth="2"
        >
          <path d="M-40 570 C 180 420, 250 560, 440 350 S 760 100, 1050 190" />
          <path d="M-80 160 C 160 250, 240 100, 470 210 S 760 500, 1060 440" />
          <path d="M130 -40 C 170 160, 90 300, 250 740" />
          <path d="M390 -40 C 340 180, 520 350, 430 740" />
          <path d="M710 -40 C 620 180, 790 330, 690 740" />
          <path d="M900 -40 C 830 180, 960 380, 870 740" />
        </g>
        <g
          fill="none"
          stroke={isDarkMode ? '#172033' : '#e2e8f0'}
          strokeWidth="1"
          strokeDasharray="10 12"
        >
          <path d="M-20 475 C 180 330, 300 470, 470 290 S 790 60, 1040 120" />
          <path d="M40 40 C 280 170, 430 60, 590 210 S 780 570, 1010 620" />
          <path d="M260 -20 C 220 180, 350 410, 300 720" />
          <path d="M570 -20 C 530 180, 650 390, 570 720" />
        </g>
      </svg>

      <div
        className={`absolute inset-0 opacity-40 border-t border-b border-l border-r pointer-events-none
        ${isDarkMode ? 'border-zinc-800' : 'border-slate-200'}`}
      />

      <div className="absolute left-[61%] top-[51%] h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full border border-emerald-400/20 bg-emerald-400/[0.03] pointer-events-none" />
      <div className="absolute left-[61%] top-[51%] -translate-x-1/2 -translate-y-1/2 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-500/60 pointer-events-none">
        Service area
      </div>

      {/* Render vehicles dynamically relative to canvas coordinates */}
      {demoVehicles.map((vehicle, idx) => (
        <div
          key={vehicle.driverId || idx}
          className="absolute z-10 transition-all duration-[1500ms] ease-linear"
          style={{
            left: `${vehicle.longitude}%`,
            top: `${vehicle.latitude}%`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div
            className={`relative h-[52px] w-[30px] drop-shadow-[0_5px_4px_rgba(0,0,0,0.45)] transition-colors
            ${
              vehicle.status === 'idle' ? 'text-amber-400' : 'text-emerald-400'
            }`}
            style={{ transform: `rotate(${vehicle.bearing || 0}deg)` }}
          >
            <span className="absolute left-1/2 top-0 h-full w-[22px] -translate-x-1/2 rounded-[12px_12px_8px_8px] border border-white/80 bg-gradient-to-r from-zinc-700 via-zinc-950 to-zinc-700 shadow-[inset_0_0_0_2px_rgba(255,255,255,0.12)]" />
            <span className="absolute left-1/2 top-[7px] h-[15px] w-[16px] -translate-x-1/2 rounded-[8px_8px_3px_3px] border border-sky-200/50 bg-gradient-to-b from-sky-200/90 via-sky-500/70 to-slate-900/90 shadow-[inset_0_2px_3px_rgba(255,255,255,0.65)]" />
            <span className="absolute left-1/2 top-[23px] h-[10px] w-[16px] -translate-x-1/2 rounded-sm border border-slate-500/50 bg-slate-700/90" />
            <span className="absolute left-1/2 top-[37px] h-[8px] w-[15px] -translate-x-1/2 rounded-[2px_2px_6px_6px] bg-zinc-800" />
            <span className="absolute -left-[2px] top-[13px] h-[12px] w-[4px] rounded-full bg-zinc-950 shadow-[0_22px_0_#09090b]" />
            <span className="absolute -right-[2px] top-[13px] h-[12px] w-[4px] rounded-full bg-zinc-950 shadow-[0_22px_0_#09090b]" />
            <span className="absolute left-[5px] top-[2px] h-[3px] w-[4px] rounded-full bg-white shadow-[10px_0_0_white]" />
            <span className="absolute bottom-[5px] left-[5px] h-[3px] w-[4px] rounded-full bg-red-500 shadow-[10px_0_0_#ef4444]" />

            {vehicle.status !== 'idle' && (
              <span className="absolute -inset-2 -z-10 rounded-full border border-emerald-400/40 animate-ping opacity-40" />
            )}
          </div>
          <div
            className={`absolute left-1/2 top-full mt-2 -translate-x-1/2 whitespace-nowrap rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider shadow-sm ${
              isDarkMode
                ? 'bg-zinc-900/90 text-zinc-400'
                : 'bg-white/90 text-zinc-500'
            }`}
          >
            {vehicle.status === 'idle' ? 'Waiting' : 'Available'}
          </div>
        </div>
      ))}

      <div className="absolute bottom-8 right-8 flex items-center gap-2 rounded-full border border-white/10 bg-zinc-950/80 px-3 py-2 text-[10px] font-medium text-zinc-400 shadow-xl backdrop-blur-md">
        <MapPin className="h-3.5 w-3.5 text-emerald-400" />
        <span>Pickup zone</span>
        <Navigation className="ml-2 h-3.5 w-3.5 text-sky-400" />
        <span>Live fleet</span>
      </div>
    </div>
  );
}
