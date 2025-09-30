# Production Strategy for eSIM Data Management

## 📋 Overview

This document outlines the complete strategy for managing eSIM plan data from scraping to serving users.

## 🔄 Data Flow

```
1. Scheduled Scraper → 2. Supabase Database → 3. User Search → 4. Cached Results
```

## 1. Data Collection (Scraping)

### Scheduled Scraping

**Frequency Recommendations:**
- **Daily**: Popular countries (US, CA, GB, DE, FR, ES, IT, JP, AU)
- **Weekly**: All other countries
- **Time**: 2 AM UTC (off-peak hours)

### Implementation Options

#### Option A: Vercel Cron Jobs ⭐ Recommended

**Setup:**
1. Add `vercel.json` with cron configuration (already created!)
2. Set `CRON_SECRET` environment variable in Vercel dashboard
3. Deploy - Vercel automatically runs the cron job

```json
{
  "crons": [{
    "path": "/api/cron/scrape-all",
    "schedule": "0 2 * * *"  // Daily at 2 AM UTC
  }]
}
```

**Pros:**
- Built into Vercel
- No external dependencies
- Automatic execution
- Free tier available

**Cons:**
- Requires Vercel Pro for multiple crons
- 10-minute execution limit per function

#### Option B: GitHub Actions

**Setup:**
Create `.github/workflows/scrape-data.yml`:

```yaml
name: Scrape eSIM Data
on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM UTC
  workflow_dispatch:  # Allow manual trigger

jobs:
  scrape:
    runs-on: ubuntu-latest
    steps:
      - name: Call scraping endpoint
        run: |
          curl -X POST https://your-domain.com/api/cron/scrape-all \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

**Pros:**
- Free for all users
- Easy to set up
- Can trigger manually
- Good for debugging

**Cons:**
- Requires GitHub repository
- External dependency

#### Option C: External Cron Services

Services like:
- cron-job.org (free)
- EasyCron
- Render Cron Jobs
- Railway Cron Jobs

**Setup:**
- Add URL: `https://your-domain.com/api/cron/scrape-all`
- Add header: `Authorization: Bearer YOUR_CRON_SECRET`
- Set schedule: `0 2 * * *`

## 2. Data Storage (Supabase)

### Database Schema

Your existing schema already supports this:

```sql
esim_plans (
  id,
  provider_id,
  country_id,
  name,
  data_amount_gb,
  validity_days,
  price_usd,
  currency,
  original_price,
  is_unlimited,
  network_type,
  last_scraped_at,  -- ✅ Tracks freshness
  created_at,
  updated_at
)
```

### Data Freshness Strategy

1. **Scraper automatically updates** `last_scraped_at` timestamp
2. **Old data cleanup** - Remove plans not updated in 30+ days:

```sql
-- Run this periodically (monthly)
DELETE FROM esim_plans 
WHERE last_scraped_at < NOW() - INTERVAL '30 days';
```

3. **Data freshness indicator** - Show users when data was last updated

### Indexing for Performance

Already in place:
```sql
-- Fast searches by country
CREATE INDEX idx_esim_plans_country ON esim_plans(country_id);

-- Fast searches by provider
CREATE INDEX idx_esim_plans_provider ON esim_plans(provider_id);

-- Fast sorting by price
CREATE INDEX idx_esim_plans_price ON esim_plans(price_usd);
```

## 3. User Search (Frontend)

### Search Flow

**User searches for "Canada" →**

1. **Query Supabase** (cached data)
   ```typescript
   const { data: plans } = await supabase
     .from('esim_plans')
     .select(`
       *,
       provider:providers(name, logo_url),
       country:countries(name, code)
     `)
     .eq('country_id', canadaId)
     .eq('is_active', true)
     .order('price_usd', { ascending: true })
   ```

2. **Return results instantly** (no waiting for scraping!)

3. **Display data freshness**
   ```typescript
   const lastUpdated = new Date(plan.last_scraped_at)
   const daysAgo = Math.floor((Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60 * 24))
   // Show: "Updated 2 days ago"
   ```

### API Endpoint for Search

```typescript
// app/api/plans/search/route.ts
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const country = searchParams.get('country')
  const provider = searchParams.get('provider')
  const minData = searchParams.get('minData')
  const maxPrice = searchParams.get('maxPrice')

  const supabase = await createClient()
  let query = supabase
    .from('esim_plans')
    .select('*, provider:providers(*), country:countries(*)')
    .eq('is_active', true)

  if (country) query = query.eq('country_id', country)
  if (provider) query = query.eq('provider_id', provider)
  if (minData) query = query.gte('data_amount_gb', minData)
  if (maxPrice) query = query.lte('price_usd', maxPrice)

  const { data, error } = await query.order('price_usd')

  if (error) return NextResponse.json({ error }, { status: 500 })
  return NextResponse.json({ plans: data })
}
```

## 4. Caching Strategy

### Level 1: Database (Primary Cache) ✅

- Data stored in Supabase
- Updated daily/weekly via cron
- Fast queries via indexes
- **Already implemented!**

### Level 2: Edge Caching (Optional)

Add HTTP cache headers:

```typescript
export async function GET() {
  const data = await getPlans()
  
  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400'
      // Cache for 1 hour, serve stale for 24 hours while revalidating
    }
  })
}
```

### Level 3: Client-Side Caching (Optional)

Use React Query or SWR:

```typescript
// Using SWR
const { data, error } = useSWR('/api/plans/search?country=CA', fetcher, {
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  dedupingInterval: 3600000, // 1 hour
})
```

## 5. Error Handling & Monitoring

### Scraping Errors

The cron job handles errors gracefully:
- Continues with next country if one fails
- Logs all errors
- Returns summary of successes/failures

### Monitoring

**Add to your dashboard:**

```sql
-- Check last scraping time per provider/country
SELECT 
  p.name as provider,
  c.name as country,
  MAX(e.last_scraped_at) as last_updated,
  COUNT(*) as plan_count
FROM esim_plans e
JOIN providers p ON e.provider_id = p.id
JOIN countries c ON e.country_id = c.id
GROUP BY p.name, c.name
ORDER BY last_updated DESC;
```

**Alert if data is stale:**

```sql
-- Find countries with data older than 3 days
SELECT 
  c.name,
  MAX(e.last_scraped_at) as last_updated
FROM esim_plans e
JOIN countries c ON e.country_id = c.id
GROUP BY c.name
HAVING MAX(e.last_scraped_at) < NOW() - INTERVAL '3 days';
```

## 6. Deployment Checklist

### Environment Variables

Add to Vercel/your hosting:

```bash
# Database
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Cron Security
CRON_SECRET=generate-a-strong-random-secret

# Optional: Monitoring
SENTRY_DSN=your-sentry-dsn  # For error tracking
```

### Steps

1. ✅ **Push code to GitHub**
   ```bash
   git add .
   git commit -m "Add production scraping strategy"
   git push origin main
   ```

2. ✅ **Deploy to Vercel**
   - Connect GitHub repository
   - Add environment variables
   - Deploy

3. ✅ **Set up Cron Secret**
   - Generate: `openssl rand -base64 32`
   - Add to Vercel environment variables
   - Redeploy

4. ✅ **Test Cron Job**
   ```bash
   curl -X POST https://your-domain.vercel.app/api/cron/scrape-all \
     -H "Authorization: Bearer YOUR_CRON_SECRET"
   ```

5. ✅ **Verify Data in Supabase**
   - Check `esim_plans` table
   - Verify `last_scraped_at` timestamps
   - Test search functionality

## 7. Cost Optimization

### Scraping Costs

**Vercel:**
- Free tier: 100 GB-hours/month
- Each scraping job: ~5-10 minutes
- ~5 hours/month for daily scraping
- **Cost: Free** (well within limits)

**Alternative (if hitting limits):**
- GitHub Actions: Free unlimited for public repos
- Railway: Free tier available
- Self-hosted: Minimal cost

### Database Costs

**Supabase:**
- Free tier: 500 MB database, 2 GB bandwidth
- Estimated usage: ~50-100 MB for thousands of plans
- **Cost: Free** initially
- Paid plans start at $25/month if needed

### Optimization Tips

1. **Scrape selectively**: Only popular countries daily, others weekly
2. **Cleanup old data**: Remove plans not updated in 30+ days
3. **Batch operations**: Group database writes
4. **Use indexes**: Already implemented for fast queries

## 8. Sample Cron Schedules

```javascript
// Daily at 2 AM UTC
"0 2 * * *"

// Every 6 hours
"0 */6 * * *"

// Monday, Wednesday, Friday at 3 AM
"0 3 * * 1,3,5"

// First day of each month at 1 AM
"0 1 1 * *"

// Every Sunday at midnight
"0 0 * * 0"
```

## 9. User Experience

### Display Fresh Data

```typescript
const DataFreshness = ({ lastScraped }: { lastScraped: string }) => {
  const date = new Date(lastScraped)
  const hoursAgo = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60))
  
  return (
    <div className="text-sm text-gray-500">
      {hoursAgo < 24 ? (
        <span className="text-green-600">✓ Updated {hoursAgo}h ago</span>
      ) : (
        <span>Updated {Math.floor(hoursAgo / 24)} days ago</span>
      )}
    </div>
  )
}
```

### Show Provider Status

```typescript
// Indicate if data is being refreshed
const isRefreshing = await checkIfScrapingInProgress()

{isRefreshing && (
  <Banner>
    🔄 We're currently updating prices. Results shown are from our last update.
  </Banner>
)}
```

## 10. Future Enhancements

### Short-term
- [ ] Add email notifications for scraping failures
- [ ] Create admin dashboard to view scraping status
- [ ] Add more providers (Holafly, etc.)
- [ ] Implement price history tracking

### Long-term
- [ ] Price change alerts for users
- [ ] Predictive pricing (ML-based)
- [ ] Real-time price comparison
- [ ] API for third-party access

## Summary

✅ **Current State:**
- Scrapers working for Airalo and Saily
- Data saves to Supabase automatically
- Ready for production deployment

✅ **Next Steps:**
1. Add CRON_SECRET to environment variables
2. Deploy to Vercel
3. Test cron job manually
4. Verify data updates in Supabase
5. Build search UI that queries database

✅ **Data Flow:**
```
Cron (Daily 2 AM) 
  → Scrape Airalo & Saily
  → Save to Supabase
  → Users query database
  → Instant results!
```

---

**Questions?** Check the other documentation files or test the endpoints manually!
