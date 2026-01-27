import { NextResponse } from "next/server";
import { resetGuardDuty } from "@/app/actions/routeReset";

// POST - Reset guard duty
export async function POST(request) {
  try {
    const { searchParams } = new URL(request.url);
    const guardId = searchParams.get("guardId");

    if (!guardId) {
      return NextResponse.json(
        { error: "Guard ID is required" },
        { status: 400 }
      );
    }

    const result = await resetGuardDuty(guardId);

    if (result.success) {
      return NextResponse.json({ message: "Guard duty reset successfully" });
    } else {
      return NextResponse.json(
        { error: result.error || "Failed to reset guard duty" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error resetting guard duty:", error);
    return NextResponse.json(
      { error: "Failed to reset guard duty" },
      { status: 500 }
    );
  }
}
