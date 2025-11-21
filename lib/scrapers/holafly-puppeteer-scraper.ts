import puppeteer, { Browser, Page } from 'puppeteer'
import { BaseScraper, type ScrapedPlan } from './base-scraper'
import {
  buildHolaflyCountryUrl,
  isCountrySupported,
  HOLAFLY_COUNTRY_SLUGS,
} from './holafly-puppeteer/country-slugs'
import { convertEURtoUSD } from './holafly-puppeteer/currency-rates'
import {
  getHolaflyBrowserConfig,
  USER_AGENT,
  EXTRA_HEADERS,
} from './holafly-puppeteer/launch-args'

/**
 * Holafly eSIM scraper using Puppeteer for accurate real-time data extraction
 *
 * Features:
 * - Dynamic pricing extraction from Holafly website
 * - Attempts to select USD currency, falls back to EUR conversion
 * - Supports 12 countries (those in the existing cron job)
 * - Graceful error handling (returns empty arrays, not exceptions)
 * - Proper browser lifecycle management
 *
 * Usage:
 * ```typescript
 * const scraper = new HolaflyPuppeteerScraper(providerId)
 * await scraper.initialize()
 * const plans = await scraper.scrapeCountry('US')
 * await scraper.close()
 * ```
 */
export class HolaflyPuppeteerScraper extends BaseScraper {
  private browser: Browser | null = null

  constructor(providerId: string) {
    super(providerId, 'Holafly', 'https://esim.holafly.com')
  }

  /**
   * Initializes the Puppeteer browser instance
   */
  async initialize(): Promise<void> {
    if (!this.browser) {
      console.log('[Holafly Puppeteer] Initializing browser...')
      this.browser = await puppeteer.launch(getHolaflyBrowserConfig())
      console.log('[Holafly Puppeteer] Browser initialized successfully')
    }
  }

  /**
   * Closes the browser and cleans up resources
   */
  async close(): Promise<void> {
    if (this.browser) {
      console.log('[Holafly Puppeteer] Closing browser...')
      await this.browser.close()
      this.browser = null
      console.log('[Holafly Puppeteer] Browser closed')
    }
  }

  /**
   * Scrapes Holafly plans for a specific country
   *
   * @param countryCode - ISO country code (e.g., 'US', 'GB')
   * @returns Array of scraped plans, or empty array if scraping fails
   */
  async scrapeCountry(countryCode: string): Promise<ScrapedPlan[]> {
    // Validate country is in our supported list
    if (!isCountrySupported(countryCode)) {
      console.warn(
        `[Holafly Puppeteer] Country ${countryCode} is not in the supported list (${Object.keys(HOLAFLY_COUNTRY_SLUGS).join(', ')}), skipping`
      )
      return []
    }

    await this.initialize()
    if (!this.browser) {
      console.error('[Holafly Puppeteer] Browser not initialized')
      return []
    }

    const page = await this.browser.newPage()

    try {
      const countryUrl = buildHolaflyCountryUrl(countryCode)
      console.log(`[Holafly Puppeteer] Scraping ${countryCode}: ${countryUrl}`)

      // Set user agent and extra headers to avoid detection
      await page.setUserAgent(USER_AGENT)
      await page.setExtraHTTPHeaders(EXTRA_HEADERS)

      // Navigate to country page with multiple wait strategies
      await this.navigateToPage(page, countryUrl)

      // Wait for page to settle
      await new Promise(resolve => setTimeout(resolve, 3000))

      // Extract plans from embedded data
      const plans = await this.extractPlans(page, countryCode)

      console.log(`[Holafly Puppeteer] Found ${plans.length} plans for ${countryCode}`)
      return plans
    } catch (error) {
      console.error(`[Holafly Puppeteer] Error scraping ${countryCode}:`, error)
      return [] // Return empty array, database will retain stale data
    } finally {
      await page.close()
    }
  }

  /**
   * Scrapes plans for all supported countries
   */
  async scrapeAllCountries(): Promise<ScrapedPlan[]> {
    const countries = Object.keys(HOLAFLY_COUNTRY_SLUGS)
    const allPlans: ScrapedPlan[] = []

    console.log(`[Holafly Puppeteer] Scraping all ${countries.length} supported countries`)

    for (const countryCode of countries) {
      const plans = await this.scrapeCountry(countryCode)
      allPlans.push(...plans)

      // Add delay between countries to be respectful
      await this.delay(3000)
    }

    return allPlans
  }

  /**
   * Navigates to a page with retry logic and multiple wait strategies
   */
  private async navigateToPage(page: Page, url: string): Promise<void> {
    const waitStrategies: Array<'networkidle2' | 'domcontentloaded' | 'load'> = [
      'domcontentloaded',
      'networkidle2',
      'load',
    ]

    let lastError: Error | null = null

    for (const strategy of waitStrategies) {
      try {
        console.log(`[Holafly Puppeteer] Navigating with wait strategy: ${strategy}`)
        await page.goto(url, {
          waitUntil: strategy,
          timeout: 60000,
        })
        console.log(`[Holafly Puppeteer] Page loaded successfully`)
        return
      } catch (error) {
        console.warn(`[Holafly Puppeteer] Navigation failed with ${strategy}, trying next strategy`)
        lastError = error as Error
      }
    }

    throw new Error(`Failed to navigate to ${url}: ${lastError?.message}`)
  }


  /**
   * Extracts plan data from the page by parsing embedded Astro Island variant data
   * This approach is more reliable than interacting with the dynamic price calculator
   */
  private async extractPlans(page: Page, countryCode: string): Promise<ScrapedPlan[]> {
    try {
      console.log(`[Holafly Puppeteer] Extracting plans from embedded variant data...`)

      // Define the day values we want to scrape
      const targetDays = [1, 3, 5, 7, 10, 14, 15, 20, 30, 60, 90]

      // Get the page HTML
      const html = await page.content()

      // Search for props attributes containing variants
      const propsPattern = /props="([^"]+)"/g
      const matches = Array.from(html.matchAll(propsPattern))

      console.log(`[Holafly Puppeteer] Found ${matches.length} props attributes`)

      // Find the one with variants
      let variantsPropsString: string | null = null
      for (const match of matches) {
        const propsStr = match[1]
        if (propsStr.includes('&quot;variants&quot;') || propsStr.includes('&quot;Variants&quot;')) {
          variantsPropsString = propsStr
          console.log(`[Holafly Puppeteer] Found variants data in props`)
          break
        }
      }

      if (!variantsPropsString) {
        console.log(`[Holafly Puppeteer] Could not find variants in HTML`)
        return []
      }

      // Decode HTML entities
      const decoded = variantsPropsString
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&#x27;/g, "'")

      // Parse JSON
      const propsObj = JSON.parse(decoded)

      // Find variants in the props object
      const variantsData = this.findVariantsInObject(propsObj)

      if (!variantsData) {
        console.log(`[Holafly Puppeteer] Could not find variants in parsed props`)
        return []
      }

      // Deserialize the Astro format
      const variants = this.deserializeAstroValue(variantsData)

      if (!Array.isArray(variants)) {
        console.log(`[Holafly Puppeteer] Variants data is not an array`)
        return []
      }

      console.log(`[Holafly Puppeteer] Deserialized ${variants.length} variants`)

      // Filter to target days and convert to ScrapedPlan format
      const plans: ScrapedPlan[] = []
      for (const variant of variants) {
        if (!variant || typeof variant !== 'object') continue

        const days = parseInt(variant.days || '0')
        if (!targetDays.includes(days)) continue

        // Find USD price
        const usdPrice = variant.prices?.find((p: any) => p.currency === 'USD')
        if (!usdPrice) {
          console.log(`[Holafly Puppeteer] No USD price found for ${days} days variant`)
          continue
        }

        const priceAmount = parseFloat(usdPrice.amount)
        console.log(`[Holafly Puppeteer] ${days} days = $${priceAmount} USD`)

        plans.push({
          name: `${countryCode} Unlimited - ${days} Days`,
          dataAmountGb: 999, // Unlimited
          validityDays: days,
          priceUsd: priceAmount,
          currency: 'USD',
          originalPrice: null,
          isUnlimited: true,
          networkType: '4G/5G',
          coverageType: 'National',
          hotspotAllowed: true,
          voiceCalls: false,
          smsIncluded: false,
          planUrl: page.url(),
          countryCode,
        })
      }

      console.log(`[Holafly Puppeteer] Extracted ${plans.length} plans for target day values`)
      return plans
    } catch (error) {
      console.error(`[Holafly Puppeteer] Error extracting plans for ${countryCode}:`, error)
      return []
    }
  }

  /**
   * Recursively searches for variants property in an object
   */
  private findVariantsInObject(obj: any, depth = 0): any {
    if (depth > 10) return null

    if (Array.isArray(obj)) {
      for (const item of obj) {
        const found = this.findVariantsInObject(item, depth + 1)
        if (found) return found
      }
    } else if (obj && typeof obj === 'object') {
      if (obj.variants) return obj.variants
      if (obj.Variants) return obj.Variants

      for (const key in obj) {
        const found = this.findVariantsInObject(obj[key], depth + 1)
        if (found) return found
      }
    }
    return null
  }

  /**
   * Deserializes Astro's serialization format
   * Format: [0, value] = primitive, [1, data] = array/object
   */
  private deserializeAstroValue(value: any): any {
    // Base case: not an array
    if (!Array.isArray(value)) {
      // If it's an object, recursively deserialize its values
      if (value && typeof value === 'object' && !(value instanceof Date)) {
        const result: any = {}
        for (const key in value) {
          result[key] = this.deserializeAstroValue(value[key])
        }
        return result
      }
      return value
    }

    // Check if this is an Astro serialization tuple [type, data]
    if (value.length === 2 && (value[0] === 0 || value[0] === 1)) {
      const [type, data] = value

      if (type === 0) {
        // Primitive value - but it might contain nested structures, so deserialize it
        return this.deserializeAstroValue(data)
      } else if (type === 1) {
        // Array or object
        if (Array.isArray(data)) {
          // Check if this looks like an object (array of [key, value] pairs where key is a string)
          if (data.length > 0 && Array.isArray(data[0]) && data[0].length === 2 && typeof data[0][0] === 'string') {
            // Object format: [["key", value], ["key", value], ...]
            const obj: any = {}
            for (const [key, val] of data) {
              obj[this.deserializeAstroValue(key)] = this.deserializeAstroValue(val)
            }
            return obj
          } else {
            // Array format: [[0, item1], [0, item2], ...]
            return data.map((item) => this.deserializeAstroValue(item))
          }
        }
        return this.deserializeAstroValue(data)
      }
    }

    // Regular array (not an Astro tuple)
    return value.map((item) => this.deserializeAstroValue(item))
  }


  /**
   * Removes duplicate plans based on data amount and validity
   */
  private deduplicatePlans(plans: ScrapedPlan[]): ScrapedPlan[] {
    const seen = new Map<string, ScrapedPlan>()

    for (const plan of plans) {
      const key = `${plan.countryCode}-${plan.dataAmountGb}-${plan.validityDays}`

      if (!seen.has(key)) {
        seen.set(key, plan)
      }
    }

    return Array.from(seen.values())
  }
}
