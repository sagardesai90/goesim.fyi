import { createClient } from "@/lib/supabase/server"
import { AiraloScraper } from "./airalo-scraper"
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
        return new AiraloScraper(provider.id)
      case "holafly":
        return new RealDataScraper(provider.id, "Holafly", "https://www.holafly.com")
      case "saily":
        return new RealDataScraper(provider.id, "Saily", "https://www.saily.com")
      default:
        return null
    }
  }

  static getSupportedProviders(): string[] {
    return ["Airalo", "Holafly", "Saily"]
  }
}
