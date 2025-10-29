"use client"

import { useState, useEffect } from "react"
import { Plus, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface AddToCompareButtonProps {
  planId: string
  planName?: string
  variant?: "default" | "outline" | "ghost" | "secondary"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
}

const MAX_COMPARISON_PLANS = 3

export function AddToCompareButton({
  planId,
  planName = "Plan",
  variant = "outline",
  size = "sm",
  className,
}: AddToCompareButtonProps) {
  const [isAdded, setIsAdded] = useState(false)
  const [comparisonCount, setComparisonCount] = useState(0)
  const { toast } = useToast()

  useEffect(() => {
    // Check if plan is already in comparison
    const storedPlans = getComparisonPlans()
    setIsAdded(storedPlans.includes(planId))
    setComparisonCount(storedPlans.length)

    // Listen for comparison updates
    const handleComparisonUpdate = (event: Event) => {
      const customEvent = event as CustomEvent
      const updatedPlans = customEvent.detail || []
      setIsAdded(updatedPlans.includes(planId))
      setComparisonCount(updatedPlans.length)
    }

    window.addEventListener("comparison-updated", handleComparisonUpdate)
    
    return () => {
      window.removeEventListener("comparison-updated", handleComparisonUpdate)
    }
  }, [planId])

  const getComparisonPlans = (): string[] => {
    if (typeof window === "undefined") return []
    const stored = localStorage.getItem("comparison-plans")
    return stored ? JSON.parse(stored) : []
  }

  const handleToggleCompare = () => {
    const storedPlans = getComparisonPlans()

    if (isAdded) {
      // Remove from comparison
      const updatedPlans = storedPlans.filter((id) => id !== planId)
      localStorage.setItem("comparison-plans", JSON.stringify(updatedPlans))
      setIsAdded(false)
      setComparisonCount(updatedPlans.length)
      
      toast({
        title: "Removed from comparison",
        description: `${planName} has been removed from your comparison.`,
      })

      // Dispatch event for other components to listen
      window.dispatchEvent(new CustomEvent("comparison-updated", { detail: updatedPlans }))
    } else {
      // Add to comparison
      if (storedPlans.length >= MAX_COMPARISON_PLANS) {
        toast({
          title: "Maximum plans reached",
          description: `You can only compare up to ${MAX_COMPARISON_PLANS} plans at once.`,
          variant: "destructive",
        })
        return
      }

      const updatedPlans = [...storedPlans, planId]
      localStorage.setItem("comparison-plans", JSON.stringify(updatedPlans))
      setIsAdded(true)
      setComparisonCount(updatedPlans.length)
      
      toast({
        title: "Added to comparison",
        description: `${planName} has been added to your comparison.`,
      })

      // Dispatch event for other components to listen
      window.dispatchEvent(new CustomEvent("comparison-updated", { detail: updatedPlans }))
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleToggleCompare}
      className={cn(
        "gap-2",
        isAdded && "border-primary text-primary",
        className
      )}
      aria-label={isAdded ? "Remove from comparison" : "Add to comparison"}
    >
      {isAdded ? (
        <>
          <Check className="h-4 w-4" />
          <span className="hidden sm:inline">Added</span>
        </>
      ) : (
        <>
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Compare</span>
        </>
      )}
    </Button>
  )
}
