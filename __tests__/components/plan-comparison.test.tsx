import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { PlanComparison } from '@/components/plan-comparison'
import { useRouter, useSearchParams } from 'next/navigation'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}))

// Mock AffiliateLinkButton
jest.mock('@/components/affiliate-link-button', () => ({
  AffiliateLinkButton: ({ children, planId, originalUrl }: any) => (
    <button data-testid={`affiliate-button-${planId}`} data-url={originalUrl}>
      {children}
    </button>
  ),
}))

// Mock fetch for affiliate links
global.fetch = jest.fn()

describe('PlanComparison Component', () => {
  const mockPush = jest.fn()
  const mockSearchParams = new URLSearchParams()

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

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    })
    ;(useSearchParams as jest.Mock).mockReturnValue(mockSearchParams)
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ affiliateLinks: {} }),
    })
  })

  describe('Rendering', () => {
    it('should render the component with plans', async () => {
      await act(async () => {
        render(<PlanComparison plans={mockPlans} />)
      })

      expect(screen.getByText(/eSIM Plans for United States/i)).toBeInTheDocument()
      expect(screen.getByText(/2 plans available/i)).toBeInTheDocument()
    })

    it('should render all plan cards', async () => {
      await act(async () => {
        render(<PlanComparison plans={mockPlans} />)
      })

      expect(screen.getByText('Provider A')).toBeInTheDocument()
      expect(screen.getByText('Provider B')).toBeInTheDocument()
    })

    it('should display plan prices', async () => {
      await act(async () => {
        render(<PlanComparison plans={mockPlans} />)
      })

      expect(screen.getByText('$10')).toBeInTheDocument()
      expect(screen.getByText('$25')).toBeInTheDocument()
    })

    it('should display data amounts correctly', async () => {
      await act(async () => {
        render(<PlanComparison plans={mockPlans} />)
      })

      expect(screen.getByText('5GB')).toBeInTheDocument()
      expect(screen.getByText('10GB')).toBeInTheDocument()
    })

    it('should display validity days', async () => {
      await act(async () => {
        render(<PlanComparison plans={mockPlans} />)
      })

      expect(screen.getByText('7 days')).toBeInTheDocument()
      expect(screen.getByText('30 days')).toBeInTheDocument()
    })

    it('should display network types', async () => {
      await act(async () => {
        render(<PlanComparison plans={mockPlans} />)
      })

      expect(screen.getByText('4G/LTE')).toBeInTheDocument()
      expect(screen.getByText('5G')).toBeInTheDocument()
    })

    it('should show "Best Deal" badge on the first plan', async () => {
      await act(async () => {
        render(<PlanComparison plans={mockPlans} />)
      })

      expect(screen.getByText('Best Deal')).toBeInTheDocument()
    })

    it('should display price per GB when available', async () => {
      await act(async () => {
        render(<PlanComparison plans={mockPlans} />)
      })

      expect(screen.getByText('$2.00/GB')).toBeInTheDocument()
      expect(screen.getByText('$2.50/GB')).toBeInTheDocument()
    })
  })

  describe('Feature Badges', () => {
    it('should display Hotspot badge when hotspot is allowed', async () => {
      await act(async () => {
        render(<PlanComparison plans={mockPlans} />)
      })

      const hotspotBadges = screen.getAllByText('Hotspot')
      expect(hotspotBadges.length).toBe(2)
    })

    it('should display Voice badge when voice calls are included', async () => {
      await act(async () => {
        render(<PlanComparison plans={mockPlans} />)
      })

      const voiceBadges = screen.getAllByText('Voice')
      expect(voiceBadges.length).toBe(1)
    })

    it('should display SMS badge when SMS is included', async () => {
      await act(async () => {
        render(<PlanComparison plans={mockPlans} />)
      })

      const smsBadges = screen.getAllByText('SMS')
      expect(smsBadges.length).toBe(1)
    })

    it('should not display badges for features not included', async () => {
      const planWithoutFeatures = [{
        ...mockPlans[0],
        hotspot_allowed: false,
        voice_calls: false,
        sms_included: false,
      }]

      await act(async () => {
        render(<PlanComparison plans={planWithoutFeatures} />)
      })

      expect(screen.queryByText('Hotspot')).not.toBeInTheDocument()
      expect(screen.queryByText('Voice')).not.toBeInTheDocument()
      expect(screen.queryByText('SMS')).not.toBeInTheDocument()
    })
  })

  describe('Buy Now Buttons', () => {
    it('should render Buy Now button for each plan', async () => {
      await act(async () => {
        render(<PlanComparison plans={mockPlans} />)
      })

      const buyButtons = screen.getAllByText('Buy Now')
      expect(buyButtons).toHaveLength(2)
    })

    it('should pass correct planId to AffiliateLinkButton', async () => {
      await act(async () => {
        render(<PlanComparison plans={mockPlans} />)
      })

      expect(screen.getByTestId('affiliate-button-1')).toBeInTheDocument()
      expect(screen.getByTestId('affiliate-button-2')).toBeInTheDocument()
    })

    it('should pass originalUrl to AffiliateLinkButton', async () => {
      await act(async () => {
        render(<PlanComparison plans={mockPlans} />)
      })

      const button1 = screen.getByTestId('affiliate-button-1')
      expect(button1).toHaveAttribute('data-url', 'https://example.com/plan1')
    })
  })

  describe('Affiliate Links Loading', () => {
    it('should fetch affiliate links on mount', async () => {
      await act(async () => {
        render(<PlanComparison plans={mockPlans} />)
      })

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/affiliate/links', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ planIds: ['1', '2'] }),
        })
      })
    })

    it('should handle failed affiliate link fetch gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
      })

      await act(async () => {
        render(<PlanComparison plans={mockPlans} />)
      })

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to load affiliate links')
      })

      consoleErrorSpy.mockRestore()
    })
  })

  describe('Empty States', () => {
    it('should display message when no plans are available', async () => {
      await act(async () => {
        render(<PlanComparison plans={[]} />)
      })

      expect(screen.getByText(/0 plans available/i)).toBeInTheDocument()
    })

    it('should not render plan cards when plans array is empty', async () => {
      await act(async () => {
        render(<PlanComparison plans={[]} />)
      })

      expect(screen.queryByText('Buy Now')).not.toBeInTheDocument()
    })
  })

  describe('Responsive Layout', () => {
    it('should use grid layout for plan cards', async () => {
      let container
      await act(async () => {
        const result = render(<PlanComparison plans={mockPlans} />)
        container = result.container
      })

      const grid = container.querySelector('.grid')
      expect(grid).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3')
    })

    it('should have responsive filter/sort controls', async () => {
      let container
      await act(async () => {
        const result = render(<PlanComparison plans={mockPlans} />)
        container = result.container
      })

      const controlsContainer = container.querySelector('.flex.flex-col.sm\\:flex-row')
      expect(controlsContainer).toBeInTheDocument()
    })
  })

  describe('Props Handling', () => {
    it('should handle plans prop correctly', async () => {
      await expect(async () => {
        await act(async () => {
          render(<PlanComparison plans={mockPlans} />)
        })
      }).not.toThrow()
    })

    it('should handle selectedDataAmount prop', async () => {
      await act(async () => {
        render(<PlanComparison plans={mockPlans} selectedDataAmount="5" />)
      })

      // Should apply the filter
      expect(screen.getByText(/1 plans available/i)).toBeInTheDocument()
    })

    it('should handle undefined selectedDataAmount', async () => {
      await expect(async () => {
        await act(async () => {
          render(<PlanComparison plans={mockPlans} selectedDataAmount={undefined} />)
        })
      }).not.toThrow()
    })
  })

  describe('Visual Hierarchy', () => {
    it('should highlight the best deal with special styling', async () => {
      let container
      await act(async () => {
        const result = render(<PlanComparison plans={mockPlans} />)
        container = result.container
      })

      const cards = container.querySelectorAll('[class*="relative"]')
      expect(cards.length).toBeGreaterThan(0)

      // First card should have the ring styling for best deal
      const firstCard = cards[0]
      expect(firstCard).toHaveClass('ring-2')
    })

    it('should display icons for data, validity, and network type', async () => {
      let container
      await act(async () => {
        const result = render(<PlanComparison plans={mockPlans} />)
        container = result.container
      })

      // Check for SVG elements (Lucide icons)
      const icons = container.querySelectorAll('svg')
      expect(icons.length).toBeGreaterThan(0)
    })
  })
})
