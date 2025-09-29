import { createClient } from "@/lib/supabase/server"
import { CountrySelector } from "@/components/country-selector"
import { PlanComparison } from "@/components/plan-comparison"
import { HeroSection } from "@/components/hero-section"

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ country?: string; data?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  // Fetch countries for the selector
  const { data: countries, error } = await supabase.from("countries").select("*").order("name")

  // Fetch plans if country is selected
  let plans = null
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
    } else {
      plans = []
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <HeroSection />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <CountrySelector countries={countries || []} selectedCountry={params.country} />

          {plans && plans.length > 0 ? (
            <PlanComparison plans={plans} selectedDataAmount={params.data} />
          ) : params.country ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">
                No eSIM plans found for {countries?.find(c => c.code === params.country)?.name || params.country}.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Try selecting a different country or check back later for new plans.
              </p>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  )
}
