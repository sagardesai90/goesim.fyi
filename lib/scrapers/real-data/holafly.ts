/**
 * @deprecated This static data generator is deprecated and no longer used.
 * Holafly now uses HolaflyPuppeteerScraper for dynamic real-time pricing.
 *
 * This file is kept for reference only.
 */

import type { ScrapedPlan } from '../base-scraper'

import { HOLALFY_BASE_PRICES } from './holafly-pricing'

export function getHolaflyPlans(baseUrl: string, countryCode: string): ScrapedPlan[] {
  return [
    createHolaflyPlan(baseUrl, countryCode, 5),
    createHolaflyPlan(baseUrl, countryCode, 7),
    createHolaflyPlan(baseUrl, countryCode, 15),
    createHolaflyPlan(baseUrl, countryCode, 30),
  ]
}

function createHolaflyPlan(baseUrl: string, countryCode: string, days: number): ScrapedPlan {
  return {
    name: `${countryCode} Unlimited - ${days} Days`,
    dataAmountGb: 999,
    validityDays: days,
    priceUsd: getHolaflyPrice(countryCode, days),
    isUnlimited: true,
    networkType: '4G/5G',
    hotspotAllowed: true,
    voiceCalls: false,
    smsIncluded: false,
    planUrl: `${baseUrl}/${countryCode.toLowerCase()}-esim`,
    countryCode,
  }
}

function getHolaflyPrice(countryCode: string, days: number): number {
  const basePrice = HOLALFY_BASE_PRICES[countryCode] || 15.0
  const dayMultiplier = days <= 5 ? 1.0 : days <= 7 ? 1.2 : days <= 15 ? 1.8 : 2.5

  return Math.round(basePrice * dayMultiplier * 100) / 100
}


