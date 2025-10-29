"use client"

import { useState, useEffect, useCallback } from "react"
import { Search, Filter, X, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Badge } from "@/components/ui/badge"

interface SearchFilters {
  query: string
  country: string
  provider: string
  minData: string
  maxData: string
  minPrice: string
  maxPrice: string
  minDays: string
  maxDays: string
  unlimited: string
  features: string[]
  sortBy: string
  sortOrder: string
}

interface AdvancedSearchProps {
  countries: Array<{ code: string; name: string }>
  providers: Array<{ name: string }>
  onSearch: (filters: SearchFilters) => void
  initialFilters?: Partial<SearchFilters>
}

export function AdvancedSearch({ countries, providers, onSearch, initialFilters }: AdvancedSearchProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [searchInput, setSearchInput] = useState(initialFilters?.query || "") // Separate state for input display
  const [filters, setFilters] = useState<SearchFilters>({
    query: "",
    country: "all",
    provider: "all",
    minData: "",
    maxData: "",
    minPrice: "",
    maxPrice: "",
    minDays: "",
    maxDays: "",
    unlimited: "all",
    features: [],
    sortBy: "price",
    sortOrder: "asc",
    ...initialFilters,
  })

  // Country name aliases/variations for better matching
  const countryAliases: Record<string, string[]> = {
    US: ["usa", "united states", "america", "american", "us"],
    GB: ["uk", "united kingdom", "britain", "british", "england", "english"],
    CA: ["canada", "canadian"],
    AU: ["australia", "australian"],
    DE: ["germany", "german"],
    FR: ["france", "french"],
    ES: ["spain", "spanish"],
    IT: ["italy", "italian"],
    JP: ["japan", "japanese"],
    KR: ["south korea", "korea", "korean"],
    CN: ["china", "chinese"],
    IN: ["india", "indian"],
    BR: ["brazil", "brazilian"],
    MX: ["mexico", "mexican"],
    AR: ["argentina", "argentine", "argentinian"],
    AE: ["uae", "united arab emirates", "emirates"],
    SA: ["saudi arabia", "saudi"],
    NZ: ["new zealand", "kiwi"],
  }

  // Parse search input to detect country, provider, data amount, and duration
  const parseSearchInput = useCallback((input: string) => {
    const normalizedInput = input.toLowerCase().trim()
    if (!normalizedInput) {
      return {
        country: null,
        provider: null,
        dataAmount: null,
        duration: null,
        remainingQuery: ""
      }
    }

    // Check for country match (case-insensitive, prioritizing exact and prefix matches)
    let matchedCountry = null
    let matchedCountryName = ""

    // First pass: check country aliases/variations
    for (const [code, aliases] of Object.entries(countryAliases)) {
      for (const alias of aliases) {
        // Exact match
        if (normalizedInput === alias) {
          matchedCountry = code
          matchedCountryName = countries.find(c => c.code === code)?.name || ""
          break
        }
        // Word boundary match (e.g., "american" in "american unlimited")
        const aliasRegex = new RegExp(`\\b${alias}\\w*\\b`, "i")
        if (aliasRegex.test(normalizedInput)) {
          matchedCountry = code
          matchedCountryName = countries.find(c => c.code === code)?.name || ""
          break
        }
      }
      if (matchedCountry) break
    }

    // Second pass: try exact match with country names
    if (!matchedCountry) {
      for (const country of countries) {
        const countryNameLower = country.name.toLowerCase()
        if (normalizedInput === countryNameLower) {
          matchedCountry = country.code
          matchedCountryName = country.name
          break
        }
      }
    }

    // Third pass: try prefix match (e.g., "spain" matches "spain")
    if (!matchedCountry) {
      for (const country of countries) {
        const countryNameLower = country.name.toLowerCase()
        // Check if input starts with country name followed by space or end of string
        if (normalizedInput.startsWith(countryNameLower + " ") || normalizedInput === countryNameLower) {
          matchedCountry = country.code
          matchedCountryName = country.name
          break
        }
        // Check if country name starts with input (for partial typing like "spa" -> "spain")
        if (countryNameLower.startsWith(normalizedInput) && normalizedInput.length >= 3) {
          matchedCountry = country.code
          matchedCountryName = country.name
          break
        }
      }
    }

    // Fourth pass: check if input contains country name as whole word
    if (!matchedCountry) {
      for (const country of countries) {
        const countryNameLower = country.name.toLowerCase()
        // Use word boundary matching (country name as complete word)
        const regex = new RegExp(`\\b${countryNameLower}\\b`, "i")
        if (regex.test(normalizedInput)) {
          matchedCountry = country.code
          matchedCountryName = country.name
          break
        }
      }
    }

    // Check for provider match (case-insensitive, prioritizing exact matches)
    let matchedProvider = null
    let matchedProviderName = ""

    // First try exact match
    for (const provider of providers) {
      const providerNameLower = provider.name.toLowerCase()
      if (normalizedInput === providerNameLower || normalizedInput.startsWith(providerNameLower + " ")) {
        matchedProvider = provider.name
        matchedProviderName = provider.name
        break
      }
    }

    // Then try contains (for queries like "spain airalo")
    if (!matchedProvider) {
      for (const provider of providers) {
        const providerNameLower = provider.name.toLowerCase()
        if (normalizedInput.includes(providerNameLower)) {
          matchedProvider = provider.name
          matchedProviderName = provider.name
          break
        }
      }
    }

    // Detect data amount (e.g., "5gb", "10 GB", "20g", "50 gigabytes", "unlimited")
    let matchedDataAmount: number | null = null

    // First check for "unlimited"
    if (/\bunlimited\b/i.test(normalizedInput)) {
      matchedDataAmount = -1 // Use -1 as marker for unlimited
    } else {
      // Then check for numeric data amounts
      const dataPattern = /(\d+(?:\.\d+)?)\s*(?:gb|gigabytes?|g|gigabyte)\b/gi
      const match = normalizedInput.match(dataPattern)
      if (match) {
        // Extract the number from the first match
        const numberMatch = match[0].match(/(\d+(?:\.\d+)?)/)
        if (numberMatch) {
          matchedDataAmount = parseFloat(numberMatch[1])
        }
      }
    }

    // Detect duration/days (e.g., "7 days", "30day", "1 week", "2 weeks", "14d", "for 30 days", "for 1 week")
    let matchedDuration: number | null = null
    const durationPatterns = [
      /\b(?:for\s+)?(\d+)\s*(?:weeks?|w)\b/gi, // "1 week", "for 1 week", "2 weeks", "3w" (check weeks first)
      /\b(?:for\s+)?(\d+)\s*(?:months?|mo)\b/gi, // "1 month", "for 2 months" (convert to days, ~30 per month)
      /\b(?:for\s+)?(\d+)\s*(?:days?|d)\b/gi, // "7 days", "30day", "14d", "for 30 days"
    ]

    for (const pattern of durationPatterns) {
      const match = normalizedInput.match(pattern)
      if (match) {
        const numberMatch = match[0].match(/(\d+)/)
        if (numberMatch) {
          let days = parseInt(numberMatch[1], 10)

          // Convert weeks to days
          if (match[0].toLowerCase().includes("week") || match[0].toLowerCase().includes("w")) {
            days = days * 7
          }
          // Convert months to days (approximate)
          else if (match[0].toLowerCase().includes("month") || match[0].toLowerCase().includes("mo")) {
            days = days * 30
          }

          matchedDuration = days
          break
        }
      }
    }

    // Remove matched country/provider/data/duration from query to get remaining query
    let remainingQuery = input

    if (matchedCountry && matchedCountryName) {
      // Remove the matched country name
      remainingQuery = remainingQuery.replace(new RegExp(matchedCountryName, "gi"), "").trim()

      // Also remove any matched aliases
      const aliases = countryAliases[matchedCountry] || []
      for (const alias of aliases) {
        const aliasRegex = new RegExp(`\\b${alias}\\w*\\b`, "gi")
        remainingQuery = remainingQuery.replace(aliasRegex, "").trim()
      }
    }
    if (matchedProvider && matchedProviderName) {
      remainingQuery = remainingQuery.replace(new RegExp(matchedProviderName, "gi"), "").trim()
    }
    if (matchedDataAmount !== null && matchedDataAmount !== -1) {
      // Remove data amount patterns
      remainingQuery = remainingQuery.replace(/\d+(?:\.\d+)?\s*(?:gb|gigabytes?|g)\b/gi, "").trim()
    } else if (matchedDataAmount === -1) {
      // Remove "unlimited"
      remainingQuery = remainingQuery.replace(/\bunlimited\b/gi, "").trim()
    }
    if (matchedDuration !== null) {
      // Remove duration patterns including "for" prefix
      remainingQuery = remainingQuery.replace(/\b(?:for\s+)?\d+\s*(?:days?|d|weeks?|w|months?|mo)\b/gi, "").trim()
    }

    // Clean up common natural language phrases/stop words
    const stopPhrases = [
      /\bfind\s+me\b/gi,
      /\bfind\b/gi,
      /\bplans?\s+in\b/gi,
      /\bplans?\s+for\b/gi,
      /\beSIM\s+plans?\b/gi,
      /\bplan\s+for\b/gi,
      /\bin\s+the\b/gi,
      /\bfor\s+the\b/gi,
      /\bme\b/gi,
      /\bthe\b/gi,
      /\ba\b/gi,
      /\ban\b/gi,
    ]

    for (const phrase of stopPhrases) {
      remainingQuery = remainingQuery.replace(phrase, "").trim()
    }

    // Clean up extra whitespace
    remainingQuery = remainingQuery.replace(/\s+/g, " ").trim()

    return {
      country: matchedCountry,
      provider: matchedProvider,
      dataAmount: matchedDataAmount,
      duration: matchedDuration,
      remainingQuery: remainingQuery
    }
  }, [countries, providers])

  const handleFilterChange = (key: keyof SearchFilters, value: string | string[]) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const handleFeatureToggle = (feature: string) => {
    setFilters((prev) => ({
      ...prev,
      features: prev.features.includes(feature)
        ? prev.features.filter((f) => f !== feature)
        : [...prev.features, feature],
    }))
  }

  const handleSearch = useCallback((filtersToUse?: SearchFilters) => {
    // Use provided filters or current state
    const currentFilters = filtersToUse || filters
    // Convert "all" values back to empty strings for the API
    const apiFilters = {
      ...currentFilters,
      country: currentFilters.country === "all" ? "" : currentFilters.country,
      provider: currentFilters.provider === "all" ? "" : currentFilters.provider,
      unlimited: currentFilters.unlimited === "all" ? "" : currentFilters.unlimited,
    }
    onSearch(apiFilters)
  }, [onSearch, filters])

  // Handle search input change - just update the input, don't parse yet
  const handleQueryChange = (value: string) => {
    // Update the visible input only - don't parse or set filters while typing
    setSearchInput(value)

    // If input is cleared, reset all auto-detected filters
    if (value === "") {
      setFilters((prev) => ({
        ...prev,
        query: "",
        country: "all",
        provider: "all",
        minData: "",
        maxData: "",
        minDays: "",
        maxDays: "",
        unlimited: "all",
      }))
    }
  }

  // Parse input and set filters when search is triggered (Enter or button click)
  const parseAndSearch = useCallback(() => {
    const value = searchInput.trim()

    // Parse the input to detect country/provider/data/duration
    const parsed = parseSearchInput(value)

    // Build the updated filters
    const updates: Partial<SearchFilters> = {}

    // Use remaining query (after removing detected filters) for actual search
    // This allows filters to work while keeping user input visible
    updates.query = parsed.remainingQuery

    // If we found a country match, set it
    if (parsed.country) {
      updates.country = parsed.country
    }

    // If we found a provider match, set it
    if (parsed.provider) {
      updates.provider = parsed.provider
    }

    // If we found a data amount match, set minData and maxData
    if (parsed.dataAmount !== null) {
      if (parsed.dataAmount === -1) {
        // Unlimited data
        updates.unlimited = "true"
        updates.minData = ""
        updates.maxData = ""
      } else {
        // Set both min and max to the same value (exact match) with some tolerance
        // User can adjust in advanced filters if needed
        updates.minData = Math.max(0, parsed.dataAmount - 1).toString()
        updates.maxData = (parsed.dataAmount + 1).toString()
        updates.unlimited = "all"
      }
    }

    // If we found a duration match, set minDays and maxDays
    if (parsed.duration !== null) {
      // Set both min and max to allow a reasonable range around the requested duration
      // For "1 week" (7 days), this sets minDays=6, maxDays=8 to catch 7-day plans
      // User can adjust in advanced filters if needed
      const requestedDays = parsed.duration
      updates.minDays = Math.max(1, Math.floor(requestedDays * 0.85)).toString() // Allow 15% below
      updates.maxDays = Math.ceil(requestedDays * 1.15).toString() // Allow 15% above
    } else {
      // If no duration match found and we're doing a new search, clear duration filters
      // (Don't clear if user manually set them in advanced filters)
      if (!value.includes("days") && !value.includes("day") && !value.includes("week") && !value.includes("month")) {
        updates.minDays = ""
        updates.maxDays = ""
      }
    }

    // Update filters state
    setFilters((prev) => {
      const updatedFilters = { ...prev, ...updates }

      // Immediately trigger search with updated filters
      const apiFilters = {
        ...updatedFilters,
        country: updatedFilters.country === "all" ? "" : updatedFilters.country,
        provider: updatedFilters.provider === "all" ? "" : updatedFilters.provider,
        unlimited: updatedFilters.unlimited === "all" ? "" : updatedFilters.unlimited,
      }
      onSearch(apiFilters)

      return updatedFilters
    })
  }, [searchInput, parseSearchInput, onSearch])

  // Sync searchInput with initialFilters when they change
  useEffect(() => {
    if (initialFilters?.query !== undefined) {
      setSearchInput(initialFilters.query)
    }
  }, [initialFilters?.query])

  // Note: Removed auto-search on typing - search only triggers on Enter key or Search button click
  // This allows users to type natural language queries without interruption

  const clearFilters = () => {
    setSearchInput("")
    setFilters({
      query: "",
      country: "all",
      provider: "all",
      minData: "",
      maxData: "",
      minPrice: "",
      maxPrice: "",
      minDays: "",
      maxDays: "",
      unlimited: "all",
      features: [],
      sortBy: "price",
      sortOrder: "asc",
    })
  }

  const getActiveFilterCount = () => {
    let count = 0
    if (filters.query) count++
    if (filters.country && filters.country !== "all") count++
    if (filters.provider && filters.provider !== "all") count++
    if (filters.minData || filters.maxData) count++
    if (filters.minPrice || filters.maxPrice) count++
    if (filters.minDays || filters.maxDays) count++
    if (filters.unlimited && filters.unlimited !== "all") count++
    if (filters.features.length > 0) count++
    return count
  }

  const activeFilterCount = getActiveFilterCount()

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search & Filter Plans
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFilterCount} active
              </Badge>
            )}
          </CardTitle>
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <CollapsibleTrigger asChild>
              <Button variant="link" size="sm" className="text-blue-600 hover:text-blue-700 p-0 h-auto">
                <Filter className="h-4 w-4 mr-2" />
                Advanced
                {isExpanded ? <ChevronUp className="h-4 w-4 ml-2" /> : <ChevronDown className="h-4 w-4 ml-2" />}
              </Button>
            </CollapsibleTrigger>
          </Collapsible>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Basic Search */}
        <div className="space-y-2">
          <Label htmlFor="search-query">Search Plans</Label>
          <div className="flex gap-2">
            <Input
              id="search-query"
              placeholder="Try: 'spain 5gb 7 days', 'france unlimited 30 days', or 'spain airalo 10gb'..."
              value={searchInput}
              onChange={(e) => handleQueryChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault()
                  parseAndSearch()
                }
              }}
              className="flex-1"
            />
            <Button onClick={parseAndSearch} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
          </div>
        </div>

        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleContent className="space-y-6">
            {/* Location & Provider */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Country</Label>
                <Select value={filters.country} onValueChange={(value) => handleFilterChange("country", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any country</SelectItem>
                    {countries.map((country) => (
                      <SelectItem key={country.code} value={country.code}>
                        {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Provider</Label>
                <Select value={filters.provider} onValueChange={(value) => handleFilterChange("provider", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any provider</SelectItem>
                    {providers.map((provider) => (
                      <SelectItem key={provider.name} value={provider.name}>
                        {provider.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Data Amount */}
            <div className="space-y-2">
              <Label>Data Amount (GB)</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Min GB"
                  type="number"
                  value={filters.minData}
                  onChange={(e) => handleFilterChange("minData", e.target.value)}
                />
                <Input
                  placeholder="Max GB"
                  type="number"
                  value={filters.maxData}
                  onChange={(e) => handleFilterChange("maxData", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Data Type</Label>
                <Select value={filters.unlimited} onValueChange={(value) => handleFilterChange("unlimited", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Any type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any type</SelectItem>
                    <SelectItem value="false">Limited Data</SelectItem>
                    <SelectItem value="true">Unlimited Data</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Price Range */}
            <div className="space-y-2">
              <Label>Price Range (USD)</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Min $"
                  type="number"
                  step="0.01"
                  value={filters.minPrice}
                  onChange={(e) => handleFilterChange("minPrice", e.target.value)}
                />
                <Input
                  placeholder="Max $"
                  type="number"
                  step="0.01"
                  value={filters.maxPrice}
                  onChange={(e) => handleFilterChange("maxPrice", e.target.value)}
                />
              </div>
            </div>

            {/* Validity Period */}
            <div className="space-y-2">
              <Label>Validity Period (Days)</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="Min days"
                  type="number"
                  value={filters.minDays}
                  onChange={(e) => handleFilterChange("minDays", e.target.value)}
                />
                <Input
                  placeholder="Max days"
                  type="number"
                  value={filters.maxDays}
                  onChange={(e) => handleFilterChange("maxDays", e.target.value)}
                />
              </div>
            </div>

            {/* Features */}
            <div className="space-y-2">
              <Label>Required Features</Label>
              <div className="flex flex-wrap gap-4">
                {[
                  { id: "hotspot", label: "Hotspot/Tethering" },
                  { id: "voice", label: "Voice Calls" },
                  { id: "sms", label: "SMS" },
                ].map((feature) => (
                  <div key={feature.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={feature.id}
                      checked={filters.features.includes(feature.id)}
                      onCheckedChange={() => handleFeatureToggle(feature.id)}
                    />
                    <Label htmlFor={feature.id} className="text-sm">
                      {feature.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            {/* Sorting */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Sort By</Label>
                <Select value={filters.sortBy} onValueChange={(value) => handleFilterChange("sortBy", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Price" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="price">Price</SelectItem>
                    <SelectItem value="data">Data Amount</SelectItem>
                    <SelectItem value="value">Value ($/GB)</SelectItem>
                    <SelectItem value="duration">Duration</SelectItem>
                    <SelectItem value="provider">Provider</SelectItem>
                    <SelectItem value="country">Country</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Sort Order</Label>
                <Select value={filters.sortOrder} onValueChange={(value) => handleFilterChange("sortOrder", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Low to High" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">Low to High</SelectItem>
                    <SelectItem value="desc">High to Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              <Button onClick={parseAndSearch} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
                <Search className="h-4 w-4 mr-2" />
                Apply Filters
              </Button>
              <Button variant="outline" onClick={clearFilters}>
                <X className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  )
}
