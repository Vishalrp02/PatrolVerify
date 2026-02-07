import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Test basic database connection without Prisma
    const response = await fetch('https://api.supabase.io/rest/v1/', {
      headers: {
        'apikey': process.env.SUPABASE_ANON_KEY || 'test',
        'Authorization': `Bearer ${process.env.SUPABASE_ANON_KEY || 'test'}`
      }
    });
    
    return NextResponse.json({
      status: "success",
      database_url: process.env.DATABASE_URL ? "✅ Set" : "❌ Missing",
      database_url_preview: process.env.DATABASE_URL?.substring(0, 20) + "...",
      supabase_test: response.ok ? "✅ Connected" : "❌ Failed",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      status: "error",
      message: error.message,
      database_url: process.env.DATABASE_URL ? "✅ Set" : "❌ Missing",
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
