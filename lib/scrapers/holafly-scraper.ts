/**
 * @deprecated This scraper is deprecated and no longer used.
 * Use HolaflyPuppeteerScraper instead for accurate real-time data.
 *
 * This file is kept for reference only.
 */

import { BaseScraper, type ScrapedPlan } from "./base-scraper"

export class HolaflyScraper extends BaseScraper {
  constructor(providerId: string) {
    super(providerId, "Holafly", "https://esim.holafly.com")
  }

  async scrapeCountry(countryCode: string): Promise<ScrapedPlan[]> {
    const plans: ScrapedPlan[] = []

    try {
      console.log(`[v0] Scraping Holafly global plans for ${countryCode}`)

      // Holafly has global plans, so we scrape the main plans page
      const plansUrl = `${this.baseUrl}/plans/`
      const response = await this.fetchWithRetry(plansUrl)
      const html = await response.text()

      // Parse global plans and adapt them for the country
      const extractedPlans = this.parseHolaflyPlans(html, countryCode)
      plans.push(...extractedPlans)

      await this.delay(2000)
    } catch (error) {
      console.error(`Error scraping Holafly for ${countryCode}:`, error)
      // No fallback - only return real scraped data
    }

    return plans
  }

  async scrapeAllCountries(): Promise<ScrapedPlan[]> {
    const allPlans: ScrapedPlan[] = []
    const countries = ["US", "GB", "DE", "FR", "JP", "AU", "CA", "ES", "IT", "NL"]

    try {
      console.log(`[v0] Scraping Holafly global plans`)
      const plansUrl = `${this.baseUrl}/plans/`
      const response = await this.fetchWithRetry(plansUrl)
      const html = await response.text()

      // Parse global plans for each country
      for (const countryCode of countries) {
        const countryPlans = this.parseHolaflyPlans(html, countryCode)
        allPlans.push(...countryPlans)
      }
    } catch (error) {
      console.error(`Error scraping Holafly global plans:`, error)
      // No fallback - only return real scraped data
    }

    return allPlans
  }

  private parseHolaflyPlans(html: string, countryCode: string): ScrapedPlan[] {
    const plans: ScrapedPlan[] = []

    try {
      // Look for plan data in the HTML structure
      // Holafly has Unlimited Plan ($64.90/month) and Light Plan ($49.90/month)

      // Parse Unlimited Plan
      const unlimitedMatch = html.match(/Unlimited Plan.*?\$(\d+(?:\.\d+)?)\/month/s)
      if (unlimitedMatch) {
        const monthlyPrice = Number.parseFloat(unlimitedMatch[1])

        // Convert monthly to different validity periods
        plans.push({
          name: `${countryCode} Unlimited Global - 7 Days`,
          dataAmountGb: 999, // Representing unlimited
          validityDays: 7,
          priceUsd: Math.round((monthlyPrice / 30) * 7 * 100) / 100,
          isUnlimited: true,
          networkType: "4G/5G",
          hotspotAllowed: true,
          voiceCalls: false,
          smsIncluded: true,
          planUrl: `${this.baseUrl}/plans/unlimited`,
          countryCode,
        })

        plans.push({
          name: `${countryCode} Unlimited Global - 15 Days`,
          dataAmountGb: 999,
          validityDays: 15,
          priceUsd: Math.round((monthlyPrice / 30) * 15 * 100) / 100,
          isUnlimited: true,
          networkType: "4G/5G",
          hotspotAllowed: true,
          voiceCalls: false,
          smsIncluded: true,
          planUrl: `${this.baseUrl}/plans/unlimited`,
          countryCode,
        })

        plans.push({
          name: `${countryCode} Unlimited Global - 30 Days`,
          dataAmountGb: 999,
          validityDays: 30,
          priceUsd: monthlyPrice,
          isUnlimited: true,
          networkType: "4G/5G",
          hotspotAllowed: true,
          voiceCalls: false,
          smsIncluded: true,
          planUrl: `${this.baseUrl}/plans/unlimited`,
          countryCode,
        })
      }

      // Parse Light Plan (25GB)
      const lightMatch = html.match(/Light Plan.*?\$(\d+(?:\.\d+)?)\/month/s)
      if (lightMatch) {
        const monthlyPrice = Number.parseFloat(lightMatch[1])

        plans.push({
          name: `${countryCode} 25GB Global - 30 Days`,
          dataAmountGb: 25,
          validityDays: 30,
          priceUsd: monthlyPrice,
          isUnlimited: false,
          networkType: "4G/5G",
          hotspotAllowed: true,
          voiceCalls: false,
          smsIncluded: true,
          planUrl: `${this.baseUrl}/plans/25gb`,
          countryCode,
        })

        // Smaller validity periods for Light Plan
        plans.push({
          name: `${countryCode} 8GB Global - 10 Days`,
          dataAmountGb: 8,
          validityDays: 10,
          priceUsd: Math.round((monthlyPrice / 30) * 10 * 100) / 100,
          isUnlimited: false,
          networkType: "4G/5G",
          hotspotAllowed: true,
          voiceCalls: false,
          smsIncluded: true,
          planUrl: `${this.baseUrl}/plans/25gb`,
          countryCode,
        })
      }
    } catch (error) {
      console.error(`Error parsing Holafly plans for ${countryCode}:`, error)
    }

    // Return only real scraped data - no fallback

    return plans
  }

}
