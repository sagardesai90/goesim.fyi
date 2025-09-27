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
  const { data: countries } = await supabase.from("countries").select("*").order("name")

  // Fetch plans if country is selected
  let plans = null
  if (params.country) {
    const { data: plansData } = await supabase
      .from("esim_plans")
      .select(`
        *,
        provider:providers(*),
        country:countries(*)
      `)
      .eq("country.code", params.country)
      .eq("is_active", true)
      .order("price_usd")

    plans = plansData
  }

  return (
    <div className="min-h-screen bg-background">
      <HeroSection />

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <CountrySelector countries={countries || []} selectedCountry={params.country} />

          {plans && <PlanComparison plans={plans} selectedDataAmount={params.data} />}
        </div>
      </main>
    </div>
  )
}
