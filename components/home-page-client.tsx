"use client"

import { useEffect, useState, useTransition } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { PlanComparison } from "@/components/plan-comparison"
import { PlansLoadingState } from "@/components/plans-loading-state"
import { DataFreshnessIndicator } from "@/components/data-freshness-indicator"

interface Country {
  id: string
  name: string
  code: string
  region: string
}

interface Plan {
  id: string
  name: string
  data_amount_gb: number
  validity_days: number
  price_usd: number
  is_unlimited: boolean
  price_per_gb: number | null
  price_per_day: number | null
  network_type: string
  hotspot_allowed: boolean
  voice_calls: boolean
  sms_included: boolean
  plan_url: string
  provider: {
    id: string
    name: string
    logo_url: string | null
  }
  country: {
    name: string
    code: string
  }
}

interface HomePageClientProps {
  plans: Plan[] | null
  selectedCountry?: string
  selectedDataAmount?: string
  countries: Country[]
  lastUpdated?: string | null
}

export function HomePageClient({
  plans: initialPlans,
  selectedCountry,
  selectedDataAmount,
  countries,
  lastUpdated,
}: HomePageClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [isPending, startTransition] = useTransition()

  // Track when country changes to show loading state
  useEffect(() => {
    const handleStart = () => setIsLoading(true)
    const handleComplete = () => setIsLoading(false)

    // Listen for route changes
    router.prefetch(`/?${searchParams.toString()}`)

    return () => {
      setIsLoading(false)
    }
  }, [selectedCountry, searchParams, router])

  // Show loading state if transitioning
  const showLoading = isLoading || isPending

  // Get country name for loading state
  const selectedCountryData = countries.find((c) => c.code === selectedCountry)

  // If loading and we have a country selected
  if (showLoading && selectedCountry) {
    return <PlansLoadingState countryName={selectedCountryData?.name} />
  }

  // Show plans if available
  if (initialPlans && initialPlans.length > 0) {
    return (
      <div className="space-y-4">
        {lastUpdated && (
          <div className="flex justify-center">
            <DataFreshnessIndicator lastUpdated={lastUpdated} />
          </div>
        )}
        <PlanComparison plans={initialPlans} selectedDataAmount={selectedDataAmount} />
      </div>
    )
  }

  // If we have a country selected but no plans (null or empty array) and not loading, show no results
  if (selectedCountry && !showLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground text-lg">
          No eSIM plans found for {selectedCountryData?.name || selectedCountry}.
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Try selecting a different country or check back later for new plans.
        </p>
      </div>
    )
  }

  // Default: show nothing (no country selected)
  return null
}
