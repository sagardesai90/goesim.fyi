# Multi-Currency Implementation for eSIM Plans

## Overview

The scraper now extracts **actual prices and currencies** from provider websites (like Airalo) instead of doing inaccurate currency conversions. This ensures users see the real prices as displayed on the provider's website.

## How It Works

### 1. Currency Extraction

The scraper now:
- ✅ Extracts the **actual currency symbol** (€, $, £, ¥, ₹) from the website
- ✅ Stores the **original price** in that currency
- ✅ Maps symbols to currency codes (EUR, USD, GBP, JPY, INR)
- ✅ Stores both the original price and a USD-converted price for comparison

### 2. Database Schema

Your database already supports multiple currencies:

```sql
price_usd DECIMAL(10,2) NOT NULL,    -- Converted price for comparison
currency TEXT DEFAULT 'USD',          -- Original currency from website  
original_price DECIMAL(10,2),         -- Original price in original currency
```

**Example data:**
- Original: 4.00 EUR
- Stored as: `price_usd: 4.40, currency: 'EUR', original_price: 4.00`

### 3. Currency Detection

The scraper automatically detects and extracts currencies:

```javascript
// From website HTML
"4.00 €" → currency: "EUR", originalPrice: 4.00
"$7.50" → currency: "USD", originalPrice: 7.50
"£5.99" → currency: "GBP", originalPrice: 5.99
```

**Supported Currencies:**
- EUR (€) - Euro
- USD ($) - US Dollar
- GBP (£) - British Pound
- JPY (¥) - Japanese Yen
- INR (₹) - Indian Rupee

## Current Implementation

### What's Stored in Database

For each plan, we store:
1. **`price_usd`** - USD price for comparison (converted if needed)
2. **`currency`** - The original currency code (EUR, USD, etc.)
3. **`original_price`** - The actual price from the website in its original currency

**Example from Airalo US:**
```json
{
  "name": "United States 1GB - 7 Days",
  "priceDisplay": "4.00 €",
  "currency": "EUR",
  "originalPrice": 4.00,
  "priceUsd": 4.40
}
```

### Verified Data

Based on our testing with Airalo:

**United States Plans (showing EUR):**
- 1GB - 7 Days: **4.00 €** (EUR)
- 2GB - 15 Days: **6.50 €** (EUR)
- 3GB - 30 Days: **8.00 €** (EUR)
- 5GB - 30 Days: **12.50 €** (EUR)
- 10GB - 30 Days: **20.50 €** (EUR)
- 20GB - 30 Days: **32.50 €** (EUR)

## Frontend Implementation (Recommended)

### Option 1: Show Original Currency (Recommended)

Display prices in the currency they were scraped in:

```typescript
// Display the original price with its currency
const displayPrice = (plan) => {
  return `${plan.original_price} ${plan.currency}`
  // Output: "4.00 EUR" or "$7.50" etc.
}
```

### Option 2: Currency Switcher

Let users switch between currencies on the frontend:

```typescript
const CurrencySelector = () => {
  const [selectedCurrency, setSelectedCurrency] = useState('EUR')
  
  const convertPrice = (plan, targetCurrency) => {
    // Use a real-time currency API like exchangerate-api.com
    // Or use the stored values
    if (plan.currency === targetCurrency) {
      return plan.original_price
    }
    if (targetCurrency === 'USD') {
      return plan.priceUsd
    }
    // Convert using API...
  }
  
  return (
    <select onChange={(e) => setSelectedCurrency(e.target.value)}>
      <option value="USD">USD ($)</option>
      <option value="EUR">EUR (€)</option>
      <option value="GBP">GBP (£)</option>
    </select>
  )
}
```

### Option 3: Show Both

Show original price with USD equivalent:

```typescript
const PriceDisplay = ({ plan }) => (
  <div>
    <div className="original-price">
      {plan.original_price} {plan.currency}
    </div>
    {plan.currency !== 'USD' && (
      <div className="usd-equivalent">
        ≈ ${plan.priceUsd} USD
      </div>
    )}
  </div>
)
```

## Currency Conversion

### Current Approach (Fallback Rates)

The scraper uses approximate conversion rates as a fallback:

```typescript
const currencyRates = {
  'USD': 1.0,
  'EUR': 1.10,   // 1 EUR ≈ 1.10 USD
  'GBP': 1.27,   // 1 GBP ≈ 1.27 USD
  'JPY': 0.0067, // 1 JPY ≈ 0.0067 USD
  'INR': 0.012   // 1 INR ≈ 0.012 USD
}
```

⚠️ **Note**: These are approximate rates for database storage only.

### Recommended: Real-Time Currency API

For accurate conversions on the frontend, use a currency API:

**Option 1: ExchangeRate-API (Free tier available)**
```typescript
// https://www.exchangerate-api.com/docs/free
fetch('https://api.exchangerate-api.com/v4/latest/EUR')
  .then(res => res.json())
  .then(data => {
    const usdRate = data.rates.USD
    const convertedPrice = originalPrice * usdRate
  })
```

**Option 2: Fixer.io**
```typescript
// https://fixer.io/
const API_KEY = 'your_api_key'
fetch(`https://data.fixer.io/api/latest?access_key=${API_KEY}&base=EUR`)
  .then(res => res.json())
  .then(data => {
    const rates = data.rates
  })
```

**Option 3: Cache Rates Daily**

Fetch rates once per day and cache them:

```typescript
// In your backend
async function updateCurrencyRates() {
  const rates = await fetch('https://api.exchangerate-api.com/v4/latest/USD')
    .then(res => res.json())
  
  // Store in database or cache
  await redis.set('currency_rates', JSON.stringify(rates.rates))
  await redis.expire('currency_rates', 86400) // 24 hours
}

// Run daily
cron.schedule('0 0 * * *', updateCurrencyRates)
```

## Provider Currency Behavior

### Airalo

Airalo appears to show prices in **EUR (€) by default** but likely adapts based on:
- User's location/IP
- Browser language settings
- Account settings

**What we extract:**
- Whatever currency is displayed when we scrape
- Currently extracting **EUR** prices
- Storing original EUR prices + USD conversions

### Future: Scrape Multiple Currencies

To scrape in multiple currencies, the scraper could:

1. **Navigate with different locales:**
```typescript
await page.setExtraHTTPHeaders({
  'Accept-Language': 'en-US,en;q=0.9',  // For USD
  // Or 'en-GB,en;q=0.9' for GBP
  // Or 'de-DE,de;q=0.9' for EUR
})
```

2. **Scrape multiple times:**
```typescript
const currencies = ['USD', 'EUR', 'GBP']
for (const currency of currencies) {
  // Set headers/cookies for currency
  // Scrape prices
  // Store with currency code
}
```

3. **Store multiple price records:**
```sql
-- One record per plan per currency
INSERT INTO esim_plan_prices (plan_id, currency, price, scraped_at)
VALUES ('plan-123', 'USD', 4.50, NOW())
VALUES ('plan-123', 'EUR', 4.00, NOW())
VALUES ('plan-123', 'GBP', 3.50, NOW())
```

## Example Query

Get plans with their original prices:

```sql
SELECT 
  name,
  data_amount_gb,
  validity_days,
  price_usd,              -- For sorting/comparison
  currency,               -- Original currency
  original_price,         -- Original price value
  CONCAT(original_price, ' ', currency) as display_price
FROM esim_plans
WHERE country_id = 'xxx'
ORDER BY price_usd ASC;
```

## API Response Example

```json
{
  "plans": [
    {
      "id": "123",
      "name": "United States 1GB - 7 Days",
      "data": "1GB",
      "validity": "7 days",
      "price": {
        "value": 4.00,
        "currency": "EUR",
        "display": "4.00 €",
        "usd_equivalent": 4.40
      },
      "network": "Change",
      "url": "https://www.airalo.com/..."
    }
  ]
}
```

## Testing

To verify currency extraction:

```bash
# In browser console on Airalo page
document.querySelectorAll('a').forEach(link => {
  const priceDiv = link.querySelector('div');
  if (priceDiv && priceDiv.textContent.match(/[\d.]+\s*[€$£]/)) {
    console.log(priceDiv.textContent); // Should show price with currency
  }
});
```

## Summary

✅ **What Changed:**
- Scraper now extracts actual currency symbols
- Stores original currency and price
- No more inaccurate manual conversions

✅ **What's Stored:**
- `currency`: "EUR", "USD", etc.
- `original_price`: 4.00 (in original currency)
- `price_usd`: 4.40 (for comparison only)

✅ **Next Steps:**
1. Use a currency API for real-time conversions on frontend
2. Let users select their preferred currency
3. Display original prices from website
4. Consider scraping in multiple currencies for better accuracy

---

**Last Updated**: September 29, 2025
**Status**: ✅ Implemented and tested


