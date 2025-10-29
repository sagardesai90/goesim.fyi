"use client"

import { Check, X } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AffiliateLinkButton } from "@/components/affiliate-link-button"
import { cn } from "@/lib/utils"
import type { ComparisonPlan } from "./comparison-card"

interface ComparisonTableProps {
  plans: ComparisonPlan[]
  className?: string
}

interface ComparisonRow {
  label: string
  getValue: (plan: ComparisonPlan) => string | boolean | number
  renderValue?: (value: any) => React.ReactNode
}

export function ComparisonTable({ plans, className }: ComparisonTableProps) {
  if (!plans || plans.length === 0) {
    return null
  }

  const rows: ComparisonRow[] = [
    {
      label: "Provider",
      getValue: (plan) => plan.provider?.name || "Unknown",
    },
    {
      label: "Country",
      getValue: (plan) => plan.country?.name || "Unknown",
    },
    {
      label: "Price",
      getValue: (plan) => plan.price_usd,
      renderValue: (value) => <span className="text-lg font-bold text-primary">${value}</span>,
    },
    {
      label: "Data Amount",
      getValue: (plan) => (plan.is_unlimited ? "Unlimited" : `${plan.data_amount_gb}GB`),
      renderValue: (value) => <Badge variant="secondary">{value}</Badge>,
    },
    {
      label: "Validity",
      getValue: (plan) => `${plan.validity_days} days`,
    },
    {
      label: "Price per GB",
      getValue: (plan) => plan.price_per_gb,
      renderValue: (value) => (value ? `$${value.toFixed(2)}` : "N/A"),
    },
    {
      label: "Price per Day",
      getValue: (plan) => plan.price_per_day,
      renderValue: (value) => (value ? `$${value.toFixed(2)}` : "N/A"),
    },
    {
      label: "Network Type",
      getValue: (plan) => plan.network_type,
      renderValue: (value) => <Badge variant="outline">{value}</Badge>,
    },
    {
      label: "Hotspot Allowed",
      getValue: (plan) => plan.hotspot_allowed,
      renderValue: (value) =>
        value ? (
          <Check className="h-5 w-5 text-green-600 mx-auto" />
        ) : (
          <X className="h-5 w-5 text-muted-foreground mx-auto" />
        ),
    },
    {
      label: "Voice Calls",
      getValue: (plan) => plan.voice_calls,
      renderValue: (value) =>
        value ? (
          <Check className="h-5 w-5 text-green-600 mx-auto" />
        ) : (
          <X className="h-5 w-5 text-muted-foreground mx-auto" />
        ),
    },
    {
      label: "SMS Included",
      getValue: (plan) => plan.sms_included,
      renderValue: (value) =>
        value ? (
          <Check className="h-5 w-5 text-green-600 mx-auto" />
        ) : (
          <X className="h-5 w-5 text-muted-foreground mx-auto" />
        ),
    },
  ]

  return (
    <Card className={cn("overflow-hidden", className)}>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="p-4 text-left font-semibold text-sm text-muted-foreground uppercase tracking-wide sticky left-0 bg-muted/50 z-10">
                Feature
              </th>
              {plans.map((plan, index) => (
                <th
                  key={plan.id}
                  className={cn(
                    "p-4 text-center font-semibold min-w-[200px]",
                    index === 0 && "bg-primary/5"
                  )}
                >
                  <div className="text-base">{plan.provider?.name}</div>
                  <div className="text-xs font-normal text-muted-foreground mt-1">
                    {plan.country?.name}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr
                key={row.label}
                className={cn(
                  "border-b transition-colors hover:bg-muted/30",
                  rowIndex % 2 === 0 && "bg-muted/10"
                )}
              >
                <td className="p-4 font-medium text-sm sticky left-0 bg-background z-10 border-r">
                  {row.label}
                </td>
                {plans.map((plan, planIndex) => {
                  const value = row.getValue(plan)
                  const rendered = row.renderValue ? row.renderValue(value) : value?.toString()
                  return (
                    <td
                      key={`${plan.id}-${row.label}`}
                      className={cn(
                        "p-4 text-center",
                        planIndex === 0 && "bg-primary/5"
                      )}
                    >
                      {rendered}
                    </td>
                  )
                })}
              </tr>
            ))}
            <tr>
              <td className="p-4 sticky left-0 bg-background z-10 border-r"></td>
              {plans.map((plan) => (
                <td key={`action-${plan.id}`} className="p-4">
                  <AffiliateLinkButton
                    planId={plan.id}
                    originalUrl={plan.plan_url}
                    className="w-full"
                  >
                    Buy Now
                  </AffiliateLinkButton>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </Card>
  )
}
