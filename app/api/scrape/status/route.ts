import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()

    // Get recent scraping logs
    const { data: logs } = await supabase
      .from("scraping_logs")
      .select(`
        *,
        provider:providers(name)
      `)
      .order("started_at", { ascending: false })
      .limit(20)

    // Get summary statistics
    const { data: stats } = await supabase
      .from("scraping_logs")
      .select("status, provider_id")
      .gte("started_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()) // Last 24 hours

    const summary = {
      totalRuns: stats?.length || 0,
      successful: stats?.filter((s) => s.status === "completed").length || 0,
      failed: stats?.filter((s) => s.status === "failed").length || 0,
      running: stats?.filter((s) => s.status === "running").length || 0,
    }

    return NextResponse.json({
      success: true,
      summary,
      recentLogs: logs || [],
    })
  } catch (error) {
    console.error("Error fetching scraping status:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch scraping status",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
