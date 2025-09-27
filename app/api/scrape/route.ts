import { type NextRequest, NextResponse } from "next/server"
import { ScraperFactory } from "@/lib/scrapers/scraper-factory"

export async function POST(request: NextRequest) {
  try {
    const { provider, country } = await request.json()

    if (!provider) {
      return NextResponse.json({ error: "Provider is required" }, { status: 400 })
    }

    const scraper = await ScraperFactory.createScraper(provider)
    if (!scraper) {
      return NextResponse.json({ error: `Scraper not available for provider: ${provider}` }, { status: 400 })
    }

    let plans
    if (country) {
      plans = await scraper.scrapeCountry(country)
    } else {
      plans = await scraper.scrapeAllCountries()
    }

    const result = await scraper.savePlans(plans)

    return NextResponse.json({
      success: result.success,
      message: `Scraping completed for ${provider}`,
      stats: {
        plansFound: result.plansFound,
        plansAdded: result.plansAdded,
        plansUpdated: result.plansUpdated,
        errors: result.errors,
      },
      scrapedData: plans,
    })
  } catch (error) {
    console.error("Scraping error:", error)
    return NextResponse.json(
      {
        error: "Scraping failed",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}

export async function GET() {
  const supportedProviders = ScraperFactory.getSupportedProviders()

  return NextResponse.json({
    supportedProviders,
    usage: {
      scrapeAll: 'POST /api/scrape with { "provider": "Airalo" }',
      scrapeCountry: 'POST /api/scrape with { "provider": "Airalo", "country": "US" }',
    },
  })
}
