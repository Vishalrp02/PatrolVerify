"use client";
import { useState } from "react";
import { toast } from "sonner";
import { User, MapPin, Route, CheckCircle, XCircle, Clock, AlertTriangle, RefreshCw } from "lucide-react";

export default function GuardRouteManager({ guards = [], routes = [] }) {
  const [editingGuard, setEditingGuard] = useState(null);
  const [selectedRoutes, setSelectedRoutes] = useState({}); // Store selected route for each guard

  const handleAssignRoute = async (guardId, routeId) => {
    if (!routeId) {
      toast.error("Please select a route");
      return;
    }
    
    try {
      const response = await fetch("/api/guard-routes/assign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ guardId, routeId }),
      });
      
      if (response.ok) {
        toast.success("Route assigned successfully!");
        setEditingGuard(null);
        setSelectedRoutes(prev => ({ ...prev, [guardId]: "" })); // Clear selection for this guard
        window.location.reload(); // Refresh to show updated data
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to assign route");
      }
    } catch (error) {
      toast.error("Network error");
    }
  };

  const handleCreateDefaultRoute = async () => {
    try {
      const response = await fetch("/api/routes/create-default", {
        method: "POST",
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(result.message);
        window.location.reload(); // Refresh to show new route
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to create default route");
      }
    } catch (error) {
      toast.error("Network error");
    }
  };

  const handleResetDuty = async (guardId) => {
    if (!confirm("Are you sure you want to reset this guard's duty? This will unassign their route.")) return;

    try {
      const response = await fetch(`/api/guard-routes/reset?guardId=${guardId}`, {
        method: "POST",
      });

      if (response.ok) {
        toast.success("Guard duty reset successfully!");
        window.location.reload(); // Refresh to show updated data
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to reset duty");
      }
    } catch (error) {
      toast.error("Network error");
    }
  };

  const startEdit = (guard) => {
    setEditingGuard(guard.id);
    setSelectedRoutes(prev => ({ 
      ...prev, 
      [guard.id]: guard.assignedRoute?.id || "" 
    }));
  };

  const cancelEdit = () => {
    setEditingGuard(null);
    // Don't clear all selections, just stop editing
  };

  // Statistics
  const assignedGuards = guards.filter(g => g.status !== "UNASSIGNED").length;
  const unassignedGuards = guards.filter(g => g.status === "UNASSIGNED").length;
  const expiringSoon = guards.filter(g => g.status === "EXPIRING_SOON").length;
  const expired = guards.filter(g => g.status === "EXPIRED").length;

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 text-blue-600 rounded-full p-2">
              <User size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{guards.length}</p>
              <p className="text-sm text-gray-500">Total Guards</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 text-green-600 rounded-full p-2">
              <CheckCircle size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{assignedGuards}</p>
              <p className="text-sm text-gray-500">On Duty</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="bg-orange-100 text-orange-600 rounded-full p-2">
              <Clock size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{expiringSoon}</p>
              <p className="text-sm text-gray-500">Expiring Soon</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center gap-3">
            <div className="bg-red-100 text-red-600 rounded-full p-2">
              <XCircle size={24} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{unassignedGuards + expired}</p>
              <p className="text-sm text-gray-500">Unassigned</p>
            </div>
          </div>
        </div>
      </div>

      {/* Guards List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <h3 className="font-semibold text-gray-700">Guard Assignments</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 font-medium">
              <tr>
                <th className="px-6 py-3">Guard</th>
                <th className="px-6 py-3">Username</th>
                <th className="px-6 py-3">Assigned Route</th>
                <th className="px-6 py-3">Duty Status</th>
                <th className="px-6 py-3">Time Remaining</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {guards.map((guard) => (
                <tr key={guard.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100 text-blue-600 rounded-full p-2">
                        <User size={16} />
                      </div>
                      <span className="font-medium text-gray-900">{guard.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-gray-400 font-mono text-xs">{guard.username}</span>
                  </td>
                  <td className="px-6 py-4">
                    {editingGuard === guard.id ? (
                      <select
                        value={selectedRoutes[guard.id] || ""}
                        onChange={(e) => setSelectedRoutes(prev => ({ 
                          ...prev, 
                          [guard.id]: e.target.value 
                        }))}
                        className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                      >
                        <option value="">No Route</option>
                        {routes.map((route) => (
                          <option key={route.id} value={route.id}>
                            {route.name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div>
                        {guard.assignedRoute ? (
                          <div className="flex items-center gap-2">
                            <Route size={16} className="text-green-600" />
                            <span className="font-medium text-green-600">{guard.assignedRoute.name}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <XCircle size={16} className="text-gray-400" />
                            <span className="text-gray-400">Not Assigned</span>
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {guard.status === "UNASSIGNED" ? (
                      <div className="flex items-center gap-2">
                        <XCircle size={16} className="text-gray-400" />
                        <span className="text-gray-400">Unassigned</span>
                      </div>
                    ) : guard.status === "ACTIVE" ? (
                      <div className="flex items-center gap-2">
                        <CheckCircle size={16} className="text-green-600" />
                        <span className="text-green-600 font-medium">On Duty</span>
                      </div>
                    ) : guard.status === "EXPIRING_SOON" ? (
                      <div className="flex items-center gap-2">
                        <Clock size={16} className="text-orange-600" />
                        <span className="text-orange-600 font-medium">Expiring Soon</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <AlertTriangle size={16} className="text-red-600" />
                        <span className="text-red-600 font-medium">Expired</span>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {guard.timeRemaining ? (
                      <div className="text-sm">
                        <span className={`font-medium ${
                          guard.status === "EXPIRING_SOON" ? "text-orange-600" : 
                          guard.status === "EXPIRED" ? "text-red-600" : "text-gray-700"
                        }`}>
                          {guard.timeRemaining.hours}h {guard.timeRemaining.minutes}m
                        </span>
                        <div className="text-xs text-gray-500">
                          Assigned {guard.assignedAt && new Date(guard.assignedAt).toLocaleDateString()}
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {editingGuard === guard.id ? (
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleAssignRoute(guard.id, selectedRoutes[guard.id])}
                          className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 transition"
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="bg-gray-200 text-gray-700 px-3 py-1 rounded text-xs hover:bg-gray-300 transition"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => startEdit(guard)}
                          className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 transition flex items-center gap-1"
                        >
                          <Route size={12} />
                          Assign
                        </button>
                        {guard.status !== "UNASSIGNED" && (
                          <button
                            onClick={() => handleResetDuty(guard.id)}
                            className="bg-orange-600 text-white px-3 py-1 rounded text-xs hover:bg-orange-700 transition flex items-center gap-1"
                          >
                            <RefreshCw size={12} />
                            Reset
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {guards.length === 0 && (
          <div className="text-center py-12">
            <User size={48} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No guards found</h3>
            <p className="text-gray-500">Create guard accounts to assign routes</p>
          </div>
        )}
      </div>

      {/* Available Routes Summary */}
      {routes.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-700 mb-4">Available Patrol Routes</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {routes.map((route) => (
              <div key={route.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Route size={16} className="text-blue-600" />
                  <h4 className="font-medium text-gray-900">{route.name}</h4>
                  {route.isDefault && (
                    <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded text-xs font-medium">
                      Default
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-600">
                  {route.checkpointCount} checkpoints
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="text-center">
            <Route size={48} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Patrol Routes Found</h3>
            <p className="text-gray-500 mb-4">Create patrol routes to assign to guards</p>
            <button
              onClick={handleCreateDefaultRoute}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Create Default Route
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
