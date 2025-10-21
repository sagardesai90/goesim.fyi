"use client"

import { Clock, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react"
import { useEffect, useState } from "react"

interface DataFreshnessIndicatorProps {
  lastUpdated: string | Date | null
  className?: string
}

export function DataFreshnessIndicator({ lastUpdated, className = "" }: DataFreshnessIndicatorProps) {
  const [timeAgo, setTimeAgo] = useState<string>("")
  const [freshnessStatus, setFreshnessStatus] = useState<"fresh" | "recent" | "stale" | "unknown">("unknown")

  useEffect(() => {
    if (!lastUpdated) {
      setFreshnessStatus("unknown")
      setTimeAgo("Unknown")
      return
    }

    const updateTimeAgo = () => {
      const now = new Date()
      const updated = new Date(lastUpdated)
      
      // Check if date is valid
      if (isNaN(updated.getTime())) {
        setFreshnessStatus("unknown")
        setTimeAgo("Unknown")
        return
      }
      
      const diffMs = now.getTime() - updated.getTime()
      const diffMins = Math.floor(diffMs / 60000)
      const diffHours = Math.floor(diffMs / 3600000)
      const diffDays = Math.floor(diffMs / 86400000)

      // Determine freshness status
      if (diffMins < 30) {
        setFreshnessStatus("fresh")
      } else if (diffHours < 24) {
        setFreshnessStatus("recent")
      } else {
        setFreshnessStatus("stale")
      }

      // Format time ago
      if (diffMins < 1) {
        setTimeAgo("just now")
      } else if (diffMins < 60) {
        setTimeAgo(`${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`)
      } else if (diffHours < 24) {
        setTimeAgo(`${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`)
      } else if (diffDays < 30) {
        setTimeAgo(`${diffDays} day${diffDays !== 1 ? "s" : ""} ago`)
      } else {
        const diffMonths = Math.floor(diffDays / 30)
        setTimeAgo(`${diffMonths} month${diffMonths !== 1 ? "s" : ""} ago`)
      }
    }

    updateTimeAgo()
    
    // Update every minute
    const interval = setInterval(updateTimeAgo, 60000)
    
    return () => clearInterval(interval)
  }, [lastUpdated])

  const getStatusConfig = () => {
    switch (freshnessStatus) {
      case "fresh":
        return {
          icon: CheckCircle2,
          label: "Fresh Data",
          color: "text-green-600 dark:text-green-400",
          bgColor: "bg-green-50 dark:bg-green-950/30",
          borderColor: "border-green-200 dark:border-green-800",
          description: "Prices updated recently"
        }
      case "recent":
        return {
          icon: Clock,
          label: "Recent Data",
          color: "text-blue-600 dark:text-blue-400",
          bgColor: "bg-blue-50 dark:bg-blue-950/30",
          borderColor: "border-blue-200 dark:border-blue-800",
          description: "Prices updated today"
        }
      case "stale":
        return {
          icon: RefreshCw,
          label: "Updating Soon",
          color: "text-amber-600 dark:text-amber-400",
          bgColor: "bg-amber-50 dark:bg-amber-950/30",
          borderColor: "border-amber-200 dark:border-amber-800",
          description: "Prices may have changed"
        }
      default:
        return {
          icon: AlertCircle,
          label: "Data Status",
          color: "text-gray-600 dark:text-gray-400",
          bgColor: "bg-gray-50 dark:bg-gray-950/30",
          borderColor: "border-gray-200 dark:border-gray-800",
          description: "Checking for updates"
        }
    }
  }

  const config = getStatusConfig()
  const Icon = config.icon

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div 
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${config.bgColor} ${config.borderColor} transition-colors`}
        role="status"
        aria-label={`Data freshness: ${config.label}`}
      >
        <Icon className={`h-4 w-4 ${config.color}`} aria-hidden="true" />
        <div className="flex items-center gap-2">
          <span className={`text-sm font-medium ${config.color}`}>
            {config.label}
          </span>
          <span className="text-xs text-muted-foreground">
            • Updated {timeAgo}
          </span>
        </div>
      </div>
      <span className="text-xs text-muted-foreground hidden sm:inline">
        {config.description}
      </span>
    </div>
  )
}
