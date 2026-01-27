"use client";
import { useState, useMemo } from "react";
import { savePatrolRoute } from "@/app/actions/route";
import { toast } from "sonner";
import { ChevronUp, ChevronDown, Trash2, MapPin, Loader2 } from "lucide-react";
import dynamic from "next/dynamic";

const RoutePreviewMap = dynamic(
  () => import("@/components/RoutePreviewMap"),
  { ssr: false, loading: () => <div className="h-full bg-gray-100 flex items-center justify-center text-gray-400 text-sm">Loading map...</div> }
);

export default function RouteBuilderSection({ initialRoute, checkpoints: allCheckpoints }) {
  const [routeName, setRouteName] = useState(initialRoute?.name ?? "Default Patrol Route");
  const [orderedIds, setOrderedIds] = useState(initialRoute?.checkpointIds ?? []);
  const [saving, setSaving] = useState(false);

  const routeCheckpoints = useMemo(() => {
    const byId = Object.fromEntries(allCheckpoints.map((c) => [c.id, c]));
    return orderedIds.map((id) => byId[id]).filter(Boolean);
  }, [orderedIds, allCheckpoints]);

  const availableCheckpoints = useMemo(
    () => allCheckpoints.filter((c) => !orderedIds.includes(c.id)),
    [allCheckpoints, orderedIds]
  );

  const addToRoute = (checkpointId) => {
    setOrderedIds((prev) => [...prev, checkpointId]);
  };

  const removeFromRoute = (index) => {
    setOrderedIds((prev) => prev.filter((_, i) => i !== index));
  };

  const moveUp = (index) => {
    if (index <= 0) return;
    setOrderedIds((prev) => {
      const next = [...prev];
      [next[index - 1], next[index]] = [next[index], next[index - 1]];
      return next;
    });
  };

  const moveDown = (index) => {
    if (index >= orderedIds.length - 1) return;
    setOrderedIds((prev) => {
      const next = [...prev];
      [next[index], next[index + 1]] = [next[index + 1], next[index]];
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    const result = await savePatrolRoute(routeName, orderedIds);
    setSaving(false);
    if (result.success) {
      toast.success("Patrol route saved. Guards will see this route on their map.");
    } else {
      toast.error(result.error || "Failed to save route.");
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
        <h3 className="font-semibold text-gray-700 text-sm">Patrol Route (for guards)</h3>
      </div>
      <div className="p-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Route name</label>
            <input
              type="text"
              value={routeName}
              onChange={(e) => setRouteName(e.target.value)}
              className="w-full p-2 border rounded-lg text-gray-900 text-sm"
            />
          </div>
          <div>
            <span className="text-xs font-medium text-gray-500">Route order (first → last)</span>
            <ul className="mt-1 border rounded-lg divide-y divide-gray-100 max-h-48 overflow-y-auto">
              {routeCheckpoints.length === 0 ? (
                <li className="p-3 text-gray-400 text-sm">No checkpoints. Add from the list on the right.</li>
              ) : (
                routeCheckpoints.map((cp, index) => (
                  <li
                    key={cp.id}
                    className="flex items-center justify-between gap-2 p-2 hover:bg-gray-50"
                  >
                    <span className="flex items-center gap-2 text-sm text-gray-900">
                      <span className="text-gray-400 font-mono w-5">{index + 1}.</span>
                      <MapPin className="w-4 h-4 text-green-600" />
                      {cp.name}
                      {cp.siteName ? (
                        <span className="text-gray-400 text-xs">({cp.siteName})</span>
                      ) : null}
                    </span>
                    <div className="flex items-center gap-0.5">
                      <button
                        type="button"
                        onClick={() => moveUp(index)}
                        disabled={index === 0}
                        className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-30"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveDown(index)}
                        disabled={index === routeCheckpoints.length - 1}
                        className="p-1 text-gray-500 hover:text-gray-700 disabled:opacity-30"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeFromRoute(index)}
                        className="p-1 text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
          <div>
            <span className="text-xs font-medium text-gray-500">Available checkpoints</span>
            <ul className="mt-1 border rounded-lg divide-y divide-gray-100 max-h-32 overflow-y-auto">
              {availableCheckpoints.length === 0 ? (
                <li className="p-3 text-gray-400 text-sm">All checkpoints are in the route.</li>
              ) : (
                availableCheckpoints.map((cp) => (
                  <li key={cp.id} className="flex items-center justify-between p-2 hover:bg-gray-50">
                    <span className="text-sm text-gray-700">
                      {cp.name}
                      {cp.siteName ? (
                        <span className="text-gray-400 text-xs"> ({cp.siteName})</span>
                      ) : null}
                    </span>
                    <button
                      type="button"
                      onClick={() => addToRoute(cp.id)}
                      className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700"
                    >
                      Add
                    </button>
                  </li>
                ))
              )}
            </ul>
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || orderedIds.length === 0}
            className="w-full bg-green-600 text-white py-2 rounded-lg font-medium text-sm hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Save patrol route
          </button>
        </div>
        <div className="h-64 lg:h-auto min-h-[200px] rounded-lg overflow-hidden border border-gray-200">
          <RoutePreviewMap checkpoints={routeCheckpoints} />
        </div>
      </div>
    </div>
  );
}
