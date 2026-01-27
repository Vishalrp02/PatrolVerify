"use client";
import { Scanner } from "@yudiel/react-qr-scanner";
import { useState, useEffect } from "react";
import { submitScan } from "@/app/actions/patrol";
import { toast } from "sonner";
import { MapPin, Camera, AlertTriangle } from "lucide-react";

export default function PatrolScanner({ userId }) {
  const [coords, setCoords] = useState(null);
  const [isScanning, setIsScanning] = useState(false); // Start with camera closed
  const [scanResult, setScanResult] = useState(null);

  // 1. GPS Tracking Hook
  useEffect(() => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by this browser.");
      return;
    }

    // Watch position allows high-accuracy tracking as guard walks
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setCoords({
          lat: pos.coords.latitude,
          long: pos.coords.longitude,
          accuracy: pos.coords.accuracy, // Useful for debugging
        });
      },
      (err) => {
        console.error("GPS Error:", err);
        toast.error("GPS Signal Lost. Please move outdoors.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  // 2. Handle Scan Logic
  const handleScan = async (result) => {
    // Note: Library returns array of results
    const rawValue = result?.[0]?.rawValue;

    if (!rawValue) return;

    // Block scan if no GPS
    if (!coords) {
      toast.warning("Waiting for GPS signal...", {
        description: "Please wait for the satellite icon to turn green.",
      });
      return;
    }

    try {
      setScanResult(rawValue);
      setIsScanning(false); // Close camera after successful scan

      const response = await submitScan(rawValue, userId, coords.lat, coords.long);

      if (response.success) {
        toast.success("✅ Checkpoint scanned!", {
          description: response.verified
            ? `Location verified (${response.distance}m from checkpoint)`
            : `Location warning (${response.distance}m from checkpoint)`,
        });
      } else {
        toast.error("❌ Scan failed", {
          description: response.message,
        });
      }
    } catch (error) {
      toast.error("Network error during scan");
      console.error("Scan error:", error);
    }
  };

  // 3. Start Scanning
  const startScanning = () => {
    setScanResult(null);
    setIsScanning(true);
  };

  // 4. Stop Scanning
  const stopScanning = () => {
    setIsScanning(false);
  };

  return (
    <div className="w-full max-w-md mx-auto flex flex-col gap-4">
      {/* Status Bar */}
      <div className="flex items-center justify-between bg-gray-800 text-white p-3 rounded-lg shadow-md">
        <div className="flex items-center gap-2">
          <Camera className="w-5 h-5 text-blue-400" />
          <span className="text-sm font-semibold">
            {isScanning ? "Scanner Active" : "Scanner Ready"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">GPS:</span>
          {coords ? (
            <div className="flex items-center gap-1 text-green-400 text-xs font-mono">
              <MapPin className="w-4 h-4" />
              <span>Ready (±{Math.round(coords.accuracy)}m)</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-red-400 text-xs font-mono animate-pulse">
              <AlertTriangle className="w-4 h-4" />
              <span>Locating...</span>
            </div>
          )}
        </div>
      </div>

      {/* Camera Viewport */}
      <div className="relative overflow-hidden rounded-xl border-4 border-gray-800 shadow-2xl bg-black aspect-square">
        {isScanning ? (
          <>
            <Scanner
              onScan={handleScan}
              components={{ audio: false, finder: false }} // Clean UI
              styles={{ container: { width: "100%", height: "100%" } }}
            />
            
            {/* Stop Scanning Button */}
            <button
              onClick={stopScanning}
              className="absolute top-4 right-4 bg-red-600 text-white p-2 rounded-full shadow-lg hover:bg-red-700 transition"
            >
              <Camera size={20} />
            </button>

            {/* Overlay Target Box */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
              <div className="w-48 h-48 border-2 border-white/50 rounded-lg relative">
                <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-green-500 -mt-1 -ml-1"></div>
                <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-green-500 -mt-1 -mr-1"></div>
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-green-500 -mb-1 -ml-1"></div>
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-green-500 -mb-1 -mr-1"></div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-white bg-gray-900">
            {scanResult ? (
              <div className="text-center">
                <div className="bg-green-600 rounded-full p-4 mb-4">
                  <Camera size={32} />
                </div>
                <p className="text-lg font-semibold mb-2">Scan Complete!</p>
                <p className="text-sm text-gray-400 mb-4">Checkpoint processed successfully</p>
                <button
                  onClick={startScanning}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                  Scan Another
                </button>
              </div>
            ) : (
              <div className="text-center">
                <div className="bg-gray-700 rounded-full p-4 mb-4">
                  <Camera size={32} />
                </div>
                <p className="text-lg font-semibold mb-2">Ready to Scan</p>
                <p className="text-sm text-gray-400 mb-4">Click the button below to open camera</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Scan Button */}
      {!isScanning && (
        <button
          onClick={startScanning}
          disabled={!coords}
          className="w-full bg-blue-600 text-white py-4 rounded-xl font-semibold hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          <Camera size={20} />
          {scanResult ? "Scan Another Checkpoint" : "Open Camera to Scan"}
        </button>
      )}

      <p className="text-center text-xs text-gray-500 mt-2">
        {isScanning 
          ? "Align QR code within the frame to scan automatically."
          : coords 
            ? "GPS ready. Click the button to start scanning."
            : "Waiting for GPS signal before scanning..."
        }
      </p>
    </div>
  );
}
