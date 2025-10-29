import React from 'react'
import { render, screen } from '@testing-library/react'
import { ComparisonTable } from '@/components/comparison-table'
import type { ComparisonPlan } from '@/components/comparison-card'

// Mock AffiliateLinkButton
jest.mock('@/components/affiliate-link-button', () => ({
  AffiliateLinkButton: ({ children, planId }: any) => (
    <button data-testid={`affiliate-button-${planId}`}>
      {children}
    </button>
  ),
}))

describe('ComparisonTable Component', () => {
  const mockPlans: ComparisonPlan[] = [
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
        name: 'Canada',
        code: 'CA',
      },
    },
  ]

  describe('Rendering', () => {
    it('should render table with plans', () => {
      render(<ComparisonTable plans={mockPlans} />)

      expect(screen.getAllByText('Provider A').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Provider B').length).toBeGreaterThan(0)
    })

    it('should return null when plans array is empty', () => {
      const { container } = render(<ComparisonTable plans={[]} />)

      expect(container.firstChild).toBeNull()
    })

    it('should return null when plans is null', () => {
      const { container } = render(<ComparisonTable plans={null as any} />)

      expect(container.firstChild).toBeNull()
    })

    it('should render all feature rows', () => {
      render(<ComparisonTable plans={mockPlans} />)

      expect(screen.getByText('Provider')).toBeInTheDocument()
      expect(screen.getByText('Country')).toBeInTheDocument()
      expect(screen.getByText('Price')).toBeInTheDocument()
      expect(screen.getByText('Data Amount')).toBeInTheDocument()
      expect(screen.getByText('Validity')).toBeInTheDocument()
      expect(screen.getByText('Price per GB')).toBeInTheDocument()
      expect(screen.getByText('Price per Day')).toBeInTheDocument()
      expect(screen.getByText('Network Type')).toBeInTheDocument()
      expect(screen.getByText('Hotspot Allowed')).toBeInTheDocument()
      expect(screen.getByText('Voice Calls')).toBeInTheDocument()
      expect(screen.getByText('SMS Included')).toBeInTheDocument()
    })
  })

  describe('Data Display', () => {
    it('should display provider names correctly', () => {
      render(<ComparisonTable plans={mockPlans} />)

      expect(screen.getAllByText('Provider A').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Provider B').length).toBeGreaterThan(0)
    })

    it('should display country names correctly', () => {
      render(<ComparisonTable plans={mockPlans} />)

      expect(screen.getAllByText('United States').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Canada').length).toBeGreaterThan(0)
    })

    it('should display prices correctly', () => {
      render(<ComparisonTable plans={mockPlans} />)

      expect(screen.getByText('$10')).toBeInTheDocument()
      expect(screen.getByText('$25')).toBeInTheDocument()
    })

    it('should display data amounts with badges', () => {
      render(<ComparisonTable plans={mockPlans} />)

      expect(screen.getByText('5GB')).toBeInTheDocument()
      expect(screen.getByText('10GB')).toBeInTheDocument()
    })

    it('should display unlimited data correctly', () => {
      const unlimitedPlan = { ...mockPlans[0], is_unlimited: true }
      render(<ComparisonTable plans={[unlimitedPlan]} />)

      expect(screen.getByText('Unlimited')).toBeInTheDocument()
    })

    it('should display validity days', () => {
      render(<ComparisonTable plans={mockPlans} />)

      expect(screen.getByText('7 days')).toBeInTheDocument()
      expect(screen.getByText('30 days')).toBeInTheDocument()
    })

    it('should display price per GB formatted correctly', () => {
      render(<ComparisonTable plans={mockPlans} />)

      expect(screen.getByText('$2.00')).toBeInTheDocument()
      expect(screen.getByText('$2.50')).toBeInTheDocument()
    })

    it('should display price per day formatted correctly', () => {
      render(<ComparisonTable plans={mockPlans} />)

      expect(screen.getByText('$1.43')).toBeInTheDocument()
      expect(screen.getByText('$0.83')).toBeInTheDocument()
    })

    it('should display N/A for null price_per_gb', () => {
      const planWithoutPricePerGb = { ...mockPlans[0], price_per_gb: null }
      render(<ComparisonTable plans={[planWithoutPricePerGb]} />)

      const cells = screen.getAllByText('N/A')
      expect(cells.length).toBeGreaterThan(0)
    })

    it('should display network types with badges', () => {
      render(<ComparisonTable plans={mockPlans} />)

      expect(screen.getByText('4G/LTE')).toBeInTheDocument()
      expect(screen.getByText('5G')).toBeInTheDocument()
    })
  })

  describe('Boolean Features Display', () => {
    it('should display check icon for enabled features', () => {
      const { container } = render(<ComparisonTable plans={mockPlans} />)

      // Both plans have hotspot enabled, so we should have check icons
      const svgs = container.querySelectorAll('svg')
      expect(svgs.length).toBeGreaterThan(0)
    })

    it('should display X icon for disabled features', () => {
      const planWithNoFeatures = {
        ...mockPlans[0],
        hotspot_allowed: false,
        voice_calls: false,
        sms_included: false,
      }
      const { container } = render(<ComparisonTable plans={[planWithNoFeatures]} />)

      // Should have X icons for disabled features
      const svgs = container.querySelectorAll('svg')
      expect(svgs.length).toBeGreaterThan(0)
    })
  })

  describe('Action Buttons', () => {
    it('should render Buy Now button for each plan', () => {
      render(<ComparisonTable plans={mockPlans} />)

      const buyButtons = screen.getAllByText('Buy Now')
      expect(buyButtons).toHaveLength(2)
    })

    it('should pass correct planId to AffiliateLinkButton', () => {
      render(<ComparisonTable plans={mockPlans} />)

      expect(screen.getByTestId('affiliate-button-1')).toBeInTheDocument()
      expect(screen.getByTestId('affiliate-button-2')).toBeInTheDocument()
    })
  })

  describe('Table Structure', () => {
    it('should have proper table element', () => {
      const { container } = render(<ComparisonTable plans={mockPlans} />)

      const table = container.querySelector('table')
      expect(table).toBeInTheDocument()
    })

    it('should have thead element', () => {
      const { container } = render(<ComparisonTable plans={mockPlans} />)

      const thead = container.querySelector('thead')
      expect(thead).toBeInTheDocument()
    })

    it('should have tbody element', () => {
      const { container } = render(<ComparisonTable plans={mockPlans} />)

      const tbody = container.querySelector('tbody')
      expect(tbody).toBeInTheDocument()
    })

    it('should have correct number of header columns', () => {
      const { container } = render(<ComparisonTable plans={mockPlans} />)

      const headers = container.querySelectorAll('thead th')
      // Should have 1 feature column + number of plans
      expect(headers).toHaveLength(mockPlans.length + 1)
    })
  })

  describe('Styling', () => {
    it('should apply custom className when provided', () => {
      const { container } = render(
        <ComparisonTable plans={mockPlans} className="custom-class" />
      )

      const card = container.querySelector('.custom-class')
      expect(card).toBeInTheDocument()
    })

    it('should highlight first plan column', () => {
      const { container } = render(<ComparisonTable plans={mockPlans} />)

      // First plan column should have special styling
      const cells = container.querySelectorAll('[class*="bg-primary/5"]')
      expect(cells.length).toBeGreaterThan(0)
    })

    it('should have sticky header for feature column', () => {
      const { container } = render(<ComparisonTable plans={mockPlans} />)

      const stickyHeaders = container.querySelectorAll('[class*="sticky"]')
      expect(stickyHeaders.length).toBeGreaterThan(0)
    })
  })

  describe('Responsive Design', () => {
    it('should have overflow-x-auto container for scrolling', () => {
      const { container } = render(<ComparisonTable plans={mockPlans} />)

      const scrollContainer = container.querySelector('.overflow-x-auto')
      expect(scrollContainer).toBeInTheDocument()
    })

    it('should set minimum width on plan columns', () => {
      const { container } = render(<ComparisonTable plans={mockPlans} />)

      const planColumns = container.querySelectorAll('[class*="min-w-"]')
      expect(planColumns.length).toBeGreaterThan(0)
    })
  })

  describe('Edge Cases', () => {
    it('should handle single plan', () => {
      render(<ComparisonTable plans={[mockPlans[0]]} />)

      expect(screen.getAllByText('Provider A').length).toBeGreaterThan(0)
      expect(screen.queryByText('Provider B')).not.toBeInTheDocument()
    })

    it('should handle three plans', () => {
      const threePlans = [
        ...mockPlans,
        {
          ...mockPlans[0],
          id: '3',
          provider: { ...mockPlans[0].provider, name: 'Provider C' },
        },
      ]
      render(<ComparisonTable plans={threePlans} />)

      expect(screen.getAllByText('Provider A').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Provider B').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Provider C').length).toBeGreaterThan(0)
    })

    it('should handle missing provider name', () => {
      const planWithoutProvider = {
        ...mockPlans[0],
        provider: { ...mockPlans[0].provider, name: '' },
      }
      render(<ComparisonTable plans={[planWithoutProvider]} />)

      expect(screen.getByText('Unknown')).toBeInTheDocument()
    })

    it('should handle missing country name', () => {
      const planWithoutCountry = {
        ...mockPlans[0],
        country: { ...mockPlans[0].country, name: '' },
      }
      render(<ComparisonTable plans={[planWithoutCountry]} />)

      // "Unknown" appears in multiple places
      expect(screen.getAllByText('Unknown').length).toBeGreaterThan(0)
    })
  })
})
