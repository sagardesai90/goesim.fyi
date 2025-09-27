import puppeteer, { Browser, Page } from 'puppeteer'
import { BaseScraper, type ScrapedPlan } from './base-scraper'

export class PuppeteerScraper extends BaseScraper {
    private browser: Browser | null = null

    constructor(providerId: string, providerName: string, baseUrl: string) {
        super(providerId, providerName, baseUrl)
    }

    async initialize(): Promise<void> {
        if (!this.browser) {
            this.browser = await puppeteer.launch({
                headless: true,
                executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--no-first-run',
                    '--no-zygote',
                    '--disable-gpu',
                    '--disable-web-security',
                    '--disable-features=VizDisplayCompositor'
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

    async scrapeCountry(countryCode: string): Promise<ScrapedPlan[]> {
        await this.initialize()
        if (!this.browser) throw new Error('Browser not initialized')

        const page = await this.browser.newPage()

        try {
            // Set user agent to avoid detection
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36')

            // Set viewport
            await page.setViewport({ width: 1920, height: 1080 })

            // Navigate to the country page
            const countryUrl = `${this.baseUrl}/${countryCode.toLowerCase()}-esim`
            console.log(`[Puppeteer] Scraping ${this.providerName} for ${countryCode}: ${countryUrl}`)

            await page.goto(countryUrl, {
                waitUntil: 'networkidle2',
                timeout: 30000
            })

            // Wait for content to load
            await page.waitForTimeout(3000)

            // Extract plans based on provider
            let plans: ScrapedPlan[] = []
            if (this.providerName === 'Airalo') {
                plans = await this.extractAiraloPlans(page, countryCode)
            } else if (this.providerName === 'Holafly') {
                plans = await this.extractHolaflyPlans(page, countryCode)
            }

            console.log(`[Puppeteer] Found ${plans.length} plans for ${countryCode}`)
            return plans

        } catch (error) {
            console.error(`[Puppeteer] Error scraping ${this.providerName} for ${countryCode}:`, error)
            return []
        } finally {
            await page.close()
        }
    }

    async scrapeAllCountries(): Promise<ScrapedPlan[]> {
        const countries = ['US', 'GB', 'DE', 'FR', 'JP', 'AU', 'CA', 'ES', 'IT', 'NL']
        const allPlans: ScrapedPlan[] = []

        for (const countryCode of countries) {
            const plans = await this.scrapeCountry(countryCode)
            allPlans.push(...plans)

            // Add delay between countries
            await this.delay(5000)
        }

        return allPlans
    }

    private async extractAiraloPlans(page: Page, countryCode: string): Promise<ScrapedPlan[]> {
        try {
            // Wait for plan cards to load
            await page.waitForSelector('[data-testid*="plan"], .plan-card, .esim-card', { timeout: 10000 })

            const plans = await page.evaluate((countryCode) => {
                const planElements = document.querySelectorAll('[data-testid*="plan"], .plan-card, .esim-card, [class*="plan"], [class*="card"]')
                const extractedPlans: any[] = []

                planElements.forEach((element) => {
                    const text = element.textContent || ''

                    // Extract data amount (look for patterns like "1GB", "3GB", "5GB", etc.)
                    const dataMatch = text.match(/(\d+(?:\.\d+)?)\s*GB/i)
                    const dataAmountGb = dataMatch ? parseFloat(dataMatch[1]) : null

                    // Extract validity (look for patterns like "7 Days", "30 Days", etc.)
                    const validityMatch = text.match(/(\d+)\s*Days?/i)
                    const validityDays = validityMatch ? parseInt(validityMatch[1]) : null

                    // Extract price (look for patterns like "$4.50", "$11.00", etc.)
                    const priceMatch = text.match(/\$(\d+(?:\.\d+)?)/i)
                    const priceUsd = priceMatch ? parseFloat(priceMatch[1]) : null

                    // Only add if we have essential data
                    if (dataAmountGb && validityDays && priceUsd) {
                        const isUnlimited = text.toLowerCase().includes('unlimited')

                        extractedPlans.push({
                            name: `${countryCode} ${dataAmountGb}GB - ${validityDays} Days`,
                            dataAmountGb,
                            validityDays,
                            priceUsd,
                            isUnlimited,
                            networkType: '4G/5G',
                            hotspotAllowed: true,
                            voiceCalls: false,
                            smsIncluded: false,
                            planUrl: `${window.location.origin}/${countryCode.toLowerCase()}-esim`,
                            countryCode
                        })
                    }
                })

                return extractedPlans
            }, countryCode)

            return plans
        } catch (error) {
            console.error(`[Puppeteer] Error extracting Airalo plans:`, error)
            return []
        }
    }

    private async extractHolaflyPlans(page: Page, countryCode: string): Promise<ScrapedPlan[]> {
        try {
            // Wait for plan elements to load
            await page.waitForSelector('[class*="plan"], [class*="card"], [class*="product"]', { timeout: 10000 })

            const plans = await page.evaluate((countryCode) => {
                const planElements = document.querySelectorAll('[class*="plan"], [class*="card"], [class*="product"], [class*="esim"]')
                const extractedPlans: any[] = []

                planElements.forEach((element) => {
                    const text = element.textContent || ''

                    // Extract data amount
                    const dataMatch = text.match(/(\d+(?:\.\d+)?)\s*GB/i)
                    const dataAmountGb = dataMatch ? parseFloat(dataMatch[1]) : null

                    // Extract validity
                    const validityMatch = text.match(/(\d+)\s*Days?/i)
                    const validityDays = validityMatch ? parseInt(validityMatch[1]) : null

                    // Extract price (look for Euro or USD)
                    const priceMatch = text.match(/[€$](\d+(?:\.\d+)?)/i)
                    const priceUsd = priceMatch ? parseFloat(priceMatch[1]) : null

                    // Check for unlimited
                    const isUnlimited = text.toLowerCase().includes('unlimited') || text.toLowerCase().includes('ilimitado')

                    if ((dataAmountGb || isUnlimited) && validityDays && priceUsd) {
                        extractedPlans.push({
                            name: `${countryCode} ${isUnlimited ? 'Unlimited' : dataAmountGb + 'GB'} - ${validityDays} Days`,
                            dataAmountGb: isUnlimited ? 999 : dataAmountGb,
                            validityDays,
                            priceUsd,
                            isUnlimited,
                            networkType: '4G/5G',
                            hotspotAllowed: true,
                            voiceCalls: false,
                            smsIncluded: false,
                            planUrl: `${window.location.origin}/${countryCode.toLowerCase()}-esim`,
                            countryCode
                        })
                    }
                })

                return extractedPlans
            }, countryCode)

            return plans
        } catch (error) {
            console.error(`[Puppeteer] Error extracting Holafly plans:`, error)
            return []
        }
    }
}
