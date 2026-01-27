"use client";
import { useState } from "react";
import { Printer, Download } from "lucide-react";

export default function QRCodePrinter({ checkpoints = [] }) {
  const [selectedCheckpoints, setSelectedCheckpoints] = useState([]);
  const [isPrinting, setIsPrinting] = useState(false);

  const toggleSelection = (checkpointId) => {
    setSelectedCheckpoints(prev => 
      prev.includes(checkpointId)
        ? prev.filter(id => id !== checkpointId)
        : [...prev, checkpointId]
    );
  };

  const selectAll = () => {
    setSelectedCheckpoints(checkpoints.map(cp => cp.id));
  };

  const clearSelection = () => {
    setSelectedCheckpoints([]);
  };

  const printSelected = () => {
    if (selectedCheckpoints.length === 0) {
      alert("Please select at least one checkpoint");
      return;
    }

    setIsPrinting(true);
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    
    const selectedData = checkpoints.filter(cp => 
      selectedCheckpoints.includes(cp.id)
    );

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Checkpoint QR Codes</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 20px; 
              display: flex;
              flex-wrap: wrap;
              gap: 20px;
            }
            .qr-card {
              border: 2px solid #333;
              border-radius: 8px;
              padding: 15px;
              text-align: center;
              width: 200px;
              page-break-inside: avoid;
            }
            .qr-title {
              font-weight: bold;
              font-size: 14px;
              margin-bottom: 10px;
            }
            .qr-subtitle {
              font-size: 12px;
              color: #666;
              margin-bottom: 10px;
            }
            .qr-image {
              width: 150px;
              height: 150px;
              margin: 10px 0;
            }
            .qr-coords {
              font-size: 10px;
              color: #999;
              margin-top: 5px;
            }
            @media print {
              body { margin: 10px; }
              .qr-card { 
                border: 1px solid #000; 
                margin: 5px;
                width: 180px;
              }
              .qr-image { width: 120px; height: 120px; }
            }
          </style>
        </head>
        <body>
          ${selectedData.map(checkpoint => `
            <div class="qr-card">
              <div class="qr-title">${checkpoint.name}</div>
              <div class="qr-subtitle">${checkpoint.site?.name || 'Unknown Site'}</div>
              <img src="${checkpoint.qrCode}" alt="QR Code" class="qr-image">
              <div class="qr-coords">${checkpoint.latitude.toFixed(4)}, ${checkpoint.longitude.toFixed(4)}</div>
            </div>
          `).join('')}
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    
    printWindow.onload = () => {
      printWindow.print();
      printWindow.close();
      setIsPrinting(false);
    };
  };

  const downloadAllAsZip = async () => {
    if (selectedCheckpoints.length === 0) {
      alert("Please select at least one checkpoint");
      return;
    }

    // Create a simple download for each selected QR
    const selectedData = checkpoints.filter(cp => 
      selectedCheckpoints.includes(cp.id)
    );

    selectedData.forEach((checkpoint, index) => {
      setTimeout(() => {
        const link = document.createElement('a');
        link.download = `${checkpoint.name.replace(/\s+/g, '_')}_QR.png`;
        link.href = checkpoint.qrCode;
        link.click();
      }, index * 200); // Stagger downloads
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Print QR Codes</h3>
        <div className="flex gap-2">
          <button
            onClick={selectAll}
            className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 transition"
          >
            Select All
          </button>
          <button
            onClick={clearSelection}
            className="bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-300 transition"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Selection Summary */}
      <div className="mb-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          {selectedCheckpoints.length} of {checkpoints.length} checkpoints selected
        </p>
      </div>

      {/* Action Buttons */}
      {selectedCheckpoints.length > 0 && (
        <div className="flex gap-3 mb-6">
          <button
            onClick={printSelected}
            disabled={isPrinting}
            className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition disabled:bg-gray-300 flex items-center justify-center gap-2"
          >
            <Printer size={18} />
            {isPrinting ? "Preparing..." : "Print Selected"}
          </button>
          <button
            onClick={downloadAllAsZip}
            className="flex-1 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition flex items-center justify-center gap-2"
          >
            <Download size={18} />
            Download Selected
          </button>
        </div>
      )}

      {/* Checkpoint Selection Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {checkpoints.map((checkpoint) => (
          <div
            key={checkpoint.id}
            className={`border rounded-lg p-3 cursor-pointer transition-all ${
              selectedCheckpoints.includes(checkpoint.id)
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 hover:border-gray-300"
            }`}
            onClick={() => toggleSelection(checkpoint.id)}
          >
            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={selectedCheckpoints.includes(checkpoint.id)}
                onChange={() => toggleSelection(checkpoint.id)}
                className="mt-1"
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-gray-900 truncate">
                  {checkpoint.name}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {checkpoint.site?.name}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
