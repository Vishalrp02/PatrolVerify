"use client";
import { useState } from "react";
import { Toaster } from "sonner";
import dynamic from "next/dynamic";
import IncidentRecorder from "@/components/IncidentRecorder";
import LiveLocationPing from "@/components/LiveLocationPing";
import { logoutAction } from "@/app/actions/auth";
import { LogOut, MapPin } from "lucide-react";

const Scanner = dynamic(() => import("@/components/Scanner"), { ssr: false });
const GuardRouteMap = dynamic(() => import("@/components/GuardRouteMap"), {
  ssr: false,
  loading: () => (
    <div className="h-[320px] bg-gray-100 rounded-xl flex items-center justify-center text-gray-500">
      Loading map...
    </div>
  ),
});

export default function GuardDashboard({ userId, userName, patrolRoute, nextCheckpoint }) {
  const [activeTab, setActiveTab] = useState("scan");

  return (
    <div className="min-h-screen bg-gray-50 pb-20 relative">
      <LiveLocationPing userId={userId} />
      <Toaster position="top-center" />

      {/* Top Bar */}
      <div className="bg-white p-4 shadow-sm flex justify-between items-center sticky top-0 z-10">
        <div className="flex flex-col">
          <h1 className="font-bold text-lg text-gray-800">PatrolVerify</h1>
          <span className="text-sm text-gray-500">Hello, {userName ?? "Guard"}</span>
        </div>
        <form action={logoutAction}>
          <button className="p-2 text-gray-500 hover:text-red-600 transition">
            <LogOut size={20} />
          </button>
        </form>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Next Checkpoint Alert */}
        {nextCheckpoint && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 text-white rounded-full p-2">
                <MapPin size={20} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900">Next Checkpoint</h3>
                <p className="text-blue-700 font-medium">{nextCheckpoint.name}</p>
                <p className="text-blue-600 text-sm">
                  Step {nextCheckpoint.order + 1} of {patrolRoute?.checkpoints?.length || 0}
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === "scan" && (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden p-1">
            <div className="bg-gray-50 px-4 py-2 border-b border-gray-100">
              <p className="text-sm text-gray-600 text-center">
                📱 Click "Open Camera" button to scan QR codes
              </p>
            </div>
            <Scanner userId={userId} />
          </div>
        )}
        {activeTab === "report" && (
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="font-semibold text-gray-700 mb-4">
              Report Incident
            </h2>
            <IncidentRecorder userId={userId} />
          </div>
        )}
        {activeTab === "map" && (
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <h2 className="font-semibold text-gray-700 mb-3">Patrol route</h2>
            {patrolRoute?.checkpoints?.length > 0 ? (
              <div className="h-[320px] w-full">
                <GuardRouteMap route={patrolRoute} nextCheckpoint={nextCheckpoint} />
              </div>
            ) : (
              <p className="text-gray-500 text-sm py-8 text-center">
                No route assigned. Your admin will assign a patrol route; it will appear here once saved.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Bottom Tabs */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 flex justify-around p-3 z-50">
        <button
          onClick={() => setActiveTab("scan")}
          className={`flex flex-col items-center gap-1 ${activeTab === "scan" ? "text-blue-600" : "text-gray-400"}`}
        >
          <span className="text-xl">📷</span>
          <span className="text-xs font-medium">Scan</span>
        </button>
        <button
          onClick={() => setActiveTab("map")}
          className={`flex flex-col items-center gap-1 ${activeTab === "map" ? "text-blue-600" : "text-gray-400"}`}
        >
          <span className="text-xl">🗺️</span>
          <span className="text-xs font-medium">Map</span>
        </button>
        <button
          onClick={() => setActiveTab("report")}
          className={`flex flex-col items-center gap-1 ${activeTab === "report" ? "text-red-600" : "text-gray-400"}`}
        >
          <span className="text-xl">🎙️</span>
          <span className="text-xs font-medium">Report</span>
        </button>
      </div>
    </div>
  );
}
