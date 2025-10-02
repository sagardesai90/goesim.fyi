import { createClient } from "@/lib/supabase/server"

export interface AffiliateLink {
  id: string
  planId: string
  providerId: string
  originalUrl: string
  affiliateUrl: string
  affiliateCode?: string
  commissionRate?: number
  isActive: boolean
}

export interface ClickData {
  userIp?: string
  userAgent?: string
  referrer?: string
  countryCode?: string
}

export class AffiliateManager {
  static async createAffiliateLink(
    planId: string,
    providerId: string,
    originalUrl: string,
    affiliateCode: string,
    commissionRate?: number,
  ): Promise<AffiliateLink | null> {
    const supabase = await createClient()

    // Generate affiliate URL based on provider
    const affiliateUrl = this.generateAffiliateUrl(originalUrl, affiliateCode, providerId)

    const { data, error } = await supabase
      .from("affiliate_links")
      .insert({
        plan_id: planId,
        provider_id: providerId,
        original_url: originalUrl,
        affiliate_url: affiliateUrl,
        affiliate_code: affiliateCode,
        commission_rate: commissionRate,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating affiliate link:", error)
      return null
    }

    return {
      id: data.id,
      planId: data.plan_id,
      providerId: data.provider_id,
      originalUrl: data.original_url,
      affiliateUrl: data.affiliate_url,
      affiliateCode: data.affiliate_code,
      commissionRate: data.commission_rate,
      isActive: data.is_active,
    }
  }

  static async getAffiliateLink(planId: string): Promise<AffiliateLink | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("affiliate_links")
      .select("*")
      .eq("plan_id", planId)
      .eq("is_active", true)
      .single()

    if (error || !data) {
      return null
    }

    return {
      id: data.id,
      planId: data.plan_id,
      providerId: data.provider_id,
      originalUrl: data.original_url,
      affiliateUrl: data.affiliate_url,
      affiliateCode: data.affiliate_code,
      commissionRate: data.commission_rate,
      isActive: data.is_active,
    }
  }

  static async trackClick(affiliateLinkId: string, clickData: ClickData): Promise<boolean> {
    const supabase = await createClient()

    try {
      // Record the click
      const { error: clickError } = await supabase.from("affiliate_clicks").insert({
        affiliate_link_id: affiliateLinkId,
        user_ip: clickData.userIp,
        user_agent: clickData.userAgent,
        referrer: clickData.referrer,
        country_code: clickData.countryCode,
      })

      if (clickError) {
        console.error("Error recording click:", clickError)
        return false
      }

      // Update click count
      const { error: updateError } = await supabase.rpc("increment_click_count", {
        link_id: affiliateLinkId,
      })

      if (updateError) {
        console.error("Error updating click count:", updateError)
        return false
      }

      return true
    } catch (error) {
      console.error("Error tracking click:", error)
      return false
    }
  }

  static async getClickStats(affiliateLinkId: string): Promise<{
    totalClicks: number
    conversions: number
    conversionRate: number
    revenue: number
  }> {
    const supabase = await createClient()

    const { data, error } = await supabase
      .from("affiliate_links")
      .select("click_count, conversion_count, revenue_generated")
      .eq("id", affiliateLinkId)
      .single()

    if (error || !data) {
      return {
        totalClicks: 0,
        conversions: 0,
        conversionRate: 0,
        revenue: 0,
      }
    }

    const conversionRate = data.click_count > 0 ? (data.conversion_count / data.click_count) * 100 : 0

    return {
      totalClicks: data.click_count || 0,
      conversions: data.conversion_count || 0,
      conversionRate: Math.round(conversionRate * 100) / 100,
      revenue: data.revenue_generated || 0,
    }
  }

  static async recordConversion(affiliateLinkId: string, revenue: number): Promise<boolean> {
    const supabase = await createClient()

    try {
      const { error } = await supabase.rpc("record_conversion", {
        link_id: affiliateLinkId,
        revenue_amount: revenue,
      })

      if (error) {
        console.error("Error recording conversion:", error)
        return false
      }

      return true
    } catch (error) {
      console.error("Error recording conversion:", error)
      return false
    }
  }

  private static generateAffiliateUrl(originalUrl: string, affiliateCode: string, providerId: string): string {
    // This is a simplified implementation - in reality, each provider has different URL structures
    const url = new URL(originalUrl)

    // Get provider name to determine affiliate parameters
    const providerName = url.hostname.toLowerCase()

    // Common affiliate parameter patterns
    const affiliateParams = {
      // Airalo might use 'ref' parameter
      'www.airalo.com': { ref: affiliateCode },
      'airalo.com': { ref: affiliateCode },
      // Holafly might use 'affiliate' parameter
      'holafly.com': { affiliate: affiliateCode },
      // Saily might use 'ref' parameter
      'saily.com': { ref: affiliateCode },
      // Generic fallback
      default: { aff: affiliateCode, utm_source: "comparison", utm_medium: "affiliate" },
    }

    // Add affiliate parameters based on provider
    const params = affiliateParams[providerName as keyof typeof affiliateParams] || affiliateParams.default
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, String(value))
    })

    return url.toString()
  }

  static async bulkCreateAffiliateLinks(plans: Array<{ id: string; provider_id: string; plan_url: string }>) {
    const supabase = await createClient()

    // Get provider affiliate codes (this would typically come from a configuration table)
    const affiliateCodes = {
      airalo: "COMP123",
      holafly: "COMP456",
      nomad: "COMP789",
      saily: "SAILY123",
    }

    const affiliateLinks = []

    for (const plan of plans) {
      // Get provider name
      const { data: provider } = await supabase.from("providers").select("name").eq("id", plan.provider_id).single()

      if (!provider) continue

      const providerName = provider.name.toLowerCase()
      const affiliateCode = affiliateCodes[providerName as keyof typeof affiliateCodes]

      if (!affiliateCode) continue

      const affiliateUrl = this.generateAffiliateUrl(plan.plan_url, affiliateCode, plan.provider_id)

      affiliateLinks.push({
        plan_id: plan.id,
        provider_id: plan.provider_id,
        original_url: plan.plan_url,
        affiliate_url: affiliateUrl,
        affiliate_code: affiliateCode,
        commission_rate: 5.0, // Default 5% commission
        is_active: true,
      })
    }

    if (affiliateLinks.length > 0) {
      const { error } = await supabase.from("affiliate_links").upsert(affiliateLinks, {
        onConflict: "plan_id",
      })

      if (error) {
        console.error("Error bulk creating affiliate links:", error)
        return false
      }
    }

    return true
  }
}
