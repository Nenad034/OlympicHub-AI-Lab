# New API Integration Checklist

> **Based on lessons learned from Solvex integration**  
> Use this checklist for every new API partner (Hotelbeds, Travco, Jumbo Tours, etc.)

---

## Phase 1: Pre-Integration Research (Before Writing Code)

### 1.1 API Documentation Review
- [ ] Obtain official API documentation (WSDL, OpenAPI, REST docs)
- [ ] Identify authentication method (API Key, OAuth, GUID session, etc.)
- [ ] Note base URL and endpoints
- [ ] Check rate limits and quotas
- [ ] Review error codes and handling

### 1.2 Request Sample Data
- [ ] Request **raw XML/JSON samples** from API provider
- [ ] Get samples for different scenarios:
  - [ ] Successful search with results
  - [ ] Empty results
  - [ ] Error responses
  - [ ] Different hotel categories (2*, 3*, 4*, 5*)
  - [ ] Different meal plans (RO, BB, HB, FB, AI)

### 1.3 Data Structure Analysis
Create a mapping document with actual field names:

| Data Point | API Field Name | Example Value | Notes |
|------------|---------------|---------------|-------|
| Hotel Name | `HotelName` / `Name` | "Hotel Admiral" | Check if includes stars |
| Star Rating | `Stars` / `Description` / `Category` | "5" or "5*  (Location)" | **Critical: Where is it?** |
| Price | `TotalCost` / `Price` / `Amount` | 2026.50 | Check currency field |
| Currency | `Currency` / `CurrencyCode` | "EUR" | ISO code or full name? |
| Meal Plan | `MealPlan` / `BoardType` / `Pansion` | "HB" or "Half Board" | Code or full name? |
| Check-in | `DateFrom` / `CheckIn` / `ArrivalDate` | "2026-08-01" | Date format? |
| Check-out | `DateTo` / `CheckOut` / `DepartureDate` | "2026-08-11" | Date format? |
| Room Type | `RoomType` / `RoomName` | "Double Standard" | Full description? |
| Availability | `QuotaType` / `Status` / `Available` | 0/1 or "available" | How is it encoded? |

**⚠️ Solvex Lesson**: Star ratings were in `Description`, not `Stars` field!

---

## Phase 2: Project Structure Setup

### 2.1 Create Service Files
```
src/services/[partner-name]/
├── [partner]SearchService.ts    # Main search logic
├── [partner]BookingService.ts   # Booking/reservation logic
├── types.ts                      # TypeScript interfaces
└── README.md                     # API-specific notes
```

### 2.2 Create Provider Adapter
```
src/services/providers/
└── [Partner]Provider.ts          # Implements HotelProviderInterface
```

### 2.3 Create SOAP/REST Client (if needed)
```
src/utils/
└── [partner]Client.ts            # HTTP client with auth
```

---

## Phase 3: Implementation

### 3.1 Define TypeScript Interfaces
```typescript
// src/services/[partner]/types.ts

// Raw API response (exactly as API returns it)
export interface [Partner]RawHotel {
    HotelName: string;           // Use EXACT field names from API
    Stars?: string;              // Mark optional fields
    Description?: string;        // Document where star rating actually is
    TotalCost: number;
    // ... all other fields
}

// Normalized internal format
export interface [Partner]HotelSearchResult {
    hotel: {
        id: number;
        name: string;
        starRating: number;      // Extracted and normalized
        city: {
            id: number;
            name: string;
        };
    };
    totalCost: number;
    // ... normalized structure
}
```

**⚠️ Solvex Lesson**: Use consistent property names (`stars`, not `starRating`)

### 3.2 Implement Data Extraction
```typescript
// Extract star rating with fallbacks
let starRating = 0;

// Try primary field
const rawStars = apiResponse.Stars || apiResponse.StarRating;
if (rawStars) {
    starRating = parseInt(String(rawStars));
}

// Fallback: Try description field (like Solvex)
if (starRating === 0 && apiResponse.Description) {
    const match = apiResponse.Description.match(/(\d)\s*\*+/);
    if (match) starRating = parseInt(match[1]);
}

// Fallback: Try hotel name
if (starRating === 0) {
    const match = apiResponse.HotelName.match(/(\d)\s*\*+/);
    if (match) starRating = parseInt(match[1]);
}

// ⚠️ DON'T default to 4 if missing - use 0 to indicate unknown
```

**⚠️ Solvex Lesson**: Check multiple possible locations, use regex as fallback

### 3.3 Handle Pagination
```typescript
// Check API documentation for max page size
const searchParams = {
    PageSize: 500,        // ⚠️ Solvex Lesson: Don't use 100, use max allowed
    PageIndex: 0,
    // ... other params
};

// If API returns TotalCount, log it for monitoring
console.log(`[${Partner}] Total available: ${response.TotalCount}, Fetched: ${results.length}`);
```

**⚠️ Solvex Lesson**: 100 results missed all 5-star hotels!

### 3.4 Avoid Data Duplication
```typescript
// Check if hotel name already contains stars before appending
let hotelName = apiResponse.HotelName;

// DON'T do this if stars are already in the name:
// hotelName = `${hotelName} ${starRating}*`;  // ❌ Creates "Hotel 5* 5*"

// Instead, clean and conditionally append:
let cleanName = hotelName.replace(/\s*\d+\s*\*+/g, '').trim();
if (starRating > 0 && !apiResponse.HotelName.includes('*')) {
    hotelName = `${cleanName} ${starRating}*`;
} else {
    hotelName = cleanName;
}
```

**⚠️ Solvex Lesson**: SearchHotelServices already had stars in names

### 3.5 Implement Provider Adapter
```typescript
// src/services/providers/[Partner]Provider.ts
import { HotelProvider, HotelSearchParams, HotelSearchResult } from './HotelProviderInterface';

export class [Partner]Provider implements HotelProvider {
    name = '[Partner]';

    async search(params: HotelSearchParams): Promise<HotelSearchResult[]> {
        // 1. Call partner API
        const rawResults = await [partner]SearchService.search(params);

        // 2. Transform to HotelSearchResult format
        return rawResults.map(raw => ({
            id: `[partner]-${raw.hotel.id}`,
            providerName: '[Partner]',
            hotelName: raw.hotel.name,
            location: `${raw.hotel.city.name}, ${raw.hotel.country.name}`,
            stars: raw.hotel.starRating,  // ⚠️ Use 'stars', not 'starRating'
            price: raw.totalCost,
            currency: raw.currency || 'EUR',
            mealPlan: this.normalizeMealPlan(raw.mealPlan),
            availability: this.mapAvailability(raw.availability),
            rooms: raw.rooms || [],
            image: raw.hotel.image || DEFAULT_IMAGE,
            originalData: raw
        }));
    }

    private normalizeMealPlan(raw: string): string {
        // Map partner-specific codes to standard codes
        const mapping: Record<string, string> = {
            'RO': 'RO',
            'BB': 'BB',
            'HB': 'HB',
            'FB': 'FB',
            'AI': 'AI',
            // Partner-specific mappings
            'BedAndBreakfast': 'BB',
            'HalfBoard': 'HB',
            // ... add all variations
        };
        return mapping[raw] || raw;
    }
}
```

---

## Phase 4: Testing

### 4.1 Unit Tests
- [ ] Test star rating extraction with various formats
- [ ] Test meal plan normalization
- [ ] Test date formatting
- [ ] Test pagination with different page sizes
- [ ] Test error handling

### 4.2 Integration Tests
- [ ] Search for known hotel and verify data
- [ ] Filter by 5-star and verify results appear
- [ ] Test with different date ranges
- [ ] Test with different passenger counts
- [ ] Verify Excel export includes all data

### 4.3 Edge Cases
- [ ] Hotels with 0 stars (unrated)
- [ ] Hotels with missing data (no image, no description)
- [ ] Special characters in hotel names (é, ñ, ü, etc.)
- [ ] Very long hotel names
- [ ] Duplicate hotels with different meal plans

---

## Phase 5: Documentation

### 5.1 Create API-Specific README
```markdown
# [Partner] API Integration

## Authentication
- Method: [API Key / OAuth / GUID Session]
- Credentials: `VITE_[PARTNER]_API_KEY`, `VITE_[PARTNER]_SECRET`

## Key Endpoints
- Search: `POST /api/search`
- Booking: `POST /api/booking`

## Data Quirks
- **Star Ratings**: Located in `[FieldName]` field
- **Hotel Names**: [Include/Don't include] star ratings
- **Pagination**: Max `PageSize` is [number]
- **Date Format**: `YYYY-MM-DD` or `DD/MM/YYYY`

## Known Issues
- [Any specific bugs or limitations]

## Example Request
\`\`\`json
{
  "destination": "Golden Sands",
  "checkIn": "2026-08-01",
  "checkOut": "2026-08-11",
  "adults": 2
}
\`\`\`

## Example Response
\`\`\`json
{
  "hotels": [
    {
      "name": "Hotel Admiral",
      "stars": "5",
      "price": 2026.50
    }
  ]
}
\`\`\`
```

### 5.2 Update Main Documentation
Add entry to `docs/04-troubleshooting/API_INTEGRATION_LESSONS.md`:

```markdown
### [Partner] API
- **Star Ratings Location**: [Field name]
- **Hotel Name Format**: [With/without stars]
- **Pagination**: [Max page size]
- **Date Format**: [Format string]
- **Authentication**: [Method]
- **Special Considerations**: [Any quirks]
```

---

## Phase 6: Deployment Checklist

### 6.1 Environment Variables
- [ ] Add to `.env.example`:
  ```
  VITE_[PARTNER]_API_URL=
  VITE_[PARTNER]_API_KEY=
  VITE_[PARTNER]_SECRET=
  ```
- [ ] Add to production `.env`
- [ ] Document in `README.md`

### 6.2 Error Monitoring
- [ ] Add error logging for API failures
- [ ] Set up alerts for high error rates
- [ ] Monitor response times

### 6.3 User-Facing
- [ ] Add provider toggle in UI
- [ ] Add provider logo/icon
- [ ] Test filtering by provider
- [ ] Verify booking flow works end-to-end

---

## Common Pitfalls (Learned from Solvex)

### ❌ DON'T
1. Assume field names without checking raw responses
2. Default missing star ratings to 4 (use 0 instead)
3. Use `PageSize: 100` without checking if it's enough
4. Append data that's already in the response
5. Mix property names (`starRating` vs `stars`)
6. Skip testing with real API data

### ✅ DO
1. Request and inspect raw API responses first
2. Use consistent property names across all layers
3. Set `PageSize` to maximum allowed by API
4. Check if data exists before transforming/appending
5. Create TypeScript interfaces for type safety
6. Test with edge cases (missing data, special chars)
7. Document API quirks in README
8. Remove debug logs after testing

---

## Quick Reference: Solvex Lessons Applied

| Issue | Solvex Problem | Solution for New APIs |
|-------|----------------|----------------------|
| Star Ratings | In `Description`, not `Stars` | Check raw response, try multiple fields |
| Pagination | Only 100 results | Use max `PageSize` (500 for Solvex) |
| Name Duplication | Stars appended twice | Check if already in name before adding |
| Property Names | Mixed `starRating`/`stars` | Use `stars` consistently everywhere |
| Default Values | Defaulted to 4 stars | Use 0 for unknown, don't mask missing data |

---

## Template Files

### Provider Template
See: `src/services/providers/SolvexProvider.ts` as reference

### Search Service Template
See: `src/services/solvex/solvexSearchService.ts` as reference

### SOAP Client Template
See: `src/utils/solvexSoapClient.ts` as reference

---

**Last Updated**: 2026-01-18  
**Based on**: Solvex API Integration (First API partner)
