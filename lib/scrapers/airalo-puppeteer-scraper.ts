import puppeteer, { Browser, Page } from 'puppeteer'
import { BaseScraper, type ScrapedPlan } from './base-scraper'

/**
 * Improved Airalo scraper using Puppeteer for accurate real-time data extraction.
 * This scraper navigates to Airalo's country pages and extracts actual plan information
 * including data amounts, validity periods, prices, and network providers.
 */
export class AiraloPuppeteerScraper extends BaseScraper {
    private browser: Browser | null = null

    constructor(providerId: string) {
        super(providerId, 'Airalo', 'https://www.airalo.com')
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
     * Scrapes Airalo plans for a specific country
     */
    async scrapeCountry(countryCode: string): Promise<ScrapedPlan[]> {
        await this.initialize()
        if (!this.browser) throw new Error('Browser not initialized')

        const page = await this.browser.newPage()
        const plans: ScrapedPlan[] = []

        try {
            // Map country codes to Airalo URL slugs
            const countrySlug = this.getCountrySlug(countryCode)
            const countryUrl = `${this.baseUrl}/${countrySlug}`

            console.log(`[Airalo Puppeteer] Scraping ${countryCode}: ${countryUrl}`)

            // Set user agent to avoid detection
            await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
            await page.setViewport({ width: 1920, height: 1080 })

            // Navigate to the country page
            await page.goto(countryUrl, {
                waitUntil: 'networkidle2',
                timeout: 30000
            })

            // Wait for content to load
            await new Promise(resolve => setTimeout(resolve, 3000))

            // Function to extract plans from the current page state
            const extractPlansFromPage = async (isUnlimitedTab: boolean = false) => {
                return await page.evaluate((unlimited) => {
                    const plans: any[] = []

                    // Get the network provider from h3
                    const networkHeading = document.querySelector('h3')
                    const network = networkHeading ? networkHeading.textContent?.trim() : 'Unknown'

                    // Get country from h2
                    const countryHeading = document.querySelector('h2')
                    const country = countryHeading ? countryHeading.textContent?.trim() : 'Unknown'

                    // Find all links that are plan links (contain '-esim/' and 'days' in URL)
                    const planLinks = Array.from(document.querySelectorAll('a')).filter(link => {
                        const href = (link as HTMLAnchorElement).href
                        return href.includes('-esim/') && href.includes('days')
                    })

                    planLinks.forEach(link => {
                        const href = (link as HTMLAnchorElement).href

                        // Extract validity from URL (e.g., "canada-mobile-7days-5gb" or "unlimited-30days")
                        const validityMatch = href.match(/(\d+)days/i)
                        const validityDays = validityMatch ? parseInt(validityMatch[1]) : null

                        // Get the data amount from URL
                        const dataMatch = href.match(/(\d+)gb/i)
                        const dataFromUrl = dataMatch ? parseInt(dataMatch[1]) : null

                        // Check if this is an unlimited plan (from URL or tab context)
                        const isUnlimited = href.toLowerCase().includes('unlimited') || unlimited

                        // Get price from the link's divs
                        const childDivs = link.querySelectorAll('div')
                        let priceText = ''

                        childDivs.forEach(div => {
                            const text = div.textContent?.trim() || ''
                            // Match price with currency symbol (€, $, £, etc.)
                            if (text.match(/[\d.]+\s*[€$£¥₹]/)) {
                                priceText = text.replace(/\s+/g, ' ').trim()
                            }
                        })

                        // Extract both price value and currency symbol
                        const priceMatch = priceText.match(/([\d.]+)\s*([€$£¥₹])/)
                        const priceValue = priceMatch ? parseFloat(priceMatch[1]) : null
                        const currencySymbol = priceMatch ? priceMatch[2] : null

                        // Map currency symbols to codes
                        const currencyMap: { [key: string]: string } = {
                            '€': 'EUR',
                            '$': 'USD',
                            '£': 'GBP',
                            '¥': 'JPY',
                            '₹': 'INR'
                        }
                        const currencyCode = currencySymbol ? currencyMap[currencySymbol] || 'USD' : 'USD'

                        // For unlimited plans, we still need validity days but data is unlimited
                        if (validityDays && priceValue) {
                            // If it's unlimited, don't require dataFromUrl
                            const finalDataAmount = isUnlimited ? 999 : (dataFromUrl || 0)

                            if (finalDataAmount > 0) {
                                plans.push({
                                    name: `${country} ${isUnlimited ? 'Unlimited' : finalDataAmount + 'GB'} - ${validityDays} Days`,
                                    network,
                                    dataAmountGb: finalDataAmount,
                                    validityDays,
                                    priceValue,
                                    currency: currencyCode,
                                    priceDisplay: priceText,
                                    isUnlimited,
                                    url: href
                                })
                            }
                        }
                    })

                    return {
                        country,
                        network,
                        plans
                    }
                }, isUnlimitedTab)
            }

            // First, extract Standard plans
            console.log(`[Airalo Puppeteer] Extracting Standard plans for ${countryCode}`)
            const standardData = await extractPlansFromPage(false)
            const allPlans = [...standardData.plans]

            // Try to click the "Unlimited" tab and extract unlimited plans
            try {
                const unlimitedTabClicked = await page.evaluate(() => {
                    // Look for "Unlimited" tab button
                    const tabs = Array.from(document.querySelectorAll('button, [role="tab"]'))
                    const unlimitedTab = tabs.find(tab =>
                        tab.textContent?.toLowerCase().includes('unlimited')
                    ) as HTMLElement

                    if (unlimitedTab) {
                        unlimitedTab.click()
                        return true
                    }
                    return false
                })

                if (unlimitedTabClicked) {
                    console.log(`[Airalo Puppeteer] Found Unlimited tab, extracting unlimited plans`)
                    // Wait for content to update after clicking
                    await new Promise(resolve => setTimeout(resolve, 2000))

                    const unlimitedData = await extractPlansFromPage(true)
                    allPlans.push(...unlimitedData.plans)
                    console.log(`[Airalo Puppeteer] Found ${unlimitedData.plans.length} unlimited plans`)
                }
            } catch (error) {
                console.log(`[Airalo Puppeteer] No unlimited tab found or error clicking it: ${error}`)
            }

            const extractedData = {
                country: standardData.country,
                network: standardData.network,
                plans: allPlans
            }

            console.log(`[Airalo Puppeteer] Found ${extractedData.plans.length} plans for ${countryCode}`)

            // Approximate currency conversion rates (fallback)
            // In production, you should use a real-time currency API like exchangerate-api.com
            const currencyRates: { [key: string]: number } = {
                'USD': 1.0,
                'EUR': 1.10,
                'GBP': 1.27,
                'JPY': 0.0067,
                'INR': 0.012
            }

            // Transform extracted data to ScrapedPlan format
            for (const plan of extractedData.plans) {
                // Convert to USD if not already in USD
                const conversionRate = currencyRates[plan.currency] || 1.0
                const priceInUsd = plan.currency === 'USD'
                    ? plan.priceValue
                    : parseFloat((plan.priceValue * conversionRate).toFixed(2))

                plans.push({
                    name: plan.name,
                    dataAmountGb: plan.dataAmountGb,
                    validityDays: plan.validityDays,
                    priceUsd: priceInUsd, // Converted price for comparison
                    currency: plan.currency, // Original currency from website
                    originalPrice: plan.priceValue, // Original price value
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
            console.error(`[Airalo Puppeteer] Error scraping ${countryCode}:`, error)
            // Don't throw, just return empty array - the base scraper will handle fallback
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
            'US', 'CA', 'GB', 'DE', 'FR', 'JP', 'AU',
            'ES', 'IT', 'NL', 'TR', 'TH', 'CN',
            'ID', 'SG', 'IE', 'OM', 'SA'
        ]

        try {
            await this.initialize()

            for (const countryCode of countries) {
                console.log(`[Airalo Puppeteer] Processing country: ${countryCode}`)
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
     * Maps country codes to Airalo's URL format
     */
    private getCountrySlug(countryCode: string): string {
        const countryUrlMap: Record<string, string> = {
            'CN': 'china-esim',
            'US': 'united-states-esim',
            'CA': 'canada-esim',
            'GB': 'united-kingdom-esim',
            'DE': 'germany-esim',
            'FR': 'france-esim',
            'JP': 'japan-esim',
            'AU': 'australia-esim',
            'ES': 'spain-esim',
            'IT': 'italy-esim',
            'NL': 'netherlands-esim',
            'TR': 'turkey-esim',
            'TH': 'thailand-esim',
            'ID': 'indonesia-esim',
            'SG': 'singapore-esim',
            'IE': 'ireland-esim',
            'OM': 'oman-esim',
            'SA': 'saudi-arabia-esim',
            'MX': 'mexico-esim',
            'BR': 'brazil-esim',
            'AR': 'argentina-esim',
            'CL': 'chile-esim',
            'CO': 'colombia-esim',
            'PE': 'peru-esim',
            'IN': 'india-esim',
            'AE': 'united-arab-emirates-esim',
            'ZA': 'south-africa-esim',
            'EG': 'egypt-esim',
            'KE': 'kenya-esim',
            'MA': 'morocco-esim',
            'PH': 'philippines-esim',
            'VN': 'vietnam-esim',
            'MY': 'malaysia-esim',
            'KR': 'south-korea-esim',
            'TW': 'taiwan-esim',
            'HK': 'hong-kong-esim',
            'NZ': 'new-zealand-esim',
            'PT': 'portugal-esim',
            'GR': 'greece-esim',
            'PL': 'poland-esim',
            'SE': 'sweden-esim',
            'NO': 'norway-esim',
            'DK': 'denmark-esim',
            'FI': 'finland-esim',
            'CH': 'switzerland-esim',
            'AT': 'austria-esim',
            'BE': 'belgium-esim',
            'CZ': 'czech-republic-esim',
            'IL': 'israel-esim',
            'QA': 'qatar-esim',
            'KW': 'kuwait-esim',
            'BH': 'bahrain-esim',
            'JO': 'jordan-esim',
        }

        return countryUrlMap[countryCode] || `${countryCode.toLowerCase()}-esim`
    }
}
