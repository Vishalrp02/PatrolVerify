"use client"; // <--- This magic line makes it work
import dynamic from "next/dynamic";

// This imports the map ONLY on the client side (browser), skipping the server
const PatrolMap = dynamic(() => import("./PatrolMap"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-gray-100 flex items-center justify-center text-gray-400">
      Loading Map...
    </div>
  ),
});

export default function MapLoader({ logs, guardLocations = [] }) {
  return <PatrolMap logs={logs} guardLocations={guardLocations} />;
}
