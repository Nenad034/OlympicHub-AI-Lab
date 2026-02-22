# Solvex API Integration: Lessons Learned & Troubleshooting

This document serves as a persistent record of critical technical requirements and "gotchas" discovered during the Solvex API integration.

## 1. Environment & Proxy Dynamics
**Problem**: The Vercel proxy (`api/solvex.ts`) was initially hardcoded to production, causing 400 errors when using evaluation credentials.
**Solution**: 
- Always use environment variables (`VITE_SOLVEX_API_URL`) to determine the target host dynamically.
- Ensure the serverless proxy extracts the target hostname from the configured API URL rather than using hardcoded strings.

## 2. SOAP Parameter Sequencing (CRITICAL)
**Problem**: Search requests returned "Internal Server Error (500)" with the message *"An item with the same key has already been added"* even when XML was syntactically correct.
**Solution**:
- Solvex (and many legacy SOAP servers) requires elements inside `<s:sequence>` to appear in the **exact order** defined in the WSDL.
- **Reference Order for `SearchHotelServices`**:
  1. `PageSize`
  2. `RowIndexFrom`
  3. `DateFrom`
  4. `DateTo`
  5. `RegionKeys`
  6. `CityKeys`
  7. `HotelKeys`
  8. `RoomDescriptionsKeys`
  9. `PansionKeys`
  10. `Ages`
  11. `Pax` (Must be before Tariffs)
  12. `Tariffs`
  13. `CacheGuid`
  14. `ResultView`
  15. `Mode`
  16. `QuotaTypes`

## 3. Mandatory Parameters
- **Tariffs**: The evaluation environment returns **0 results** if the `Tariffs` element is missing or empty. Always include defaults like `<int>0</int><int>1993</int>`.
- **ResultView**: Use `1` for grouping by hotels with daily prices.

## 4. Credentials (Evaluation)
- **URL**: `https://evaluation.solvex.bg/iservice/integrationservice.asmx`
- **Login**: `sol611s`
- **Password**: `En5AL535`

## 5. Verification Tools
Use `solvex_verify.cjs` and `reproduce_solvex_500.cjs` to test raw SOAP communication outside of the main application logic to isolate networking/proxy issues from application state.
