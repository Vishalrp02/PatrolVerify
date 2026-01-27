import { NextResponse } from "next/server";
import { assignRouteToGuard, removeGuardRouteAssignment } from "@/app/actions/guardRoutes";

// POST - Assign route to guard
export async function POST(request) {
  try {
    const { guardId, routeId } = await request.json();

    if (!guardId) {
      return NextResponse.json(
        { error: "Guard ID is required" },
        { status: 400 }
      );
    }

    if (!routeId) {
      return NextResponse.json(
        { error: "Route ID is required" },
        { status: 400 }
      );
    }

    const result = await assignRouteToGuard(guardId, routeId);

    if (result.success) {
      return NextResponse.json({ message: "Route assigned successfully" });
    } else {
      return NextResponse.json(
        { error: result.error || "Failed to assign route" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error assigning route to guard:", error);
    return NextResponse.json(
      { error: "Failed to assign route" },
      { status: 500 }
    );
  }
}

// DELETE - Remove guard route assignment
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const guardId = searchParams.get("guardId");

    if (!guardId) {
      return NextResponse.json(
        { error: "Guard ID is required" },
        { status: 400 }
      );
    }

    const result = await removeGuardRouteAssignment(guardId);

    if (result.success) {
      return NextResponse.json({ message: "Route assignment removed successfully" });
    } else {
      return NextResponse.json(
        { error: result.error || "Failed to remove assignment" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error removing guard route assignment:", error);
    return NextResponse.json(
      { error: "Failed to remove assignment" },
      { status: 500 }
    );
  }
}
