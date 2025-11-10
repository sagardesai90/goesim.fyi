'use client'

import { ChevronDown, ChevronUp, Filter, Search, X } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { FEATURE_OPTIONS } from './feature-options'
import { useAdvancedSearch } from './use-advanced-search'
import type { AdvancedSearchProps } from './types'

export function AdvancedSearch({ countries, providers, onSearch, initialFilters }: AdvancedSearchProps) {
  const {
    filters,
    searchInput,
    isExpanded,
    setIsExpanded,
    handleFilterChange,
    handleFeatureToggle,
    handleQueryChange,
    parseAndSearch,
    handleSearch,
    clearFilters,
    activeFilterCount,
  } = useAdvancedSearch({
    countries,
    providers,
    initialFilters,
    onSearch,
  })

  return (
    <Card className='w-full'>
      <CardHeader className='pb-4'>
        <div className='flex items-center justify-between'>
          <CardTitle className='flex items-center gap-2'>
            <Search className='h-5 w-5' />
            Search &amp; Filter Plans
            {activeFilterCount > 0 && (
              <Badge variant='secondary' className='ml-2'>
                {activeFilterCount} active
              </Badge>
            )}
          </CardTitle>
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <CollapsibleTrigger asChild>
              <Button variant='link' size='sm' className='text-blue-600 hover:text-blue-700 p-0 h-auto'>
                <Filter className='h-4 w-4 mr-2' />
                Advanced
                {isExpanded ? <ChevronUp className='h-4 w-4 ml-2' /> : <ChevronDown className='h-4 w-4 ml-2' />}
              </Button>
            </CollapsibleTrigger>
          </Collapsible>
        </div>
      </CardHeader>

      <CardContent className='space-y-6'>
        <div className='space-y-2'>
          <Label htmlFor='search-query'>Search Plans</Label>
          <div className='flex gap-2'>
            <Input
              id='search-query'
              placeholder="Try: 'spain 5gb 7 days', 'france unlimited 30 days', or 'spain airalo 10gb'..."
              value={searchInput}
              onChange={(event) => handleQueryChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault()
                  parseAndSearch()
                }
              }}
              className='flex-1'
            />
            <Button onClick={parseAndSearch} className='bg-blue-600 hover:bg-blue-700 text-white'>
              <Search className='h-4 w-4 mr-2' />
              Search
            </Button>
          </div>
        </div>

        <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
          <CollapsibleContent className='space-y-6'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label>Country</Label>
                <Select value={filters.country} onValueChange={(value) => handleFilterChange('country', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder='Any country' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>Any country</SelectItem>
                    {countries.map((country) => (
                      <SelectItem key={country.code} value={country.code}>
                        {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-2'>
                <Label>Provider</Label>
                <Select value={filters.provider} onValueChange={(value) => handleFilterChange('provider', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder='Any provider' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>Any provider</SelectItem>
                    {providers.map((provider) => (
                      <SelectItem key={provider.name} value={provider.name}>
                        {provider.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className='space-y-2'>
              <Label>Data Amount (GB)</Label>
              <div className='grid grid-cols-2 gap-2'>
                <Input
                  placeholder='Min GB'
                  type='number'
                  value={filters.minData}
                  onChange={(event) => handleFilterChange('minData', event.target.value)}
                />
                <Input
                  placeholder='Max GB'
                  type='number'
                  value={filters.maxData}
                  onChange={(event) => handleFilterChange('maxData', event.target.value)}
                />
              </div>
              <div className='space-y-2'>
                <Label>Data Type</Label>
                <Select value={filters.unlimited} onValueChange={(value) => handleFilterChange('unlimited', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder='Any type' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>Any type</SelectItem>
                    <SelectItem value='false'>Limited Data</SelectItem>
                    <SelectItem value='true'>Unlimited Data</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className='space-y-2'>
              <Label>Price Range (USD)</Label>
              <div className='grid grid-cols-2 gap-2'>
                <Input
                  placeholder='Min $'
                  type='number'
                  step='0.01'
                  value={filters.minPrice}
                  onChange={(event) => handleFilterChange('minPrice', event.target.value)}
                />
                <Input
                  placeholder='Max $'
                  type='number'
                  step='0.01'
                  value={filters.maxPrice}
                  onChange={(event) => handleFilterChange('maxPrice', event.target.value)}
                />
              </div>
            </div>

            <div className='space-y-2'>
              <Label>Validity Period (Days)</Label>
              <div className='grid grid-cols-2 gap-2'>
                <Input
                  placeholder='Min days'
                  type='number'
                  value={filters.minDays}
                  onChange={(event) => handleFilterChange('minDays', event.target.value)}
                />
                <Input
                  placeholder='Max days'
                  type='number'
                  value={filters.maxDays}
                  onChange={(event) => handleFilterChange('maxDays', event.target.value)}
                />
              </div>
            </div>

            <div className='space-y-2'>
              <Label>Required Features</Label>
              <div className='flex flex-wrap gap-4'>
                {FEATURE_OPTIONS.map((feature) => (
                  <div key={feature.id} className='flex items-center space-x-2'>
                    <Checkbox
                      id={feature.id}
                      checked={filters.features.includes(feature.id)}
                      onCheckedChange={() => handleFeatureToggle(feature.id)}
                    />
                    <Label htmlFor={feature.id} className='text-sm'>
                      {feature.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label>Sort By</Label>
                <Select value={filters.sortBy} onValueChange={(value) => handleFilterChange('sortBy', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder='Price' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='price'>Price</SelectItem>
                    <SelectItem value='data'>Data Amount</SelectItem>
                    <SelectItem value='value'>Value ($/GB)</SelectItem>
                    <SelectItem value='duration'>Duration</SelectItem>
                    <SelectItem value='provider'>Provider</SelectItem>
                    <SelectItem value='country'>Country</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className='space-y-2'>
                <Label>Sort Order</Label>
                <Select value={filters.sortOrder} onValueChange={(value) => handleFilterChange('sortOrder', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder='Low to High' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='asc'>Low to High</SelectItem>
                    <SelectItem value='desc'>High to Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className='flex gap-2 pt-4'>
              <Button onClick={handleSearch} className='flex-1 bg-blue-600 hover:bg-blue-700 text-white'>
                <Search className='h-4 w-4 mr-2' />
                Apply Filters
              </Button>
              <Button variant='outline' onClick={clearFilters}>
                <X className='h-4 w-4 mr-2' />
                Clear All
              </Button>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  )
}


