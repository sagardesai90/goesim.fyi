import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q")
    const country = searchParams.get("country")
    const provider = searchParams.get("provider")
    const minData = searchParams.get("minData")
    const maxData = searchParams.get("maxData")
    const minPrice = searchParams.get("minPrice")
    const maxPrice = searchParams.get("maxPrice")
    const minDays = searchParams.get("minDays")
    const maxDays = searchParams.get("maxDays")
    const unlimited = searchParams.get("unlimited")
    const features = searchParams.get("features")?.split(",") || []
    const sortBy = searchParams.get("sortBy") || "price"
    const sortOrder = searchParams.get("sortOrder") || "asc"
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const offset = Number.parseInt(searchParams.get("offset") || "0")

    const supabase = await createClient()

    // Get IDs of tracked providers
    const { data: trackedProviders } = await supabase
      .from("providers")
      .select("id")
      .in("name", ["Airalo", "Saily", "Holafly"])

    const trackedProviderIds = trackedProviders?.map(p => p.id) || []

    let providerId: string | null = null
    let countryId: string | null = null

    if (provider) {
      const { data: providerData } = await supabase.from("providers").select("id").eq("name", provider).single()
      providerId = providerData?.id || null
    }

    if (country) {
      const { data: countryData } = await supabase.from("countries").select("id").eq("code", country).single()
      countryId = countryData?.id || null
    }

    // Build the query
    let queryBuilder = supabase
      .from("esim_plans")
      .select(`
        *,
        provider:providers(*),
        country:countries(*)
      `)
      .eq("is_active", true)
      .in("provider_id", trackedProviderIds) // Only return plans from tracked providers

    // Text search across plan names and provider names
    if (query) {
      queryBuilder = queryBuilder.or(`name.ilike.%${query}%,providers.name.ilike.%${query}%`)
    }

    if (countryId) {
      queryBuilder = queryBuilder.eq("country_id", countryId)
    }

    if (providerId) {
      queryBuilder = queryBuilder.eq("provider_id", providerId)
    }

    // Data amount filters
    if (minData) {
      queryBuilder = queryBuilder.gte("data_amount_gb", Number.parseFloat(minData))
    }
    if (maxData) {
      queryBuilder = queryBuilder.lte("data_amount_gb", Number.parseFloat(maxData))
    }

    // Price filters
    if (minPrice) {
      queryBuilder = queryBuilder.gte("price_usd", Number.parseFloat(minPrice))
    }
    if (maxPrice) {
      queryBuilder = queryBuilder.lte("price_usd", Number.parseFloat(maxPrice))
    }

    // Validity period filters
    if (minDays) {
      queryBuilder = queryBuilder.gte("validity_days", Number.parseInt(minDays))
    }
    if (maxDays) {
      queryBuilder = queryBuilder.lte("validity_days", Number.parseInt(maxDays))
    }

    // Unlimited filter
    if (unlimited === "true") {
      queryBuilder = queryBuilder.eq("is_unlimited", true)
    } else if (unlimited === "false") {
      queryBuilder = queryBuilder.eq("is_unlimited", false)
    }

    // Feature filters
    if (features.includes("hotspot")) {
      queryBuilder = queryBuilder.eq("hotspot_allowed", true)
    }
    if (features.includes("voice")) {
      queryBuilder = queryBuilder.eq("voice_calls", true)
    }
    if (features.includes("sms")) {
      queryBuilder = queryBuilder.eq("sms_included", true)
    }

    // Sorting
    const sortColumn = getSortColumn(sortBy)
    queryBuilder = queryBuilder.order(sortColumn, { ascending: sortOrder === "asc" })

    // Pagination
    queryBuilder = queryBuilder.range(offset, offset + limit - 1)

    const { data: plans, error, count } = await queryBuilder

    if (error) {
      throw error
    }

    let countQuery = supabase.from("esim_plans").select("*", { count: "exact", head: true }).eq("is_active", true)

    // Apply same filters for count
    if (query) {
      countQuery = countQuery.or(`name.ilike.%${query}%,providers.name.ilike.%${query}%`)
    }
    if (countryId) {
      countQuery = countQuery.eq("country_id", countryId)
    }
    if (providerId) {
      countQuery = countQuery.eq("provider_id", providerId)
    }
    if (minData) {
      countQuery = countQuery.gte("data_amount_gb", Number.parseFloat(minData))
    }
    if (maxData) {
      countQuery = countQuery.lte("data_amount_gb", Number.parseFloat(maxData))
    }
    if (minPrice) {
      countQuery = countQuery.gte("price_usd", Number.parseFloat(minPrice))
    }
    if (maxPrice) {
      countQuery = countQuery.lte("price_usd", Number.parseFloat(maxPrice))
    }
    if (minDays) {
      countQuery = countQuery.gte("validity_days", Number.parseInt(minDays))
    }
    if (maxDays) {
      countQuery = countQuery.lte("validity_days", Number.parseInt(maxDays))
    }
    if (unlimited === "true") {
      countQuery = countQuery.eq("is_unlimited", true)
    } else if (unlimited === "false") {
      countQuery = countQuery.eq("is_unlimited", false)
    }
    if (features.includes("hotspot")) {
      countQuery = countQuery.eq("hotspot_allowed", true)
    }
    if (features.includes("voice")) {
      countQuery = countQuery.eq("voice_calls", true)
    }
    if (features.includes("sms")) {
      countQuery = countQuery.eq("sms_included", true)
    }

    const { count: totalCount } = await countQuery

    // Flatten the response to include provider and country names at the top level
    const flattenedPlans = (plans || []).map(plan => ({
      ...plan,
      provider_name: plan.provider?.name || null,
      provider_logo_url: plan.provider?.logo_url || null,
      provider_website_url: plan.provider?.website_url || null,
      country_name: plan.country?.name || null,
      country_code: plan.country?.code || null,
    }))

    // Get the most recent last_scraped_at timestamp from the plans
    let lastUpdated = null
    if (plans && plans.length > 0) {
      const timestamps = plans
        .map(plan => plan.last_scraped_at)
        .filter(Boolean)
        .map(ts => new Date(ts).getTime())
      
      if (timestamps.length > 0) {
        lastUpdated = new Date(Math.max(...timestamps)).toISOString()
      }
    }

    return NextResponse.json({
      success: true,
      plans: flattenedPlans,
      lastUpdated,
      pagination: {
        total: totalCount || 0,
        limit,
        offset,
        hasMore: (totalCount || 0) > offset + limit,
      },
    })
  } catch (error) {
    console.error("Search error:", error)
    return NextResponse.json(
      {
        error: "Search failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

function getSortColumn(sortBy: string): string {
  switch (sortBy) {
    case "price":
      return "price_usd"
    case "data":
      return "data_amount_gb"
    case "value":
      return "price_per_gb"
    case "duration":
      return "validity_days"
    case "provider":
      return "providers.name"
    case "country":
      return "countries.name"
    default:
      return "price_usd"
  }
}
