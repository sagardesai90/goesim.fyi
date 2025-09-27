import { type NextRequest, NextResponse } from "next/server"
import { AffiliateManager } from "@/lib/affiliate/affiliate-manager"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const planId = searchParams.get("planId")

    if (!planId) {
      return NextResponse.json({ error: "Plan ID is required" }, { status: 400 })
    }

    const affiliateLink = await AffiliateManager.getAffiliateLink(planId)

    return NextResponse.json({
      success: true,
      affiliateLink,
    })
  } catch (error) {
    console.error("Error fetching affiliate link:", error)
    return NextResponse.json(
      {
        error: "Failed to fetch affiliate link",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
