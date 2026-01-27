"use server";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

/** Get the default patrol route with checkpoints in order (for guard map) */
export async function getDefaultPatrolRoute() {
  try {
    if (!db.patrolRoute) return null;
    const route = await db.patrolRoute.findFirst({
      where: { isDefault: true },
      include: {
        routeCheckpoints: {
          orderBy: { order: "asc" },
          include: { checkpoint: true },
        },
      },
    });
    if (!route) return null;
    return {
      id: route.id,
      name: route.name,
      checkpoints: route.routeCheckpoints.map((rc) => ({
        id: rc.checkpoint.id,
        name: rc.checkpoint.name,
        latitude: rc.checkpoint.latitude,
        longitude: rc.checkpoint.longitude,
        order: rc.order,
      })),
    };
  } catch {
    return null;
  }
}

/** Admin: get default route + all checkpoints (for route builder) */
export async function getRouteBuilderData() {
  try {
    if (!db.patrolRoute) {
      const checkpoints = await db.checkpoint.findMany({
        include: { site: true },
        orderBy: [{ site: { name: "asc" } }, { name: "asc" }],
      });
      return {
        route: null,
        checkpoints: checkpoints.map((c) => ({
          id: c.id,
          name: c.name,
          latitude: c.latitude,
          longitude: c.longitude,
          siteName: c.site?.name ?? "",
        })),
      };
    }
    const [route, checkpoints] = await Promise.all([
      db.patrolRoute.findFirst({
        where: { isDefault: true },
        include: {
          routeCheckpoints: {
            orderBy: { order: "asc" },
            include: { checkpoint: true },
          },
        },
      }),
      db.checkpoint.findMany({
        include: { site: true },
        orderBy: [{ site: { name: "asc" } }, { name: "asc" }],
      }),
    ]);
    return {
      route: route
        ? {
            id: route.id,
            name: route.name,
            checkpointIds: route.routeCheckpoints.map(
              (rc) => rc.checkpointId
            ),
          }
        : null,
      checkpoints: checkpoints.map((c) => ({
        id: c.id,
        name: c.name,
        latitude: c.latitude,
        longitude: c.longitude,
        siteName: c.site?.name ?? "",
      })),
    };
  } catch {
    return { route: null, checkpoints: [] };
  }
}

/** Admin: save the patrol route (set as default) */
export async function savePatrolRoute(name, checkpointIds) {
  try {
    if (!db.patrolRoute || !db.routeCheckpoint) {
      return { success: false, error: "Route feature not available. Run database migrations." };
    }
    const data = await getRouteBuilderData();
    const existing = data.route;

    let routeId;

    if (existing?.id) {
      await db.routeCheckpoint.deleteMany({ where: { routeId: existing.id } });
      await db.patrolRoute.update({
        where: { id: existing.id },
        data: { name: name || "Default Patrol Route", isDefault: true },
      });
      routeId = existing.id;
    } else {
      await db.patrolRoute.updateMany({
        data: { isDefault: false },
      });
      const route = await db.patrolRoute.create({
        data: {
          name: name || "Default Patrol Route",
          isDefault: true,
        },
      });
      routeId = route.id;
    }

    for (let i = 0; i < checkpointIds.length; i++) {
      await db.routeCheckpoint.create({
        data: {
          routeId,
          checkpointId: checkpointIds[i],
          order: i,
        },
      });
    }

    revalidatePath("/admin/dashboard");
    revalidatePath("/");
    return { success: true };
  } catch (e) {
    console.error("savePatrolRoute:", e);
    return { success: false, error: e?.message };
  }
}
