/**
 * Currency conversion utilities for Holafly pricing
 *
 * Strategy:
 * 1. Holafly scraper will attempt to select USD currency in the UI
 * 2. If USD is not available, prices in EUR will be converted to USD
 * 3. Conversion rate should be updated monthly or fetched from an API
 */

/**
 * EUR to USD conversion rate
 * Last updated: 2024-01
 * Update this rate monthly or use fetchLiveEURtoUSDRate() for dynamic rates
 */
export const EUR_TO_USD_RATE = 1.10

/**
 * Converts EUR price to USD with proper rounding
 * @param eurPrice - Price in EUR
 * @returns Price in USD, rounded to 2 decimal places
 * @example
 * convertEURtoUSD(20) // 22.00
 */
export function convertEURtoUSD(eurPrice: number): number {
  return Math.round(eurPrice * EUR_TO_USD_RATE * 100) / 100
}

/**
 * Fetches live EUR to USD conversion rate from ExchangeRate-API
 * This is optional and can be used in future enhancements
 *
 * @returns Current EUR to USD rate, or fallback rate if API fails
 * @example
 * const rate = await fetchLiveEURtoUSDRate()
 * const usdPrice = eurPrice * rate
 */
export async function fetchLiveEURtoUSDRate(): Promise<number> {
  try {
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/EUR', {
      signal: AbortSignal.timeout(5000), // 5 second timeout
    })

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`)
    }

    const data = await response.json()

    if (data.rates?.USD && typeof data.rates.USD === 'number') {
      console.log(`[Currency] Fetched live EUR to USD rate: ${data.rates.USD}`)
      return data.rates.USD
    }

    throw new Error('Invalid API response format')
  } catch (error) {
    console.warn(`[Currency] Failed to fetch live rate, using fallback (${EUR_TO_USD_RATE}):`, error)
    return EUR_TO_USD_RATE
  }
}

/**
 * Currency symbols for detection in scraped text
 */
export const CURRENCY_SYMBOLS = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
} as const

/**
 * Detects currency from a price string
 * @param priceText - Text containing price (e.g., "$19.99", "€20.00")
 * @returns Currency code ('USD', 'EUR', etc.) or null if not detected
 */
export function detectCurrency(priceText: string): 'USD' | 'EUR' | 'GBP' | 'JPY' | null {
  if (priceText.includes(CURRENCY_SYMBOLS.USD)) return 'USD'
  if (priceText.includes(CURRENCY_SYMBOLS.EUR)) return 'EUR'
  if (priceText.includes(CURRENCY_SYMBOLS.GBP)) return 'GBP'
  if (priceText.includes(CURRENCY_SYMBOLS.JPY)) return 'JPY'
  return null
}
