import React, { useEffect, useRef, useState } from 'react';
import {
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  useMapEvents,
} from 'react-leaflet';
import { divIcon } from 'leaflet';
import { MapPin, Navigation } from 'lucide-react';
import { useFleet } from '../context/fleetContext';

const SAN_FRANCISCO_CENTER = [37.7885, -122.4014];
const demoVehicles = [
  {
    driverId: 'demo-1',
    longitude: -122.405,
    latitude: 37.791,
    bearing: 45,
    status: 'active',
  },
  {
    driverId: 'demo-2',
    longitude: -122.395,
    latitude: 37.784,
    bearing: 120,
    status: 'active',
  },
  {
    driverId: 'demo-3',
    longitude: -122.411,
    latitude: 37.782,
    bearing: 290,
    status: 'idle',
  },
];

const TILE_LAYERS = {
  street: {
    label: 'Street',
    attribution:
      'Tiles &copy; Esri &mdash; Source: Esri, OpenStreetMap contributors',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
  },
  light: {
    label: 'Light',
    attribution: '&copy; CARTO &copy; OpenStreetMap contributors',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
  },
  topo: {
    label: 'Terrain',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, USGS, NOAA',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
  },
};

function MapClickHandler({ onMapSelection }) {
  useMapEvents({
    click: ({ latlng }) =>
      onMapSelection({ latitude: latlng.lat, longitude: latlng.lng }),
  });
  return null;
}

function distanceInKm(first, second) {
  const earthRadiusKm = 6371;
  const latitudeDelta = ((second.latitude - first.latitude) * Math.PI) / 180;
  const longitudeDelta = ((second.longitude - first.longitude) * Math.PI) / 180;
  const latitudeOne = (first.latitude * Math.PI) / 180;
  const latitudeTwo = (second.latitude * Math.PI) / 180;
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.sin(longitudeDelta / 2) ** 2 *
      Math.cos(latitudeOne) *
      Math.cos(latitudeTwo);

  return (
    earthRadiusKm *
    2 *
    Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
  );
}

function formatDuration(seconds) {
  const minutes = Math.max(1, Math.round(seconds / 60));
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)} hr ${minutes % 60} min`;
}

function RouteLayer({ pickup, destination, onRouteUpdate }) {
  const [route, setRoute] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    const fallbackDistance = distanceInKm(pickup, destination);
    const fallback = {
      coordinates: [
        [pickup.latitude, pickup.longitude],
        [destination.latitude, destination.longitude],
      ],
      distanceKm: fallbackDistance,
      durationSeconds: (fallbackDistance / 30) * 3600,
      isFallback: true,
    };

    setRoute(fallback);
    onRouteUpdate(fallback);

    const requestRoute = async () => {
      try {
        const coordinates = `${pickup.longitude},${pickup.latitude};${destination.longitude},${destination.latitude}`;
        const response = await fetch(
          `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson`,
          { signal: controller.signal },
        );
        if (!response.ok) throw new Error('Routing unavailable');
        const result = await response.json();
        const [primaryRoute] = result.routes || [];
        if (!primaryRoute) throw new Error('No route found');

        const routed = {
          coordinates: primaryRoute.geometry.coordinates.map(
            ([longitude, latitude]) => [latitude, longitude],
          ),
          distanceKm: primaryRoute.distance / 1000,
          durationSeconds: primaryRoute.duration,
          isFallback: false,
        };
        setRoute(routed);
        onRouteUpdate(routed);
      } catch (error) {
        if (error.name !== 'AbortError') onRouteUpdate(fallback);
      }
    };

    requestRoute();
    return () => controller.abort();
  }, [pickup, destination, onRouteUpdate]);

  if (!route) return null;
  return (
    <Polyline
      positions={route.coordinates}
      pathOptions={{
        color: '#2563eb',
        weight: 5,
        opacity: 0.9,
        lineCap: 'round',
        lineJoin: 'round',
      }}
    />
  );
}

function createCarIcon(vehicle, selected, hasSelection) {
  const statusClass = vehicle.status === 'idle' ? 'is-idle' : 'is-active';
  return divIcon({
    className: `fleet-car-marker ${selected ? 'is-selected' : ''} ${hasSelection && !selected ? 'is-dimmed' : ''}`,
    iconSize: [34, 58],
    iconAnchor: [17, 29],
    html: `<div class="fleet-car ${statusClass}" style="--bearing:${vehicle.bearing || 0}deg"><span class="fleet-car__body"></span><span class="fleet-car__glass fleet-car__glass--front"></span><span class="fleet-car__glass fleet-car__glass--rear"></span><span class="fleet-car__wheel fleet-car__wheel--left"></span><span class="fleet-car__wheel fleet-car__wheel--right"></span><span class="fleet-car__headlights"></span><span class="fleet-car__taillights"></span>${vehicle.status !== 'idle' ? '<span class="fleet-car__signal"></span>' : ''}</div>`,
  });
}

function AnimatedVehicleMarker({ vehicle, selectedDriverId }) {
  const [position, setPosition] = useState([
    vehicle.latitude,
    vehicle.longitude,
  ]);
  const currentPosition = useRef(position);
  const frame = useRef(null);

  useEffect(() => {
    const start = currentPosition.current;
    const end = [vehicle.latitude, vehicle.longitude];
    const startedAt = performance.now();
    if (frame.current) cancelAnimationFrame(frame.current);

    const animate = (now) => {
      const progress = Math.min((now - startedAt) / 1400, 1);
      const eased = 1 - (1 - progress) ** 3;
      const next = [
        start[0] + (end[0] - start[0]) * eased,
        start[1] + (end[1] - start[1]) * eased,
      ];
      currentPosition.current = next;
      setPosition(next);
      if (progress < 1) frame.current = requestAnimationFrame(animate);
    };

    frame.current = requestAnimationFrame(animate);
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [vehicle.latitude, vehicle.longitude]);

  return (
    <Marker
      position={position}
      icon={createCarIcon(
        vehicle,
        selectedDriverId === vehicle.driverId,
        Boolean(selectedDriverId),
      )}
    />
  );
}

export default function MapCanvas({
  isDarkMode,
  selectionMode,
  pickup,
  destination,
  onMapSelection,
  selectedDriverId,
}) {
  const { vehicles } = useFleet();
  const [tileLayer, setTileLayer] = useState('street');
  const [routeSummary, setRouteSummary] = useState(null);
  const fleet =
    Object.keys(vehicles).length > 0 ? Object.values(vehicles) : demoVehicles;

  return (
    <div className="absolute inset-0 h-full w-full overflow-hidden">
      <div className="fleet-map-fallback" aria-hidden="true">
        <div className="fleet-map-fallback__label fleet-map-fallback__label--city">
          SAN FRANCISCO
        </div>
        <div className="fleet-map-fallback__label fleet-map-fallback__label--district">
          SOMA
        </div>
        <div className="fleet-map-fallback__label fleet-map-fallback__label--water">
          BAY
        </div>
        <svg viewBox="0 0 1000 700" preserveAspectRatio="none">
          <path d="M-20 560 C 180 470 280 585 430 395 S 740 125 1030 205" />
          <path d="M-20 175 C 185 250 250 115 470 230 S 770 520 1030 455" />
          <path d="M155 -20 C 195 155 105 325 270 720" />
          <path d="M390 -20 C 350 165 520 350 435 720" />
          <path d="M670 -20 C 610 190 790 360 690 720" />
          <path d="M875 -20 C 820 190 965 395 860 720" />
          <path
            className="fleet-map-fallback__minor-road"
            d="M20 355 C 220 285 330 420 510 305 S 800 230 1020 330"
          />
          <path
            className="fleet-map-fallback__minor-road"
            d="M80 80 C 270 170 430 70 600 190 S 760 550 980 610"
          />
        </svg>
      </div>
      <MapContainer
        center={SAN_FRANCISCO_CENTER}
        zoom={14}
        zoomControl={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution={TILE_LAYERS[tileLayer].attribution}
          url={TILE_LAYERS[tileLayer].url}
        />
        <MapClickHandler onMapSelection={onMapSelection} />
        <RouteLayer
          pickup={pickup}
          destination={destination}
          onRouteUpdate={setRouteSummary}
        />
        {fleet.map((vehicle, index) => (
          <AnimatedVehicleMarker
            key={vehicle.driverId || index}
            vehicle={vehicle}
            selectedDriverId={selectedDriverId}
          />
        ))}
        <Marker
          position={[pickup.latitude, pickup.longitude]}
          icon={divIcon({
            className: 'pickup-marker',
            html: '<div class="pickup-marker__pin">P</div>',
            iconSize: [28, 28],
            iconAnchor: [14, 28],
          })}
        />
        <Marker
          position={[destination.latitude, destination.longitude]}
          icon={divIcon({
            className: 'destination-marker',
            html: '<div class="destination-marker__pin">D</div>',
            iconSize: [28, 28],
            iconAnchor: [14, 28],
          })}
        />
      </MapContainer>
      <div className="absolute right-4 top-4 z-[401] flex items-center gap-1 rounded-xl border border-white/70 bg-white/90 p-1 shadow-lg backdrop-blur-md">
        {Object.entries(TILE_LAYERS).map(([id, layer]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTileLayer(id)}
            className={`rounded-lg px-2.5 py-1.5 text-[10px] font-semibold ${tileLayer === id ? 'bg-zinc-900 text-white' : 'text-zinc-600 hover:bg-zinc-100'}`}
          >
            {layer.label}
          </button>
        ))}
      </div>
      {routeSummary && (
        <div className="absolute bottom-20 right-8 z-[401] rounded-xl border border-white/80 bg-white/95 px-3 py-2 shadow-lg backdrop-blur-md">
          <div className="flex items-baseline gap-3">
            <span className="text-sm font-bold text-zinc-900">
              {routeSummary.distanceKm.toFixed(1)} km
            </span>
            <span className="text-xs font-semibold text-blue-600">
              {formatDuration(routeSummary.durationSeconds)}
            </span>
          </div>
          <p className="mt-0.5 text-[10px] text-zinc-500">
            {routeSummary.isFallback
              ? 'Estimated direct route'
              : 'Driving route'}
          </p>
        </div>
      )}
      <div className="absolute bottom-20 left-1/2 z-[401] -translate-x-1/2 rounded-full border border-white/70 bg-white/90 px-3 py-1.5 text-[10px] font-semibold text-zinc-600 shadow-lg backdrop-blur-md">
        Click map to set {selectionMode === 'pickup' ? 'pickup' : 'destination'}
      </div>
      <div className="pointer-events-none absolute inset-0 z-[400] border border-black/10" />
      <div className="pointer-events-none absolute left-[61%] top-[51%] z-[400] h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full border border-emerald-400/40 bg-emerald-400/[0.05]" />
      <div className="pointer-events-none absolute left-[61%] top-[51%] z-[400] -translate-x-1/2 -translate-y-1/2 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-700/80">
        Service area
      </div>
      <div
        className={`absolute bottom-8 right-8 z-[401] flex items-center gap-2 rounded-full border px-3 py-2 text-[10px] font-medium shadow-xl backdrop-blur-md ${isDarkMode ? 'border-white/10 bg-zinc-950/85 text-zinc-400' : 'border-white/70 bg-white/90 text-zinc-600'}`}
      >
        <MapPin className="h-3.5 w-3.5 text-emerald-500" />
        <span>Pickup zone</span>
        <Navigation className="ml-2 h-3.5 w-3.5 text-sky-500" />
        <span>Live fleet</span>
      </div>
    </div>
  );
}
