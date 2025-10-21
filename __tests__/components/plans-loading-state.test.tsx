import React from 'react'
import { render, screen } from '@testing-library/react'
import { PlansLoadingState } from '@/components/plans-loading-state'

describe('PlansLoadingState Component', () => {
  describe('Rendering', () => {
    it('should render loading spinner', () => {
      const { container } = render(<PlansLoadingState />)
      
      // Check for spinner (animated SVG)
      const spinner = container.querySelector('.animate-spin')
      expect(spinner).toBeInTheDocument()
    })

    it('should render loading message', () => {
      render(<PlansLoadingState />)
      
      expect(screen.getByText('Loading eSIM Plans')).toBeInTheDocument()
    })

    it('should render country name when provided', () => {
      render(<PlansLoadingState countryName="United States" />)
      
      expect(screen.getByText(/Finding the best deals for United States/i)).toBeInTheDocument()
    })

    it('should not render country-specific message when no country provided', () => {
      render(<PlansLoadingState />)
      
      expect(screen.queryByText(/Finding the best deals for/i)).not.toBeInTheDocument()
    })
  })

  describe('Skeleton Cards', () => {
    it('should render three skeleton loading cards', () => {
      const { container } = render(<PlansLoadingState />)
      
      const skeletonCards = container.querySelectorAll('.animate-pulse')
      expect(skeletonCards.length).toBe(3) // 3 skeleton cards
    })

    it('should have grid layout for skeleton cards', () => {
      const { container } = render(<PlansLoadingState />)
      
      const grid = container.querySelector('.grid')
      expect(grid).toBeInTheDocument()
      expect(grid).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-3')
    })
  })

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(<PlansLoadingState />)
      
      const heading = screen.getByRole('heading', { name: /loading esim plans/i })
      expect(heading).toBeInTheDocument()
    })

    it('should be visible to screen readers', () => {
      render(<PlansLoadingState countryName="Japan" />)
      
      expect(screen.getByText('Loading eSIM Plans')).toBeVisible()
      expect(screen.getByText(/Finding the best deals for Japan/i)).toBeVisible()
    })
  })

  describe('Visual Structure', () => {
    it('should center content', () => {
      const { container } = render(<PlansLoadingState />)
      
      const centerDiv = container.querySelector('.flex.flex-col.items-center')
      expect(centerDiv).toBeInTheDocument()
    })

    it('should have proper spacing', () => {
      const { container } = render(<PlansLoadingState />)
      
      const spacedDiv = container.querySelector('.space-y-4')
      expect(spacedDiv).toBeInTheDocument()
    })
  })

  describe('Animation', () => {
    it('should have spinning animation on loader', () => {
      const { container } = render(<PlansLoadingState />)
      
      const spinner = container.querySelector('.animate-spin')
      expect(spinner).toHaveClass('animate-spin')
    })

    it('should have pulse animation on skeleton cards', () => {
      const { container } = render(<PlansLoadingState />)
      
      const pulsingElements = container.querySelectorAll('.animate-pulse')
      expect(pulsingElements.length).toBeGreaterThan(0)
    })
  })

  describe('Props Handling', () => {
    it('should handle undefined country name', () => {
      expect(() => {
        render(<PlansLoadingState countryName={undefined} />)
      }).not.toThrow()
    })

    it('should handle empty country name', () => {
      render(<PlansLoadingState countryName="" />)
      
      // Should not show the country-specific message with empty string
      const message = screen.queryByText(/Finding the best deals for/i)
      expect(message).not.toBeInTheDocument()
    })

    it('should handle country names with special characters', () => {
      render(<PlansLoadingState countryName="Côte d'Ivoire" />)
      
      expect(screen.getByText(/Finding the best deals for Côte d'Ivoire/i)).toBeInTheDocument()
    })
  })

  describe('Responsive Design', () => {
    it('should have responsive grid classes', () => {
      const { container } = render(<PlansLoadingState />)
      
      const grid = container.querySelector('.grid')
      expect(grid).toHaveClass('md:grid-cols-2')
      expect(grid).toHaveClass('lg:grid-cols-3')
    })
  })

  describe('Skeleton Card Structure', () => {
    it('should have skeleton elements matching plan card layout', () => {
      const { container } = render(<PlansLoadingState />)
      
      // Check for skeleton elements (represented by bg-muted divs)
      const skeletonElements = container.querySelectorAll('.bg-muted')
      expect(skeletonElements.length).toBeGreaterThan(0)
    })

    it('should have proper skeleton card spacing', () => {
      const { container } = render(<PlansLoadingState />)
      
      const cardSpacing = container.querySelector('.gap-6')
      expect(cardSpacing).toBeInTheDocument()
    })
  })
})
