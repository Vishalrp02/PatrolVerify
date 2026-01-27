"use server";
import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

// Configuration: Duty duration in hours
const DUTY_DURATION_HOURS = 8;

/**
 * Check and reset guard routes that have exceeded duty duration
 * This should be called periodically (e.g., every hour via cron or on dashboard load)
 */
export async function checkAndResetExpiredDuties() {
  try {
    const eightHoursAgo = new Date(Date.now() - DUTY_DURATION_HOURS * 60 * 60 * 1000);
    
    // Find guards with active route assignments older than 8 hours
    const expiredAssignments = await db.guardRouteAssignment.findMany({
      where: {
        isActive: true,
        assignedAt: {
          lt: eightHoursAgo
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            username: true
          }
        },
        route: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    if (expiredAssignments.length === 0) {
      return { success: true, message: "No expired duties found", resetCount: 0 };
    }

    // Deactivate expired assignments
    const resetResult = await db.guardRouteAssignment.updateMany({
      where: {
        id: {
          in: expiredAssignments.map(assignment => assignment.id)
        }
      },
      data: {
        isActive: false
      }
    });

    // Log the reset for audit purposes
    console.log(`Reset ${resetResult.count} expired guard route assignments after ${DUTY_DURATION_HOURS} hours`);
    
    // Revalidate admin dashboard to show updated status
    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/guard-routes");

    return {
      success: true,
      message: `Reset ${resetResult.count} expired guard assignments`,
      resetCount: resetResult.count,
      resetAssignments: expiredAssignments.map(assignment => ({
        guardName: assignment.user.name,
        guardUsername: assignment.user.username,
        routeName: assignment.route.name,
        assignedAt: assignment.assignedAt,
        dutyDuration: Math.round((Date.now() - assignment.assignedAt.getTime()) / (60 * 60 * 1000))
      }))
    };
  } catch (error) {
    console.error("Error checking expired duties:", error);
    return { success: false, error: "Failed to check expired duties" };
  }
}

/**
 * Get guards with their duty status and time remaining
 */
export async function getGuardsWithDutyStatus() {
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

    const eightHoursInMs = DUTY_DURATION_HOURS * 60 * 60 * 1000;
    
    return guards.map(guard => {
      const activeAssignment = guard.guardRoutes[0];
      
      if (!activeAssignment) {
        return {
          id: guard.id,
          name: guard.name,
          username: guard.username,
          assignedRoute: null,
          status: "UNASSIGNED",
          timeRemaining: null,
          assignedAt: null
        };
      }

      const timeElapsed = Date.now() - activeAssignment.assignedAt.getTime();
      const timeRemaining = Math.max(0, eightHoursInMs - timeElapsed);
      const hoursRemaining = timeRemaining / (60 * 60 * 1000);
      
      let status = "ACTIVE";
      if (timeRemaining === 0) {
        status = "EXPIRED";
      } else if (hoursRemaining <= 1) {
        status = "EXPIRING_SOON";
      }

      return {
        id: guard.id,
        name: guard.name,
        username: guard.username,
        assignedRoute: activeAssignment.route,
        status,
        timeRemaining: {
          hours: Math.floor(hoursRemaining),
          minutes: Math.floor((hoursRemaining % 1) * 60),
          totalMinutes: Math.floor(timeRemaining / (60 * 1000))
        },
        assignedAt: activeAssignment.assignedAt
      };
    });
  } catch (error) {
    console.error("Error getting guards with duty status:", error);
    return [];
  }
}

/**
 * Manually reset a specific guard's duty
 */
export async function resetGuardDuty(guardId) {
  try {
    const result = await db.guardRouteAssignment.updateMany({
      where: {
        userId: guardId,
        isActive: true
      },
      data: {
        isActive: false
      }
    });

    revalidatePath("/admin/dashboard");
    revalidatePath("/admin/guard-routes");

    return {
      success: true,
      message: `Reset duty for guard`,
      resetCount: result.count
    };
  } catch (error) {
    console.error("Error resetting guard duty:", error);
    return { success: false, error: "Failed to reset guard duty" };
  }
}

/**
 * Get duty statistics for dashboard
 */
export async function getDutyStatistics() {
  try {
    const guards = await getGuardsWithDutyStatus();
    
    const stats = {
      total: guards.length,
      unassigned: guards.filter(g => g.status === "UNASSIGNED").length,
      active: guards.filter(g => g.status === "ACTIVE").length,
      expiringSoon: guards.filter(g => g.status === "EXPIRING_SOON").length,
      expired: guards.filter(g => g.status === "EXPIRED").length
    };

    return stats;
  } catch (error) {
    console.error("Error getting duty statistics:", error);
    return {
      total: 0,
      unassigned: 0,
      active: 0,
      expiringSoon: 0,
      expired: 0
    };
  }
}
