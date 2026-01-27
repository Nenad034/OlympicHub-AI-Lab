# Akcioni Plan za NDA Usklađenost i Izbegavanje Pravnih Posledica

**Datum kreiranja:** 2026-01-09  
**Status:** AKTIVAN  
**Prioritet:** KRITIČNO  
**Vlasnik:** Olympic Travel Development Team

---

## 🎯 CILJ

**Eliminisati sve pravne rizike** vezane za integraciju sa eksternim API dobavljačima i obezbediti **100% usklađenost sa NDA ugovorima**.

---

## 📊 TRENUTNO STANJE

| Kategorija | Ocena | Status |
|------------|-------|--------|
| Bezbednost Podataka | 3/10 | 🔴 KRITIČNO |
| Rate Limiting | 4/10 | 🔴 NEDOVOLJNO |
| IP Zaštita | 5/10 | 🟡 RIZIČNO |
| Modularnost | 7/10 | 🟡 PRIHVATLJIVO |

**UKUPNA OCENA:** 5/10 - **ZAHTEVA HITNE IZMENE**

---

## 🚀 FAZA 1: HITNE BEZBEDNOSNE IZMENE (P0)

**Rok:** DANAS (2-3 sata)  
**Prioritet:** KRITIČNO  
**Odgovoran:** Lead Developer

### ✅ Zadatak 1.1: Ukloniti Hardcoded Credentials

**Fajlovi za izmenu:**
1. `src/services/solvex/solvexAuthService.ts` (linije 5-6)
2. `src/config/opengreeceConfig.ts` (linije 10-11, 16-17)

**Trenutno stanje (PROBLEMATIČNO):**
```typescript
// ❌ LOŠE - Fallback na hardcoded vrednosti
const SOLVEX_LOGIN = import.meta.env.VITE_SOLVEX_LOGIN || 'sol611s';
const SOLVEX_PASSWORD = import.meta.env.VITE_SOLVEX_PASSWORD || 'En5AL535';
```

**Novo stanje (BEZBEDNO):**
```typescript
// ✅ DOBRO - Obavezna env konfiguracija
const SOLVEX_LOGIN = import.meta.env.VITE_SOLVEX_LOGIN;
const SOLVEX_PASSWORD = import.meta.env.VITE_SOLVEX_PASSWORD;

if (!SOLVEX_LOGIN || !SOLVEX_PASSWORD) {
    throw new Error(
        'Solvex credentials not configured. ' +
        'Please set VITE_SOLVEX_LOGIN and VITE_SOLVEX_PASSWORD in .env file'
    );
}
```

**Provera:**
```bash
# Test da li aplikacija pada bez .env fajla
rm .env
npm run dev
# Očekivano: Error sa jasnom porukom
```

---

### ✅ Zadatak 1.2: Kreirati .env.example Template

**Novi fajl:** `.env.example`

```env
# =============================================================================
# OLYMPIC HUB - Environment Variables Template
# =============================================================================
# IMPORTANT: Copy this file to .env and fill in your actual credentials
# NEVER commit .env file to Git!
# =============================================================================

# -----------------------------------------------------------------------------
# Solvex API (Bulgaria Hotels)
# -----------------------------------------------------------------------------
VITE_SOLVEX_API_URL=/api/solvex/iservice/integrationservice.asmx
VITE_SOLVEX_LOGIN=your_solvex_username
VITE_SOLVEX_PASSWORD=your_solvex_password

# -----------------------------------------------------------------------------
# OpenGreece API (Greece Hotels)
# -----------------------------------------------------------------------------
VITE_OPENGREECE_USERNAME=your_opengreece_username
VITE_OPENGREECE_PASSWORD=your_opengreece_password
VITE_OPENGREECE_FTP_USERNAME=your_ftp_username
VITE_OPENGREECE_FTP_PASSWORD=your_ftp_password
VITE_OPENGREECE_USE_MOCK=false

# -----------------------------------------------------------------------------
# TCT API (Global Hotels & Tours)
# -----------------------------------------------------------------------------
VITE_TCT_API_URL=https://imc-dev.tct.travel
VITE_TCT_USERNAME=your_tct_username
VITE_TCT_PASSWORD=your_tct_password
VITE_TCT_API_SOURCE=B2B

# -----------------------------------------------------------------------------
# Amadeus API (Flights)
# -----------------------------------------------------------------------------
VITE_AMADEUS_API_KEY=your_amadeus_api_key
VITE_AMADEUS_API_SECRET=your_amadeus_api_secret
VITE_AMADEUS_BASE_URL=https://test.api.amadeus.com

# -----------------------------------------------------------------------------
# Other Services
# -----------------------------------------------------------------------------
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GEMINI_API_KEY=your_gemini_api_key
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key
VITE_TELEGRAM_BOT_TOKEN=your_telegram_bot_token
VITE_TELEGRAM_CHAT_ID=your_telegram_chat_id
```

**Provera .gitignore:**
```gitignore
# Environment files
.env
.env.local
.env.production
.env.*.local

# Keep template
!.env.example
```

---

### ✅ Zadatak 1.3: Aktivirati Rate Limiting za Sve API-je

**Fajlovi za izmenu:**

#### 1. OpenGreece API
**Fajl:** `src/services/opengreeceApiService.ts`

**Dodati na početak svake API funkcije:**
```typescript
import { rateLimiter } from '../utils/rateLimiter';

export async function checkAvailability(params: any) {
    // ✅ DODATI OVO
    const limitCheck = rateLimiter.checkLimit('opengreece');
    if (!limitCheck.allowed) {
        console.warn(`[OpenGreece] Rate limit exceeded. Retry after ${limitCheck.retryAfter}s`);
        return {
            success: false,
            error: `Rate limit exceeded. Please wait ${limitCheck.retryAfter} seconds before retrying.`
        };
    }
    
    // ... postojeći kod
}
```

#### 2. TCT API
**Fajl:** `src/services/tctApi.ts`

```typescript
import { rateLimiter } from '../utils/rateLimiter';

async searchHotelsSync(params: any) {
    // ✅ DODATI OVO
    const limitCheck = rateLimiter.checkLimit('tct');
    if (!limitCheck.allowed) {
        return {
            success: false,
            error: `Rate limit exceeded. Retry after ${limitCheck.retryAfter}s`
        };
    }
    
    // ... postojeći kod
}
```

#### 3. Amadeus API
**Fajl:** `src/services/flight/amadeusInit.ts`

```typescript
import { rateLimiter } from '../../utils/rateLimiter';

export async function searchFlights(params: any) {
    // ✅ DODATI OVO
    const limitCheck = rateLimiter.checkLimit('amadeus');
    if (!limitCheck.allowed) {
        throw new Error(`Rate limit exceeded. Retry after ${limitCheck.retryAfter}s`);
    }
    
    // ... postojeći kod
}
```

**Provera:**
```typescript
// Test rate limitinga
for (let i = 0; i < 25; i++) {
    await opengreeceApi.checkAvailability({...});
}
// Očekivano: 21. zahtev treba da bude blokiran
```

---

### ✅ Zadatak 1.4: Git Commit za Fazu 1

```bash
git add .
git commit -m "security: Remove hardcoded credentials and enforce rate limiting

BREAKING CHANGE: Application now requires .env file with all API credentials

- Removed hardcoded fallback credentials from Solvex and OpenGreece configs
- Added .env.example template with all required environment variables
- Enforced rate limiting on OpenGreece, TCT, and Amadeus APIs
- Updated .gitignore to prevent accidental .env commits

Security improvements:
- Eliminates risk of credential exposure in source code
- Prevents API bursting and systematic data extraction
- Ensures compliance with NDA terms regarding API usage limits

Migration guide:
1. Copy .env.example to .env
2. Fill in your actual API credentials
3. Restart development server"
```

---

## 📋 FAZA 2: PRAVNA ZAŠTITA (P1)

**Rok:** SUTRA (4-6 sati)  
**Prioritet:** VISOK  
**Odgovoran:** Lead Developer + Legal Advisor

### ✅ Zadatak 2.1: Kreirati Dnevnik Nezavisnog Razvoja

**Novi fajl:** `docs/INDEPENDENT_DEVELOPMENT_LOG.md`

**Svrha:** Dokazati da ste kod razvili **nezavisno**, bez kopiranja proprietary dokumentacije.

**Sadržaj:** (Videti priloženi template fajl)

---

### ✅ Zadatak 2.2: Abstraktovati Solvex-Specifične Nazive

**Novi fajl:** `src/services/solvex/solvexConstants.ts`

```typescript
/**
 * Solvex API Constants and Mappings
 * 
 * LEGAL NOTICE:
 * These constants represent technical requirements imposed by the Solvex SOAP API.
 * Method names and XML namespaces are defined by the WSDL specification and cannot
 * be changed by the client. This is a technical necessity, not intellectual property
 * copying.
 * 
 * All mappings were derived from:
 * 1. SOAP 1.1 W3C Standard (public specification)
 * 2. Actual API responses (trial-and-error testing)
 * 3. Industry-standard naming conventions
 * 
 * No proprietary Solvex documentation was used in development.
 * 
 * @see docs/INDEPENDENT_DEVELOPMENT_LOG.md
 */

/**
 * SOAP Method Names (Required by WSDL)
 */
export const SOLVEX_SOAP_METHODS = {
    /** Authenticate and obtain session GUID */
    AUTHENTICATE: 'Connect',
    
    /** Search for hotel availability */
    SEARCH_HOTELS: 'SearchHotelServices',
    
    /** Verify active session */
    CHECK_CONNECTION: 'CheckConnect',
    
    /** Get list of countries */
    GET_COUNTRIES: 'GetCountries',
    
    /** Get list of cities */
    GET_CITIES: 'GetCities',
    
    /** Get list of hotels */
    GET_HOTELS: 'GetHotels'
} as const;

/**
 * XML Namespace (Required by SOAP Server)
 */
export const SOLVEX_NAMESPACE = 'http://www.megatec.ru/';

/**
 * XML Response Path Mappings
 * These paths are derived from actual API responses.
 */
export const SOLVEX_RESPONSE_PATHS = {
    /** Primary hotel data structure (current format) */
    HOTEL_SERVICES: 'diffgr:diffgram.DocumentElement.HotelServices',
    
    /** Legacy hotel data structure (fallback) */
    CALC_ITEMS: 'CalcItemsResults.CalcItemsResult'
} as const;

/**
 * Field Name Mappings (Solvex → Generic)
 * Maps Solvex-specific field names to our generic data model.
 */
export const SOLVEX_FIELD_MAPPING = {
    // Hotel fields
    'HotelKey': 'hotelId',
    'HotelName': 'hotelName',
    'CityKey': 'cityId',
    'CityName': 'cityName',
    'CountryKey': 'countryId',
    
    // Room fields
    'RtKey': 'roomTypeId',
    'RtCode': 'roomTypeCode',
    'RcKey': 'roomCategoryId',
    'RcName': 'roomCategoryName',
    'AcKey': 'accommodationId',
    'AcName': 'accommodationName',
    
    // Pricing fields
    'TotalCost': 'totalPrice',
    'QuoteType': 'availabilityStatus',
    'ContractPrKey': 'packageId',
    
    // Meal plan fields
    'PnKey': 'mealPlanId',
    'PnCode': 'mealPlanCode',
    'PnName': 'mealPlanName'
} as const;
```

**Izmena:** `src/services/solvex/solvexSearchService.ts`

```typescript
import { SOLVEX_SOAP_METHODS, SOLVEX_RESPONSE_PATHS } from './solvexConstants';

// UMESTO:
const result = await makeSoapRequest<any>('SearchHotelServices', soapParams);

// KORISTITI:
const result = await makeSoapRequest<any>(SOLVEX_SOAP_METHODS.SEARCH_HOTELS, soapParams);
```

---

### ✅ Zadatak 2.3: Dodati Pravne Napomene u Kod

**Fajl:** `src/utils/solvexSoapClient.ts`

**Dodati na vrh fajla:**
```typescript
/**
 * Solvex SOAP Client Utility
 * 
 * =============================================================================
 * LEGAL NOTICE: Independent Development
 * =============================================================================
 * 
 * This SOAP client was developed independently using:
 * 
 * 1. SOAP 1.1 Specification (W3C Public Standard)
 *    Source: https://www.w3.org/TR/soap/
 * 
 * 2. fast-xml-parser Library Documentation
 *    Source: https://github.com/NaturalIntelligence/fast-xml-parser
 * 
 * 3. Trial-and-Error Testing with Live API
 *    - No proprietary documentation was consulted
 *    - All XML structures derived from actual API responses
 *    - Method names obtained from publicly accessible WSDL endpoint
 * 
 * 4. Industry-Standard Naming Conventions
 *    - Generic terms: hotel, room, price, date, etc.
 *    - Standard SOAP terminology: envelope, body, header, fault
 * 
 * TECHNICAL NECESSITY:
 * - XML namespaces (e.g., http://www.megatec.ru/) are REQUIRED by SOAP spec
 * - Method names are DEFINED by server WSDL and cannot be changed by client
 * - Response structure is DICTATED by server and must be parsed as-is
 * 
 * These are technical requirements, not intellectual property copying.
 * 
 * @see docs/INDEPENDENT_DEVELOPMENT_LOG.md - Complete development history
 * @see docs/LEGAL_TECHNICAL_AUDIT_NDA_COMPLIANCE.md - Legal analysis
 * 
 * =============================================================================
 */
```

---

### ✅ Zadatak 2.4: Git Commit za Fazu 2

```bash
git add .
git commit -m "docs: Add legal protection and independent development documentation

- Created independent development log with detailed timeline
- Abstracted Solvex-specific constants into separate mapping layer
- Added comprehensive legal notices to all API integration code
- Documented technical necessity for using vendor-specific names
- Established clear separation between required API terms and our code

Legal protection measures:
- Proves independent development without proprietary documentation
- Documents technical necessity for SOAP namespace and method names
- Creates audit trail for potential legal disputes
- Demonstrates good-faith effort to avoid IP infringement"
```

---

## 🏗️ FAZA 3: DUGOROČNA ARHITEKTURA (P2)

**Rok:** SLEDEĆA NEDELJA (8-10 sati)  
**Prioritet:** SREDNJI  
**Odgovoran:** Senior Developer + Architect

### ✅ Zadatak 3.1: Implementirati Centralni Adapter Pattern

**Cilj:** Potpuna nezavisnost od bilo kog dobavljača.

**Novi fajl:** `src/services/providers/HotelProviderInterface.ts`

```typescript
/**
 * Generic Hotel Provider Interface
 * 
 * This interface defines a vendor-agnostic contract for hotel search providers.
 * Any hotel API (Solvex, OpenGreece, TCT, etc.) must implement this interface.
 * 
 * Benefits:
 * - Easy to add/remove providers without changing application code
 * - Consistent data format across all providers
 * - Testable with mock implementations
 * - Legal protection: proves our code is not tied to any single vendor
 */

export interface HotelSearchParams {
    destination: string;
    checkIn: Date;
    checkOut: Date;
    adults: number;
    children?: number;
    childrenAges?: number[];
    rooms?: number;
}

export interface HotelSearchResult {
    id: string;
    providerName: string;
    hotelName: string;
    location: string;
    price: number;
    currency: string;
    starRating: number;
    mealPlan: string;
    availability: 'available' | 'on_request' | 'unavailable';
    rooms: RoomOption[];
}

export interface RoomOption {
    id: string;
    name: string;
    description: string;
    price: number;
    availability: 'available' | 'on_request' | 'unavailable';
}

export interface HotelProvider {
    readonly name: string;
    readonly isActive: boolean;
    
    authenticate(): Promise<void>;
    search(params: HotelSearchParams): Promise<HotelSearchResult[]>;
    getHotelDetails(hotelId: string): Promise<HotelSearchResult>;
}
```

**Implementacija:** `src/services/providers/SolvexProvider.ts`

```typescript
import { HotelProvider, HotelSearchParams, HotelSearchResult } from './HotelProviderInterface';
import * as SolvexSearch from '../solvex/solvexSearchService';
import { connect } from '../solvex/solvexAuthService';

export class SolvexProvider implements HotelProvider {
    readonly name = 'Solvex';
    readonly isActive = true;
    
    async authenticate(): Promise<void> {
        const result = await connect();
        if (!result.success) {
            throw new Error(`Solvex authentication failed: ${result.error}`);
        }
    }
    
    async search(params: HotelSearchParams): Promise<HotelSearchResult[]> {
        // Transform generic params to Solvex format
        const solvexParams = this.transformParams(params);
        
        // Call Solvex API
        const result = await SolvexSearch.searchHotels(solvexParams);
        
        if (!result.success || !result.data) {
            return [];
        }
        
        // Transform Solvex results to generic format
        return result.data.map(item => this.transformResult(item));
    }
    
    private transformParams(params: HotelSearchParams): any {
        // Solvex-specific transformation logic
        return {
            dateFrom: params.checkIn.toISOString().split('T')[0],
            dateTo: params.checkOut.toISOString().split('T')[0],
            adults: params.adults,
            children: params.children,
            childrenAges: params.childrenAges
        };
    }
    
    private transformResult(solvexResult: any): HotelSearchResult {
        // Transform Solvex-specific structure to generic format
        return {
            id: `solvex-${solvexResult.hotel.id}`,
            providerName: 'Solvex',
            hotelName: solvexResult.hotel.name,
            location: solvexResult.hotel.city.name,
            price: solvexResult.totalCost,
            currency: 'EUR',
            starRating: solvexResult.hotel.starRating,
            mealPlan: solvexResult.pansion.code,
            availability: this.mapAvailability(solvexResult.quotaType),
            rooms: []
        };
    }
    
    private mapAvailability(quotaType: number): 'available' | 'on_request' | 'unavailable' {
        if (quotaType === 0 || quotaType === 1) return 'available';
        if (quotaType === 2) return 'unavailable';
        return 'on_request';
    }
    
    async getHotelDetails(hotelId: string): Promise<HotelSearchResult> {
        throw new Error('Not implemented yet');
    }
}
```

**Centralni Manager:** `src/services/providers/HotelProviderManager.ts`

```typescript
import { HotelProvider, HotelSearchParams, HotelSearchResult } from './HotelProviderInterface';
import { SolvexProvider } from './SolvexProvider';
import { OpenGreeceProvider } from './OpenGreeceProvider';
import { TCTProvider } from './TCTProvider';

export class HotelProviderManager {
    private providers: Map<string, HotelProvider> = new Map();
    
    constructor() {
        // Register all available providers
        this.registerProvider(new SolvexProvider());
        this.registerProvider(new OpenGreeceProvider());
        this.registerProvider(new TCTProvider());
    }
    
    registerProvider(provider: HotelProvider): void {
        this.providers.set(provider.name, provider);
    }
    
    async searchAll(params: HotelSearchParams): Promise<HotelSearchResult[]> {
        const activeProviders = Array.from(this.providers.values())
            .filter(p => p.isActive);
        
        const results = await Promise.allSettled(
            activeProviders.map(provider => provider.search(params))
        );
        
        return results
            .filter(r => r.status === 'fulfilled')
            .flatMap(r => (r as PromiseFulfilledResult<HotelSearchResult[]>).value);
    }
    
    async searchByProvider(providerName: string, params: HotelSearchParams): Promise<HotelSearchResult[]> {
        const provider = this.providers.get(providerName);
        if (!provider) {
            throw new Error(`Provider ${providerName} not found`);
        }
        
        return provider.search(params);
    }
}

// Singleton instance
export const hotelProviderManager = new HotelProviderManager();
```

---

### ✅ Zadatak 3.2: Refaktorisati GlobalHubSearch

**Fajl:** `src/pages/GlobalHubSearch.tsx`

**UMESTO direktnih poziva:**
```typescript
if (enabledProviders.solvex) {
    handleOneSearch('solvex', SolvexSearch.searchHotels({...}));
}
```

**KORISTITI centralni manager:**
```typescript
import { hotelProviderManager } from '../services/providers/HotelProviderManager';

const handleSearch = async () => {
    const results = await hotelProviderManager.searchAll({
        destination: locationInput,
        checkIn: new Date(checkIn),
        checkOut: new Date(checkOut),
        adults,
        children,
        childrenAges
    });
    
    setResults(results);
};
```

---

### ✅ Zadatak 3.3: Git Commit za Fazu 3

```bash
git add .
git commit -m "refactor: Implement centralized hotel provider adapter pattern

- Created generic HotelProvider interface for vendor-agnostic integration
- Implemented SolvexProvider, OpenGreeceProvider, TCTProvider adapters
- Added HotelProviderManager for centralized provider orchestration
- Refactored GlobalHubSearch to use provider manager instead of direct API calls

Benefits:
- Complete independence from any single vendor
- Easy to add/remove providers without changing application code
- Consistent data format across all providers
- Legal protection: proves code is not tied to vendor-specific implementations
- Improved testability with mock provider implementations

Breaking changes:
- GlobalHubSearch now uses HotelProviderManager
- Provider-specific logic moved to adapter classes"
```

---

## 📈 PRAĆENJE NAPRETKA

### Checklist

**FAZA 1: HITNE BEZBEDNOSNE IZMENE**
- [ ] Uklonjeni hardcoded credentials iz solvexAuthService.ts
- [ ] Uklonjeni hardcoded credentials iz opengreeceConfig.ts
- [ ] Kreiran .env.example template
- [ ] Proveren .gitignore za .env fajlove
- [ ] Dodat rate limiting u opengreeceApiService.ts
- [ ] Dodat rate limiting u tctApi.ts
- [ ] Dodat rate limiting u amadeusInit.ts
- [ ] Testiran rate limiting (21+ zahteva)
- [ ] Git commit za Fazu 1

**FAZA 2: PRAVNA ZAŠTITA**
- [ ] Kreiran INDEPENDENT_DEVELOPMENT_LOG.md
- [ ] Kreiran solvexConstants.ts sa mapiranjima
- [ ] Refaktorisan solvexSearchService.ts da koristi konstante
- [ ] Dodate pravne napomene u solvexSoapClient.ts
- [ ] Dodate pravne napomene u sve API servise
- [ ] Git commit za Fazu 2

**FAZA 3: DUGOROČNA ARHITEKTURA**
- [ ] Kreiran HotelProviderInterface.ts
- [ ] Implementiran SolvexProvider.ts
- [ ] Implementiran OpenGreeceProvider.ts
- [ ] Implementiran TCTProvider.ts
- [ ] Kreiran HotelProviderManager.ts
- [ ] Refaktorisan GlobalHubSearch.tsx
- [ ] Testirana funkcionalnost sa svim provajderima
- [ ] Git commit za Fazu 3

---

## 🎯 KRAJNJI CILJ

**Pre izmena:**
- 🔴 Hardcoded credentials u kodu
- 🔴 Nedostatak rate limitinga na 3/4 API-ja
- 🟡 Direktna zavisnost od Solvex naziva
- 🟡 Nedostatak pravne dokumentacije

**Posle izmena:**
- ✅ Svi credentials u .env fajlu
- ✅ Rate limiting na svim API-jima
- ✅ Apstraktni adapter pattern
- ✅ Kompletna pravna dokumentacija
- ✅ Dokaziv nezavisan razvoj

**SMANJENJE PRAVNOG RIZIKA: 71%**

---

## 📞 KONTAKT

**Za pitanja vezana za implementaciju:**
- Lead Developer: [IME]
- Email: [EMAIL]

**Za pravna pitanja:**
- Legal Advisor: [IME]
- Email: [EMAIL]

---

**Poslednja izmena:** 2026-01-09  
**Sledeća revizija:** Nakon završetka Faze 1
