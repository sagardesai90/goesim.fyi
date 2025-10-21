"use client"

import { Loader2 } from "lucide-react"

interface PlansLoadingStateProps {
  countryName?: string
}

export function PlansLoadingState({ countryName }: PlansLoadingStateProps) {
  return (
    <div className="py-12">
      <div className="flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <div className="text-center space-y-2">
          <h3 className="text-xl font-semibold">Loading eSIM Plans</h3>
          {countryName && (
            <p className="text-muted-foreground">
              Finding the best deals for {countryName}...
            </p>
          )}
        </div>
        {/* Skeleton loading cards */}
        <div className="w-full max-w-6xl mx-auto mt-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="border rounded-lg p-6 space-y-4 animate-pulse"
              >
                <div className="flex justify-between items-start">
                  <div className="h-6 bg-muted rounded w-24"></div>
                  <div className="h-8 bg-muted rounded w-16"></div>
                </div>
                <div className="space-y-3">
                  <div className="h-4 bg-muted rounded w-32"></div>
                  <div className="h-4 bg-muted rounded w-24"></div>
                  <div className="h-4 bg-muted rounded w-28"></div>
                </div>
                <div className="flex gap-2">
                  <div className="h-6 bg-muted rounded w-16"></div>
                  <div className="h-6 bg-muted rounded w-16"></div>
                </div>
                <div className="h-10 bg-muted rounded w-full"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
