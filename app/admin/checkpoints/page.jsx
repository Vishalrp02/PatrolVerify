import { db } from "@/lib/db";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import CheckpointManager from "@/components/CheckpointManager";
import QRCodePrinter from "@/components/QRCodePrinter";
import { generateCheckpointQR } from "@/lib/qr-generator";
import { logoutAction } from "@/app/actions/auth";

// Ensure the page always shows live data
export const dynamic = "force-dynamic";

export default async function CheckpointsPage() {
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

  // Fetch all checkpoints with their sites
  const checkpoints = await db.checkpoint.findMany({
    include: { site: true },
    orderBy: [{ site: { name: "asc" } }, { name: "asc" }]
  });

  // Fetch all sites for the dropdown
  const sites = await db.site.findMany({
    orderBy: { name: "asc" }
  });

  // Generate QR codes for all checkpoints
  const checkpointsWithQR = await Promise.all(
    checkpoints.map(async (checkpoint) => ({
      ...checkpoint,
      qrCode: await generateCheckpointQR(checkpoint.id)
    }))
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Checkpoint Management</h1>
              <p className="text-sm text-gray-500">Create checkpoints and generate QR codes</p>
            </div>
            <div className="flex gap-3">
              <a 
                href="/admin/guard-routes"
                className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition text-sm font-medium"
              >
                👥 Assign Routes
              </a>
              <a 
                href="/admin/dashboard"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium"
              >
                ← Back to Dashboard
              </a>
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
          </div>
        </header>

        <CheckpointManager 
          checkpoints={checkpointsWithQR} 
          sites={sites} 
        />

        {/* QR Code Printing Section */}
        {checkpointsWithQR.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Print & Download QR Codes</h2>
            <QRCodePrinter checkpoints={checkpointsWithQR} />
          </div>
        )}
      </div>
    </div>
  );
}
