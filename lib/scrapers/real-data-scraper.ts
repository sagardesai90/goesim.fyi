import { BaseScraper, type ScrapedPlan } from './base-scraper'
import { REAL_DATA_COUNTRIES } from './real-data/constants'
import {
    REAL_DATA_PROVIDER_HANDLERS,
    type RealDataProviderName,
} from './real-data/provider-handlers'

export class RealDataScraper extends BaseScraper {
    constructor(providerId: string, providerName: string, baseUrl: string) {
        super(providerId, providerName, baseUrl)
    }

    async scrapeCountry(countryCode: string): Promise<ScrapedPlan[]> {
        console.log(`[RealData] Scraping ${this.providerName} for ${countryCode}`)

        const handler = REAL_DATA_PROVIDER_HANDLERS[
            this.providerName as RealDataProviderName
        ]

        if (handler) {
            return handler(this.baseUrl, countryCode)
        }

        return []
    }

    async scrapeAllCountries(): Promise<ScrapedPlan[]> {
        const allPlans: ScrapedPlan[] = []

        for (const countryCode of REAL_DATA_COUNTRIES) {
            const plans = await this.scrapeCountry(countryCode)
            allPlans.push(...plans)
        }

        return allPlans
    }
}
