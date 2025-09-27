"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Wifi, Clock, Zap, Filter, ArrowUpDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AffiliateLinkButton } from "@/components/affiliate-link-button"
import { cn } from "@/lib/utils"

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

interface AffiliateLink {
  id: string
  affiliateUrl: string
}

interface PlanComparisonProps {
  plans: Plan[]
  selectedDataAmount?: string
}

export function PlanComparison({ plans, selectedDataAmount }: PlanComparisonProps) {
  const [sortBy, setSortBy] = useState<string>("price")
  const [filterData, setFilterData] = useState<string>(selectedDataAmount || "all")
  const [affiliateLinks, setAffiliateLinks] = useState<Record<string, AffiliateLink>>({})
  const router = useRouter()
  const searchParams = useSearchParams()

  // Load affiliate links for plans
  useEffect(() => {
    const loadAffiliateLinks = async () => {
      const links: Record<string, AffiliateLink> = {}

      for (const plan of plans) {
        try {
          const response = await fetch(`/api/affiliate/link?planId=${plan.id}`)
          if (response.ok) {
            const data = await response.json()
            if (data.affiliateLink) {
              links[plan.id] = data.affiliateLink
            }
          }
        } catch (error) {
          console.error(`Failed to load affiliate link for plan ${plan.id}:`, error)
        }
      }

      setAffiliateLinks(links)
    }

    if (plans.length > 0) {
      loadAffiliateLinks()
    }
  }, [plans])

  // Filter plans based on data amount
  const filteredPlans = plans.filter((plan) => {
    if (filterData === "all") return true
    if (filterData === "unlimited") return plan.is_unlimited

    const dataAmount = Number.parseFloat(filterData)
    if (plan.is_unlimited) return false

    // Allow some flexibility in data amount matching
    return Math.abs(plan.data_amount_gb - dataAmount) < 0.5
  })

  // Sort plans
  const sortedPlans = [...filteredPlans].sort((a, b) => {
    switch (sortBy) {
      case "price":
        return a.price_usd - b.price_usd
      case "data":
        if (a.is_unlimited && !b.is_unlimited) return -1
        if (!a.is_unlimited && b.is_unlimited) return 1
        return b.data_amount_gb - a.data_amount_gb
      case "value":
        if (!a.price_per_gb && !b.price_per_gb) return 0
        if (!a.price_per_gb) return 1
        if (!b.price_per_gb) return -1
        return a.price_per_gb - b.price_per_gb
      case "duration":
        return b.validity_days - a.validity_days
      default:
        return 0
    }
  })

  const handleFilterChange = (value: string) => {
    setFilterData(value)
    const params = new URLSearchParams(searchParams)
    if (value !== "all") {
      params.set("data", value)
    } else {
      params.delete("data")
    }
    router.push(`/?${params.toString()}`)
  }

  // Get unique data amounts for filter
  const dataAmounts = Array.from(
    new Set(plans.filter((plan) => !plan.is_unlimited).map((plan) => plan.data_amount_gb)),
  ).sort((a, b) => a - b)

  const hasUnlimited = plans.some((plan) => plan.is_unlimited)

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">
            eSIM Plans{plans.length > 0 && plans[0]?.country?.name ? ` for ${plans[0].country.name}` : ""}
          </h2>
          <p className="text-muted-foreground">{sortedPlans.length} plans available</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Select value={filterData} onValueChange={handleFilterChange}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by data" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Plans</SelectItem>
              {dataAmounts.map((amount) => (
                <SelectItem key={amount} value={amount.toString()}>
                  {amount}GB
                </SelectItem>
              ))}
              {hasUnlimited && <SelectItem value="unlimited">Unlimited</SelectItem>}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <ArrowUpDown className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="price">Price (Low to High)</SelectItem>
              <SelectItem value="data">Data Amount</SelectItem>
              <SelectItem value="value">Best Value ($/GB)</SelectItem>
              <SelectItem value="duration">Duration</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedPlans.map((plan, index) => {
          const affiliateLink = affiliateLinks[plan.id]

          return (
            <Card
              key={plan.id}
              className={cn(
                "relative transition-all duration-200 hover:shadow-lg",
                index === 0 && "ring-2 ring-primary/20 shadow-lg",
              )}
            >
              {index === 0 && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">Best Deal</Badge>
                </div>
              )}

              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{plan.provider.name}</CardTitle>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">${plan.price_usd}</div>
                    {plan.price_per_gb && (
                      <div className="text-sm text-muted-foreground">${plan.price_per_gb.toFixed(2)}/GB</div>
                    )}
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Wifi className="h-4 w-4 text-primary" />
                    <span className="font-medium">
                      {plan.is_unlimited ? "Unlimited Data" : `${plan.data_amount_gb}GB`}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    <span>{plan.validity_days} days</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-primary" />
                    <span>{plan.network_type}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {plan.hotspot_allowed && (
                    <Badge variant="secondary" className="text-xs">
                      Hotspot
                    </Badge>
                  )}
                  {plan.voice_calls && (
                    <Badge variant="secondary" className="text-xs">
                      Voice
                    </Badge>
                  )}
                  {plan.sms_included && (
                    <Badge variant="secondary" className="text-xs">
                      SMS
                    </Badge>
                  )}
                </div>

                <AffiliateLinkButton
                  planId={plan.id}
                  originalUrl={plan.plan_url}
                  affiliateUrl={affiliateLink?.affiliateUrl}
                  affiliateLinkId={affiliateLink?.id}
                  className="w-full"
                >
                  Buy Now
                </AffiliateLinkButton>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {sortedPlans.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">No plans found for the selected filters.</p>
          <Button variant="outline" onClick={() => handleFilterChange("all")} className="mt-4">
            Show All Plans
          </Button>
        </div>
      )}
    </div>
  )
}
