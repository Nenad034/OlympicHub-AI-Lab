# Solvex API Content Retrieval Guide

## Problem Description
Standard Solvex (MasterTour) API endpoints for searching and listing hotels (`GetHotels`, `SearchHotelServices`) do not return rich media content such as hotel images or full descriptions. This results in "empty" or "mock" data being displayed in the application UI.

## Discovery & Investigation
Through systematic diagnostic probing of the Solvex SOAP API (`IntegrationService.asmx`), we explored several potential methods:
1. **FAILED**: `GetHotelImages`, `GetHotelDescription`, `GetHotelInfo` - These methods are either not exposed or require a different service endpoint not documented in the main WSDL.
2. **FAILED**: `SearchHotelServices` - While it returns price and availability, the `AdditionalParams` field is often empty for media content.
3. **SUCCESS**: `GetRoomDescriptions` - Despite the name implying "Room" data, this method returns a comprehensive XML structure including:
   - Full Hotel Descriptions.
   - High-quality Image URLs (Exterior, Interior, Rooms).
   - Hotel Category and Rating details.

## Technical Solution

### 1. API Implementation
The core function for fetching rich content is implemented in `src/services/solvex/solvexDictionaryService.ts`:

```typescript
export async function getHotelFullContent(hotelId: number) {
    // Calls SOAP method: GetRoomDescriptions
    // Params: { guid: TOKEN, hotelKey: hotelId }
}
```

### 2. Robust Parsing
The response from `GetRoomDescriptions` is a large XML (often >800KB). The parser handles:
- Extraction of `<Path>` or `<URL>` tags from the JSON-converted object.
- Fallback regex matching for image URLs (JPG/PNG) in case of non-standard XML nesting.
- Filtering out technical URLs (schemas, megatec.ru) to ensure only guest-facing images are captured.

### 3. Debugging Tools
A new debug flag `VITE_SOLVEX_DEBUG` was added to `src/utils/solvexSoapClient.ts`.
- Set `VITE_SOLVEX_DEBUG=true` in `.env` to see full XML payloads.
- Keep it `false` in production to prevent console flooding.

## How to Sync Content
To enrich the local database with Solvex content, use the provided utility script:

```bash
npx tsx scripts/solvex_enrich_hotels.ts
```

This script:
1. Fetches all properties from Supabase where ID starts with `solvex_`.
2. Iterates through them and calls the Solvex API.
3. Updates the `properties` table with `images` and `content` (descriptions).

## Future Recommendations
- **Caching**: `GetRoomDescriptions` is a heavy call. Content should be periodically synced to the database rather than fetched on every page load.
- **Proxying**: Ensure Solvex image URLs are accessed through the application's image proxy if CORS issues occur on the frontend.
- **Batching**: The sync script includes a 300-500ms delay between calls to respect API rate limits. Do not remove this delay.
