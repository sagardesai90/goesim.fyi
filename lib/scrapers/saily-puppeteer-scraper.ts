import puppeteer, { Browser, Page } from 'puppeteer'
import { BaseScraper, type ScrapedPlan } from './base-scraper'

/**
 * Saily eSIM scraper using Puppeteer for accurate real-time data extraction.
 * Extracts plan information including data amounts, prices, validity periods, and currencies.
 */
export class SailyPuppeteerScraper extends BaseScraper {
    private browser: Browser | null = null

    constructor(providerId: string) {
        super(providerId, 'Saily', 'https://saily.com')
    }

    async initialize(): Promise<void> {
        if (!this.browser) {
            const os = require('os')
            const path = require('path')

            // Explicitly point to the Chrome installation in Puppeteer's cache
            const homedir = os.homedir()
            const executablePath = path.join(
                homedir,
                '.cache/puppeteer/chrome/mac-140.0.7339.207/chrome-mac-x64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing'
            )

            this.browser = await puppeteer.launch({
                headless: true,
                executablePath, // Explicitly tell Puppeteer where Chrome is
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-gpu',
                ]
            })
        }
    }

    async close(): Promise<void> {
        if (this.browser) {
            await this.browser.close()
            this.browser = null
        }
    }

    /**
     * Scrapes Saily plans for a specific country
     */
    async scrapeCountry(countryCode: string): Promise<ScrapedPlan[]> {
        await this.initialize()
        if (!this.browser) throw new Error('Browser not initialized')

        const page = await this.browser.newPage()
        const plans: ScrapedPlan[] = []

        try {
            // Map country codes to Saily URL slugs
            const countrySlug = this.getCountrySlug(countryCode)
            const countryUrl = `${this.baseUrl}/${countrySlug}/` // Add trailing slash!

            console.log(`[Saily Puppeteer] Scraping ${countryCode}: ${countryUrl}`)

            // Set user agent and extra headers to avoid bot detection
            await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
            await page.setViewport({ width: 1920, height: 1080 })

            // Set extra headers to look more like a real browser
            await page.setExtraHTTPHeaders({
                'Accept-Language': 'en-US,en;q=0.9',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            })

            // Navigate to the country page with relaxed wait conditions
            try {
                await page.goto(countryUrl, {
                    waitUntil: 'domcontentloaded', // Less strict than networkidle2
                    timeout: 60000 // Increase timeout to 60 seconds
                })
                console.log(`[Saily Puppeteer] Page loaded successfully`)
            } catch (error) {
                console.error(`[Saily Puppeteer] Failed to load page: ${error}`)
                throw error
            }

            // Wait for content to load and plan cards to appear
            console.log(`[Saily Puppeteer] Waiting for plan cards to load...`)

            try {
                // Wait for the plans section to appear
                await page.waitForSelector('#plansSection', { timeout: 10000 })
                console.log(`[Saily Puppeteer] Plans section found!`)

                // Wait a bit more for cards to fully render
                await new Promise(resolve => setTimeout(resolve, 3000))
            } catch (error) {
                console.log(`[Saily Puppeteer] Warning: Plans section not found, continuing anyway...`)
                await new Promise(resolve => setTimeout(resolve, 5000))
            }

            // Extract plans using the page evaluation
            const extractedData = await page.evaluate((countryParam) => {
                const plans: any[] = []

                // Saily uses specific structure:
                // - Plans are in ul#plansSection
                // - Each plan is li[data-testid="destination-hero-plan-card-X"]

                // Find all plan cards
                const planCards = Array.from(document.querySelectorAll('li[data-testid^="destination-hero-plan-card"]'))

                console.log(`Found ${planCards.length} plan cards`)

                planCards.forEach((card, index) => {
                    try {
                        // Get all paragraphs in this card
                        const paragraphs = Array.from(card.querySelectorAll('p'))

                        // Extract data amount (look for "X GB" pattern)
                        let dataAmountGb: number | null = null
                        let isUnlimited = false

                        for (const p of paragraphs) {
                            const text = p.textContent?.trim() || ''

                            // Check for unlimited
                            if (text.toLowerCase().includes('unlimited')) {
                                isUnlimited = true
                                dataAmountGb = 999
                                break
                            }

                            // Look for "X GB" pattern
                            const dataMatch = text.match(/^(\d+(?:\.\d+)?)\s*GB$/i)
                            if (dataMatch) {
                                dataAmountGb = parseFloat(dataMatch[1])
                            }
                        }

                        // Extract validity (look for "X days" pattern)
                        let validityDays: number | null = null
                        for (const p of paragraphs) {
                            const text = p.textContent?.trim() || ''
                            const validityMatch = text.match(/^(\d+)\s*days?$/i)
                            if (validityMatch) {
                                validityDays = parseInt(validityMatch[1])
                                break
                            }
                        }

                        // Extract price (look for data-testid="pricing-card-original-price")
                        const priceElement = card.querySelector('[data-testid="pricing-card-original-price"]')
                        let priceValue: number | null = null
                        let currencyCode = 'USD'

                        if (priceElement) {
                            const priceText = priceElement.textContent?.trim() || ''
                            // Match patterns like "US$3.99", "$3.99", "€3.99"
                            const priceMatch = priceText.match(/(?:US)?\$?([\d.]+)|€([\d.]+)|£([\d.]+)/)
                            if (priceMatch) {
                                priceValue = parseFloat(priceMatch[1] || priceMatch[2] || priceMatch[3])

                                // Determine currency
                                if (priceText.includes('€')) currencyCode = 'EUR'
                                else if (priceText.includes('£')) currencyCode = 'GBP'
                                else currencyCode = 'USD'
                            }
                        }

                        // Get plan URL from label or input
                        const input = card.querySelector('input[type="radio"]')
                        const planId = input ? (input as HTMLInputElement).value : ''
                        const planUrl = planId ? `${window.location.origin}${window.location.pathname}?plan=${planId}` : window.location.href

                        console.log(`Plan ${index + 1}: ${dataAmountGb}GB, ${validityDays} days, $${priceValue}`)

                        // Only add if we have all required data
                        if ((dataAmountGb !== null || isUnlimited) && validityDays && priceValue) {
                            plans.push({
                                dataAmountGb: isUnlimited ? 999 : dataAmountGb,
                                validityDays,
                                priceValue,
                                currency: currencyCode,
                                isUnlimited,
                                url: planUrl
                            })
                        }
                    } catch (error) {
                        console.error(`Error parsing plan card ${index}:`, error)
                    }
                })

                // Get country name from page title (h2 with id="plan-section-title")
                const titleElement = document.querySelector('#plan-section-title')
                let countryName = countryParam
                if (titleElement) {
                    const titleText = titleElement.textContent?.trim() || ''
                    // Extract country from text like "Get an eSIM data plan for the United States"
                    const countryMatch = titleText.match(/for (?:the )?(.+)$/i)
                    if (countryMatch) {
                        countryName = countryMatch[1]
                    }
                }

                console.log(`Total plans extracted: ${plans.length}`)

                return {
                    country: countryName,
                    plans
                }
            }, countryCode)

            console.log(`[Saily Puppeteer] Found ${extractedData.plans.length} plans for ${countryCode}`)

            // Currency conversion rates (fallback)
            const currencyRates: { [key: string]: number } = {
                'USD': 1.0,
                'EUR': 1.10,
                'GBP': 1.27,
                'JPY': 0.0067,
                'INR': 0.012
            }

            // Transform extracted data to ScrapedPlan format
            for (const plan of extractedData.plans) {
                const conversionRate = currencyRates[plan.currency] || 1.0
                const priceInUsd = plan.currency === 'USD'
                    ? plan.priceValue
                    : parseFloat((plan.priceValue * conversionRate).toFixed(2))

                plans.push({
                    name: `${extractedData.country} ${plan.isUnlimited ? 'Unlimited' : plan.dataAmountGb + 'GB'} - ${plan.validityDays} Days`,
                    dataAmountGb: plan.dataAmountGb,
                    validityDays: plan.validityDays,
                    priceUsd: priceInUsd,
                    currency: plan.currency,
                    originalPrice: plan.priceValue,
                    isUnlimited: plan.isUnlimited || false,
                    networkType: '4G/5G',
                    coverageType: 'National',
                    hotspotAllowed: true,
                    voiceCalls: false,
                    smsIncluded: false,
                    planUrl: plan.url,
                    countryCode
                })
            }

        } catch (error) {
            console.error(`[Saily Puppeteer] Error scraping ${countryCode}:`, error)
        } finally {
            await page.close()
        }

        return plans
    }

    /**
     * Scrapes all configured countries
     */
    async scrapeAllCountries(): Promise<ScrapedPlan[]> {
        const allPlans: ScrapedPlan[] = []

        // Common countries to scrape
        const countries = [
            'US', 'CA', 'GB', 'DE', 'FR', 'ES', 'IT',
            'JP', 'AU', 'NL', 'TR', 'TH', 'SG'
        ]

        try {
            await this.initialize()

            for (const countryCode of countries) {
                console.log(`[Saily Puppeteer] Processing country: ${countryCode}`)
                const countryPlans = await this.scrapeCountry(countryCode)
                allPlans.push(...countryPlans)

                // Add delay between countries to avoid rate limiting
                await this.delay(3000)
            }
        } finally {
            await this.close()
        }

        return allPlans
    }

    /**
     * Maps country codes to Saily's URL format
     */
    private getCountrySlug(countryCode: string): string {
        const countryUrlMap: Record<string, string> = {
            'US': 'esim-united-states',
            'CA': 'esim-canada',
            'GB': 'esim-united-kingdom',
            'DE': 'esim-germany',
            'FR': 'esim-france',
            'ES': 'esim-spain',
            'IT': 'esim-italy',
            'NL': 'esim-netherlands',
            'JP': 'esim-japan',
            'AU': 'esim-australia',
            'TR': 'esim-turkey',
            'TH': 'esim-thailand',
            'SG': 'esim-singapore',
            'MX': 'esim-mexico',
            'BR': 'esim-brazil',
            'AR': 'esim-argentina',
            'CL': 'esim-chile',
            'CO': 'esim-colombia',
            'PE': 'esim-peru',
            'IN': 'esim-india',
            'AE': 'esim-united-arab-emirates',
            'ZA': 'esim-south-africa',
            'EG': 'esim-egypt',
            'KE': 'esim-kenya',
            'MA': 'esim-morocco',
            'PH': 'esim-philippines',
            'VN': 'esim-vietnam',
            'MY': 'esim-malaysia',
            'KR': 'esim-south-korea',
            'TW': 'esim-taiwan',
            'HK': 'esim-hong-kong',
            'NZ': 'esim-new-zealand',
            'PT': 'esim-portugal',
            'GR': 'esim-greece',
            'PL': 'esim-poland',
            'SE': 'esim-sweden',
            'NO': 'esim-norway',
            'DK': 'esim-denmark',
            'FI': 'esim-finland',
            'CH': 'esim-switzerland',
            'AT': 'esim-austria',
            'BE': 'esim-belgium',
            'CZ': 'esim-czech-republic',
            'IL': 'esim-israel',
            'QA': 'esim-qatar',
            'KW': 'esim-kuwait',
            'BH': 'esim-bahrain',
            'JO': 'esim-jordan',
        }

        return countryUrlMap[countryCode] || `esim-${countryCode.toLowerCase()}`
    }
}

