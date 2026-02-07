import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    // Test database connection
    await db.$queryRaw`SELECT 1`;
    
    // Test environment variables
    const envVars = {
      DATABASE_URL: process.env.DATABASE_URL ? "✅ Set" : "❌ Missing",
      GEMINI_API_KEY: process.env.GEMINI_API_KEY ? "✅ Set" : "❌ Missing",
      ADMIN_ACCESS_KEY: process.env.NEXT_PUBLIC_ADMIN_ACCESS_KEY ? "✅ Set" : "❌ Missing",
    };

    return NextResponse.json({
      status: "success",
      message: "All systems working",
      environment: envVars,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      status: "error",
      message: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
