"use client";
import { MapContainer, TileLayer, Polyline, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  iconSize: [20, 32],
  iconAnchor: [10, 32],
});

export default function RoutePreviewMap({ checkpoints = [] }) {
  const positions = checkpoints
    .filter((c) => c.latitude != null && c.longitude != null)
    .map((c) => [c.latitude, c.longitude]);

  const center =
    positions.length > 0
      ? positions[Math.floor(positions.length / 2)]
      : [40.7128, -74.006];

  return (
    <div className="h-full w-full">
      <MapContainer
        center={center}
        zoom={positions.length > 1 ? 14 : 12}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {positions.length > 1 && (
          <Polyline
            positions={positions}
            pathOptions={{ color: "#2563eb", weight: 4 }}
          />
        )}
        {checkpoints.map(
          (cp, i) =>
            cp.latitude != null &&
            cp.longitude != null && (
              <Marker
                key={cp.id}
                position={[cp.latitude, cp.longitude]}
                icon={markerIcon}
              >
                <Popup>
                  <strong>{i + 1}. {cp.name}</strong>
                </Popup>
              </Marker>
            )
        )}
      </MapContainer>
    </div>
  );
}
