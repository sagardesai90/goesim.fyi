import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { AddToCompareButton } from '@/components/add-to-compare-button'

// Mock useToast
const mockToast = jest.fn()
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}))

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value
    },
    removeItem: (key: string) => {
      delete store[key]
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

describe('AddToCompareButton Component', () => {
  beforeEach(() => {
    localStorageMock.clear()
    mockToast.mockClear()
    jest.clearAllMocks()
  })

  describe('Initial Rendering', () => {
    it('should render with default props', () => {
      render(<AddToCompareButton planId="1" />)

      expect(screen.getByLabelText('Add to comparison')).toBeInTheDocument()
    })

    it('should show "Compare" text by default', () => {
      render(<AddToCompareButton planId="1" />)

      expect(screen.getByText('Compare')).toBeInTheDocument()
    })

    it('should apply default variant and size', () => {
      const { container } = render(<AddToCompareButton planId="1" />)

      const button = container.querySelector('button')
      expect(button).toBeInTheDocument()
    })

    it('should apply custom className', () => {
      render(<AddToCompareButton planId="1" className="custom-class" />)

      const button = screen.getByLabelText('Add to comparison')
      expect(button).toHaveClass('custom-class')
    })
  })

  describe('Add to Comparison', () => {
    it('should add plan to comparison when clicked', () => {
      render(<AddToCompareButton planId="1" planName="Test Plan" />)

      const button = screen.getByLabelText('Add to comparison')
      fireEvent.click(button)

      const storedPlans = JSON.parse(localStorageMock.getItem('comparison-plans') || '[]')
      expect(storedPlans).toContain('1')
    })

    it('should show toast notification when plan is added', () => {
      render(<AddToCompareButton planId="1" planName="Test Plan" />)

      const button = screen.getByLabelText('Add to comparison')
      fireEvent.click(button)

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Added to comparison',
        description: 'Test Plan has been added to your comparison.',
      })
    })

    it('should update button text to "Added" after adding', async () => {
      render(<AddToCompareButton planId="1" planName="Test Plan" />)

      const button = screen.getByLabelText('Add to comparison')
      fireEvent.click(button)

      await waitFor(() => {
        expect(screen.getByText('Added')).toBeInTheDocument()
      })
    })

    it('should dispatch custom event when plan is added', () => {
      const eventListener = jest.fn()
      window.addEventListener('comparison-updated', eventListener)

      render(<AddToCompareButton planId="1" />)

      const button = screen.getByLabelText('Add to comparison')
      fireEvent.click(button)

      expect(eventListener).toHaveBeenCalled()

      window.removeEventListener('comparison-updated', eventListener)
    })
  })

  describe('Remove from Comparison', () => {
    it('should remove plan from comparison when already added', () => {
      localStorageMock.setItem('comparison-plans', JSON.stringify(['1', '2']))

      render(<AddToCompareButton planId="1" planName="Test Plan" />)

      const button = screen.getByLabelText('Remove from comparison')
      fireEvent.click(button)

      const storedPlans = JSON.parse(localStorageMock.getItem('comparison-plans') || '[]')
      expect(storedPlans).not.toContain('1')
      expect(storedPlans).toContain('2')
    })

    it('should show toast notification when plan is removed', () => {
      localStorageMock.setItem('comparison-plans', JSON.stringify(['1']))

      render(<AddToCompareButton planId="1" planName="Test Plan" />)

      const button = screen.getByLabelText('Remove from comparison')
      fireEvent.click(button)

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Removed from comparison',
        description: 'Test Plan has been removed from your comparison.',
      })
    })

    it('should update button text to "Compare" after removing', async () => {
      localStorageMock.setItem('comparison-plans', JSON.stringify(['1']))

      render(<AddToCompareButton planId="1" planName="Test Plan" />)

      const button = screen.getByLabelText('Remove from comparison')
      fireEvent.click(button)

      await waitFor(() => {
        expect(screen.getByText('Compare')).toBeInTheDocument()
      })
    })
  })

  describe('Maximum Plans Limit', () => {
    it('should not add plan when maximum is reached', () => {
      localStorageMock.setItem('comparison-plans', JSON.stringify(['1', '2', '3']))

      render(<AddToCompareButton planId="4" planName="Test Plan" />)

      const button = screen.getByLabelText('Add to comparison')
      fireEvent.click(button)

      const storedPlans = JSON.parse(localStorageMock.getItem('comparison-plans') || '[]')
      expect(storedPlans).not.toContain('4')
      expect(storedPlans).toHaveLength(3)
    })

    it('should show error toast when maximum is reached', () => {
      localStorageMock.setItem('comparison-plans', JSON.stringify(['1', '2', '3']))

      render(<AddToCompareButton planId="4" planName="Test Plan" />)

      const button = screen.getByLabelText('Add to comparison')
      fireEvent.click(button)

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Maximum plans reached',
        description: 'You can only compare up to 3 plans at once.',
        variant: 'destructive',
      })
    })
  })

  describe('State Management', () => {
    it('should show "Added" when plan is already in comparison', () => {
      localStorageMock.setItem('comparison-plans', JSON.stringify(['1']))

      render(<AddToCompareButton planId="1" />)

      expect(screen.getByText('Added')).toBeInTheDocument()
    })

    it('should update state when comparison is updated externally', async () => {
      render(<AddToCompareButton planId="1" />)

      // Initially not added
      expect(screen.getByText('Compare')).toBeInTheDocument()

      // Simulate external update
      await act(async () => {
        localStorageMock.setItem('comparison-plans', JSON.stringify(['1']))
        window.dispatchEvent(
          new CustomEvent('comparison-updated', { detail: ['1'] })
        )
      })

      await waitFor(() => {
        expect(screen.getByText('Added')).toBeInTheDocument()
      })
    })
  })

  describe('Variants and Sizes', () => {
    it('should apply variant prop', () => {
      render(<AddToCompareButton planId="1" variant="default" />)

      const button = screen.getByLabelText('Add to comparison')
      expect(button).toBeInTheDocument()
    })

    it('should apply size prop', () => {
      render(<AddToCompareButton planId="1" size="lg" />)

      const button = screen.getByLabelText('Add to comparison')
      expect(button).toBeInTheDocument()
    })

    it('should accept all valid variants', () => {
      const variants: Array<'default' | 'outline' | 'ghost' | 'secondary'> = [
        'default',
        'outline',
        'ghost',
        'secondary',
      ]

      variants.forEach((variant) => {
        const { unmount } = render(
          <AddToCompareButton planId="1" variant={variant} />
        )
        expect(screen.getByLabelText('Add to comparison')).toBeInTheDocument()
        unmount()
      })
    })

    it('should accept all valid sizes', () => {
      const sizes: Array<'default' | 'sm' | 'lg' | 'icon'> = [
        'default',
        'sm',
        'lg',
        'icon',
      ]

      sizes.forEach((size) => {
        const { unmount } = render(
          <AddToCompareButton planId="1" size={size} />
        )
        expect(screen.getByLabelText('Add to comparison')).toBeInTheDocument()
        unmount()
      })
    })
  })

  describe('Plan Name Display', () => {
    it('should use custom plan name in toast', () => {
      render(<AddToCompareButton planId="1" planName="Custom Plan Name" />)

      const button = screen.getByLabelText('Add to comparison')
      fireEvent.click(button)

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Added to comparison',
        description: 'Custom Plan Name has been added to your comparison.',
      })
    })

    it('should use default plan name when not provided', () => {
      render(<AddToCompareButton planId="1" />)

      const button = screen.getByLabelText('Add to comparison')
      fireEvent.click(button)

      expect(mockToast).toHaveBeenCalledWith({
        title: 'Added to comparison',
        description: 'Plan has been added to your comparison.',
      })
    })
  })

  describe('Icon Display', () => {
    it('should show Plus icon when not added', () => {
      const { container } = render(<AddToCompareButton planId="1" />)

      // Plus icon should be present
      const icons = container.querySelectorAll('svg')
      expect(icons.length).toBeGreaterThan(0)
    })

    it('should show Check icon when added', () => {
      localStorageMock.setItem('comparison-plans', JSON.stringify(['1']))

      const { container } = render(<AddToCompareButton planId="1" />)

      // Check icon should be present
      const icons = container.querySelectorAll('svg')
      expect(icons.length).toBeGreaterThan(0)
    })
  })

  describe('Accessibility', () => {
    it('should have appropriate aria-label when not added', () => {
      render(<AddToCompareButton planId="1" />)

      expect(screen.getByLabelText('Add to comparison')).toBeInTheDocument()
    })

    it('should have appropriate aria-label when added', () => {
      localStorageMock.setItem('comparison-plans', JSON.stringify(['1']))

      render(<AddToCompareButton planId="1" />)

      expect(screen.getByLabelText('Remove from comparison')).toBeInTheDocument()
    })

    it('should be keyboard accessible', () => {
      render(<AddToCompareButton planId="1" />)

      const button = screen.getByLabelText('Add to comparison')
      button.focus()
      expect(document.activeElement).toBe(button)
    })
  })
})
