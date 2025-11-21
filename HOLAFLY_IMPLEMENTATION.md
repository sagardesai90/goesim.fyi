# Holafly Scraper Implementation Guide

## Overview

This document describes the Holafly Puppeteer scraper implementation, which provides dynamic real-time pricing data for Holafly eSIM plans across 12 countries.

## Architecture

### Components Created

```
lib/scrapers/
├── holafly-puppeteer-scraper.ts          # Main scraper class
├── holafly-puppeteer/
│   ├── country-slugs.ts                  # Country URL mappings
│   ├── currency-rates.ts                 # EUR→USD conversion
│   └── launch-args.ts                    # Browser configuration
```

### Key Features

1. **Dynamic Pricing**: Scrapes live prices from Holafly website using Puppeteer
2. **Currency Handling**:
   - Primary: Attempts to select USD currency in Holafly UI
   - Fallback: Converts EUR/GBP to USD using exchange rates
3. **12 Country Support**: US, CA, GB, DE, FR, ES, IT, JP, AU, NL, CH, SG
4. **Graceful Failure**: Returns empty arrays on errors, retains stale database data
5. **No Static Fallback**: Deprecated old static pricing approach

## Configuration

### Supported Countries

The scraper only supports the 12 countries currently in the cron job:

**Group 1 (2 AM UTC):** US, CA, GB, DE, FR, ES
**Group 2 (2 PM UTC):** IT, JP, AU, NL, CH, SG

### Currency Conversion

**EUR to USD Rate:** 1.10 (configurable in `currency-rates.ts`)
**GBP to USD Rate:** 1.27

To update rates:
```typescript
// lib/scrapers/holafly-puppeteer/currency-rates.ts
export const EUR_TO_USD_RATE = 1.10 // Update this value
```

Or use live rates (future enhancement):
```typescript
const rate = await fetchLiveEURtoUSDRate()
```

## Usage

### Manual Testing

Test single country:
```bash
npm run test:holafly           # Tests US
npm run test:holafly -- GB     # Tests UK
```

Test all countries:
```bash
npm run test:holafly -- all
```

### API Endpoint

Trigger manual scraping:
```bash
curl -X POST http://localhost:3000/api/scrape \
  -H "Content-Type: application/json" \
  -d '{"provider": "Holafly", "country": "US"}'
```

### Cron Job

Holafly is automatically included in the daily cron jobs:

- **2 AM UTC**: Scrapes Group 1 countries (US, CA, GB, DE, FR, ES)
- **2 PM UTC**: Scrapes Group 2 countries (IT, JP, AU, NL, CH, SG)

Configuration in `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/scrape-all?group=1",
      "schedule": "0 2 * * *"
    },
    {
      "path": "/api/cron/scrape-all?group=2",
      "schedule": "0 14 * * *"
    }
  ]
}
```

## Data Flow

```
1. Cron triggers → /api/cron/scrape-all
2. Factory creates HolaflyPuppeteerScraper
3. Scraper navigates to Holafly country page
4. Attempts USD currency selection
5. Extracts plan data (price, data, validity)
6. Converts EUR/GBP to USD if needed
7. Deduplicates plans
8. Saves to database via BaseScraper.savePlans()
9. Updates scraping_logs table
10. Closes browser
```

## Currency Selection Logic

The scraper tries multiple strategies to select USD currency:

```typescript
// Attempts in order:
1. button[data-currency="USD"]
2. button[data-value="USD"]
3. select[name="currency"] option[value="USD"]
4. Buttons/links with "USD" text content
5. Elements with aria-label containing "USD"
```

If none found, falls back to EUR conversion.

## Error Handling

### Empty Results

If no plans found:
- Scraper returns empty array
- Database retains old data (NOT deleted)
- Logs warning in scraping_logs table
- UI shows "Last updated X days ago"

### Browser Crashes

Multiple recovery strategies:
1. Try different page wait strategies (domcontentloaded, networkidle2, load)
2. Extend timeout to 60 seconds
3. Retry navigation with relaxed conditions
4. If all fail, return empty array

### Unsupported Countries

If requested country not in the 12-country list:
- Logs warning
- Returns empty array
- Does not throw exception

## Database Schema

Uses existing `esim_plans` table with no schema changes:

| Field | Example | Notes |
|-------|---------|-------|
| `name` | "US Unlimited - 7 Days" | Auto-generated |
| `data_amount_gb` | 999 (unlimited) or actual GB | 999 = unlimited |
| `validity_days` | 7, 15, 30, etc. | Extracted from page |
| `price_usd` | 19.99 | Converted if needed |
| `currency` | "USD", "EUR", "GBP" | Original currency |
| `original_price` | 18.00 | Original price before conversion |
| `is_unlimited` | true/false | Detected from text |
| `network_type` | "4G/5G" | Default value |
| `coverage_type` | "National" | Default value |
| `hotspot_allowed` | true | Holafly supports hotspot |
| `voice_calls` | false | Data-only plans |
| `sms_included` | false | Data-only plans |
| `plan_url` | Full URL | Direct link to Holafly page |
| `last_scraped_at` | Timestamp | Auto-updated |

## Monitoring

### Check Scraping Status

```sql
-- View recent Holafly scraping logs
SELECT
  scrape_type,
  status,
  plans_found,
  plans_added,
  error_message,
  started_at,
  completed_at
FROM scraping_logs
WHERE provider_id = (SELECT id FROM providers WHERE name = 'Holafly')
ORDER BY started_at DESC
LIMIT 10;
```

### Check Data Freshness

```sql
-- Find stale Holafly data (> 48 hours old)
SELECT
  c.name as country,
  COUNT(*) as plan_count,
  MAX(e.last_scraped_at) as last_updated,
  NOW() - MAX(e.last_scraped_at) as staleness
FROM esim_plans e
JOIN countries c ON e.country_id = c.id
WHERE e.provider_id = (SELECT id FROM providers WHERE name = 'Holafly')
GROUP BY c.name
HAVING MAX(e.last_scraped_at) < NOW() - INTERVAL '48 hours'
ORDER BY last_updated ASC;
```

### Health Check Endpoint

```bash
curl http://localhost:3000/api/health/scrapers
```

## Troubleshooting

### No Plans Found

**Symptom:** Scraper returns 0 plans for all countries

**Possible Causes:**
1. Holafly website structure changed
2. Bot detection / CAPTCHA
3. Country page URL changed
4. Currency selector changed

**Solutions:**
1. Check browser logs in test script
2. Inspect Holafly website manually
3. Update CSS selectors in `extractPlans()` method
4. Update country slugs in `country-slugs.ts`

### Wrong Prices

**Symptom:** Prices seem incorrect or too low/high

**Possible Causes:**
1. Currency conversion rate outdated
2. Extracting wrong price element (sale badge, per-day price, etc.)
3. Currency detection failing

**Solutions:**
1. Update `EUR_TO_USD_RATE` in `currency-rates.ts`
2. Check price extraction regex in `extractPlans()`
3. Enable live rate fetching with `fetchLiveEURtoUSDRate()`

### Browser Timeout

**Symptom:** "Navigation timeout" errors

**Possible Causes:**
1. Holafly site is slow
2. Network issues
3. Page has infinite loading spinner

**Solutions:**
1. Increase timeout in `navigateToPage()` (currently 60s)
2. Try different wait strategies
3. Check if Holafly site is accessible manually

### Memory Leaks

**Symptom:** Cron job runs out of memory

**Possible Causes:**
1. Browser not closing properly
2. Too many pages open simultaneously

**Solutions:**
1. Verify `close()` is called in finally block
2. Check for zombie Chrome processes: `ps aux | grep chrome`
3. Reduce concurrent scraping (currently sequential, so unlikely)

## Deprecated Files

These files are no longer used but kept for reference:

- `lib/scrapers/holafly-scraper.ts` - Old HTML parser
- `lib/scrapers/real-data/holafly.ts` - Static plan generator
- `lib/scrapers/real-data/holafly-pricing.ts` - Hardcoded prices

**Do not import or use these files.** They have been marked with `@deprecated` JSDoc tags.

## Future Enhancements

### Phase 2 (Recommended)

1. **Live Currency Rates**: Use `fetchLiveEURtoUSDRate()` instead of hardcoded rate
2. **More Countries**: Add support beyond the current 12 countries
3. **Regional Plans**: Handle "Europe 33 countries" type plans
4. **Network Provider Extraction**: Capture which carriers Holafly uses (Vodafone, Orange, etc.)

### Phase 3 (Optional)

1. **Parallel Scraping**: Scrape multiple countries simultaneously for faster cron jobs
2. **Screenshot Capture**: Save screenshots of plan pages for debugging
3. **Price History**: Track price changes over time
4. **Alert System**: Email/Slack notifications for scraping failures
5. **Proxy Rotation**: Use proxy services to avoid rate limiting

### Phase 4 (Advanced)

1. **AI-Powered Extraction**: Use LLMs to extract plan data (more resilient to HTML changes)
2. **GraphQL API**: If Holafly exposes a GraphQL endpoint, use that instead of scraping
3. **Headless Chrome in Docker**: Run browser in containerized environment for better isolation

## Testing

### Unit Tests (Future)

Create `__tests__/scrapers/holafly-puppeteer-scraper.test.ts`:

```typescript
describe('HolaflyPuppeteerScraper', () => {
  it('should extract plans from page', async () => { ... })
  it('should convert EUR to USD', async () => { ... })
  it('should handle unsupported countries', async () => { ... })
  it('should select USD currency', async () => { ... })
})
```

### Integration Tests (Future)

Create `__tests__/e2e/holafly-integration.test.ts`:

```typescript
describe('Holafly Integration', () => {
  it('should scrape, save, and retrieve plans', async () => { ... })
  it('should appear in search results', async () => { ... })
  it('should work in comparison feature', async () => { ... })
})
```

## Support

For issues or questions:

1. Check scraping logs: `SELECT * FROM scraping_logs WHERE provider_id = (SELECT id FROM providers WHERE name = 'Holafly')`
2. Run manual test: `npm run test:holafly`
3. Check browser logs in test output
4. Inspect Holafly website manually to verify structure hasn't changed

## Changelog

### 2025-01-20 - Initial Implementation

- ✅ Created HolaflyPuppeteerScraper with currency selection
- ✅ Added 12-country support
- ✅ Implemented EUR/GBP to USD conversion
- ✅ Updated scraper factory to use new scraper
- ✅ Modified BaseScraper to retain stale data on empty results
- ✅ Added Holafly to cron job providers
- ✅ Deprecated old static pricing approach
- ✅ Created test script and documentation
