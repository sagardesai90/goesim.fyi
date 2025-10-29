"use client"

import { Wifi, Clock, Zap, Check, X, ExternalLink } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AffiliateLinkButton } from "@/components/affiliate-link-button"
import { cn } from "@/lib/utils"

export interface ComparisonPlan {
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

interface ComparisonCardProps {
  plan: ComparisonPlan
  onRemove?: () => void
  className?: string
}

export function ComparisonCard({ plan, onRemove, className }: ComparisonCardProps) {
  if (!plan) {
    return null
  }

  return (
    <Card className={cn("relative h-full flex flex-col", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <CardTitle className="text-xl font-bold">{plan.provider?.name || "Unknown Provider"}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{plan.country?.name || "Unknown Country"}</p>
          </div>
          {onRemove && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onRemove}
              className="h-8 w-8 text-muted-foreground hover:text-destructive"
              aria-label="Remove from comparison"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="mt-4 text-center">
          <div className="text-4xl font-bold text-primary">${plan.price_usd}</div>
          {plan.price_per_gb && (
            <div className="text-sm text-muted-foreground mt-1">${plan.price_per_gb.toFixed(2)}/GB</div>
          )}
          {plan.price_per_day && (
            <div className="text-xs text-muted-foreground">${plan.price_per_day.toFixed(2)}/day</div>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col gap-6">
        {/* Key Features */}
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <Wifi className="h-5 w-5 text-primary flex-shrink-0" />
            <div>
              <div className="font-semibold">{plan.is_unlimited ? "Unlimited Data" : `${plan.data_amount_gb}GB`}</div>
              <div className="text-xs text-muted-foreground">Data allowance</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <Clock className="h-5 w-5 text-primary flex-shrink-0" />
            <div>
              <div className="font-semibold">{plan.validity_days} days</div>
              <div className="text-xs text-muted-foreground">Validity period</div>
            </div>
          </div>

          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
            <Zap className="h-5 w-5 text-primary flex-shrink-0" />
            <div>
              <div className="font-semibold">{plan.network_type}</div>
              <div className="text-xs text-muted-foreground">Network type</div>
            </div>
          </div>
        </div>

        {/* Features List */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Features</h4>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              {plan.hotspot_allowed ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <X className="h-4 w-4 text-muted-foreground" />
              )}
              <span className={cn("text-sm", plan.hotspot_allowed ? "text-foreground" : "text-muted-foreground")}>
                Hotspot / Tethering
              </span>
            </div>
            <div className="flex items-center gap-2">
              {plan.voice_calls ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <X className="h-4 w-4 text-muted-foreground" />
              )}
              <span className={cn("text-sm", plan.voice_calls ? "text-foreground" : "text-muted-foreground")}>
                Voice Calls
              </span>
            </div>
            <div className="flex items-center gap-2">
              {plan.sms_included ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <X className="h-4 w-4 text-muted-foreground" />
              )}
              <span className={cn("text-sm", plan.sms_included ? "text-foreground" : "text-muted-foreground")}>
                SMS Messaging
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-auto space-y-2">
          <AffiliateLinkButton planId={plan.id} originalUrl={plan.plan_url} className="w-full">
            Buy Now
          </AffiliateLinkButton>
          <Button variant="outline" className="w-full" asChild>
            <a href={plan.plan_url} target="_blank" rel="noopener noreferrer">
              View Details
              <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
