"use server";
import { db } from "@/lib/db";

/**
 * Get the assigned route for a specific guard
 */
export async function getGuardAssignedRoute(userId) {
  try {
    const assignment = await db.guardRouteAssignment.findFirst({
      where: {
        userId: userId,
        isActive: true
      },
      include: {
        route: {
          include: {
            routeCheckpoints: {
              orderBy: { order: "asc" },
              include: { checkpoint: true }
            }
          }
        }
      }
    });

    if (!assignment) {
      return null;
    }

    return {
      id: assignment.route.id,
      name: assignment.route.name,
      checkpoints: assignment.route.routeCheckpoints.map(rc => ({
        id: rc.checkpoint.id,
        name: rc.checkpoint.name,
        latitude: rc.checkpoint.latitude,
        longitude: rc.checkpoint.longitude,
        order: rc.order
      }))
    };
  } catch (error) {
    console.error("Error getting guard assigned route:", error);
    return null;
  }
}

/**
 * Get all guards with their assigned routes
 */
export async function getGuardsWithRoutes() {
  try {
    const guards = await db.user.findMany({
      where: { role: "GUARD" },
      include: {
        guardRoutes: {
          where: { isActive: true },
          include: {
            route: {
              select: { id: true, name: true }
            }
          }
        }
      },
      orderBy: { name: "asc" }
    });

    return guards.map(guard => ({
      id: guard.id,
      name: guard.name,
      username: guard.username,
      assignedRoute: guard.guardRoutes[0]?.route || null
    }));
  } catch (error) {
    console.error("Error getting guards with routes:", error);
    return [];
  }
}

/**
 * Assign a route to a guard
 */
export async function assignRouteToGuard(userId, routeId) {
  try {
    console.log("Assigning route:", { userId, routeId });
    
    // Check if route exists
    const route = await db.patrolRoute.findUnique({
      where: { id: routeId }
    });
    
    if (!route) {
      console.error("Route not found:", routeId);
      return { success: false, error: "Route not found" };
    }
    
    console.log("Found route:", route.name);

    // Check if assignment already exists
    const existingAssignment = await db.guardRouteAssignment.findFirst({
      where: {
        userId,
        routeId
      }
    });
    
    console.log("Existing assignment:", existingAssignment);

    // Deactivate any existing assignments for this guard
    const deactivateResult = await db.guardRouteAssignment.updateMany({
      where: { userId },
      data: { isActive: false }
    });
    
    console.log("Deactivated existing assignments:", deactivateResult.count);

    // Create or update assignment using upsert to handle unique constraint
    const assignment = await db.guardRouteAssignment.upsert({
      where: {
        userId_routeId: {
          userId,
          routeId
        }
      },
      update: {
        isActive: true,
        assignedAt: new Date()
      },
      create: {
        userId,
        routeId,
        isActive: true
      }
    });

    console.log("Created/updated assignment:", assignment.id);

    // Note: revalidatePath removed to prevent rendering error
    // Dashboard will revalidate automatically due to dynamic rendering
    
    return { success: true, assignment };
  } catch (error) {
    console.error("Error assigning route to guard:", error);
    
    // Handle specific Prisma errors
    if (error.code === 'P2002') {
      return { success: false, error: "This assignment already exists" };
    }
    
    return { success: false, error: "Failed to assign route" };
  }
}

/**
 * Remove route assignment from guard
 */
export async function removeGuardRouteAssignment(userId) {
  try {
    await db.guardRouteAssignment.updateMany({
      where: { userId },
      data: { isActive: false }
    });

    // Note: revalidatePath removed to prevent rendering error
    // Dashboard will revalidate automatically due to dynamic rendering
    
    return { success: true };
  } catch (error) {
    console.error("Error removing guard route assignment:", error);
    return { success: false, error: "Failed to remove assignment" };
  }
}

/**
 * Get next checkpoint for guard based on their patrol history
 */
export async function getNextCheckpointForGuard(userId) {
  try {
    // Get guard's assigned route
    const assignedRoute = await getGuardAssignedRoute(userId);
    if (!assignedRoute || assignedRoute.checkpoints.length === 0) {
      return null;
    }

    // Get today's patrol logs for this guard
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayLogs = await db.patrolLog.findMany({
      where: {
        userId: userId,
        scannedAt: {
          gte: today
        }
      },
      include: { checkpoint: true },
      orderBy: { scannedAt: "asc" }
    });

    // Find which checkpoints have been scanned today
    const scannedCheckpointIds = new Set(
      todayLogs.map(log => log.checkpointId)
    );

    // Find the first checkpoint that hasn't been scanned
    for (const checkpoint of assignedRoute.checkpoints) {
      if (!scannedCheckpointIds.has(checkpoint.id)) {
        return checkpoint;
      }
    }

    // If all checkpoints have been scanned, return the first one (new patrol cycle)
    return assignedRoute.checkpoints[0];
  } catch (error) {
    console.error("Error getting next checkpoint for guard:", error);
    return null;
  }
}

/**
 * Get all available routes
 */
export async function getAllRoutes() {
  try {
    const routes = await db.patrolRoute.findMany({
      include: {
        routeCheckpoints: {
          orderBy: { order: "asc" },
          include: { checkpoint: true }
        }
      },
      orderBy: { name: "asc" }
    });

    return routes.map(route => ({
      id: route.id,
      name: route.name,
      isDefault: route.isDefault,
      checkpointCount: route.routeCheckpoints.length,
      checkpoints: route.routeCheckpoints.map(rc => ({
        id: rc.checkpoint.id,
        name: rc.checkpoint.name,
        order: rc.order
      }))
    }));
  } catch (error) {
    console.error("Error getting all routes:", error);
    return [];
  }
}
