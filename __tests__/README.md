# Component Tests

This directory contains all component tests for the GoeSIM.fyi application.

## Structure

```
__tests__/
└── components/
    ├── country-selector.test.tsx    # 48 tests
    ├── hero-section.test.tsx        # 15 tests
    └── plan-comparison.test.tsx     # 17 tests
```

## Quick Start

```bash
# Run all tests
npm test

# Watch mode (for development)
npm run test:watch

# Coverage report
npm run test:coverage
```

## Test Files

### country-selector.test.tsx

Tests for the country dropdown selector on the home page.

**Test Coverage:**
- Rendering (dropdown, buttons, icons)
- Country options (flag emojis, grouping by region)
- User interactions (selecting countries, URL updates)
- Required props validation
- Accessibility (ARIA labels, keyboard navigation)
- Visual elements (styling, layout)
- Edge cases (special characters, large datasets, rapid selections)

**Key Scenarios:**
- User selects a country from dropdown → URL updates with country code
- User clicks "Advanced Search" → Navigates to /search
- Empty countries array → Shows loading state
- Search params preserved when selecting country

### hero-section.test.tsx

Tests for the hero section that contains the main headline and country selector.

**Test Coverage:**
- Rendering (headline, description, feature cards)
- Feature cards content (200+ Countries, Real-time Pricing, Best Value)
- Icons rendering
- Layout and styling (gradient, responsive classes)
- Props handling (countries, selectedCountry)
- Semantic structure (proper HTML elements and heading hierarchy)
- Accessibility
- Responsive design
- Integration with CountrySelector

**Key Scenarios:**
- Component renders with correct marketing copy
- All three feature cards display with icons
- Props are correctly passed to CountrySelector
- Responsive classes applied for mobile/desktop

### plan-comparison.test.tsx

Tests for the plan comparison grid that shows eSIM plans.

**Test Coverage:**
- Rendering (plan cards, prices, data amounts, validity)
- Feature badges (Hotspot, Voice, SMS)
- Buy Now buttons and affiliate links
- Affiliate link loading
- Empty states
- Responsive layout
- Props handling
- Visual hierarchy (Best Deal badge)

**Key Scenarios:**
- Plans display with correct pricing and details
- Best deal badge shows on cheapest plan
- Affiliate links fetched on mount
- Feature badges only show for included features
- Empty plans array shows appropriate message
- URL updates when filters change

## Writing New Tests

### Template

```typescript
import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { YourComponent } from '@/components/your-component'

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}))

describe('YourComponent', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render the component', async () => {
      await act(async () => {
        render(<YourComponent />)
      })

      expect(screen.getByText('Expected Text')).toBeInTheDocument()
    })
  })

  describe('User Interactions', () => {
    it('should handle user interaction', async () => {
      await act(async () => {
        render(<YourComponent />)
      })

      const button = screen.getByRole('button')
      fireEvent.click(button)

      await waitFor(() => {
        expect(/* your assertion */).toBeTruthy()
      })
    })
  })
})
```

### Guidelines

1. **Group related tests** using `describe()` blocks
2. **Use semantic queries**: `getByRole`, `getByLabelText`, `getByText`
3. **Test user behavior**, not implementation details
4. **Handle async operations** with `act()` and `waitFor()`
5. **Mock external dependencies** (API calls, navigation, etc.)
6. **Clean up** in `beforeEach()` and `afterEach()` hooks
7. **Test accessibility** features
8. **Cover edge cases** (empty data, large datasets, errors)

## Common Patterns

### Testing User Interactions

```typescript
// Dropdown selection
const select = screen.getByRole('combobox')
fireEvent.change(select, { target: { value: 'US' } })

// Button click
const button = screen.getByRole('button', { name: /click me/i })
fireEvent.click(button)

// Keyboard navigation
await user.tab()
expect(element).toHaveFocus()
```

### Testing URL Updates

```typescript
const mockPush = jest.fn()
;(useRouter as jest.Mock).mockReturnValue({ push: mockPush })

// ... trigger navigation

await waitFor(() => {
  expect(mockPush).toHaveBeenCalledWith('/?country=US')
})
```

### Testing Async State

```typescript
await act(async () => {
  render(<Component />)
})

await waitFor(() => {
  expect(screen.getByText('Loaded Data')).toBeInTheDocument()
})
```

### Mocking API Calls

```typescript
global.fetch = jest.fn()

beforeEach(() => {
  ;(global.fetch as jest.Mock).mockResolvedValue({
    ok: true,
    json: async () => ({ data: 'mock data' }),
  })
})
```

## Debugging Tests

### View Component Output

```typescript
const { debug } = render(<Component />)
debug() // Prints component HTML to console
```

### View Specific Element

```typescript
const element = screen.getByRole('button')
debug(element)
```

### Check Available Queries

```typescript
screen.logTestingPlaygroundURL() // Provides suggestions for queries
```

### Run Single Test

```bash
npm test -- country-selector.test.tsx
```

### Run Single Test Case

```bash
npm test -- -t "should render the component"
```

## Troubleshooting

### Test Fails with "not wrapped in act()"

This happens when React state updates occur outside of `act()`.

**Solution:**
```typescript
await act(async () => {
  render(<Component />)
})
```

### Test Timeout

Default timeout is 5 seconds. Increase if needed:

```typescript
it('long running test', async () => {
  // test code
}, 10000) // 10 second timeout
```

### Can't Find Element

Use `screen.debug()` to see what's rendered, then adjust your query:

```typescript
screen.debug()
// Or check what's available
screen.getByRole('') // See error message with available roles
```

### Mock Not Working

Ensure mocks are defined before importing component:

```typescript
jest.mock('next/navigation') // ✅ Before import
import { Component } from '@/components/component' // ✅ After mock
```

## Coverage Reports

View detailed coverage:

```bash
npm run test:coverage
```

Coverage reports show:
- **Statements**: % of statements executed
- **Branches**: % of if/else branches taken
- **Functions**: % of functions called
- **Lines**: % of lines executed

## CI/CD Integration

Tests run automatically on:
- Pull requests
- Merges to main branch
- Before deployments

Ensure all tests pass before pushing:

```bash
npm test
```

## Performance

Current test suite performance:
- **Total tests**: 80
- **Average runtime**: ~5-6 seconds
- **Coverage**: 100% for tested components

## Need Help?

- Check the [Testing Guide](../TESTING_GUIDE.md) for comprehensive documentation
- Review [React Testing Library docs](https://testing-library.com/docs/react-testing-library/intro/)
- Look at existing tests for examples
- Create an issue if you find bugs in tests
