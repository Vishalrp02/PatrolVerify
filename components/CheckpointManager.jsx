"use client";
import { useState } from "react";
import { toast } from "sonner";
import { Plus, Download, MapPin, Building, QrCode, Trash2, Edit } from "lucide-react";

export default function CheckpointManager({ checkpoints = [], sites = [] }) {
  const [isCreating, setIsCreating] = useState(false);
  const [editingCheckpoint, setEditingCheckpoint] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    siteId: "",
    latitude: "",
    longitude: ""
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.siteId || !formData.latitude || !formData.longitude) {
      toast.error("Please fill all fields");
      return;
    }

    try {
      const url = editingCheckpoint ? "/api/checkpoints" : "/api/checkpoints";
      const method = editingCheckpoint ? "PUT" : "POST";
      
      const payload = editingCheckpoint 
        ? { ...formData, id: editingCheckpoint.id }
        : formData;

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success(editingCheckpoint ? "Checkpoint updated!" : "Checkpoint created!");
        setIsCreating(false);
        setEditingCheckpoint(null);
        setFormData({ name: "", siteId: "", latitude: "", longitude: "" });
        window.location.reload(); // Refresh to show new data
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to save checkpoint");
      }
    } catch (error) {
      toast.error("Network error");
    }
  };

  const handleDelete = async (checkpointId) => {
    if (!confirm("Are you sure you want to delete this checkpoint?")) return;

    try {
      const response = await fetch(`/api/checkpoints?id=${checkpointId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Checkpoint deleted!");
        window.location.reload(); // Refresh to show updated data
      } else {
        const error = await response.json();
        toast.error(error.message || "Failed to delete checkpoint");
      }
    } catch (error) {
      toast.error("Network error");
    }
  };

  const downloadQR = (checkpoint, qrCode) => {
    const link = document.createElement("a");
    link.download = `${checkpoint.name.replace(/\s+/g, "_")}_QR.png`;
    link.href = qrCode;
    link.click();
  };

  const startEdit = (checkpoint) => {
    setEditingCheckpoint(checkpoint);
    setFormData({
      name: checkpoint.name,
      siteId: checkpoint.siteId,
      latitude: checkpoint.latitude.toString(),
      longitude: checkpoint.longitude.toString()
    });
    setIsCreating(true);
  };

  return (
    <div className="space-y-6">
      {/* Create/Edit Form */}
      {(isCreating || editingCheckpoint) && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {editingCheckpoint ? "Edit Checkpoint" : "Create New Checkpoint"}
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Checkpoint Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g., Main Entrance"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Site
                </label>
                <select
                  value={formData.siteId}
                  onChange={(e) => setFormData({ ...formData, siteId: e.target.value })}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                >
                  <option value="">Select a site</option>
                  {sites.map((site) => (
                    <option key={site.id} value={site.id}>
                      {site.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Latitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.latitude}
                  onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g., 40.7128"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Longitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.longitude}
                  onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="e.g., -74.0060"
                  required
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
              >
                {editingCheckpoint ? "Update Checkpoint" : "Create Checkpoint"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsCreating(false);
                  setEditingCheckpoint(null);
                  setFormData({ name: "", siteId: "", latitude: "", longitude: "" });
                }}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Create Button */}
      {!isCreating && !editingCheckpoint && (
        <button
          onClick={() => setIsCreating(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
        >
          <Plus size={20} />
          Create New Checkpoint
        </button>
      )}

      {/* Checkpoints List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {checkpoints.map((checkpoint) => (
          <div
            key={checkpoint.id}
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
          >
            {/* QR Code */}
            <div className="p-4 bg-gray-50 flex justify-center">
              {checkpoint.qrCode ? (
                <div className="relative">
                  <img
                    src={checkpoint.qrCode}
                    alt={`${checkpoint.name} QR Code`}
                    className="w-32 h-32"
                  />
                  <div className="absolute -top-2 -right-2 bg-blue-600 text-white rounded-full p-1">
                    <QrCode size={16} />
                  </div>
                </div>
              ) : (
                <div className="w-32 h-32 bg-gray-200 rounded-lg flex items-center justify-center">
                  <QrCode size={32} className="text-gray-400" />
                </div>
              )}
            </div>

            {/* Checkpoint Info */}
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 mb-2">{checkpoint.name}</h3>
              
              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <div className="flex items-center gap-2">
                  <Building size={14} />
                  <span>{checkpoint.site?.name || "Unknown Site"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={14} />
                  <span>{checkpoint.latitude.toFixed(4)}, {checkpoint.longitude.toFixed(4)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => downloadQR(checkpoint, checkpoint.qrCode)}
                  disabled={!checkpoint.qrCode}
                  className="flex-1 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700 transition disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                >
                  <Download size={16} />
                  QR
                </button>
                <button
                  onClick={() => startEdit(checkpoint)}
                  className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-1"
                >
                  <Edit size={16} />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(checkpoint.id)}
                  className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 transition"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {checkpoints.length === 0 && (
        <div className="text-center py-12">
          <QrCode size={48} className="text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No checkpoints yet</h3>
          <p className="text-gray-500 mb-4">Create your first checkpoint to get started</p>
          <button
            onClick={() => setIsCreating(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Create Checkpoint
          </button>
        </div>
      )}
    </div>
  );
}
