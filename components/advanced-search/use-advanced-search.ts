'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import {
  countActiveFilters,
  createDefaultFilters,
  translateFiltersForApi,
} from './filter-utils'
import type {
  AdvancedSearchContext,
  SearchFilters,
  SearchParseResult,
  UseAdvancedSearchOptions,
  UseAdvancedSearchResult,
} from './types'

const COUNTRY_ALIASES: Record<string, string[]> = {
  US: ['usa', 'united states', 'america', 'american', 'us'],
  GB: ['uk', 'united kingdom', 'britain', 'british', 'england', 'english'],
  CA: ['canada', 'canadian'],
  AU: ['australia', 'australian'],
  DE: ['germany', 'german'],
  FR: ['france', 'french'],
  ES: ['spain', 'spanish'],
  IT: ['italy', 'italian'],
  JP: ['japan', 'japanese'],
  KR: ['south korea', 'korea', 'korean'],
  CN: ['china', 'chinese'],
  IN: ['india', 'indian'],
  BR: ['brazil', 'brazilian'],
  MX: ['mexico', 'mexican'],
  AR: ['argentina', 'argentine', 'argentinian'],
  AE: ['uae', 'united arab emirates', 'emirates'],
  SA: ['saudi arabia', 'saudi'],
  NZ: ['new zealand', 'kiwi'],
}

const STOP_PHRASES = [
  /\bfind\s+me\b/gi,
  /\bfind\b/gi,
  /\bplans?\s+in\b/gi,
  /\bplans?\s+for\b/gi,
  /\besim\s+plans?\b/gi,
  /\bplan\s+for\b/gi,
  /\bin\s+the\b/gi,
  /\bfor\s+the\b/gi,
  /\bme\b/gi,
  /\bthe\b/gi,
  /\ba\b/gi,
  /\ban\b/gi,
]

export function useAdvancedSearch({
  countries,
  providers,
  initialFilters,
  onSearch,
}: UseAdvancedSearchOptions): UseAdvancedSearchResult {
  const [isExpanded, setIsExpanded] = useState(false)
  const [searchInput, setSearchInput] = useState(initialFilters?.query ?? '')
  const [filters, setFilters] = useState<SearchFilters>(() =>
    createDefaultFilters(initialFilters),
  )

  const parseSearchInput = useCallback(
    (input: string): SearchParseResult => {
      const normalizedInput = input.toLowerCase().trim()
      if (!normalizedInput) {
        return {
          country: null,
          provider: null,
          dataAmount: null,
          duration: null,
          remainingQuery: '',
        }
      }

      let matchedCountry: string | null = null
      let matchedCountryName = ''

      for (const [code, aliases] of Object.entries(COUNTRY_ALIASES)) {
        for (const alias of aliases) {
          if (normalizedInput === alias) {
            matchedCountry = code
            matchedCountryName = countries.find((c) => c.code === code)?.name ?? ''
            break
          }
          const aliasRegex = new RegExp(`\\b${alias}\\w*\\b`, 'i')
          if (aliasRegex.test(normalizedInput)) {
            matchedCountry = code
            matchedCountryName = countries.find((c) => c.code === code)?.name ?? ''
            break
          }
        }
        if (matchedCountry) break
      }

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

      if (!matchedCountry) {
        for (const country of countries) {
          const countryNameLower = country.name.toLowerCase()
          if (
            normalizedInput.startsWith(`${countryNameLower} `) ||
            normalizedInput === countryNameLower
          ) {
            matchedCountry = country.code
            matchedCountryName = country.name
            break
          }
          if (countryNameLower.startsWith(normalizedInput) && normalizedInput.length >= 3) {
            matchedCountry = country.code
            matchedCountryName = country.name
            break
          }
        }
      }

      if (!matchedCountry) {
        for (const country of countries) {
          const countryNameLower = country.name.toLowerCase()
          const regex = new RegExp(`\\b${countryNameLower}\\b`, 'i')
          if (regex.test(normalizedInput)) {
            matchedCountry = country.code
            matchedCountryName = country.name
            break
          }
        }
      }

      let matchedProvider: string | null = null
      let matchedProviderName = ''

      for (const provider of providers) {
        const providerNameLower = provider.name.toLowerCase()
        if (
          normalizedInput === providerNameLower ||
          normalizedInput.startsWith(`${providerNameLower} `)
        ) {
          matchedProvider = provider.name
          matchedProviderName = provider.name
          break
        }
      }

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

      let matchedDataAmount: number | null = null

      if (/\bunlimited\b/i.test(normalizedInput)) {
        matchedDataAmount = -1
      } else {
        const dataPattern = /(\d+(?:\.\d+)?)\s*(?:gb|gigabytes?|g|gigabyte)\b/gi
        const match = normalizedInput.match(dataPattern)
        if (match) {
          const numberMatch = match[0].match(/(\d+(?:\.\d+)?)/)
          if (numberMatch) {
            matchedDataAmount = parseFloat(numberMatch[1])
          }
        }
      }

      let matchedDuration: number | null = null
      const durationPatterns = [
        /\b(?:for\s+)?(\d+)\s*(?:weeks?|w)\b/gi,
        /\b(?:for\s+)?(\d+)\s*(?:months?|mo)\b/gi,
        /\b(?:for\s+)?(\d+)\s*(?:days?|d)\b/gi,
      ]

      for (const pattern of durationPatterns) {
        const match = normalizedInput.match(pattern)
        if (match) {
          const numberMatch = match[0].match(/(\d+)/)
          if (numberMatch) {
            let days = parseInt(numberMatch[1], 10)
            const lower = match[0].toLowerCase()
            if (lower.includes('week') || lower.includes('w')) {
              days *= 7
            } else if (lower.includes('month') || lower.includes('mo')) {
              days *= 30
            }
            matchedDuration = days
            break
          }
        }
      }

      let remainingQuery = input

      if (matchedCountry && matchedCountryName) {
        remainingQuery = remainingQuery.replace(
          new RegExp(matchedCountryName, 'gi'),
          '',
        ).trim()

        const aliases = COUNTRY_ALIASES[matchedCountry] || []
        for (const alias of aliases) {
          const aliasRegex = new RegExp(`\\b${alias}\\w*\\b`, 'gi')
          remainingQuery = remainingQuery.replace(aliasRegex, '').trim()
        }
      }

      if (matchedProvider && matchedProviderName) {
        remainingQuery = remainingQuery.replace(
          new RegExp(matchedProviderName, 'gi'),
          '',
        ).trim()
      }

      if (matchedDataAmount !== null && matchedDataAmount !== -1) {
        remainingQuery = remainingQuery
          .replace(/\d+(?:\.\d+)?\s*(?:gb|gigabytes?|g)\b/gi, '')
          .trim()
      } else if (matchedDataAmount === -1) {
        remainingQuery = remainingQuery.replace(/\bunlimited\b/gi, '').trim()
      }

      if (matchedDuration !== null) {
        remainingQuery = remainingQuery
          .replace(/\b(?:for\s+)?\d+\s*(?:days?|d|weeks?|w|months?|mo)\b/gi, '')
          .trim()
      }

      for (const phrase of STOP_PHRASES) {
        remainingQuery = remainingQuery.replace(phrase, '').trim()
      }

      remainingQuery = remainingQuery.replace(/\s+/g, ' ').trim()

      return {
        country: matchedCountry,
        provider: matchedProvider,
        dataAmount: matchedDataAmount,
        duration: matchedDuration,
        remainingQuery,
      }
    },
    [countries, providers],
  )

  const handleFilterChange = useCallback(
    (key: keyof SearchFilters, value: string | string[]) => {
      setFilters((prev) => ({
        ...prev,
        [key]: value,
      }))
    },
    [],
  )

  const handleFeatureToggle = useCallback((feature: string) => {
    setFilters((prev) => {
      const hasFeature = prev.features.includes(feature)
      return {
        ...prev,
        features: hasFeature
          ? prev.features.filter((existingFeature) => existingFeature !== feature)
          : [...prev.features, feature],
      }
    })
  }, [])

  const handleQueryChange = useCallback((value: string) => {
    setSearchInput(value)
    if (value === '') {
      setFilters((prev) => ({
        ...prev,
        query: '',
        country: 'all',
        provider: 'all',
        minData: '',
        maxData: '',
        minDays: '',
        maxDays: '',
        unlimited: 'all',
      }))
    }
  }, [])

  const applySearchFilters = useCallback(
    (context: AdvancedSearchContext) => {
      setFilters((prev) => {
        const updated: Partial<SearchFilters> = {
          query: context.parsed.remainingQuery,
        }

        if (context.parsed.country) {
          updated.country = context.parsed.country
        }

        if (context.parsed.provider) {
          updated.provider = context.parsed.provider
        }

        if (context.parsed.dataAmount !== null) {
          if (context.parsed.dataAmount === -1) {
            updated.unlimited = 'true'
            updated.minData = ''
            updated.maxData = ''
          } else {
            updated.minData = Math.max(0, context.parsed.dataAmount - 1).toString()
            updated.maxData = (context.parsed.dataAmount + 1).toString()
            updated.unlimited = 'all'
          }
        }

        if (context.parsed.duration !== null) {
          const requestedDays = context.parsed.duration
          updated.minDays = Math.max(1, Math.floor(requestedDays * 0.85)).toString()
          updated.maxDays = Math.ceil(requestedDays * 1.15).toString()
        } else if (!context.rawDurationTermsFound) {
          updated.minDays = ''
          updated.maxDays = ''
        }

        const nextFilters = { ...prev, ...updated }
        const apiFilters = translateFiltersForApi(nextFilters)
        onSearch(apiFilters)
        return nextFilters
      })
    },
    [onSearch],
  )

  const parseAndSearch = useCallback(() => {
    const value = searchInput.trim()
    const parsed = parseSearchInput(value)

    const rawDurationTermsFound = Boolean(
      value.match(/\b(?:days?|day|weeks?|week|months?|month|mo|w|d)\b/i),
    )

    applySearchFilters({
      parsed,
      rawDurationTermsFound,
    })
  }, [applySearchFilters, parseSearchInput, searchInput])

  const handleSearch = useCallback(() => {
    const apiFilters = translateFiltersForApi(filters)
    onSearch(apiFilters)
  }, [filters, onSearch])

  const clearFilters = useCallback(() => {
    setSearchInput('')
    setFilters(createDefaultFilters())
  }, [])

  useEffect(() => {
    if (initialFilters?.query !== undefined) {
      setSearchInput(initialFilters.query)
    }
  }, [initialFilters?.query])

  const activeFilterCount = useMemo(() => countActiveFilters(filters), [filters])

  return {
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
  }
}
