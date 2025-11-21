/**
 * Maps ISO country codes to Holafly URL slugs
 * Only includes the 12 countries currently tracked in the cron job
 *
 * Usage:
 * - US -> "usa"
 * - GB -> "united-kingdom"
 * - buildHolaflyCountryUrl('US') -> "https://esim.holafly.com/esim-usa/"
 */

export const HOLAFLY_COUNTRY_SLUGS: Record<string, string> = {
  // Group 1: Americas & Europe (Cron Job 2 AM UTC)
  US: 'usa',
  CA: 'canada',
  GB: 'united-kingdom',
  DE: 'germany',
  FR: 'france',
  ES: 'spain',

  // Group 2: Europe & Asia Pacific (Cron Job 2 PM UTC)
  IT: 'italy',
  JP: 'japan',
  AU: 'australia',
  NL: 'netherlands',
  CH: 'switzerland',
  SG: 'singapore',
}

/**
 * Gets the Holafly URL slug for a country code
 * @param countryCode - ISO country code (e.g., 'US', 'GB')
 * @returns Holafly URL slug (e.g., 'united-states')
 * @throws Error if country is not supported
 */
export function getHolaflyCountrySlug(countryCode: string): string {
  const slug = HOLAFLY_COUNTRY_SLUGS[countryCode]
  if (!slug) {
    throw new Error(`Holafly does not support country: ${countryCode}. Supported countries: ${Object.keys(HOLAFLY_COUNTRY_SLUGS).join(', ')}`)
  }
  return slug
}

/**
 * Builds the full Holafly country URL for scraping
 * @param countryCode - ISO country code
 * @returns Full URL to Holafly country page
 * @example
 * buildHolaflyCountryUrl('US') // "https://esim.holafly.com/esim-usa/"
 */
export function buildHolaflyCountryUrl(countryCode: string): string {
  const slug = getHolaflyCountrySlug(countryCode)
  return `https://esim.holafly.com/esim-${slug}/`
}

/**
 * Checks if a country code is supported by Holafly scraper
 */
export function isCountrySupported(countryCode: string): boolean {
  return countryCode in HOLAFLY_COUNTRY_SLUGS
}
