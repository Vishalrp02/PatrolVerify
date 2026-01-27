import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET - Fetch all sites
export async function GET() {
  try {
    const sites = await db.site.findMany({
      include: {
        checkpoints: {
          select: { id: true }
        }
      },
      orderBy: { name: "asc" }
    });

    return NextResponse.json(sites);
  } catch (error) {
    console.error("Error fetching sites:", error);
    return NextResponse.json(
      { error: "Failed to fetch sites" },
      { status: 500 }
    );
  }
}

// POST - Create new site
export async function POST(request) {
  try {
    const { name } = await request.json();

    if (!name || name.trim() === "") {
      return NextResponse.json(
        { error: "Site name is required" },
        { status: 400 }
      );
    }

    const site = await db.site.create({
      data: { name: name.trim() }
    });

    return NextResponse.json(site, { status: 201 });
  } catch (error) {
    console.error("Error creating site:", error);
    return NextResponse.json(
      { error: "Failed to create site" },
      { status: 500 }
    );
  }
}

// DELETE - Delete site
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Site ID is required" },
        { status: 400 }
      );
    }

    // Check if site exists
    const existingSite = await db.site.findUnique({
      where: { id },
      include: {
        checkpoints: {
          select: { id: true }
        }
      }
    });

    if (!existingSite) {
      return NextResponse.json(
        { error: "Site not found" },
        { status: 404 }
      );
    }

    // Prevent deletion if site has checkpoints
    if (existingSite.checkpoints.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete site with checkpoints" },
        { status: 400 }
      );
    }

    await db.site.delete({
      where: { id }
    });

    return NextResponse.json({ message: "Site deleted successfully" });
  } catch (error) {
    console.error("Error deleting site:", error);
    return NextResponse.json(
      { error: "Failed to delete site" },
      { status: 500 }
    );
  }
}
