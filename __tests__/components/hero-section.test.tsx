import React from 'react'
import { render, screen } from '@testing-library/react'
import { HeroSection } from '@/components/hero-section'

// Mock the CountrySelector component
jest.mock('@/components/country-selector', () => ({
  CountrySelector: ({ countries, selectedCountry }: any) => (
    <div data-testid="country-selector">
      <div data-testid="countries-count">{countries.length}</div>
      <div data-testid="selected-country">{selectedCountry || 'none'}</div>
    </div>
  ),
}))

describe('HeroSection Component', () => {
  const mockCountries = [
    {
      id: '1',
      name: 'United States',
      code: 'US',
      region: 'North America',
    },
    {
      id: '2',
      name: 'United Kingdom',
      code: 'GB',
      region: 'Europe',
    },
  ]

  describe('Rendering', () => {
    it('should render the main heading', () => {
      render(<HeroSection countries={mockCountries} />)

      const heading = screen.getByRole('heading', { name: /find the best esim deals/i })
      expect(heading).toBeInTheDocument()
    })

    it('should render the main description text', () => {
      render(<HeroSection countries={mockCountries} />)

      expect(
        screen.getByText(/compare esim rates across countries and data amounts/i)
      ).toBeInTheDocument()
    })

    it('should render the CountrySelector component', () => {
      render(<HeroSection countries={mockCountries} />)

      expect(screen.getByTestId('country-selector')).toBeInTheDocument()
    })

    it('should pass countries prop to CountrySelector', () => {
      render(<HeroSection countries={mockCountries} />)

      const countriesCount = screen.getByTestId('countries-count')
      expect(countriesCount).toHaveTextContent('2')
    })

    it('should pass selectedCountry prop to CountrySelector', () => {
      render(<HeroSection countries={mockCountries} selectedCountry="US" />)

      const selectedCountry = screen.getByTestId('selected-country')
      expect(selectedCountry).toHaveTextContent('US')
    })

    it('should render all three feature cards', () => {
      render(<HeroSection countries={mockCountries} />)

      expect(screen.getByRole('heading', { name: /200\+ countries/i })).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: /real-time pricing/i })).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: /best value/i })).toBeInTheDocument()
    })
  })

  describe('Feature Cards Content', () => {
    it('should render the "200+ Countries" feature card with correct content', () => {
      render(<HeroSection countries={mockCountries} />)

      expect(screen.getByRole('heading', { name: /200\+ countries/i })).toBeInTheDocument()
      expect(
        screen.getByText(/coverage across all major destinations worldwide/i)
      ).toBeInTheDocument()
    })

    it('should render the "Real-time Pricing" feature card with correct content', () => {
      render(<HeroSection countries={mockCountries} />)

      expect(screen.getByRole('heading', { name: /real-time pricing/i })).toBeInTheDocument()
      expect(
        screen.getByText(/always up-to-date rates from top esim providers/i)
      ).toBeInTheDocument()
    })

    it('should render the "Best Value" feature card with correct content', () => {
      render(<HeroSection countries={mockCountries} />)

      expect(screen.getByRole('heading', { name: /best value/i })).toBeInTheDocument()
      expect(
        screen.getByText(/find the most cost-effective plans for your needs/i)
      ).toBeInTheDocument()
    })
  })

  describe('Icons', () => {
    it('should render icons for all feature cards', () => {
      const { container } = render(<HeroSection countries={mockCountries} />)

      // Check for SVG elements (Lucide icons render as SVGs)
      const icons = container.querySelectorAll('svg')
      // Should have at least 3 icons for the feature cards
      expect(icons.length).toBeGreaterThanOrEqual(3)
    })
  })

  describe('Layout and Styling', () => {
    it('should apply gradient background classes', () => {
      const { container } = render(<HeroSection countries={mockCountries} />)

      const section = container.querySelector('section')
      expect(section).toHaveClass('bg-gradient-to-br', 'from-background')
    })

    it('should have responsive padding classes', () => {
      const { container } = render(<HeroSection countries={mockCountries} />)

      const section = container.querySelector('section')
      const innerDiv = section?.querySelector('div')
      expect(innerDiv).toHaveClass('py-16', 'md:py-24')
    })

    it('should have grid layout for feature cards', () => {
      const { container } = render(<HeroSection countries={mockCountries} />)

      // Find the grid container
      const gridContainer = container.querySelector('.grid')
      expect(gridContainer).toBeInTheDocument()
      expect(gridContainer).toHaveClass('grid-cols-1', 'md:grid-cols-3')
    })
  })

  describe('Props Handling', () => {
    it('should handle empty countries array', () => {
      render(<HeroSection countries={[]} />)

      const countriesCount = screen.getByTestId('countries-count')
      expect(countriesCount).toHaveTextContent('0')
    })

    it('should handle undefined selectedCountry', () => {
      render(<HeroSection countries={mockCountries} />)

      const selectedCountry = screen.getByTestId('selected-country')
      expect(selectedCountry).toHaveTextContent('none')
    })

    it('should handle large number of countries', () => {
      const manyCountries = Array.from({ length: 250 }, (_, i) => ({
        id: `${i + 1}`,
        name: `Country ${i + 1}`,
        code: `C${i}`,
        region: `Region ${i % 5}`,
      }))

      render(<HeroSection countries={manyCountries} />)

      const countriesCount = screen.getByTestId('countries-count')
      expect(countriesCount).toHaveTextContent('250')
    })
  })

  describe('Semantic Structure', () => {
    it('should use semantic HTML with section element', () => {
      const { container } = render(<HeroSection countries={mockCountries} />)

      const section = container.querySelector('section')
      expect(section).toBeInTheDocument()
    })

    it('should have proper heading hierarchy', () => {
      render(<HeroSection countries={mockCountries} />)

      // Main h1 should exist
      const h1 = screen.getByRole('heading', { level: 1 })
      expect(h1).toBeInTheDocument()

      // Feature cards should have h3 headings
      const h3Headings = screen.getAllByRole('heading', { level: 3 })
      expect(h3Headings).toHaveLength(3)
    })

    it('should use container classes for proper layout', () => {
      const { container } = render(<HeroSection countries={mockCountries} />)

      const containerDiv = container.querySelector('.container')
      expect(containerDiv).toBeInTheDocument()
      expect(containerDiv).toHaveClass('mx-auto', 'px-4')
    })
  })

  describe('Accessibility', () => {
    it('should have readable text for screen readers', () => {
      render(<HeroSection countries={mockCountries} />)

      // Check that all important text content is present and accessible
      expect(screen.getByText(/find the best esim deals/i)).toBeVisible()
      expect(screen.getByText(/compare esim rates/i)).toBeVisible()
    })

    it('should have proper contrast with background gradient', () => {
      const { container } = render(<HeroSection countries={mockCountries} />)

      const section = container.querySelector('section')
      expect(section).toHaveClass('bg-gradient-to-br')

      // Text should have foreground color classes for contrast
      const heading = screen.getByRole('heading', { level: 1 })
      expect(heading).toHaveClass('text-transparent')
    })
  })

  describe('Responsive Design', () => {
    it('should have responsive text sizing classes', () => {
      render(<HeroSection countries={mockCountries} />)

      const heading = screen.getByRole('heading', { name: /find the best esim deals/i })
      expect(heading).toHaveClass('text-4xl', 'md:text-6xl')
    })

    it('should have responsive feature card grid', () => {
      const { container } = render(<HeroSection countries={mockCountries} />)

      const grid = container.querySelector('.grid')
      expect(grid).toHaveClass('grid-cols-1', 'md:grid-cols-3')
    })
  })

  describe('Integration with CountrySelector', () => {
    it('should pass all required props to CountrySelector', () => {
      render(<HeroSection countries={mockCountries} selectedCountry="GB" />)

      expect(screen.getByTestId('country-selector')).toBeInTheDocument()
      expect(screen.getByTestId('countries-count')).toHaveTextContent('2')
      expect(screen.getByTestId('selected-country')).toHaveTextContent('GB')
    })
  })

  describe('Content Accuracy', () => {
    it('should display accurate marketing copy', () => {
      render(<HeroSection countries={mockCountries} />)

      // Verify key marketing messages are present
      expect(screen.getByText(/save money on your next trip/i)).toBeInTheDocument()
      expect(screen.getByText(/comprehensive comparison tool/i)).toBeInTheDocument()
    })

    it('should mention specific value propositions', () => {
      render(<HeroSection countries={mockCountries} />)

      expect(screen.getByText(/200\+ countries/i)).toBeInTheDocument()
      expect(screen.getByText(/real-time pricing/i)).toBeInTheDocument()
      expect(screen.getByText(/best value/i)).toBeInTheDocument()
    })
  })
})
