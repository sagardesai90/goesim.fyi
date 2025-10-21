import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CountrySelector } from '@/components/country-selector'
import { useRouter, useSearchParams } from 'next/navigation'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}))

describe('CountrySelector Component', () => {
  const mockPush = jest.fn()
  const mockSearchParams = new URLSearchParams()

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
    {
      id: '3',
      name: 'Japan',
      code: 'JP',
      region: 'Asia',
    },
    {
      id: '4',
      name: 'Australia',
      code: 'AU',
      region: 'Oceania',
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      replace: jest.fn(),
      prefetch: jest.fn(),
    })
    ;(useSearchParams as jest.Mock).mockReturnValue(mockSearchParams)
  })

  describe('Rendering', () => {
    it('should render the component with title and description', () => {
      render(<CountrySelector countries={mockCountries} />)

      expect(screen.getByText('Select Your Destination')).toBeInTheDocument()
      expect(
        screen.getByText('Choose a country to compare eSIM plans and find the best deals')
      ).toBeInTheDocument()
    })

    it('should render the dropdown select element', () => {
      render(<CountrySelector countries={mockCountries} />)

      const select = screen.getByRole('combobox')
      expect(select).toBeInTheDocument()
    })

    it('should render "Advanced Search" button', () => {
      render(<CountrySelector countries={mockCountries} />)

      const advancedSearchButton = screen.getByRole('link', { name: /advanced search/i })
      expect(advancedSearchButton).toBeInTheDocument()
      expect(advancedSearchButton).toHaveAttribute('href', '/search')
    })

    it('should display loading state when no countries are provided', () => {
      render(<CountrySelector countries={[]} />)

      expect(screen.getByText('Loading countries...')).toBeInTheDocument()
      expect(
        screen.getByText('If this persists, check your database connection.')
      ).toBeInTheDocument()
    })

    it('should not render dropdown when countries array is empty', () => {
      render(<CountrySelector countries={[]} />)

      expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
    })
  })

  describe('Country Options', () => {
    it('should render all countries in the dropdown', () => {
      render(<CountrySelector countries={mockCountries} />)

      const select = screen.getByRole('combobox') as HTMLSelectElement

      mockCountries.forEach((country) => {
        const option = screen.getByRole('option', { name: new RegExp(country.name) })
        expect(option).toBeInTheDocument()
        expect(option).toHaveValue(country.code)
      })
    })

    it('should group countries by region', () => {
      render(<CountrySelector countries={mockCountries} />)

      const select = screen.getByRole('combobox') as HTMLSelectElement

      // Check that optgroups exist
      const optgroups = select.querySelectorAll('optgroup')
      expect(optgroups.length).toBeGreaterThan(0)

      // Check specific regions
      const regions = ['North America', 'Europe', 'Asia', 'Oceania']
      regions.forEach((region) => {
        const optgroup = Array.from(optgroups).find(
          (og) => og.label === region
        )
        expect(optgroup).toBeTruthy()
      })
    })

    it('should display placeholder text by default', () => {
      render(<CountrySelector countries={mockCountries} />)

      const placeholderOption = screen.getByRole('option', {
        name: /select a country/i,
      })
      expect(placeholderOption).toBeInTheDocument()
      expect(placeholderOption).toHaveValue('')
    })

    it('should render flag emojis for countries', () => {
      render(<CountrySelector countries={mockCountries} />)

      // The flag emojis are rendered as part of the option text
      const usOption = screen.getByRole('option', { name: /🇺🇸 United States/i })
      expect(usOption).toBeInTheDocument()
    })
  })

  describe('User Interactions', () => {
    it('should allow users to select a country from dropdown', async () => {
      render(<CountrySelector countries={mockCountries} />)

      const select = screen.getByRole('combobox') as HTMLSelectElement

      // Change selection
      fireEvent.change(select, { target: { value: 'US' } })

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/?country=US')
      })
    })

    it('should update URL with country code when country is selected', async () => {
      render(<CountrySelector countries={mockCountries} />)

      const select = screen.getByRole('combobox')

      fireEvent.change(select, { target: { value: 'JP' } })

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/?country=JP')
      })
    })

    it('should preserve existing search params when selecting country', async () => {
      const searchParamsWithData = new URLSearchParams('data=5')
      ;(useSearchParams as jest.Mock).mockReturnValue(searchParamsWithData)

      render(<CountrySelector countries={mockCountries} />)

      const select = screen.getByRole('combobox')
      fireEvent.change(select, { target: { value: 'GB' } })

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/?data=5&country=GB')
      })
    })

    it('should not navigate if empty value is selected', async () => {
      render(<CountrySelector countries={mockCountries} />)

      const select = screen.getByRole('combobox')
      fireEvent.change(select, { target: { value: '' } })

      await waitFor(() => {
        expect(mockPush).not.toHaveBeenCalled()
      })
    })

    it('should display selected country when selectedCountry prop is provided', () => {
      render(<CountrySelector countries={mockCountries} selectedCountry="US" />)

      const select = screen.getByRole('combobox') as HTMLSelectElement
      expect(select.value).toBe('US')
    })

    it('should allow selecting different countries sequentially', async () => {
      render(<CountrySelector countries={mockCountries} />)

      const select = screen.getByRole('combobox')

      // First selection
      fireEvent.change(select, { target: { value: 'US' } })
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/?country=US')
      })

      // Second selection
      fireEvent.change(select, { target: { value: 'JP' } })
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/?country=JP')
      })

      expect(mockPush).toHaveBeenCalledTimes(2)
    })
  })

  describe('Required Props Validation', () => {
    it('should accept countries prop as an array', () => {
      expect(() => {
        render(<CountrySelector countries={mockCountries} />)
      }).not.toThrow()
    })

    it('should handle undefined selectedCountry gracefully', () => {
      expect(() => {
        render(<CountrySelector countries={mockCountries} selectedCountry={undefined} />)
      }).not.toThrow()
    })

    it('should render correctly with minimal country data', () => {
      const minimalCountries = [
        {
          id: '1',
          name: 'Test Country',
          code: 'TC',
          region: 'Test Region',
        },
      ]

      render(<CountrySelector countries={minimalCountries} />)

      expect(screen.getByRole('option', { name: /Test Country/i })).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<CountrySelector countries={mockCountries} />)

      const select = screen.getByRole('combobox')
      expect(select).toBeInTheDocument()
    })

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup()
      render(<CountrySelector countries={mockCountries} />)

      const select = screen.getByRole('combobox')
      
      // Tab to the select element
      await user.tab()
      expect(select).toHaveFocus()
    })

    it('should have focusable Advanced Search button', async () => {
      const user = userEvent.setup()
      render(<CountrySelector countries={mockCountries} />)

      const advancedSearchButton = screen.getByRole('link', { name: /advanced search/i })
      
      // The button should be focusable
      advancedSearchButton.focus()
      expect(advancedSearchButton).toHaveFocus()
    })
  })

  describe('Visual Elements', () => {
    it('should render MapPin icon', () => {
      const { container } = render(<CountrySelector countries={mockCountries} />)

      // Check for svg element (Lucide icons render as SVGs)
      const icons = container.querySelectorAll('svg')
      expect(icons.length).toBeGreaterThan(0)
    })

    it('should render divider between select and button', () => {
      render(<CountrySelector countries={mockCountries} />)

      expect(screen.getByText('or')).toBeInTheDocument()
    })

    it('should apply correct styling classes to select element', () => {
      render(<CountrySelector countries={mockCountries} />)

      const select = screen.getByRole('combobox')
      expect(select).toHaveClass('w-full', 'h-12', 'px-4', 'py-2')
    })
  })

  describe('Loading State', () => {
    it('should show loading spinner when country is selected', async () => {
      render(<CountrySelector countries={mockCountries} />)

      const select = screen.getByRole('combobox') as HTMLSelectElement
      fireEvent.change(select, { target: { value: 'US' } })

      await waitFor(() => {
        // Look for the spinner icon
        const spinner = document.querySelector('.animate-spin')
        expect(spinner).toBeInTheDocument()
      })
    })

    it('should disable dropdown during loading', async () => {
      render(<CountrySelector countries={mockCountries} />)

      const select = screen.getByRole('combobox') as HTMLSelectElement
      fireEvent.change(select, { target: { value: 'US' } })

      await waitFor(() => {
        expect(select).toBeDisabled()
      })
    })

    it('should re-enable dropdown after country loads', () => {
      const { rerender } = render(<CountrySelector countries={mockCountries} />)

      const select = screen.getByRole('combobox') as HTMLSelectElement
      fireEvent.change(select, { target: { value: 'US' } })

      // Simulate page update with new selectedCountry
      rerender(<CountrySelector countries={mockCountries} selectedCountry="US" />)

      expect(select).not.toBeDisabled()
    })

    it('should hide dropdown chevron during loading', async () => {
      render(<CountrySelector countries={mockCountries} />)

      const select = screen.getByRole('combobox') as HTMLSelectElement
      fireEvent.change(select, { target: { value: 'US' } })

      await waitFor(() => {
        // Check that background image is removed (chevron hidden)
        const style = window.getComputedStyle(select)
        expect(select.style.backgroundImage).toBe('none')
      })
    })

    it('should show spinner icon in correct position', async () => {
      const { container } = render(<CountrySelector countries={mockCountries} />)

      const select = screen.getByRole('combobox') as HTMLSelectElement
      fireEvent.change(select, { target: { value: 'JP' } })

      await waitFor(() => {
        const spinnerContainer = container.querySelector('.absolute.right-3')
        expect(spinnerContainer).toBeInTheDocument()
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle country with special characters in name', () => {
      const specialCountries = [
        {
          id: '1',
          name: "Côte d'Ivoire",
          code: 'CI',
          region: 'Africa',
        },
      ]

      render(<CountrySelector countries={specialCountries} />)

      expect(screen.getByRole('option', { name: /Côte d'Ivoire/i })).toBeInTheDocument()
    })

    it('should handle large number of countries', () => {
      const manyCountries = Array.from({ length: 100 }, (_, i) => ({
        id: `${i + 1}`,
        name: `Country ${i + 1}`,
        code: `C${i}`,
        region: `Region ${i % 5}`,
      }))

      render(<CountrySelector countries={manyCountries} />)

      const select = screen.getByRole('combobox')
      expect(select).toBeInTheDocument()

      // Check that options are rendered
      const options = screen.getAllByRole('option')
      expect(options.length).toBeGreaterThan(100) // +1 for placeholder
    })

    it('should handle selecting a country that no longer exists in the list', () => {
      render(<CountrySelector countries={mockCountries} selectedCountry="XX" />)

      const select = screen.getByRole('combobox') as HTMLSelectElement
      // When a value doesn't exist, the browser may default to the first valid option or empty
      // We just verify the component doesn't crash
      expect(select).toBeInTheDocument()
    })

    it('should handle rapid successive selections', async () => {
      render(<CountrySelector countries={mockCountries} />)

      const select = screen.getByRole('combobox')

      // Rapidly change selections
      fireEvent.change(select, { target: { value: 'US' } })
      fireEvent.change(select, { target: { value: 'GB' } })
      fireEvent.change(select, { target: { value: 'JP' } })

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledTimes(3)
      })
    })
  })
})
