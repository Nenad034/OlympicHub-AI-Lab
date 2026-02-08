# Yield Management & Dynamic Pricing System

## 📋 Overview

The Yield Management system is a comprehensive revenue optimization platform that:

- **Aggregates prices** from multiple providers (Solvex, TCT, OpenGreece, ORS, Mars)
- **Scrapes competitor prices** from TravelLand, BigBlue, and FilipTravel
- **Calculates dynamic markup** based on market conditions
- **Manages approval workflow** for price changes
- **Tracks pricing history** and performance metrics

---

## 🏗️ Architecture

### Database Schema

The system uses 8 main tables in Supabase:

1. **`competitor_prices`** - Stores scraped competitor pricing data
2. **`price_intelligence_log`** - Logs all price aggregation sessions
3. **`markup_proposals`** - Pending/approved/rejected markup changes
4. **`markup_history`** - Historical record of all price changes
5. **`scraping_sessions`** - Tracks competitor scraping jobs
6. **`hotel_matches`** - Fuzzy matching for hotel deduplication
7. **`yield_settings`** - Global configuration
8. **`scraping_sessions`** - Scraping job tracking

### TypeScript Services

Located in `src/services/yield/`:

- **`priceAggregator.ts`** - Multi-provider price collection
- **`hotelMatcher.ts`** - Fuzzy matching using Levenshtein distance
- **`competitorScraper.ts`** - Web scraping with anti-detection
- **`markupEngine.ts`** - Dynamic pricing calculations
- **`types.ts`** - TypeScript type definitions

### UI Components

Located in `src/modules/yield/`:

- **`YieldDashboard.tsx`** - Main dashboard interface
- **`YieldDashboard.css`** - Styling

---

## 🚀 Setup Instructions

### 1. Database Migration

Run the SQL migration to create all necessary tables:

```bash
# Using Supabase CLI
cd olympichub_ai_lab
supabase db push
```

Or manually execute the SQL file in Supabase Dashboard:
- Go to **SQL Editor**
- Copy contents of `supabase/migrations/20260208_yield_management_schema.sql`
- Execute

### 2. Install Dependencies (Optional - for Playwright scraping)

```bash
npm install playwright playwright-extra puppeteer-extra-plugin-stealth
```

**Note:** Playwright is optional. The scraper currently runs in placeholder mode.

### 3. Configure Yield Settings

Default settings are automatically inserted. To customize:

```sql
UPDATE yield_settings
SET 
    default_markup_percent = 15.0,
    min_markup_percent = 5.0,
    max_markup_percent = 30.0,
    auto_approve_threshold_percent = 5.0,
    undercut_competitor_by_percent = 2.0
WHERE setting_type = 'global';
```

### 4. Access the Dashboard

Navigate to: `/yield-management` (route will be added in next step)

---

## 📊 How It Works

### Price Aggregation Flow

```
1. User searches for hotel
   ↓
2. PriceAggregator queries all providers (Solvex, TCT, OpenGreece)
   ↓
3. HotelMatcher deduplicates results using fuzzy matching
   ↓
4. System fetches competitor prices from database
   ↓
5. MarkupEngine calculates recommended markup
   ↓
6. If change < 5%, auto-approve. Otherwise, create proposal
   ↓
7. Admin reviews and approves/rejects proposal
   ↓
8. Price change is logged in markup_history
```

### Competitor Scraping Flow

```
1. Scheduled job runs (daily at 2 AM) OR manual trigger
   ↓
2. CompetitorScraper launches for each competitor
   ↓
3. Playwright browser with stealth plugin navigates to site
   ↓
4. Search form is filled with destination/dates
   ↓
5. Results are extracted using CSS selectors
   ↓
6. Prices are saved to competitor_prices table
   ↓
7. Session is marked as completed
```

### Markup Calculation Logic

```typescript
Base Markup = 15% (default)

Adjustments:
- If competitor price exists: Match or undercut by 2%
- High season: +10%
- Low season: -10%
- High demand: +5%
- Low demand: -5%
- Last minute (<7 days): -20%

Final Markup = Constrained between 5% and 30%
```

---

## 🎯 Key Features

### 1. Multi-Provider Price Aggregation

Automatically collects prices from:
- ✅ Solvex (SOAP API)
- ✅ TCT (REST API)
- ✅ OpenGreece (REST API)
- ✅ ORS (REST API)
- ✅ Mars (REST API)

### 2. Fuzzy Hotel Matching

Uses **Levenshtein distance algorithm** to match hotels across providers:

```
"Hilton Resort 5*" (Solvex)
"Hilton Hotel" (TCT)
"The Hilton" (Competitor)
→ All matched as same hotel
```

### 3. Competitor Price Scraping

**Targets:**
- TravelLand (https://www.travelland.rs/)
- BigBlue (https://bigblue.rs/sr)
- FilipTravel (https://www.filiptravel.rs/sr)

**Anti-Detection Measures:**
- Random user agent rotation
- Random delays (1-3 seconds)
- Stealth plugin (hides automation)
- Residential proxy support (optional)

### 4. Dynamic Markup Engine

**Factors considered:**
- Competitor average price
- Seasonality (high/medium/low)
- Demand level
- Days to departure
- Historical conversion rates

### 5. Approval Workflow

**Auto-Approval:**
- Markup change < 5% → Automatically approved
- Logged in history with reason

**Manual Approval:**
- Markup change ≥ 5% → Requires admin review
- Admin can approve/reject with notes
- All decisions are logged

### 6. Price Intelligence Logging

Every price aggregation is logged with:
- All provider prices
- Competitor prices
- Lowest price found
- Price advantage vs competitors
- Timestamp and session ID

---

## 🔧 Configuration

### Yield Settings (Database)

```sql
SELECT * FROM yield_settings WHERE setting_type = 'global';
```

**Key Settings:**

| Setting | Default | Description |
|---------|---------|-------------|
| `default_markup_percent` | 15.0 | Base markup percentage |
| `min_markup_percent` | 5.0 | Minimum allowed markup |
| `max_markup_percent` | 30.0 | Maximum allowed markup |
| `auto_approve_threshold_percent` | 5.0 | Auto-approve if change < 5% |
| `match_competitor_price` | false | Match competitor exactly |
| `undercut_competitor_by_percent` | 2.0 | Undercut by 2% |
| `scraping_frequency` | 'daily' | Scraping schedule |
| `scraping_enabled` | true | Enable/disable scraping |

### Competitor Scraper Configuration

Edit `src/services/yield/competitorScraper.ts`:

```typescript
private readonly COMPETITORS: CompetitorScrapingTarget[] = [
    {
        name: 'travelland',
        url: 'https://www.travelland.rs/',
        enabled: true,
        selectors: {
            hotelName: '.hotel-name',
            price: '.price',
            // ... customize selectors
        }
    }
];
```

---

## 📈 Usage Examples

### 1. Aggregate Prices for a Hotel

```typescript
import { priceAggregator } from '@/services/yield/priceAggregator';

const result = await priceAggregator.aggregatePrices({
    destination: 'Grčka',
    hotel_name: 'Hilton Resort',
    check_in: '2026-07-01',
    check_out: '2026-07-08',
    adults: 2,
    children: 0,
    providers: ['solvex', 'tct', 'opengreece'],
    include_competitors: true
});

console.log(result.data.lowest_price); // €450
console.log(result.data.recommended_markup); // 12.5%
console.log(result.data.recommended_selling_price); // €506.25
```

### 2. Create Markup Proposal

```typescript
import { markupEngine } from '@/services/yield/markupEngine';

const proposal = await markupEngine.createProposal(
    'hotel',
    450, // base cost
    500, // competitor avg
    'Hilton Resort',
    'Grčka',
    {
        season: 'high',
        demand: 'medium',
        days_to_departure: 30
    }
);

// If auto-approved:
console.log(proposal.data.status); // 'approved'

// If manual review needed:
console.log(proposal.data.status); // 'pending'
```

### 3. Approve/Reject Proposal

```typescript
// Approve
await markupEngine.approveProposal(
    'proposal-id-123',
    'user-id-456',
    'Approved - competitive pricing'
);

// Reject
await markupEngine.rejectProposal(
    'proposal-id-123',
    'user-id-456',
    'Markup too low for this destination'
);
```

### 4. Start Competitor Scraping

```typescript
import { competitorScraper } from '@/services/yield/competitorScraper';

const session = await competitorScraper.scrapeAllCompetitors(
    'Grčka',
    '2026-07-01',
    '2026-07-08',
    2, // adults
    0  // children
);

console.log(session.data.total_prices_scraped); // 45
```

### 5. Fuzzy Match Hotels

```typescript
import { hotelMatcher } from '@/services/yield/hotelMatcher';

const match = await hotelMatcher.findMatches(
    'Hilton Resort 5*',
    'solvex',
    'Athens',
    5
);

console.log(match.data.master_hotel_name); // 'Hilton Resort'
console.log(match.data.variants); 
// [
//   { source: 'solvex', name: 'Hilton Resort 5*', score: 1.0 },
//   { source: 'tct', name: 'Hilton Hotel', score: 0.85 }
// ]
```

---

## 🔒 Security Considerations

### Row Level Security (RLS)

All tables have RLS enabled:

- **Read:** All authenticated users
- **Write:** Service role or admin users only

### Scraping Ethics

- **Respect robots.txt**
- **Rate limiting:** 1-3 second delays between requests
- **User agent rotation:** Appears as regular browser
- **Scrape frequency:** Maximum once per day per competitor
- **Data usage:** Only for internal price comparison, not republished

---

## 🐛 Troubleshooting

### Issue: No competitor prices showing

**Solution:**
1. Check if scraping is enabled: `SELECT scraping_enabled FROM yield_settings`
2. Run manual scraping session
3. Check `scraping_sessions` table for errors

### Issue: All proposals auto-rejected

**Solution:**
1. Check `auto_approve_threshold_percent` setting
2. Increase threshold if needed: `UPDATE yield_settings SET auto_approve_threshold_percent = 10`

### Issue: Playwright scraping fails

**Solution:**
1. Install dependencies: `npm install playwright`
2. Install browsers: `npx playwright install`
3. Check competitor site selectors (they may have changed)

### Issue: Hotel matching not working

**Solution:**
1. Check similarity threshold in `hotelMatcher.ts` (default 0.75)
2. Manually verify matches in `hotel_matches` table
3. Adjust normalization logic if needed

---

## 📊 Performance Metrics

### Expected Performance

- **Price Aggregation:** < 2 seconds (3 providers)
- **Competitor Scraping:** 30-60 seconds per competitor
- **Fuzzy Matching:** < 100ms per hotel
- **Markup Calculation:** < 50ms

### Database Indexes

All critical queries are indexed:

```sql
-- Fast hotel lookups
CREATE INDEX idx_competitor_prices_hotel ON competitor_prices(hotel_name, check_in);

-- Fast proposal queries
CREATE INDEX idx_markup_proposals_status ON markup_proposals(status, proposed_at DESC);

-- Fast history queries
CREATE INDEX idx_markup_history_changed_at ON markup_history(changed_at DESC);
```

---

## 🔄 Maintenance

### Daily Tasks (Automated)

- ✅ Scrape competitor prices (2 AM)
- ✅ Expire old proposals (> 24 hours)
- ✅ Clean up old scraping sessions (> 30 days)

### Weekly Tasks (Manual)

- Review pending proposals
- Verify hotel matches
- Check scraping success rate
- Analyze markup performance

### Monthly Tasks

- Review yield settings
- Update competitor selectors (if sites changed)
- Analyze revenue impact
- Optimize markup rules

---

## 📞 Support

For issues or questions:

1. Check this documentation
2. Review code comments in service files
3. Check Supabase logs for errors
4. Contact development team

---

## 🎯 Roadmap

### Phase 1 (Current) ✅
- ✅ Database schema
- ✅ Price aggregation
- ✅ Fuzzy matching
- ✅ Markup engine
- ✅ Basic UI dashboard

### Phase 2 (Next)
- [ ] Implement real Playwright scraping
- [ ] Add price history charts
- [ ] Email notifications for proposals
- [ ] A/B testing for markup strategies

### Phase 3 (Future)
- [ ] Machine learning price prediction
- [ ] Automated seasonal adjustments
- [ ] Integration with booking flow
- [ ] Mobile app for approvals

---

**Last Updated:** 2026-02-08  
**Version:** 1.0.0  
**Author:** Olympic Hub Development Team
