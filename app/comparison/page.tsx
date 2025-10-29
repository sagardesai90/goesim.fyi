"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { ComparisonCard, type ComparisonPlan } from "@/components/comparison-card"
import { ComparisonTable } from "@/components/comparison-table"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, LayoutGrid, Table as TableIcon } from "lucide-react"
import Link from "next/link"

export default function ComparisonPage() {
  const [plans, setPlans] = useState<ComparisonPlan[]>([])
  const [loading, setLoading] = useState(true)
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards")
  const router = useRouter()

  useEffect(() => {
    loadComparisonPlans()

    // Listen for comparison updates
    const handleComparisonUpdate = () => {
      loadComparisonPlans()
    }

    window.addEventListener("comparison-updated", handleComparisonUpdate)
    return () => window.removeEventListener("comparison-updated", handleComparisonUpdate)
  }, [])

  const loadComparisonPlans = async () => {
    setLoading(true)
    try {
      const storedPlans = localStorage.getItem("comparison-plans")
      const planIds: string[] = storedPlans ? JSON.parse(storedPlans) : []

      if (planIds.length === 0) {
        setPlans([])
        setLoading(false)
        return
      }

      const supabase = createClient()
      const { data, error } = await supabase
        .from("esim_plans")
        .select(
          `
          id,
          name,
          data_amount_gb,
          validity_days,
          price_usd,
          is_unlimited,
          price_per_gb,
          price_per_day,
          network_type,
          hotspot_allowed,
          voice_calls,
          sms_included,
          plan_url,
          provider:providers(
            id,
            name,
            logo_url
          ),
          country:countries(
            name,
            code
          )
        `
        )
        .in("id", planIds)
        .eq("is_active", true)

      if (error) {
        console.error("Error fetching comparison plans:", error)
        setPlans([])
      } else {
        // Sort plans to match the order in localStorage
        const sortedPlans = planIds
          .map((id) => data?.find((plan) => plan.id === id))
          .filter((plan): plan is ComparisonPlan => plan !== undefined)
        setPlans(sortedPlans)
      }
    } catch (error) {
      console.error("Error loading comparison plans:", error)
      setPlans([])
    } finally {
      setLoading(false)
    }
  }

  const handleRemovePlan = (planId: string) => {
    const storedPlans = localStorage.getItem("comparison-plans")
    const planIds: string[] = storedPlans ? JSON.parse(storedPlans) : []
    const updatedPlans = planIds.filter((id) => id !== planId)
    localStorage.setItem("comparison-plans", JSON.stringify(updatedPlans))
    
    // Update state and dispatch event
    setPlans(plans.filter((plan) => plan.id !== planId))
    window.dispatchEvent(new CustomEvent("comparison-updated", { detail: updatedPlans }))
  }

  const handleClearAll = () => {
    localStorage.removeItem("comparison-plans")
    setPlans([])
    window.dispatchEvent(new CustomEvent("comparison-updated", { detail: [] }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground">Loading comparison...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="space-y-4">
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Search
              </Button>
            </Link>
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Compare eSIM Plans</h1>
                <p className="text-muted-foreground mt-2">
                  {plans.length === 0
                    ? "No plans selected for comparison"
                    : `Comparing ${plans.length} ${plans.length === 1 ? "plan" : "plans"}`}
                </p>
              </div>

              {plans.length > 0 && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleClearAll}
                    className="gap-2"
                  >
                    Clear All
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Empty State */}
          {plans.length === 0 && (
            <div className="text-center py-12 space-y-4">
              <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center">
                <LayoutGrid className="h-12 w-12 text-muted-foreground" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold mb-2">No Plans to Compare</h2>
                <p className="text-muted-foreground mb-6">
                  Start by adding plans from the search page using the "Compare" button.
                </p>
                <Link href="/">
                  <Button>Browse Plans</Button>
                </Link>
              </div>
            </div>
          )}

          {/* Comparison Content */}
          {plans.length > 0 && (
            <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as "cards" | "table")}>
              <div className="flex justify-center mb-6">
                <TabsList>
                  <TabsTrigger value="cards" className="gap-2">
                    <LayoutGrid className="h-4 w-4" />
                    Card View
                  </TabsTrigger>
                  <TabsTrigger value="table" className="gap-2">
                    <TableIcon className="h-4 w-4" />
                    Table View
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="cards" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {plans.map((plan) => (
                    <ComparisonCard
                      key={plan.id}
                      plan={plan}
                      onRemove={() => handleRemovePlan(plan.id)}
                    />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="table">
                <ComparisonTable plans={plans} />
              </TabsContent>
            </Tabs>
          )}

          {/* Help Text */}
          {plans.length > 0 && plans.length < 3 && (
            <div className="text-center text-sm text-muted-foreground">
              You can compare up to 3 plans. Add {3 - plans.length} more from the search page.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
