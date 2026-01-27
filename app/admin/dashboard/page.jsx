import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import MapLoader from "@/components/MapLoader";
import RouteBuilderSection from "@/components/RouteBuilderSection";
import { getRouteBuilderData } from "@/app/actions/route";
import { checkAndResetExpiredDuties } from "@/app/actions/routeReset";
import { logoutAction } from "@/app/actions/auth";

// Ensure the dashboard always shows live data
export const dynamic = "force-dynamic";

// Force revalidation every 30 seconds for near real-time updates
export const revalidate = 30;

// Configuration: Define active guard timeout (in minutes)
const ACTIVE_GUARD_TIMEOUT_MINUTES = 5;

export default async function Dashboard() {
  // Validate admin access from database
  const cookieStore = await cookies();
  const userId = cookieStore.get("userId")?.value;

  if (!userId) {
    redirect("/login");
  }

  const user = await db.user.findUnique({
    where: { id: userId },
    select: { role: true }
  });

  if (!user || user.role !== "ADMIN") {
    redirect("/");
  }

  // Check and reset expired duties on dashboard load
  await checkAndResetExpiredDuties();
  // 0. Route builder data (for patrol route section)
  let routeData = { route: null, checkpoints: [] };
  try {
    routeData = await getRouteBuilderData();
  } catch {
    // Route tables may not exist yet
  }

  // 1. Fetch Patrol Logs (with user for map)
  const logs = await db.patrolLog.findMany({
    orderBy: { scannedAt: "desc" },
    take: 50,
    include: { checkpoint: true, user: true },
  });

  // 2. Fetch live guard locations (active guards only)
  let guardLocations = [];
  try {
    if (db.guardLocation) {
      // Define active as location updated within specified timeout
      const timeoutMinutesAgo = new Date(Date.now() - ACTIVE_GUARD_TIMEOUT_MINUTES * 60 * 1000);
      
      guardLocations = await db.guardLocation.findMany({
        where: {
          updatedAt: {
            gte: timeoutMinutesAgo
          }
        },
        include: { user: true },
      });
    }
  } catch {
    // GuardLocation table may not exist yet
  }

  // 3. Fetch Incidents
  const incidents = await db.incident.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <header className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Command Center</h1>
            <p className="text-sm text-gray-500">
              Live Operations Dashboard • {guardLocations.length} Active Guards
            </p>
          </div>
          <div className="flex items-center gap-3">
            <a 
              href="/admin/guard-routes"
              className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition text-sm font-medium"
            >
              👥 Assign Routes
            </a>
            <a 
              href="/admin/checkpoints"
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition text-sm font-medium"
            >
              📱 Manage Checkpoints
            </a>
            <div className="bg-white px-3 py-1 rounded border text-xs font-mono">
              Status: <span className="text-green-500">● LIVE</span>
              <span className="ml-2 text-gray-400">
                ({ACTIVE_GUARD_TIMEOUT_MINUTES} min activity filter)
              </span>
              <span className="ml-2 text-blue-500">
                8h duty reset
              </span>
            </div>
            <form action={logoutAction}>
              <button
                type="submit"
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition text-sm font-medium flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </form>
          </div>
        </header>

        {/* Active Guard Info */}
        {guardLocations.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <span className="text-blue-600 text-lg">●</span>
              <span className="text-sm text-blue-800">
                Showing <strong>{guardLocations.length}</strong> active guards 
                (updated within {ACTIVE_GUARD_TIMEOUT_MINUTES} minutes)
              </span>
            </div>
          </div>
        )}

        {/* Recent Scan Activity */}
        {logs.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-green-600 text-lg">📱</span>
                <div>
                  <h3 className="font-semibold text-green-800">Recent Patrol Activity</h3>
                  <p className="text-sm text-green-600">
                    Last scan: <strong>{logs[0]?.checkpoint?.name}</strong> by <strong>{logs[0]?.user?.name}</strong> at {logs[0] && new Date(logs[0].scannedAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>
              <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                {logs.filter(log => log.isVerified).length} Verified
              </div>
            </div>
          </div>
        )}

        {/* Top Section: Map & Incidents */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map Column */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden h-[500px]">
            {/* We use the MapLoader here, passing the data down */}
            <MapLoader logs={logs} guardLocations={guardLocations} />
          </div>

          {/* Incidents Column */}
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 h-[500px] overflow-y-auto">
            <h2 className="font-semibold text-gray-700 mb-3 sticky top-0 bg-white pb-2 border-b">
              Recent Alerts
            </h2>
            <div className="space-y-3">
              {incidents.length === 0 ? (
                <p className="text-gray-400 text-sm text-center mt-10">
                  No incidents reported.
                </p>
              ) : (
                incidents.map((inc) => {
                  const summary = inc.aiSummary || "Incident";
                  const isHigh = summary.startsWith("[HIGH]");
                  const isMed = summary.startsWith("[MED]");
                  return (
                    <div
                      key={inc.id}
                      className="p-3 border rounded-lg bg-gray-50 text-sm"
                    >
                      <div className="flex justify-between items-center mb-1">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide
                          ${
                            isHigh
                              ? "bg-red-100 text-red-700"
                              : isMed
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {isHigh ? "HIGH" : isMed ? "MED" : "LOW"}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(inc.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="font-medium text-gray-900">
                        {summary.replace(/^\[(HIGH|MED|LOW)\] /, "")}
                      </p>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {inc.description}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Patrol Route Section (admin defines route for guards) */}
        <RouteBuilderSection
          initialRoute={routeData.route}
          checkpoints={routeData.checkpoints}
        />

        {/* Bottom Section: Logs Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
            <div>
              <h3 className="font-semibold text-gray-700 text-sm">
                Recent Patrol Scans
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                Latest checkpoint scans by guards
              </p>
            </div>
            <div className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-medium">
              {logs.length} Recent Scans
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-500 font-medium">
                <tr>
                  <th className="px-6 py-3 w-32">Time</th>
                  <th className="px-6 py-3">Guard</th>
                  <th className="px-6 py-3">Checkpoint</th>
                  <th className="px-6 py-3">Location</th>
                  <th className="px-6 py-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {logs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-3 font-mono text-gray-500 text-xs">
                      {new Date(log.scannedAt).toLocaleTimeString()}
                    </td>
                    <td className="px-6 py-3">
                      <div>
                        <p className="font-medium text-gray-900">
                          {log.user?.name || "Unknown"}
                        </p>
                        <p className="text-xs text-gray-400 font-mono">
                          {log.userId.slice(0, 8)}...
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-3 font-medium text-gray-900">
                      {log.checkpoint?.name || "Unknown"}
                    </td>
                    <td className="px-6 py-3 text-xs">
                      {log.gpsLat && log.gpsLong ? (
                        <span className="text-green-600">
                          ✓ GPS {log.isVerified ? "Verified" : "Flagged"}
                        </span>
                      ) : (
                        <span className="text-gray-400">No GPS</span>
                      )}
                    </td>
                    <td className="px-6 py-3 text-right">
                      {log.isVerified ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                          Verified
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-100">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                          Failed
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
