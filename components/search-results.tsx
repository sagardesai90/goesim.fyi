"use client"

import { useState, useEffect } from "react"
import { Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { PlanCard } from "@/components/plan-card"

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

interface SearchResultsProps {
  searchParams: URLSearchParams
  onLoadMore?: () => void
}

export function SearchResults({ searchParams, onLoadMore }: SearchResultsProps) {
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 20,
    offset: 0,
    hasMore: false,
  })

  const performSearch = async (isLoadMore = false) => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams(searchParams)
      if (isLoadMore) {
        params.set("offset", pagination.offset.toString())
      } else {
        params.set("offset", "0")
        setPlans([]) // Clear existing results for new search
      }
      params.set("limit", pagination.limit.toString())

      const response = await fetch(`/api/search?${params.toString()}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Search failed")
      }

      if (isLoadMore) {
        setPlans((prev) => [...prev, ...data.plans])
      } else {
        setPlans(data.plans)
      }

      setPagination(data.pagination)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    performSearch()
  }, [searchParams])

  const handleLoadMore = () => {
    setPagination((prev) => ({ ...prev, offset: prev.offset + prev.limit }))
    performSearch(true)
  }

  if (loading && plans.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Searching plans...</span>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  if (plans.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground text-lg mb-4">No plans found matching your criteria.</p>
        <p className="text-sm text-muted-foreground">Try adjusting your filters or search terms.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground">
          Showing {plans.length} of {pagination.total} plans
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map((plan, index) => (
          <PlanCard key={plan.id} plan={plan} isBestDeal={index === 0} />
        ))}
      </div>

      {pagination.hasMore && (
        <div className="text-center pt-6">
          <Button onClick={handleLoadMore} disabled={loading} variant="outline">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Loading...
              </>
            ) : (
              "Load More Plans"
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
