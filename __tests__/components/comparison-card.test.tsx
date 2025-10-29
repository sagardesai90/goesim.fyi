import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { ComparisonCard, type ComparisonPlan } from '@/components/comparison-card'

// Mock AffiliateLinkButton
jest.mock('@/components/affiliate-link-button', () => ({
  AffiliateLinkButton: ({ children, planId }: any) => (
    <button data-testid={`affiliate-button-${planId}`}>
      {children}
    </button>
  ),
}))

// Mock Button component
jest.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, variant, className, asChild, ...props }: any) => {
    if (asChild) {
      return <div className={className}>{children}</div>
    }
    return (
      <button onClick={onClick} className={className} {...props}>
        {children}
      </button>
    )
  },
}))

describe('ComparisonCard Component', () => {
  const mockPlan: ComparisonPlan = {
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
  }

  describe('Rendering', () => {
    it('should render the component with plan data', () => {
      render(<ComparisonCard plan={mockPlan} />)

      expect(screen.getByText('Provider A')).toBeInTheDocument()
      expect(screen.getByText('United States')).toBeInTheDocument()
      expect(screen.getByText('$10')).toBeInTheDocument()
    })

    it('should render price per GB when available', () => {
      render(<ComparisonCard plan={mockPlan} />)

      expect(screen.getByText('$2.00/GB')).toBeInTheDocument()
    })

    it('should render price per day when available', () => {
      render(<ComparisonCard plan={mockPlan} />)

      expect(screen.getByText('$1.43/day')).toBeInTheDocument()
    })

    it('should display data amount correctly', () => {
      render(<ComparisonCard plan={mockPlan} />)

      expect(screen.getByText('5GB')).toBeInTheDocument()
      expect(screen.getByText('Data allowance')).toBeInTheDocument()
    })

    it('should display unlimited data when is_unlimited is true', () => {
      const unlimitedPlan = { ...mockPlan, is_unlimited: true }
      render(<ComparisonCard plan={unlimitedPlan} />)

      expect(screen.getByText('Unlimited Data')).toBeInTheDocument()
    })

    it('should display validity days', () => {
      render(<ComparisonCard plan={mockPlan} />)

      expect(screen.getByText('7 days')).toBeInTheDocument()
      expect(screen.getByText('Validity period')).toBeInTheDocument()
    })

    it('should display network type', () => {
      render(<ComparisonCard plan={mockPlan} />)

      expect(screen.getByText('4G/LTE')).toBeInTheDocument()
      expect(screen.getByText('Network type')).toBeInTheDocument()
    })

    it('should return null when plan is null', () => {
      const { container } = render(<ComparisonCard plan={null as any} />)

      expect(container.firstChild).toBeNull()
    })
  })

  describe('Features Display', () => {
    it('should show check icon for hotspot when allowed', () => {
      render(<ComparisonCard plan={mockPlan} />)

      expect(screen.getByText('Hotspot / Tethering')).toBeInTheDocument()
    })

    it('should show check icon for voice calls when included', () => {
      const planWithVoice = { ...mockPlan, voice_calls: true }
      render(<ComparisonCard plan={planWithVoice} />)

      expect(screen.getByText('Voice Calls')).toBeInTheDocument()
    })

    it('should show check icon for SMS when included', () => {
      const planWithSMS = { ...mockPlan, sms_included: true }
      render(<ComparisonCard plan={planWithSMS} />)

      expect(screen.getByText('SMS Messaging')).toBeInTheDocument()
    })

    it('should display all features with appropriate icons', () => {
      render(<ComparisonCard plan={mockPlan} />)

      expect(screen.getByText('Hotspot / Tethering')).toBeInTheDocument()
      expect(screen.getByText('Voice Calls')).toBeInTheDocument()
      expect(screen.getByText('SMS Messaging')).toBeInTheDocument()
    })
  })

  describe('Action Buttons', () => {
    it('should render Buy Now button', () => {
      render(<ComparisonCard plan={mockPlan} />)

      expect(screen.getByText('Buy Now')).toBeInTheDocument()
    })

    it('should render View Details button', () => {
      render(<ComparisonCard plan={mockPlan} />)

      expect(screen.getByText('View Details')).toBeInTheDocument()
    })

    it('should pass correct planId to AffiliateLinkButton', () => {
      render(<ComparisonCard plan={mockPlan} />)

      expect(screen.getByTestId('affiliate-button-1')).toBeInTheDocument()
    })
  })

  describe('Remove Functionality', () => {
    it('should render remove button when onRemove is provided', () => {
      const mockRemove = jest.fn()
      render(<ComparisonCard plan={mockPlan} onRemove={mockRemove} />)

      const removeButton = screen.getByLabelText('Remove from comparison')
      expect(removeButton).toBeInTheDocument()
    })

    it('should call onRemove when remove button is clicked', () => {
      const mockRemove = jest.fn()
      render(<ComparisonCard plan={mockPlan} onRemove={mockRemove} />)

      const removeButton = screen.getByLabelText('Remove from comparison')
      fireEvent.click(removeButton)

      expect(mockRemove).toHaveBeenCalledTimes(1)
    })

    it('should not render remove button when onRemove is not provided', () => {
      render(<ComparisonCard plan={mockPlan} />)

      const removeButton = screen.queryByLabelText('Remove from comparison')
      expect(removeButton).not.toBeInTheDocument()
    })
  })

  describe('Styling and Layout', () => {
    it('should apply custom className when provided', () => {
      const { container } = render(
        <ComparisonCard plan={mockPlan} className="custom-class" />
      )

      const card = container.querySelector('.custom-class')
      expect(card).toBeInTheDocument()
    })

    it('should have proper card structure', () => {
      const { container } = render(<ComparisonCard plan={mockPlan} />)

      const card = container.querySelector('[class*="relative"]')
      expect(card).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle missing provider name gracefully', () => {
      const planWithoutProvider = {
        ...mockPlan,
        provider: { ...mockPlan.provider, name: '' },
      }
      render(<ComparisonCard plan={planWithoutProvider} />)

      expect(screen.getByText('Unknown Provider')).toBeInTheDocument()
    })

    it('should handle missing country name gracefully', () => {
      const planWithoutCountry = {
        ...mockPlan,
        country: { ...mockPlan.country, name: '' },
      }
      render(<ComparisonCard plan={planWithoutCountry} />)

      expect(screen.getByText('Unknown Country')).toBeInTheDocument()
    })

    it('should handle missing price_per_gb', () => {
      const planWithoutPricePerGb = { ...mockPlan, price_per_gb: null }
      render(<ComparisonCard plan={planWithoutPricePerGb} />)

      expect(screen.queryByText(/\/GB/)).not.toBeInTheDocument()
    })

    it('should handle missing price_per_day', () => {
      const planWithoutPricePerDay = { ...mockPlan, price_per_day: null }
      render(<ComparisonCard plan={planWithoutPricePerDay} />)

      expect(screen.queryByText(/\/day/)).not.toBeInTheDocument()
    })

    it('should handle plan with all features disabled', () => {
      const minimalPlan = {
        ...mockPlan,
        hotspot_allowed: false,
        voice_calls: false,
        sms_included: false,
      }
      render(<ComparisonCard plan={minimalPlan} />)

      // All features should still be displayed, just with X icons instead of checks
      expect(screen.getByText('Hotspot / Tethering')).toBeInTheDocument()
      expect(screen.getByText('Voice Calls')).toBeInTheDocument()
      expect(screen.getByText('SMS Messaging')).toBeInTheDocument()
    })
  })
})
