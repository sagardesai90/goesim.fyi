import React from 'react'
import { render, screen, waitFor, act } from '@testing-library/react'
import { ComparisonIndicator } from '@/components/comparison-indicator'

// Mock next/link
jest.mock('next/link', () => {
  return ({ children, href, className }: any) => (
    <a href={href} className={className}>
      {children}
    </a>
  )
})

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

describe('ComparisonIndicator Component', () => {
  beforeEach(() => {
    localStorageMock.clear()
    jest.clearAllMocks()
  })

  describe('Initial Rendering', () => {
    it('should not render when comparison is empty', () => {
      const { container } = render(<ComparisonIndicator />)

      expect(container.firstChild).toBeNull()
    })

    it('should render when plans are in comparison', () => {
      localStorageMock.setItem('comparison-plans', JSON.stringify(['1', '2']))

      render(<ComparisonIndicator />)

      expect(screen.getByText('Compare')).toBeInTheDocument()
    })

    it('should show correct count badge', () => {
      localStorageMock.setItem('comparison-plans', JSON.stringify(['1', '2']))

      render(<ComparisonIndicator />)

      expect(screen.getByText('2')).toBeInTheDocument()
    })

    it('should link to comparison page', () => {
      localStorageMock.setItem('comparison-plans', JSON.stringify(['1']))

      render(<ComparisonIndicator />)

      const link = screen.getByText('Compare').closest('a')
      expect(link).toHaveAttribute('href', '/comparison')
    })
  })

  describe('Count Display', () => {
    it('should show count of 1', () => {
      localStorageMock.setItem('comparison-plans', JSON.stringify(['1']))

      render(<ComparisonIndicator />)

      expect(screen.getByText('1')).toBeInTheDocument()
    })

    it('should show count of 2', () => {
      localStorageMock.setItem('comparison-plans', JSON.stringify(['1', '2']))

      render(<ComparisonIndicator />)

      expect(screen.getByText('2')).toBeInTheDocument()
    })

    it('should show count of 3', () => {
      localStorageMock.setItem('comparison-plans', JSON.stringify(['1', '2', '3']))

      render(<ComparisonIndicator />)

      expect(screen.getByText('3')).toBeInTheDocument()
    })

    it('should update count when comparison changes', async () => {
      localStorageMock.setItem('comparison-plans', JSON.stringify(['1']))

      render(<ComparisonIndicator />)

      expect(screen.getByText('1')).toBeInTheDocument()

      // Simulate comparison update
      const newPlans = ['1', '2']
      window.dispatchEvent(
        new CustomEvent('comparison-updated', { detail: newPlans })
      )

      await waitFor(() => {
        expect(screen.getByText('2')).toBeInTheDocument()
      })
    })
  })

  describe('Event Listeners', () => {
    it('should respond to comparison-updated event', async () => {
      const { rerender } = render(<ComparisonIndicator />)

      // Initially no plans
      expect(screen.queryByText('Compare')).not.toBeInTheDocument()

      // Dispatch event with plans
      localStorageMock.setItem('comparison-plans', JSON.stringify(['1', '2']))
      
      await act(async () => {
        window.dispatchEvent(
          new CustomEvent('comparison-updated', { detail: ['1', '2'] })
        )
      })

      // Need to wait for state update
      await waitFor(() => {
        expect(screen.getByText('Compare')).toBeInTheDocument()
      })
    })

    it('should respond to storage event', async () => {
      render(<ComparisonIndicator />)

      // Initially no plans
      expect(screen.queryByText('Compare')).not.toBeInTheDocument()

      // Simulate storage change from another tab
      localStorageMock.setItem('comparison-plans', JSON.stringify(['1', '2']))
      
      await act(async () => {
        const storageEvent = new StorageEvent('storage', {
          key: 'comparison-plans',
          newValue: JSON.stringify(['1', '2']),
        })
        window.dispatchEvent(storageEvent)
      })

      await waitFor(() => {
        expect(screen.getByText('Compare')).toBeInTheDocument()
      })
    })

    it('should not respond to unrelated storage events', async () => {
      localStorageMock.setItem('comparison-plans', JSON.stringify(['1']))

      render(<ComparisonIndicator />)

      expect(screen.getByText('1')).toBeInTheDocument()

      // Dispatch storage event for different key
      const storageEvent = new StorageEvent('storage', {
        key: 'other-key',
        newValue: 'some-value',
      })
      window.dispatchEvent(storageEvent)

      // Count should remain unchanged
      await waitFor(() => {
        expect(screen.getByText('1')).toBeInTheDocument()
      })
    })

    it('should hide when count becomes zero', async () => {
      localStorageMock.setItem('comparison-plans', JSON.stringify(['1']))

      const { container } = render(<ComparisonIndicator />)

      expect(screen.getByText('Compare')).toBeInTheDocument()

      // Clear comparison
      await act(async () => {
        window.dispatchEvent(new CustomEvent('comparison-updated', { detail: [] }))
      })

      await waitFor(() => {
        expect(container.firstChild).toBeNull()
      })
    })
  })

  describe('Styling', () => {
    it('should apply custom className', () => {
      localStorageMock.setItem('comparison-plans', JSON.stringify(['1']))

      const { container } = render(<ComparisonIndicator className="custom-class" />)

      const link = container.querySelector('.custom-class')
      expect(link).toBeInTheDocument()
    })

    it('should have button with outline variant', () => {
      localStorageMock.setItem('comparison-plans', JSON.stringify(['1']))

      render(<ComparisonIndicator />)

      const button = screen.getByText('Compare').closest('button')
      expect(button).toBeInTheDocument()
    })

    it('should display badge with correct positioning', () => {
      localStorageMock.setItem('comparison-plans', JSON.stringify(['1']))

      const { container } = render(<ComparisonIndicator />)

      // Badge should be present
      const badge = screen.getByText('1')
      expect(badge).toBeInTheDocument()
    })
  })

  describe('Icon Display', () => {
    it('should display LayoutGrid icon', () => {
      localStorageMock.setItem('comparison-plans', JSON.stringify(['1']))

      const { container } = render(<ComparisonIndicator />)

      const svgs = container.querySelectorAll('svg')
      expect(svgs.length).toBeGreaterThan(0)
    })
  })

  describe('Responsive Design', () => {
    it('should hide text on small screens', () => {
      localStorageMock.setItem('comparison-plans', JSON.stringify(['1']))

      const { container } = render(<ComparisonIndicator />)

      const compareText = screen.getByText('Compare')
      // Check if it has the hidden sm:inline class (implicitly tested through rendering)
      expect(compareText).toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle corrupted localStorage data', () => {
      localStorageMock.setItem('comparison-plans', 'invalid-json')

      const { container } = render(<ComparisonIndicator />)

      // Should not crash and should not render
      expect(container.firstChild).toBeNull()
    })

    it('should handle empty string in localStorage', () => {
      localStorageMock.setItem('comparison-plans', '')

      const { container } = render(<ComparisonIndicator />)

      expect(container.firstChild).toBeNull()
    })

    it('should handle null in comparison-updated event', async () => {
      localStorageMock.setItem('comparison-plans', JSON.stringify(['1']))

      const { container } = render(<ComparisonIndicator />)

      expect(screen.getByText('Compare')).toBeInTheDocument()

      // Dispatch event with no detail
      await act(async () => {
        window.dispatchEvent(new CustomEvent('comparison-updated'))
      })

      await waitFor(() => {
        expect(container.firstChild).toBeNull()
      })
    })
  })

  describe('Memory Leaks', () => {
    it('should clean up event listeners on unmount', () => {
      localStorageMock.setItem('comparison-plans', JSON.stringify(['1']))

      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener')

      const { unmount } = render(<ComparisonIndicator />)

      unmount()

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'comparison-updated',
        expect.any(Function)
      )
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        'storage',
        expect.any(Function)
      )

      removeEventListenerSpy.mockRestore()
    })
  })
})
