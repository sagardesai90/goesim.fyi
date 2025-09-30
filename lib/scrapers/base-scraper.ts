import { createClient } from "@/lib/supabase/server"

export interface ScrapedPlan {
  name: string
  dataAmountGb: number
  validityDays: number
  priceUsd: number
  currency?: string // The currency code (USD, EUR, GBP, etc.) from the website
  originalPrice?: number // The original price in the original currency
  isUnlimited: boolean
  networkType?: string
  coverageType?: string
  hotspotAllowed?: boolean
  voiceCalls?: boolean
  smsIncluded?: boolean
  planUrl: string
  countryCode: string
}

export interface ScrapingResult {
  success: boolean
  plansFound: number
  plansAdded: number
  plansUpdated: number
  errors: string[]
}

export abstract class BaseScraper {
  protected providerId: string
  protected providerName: string
  protected baseUrl: string

  constructor(providerId: string, providerName: string, baseUrl: string) {
    this.providerId = providerId
    this.providerName = providerName
    this.baseUrl = baseUrl
  }

  abstract scrapeCountry(countryCode: string): Promise<ScrapedPlan[]>
  abstract scrapeAllCountries(): Promise<ScrapedPlan[]>

  protected async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  protected async fetchWithRetry(url: string, options: RequestInit = {}, maxRetries = 3): Promise<Response> {
    let lastError: Error

    for (let i = 0; i <= maxRetries; i++) {
      try {
        const response = await fetch(url, {
          ...options,
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
            "Accept-Encoding": "gzip, deflate",
            Connection: "keep-alive",
            "Upgrade-Insecure-Requests": "1",
            ...options.headers,
          },
        })

        if (response.ok) {
          return response
        }

        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      } catch (error) {
        lastError = error as Error
        if (i < maxRetries) {
          await this.delay(1000 * Math.pow(2, i)) // Exponential backoff
        }
      }
    }

    throw lastError!
  }

  async savePlans(plans: ScrapedPlan[]): Promise<ScrapingResult> {
    const supabase = await createClient()
    const result: ScrapingResult = {
      success: true,
      plansFound: plans.length,
      plansAdded: 0,
      plansUpdated: 0,
      errors: [],
    }

    // Start scraping log
    const { data: logData } = await supabase
      .from("scraping_logs")
      .insert({
        provider_id: this.providerId,
        scrape_type: "full",
        status: "running",
        plans_found: plans.length,
      })
      .select()
      .single()

    try {
      // Get unique country codes from plans
      const countryCodes = [...new Set(plans.map(plan => plan.countryCode))]

      // Delete all existing plans for this provider and countries to ensure clean data
      for (const countryCode of countryCodes) {
        const { data: country } = await supabase.from("countries").select("id").eq("code", countryCode).single()

        if (country) {
          const { error: deleteError } = await supabase
            .from("esim_plans")
            .delete()
            .eq("provider_id", this.providerId)
            .eq("country_id", country.id)

          if (deleteError) {
            result.errors.push(`Failed to delete old plans for ${countryCode}: ${deleteError.message}`)
          }
        }
      }
      for (const plan of plans) {
        // Get country ID
        const { data: country } = await supabase.from("countries").select("id").eq("code", plan.countryCode).single()

        if (!country) {
          result.errors.push(`Country not found: ${plan.countryCode}`)
          continue
        }

        const planData = {
          provider_id: this.providerId,
          country_id: country.id,
          name: plan.name,
          data_amount_gb: plan.dataAmountGb,
          validity_days: plan.validityDays,
          price_usd: plan.priceUsd,
          currency: plan.currency || "USD",
          original_price: plan.originalPrice || plan.priceUsd,
          is_unlimited: plan.isUnlimited,
          network_type: plan.networkType || "4G/5G",
          coverage_type: plan.coverageType || "National",
          hotspot_allowed: plan.hotspotAllowed ?? true,
          voice_calls: plan.voiceCalls ?? false,
          sms_included: plan.smsIncluded ?? false,
          plan_url: plan.planUrl,
          last_scraped_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        // Insert new plan (since we deleted old ones)
        const { error } = await supabase.from("esim_plans").insert(planData)

        if (error) {
          result.errors.push(`Failed to insert plan ${plan.name}: ${error.message}`)
        } else {
          result.plansAdded++
        }
      }

      // Update scraping log
      await supabase
        .from("scraping_logs")
        .update({
          status: "completed",
          plans_added: result.plansAdded,
          plans_updated: result.plansUpdated,
          completed_at: new Date().toISOString(),
          error_message: result.errors.length > 0 ? result.errors.join("; ") : null,
        })
        .eq("id", logData?.id)
    } catch (error) {
      result.success = false
      result.errors.push(`Scraping failed: ${error}`)

      // Update scraping log with error
      await supabase
        .from("scraping_logs")
        .update({
          status: "failed",
          completed_at: new Date().toISOString(),
          error_message: error instanceof Error ? error.message : "Unknown error",
        })
        .eq("id", logData?.id)
    }

    return result
  }
}
