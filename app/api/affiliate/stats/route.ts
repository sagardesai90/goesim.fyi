import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()

    // Get overall affiliate stats
    const { data: stats, error } = await supabase.rpc("get_affiliate_stats")

    if (error) {
      throw error
    }

    // Get recent clicks (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

    const { data: recentClicks, error: clicksError } = await supabase
      .from("affiliate_clicks")
      .select(`
        clicked_at,
        affiliate_link:affiliate_links(
          provider:providers(name)
        )
      `)
      .gte("clicked_at", thirtyDaysAgo)
      .order("clicked_at", { ascending: false })
      .limit(100)

    if (clicksError) {
      throw clicksError
    }

    // Calculate daily click trends
    const clickTrends = recentClicks?.reduce(
      (acc, click) => {
        const date = new Date(click.clicked_at).toISOString().split("T")[0]
        acc[date] = (acc[date] || 0) + 1
        return acc
      },
      {} as Record<string, number>,
    )

    return NextResponse.json({
      success: true,
      stats: stats || [],
      recentClicks: recentClicks || [],
      clickTrends: clickTrends || {},
    })
  } catch (error) {
    console.error("Error fetching affiliate stats:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch affiliate stats",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
