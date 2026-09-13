import React, { useState } from 'react';
import { useFleet } from '../context/fleetContext';
import {
  ShieldCheck,
  Activity,
  Database,
  Moon,
  Sun,
  Pause,
  Play,
} from 'lucide-react';

export default function TelemetryPanel({ isDarkMode, setIsDarkMode }) {
  const { metrics } = useFleet();
  const [isSimulating, setIsSimulating] = useState(true);

  return (
    <div
      className={`absolute top-4 right-4 z-10 w-85 rounded-xl p-4 shadow-xl border backdrop-blur-md transition-all duration-500
      ${isDarkMode ? 'bg-black/90 border-zinc-800 text-white' : 'bg-white/95 border-gray-100 text-zinc-900'}`}
    >
      <div className="flex items-center justify-between border-b pb-3 mb-3 border-inherit">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-blue-500" />
          <span className="font-bold text-sm tracking-wide">
            Fleet Telemetry
          </span>
        </div>
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="p-1.5 rounded-lg border border-inherit hover:bg-zinc-500/10 transition"
        >
          {isDarkMode ? (
            <Sun className="w-4 h-4 text-amber-500" />
          ) : (
            <Moon className="w-4 h-4" />
          )}
        </button>
      </div>

      <div className="space-y-3">
        {/* System Latency Dashboard Signal */}
        <div className="flex items-center justify-between text-xs">
          <span className="opacity-70 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5" /> Redis Ingest
          </span>
          <span className="font-mono font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded animate-pulse">
            ⚡ {metrics.redisLatency}
          </span>
        </div>

        {/* Dynamic Connected Driver Count */}
        <div className="flex items-center justify-between text-xs">
          <span className="opacity-70">Drivers Connected Cluster</span>
          <span className="font-mono font-bold">
            {metrics.activeCount} Units
          </span>
        </div>

        {/* MongoDB Sync Timeline Remaining */}
        <div className="flex items-center justify-between text-xs">
          <span className="opacity-70 flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5" /> DB Commit Window
          </span>
          <span className="font-mono text-blue-500 font-bold">
            {metrics.dbSyncCountdown}s
          </span>
        </div>
      </div>

      <button
        onClick={() => setIsSimulating(!isSimulating)}
        className={`w-full mt-4 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-bold text-xs border border-inherit shadow-sm transition
          ${isSimulating ? 'bg-zinc-500/5 hover:bg-zinc-500/10' : 'bg-zinc-900 dark:bg-white text-white dark:text-black'}`}
      >
        {isSimulating ? (
          <>
            <Pause className="w-3.5 h-3.5" /> Stop Engine Stream
          </>
        ) : (
          <>
            <Play className="w-3.5 h-3.5" /> Spawn Live Fleet
          </>
        )}
      </button>
    </div>
  );
}
