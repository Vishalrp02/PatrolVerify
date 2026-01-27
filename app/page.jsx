import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import GuardDashboard from "@/components/GuardDashboard";
import { getDefaultPatrolRoute } from "@/app/actions/route";
import { getGuardAssignedRoute, getNextCheckpointForGuard } from "@/app/actions/guardRoutes";
import { db } from "@/lib/db";

export default async function Home() {
  const cookieStore = await cookies();

  const userId = cookieStore.get("userId")?.value;
  const userName = cookieStore.get("userName")?.value ?? "Guard";

  if (!userId) {
    redirect("/login");
  }

  // Validate role from database (not just cookie)
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { role: true, name: true }
  });

  if (!user) {
    redirect("/login");
  }

  // Redirect to admin dashboard if user is admin
  if (user.role === "ADMIN") {
    redirect("/admin/dashboard");
  }

  let patrolRoute = null;
  let nextCheckpoint = null;
  try {
    // Try to get guard's assigned route first
    patrolRoute = await getGuardAssignedRoute(userId);
    
    if (patrolRoute) {
      // Get next checkpoint for this guard
      nextCheckpoint = await getNextCheckpointForGuard(userId);
    } else {
      // Fallback to default route if no assignment
      patrolRoute = await getDefaultPatrolRoute();
    }
  } catch {
    // Route feature may not be set up yet
  }

  return (
    <GuardDashboard
      userId={userId}
      userName={user.name}
      patrolRoute={patrolRoute}
      nextCheckpoint={nextCheckpoint}
    />
  );
}
