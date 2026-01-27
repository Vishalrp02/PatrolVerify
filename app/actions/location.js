"use server";
import { db } from "@/lib/db";

export async function updateGuardLocation(userId, latitude, longitude) {
  if (!userId || latitude == null || longitude == null) return { success: false };
  try {
    if (!db.guardLocation) return { success: false };
    const user = await db.user.findUnique({ where: { id: userId }, select: { id: true } });
    if (!user) return { success: false };
    await db.guardLocation.upsert({
      where: { userId },
      create: { userId, latitude, longitude },
      update: { latitude, longitude },
    });
    return { success: true };
  } catch {
    return { success: false };
  }
}
