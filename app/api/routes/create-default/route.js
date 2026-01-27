import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST() {
  try {
    // Check if any routes exist
    const existingRoutes = await db.patrolRoute.count();
    
    if (existingRoutes > 0) {
      return NextResponse.json({ 
        message: "Routes already exist", 
        count: existingRoutes 
      });
    }

    // Get first checkpoint
    const checkpoint = await db.checkpoint.findFirst();
    
    if (!checkpoint) {
      return NextResponse.json(
        { error: "No checkpoints found. Please create checkpoints first." },
        { status: 400 }
      );
    }

    // Create default route
    const defaultRoute = await db.patrolRoute.create({
      data: {
        name: "Default Patrol Route",
        isDefault: true,
        routeCheckpoints: {
          create: {
            checkpointId: checkpoint.id,
            order: 1
          }
        }
      },
      include: {
        routeCheckpoints: {
          include: {
            checkpoint: true
          }
        }
      }
    });

    return NextResponse.json({ 
      message: "Default route created successfully",
      route: defaultRoute
    });
  } catch (error) {
    console.error("Error creating default route:", error);
    return NextResponse.json(
      { error: "Failed to create default route" },
      { status: 500 }
    );
  }
}
