import { type NextRequest, NextResponse } from "next/server"
import { AffiliateManager } from "@/lib/affiliate/affiliate-manager"

export async function POST(request: NextRequest) {
  try {
    const { affiliateLinkId } = await request.json()

    if (!affiliateLinkId) {
      return NextResponse.json({ error: "Affiliate link ID is required" }, { status: 400 })
    }

    // Extract click data from request
    const userIp = request.ip || request.headers.get("x-forwarded-for") || "unknown"
    const userAgent = request.headers.get("user-agent") || "unknown"
    const referrer = request.headers.get("referer") || "direct"

    // You could also get country from IP using a service like MaxMind
    const countryCode = request.headers.get("cf-ipcountry") || "unknown" // Cloudflare header

    const clickData = {
      userIp,
      userAgent,
      referrer,
      countryCode,
    }

    const success = await AffiliateManager.trackClick(affiliateLinkId, clickData)

    if (success) {
      return NextResponse.json({ success: true, message: "Click tracked successfully" })
    } else {
      return NextResponse.json({ error: "Failed to track click" }, { status: 500 })
    }
  } catch (error) {
    console.error("Error tracking affiliate click:", error)
    return NextResponse.json(
      {
        error: "Failed to track click",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
