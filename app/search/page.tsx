"use client"

import { createClient } from "@/lib/supabase/client"
import { AdvancedSearch } from "@/components/advanced-search"
import { SearchResults } from "@/components/search-results"
import { Suspense, useEffect, useState } from "react"

export default function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  const [params, setParams] = useState<Record<string, string>>({})
  const [countries, setCountries] = useState<Array<{ code: string; name: string }>>([])
  const [providers, setProviders] = useState<Array<{ name: string }>>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initializeData = async () => {
      const resolvedParams = await searchParams
      setParams(resolvedParams)

      const supabase = createClient()

      // Fetch countries and providers for filters
      const [{ data: countriesData }, { data: providersData }] = await Promise.all([
        supabase.from("countries").select("code, name").order("name"),
        supabase.from("providers").select("name").eq("is_active", true).order("name"),
      ])

      setCountries(countriesData || [])
      setProviders(providersData || [])
      setLoading(false)
    }

    initializeData()
  }, [searchParams])

  const searchParamsObj = new URLSearchParams(params)

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div>Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold">Search eSIM Plans</h1>
            <p className="text-muted-foreground">Find the perfect eSIM plan with advanced search and filtering</p>
          </div>

          <AdvancedSearch
            countries={countries}
            providers={providers}
            onSearch={(filters) => {
              const params = new URLSearchParams()
              Object.entries(filters).forEach(([key, value]) => {
                if (value && (typeof value === "string" ? value.trim() : value.length > 0)) {
                  if (Array.isArray(value)) {
                    params.set(key, value.join(","))
                  } else {
                    params.set(key, value)
                  }
                }
              })
              window.location.href = `/search?${params.toString()}`
            }}
            initialFilters={Object.fromEntries(searchParamsObj.entries())}
          />

          <Suspense fallback={<div>Loading results...</div>}>
            <SearchResults searchParams={searchParamsObj} />
          </Suspense>
        </div>
      </div>
    </div>
  )
}
