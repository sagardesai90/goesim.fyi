"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { MapPin, Search } from "lucide-react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

interface Country {
  id: string
  name: string
  code: string
  region: string
}

interface CountrySelectorProps {
  countries: Country[]
  selectedCountry?: string
}

export function CountrySelector({ countries, selectedCountry }: CountrySelectorProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleCountrySelect = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const countryCode = event.target.value
    if (countryCode) {
      const params = new URLSearchParams(searchParams.toString())
      params.set("country", countryCode)
      router.push(`/?${params.toString()}`)
    }
  }

  const selectedCountryData = countries.find((country) => country.code === selectedCountry)

  // Group countries by region
  const countryGroups = countries.reduce(
    (groups, country) => {
      const region = country.region
      if (!groups[region]) {
        groups[region] = []
      }
      groups[region].push(country)
      return groups
    },
    {} as Record<string, Country[]>,
  )


  return (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold flex items-center justify-center gap-2">
          <MapPin className="h-6 w-6 text-primary" />
          Select Your Destination
        </h2>
        <p className="text-muted-foreground">Choose a country to compare eSIM plans and find the best deals</p>
      </div>

      <div className="flex flex-col items-center justify-center space-y-4">
        {countries.length === 0 ? (
          <div className="text-center p-4 border rounded-lg bg-muted/50">
            <p className="text-muted-foreground">Loading countries...</p>
            <p className="text-sm text-muted-foreground mt-1">If this persists, check your database connection.</p>
          </div>
        ) : (
          <>
            <div className="w-full max-w-md">
              <select
                value={selectedCountry || ""}
                onChange={handleCountrySelect}
                className="w-full h-12 px-4 py-2 border border-input bg-background rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent appearance-none cursor-pointer"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: 'right 12px center',
                  backgroundRepeat: 'no-repeat',
                  backgroundSize: '16px'
                }}
              >
                <option value="" disabled>
                  Select a country...
                </option>
                {Object.entries(countryGroups).map(([region, regionCountries]) => (
                  <optgroup key={region} label={region}>
                    {regionCountries.map((country) => (
                      <option key={country.code} value={country.code}>
                        {getFlagEmoji(country.code)} {country.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <div className="flex items-center w-full max-w-md">
              <div className="flex-1 border-t border-muted-foreground/30"></div>
              <span className="px-4 text-sm text-muted-foreground font-medium">or</span>
              <div className="flex-1 border-t border-muted-foreground/30"></div>
            </div>

            <Button asChild size="lg" className="text-lg px-8">
              <Link href="/search">
                <Search className="h-5 w-5 mr-2" />
                Advanced Search
              </Link>
            </Button>
          </>
        )}
      </div>
    </div>
  )
}

// Helper function to get flag emoji from country code
function getFlagEmoji(countryCode: string): string {
  const codePoints = countryCode
    .toUpperCase()
    .split("")
    .map((char) => 127397 + char.charCodeAt(0))
  return String.fromCodePoint(...codePoints)
}
