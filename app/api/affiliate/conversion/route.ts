import { type NextRequest, NextResponse } from "next/server"
import { AffiliateManager } from "@/lib/affiliate/affiliate-manager"

export async function POST(request: NextRequest) {
  try {
    const { affiliateLinkId, revenue } = await request.json()

    if (!affiliateLinkId || revenue === undefined) {
      return NextResponse.json({ error: "Affiliate link ID and revenue are required" }, { status: 400 })
    }

    const success = await AffiliateManager.recordConversion(affiliateLinkId, revenue)

    if (success) {
      return NextResponse.json({ success: true, message: "Conversion recorded successfully" })
    } else {
      return NextResponse.json({ error: "Failed to record conversion" }, { status: 500 })
    }
  } catch (error) {
    console.error("Error recording conversion:", error)
    return NextResponse.json(
      {
        error: "Failed to record conversion",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
