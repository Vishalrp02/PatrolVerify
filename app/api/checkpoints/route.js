import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET - Fetch all checkpoints
export async function GET() {
  try {
    const checkpoints = await db.checkpoint.findMany({
      include: { site: true },
      orderBy: [{ site: { name: "asc" } }, { name: "asc" }]
    });

    return NextResponse.json(checkpoints);
  } catch (error) {
    console.error("Error fetching checkpoints:", error);
    return NextResponse.json(
      { error: "Failed to fetch checkpoints" },
      { status: 500 }
    );
  }
}

// POST - Create new checkpoint
export async function POST(request) {
  try {
    const { name, siteId, latitude, longitude } = await request.json();

    if (!name || !siteId || latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate site exists
    const site = await db.site.findUnique({
      where: { id: siteId }
    });

    if (!site) {
      return NextResponse.json(
        { error: "Site not found" },
        { status: 404 }
      );
    }

    const checkpoint = await db.checkpoint.create({
      data: {
        name,
        siteId,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude)
      },
      include: { site: true }
    });

    return NextResponse.json(checkpoint, { status: 201 });
  } catch (error) {
    console.error("Error creating checkpoint:", error);
    return NextResponse.json(
      { error: "Failed to create checkpoint" },
      { status: 500 }
    );
  }
}

// PUT - Update checkpoint
export async function PUT(request) {
  try {
    const { id, name, siteId, latitude, longitude } = await request.json();

    if (!id || !name || !siteId || latitude === undefined || longitude === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate checkpoint exists
    const existingCheckpoint = await db.checkpoint.findUnique({
      where: { id }
    });

    if (!existingCheckpoint) {
      return NextResponse.json(
        { error: "Checkpoint not found" },
        { status: 404 }
      );
    }

    // Validate site exists
    const site = await db.site.findUnique({
      where: { id: siteId }
    });

    if (!site) {
      return NextResponse.json(
        { error: "Site not found" },
        { status: 404 }
      );
    }

    const checkpoint = await db.checkpoint.update({
      where: { id },
      data: {
        name,
        siteId,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude)
      },
      include: { site: true }
    });

    return NextResponse.json(checkpoint);
  } catch (error) {
    console.error("Error updating checkpoint:", error);
    return NextResponse.json(
      { error: "Failed to update checkpoint" },
      { status: 500 }
    );
  }
}

// DELETE - Delete checkpoint
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Checkpoint ID is required" },
        { status: 400 }
      );
    }

    // Check if checkpoint exists
    const existingCheckpoint = await db.checkpoint.findUnique({
      where: { id }
    });

    if (!existingCheckpoint) {
      return NextResponse.json(
        { error: "Checkpoint not found" },
        { status: 404 }
      );
    }

    // Check if checkpoint has any logs (prevent deletion if it has patrol history)
    const logCount = await db.patrolLog.count({
      where: { checkpointId: id }
    });

    if (logCount > 0) {
      return NextResponse.json(
        { error: "Cannot delete checkpoint with patrol history" },
        { status: 400 }
      );
    }

    await db.checkpoint.delete({
      where: { id }
    });

    return NextResponse.json({ message: "Checkpoint deleted successfully" });
  } catch (error) {
    console.error("Error deleting checkpoint:", error);
    return NextResponse.json(
      { error: "Failed to delete checkpoint" },
      { status: 500 }
    );
  }
}
