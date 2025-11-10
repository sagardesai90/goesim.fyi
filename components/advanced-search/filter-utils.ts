import type { SearchFilters } from './types'

export function createDefaultFilters(initialFilters?: Partial<SearchFilters>): SearchFilters {
  return {
    query: '',
    country: 'all',
    provider: 'all',
    minData: '',
    maxData: '',
    minPrice: '',
    maxPrice: '',
    minDays: '',
    maxDays: '',
    unlimited: 'all',
    features: [],
    sortBy: 'price',
    sortOrder: 'asc',
    ...initialFilters,
    features: initialFilters?.features ?? [],
  }
}

export function translateFiltersForApi(filters: SearchFilters): SearchFilters {
  return {
    ...filters,
    country: filters.country === 'all' ? '' : filters.country,
    provider: filters.provider === 'all' ? '' : filters.provider,
    unlimited: filters.unlimited === 'all' ? '' : filters.unlimited,
  }
}

export function countActiveFilters(filters: SearchFilters): number {
  let count = 0
  if (filters.query) count++
  if (filters.country && filters.country !== 'all') count++
  if (filters.provider && filters.provider !== 'all') count++
  if (filters.minData || filters.maxData) count++
  if (filters.minPrice || filters.maxPrice) count++
  if (filters.minDays || filters.maxDays) count++
  if (filters.unlimited && filters.unlimited !== 'all') count++
  if (filters.features.length > 0) count++
  return count
}


