import { createClient } from "@/lib/supabase/server"
import { AiraloScraper } from "./airalo-scraper"
import { AiraloPuppeteerScraper } from "./airalo-puppeteer-scraper"
import { SailyPuppeteerScraper } from "./saily-puppeteer-scraper"
import { HolaflyPuppeteerScraper } from "./holafly-puppeteer-scraper"
import { HolaflyScraper } from "./holafly-scraper"
import { PuppeteerScraper } from "./puppeteer-scraper"
import { RealDataScraper } from "./real-data-scraper"
import type { BaseScraper } from "./base-scraper"

export class ScraperFactory {
  static async createScraper(providerName: string): Promise<BaseScraper | null> {
    const supabase = await createClient()

    // Get provider ID from database
    const { data: provider } = await supabase.from("providers").select("id").eq("name", providerName).single()

    if (!provider) {
      throw new Error(`Provider not found: ${providerName}`)
    }

    switch (providerName.toLowerCase()) {
      case "airalo":
        // Use the improved Puppeteer-based scraper for accurate real-time data
        return new AiraloPuppeteerScraper(provider.id)
      case "saily":
        // Use the Puppeteer-based scraper for Saily
        return new SailyPuppeteerScraper(provider.id)
      case "holafly":
        // Use the Puppeteer-based scraper for Holafly with dynamic pricing
        return new HolaflyPuppeteerScraper(provider.id)
      default:
        return null
    }
  }

  static getSupportedProviders(): string[] {
    return ["Airalo", "Saily", "Holafly"]
  }
}
