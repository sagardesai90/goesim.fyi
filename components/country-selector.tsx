"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Check, ChevronsUpDown, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"

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
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  const selectedCountryData = countries.find((country) => country.code === selectedCountry)

  const handleCountrySelect = (countryCode: string) => {
    const params = new URLSearchParams(searchParams)
    params.set("country", countryCode)
    router.push(`/?${params.toString()}`)
    setOpen(false)
  }

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

      <div className="flex justify-center">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="w-full max-w-md justify-between h-12 text-left bg-transparent"
            >
              {selectedCountryData ? (
                <span className="flex items-center gap-2">
                  <span className="text-lg">{getFlagEmoji(selectedCountryData.code)}</span>
                  {selectedCountryData.name}
                </span>
              ) : (
                "Select a country..."
              )}
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full max-w-md p-0" align="center">
            <Command>
              <CommandInput placeholder="Search countries..." />
              <CommandList>
                <CommandEmpty>No country found.</CommandEmpty>
                {Object.entries(countryGroups).map(([region, regionCountries]) => (
                  <CommandGroup key={region} heading={region}>
                    {regionCountries.map((country) => (
                      <CommandItem
                        key={country.code}
                        value={`${country.name} ${country.code}`}
                        onSelect={() => handleCountrySelect(country.code)}
                      >
                        <span className="flex items-center gap-2 flex-1">
                          <span className="text-lg">{getFlagEmoji(country.code)}</span>
                          {country.name}
                        </span>
                        <Check
                          className={cn(
                            "ml-auto h-4 w-4",
                            selectedCountry === country.code ? "opacity-100" : "opacity-0",
                          )}
                        />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                ))}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
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
