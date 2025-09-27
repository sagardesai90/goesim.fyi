"use client"

import type React from "react"

import { useState } from "react"
import { ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"

interface AffiliateLinkButtonProps {
  planId: string
  originalUrl: string
  affiliateUrl?: string
  affiliateLinkId?: string
  children: React.ReactNode
  className?: string
}

export function AffiliateLinkButton({
  planId,
  originalUrl,
  affiliateUrl,
  affiliateLinkId,
  children,
  className,
}: AffiliateLinkButtonProps) {
  const [isTracking, setIsTracking] = useState(false)

  const handleClick = async () => {
    if (affiliateLinkId && !isTracking) {
      setIsTracking(true)

      try {
        // Track the click
        await fetch("/api/affiliate/click", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ affiliateLinkId }),
        })
      } catch (error) {
        console.error("Failed to track affiliate click:", error)
      } finally {
        setIsTracking(false)
      }
    }

    // Open the affiliate URL (or original URL as fallback)
    const targetUrl = affiliateUrl || originalUrl
    window.open(targetUrl, "_blank", "noopener,noreferrer")
  }

  return (
    <Button onClick={handleClick} className={className} disabled={isTracking}>
      {children}
      <ExternalLink className="h-4 w-4 ml-2" />
    </Button>
  )
}
