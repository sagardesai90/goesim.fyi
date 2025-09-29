import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
    try {
        const { planIds } = await request.json()

        if (!planIds || !Array.isArray(planIds)) {
            return NextResponse.json(
                { error: "planIds array is required" },
                { status: 400 }
            )
        }

        const supabase = await createClient()

        // Get all affiliate links for the provided plan IDs in one query
        const { data: affiliateLinks, error } = await supabase
            .from("affiliate_links")
            .select("id, plan_id, affiliate_url")
            .in("plan_id", planIds)
            .eq("is_active", true)

        if (error) {
            console.error("Error fetching affiliate links:", error)
            return NextResponse.json(
                { error: "Failed to fetch affiliate links" },
                { status: 500 }
            )
        }

        // Convert to a map for easy lookup
        const linksMap = affiliateLinks.reduce((acc, link) => {
            acc[link.plan_id] = {
                id: link.id,
                affiliateUrl: link.affiliate_url
            }
            return acc
        }, {} as Record<string, { id: string; affiliateUrl: string }>)

        return NextResponse.json({
            success: true,
            affiliateLinks: linksMap
        })
    } catch (error) {
        console.error("Error in affiliate links batch endpoint:", error)
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        )
    }
}

