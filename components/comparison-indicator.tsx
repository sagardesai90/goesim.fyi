"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { LayoutGrid } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface ComparisonIndicatorProps {
  className?: string
}

export function ComparisonIndicator({ className }: ComparisonIndicatorProps) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    // Initial load
    updateCount()

    // Listen for comparison updates
    const handleComparisonUpdate = (event: Event) => {
      const customEvent = event as CustomEvent
      setCount(customEvent.detail?.length || 0)
    }

    window.addEventListener("comparison-updated", handleComparisonUpdate)
    
    // Also listen for storage changes from other tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "comparison-plans") {
        updateCount()
      }
    }
    
    window.addEventListener("storage", handleStorageChange)

    return () => {
      window.removeEventListener("comparison-updated", handleComparisonUpdate)
      window.removeEventListener("storage", handleStorageChange)
    }
  }, [])

  const updateCount = () => {
    try {
      const storedPlans = localStorage.getItem("comparison-plans")
      const planIds: string[] = storedPlans ? JSON.parse(storedPlans) : []
      setCount(planIds.length)
    } catch (error) {
      // Handle corrupted data gracefully
      setCount(0)
    }
  }

  if (count === 0) {
    return null
  }

  return (
    <Link href="/comparison" className={cn("relative", className)}>
      <Button variant="outline" size="sm" className="gap-2 relative">
        <LayoutGrid className="h-4 w-4" />
        <span className="hidden sm:inline">Compare</span>
        <Badge 
          variant="default" 
          className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
        >
          {count}
        </Badge>
      </Button>
    </Link>
  )
}
