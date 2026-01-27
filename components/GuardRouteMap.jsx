"use client";
import { MapContainer, TileLayer, Polyline, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import styles from "./GuardRouteMap.module.css";

const checkpointIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// Next checkpoint icon (highlighted)
const nextCheckpointIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  iconSize: [30, 49],
  iconAnchor: [15, 49],
  className: "next-checkpoint-marker"
});

export default function GuardRouteMap({ route, nextCheckpoint }) {
  const checkpoints = route?.checkpoints ?? [];
  const positions = checkpoints
    .filter((c) => c.latitude != null && c.longitude != null)
    .map((c) => [c.latitude, c.longitude]);

  const center =
    positions.length > 0
      ? positions[0]
      : [40.7128, -74.006];

  return (
    <div className="h-full w-full rounded-xl overflow-hidden border border-gray-200">
      <MapContainer
        center={center}
        zoom={positions.length > 1 ? 15 : 14}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%", minHeight: "320px" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {positions.length > 1 && (
          <Polyline
            positions={positions}
            pathOptions={{ color: "#2563eb", weight: 5 }}
          />
        )}
        {checkpoints.map(
          (cp, i) =>
            cp.latitude != null &&
            cp.longitude != null && (
              <Marker
                key={cp.id}
                position={[cp.latitude, cp.longitude]}
                icon={nextCheckpoint?.id === cp.id ? nextCheckpointIcon : checkpointIcon}
              >
                <Popup>
                  <div className={nextCheckpoint?.id === cp.id ? "text-blue-600" : ""}>
                    <strong>
                      {nextCheckpoint?.id === cp.id ? "🎯 NEXT: " : ""}Checkpoint {i + 1}: {cp.name}
                    </strong>
                    {nextCheckpoint?.id === cp.id && (
                      <div className="text-blue-600 text-sm font-medium mt-1">
                        Your next checkpoint!
                      </div>
                    )}
                    <br />
                    <span className="text-gray-500 text-xs">Scan the QR here</span>
                  </div>
                </Popup>
              </Marker>
            )
        )}
      </MapContainer>
    </div>
  );
}
