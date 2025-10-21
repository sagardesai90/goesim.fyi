import React from 'react'
import { render, screen, waitFor, act } from '@testing-library/react'
import { SearchResults } from '@/components/search-results'

// Mock components
jest.mock('@/components/plan-card', () => ({
  PlanCard: ({ plan, isBestDeal }: any) => (
    <div data-testid={`plan-card-${plan.id}`}>
      <div data-testid="plan-name">{plan.name}</div>
      {isBestDeal && <div data-testid="best-deal-badge">Best Deal</div>}
    </div>
  ),
}))

jest.mock('@/components/data-freshness-indicator', () => ({
  DataFreshnessIndicator: ({ lastUpdated }: any) => (
    <div data-testid="data-freshness-indicator">
      {lastUpdated && <span data-testid="last-updated">{lastUpdated}</span>}
    </div>
  ),
}))

// Mock fetch
global.fetch = jest.fn()

describe('SearchResults Component', () => {
  const mockPlans = [
    {
      id: '1',
      name: 'Basic Plan',
      data_amount_gb: 5,
      validity_days: 7,
      price_usd: 10,
      is_unlimited: false,
      price_per_gb: 2.0,
      price_per_day: 1.43,
      network_type: '4G/LTE',
      hotspot_allowed: true,
      voice_calls: false,
      sms_included: false,
      plan_url: 'https://example.com/plan1',
      provider: {
        id: 'p1',
        name: 'Provider A',
        logo_url: 'https://example.com/logo1.png',
      },
      country: {
        name: 'United States',
        code: 'US',
      },
    },
    {
      id: '2',
      name: 'Premium Plan',
      data_amount_gb: 10,
      validity_days: 30,
      price_usd: 25,
      is_unlimited: false,
      price_per_gb: 2.5,
      price_per_day: 0.83,
      network_type: '5G',
      hotspot_allowed: true,
      voice_calls: true,
      sms_included: true,
      plan_url: 'https://example.com/plan2',
      provider: {
        id: 'p2',
        name: 'Provider B',
        logo_url: 'https://example.com/logo2.png',
      },
      country: {
        name: 'United States',
        code: 'US',
      },
    },
  ]

  const mockSearchParams = new URLSearchParams('country=US')

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Data Freshness Indicator', () => {
    it('should display freshness indicator when lastUpdated is provided', async () => {
      const lastUpdated = '2024-10-17T12:00:00Z'
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          plans: mockPlans,
          lastUpdated,
          pagination: {
            total: 2,
            limit: 20,
            offset: 0,
            hasMore: false,
          },
        }),
      })

      await act(async () => {
        render(<SearchResults searchParams={mockSearchParams} />)
      })

      await waitFor(() => {
        expect(screen.getByTestId('data-freshness-indicator')).toBeInTheDocument()
        expect(screen.getByTestId('last-updated')).toHaveTextContent(lastUpdated)
      })
    })

    it('should not display freshness indicator when lastUpdated is null', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          plans: mockPlans,
          lastUpdated: null,
          pagination: {
            total: 2,
            limit: 20,
            offset: 0,
            hasMore: false,
          },
        }),
      })

      await act(async () => {
        render(<SearchResults searchParams={mockSearchParams} />)
      })

      await waitFor(() => {
        expect(screen.queryByTestId('data-freshness-indicator')).not.toBeInTheDocument()
      })
    })

    it('should not display freshness indicator when no plans are returned', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          plans: [],
          lastUpdated: null,
          pagination: {
            total: 0,
            limit: 20,
            offset: 0,
            hasMore: false,
          },
        }),
      })

      await act(async () => {
        render(<SearchResults searchParams={mockSearchParams} />)
      })

      await waitFor(() => {
        expect(screen.queryByTestId('data-freshness-indicator')).not.toBeInTheDocument()
      })
    })

    it('should update lastUpdated on new search', async () => {
      const firstTimestamp = '2024-10-17T12:00:00Z'
      const secondTimestamp = '2024-10-17T13:00:00Z'

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          plans: mockPlans,
          lastUpdated: firstTimestamp,
          pagination: {
            total: 2,
            limit: 20,
            offset: 0,
            hasMore: false,
          },
        }),
      })

      const { rerender } = await act(async () => {
        return render(<SearchResults searchParams={mockSearchParams} />)
      })

      await waitFor(() => {
        expect(screen.getByTestId('last-updated')).toHaveTextContent(firstTimestamp)
      })

      // New search with different params
      const newSearchParams = new URLSearchParams('country=GB')
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          plans: mockPlans,
          lastUpdated: secondTimestamp,
          pagination: {
            total: 2,
            limit: 20,
            offset: 0,
            hasMore: false,
          },
        }),
      })

      await act(async () => {
        rerender(<SearchResults searchParams={newSearchParams} />)
      })

      await waitFor(() => {
        expect(screen.getByTestId('last-updated')).toHaveTextContent(secondTimestamp)
      })
    })

    it('should position freshness indicator above results', async () => {
      const lastUpdated = '2024-10-17T12:00:00Z'
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          plans: mockPlans,
          lastUpdated,
          pagination: {
            total: 2,
            limit: 20,
            offset: 0,
            hasMore: false,
          },
        }),
      })

      const { container } = await act(async () => {
        return render(<SearchResults searchParams={mockSearchParams} />)
      })

      await waitFor(() => {
        const indicator = screen.getByTestId('data-freshness-indicator')
        const planCard = screen.getByTestId('plan-card-1')
        
        // Indicator should be in the DOM before the first plan card
        expect(indicator.compareDocumentPosition(planCard)).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
      })
    })
  })

  describe('Rendering', () => {
    it('should show loading state initially', async () => {
      ;(global.fetch as jest.Mock).mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({
                    success: true,
                    plans: mockPlans,
                    lastUpdated: null,
                    pagination: {
                      total: 2,
                      limit: 20,
                      offset: 0,
                      hasMore: false,
                    },
                  }),
                }),
              100
            )
          )
      )

      await act(async () => {
        render(<SearchResults searchParams={mockSearchParams} />)
      })

      expect(screen.getByText(/Searching plans.../i)).toBeInTheDocument()
    })

    it('should render plans after loading', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          plans: mockPlans,
          lastUpdated: null,
          pagination: {
            total: 2,
            limit: 20,
            offset: 0,
            hasMore: false,
          },
        }),
      })

      await act(async () => {
        render(<SearchResults searchParams={mockSearchParams} />)
      })

      await waitFor(() => {
        expect(screen.getByTestId('plan-card-1')).toBeInTheDocument()
        expect(screen.getByTestId('plan-card-2')).toBeInTheDocument()
      })
    })

    it('should show error state on fetch failure', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: 'Search failed',
        }),
      })

      await act(async () => {
        render(<SearchResults searchParams={mockSearchParams} />)
      })

      await waitFor(() => {
        expect(screen.getByText('Search failed')).toBeInTheDocument()
      })
    })

    it('should show no results message when no plans found', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          plans: [],
          lastUpdated: null,
          pagination: {
            total: 0,
            limit: 20,
            offset: 0,
            hasMore: false,
          },
        }),
      })

      await act(async () => {
        render(<SearchResults searchParams={mockSearchParams} />)
      })

      await waitFor(() => {
        expect(screen.getByText(/No plans found matching your criteria/i)).toBeInTheDocument()
      })
    })

    it('should display results count', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          plans: mockPlans,
          lastUpdated: null,
          pagination: {
            total: 10,
            limit: 20,
            offset: 0,
            hasMore: false,
          },
        }),
      })

      await act(async () => {
        render(<SearchResults searchParams={mockSearchParams} />)
      })

      await waitFor(() => {
        expect(screen.getByText(/Showing 2 of 10 plans/i)).toBeInTheDocument()
      })
    })
  })

  describe('API Integration', () => {
    it('should call API with correct search params', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          plans: [],
          lastUpdated: null,
          pagination: {
            total: 0,
            limit: 20,
            offset: 0,
            hasMore: false,
          },
        }),
      })

      await act(async () => {
        render(<SearchResults searchParams={mockSearchParams} />)
      })

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/search?')
        )
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('country=US')
        )
      })
    })

    it('should include offset and limit in API call', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          plans: [],
          lastUpdated: null,
          pagination: {
            total: 0,
            limit: 20,
            offset: 0,
            hasMore: false,
          },
        }),
      })

      await act(async () => {
        render(<SearchResults searchParams={mockSearchParams} />)
      })

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('offset=0')
        )
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('limit=20')
        )
      })
    })
  })

  describe('Props Handling', () => {
    it('should handle empty search params', async () => {
      const emptyParams = new URLSearchParams()
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          plans: mockPlans,
          lastUpdated: '2024-10-17T12:00:00Z',
          pagination: {
            total: 2,
            limit: 20,
            offset: 0,
            hasMore: false,
          },
        }),
      })

      await act(async () => {
        render(<SearchResults searchParams={emptyParams} />)
      })

      await waitFor(() => {
        expect(screen.getByTestId('plan-card-1')).toBeInTheDocument()
      })
    })
  })

  describe('Best Deal Badge', () => {
    it('should mark first plan as best deal', async () => {
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          plans: mockPlans,
          lastUpdated: null,
          pagination: {
            total: 2,
            limit: 20,
            offset: 0,
            hasMore: false,
          },
        }),
      })

      await act(async () => {
        render(<SearchResults searchParams={mockSearchParams} />)
      })

      await waitFor(() => {
        const firstPlanCard = screen.getByTestId('plan-card-1')
        expect(firstPlanCard.querySelector('[data-testid="best-deal-badge"]')).toBeInTheDocument()
      })
    })
  })
})
