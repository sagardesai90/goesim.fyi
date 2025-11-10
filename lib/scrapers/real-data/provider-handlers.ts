import type { ScrapedPlan } from '../base-scraper'

import { getAiraloPlans } from './airalo'
import { getHolaflyPlans } from './holafly'
import { getSailyPlans } from './saily'

export type RealDataProviderName = 'Airalo' | 'Holafly' | 'Saily'

export type RealDataProviderHandler = (baseUrl: string, countryCode: string) => ScrapedPlan[]

export const REAL_DATA_PROVIDER_HANDLERS: Record<RealDataProviderName, RealDataProviderHandler> = {
  Airalo: getAiraloPlans,
  Holafly: getHolaflyPlans,
  Saily: getSailyPlans,
}


