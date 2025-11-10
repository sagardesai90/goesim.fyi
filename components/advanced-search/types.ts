export interface SearchFilters {
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

export interface AdvancedSearchProps {
  countries: Array<{ code: string; name: string }>
  providers: Array<{ name: string }>
  onSearch: (filters: SearchFilters) => void
  initialFilters?: Partial<SearchFilters>
}

export interface SearchParseResult {
  country: string | null
  provider: string | null
  dataAmount: number | null
  duration: number | null
  remainingQuery: string
}

export interface AdvancedSearchContext {
  parsed: SearchParseResult
  rawDurationTermsFound: boolean
}

export type UseAdvancedSearchOptions = Pick<
  AdvancedSearchProps,
  'countries' | 'providers' | 'onSearch'
> & {
  initialFilters?: AdvancedSearchProps['initialFilters']
}

export interface UseAdvancedSearchResult {
  filters: SearchFilters
  searchInput: string
  isExpanded: boolean
  setIsExpanded: (open: boolean) => void
  handleFilterChange: (key: keyof SearchFilters, value: string | string[]) => void
  handleFeatureToggle: (feature: string) => void
  handleQueryChange: (value: string) => void
  parseAndSearch: () => void
  handleSearch: () => void
  clearFilters: () => void
  activeFilterCount: number
}


