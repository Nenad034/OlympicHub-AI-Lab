# Flight API Integration Pattern: Kyte (GoKyte)

This document describes the standardized process used to integrate the Kyte Flight API into the Olympic Hub platform. This pattern should be followed for future API integrations.

## Phase 1: Discovery & Documentation
1.  **Analyze API Documentation**: Read the official documentation to understand the authentication, base URLs, and core endpoints.
2.  **Create Documentation Folder**: Create a dedicated folder in `docs/02-api-integration/` (e.g., `/kyte`).
3.  **Perform Feasibility Analysis**: Document authentication methods, key endpoints (Search, Order, Ancillaries), and potential risks (TTL, Sandbox limitations).

## Phase 2: Core Implementation (The "Service" Layer)
This layer handles direct HTTP communication.
1.  **Define Types**: Create `[provider]Types.ts` to define raw request and response shapes.
2.  **Implement API Service**: Create `[provider]ApiService.ts` as a singleton class.
    *   Initialize with config (apiKey, baseUrl).
    *   Implement methods for search and booking.
    *   Handle provider-specific error formats.

## Phase 3: Normalization (The "Mapper" Layer)
This layer translates provider-specific data into the **Unified Flight Model (UFM)**.
1.  **Implement Mapper**: Create `[provider]Mapper.ts`.
    *   Translate Raw Offers to `UnifiedFlightOffer`.
    *   Handle date/time formatting and duration parsing.
    *   Extract airline names and airport details.

## Phase 4: Adaption (The "Provider" Layer)
This layer implements our generic interface.
1.  **Implement Provider Adapter**: Create `[ProviderName]Provider.ts` implementing `FlightProvider`.
2.  **Registration**: Register the new provider in `FlightProviderManager.ts`.

## Phase 5: Verification & UI Integration
1.  **Create Test Page**: Implement a dedicated test page (e.g., `KyteTest.tsx`) to verify the connection in the real environment.
2.  **UI Switch**: Update the main search/booking services to route requests to the new provider manager instead of mocks.

---

### Lessons Learned from Kyte Integration
*   **Offer ID vs. Booking Token**: Kyte uses the same `off_...` ID for search and booking, so `bookingToken` in UFM maps to `offerId`.
*   **Passenger Mapping**: Kyte expects `type: 'adult' | 'child'`, so we map our internal types during the order creation request.
*   **Error Handling**: Kyte returns JSON errors; always check `response.ok` and parse the body for meaningful error messages.
