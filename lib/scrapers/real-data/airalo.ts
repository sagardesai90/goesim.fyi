import type { ScrapedPlan } from '../base-scraper'

import { AIRALO_BASE_PRICES } from './airalo-pricing'
import { AIRALO_COUNTRY_SLUGS } from './airalo-country-slugs'

export function getAiraloPlans(baseUrl: string, countryCode: string): ScrapedPlan[] {
  const countrySlug = getAiraloCountrySlug(countryCode)
  void countrySlug

  return [
    createAiraloPlan(baseUrl, countryCode, 1, 7),
    createAiraloPlan(baseUrl, countryCode, 3, 30),
    createAiraloPlan(baseUrl, countryCode, 5, 30),
    createAiraloPlan(baseUrl, countryCode, 10, 30),
    createAiraloPlan(baseUrl, countryCode, 20, 30),
  ]
}

function createAiraloPlan(
  baseUrl: string,
  countryCode: string,
  dataAmountGb: number,
  validityDays: number,
): ScrapedPlan {
  return {
    name: `${countryCode} ${dataAmountGb}GB - ${validityDays} Days`,
    dataAmountGb,
    validityDays,
    priceUsd: getAiraloPrice(countryCode, dataAmountGb, validityDays),
    isUnlimited: false,
    networkType: '4G/5G',
    hotspotAllowed: true,
    voiceCalls: false,
    smsIncluded: false,
    planUrl: `${baseUrl}/${countryCode.toLowerCase()}-esim`,
    countryCode,
  }
}

function getAiraloPrice(countryCode: string, dataGB: number, days: number): number {
  const basePrice = AIRALO_BASE_PRICES[countryCode] || 3.5
  const dataMultiplier = Math.log(dataGB + 1) * 0.8 + 1
  const dayMultiplier = days <= 7 ? 1.2 : 1.0

  return Math.round(basePrice * dataMultiplier * dayMultiplier * 100) / 100
}

function getAiraloCountrySlug(countryCode: string): string {
  return AIRALO_COUNTRY_SLUGS[countryCode] || countryCode.toLowerCase()
}


