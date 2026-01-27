"use server";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

// Calculate distance in meters
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function submitScan(checkpointId, userId, userLat, userLong) {
  try {
    const checkpoint = await db.checkpoint.findUnique({
      where: { id: checkpointId },
    });
    if (!checkpoint) return { success: false, message: "Invalid QR" };

    const distance = getDistance(
      userLat,
      userLong,
      checkpoint.latitude,
      checkpoint.longitude,
    );
    const isVerified = distance <= 50; // 50 meters tolerance

    await db.patrolLog.create({
      data: {
        userId,
        checkpointId,
        gpsLat: userLat,
        gpsLong: userLong,
        isVerified,
      },
    });

    revalidatePath("/admin/dashboard");
    return {
      success: true,
      verified: isVerified,
      distance: Math.round(distance),
    };
  } catch (e) {
    return { success: false, message: "Server Error" };
  }
}
