import { NextRequest, NextResponse } from 'next/server'
import { ScraperFactory } from '@/lib/scrapers/scraper-factory'

/**
 * Cron job endpoint to scrape all providers periodically
 * 
 * Usage with Vercel Cron:
 * - Add to vercel.json:
 *   {
 *     "crons": [{
 *       "path": "/api/cron/scrape-all",
 *       "schedule": "0 2 * * *"  // Daily at 2 AM
 *     }]
 *   }
 * 
 * Or trigger manually/via external cron:
 * - POST /api/cron/scrape-all
 * - Include Authorization header with CRON_SECRET for security
 */
export async function POST(request: NextRequest) {
    try {
        // Security: Verify cron secret (in production)
        const authHeader = request.headers.get('authorization')
        const cronSecret = process.env.CRON_SECRET || 'dev-secret'

        if (authHeader !== `Bearer ${cronSecret}`) {
            console.log('[Cron] Unauthorized access attempt')
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        console.log('[Cron] Starting scheduled scraping job...')
        const startTime = Date.now()

        const providers = ['Airalo', 'Saily', 'Holafly'] // All active providers

        // Country groups - split into 2 groups to fit Vercel's 2 cron job limit
        const countryGroups = {
            1: ['US', 'CA', 'GB', 'DE', 'FR', 'ES'],  // Group 1: 2 AM UTC - Americas & Europe
            2: ['IT', 'JP', 'AU', 'NL', 'CH', 'SG']   // Group 2: 2 PM UTC - Europe & Asia Pacific
        }

        // Get group from query parameter (default to group 1)
        const url = new URL(request.url)
        const group = url.searchParams.get('group') || '1'
        const countries = countryGroups[group as keyof typeof countryGroups] || countryGroups[1]

        console.log(`[Cron] Processing country group ${group}:`, countries)

        const results: any[] = []
        let totalPlansScraped = 0
        let totalErrors = 0

        for (const provider of providers) {
            console.log(`[Cron] Processing provider: ${provider}`)

            try {
                const scraper = await ScraperFactory.createScraper(provider)

                if (!scraper) {
                    console.log(`[Cron] No scraper available for ${provider}`)
                    continue
                }

                for (const country of countries) {
                    try {
                        console.log(`[Cron] Scraping ${provider} - ${country}`)

                        const plans = await scraper.scrapeCountry(country)
                        console.log(`[Cron] Found ${plans.length} plans for ${provider} - ${country}`)

                        if (plans.length > 0) {
                            const result = await scraper.savePlans(plans)
                            totalPlansScraped += result.plansAdded

                            results.push({
                                provider,
                                country,
                                plansFound: plans.length,
                                plansAdded: result.plansAdded,
                                success: result.success,
                                errors: result.errors
                            })

                            if (result.errors.length > 0) {
                                totalErrors += result.errors.length
                            }
                        }

                        // Add delay between requests to be respectful
                        await new Promise(resolve => setTimeout(resolve, 3000))

                    } catch (countryError) {
                        console.error(`[Cron] Error scraping ${provider} - ${country}:`, countryError)
                        totalErrors++
                        results.push({
                            provider,
                            country,
                            success: false,
                            error: countryError instanceof Error ? countryError.message : 'Unknown error'
                        })
                    }
                }

                // Close browser after each provider
                if ('close' in scraper && typeof scraper.close === 'function') {
                    await scraper.close()
                }

            } catch (providerError) {
                console.error(`[Cron] Error processing provider ${provider}:`, providerError)
                totalErrors++
            }
        }

        const duration = Math.round((Date.now() - startTime) / 1000)

        console.log(`[Cron] Scraping job completed in ${duration}s`)
        console.log(`[Cron] Total plans scraped: ${totalPlansScraped}`)
        console.log(`[Cron] Total errors: ${totalErrors}`)

        return NextResponse.json({
            success: true,
            message: 'Scheduled scraping completed',
            stats: {
                duration: `${duration}s`,
                totalPlansScraped,
                totalErrors,
                providers: providers.length,
                countries: countries.length
            },
            results
        })

    } catch (error) {
        console.error('[Cron] Scraping job failed:', error)
        return NextResponse.json(
            {
                success: false,
                error: 'Scraping job failed',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        )
    }
}

// GET endpoint for manual testing
export async function GET() {
    return NextResponse.json({
        message: 'Cron scraping endpoint',
        usage: 'POST with Authorization: Bearer CRON_SECRET header',
        note: 'This endpoint is designed to be called by Vercel Cron or external schedulers'
    })
}
