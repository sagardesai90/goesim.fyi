import { type NextRequest, NextResponse } from "next/server"
import { ScraperFactory } from "@/lib/scrapers/scraper-factory"

// This would typically be called by a cron job or scheduled task
export async function POST(request: NextRequest) {
  try {
    const { providers } = await request.json()
    const providersToScrape = providers || ScraperFactory.getSupportedProviders()

    const results = []

    for (const providerName of providersToScrape) {
      try {
        const scraper = await ScraperFactory.createScraper(providerName)
        if (!scraper) {
          results.push({
            provider: providerName,
            success: false,
            error: "Scraper not available",
          })
          continue
        }

        const plans = await scraper.scrapeAllCountries()
        const result = await scraper.savePlans(plans)

        results.push({
          provider: providerName,
          success: result.success,
          stats: {
            plansFound: result.plansFound,
            plansAdded: result.plansAdded,
            plansUpdated: result.plansUpdated,
            errors: result.errors,
          },
        })
      } catch (error) {
        results.push({
          provider: providerName,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: "Scheduled scraping completed",
      results,
    })
  } catch (error) {
    console.error("Scheduled scraping error:", error)
    return NextResponse.json(
      {
        error: "Scheduled scraping failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
