import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { HeroSection } from "@/components/hero-section"
import { HomePageClient } from "@/components/home-page-client"
import { PlansLoadingState } from "@/components/plans-loading-state"

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ country?: string; data?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  // Fetch only countries that have active eSIM plans
  const { data: countries, error } = await supabase
    .from("countries")
    .select(`
      *,
      esim_plans!inner(id)
    `)
    .eq("esim_plans.is_active", true)
    .order("name")

  // Remove duplicate countries (in case a country has multiple plans)
  const uniqueCountries = countries?.filter(
    (country, index, self) =>
      index === self.findIndex((c) => c.code === country.code)
  ) || []

  // Fetch plans if country is selected
  let plans = null
  let lastUpdated = null
  if (params.country) {
    // First get the country ID
    const { data: countryData } = await supabase
      .from("countries")
      .select("id")
      .eq("code", params.country)
      .single()

    if (countryData) {
      // Then get plans for that country
      const { data: plansData, error: plansError } = await supabase
        .from("esim_plans")
        .select(`
          *,
          provider:providers(*),
          country:countries(*)
        `)
        .eq("country_id", countryData.id)
        .eq("is_active", true)
        .order("price_usd")

      if (plansError) {
        console.error("Error fetching plans:", plansError)
      }
      plans = plansData
      
      // Get the most recent last_scraped_at timestamp from the plans
      if (plansData && plansData.length > 0) {
        const timestamps = plansData
          .map(plan => plan.last_scraped_at)
          .filter(Boolean)
          .map(ts => new Date(ts).getTime())
        
        if (timestamps.length > 0) {
          lastUpdated = new Date(Math.max(...timestamps)).toISOString()
        }
      }
    } else {
      plans = []
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <HeroSection countries={uniqueCountries} selectedCountry={params.country} />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <HomePageClient
            plans={plans}
            selectedCountry={params.country}
            selectedDataAmount={params.data}
            countries={uniqueCountries}
            lastUpdated={lastUpdated}
          />
        </div>
      </main>
    </div>
  )
}
