"use client";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

const checkpointIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// Guard marker: badge/person icon so it looks like a guard on the map
const liveGuardIcon = L.divIcon({
  className: "live-guard-marker",
  html: `<div style="
    width: 40px; height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(180deg, #1e40af 0%, #1e3a8a 100%);
    border: 3px solid white;
    border-radius: 50%;
    box-shadow: 0 2px 8px rgba(0,0,0,0.4);
    font-size: 22px;
    line-height: 1;
  ">👮</div>`,
  iconSize: [40, 40],
  iconAnchor: [20, 20],
});

export default function PatrolMap({ logs = [], guardLocations = [] }) {
  const hasLive = guardLocations.length > 0;
  const hasLogs = logs.some((l) => l.gpsLat);
  const center = hasLive
    ? [guardLocations[0].latitude, guardLocations[0].longitude]
    : hasLogs && logs[0]?.gpsLat
      ? [logs[0].gpsLat, logs[0].gpsLong]
      : [40.7128, -74.006];

  return (
    <div className="h-96 w-full rounded-xl overflow-hidden border shadow-sm z-0 relative">
      <MapContainer
        center={center}
        zoom={15}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {/* Live guard locations */}
        {guardLocations.map(
          (loc) =>
            loc.user && (
              <Marker
                key={loc.id}
                position={[loc.latitude, loc.longitude]}
                icon={liveGuardIcon}
              >
                <Popup>
                  <div className="flex items-center gap-2">
                    <span className="text-green-500 text-lg">●</span>
                    <strong className="text-blue-600">Active · {loc.user.name}</strong>
                  </div>
                  <br />
                  <span className="text-gray-500 text-xs">
                    Last seen: {new Date(loc.updatedAt).toLocaleTimeString()}
                  </span>
                  <br />
                  <span className="text-green-600 text-xs font-medium">
                    ● Currently Active
                  </span>
                </Popup>
              </Marker>
            )
        )}
        {/* Checkpoint scan history */}
        {logs.map(
          (log) =>
            log.gpsLat &&
            log.user && (
              <Marker
                key={log.id}
                position={[log.gpsLat, log.gpsLong]}
                icon={checkpointIcon}
              >
                <Popup>
                  <strong>{log.user.name}</strong> <br />
                  {new Date(log.scannedAt).toLocaleTimeString()} <br />
                  Status: {log.isVerified ? "✅ Verified" : "❌ Flagged"}
                </Popup>
              </Marker>
            )
        )}
      </MapContainer>
    </div>
  );
}
