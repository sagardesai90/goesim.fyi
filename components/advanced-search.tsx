"use client"

import { useState } from "react"
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

  const handleSearch = () => {
    // Convert "all" values back to empty strings for the API
    const apiFilters = {
      ...filters,
      country: filters.country === "all" ? "" : filters.country,
      provider: filters.provider === "all" ? "" : filters.provider,
      unlimited: filters.unlimited === "all" ? "" : filters.unlimited,
    }
    onSearch(apiFilters)
  }

  const clearFilters = () => {
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
              placeholder="Search by plan name or provider..."
              value={filters.query}
              onChange={(e) => handleFilterChange("query", e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleSearch} className="bg-blue-600 hover:bg-blue-700 text-white">
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
              <Button onClick={handleSearch} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white">
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
