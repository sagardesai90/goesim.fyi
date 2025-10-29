"use client"

import { Wifi, Clock, Zap } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AffiliateLinkButton } from "@/components/affiliate-link-button"
import { AddToCompareButton } from "@/components/add-to-compare-button"
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

interface PlanCardProps {
  plan: Plan
  isBestDeal?: boolean
}

export function PlanCard({ plan, isBestDeal }: PlanCardProps) {
  console.log("[v0] PlanCard received plan:", {
    id: plan?.id,
    name: plan?.name,
    provider: plan?.provider,
    country: plan?.country,
    hasProvider: !!plan?.provider,
    hasCountry: !!plan?.country,
    providerName: plan?.provider?.name,
    countryName: plan?.country?.name,
  })

  if (!plan) {
    console.log("[v0] PlanCard: Plan is null or undefined")
    return null
  }

  return (
    <Card
      className={cn(
        "relative transition-all duration-200 hover:shadow-lg",
        isBestDeal && "ring-2 ring-primary/20 shadow-lg",
      )}
    >
      {isBestDeal && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground">Best Deal</Badge>
        </div>
      )}

      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{plan.provider?.name || "Unknown Provider"}</CardTitle>
            <p className="text-sm text-muted-foreground">{plan.country?.name || "Unknown Country"}</p>
          </div>
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
            <span className="font-medium">{plan.is_unlimited ? "Unlimited Data" : `${plan.data_amount_gb}GB`}</span>
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

        <div className="flex gap-2">
          <AffiliateLinkButton planId={plan.id} originalUrl={plan.plan_url} className="flex-1">
            Buy Now
          </AffiliateLinkButton>
          <AddToCompareButton 
            planId={plan.id} 
            planName={`${plan.provider?.name} - ${plan.data_amount_gb}GB`}
          />
        </div>
      </CardContent>
    </Card>
  )
}
