import React from 'react'
import { render, screen, waitFor, act } from '@testing-library/react'
import { DataFreshnessIndicator } from '@/components/data-freshness-indicator'

describe('DataFreshnessIndicator Component', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2024-10-17T12:00:00Z'))
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  describe('Rendering', () => {
    it('should render the component', () => {
      const lastUpdated = new Date('2024-10-17T11:00:00Z').toISOString()
      render(<DataFreshnessIndicator lastUpdated={lastUpdated} />)

      expect(screen.getByRole('status')).toBeInTheDocument()
    })

    it('should display icon', () => {
      const lastUpdated = new Date('2024-10-17T11:00:00Z').toISOString()
      const { container } = render(<DataFreshnessIndicator lastUpdated={lastUpdated} />)

      const icon = container.querySelector('svg')
      expect(icon).toBeInTheDocument()
    })

    it('should handle null lastUpdated', () => {
      render(<DataFreshnessIndicator lastUpdated={null} />)

      expect(screen.getByText(/Unknown/i)).toBeInTheDocument()
    })

    it('should handle custom className', () => {
      const lastUpdated = new Date('2024-10-17T11:00:00Z').toISOString()
      const { container } = render(
        <DataFreshnessIndicator lastUpdated={lastUpdated} className="custom-class" />
      )

      const wrapper = container.firstChild
      expect(wrapper).toHaveClass('custom-class')
    })
  })

  describe('Freshness Status - Fresh Data', () => {
    it('should show "Fresh Data" for data updated just now', () => {
      const lastUpdated = new Date('2024-10-17T12:00:00Z').toISOString()
      render(<DataFreshnessIndicator lastUpdated={lastUpdated} />)

      expect(screen.getByText('Fresh Data')).toBeInTheDocument()
      expect(screen.getByText(/just now/i)).toBeInTheDocument()
    })

    it('should show "Fresh Data" for data updated 5 minutes ago', () => {
      const lastUpdated = new Date('2024-10-17T11:55:00Z').toISOString()
      render(<DataFreshnessIndicator lastUpdated={lastUpdated} />)

      expect(screen.getByText('Fresh Data')).toBeInTheDocument()
      expect(screen.getByText(/5 minutes ago/i)).toBeInTheDocument()
    })

    it('should show "Fresh Data" for data updated 29 minutes ago', () => {
      const lastUpdated = new Date('2024-10-17T11:31:00Z').toISOString()
      render(<DataFreshnessIndicator lastUpdated={lastUpdated} />)

      expect(screen.getByText('Fresh Data')).toBeInTheDocument()
      expect(screen.getByText(/29 minutes ago/i)).toBeInTheDocument()
    })

    it('should use singular "minute" for 1 minute', () => {
      const lastUpdated = new Date('2024-10-17T11:59:00Z').toISOString()
      render(<DataFreshnessIndicator lastUpdated={lastUpdated} />)

      expect(screen.getByText(/1 minute ago/i)).toBeInTheDocument()
    })

    it('should have green color for fresh data', () => {
      const lastUpdated = new Date('2024-10-17T11:55:00Z').toISOString()
      const { container } = render(<DataFreshnessIndicator lastUpdated={lastUpdated} />)

      const status = container.querySelector('.text-green-600')
      expect(status).toBeInTheDocument()
    })

    it('should show fresh data description', () => {
      const lastUpdated = new Date('2024-10-17T11:55:00Z').toISOString()
      render(<DataFreshnessIndicator lastUpdated={lastUpdated} />)

      expect(screen.getByText('Prices updated recently')).toBeInTheDocument()
    })
  })

  describe('Freshness Status - Recent Data', () => {
    it('should show "Recent Data" for data updated 1 hour ago', () => {
      const lastUpdated = new Date('2024-10-17T11:00:00Z').toISOString()
      render(<DataFreshnessIndicator lastUpdated={lastUpdated} />)

      expect(screen.getByText('Recent Data')).toBeInTheDocument()
      expect(screen.getByText(/1 hour ago/i)).toBeInTheDocument()
    })

    it('should show "Recent Data" for data updated 5 hours ago', () => {
      const lastUpdated = new Date('2024-10-17T07:00:00Z').toISOString()
      render(<DataFreshnessIndicator lastUpdated={lastUpdated} />)

      expect(screen.getByText('Recent Data')).toBeInTheDocument()
      expect(screen.getByText(/5 hours ago/i)).toBeInTheDocument()
    })

    it('should show "Recent Data" for data updated 23 hours ago', () => {
      const lastUpdated = new Date('2024-10-16T13:00:00Z').toISOString()
      render(<DataFreshnessIndicator lastUpdated={lastUpdated} />)

      expect(screen.getByText('Recent Data')).toBeInTheDocument()
      expect(screen.getByText(/23 hours ago/i)).toBeInTheDocument()
    })

    it('should use singular "hour" for 1 hour', () => {
      const lastUpdated = new Date('2024-10-17T11:00:00Z').toISOString()
      render(<DataFreshnessIndicator lastUpdated={lastUpdated} />)

      expect(screen.getByText(/1 hour ago/i)).toBeInTheDocument()
    })

    it('should have blue color for recent data', () => {
      const lastUpdated = new Date('2024-10-17T07:00:00Z').toISOString()
      const { container } = render(<DataFreshnessIndicator lastUpdated={lastUpdated} />)

      const status = container.querySelector('.text-blue-600')
      expect(status).toBeInTheDocument()
    })

    it('should show recent data description', () => {
      const lastUpdated = new Date('2024-10-17T07:00:00Z').toISOString()
      render(<DataFreshnessIndicator lastUpdated={lastUpdated} />)

      expect(screen.getByText('Prices updated today')).toBeInTheDocument()
    })
  })

  describe('Freshness Status - Stale Data', () => {
    it('should show "Updating Soon" for data updated 1 day ago', () => {
      const lastUpdated = new Date('2024-10-16T12:00:00Z').toISOString()
      render(<DataFreshnessIndicator lastUpdated={lastUpdated} />)

      expect(screen.getByText('Updating Soon')).toBeInTheDocument()
      expect(screen.getByText(/1 day ago/i)).toBeInTheDocument()
    })

    it('should show "Updating Soon" for data updated 5 days ago', () => {
      const lastUpdated = new Date('2024-10-12T12:00:00Z').toISOString()
      render(<DataFreshnessIndicator lastUpdated={lastUpdated} />)

      expect(screen.getByText('Updating Soon')).toBeInTheDocument()
      expect(screen.getByText(/5 days ago/i)).toBeInTheDocument()
    })

    it('should show "Updating Soon" for data updated 29 days ago', () => {
      const lastUpdated = new Date('2024-09-18T12:00:00Z').toISOString()
      render(<DataFreshnessIndicator lastUpdated={lastUpdated} />)

      expect(screen.getByText('Updating Soon')).toBeInTheDocument()
      expect(screen.getByText(/29 days ago/i)).toBeInTheDocument()
    })

    it('should show months for data older than 30 days', () => {
      const lastUpdated = new Date('2024-08-17T12:00:00Z').toISOString()
      render(<DataFreshnessIndicator lastUpdated={lastUpdated} />)

      expect(screen.getByText('Updating Soon')).toBeInTheDocument()
      expect(screen.getByText(/2 months ago/i)).toBeInTheDocument()
    })

    it('should use singular "day" for 1 day', () => {
      const lastUpdated = new Date('2024-10-16T12:00:00Z').toISOString()
      render(<DataFreshnessIndicator lastUpdated={lastUpdated} />)

      expect(screen.getByText(/1 day ago/i)).toBeInTheDocument()
    })

    it('should use singular "month" for 1 month', () => {
      const lastUpdated = new Date('2024-09-17T12:00:00Z').toISOString()
      render(<DataFreshnessIndicator lastUpdated={lastUpdated} />)

      expect(screen.getByText(/1 month ago/i)).toBeInTheDocument()
    })

    it('should have amber color for stale data', () => {
      const lastUpdated = new Date('2024-10-16T12:00:00Z').toISOString()
      const { container } = render(<DataFreshnessIndicator lastUpdated={lastUpdated} />)

      const status = container.querySelector('.text-amber-600')
      expect(status).toBeInTheDocument()
    })

    it('should show stale data description', () => {
      const lastUpdated = new Date('2024-10-16T12:00:00Z').toISOString()
      render(<DataFreshnessIndicator lastUpdated={lastUpdated} />)

      expect(screen.getByText('Prices may have changed')).toBeInTheDocument()
    })
  })

  describe('Freshness Status - Unknown', () => {
    it('should show "Data Status" for unknown data', () => {
      render(<DataFreshnessIndicator lastUpdated={null} />)

      expect(screen.getByText('Data Status')).toBeInTheDocument()
      expect(screen.getByText(/Updated Unknown/i)).toBeInTheDocument()
    })

    it('should have gray color for unknown data', () => {
      const { container } = render(<DataFreshnessIndicator lastUpdated={null} />)

      const status = container.querySelector('.text-gray-600')
      expect(status).toBeInTheDocument()
    })

    it('should show unknown data description', () => {
      render(<DataFreshnessIndicator lastUpdated={null} />)

      expect(screen.getByText('Checking for updates')).toBeInTheDocument()
    })
  })

  describe('Time Updates', () => {
    it('should update time display every minute', async () => {
      const lastUpdated = new Date('2024-10-17T11:59:00Z').toISOString()
      render(<DataFreshnessIndicator lastUpdated={lastUpdated} />)

      expect(screen.getByText(/1 minute ago/i)).toBeInTheDocument()

      // Advance time by 1 minute
      act(() => {
        jest.advanceTimersByTime(60000)
      })

      await waitFor(() => {
        expect(screen.getByText(/2 minutes ago/i)).toBeInTheDocument()
      })
    })

    it('should transition from fresh to recent status', async () => {
      const lastUpdated = new Date('2024-10-17T11:31:00Z').toISOString()
      render(<DataFreshnessIndicator lastUpdated={lastUpdated} />)

      expect(screen.getByText('Fresh Data')).toBeInTheDocument()

      // Advance time by 1 minute (now 30 minutes ago)
      act(() => {
        jest.advanceTimersByTime(60000)
      })

      await waitFor(() => {
        expect(screen.getByText('Recent Data')).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA role', () => {
      const lastUpdated = new Date('2024-10-17T11:00:00Z').toISOString()
      render(<DataFreshnessIndicator lastUpdated={lastUpdated} />)

      const status = screen.getByRole('status')
      expect(status).toBeInTheDocument()
    })

    it('should have proper ARIA label', () => {
      const lastUpdated = new Date('2024-10-17T11:00:00Z').toISOString()
      render(<DataFreshnessIndicator lastUpdated={lastUpdated} />)

      const status = screen.getByRole('status')
      expect(status).toHaveAttribute('aria-label')
      expect(status.getAttribute('aria-label')).toContain('Data freshness')
    })

    it('should hide icon from screen readers', () => {
      const lastUpdated = new Date('2024-10-17T11:00:00Z').toISOString()
      const { container } = render(<DataFreshnessIndicator lastUpdated={lastUpdated} />)

      const icon = container.querySelector('svg')
      expect(icon).toHaveAttribute('aria-hidden', 'true')
    })

    it('should be readable by screen readers', () => {
      const lastUpdated = new Date('2024-10-17T11:00:00Z').toISOString()
      render(<DataFreshnessIndicator lastUpdated={lastUpdated} />)

      expect(screen.getByText('Recent Data')).toBeVisible()
      expect(screen.getByText(/1 hour ago/i)).toBeVisible()
    })
  })

  describe('Visual Styling', () => {
    it('should have rounded full style', () => {
      const lastUpdated = new Date('2024-10-17T11:00:00Z').toISOString()
      const { container } = render(<DataFreshnessIndicator lastUpdated={lastUpdated} />)

      const badge = container.querySelector('.rounded-full')
      expect(badge).toBeInTheDocument()
    })

    it('should have border', () => {
      const lastUpdated = new Date('2024-10-17T11:00:00Z').toISOString()
      const { container } = render(<DataFreshnessIndicator lastUpdated={lastUpdated} />)

      const badge = container.querySelector('.border')
      expect(badge).toBeInTheDocument()
    })

    it('should have background color', () => {
      const lastUpdated = new Date('2024-10-17T11:00:00Z').toISOString()
      const { container } = render(<DataFreshnessIndicator lastUpdated={lastUpdated} />)

      const badge = container.querySelector('.bg-blue-50')
      expect(badge).toBeInTheDocument()
    })

    it('should hide description on small screens', () => {
      const lastUpdated = new Date('2024-10-17T11:00:00Z').toISOString()
      const { container } = render(<DataFreshnessIndicator lastUpdated={lastUpdated} />)

      const description = container.querySelector('.hidden.sm\\:inline')
      expect(description).toBeInTheDocument()
    })
  })

  describe('Props Handling', () => {
    it('should accept Date object', () => {
      const lastUpdated = new Date('2024-10-17T11:00:00Z')
      expect(() => {
        render(<DataFreshnessIndicator lastUpdated={lastUpdated} />)
      }).not.toThrow()
    })

    it('should accept ISO string', () => {
      const lastUpdated = '2024-10-17T11:00:00Z'
      expect(() => {
        render(<DataFreshnessIndicator lastUpdated={lastUpdated} />)
      }).not.toThrow()
    })

    it('should accept null', () => {
      expect(() => {
        render(<DataFreshnessIndicator lastUpdated={null} />)
      }).not.toThrow()
    })

    it('should handle undefined className', () => {
      const lastUpdated = new Date('2024-10-17T11:00:00Z').toISOString()
      expect(() => {
        render(<DataFreshnessIndicator lastUpdated={lastUpdated} />)
      }).not.toThrow()
    })
  })

  describe('Edge Cases', () => {
    it('should handle future dates gracefully', () => {
      const lastUpdated = new Date('2024-10-17T13:00:00Z').toISOString()
      render(<DataFreshnessIndicator lastUpdated={lastUpdated} />)

      // Should still render without crashing
      expect(screen.getByRole('status')).toBeInTheDocument()
    })

    it('should handle invalid date strings', () => {
      const lastUpdated = 'invalid-date'
      render(<DataFreshnessIndicator lastUpdated={lastUpdated} />)

      // Should fallback to unknown status
      expect(screen.getByText('Data Status')).toBeInTheDocument()
    })

    it('should handle very old dates', () => {
      const lastUpdated = new Date('2020-01-01T12:00:00Z').toISOString()
      render(<DataFreshnessIndicator lastUpdated={lastUpdated} />)

      expect(screen.getByText('Updating Soon')).toBeInTheDocument()
      expect(screen.getByText(/months ago/i)).toBeInTheDocument()
    })
  })

  describe('Component Cleanup', () => {
    it('should cleanup interval on unmount', () => {
      const lastUpdated = new Date('2024-10-17T11:00:00Z').toISOString()
      const { unmount } = render(<DataFreshnessIndicator lastUpdated={lastUpdated} />)

      unmount()

      // Advance timers after unmount - should not cause errors
      act(() => {
        jest.advanceTimersByTime(60000)
      })
    })
  })
})
