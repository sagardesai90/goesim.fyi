import type { ScrapedPlan } from '../base-scraper'

import { SAILY_UNLIMITED_COUNTRIES } from './constants'
import { SAILY_COUNTRY_SLUGS } from './saily-country-slugs'
import { SAILY_PRICING } from './saily-pricing'
import { SAILY_UNLIMITED_PRICING } from './saily-unlimited-pricing'

export function getSailyPlans(baseUrl: string, countryCode: string): ScrapedPlan[] {
  const countrySlug = getSailyCountrySlug(countryCode)
  void countrySlug

  const basePlans: ScrapedPlan[] = [
    createSailyPlan(baseUrl, countryCode, 1, 7),
    createSailyPlan(baseUrl, countryCode, 3, 30),
    createSailyPlan(baseUrl, countryCode, 5, 30),
    createSailyPlan(baseUrl, countryCode, 10, 30),
    createSailyPlan(baseUrl, countryCode, 20, 30),
  ]

  if ((SAILY_UNLIMITED_COUNTRIES as readonly string[]).includes(countryCode)) {
    basePlans.push(...createSailyUnlimitedPlans(baseUrl, countryCode))
  }

  return basePlans
}

function createSailyPlan(
  baseUrl: string,
  countryCode: string,
  dataAmountGb: number,
  validityDays: number,
): ScrapedPlan {
  return {
    name: `${countryCode} ${dataAmountGb}GB - ${validityDays} Days`,
    dataAmountGb,
    validityDays,
    priceUsd: getSailyPrice(countryCode, dataAmountGb, validityDays),
    isUnlimited: false,
    networkType: '4G/5G',
    hotspotAllowed: true,
    voiceCalls: false,
    smsIncluded: false,
    planUrl: `${baseUrl}/${countryCode.toLowerCase()}-esim`,
    countryCode,
  }
}

function createSailyUnlimitedPlans(baseUrl: string, countryCode: string): ScrapedPlan[] {
  return [10, 15, 20, 25, 30].map((days) => ({
    name: `${countryCode} Unlimited - ${days} Days`,
    dataAmountGb: 999,
    validityDays: days,
    priceUsd: getSailyUnlimitedPrice(countryCode, days),
    isUnlimited: true,
    networkType: '4G/5G',
    hotspotAllowed: true,
    voiceCalls: false,
    smsIncluded: false,
    planUrl: `${baseUrl}/${countryCode.toLowerCase()}-esim`,
    countryCode,
  }))
}

function getSailyPrice(countryCode: string, dataGB: number, days: number): number {
  const countryPricing = SAILY_PRICING[countryCode] || SAILY_PRICING.US

  const key = `${dataGB}_${days}`
  return countryPricing[key] || 13.99
}

function getSailyUnlimitedPrice(countryCode: string, days: number): number {
  const countryPricing = SAILY_UNLIMITED_PRICING[countryCode] || SAILY_UNLIMITED_PRICING.US
  return countryPricing[days] || 48.99
}

function getSailyCountrySlug(countryCode: string): string {
  return SAILY_COUNTRY_SLUGS[countryCode] || `esim-${countryCode.toLowerCase()}`
}


