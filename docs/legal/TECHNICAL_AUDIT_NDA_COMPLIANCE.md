# Pravna i Tehnička Revizija Koda prema NDA Ugovoru

**Datum kreiranja:** 2026-01-09  
**Verzija:** 1.0  
**Status:** DRAFT - Za internu reviziju  
**Klasifikacija:** POVERLJIVO

---

## 📋 IZVRŠNI REZIME

Ovaj dokument predstavlja detaljnu pravnu i tehničku reviziju koda za integraciju sa eksternim dobavljačima API servisa, sa fokusom na usklađenost sa NDA (Non-Disclosure Agreement) ugovorima i zaštitu intelektualne svojine.

**Analizirani dobavljači:**
- ✅ **Solvex** (Bulgaria - Hotelski servisi)
- ✅ **OpenGreece** (Grčka - Hotelski servisi)
- ✅ **TCT** (Globalni - Hotelski i turoperatorski servisi)
- ✅ **Amadeus** (Globalni - Letovi i putovanja)

---

## 1️⃣ IDENTIFIKACIJA SPECIFIČNIH PODATAKA (Intelektualna Svojina)

### 1.1 SOLVEX API - Analiza Intelektualne Svojine

#### 🔴 KRITIČNI NALAZI - Direktno Preuzeti Elementi

**Fajl:** `src/utils/solvexSoapClient.ts`

| Linija | Element | Tip | Rizik | Izvor |
|--------|---------|-----|-------|-------|
| 38 | `xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"` | XML Namespace | ⚠️ NIZAK | SOAP Standard (javni) |
| 43 | `xmlns="http://www.megatec.ru/"` | XML Namespace | 🔴 **VISOK** | **Solvex proprietary** |
| 174 | `SOAPAction: http://www.megatec.ru/${method}` | HTTP Header | 🔴 **VISOK** | **Solvex proprietary** |

**Fajl:** `src/services/solvex/solvexSearchService.ts`

| Linija | Element | Tip | Rizik | Opis |
|--------|---------|-----|-------|------|
| 38 | `SearchHotelServices` | Method Name | 🔴 **VISOK** | Direktan naziv iz Solvex WSDL |
| 54 | `diffgr:diffgram` | XML Tag | 🟡 SREDNJI | Microsoft DiffGram format |
| 54 | `DocumentElement` | XML Tag | 🟡 SREDNJI | Microsoft ADO.NET format |
| 55 | `HotelServices` | XML Tag | 🔴 **VISOK** | Solvex-specifičan naziv |

**Fajl:** `src/types/solvex.types.ts`

| Linija | Interface/Property | Rizik | Obrazloženje |
|--------|-------------------|-------|--------------|
| 20-36 | `SolvexHotel` | 🟡 SREDNJI | Generička struktura, ali nazivi polja mogu biti problematični |
| 67-80 | `SolvexHotelSearchResult` | 🔴 **VISOK** | Direktno mapiranje Solvex response strukture |
| 88 | `isMain: boolean` | 🟡 SREDNJI | Moguće Solvex-specifično polje |
| 129 | `externalId: number` | 🟡 SREDNJI | Naziv identičan Solvex dokumentaciji |

#### 🟢 PRIHVATLJIVI ELEMENTI (Generički)

```typescript
// Ovi elementi su generički i ne predstavljaju IP rizik:
- hotel.id, hotel.name, hotel.city
- price, currency, totalCost
- dateFrom, dateTo, adults, children
- starRating, roomType, roomCategory
```

---

### 1.2 OPENGREECE API - Analiza Intelektualne Svojine

**Fajl:** `src/config/opengreeceConfig.ts`

| Linija | Element | Rizik | Opis |
|--------|---------|-------|------|
| 10-11 | Hardcoded credentials | 🔴 **KRITIČNO** | Username/Password u kodu |
| 16-17 | FTP credentials | 🔴 **KRITIČNO** | FTP pristupni podaci |

**Bezbednosna Preporuka:** Ovi podaci MORAJU biti uklonjeni iz koda i prebačeni u `.env` fajl.

---

### 1.3 TCT API - Analiza Intelektualne Svojine

**Fajl:** `src/services/tctApiService.ts`

| Linija | Element | Rizik | Opis |
|--------|---------|-------|------|
| 10 | `baseUrl: 'https://imc-dev.tct.travel'` | 🟡 SREDNJI | Javno dostupan endpoint |
| 11-12 | `username`, `password` | ✅ NIZAK | Pravilno koriste env vars |

---

## 2️⃣ ANALIZA MODULARNOSTI (Adapter Pattern)

### 2.1 Ocena Isprepletanosti Koda

#### ✅ POZITIVNI NALAZI

**Dobra Modularnost:**
```
src/services/
├── solvex/
│   ├── solvexAuthService.ts      ← Izolovana autentifikacija
│   ├── solvexSearchService.ts    ← Izolovana pretraga
│   └── solvexDictionaryService.ts ← Izolovani rečnici
├── opengreeceApiService.ts        ← Samostalni servis
└── tctApi.ts                      ← Samostalni servis
```

**Adapter Pattern Implementacija:**
- ✅ Svaki dobavljač ima **sopstveni servis fajl**
- ✅ Postoji **zajednički interface** (`CombinedResult` u `GlobalHubSearch.tsx`)
- ✅ **Centralizovana transformacija** podataka u `GlobalHubSearch.tsx` (linije 422-518)

#### 🔴 PROBLEMATIČNI NALAZI

**Fajl:** `src/pages/GlobalHubSearch.tsx`

```typescript
// Linija 577-581: Direktna zavisnost od Solvex-specifičnih ID-jeva
if (enabledProviders.solvex) {
    let solvexCityId: number | undefined;
    let solvexHotelId: number | undefined;
    // ... Solvex-specifična logika
}
```

**Rizik:** Ako obrišete Solvex kod, morate ručno ukloniti ove linije, što povećava šansu za greške.

---

### 2.2 Test Brisanja Dobavljača

**Scenario:** Brisanje Solvex integracije

**Fajlovi za brisanje:**
```
✅ BEZBEDNO ZA BRISANJE:
- src/services/solvex/ (ceo folder)
- src/types/solvex.types.ts
- src/utils/solvexSoapClient.ts
- src/pages/SolvexTest*.tsx

⚠️ ZAHTEVA IZMENE:
- src/pages/GlobalHubSearch.tsx (linije 14, 152-156, 557-582)
- src/router/index.tsx (Solvex route)
- src/pages/APIConnectionsHub.tsx (Solvex card)
```

**Ocena Modularnosti:** 7/10
- ✅ Većina koda je izolovana
- ⚠️ Potrebno je ručno ukloniti reference u `GlobalHubSearch.tsx`
- ✅ Aplikacija će nastaviti da radi bez Solvex-a

---

## 3️⃣ PROVERA MEHANIZAMA ZAŠTITE (Rate Limiting/Bursting)

### 3.1 Rate Limiter Implementacija

**Fajl:** `src/utils/rateLimiter.ts`

#### ✅ POZITIVNI NALAZI

```typescript
// Linija 111-127: Registrovani limiti
rateLimiter.registerLimit({
    identifier: 'solvex',
    maxRequests: 10,        // 10 zahteva po minuti
    windowMs: 60 * 1000     // 1 minut
});

rateLimiter.registerLimit({
    identifier: 'opengreece',
    maxRequests: 20,        // 20 zahteva po minuti
    windowMs: 60 * 1000
});

rateLimiter.registerLimit({
    identifier: 'tct',
    maxRequests: 30,        // 30 zahteva po minuti
    windowMs: 60 * 1000
});
```

**Ocena:** ✅ **ODLIČNO** - Implementiran sliding window rate limiter

---

### 3.2 Primena Rate Limitera

**Fajl:** `src/services/solvex/solvexSearchService.ts`

```typescript
// Linija 17-25: Rate limit provera PRE slanja zahteva
const limitCheck = rateLimiter.checkLimit('solvex');
if (!limitCheck.allowed) {
    console.warn(`Rate limit exceeded. Retry after ${limitCheck.retryAfter}s`);
    return {
        success: false,
        error: `Rate limit exceeded. Please wait ${limitCheck.retryAfter} seconds...`
    };
}
```

**Ocena:** ✅ **ODLIČNO** - Zaštita je aktivna i funkcionalna

---

### 3.3 Analiza Rizika od "Bursting"

| Dobavljač | Rate Limit | Zaštita | Status | Rizik |
|-----------|-----------|---------|--------|-------|
| Solvex | 10 req/min | ✅ Aktivna | `solvexSearchService.ts:17` | ✅ NIZAK |
| OpenGreece | 20 req/min | ⚠️ **NIJE PRIMENJENA** | Nedostaje u `opengreeceApiService.ts` | 🔴 VISOK |
| TCT | 30 req/min | ⚠️ **NIJE PRIMENJENA** | Nedostaje u `tctApi.ts` | 🔴 VISOK |
| Amadeus | 60 req/min | ⚠️ **NIJE PRIMENJENA** | Nedostaje u `amadeusInit.ts` | 🔴 VISOK |

#### 🔴 KRITIČNI PROBLEM

**OpenGreece, TCT i Amadeus NEMAJU aktivnu rate limit zaštitu!**

**Rizik:** Moguće je napraviti skriptu koja će izvršiti 1000+ zahteva u minuti, što je **direktna povreda NDA ugovora** i može rezultovati:
- Blokiranjem API pristupa
- Pravnim posledicama
- Finansijskim kaznama

---

## 4️⃣ BEZBEDNOST POVERLJIVIH PODATAKA

### 4.1 Hardcoded Credentials - KRITIČNI NALAZI

#### 🔴 SOLVEX - Hardcoded Credentials

**Fajl:** `src/services/solvex/solvexAuthService.ts`

```typescript
// Linija 5-6: HARDCODED CREDENTIALS
const SOLVEX_LOGIN = import.meta.env.VITE_SOLVEX_LOGIN || 'sol611s';
const SOLVEX_PASSWORD = import.meta.env.VITE_SOLVEX_PASSWORD || 'En5AL535';
```

**Rizik:** 🔴 **KRITIČNO**
- Lozinka je vidljiva u source kodu
- Ako `.env` fajl ne postoji, koristi se hardcoded vrednost
- Ako kod procuri na GitHub, lozinka je javno dostupna

**Preporuka:**
```typescript
// ISPRAVNO:
const SOLVEX_LOGIN = import.meta.env.VITE_SOLVEX_LOGIN;
const SOLVEX_PASSWORD = import.meta.env.VITE_SOLVEX_PASSWORD;

if (!SOLVEX_LOGIN || !SOLVEX_PASSWORD) {
    throw new Error('Solvex credentials not configured in .env');
}
```

---

#### 🔴 OPENGREECE - Hardcoded Credentials

**Fajl:** `src/config/opengreeceConfig.ts`

```typescript
// Linija 10-11: HARDCODED CREDENTIALS
USERNAME: import.meta.env.VITE_OPENGREECE_USERNAME || 'olympictravel',
PASSWORD: import.meta.env.VITE_OPENGREECE_PASSWORD || 'olympic2025!',

// Linija 16-17: HARDCODED FTP CREDENTIALS
FTP_USERNAME: import.meta.env.VITE_OPENGREECE_FTP_USERNAME || 'olympictravel',
FTP_PASSWORD: import.meta.env.VITE_OPENGREECE_FTP_PASSWORD || '0Fu7GD0znftX',
```

**Rizik:** 🔴 **KRITIČNO**
- FTP lozinka je izuzetno osetljiva
- Direktan pristup serverima partnera

---

### 4.2 API Endpoints - Analiza

| Dobavljač | Endpoint | Lokacija | Rizik |
|-----------|----------|----------|-------|
| Solvex | `/api/solvex/iservice/integrationservice.asmx` | `solvexSoapClient.ts:4` | ✅ Relativni path (proxy) |
| TCT | `https://imc-dev.tct.travel` | `tctApiService.ts:10` | 🟡 Javno dostupan |
| Amadeus | `https://test.api.amadeus.com` | `amadeusInit.ts:17` | ✅ Javni test endpoint |

---

### 4.3 .env Fajl - Provera

**Potreban `.env` fajl:**
```env
# Solvex
VITE_SOLVEX_API_URL=/api/solvex/iservice/integrationservice.asmx
VITE_SOLVEX_LOGIN=sol611s
VITE_SOLVEX_PASSWORD=En5AL535

# OpenGreece
VITE_OPENGREECE_USERNAME=olympictravel
VITE_OPENGREECE_PASSWORD=olympic2025!
VITE_OPENGREECE_FTP_USERNAME=olympictravel
VITE_OPENGREECE_FTP_PASSWORD=0Fu7GD0znftX

# TCT
VITE_TCT_API_URL=https://imc-dev.tct.travel
VITE_TCT_USERNAME=your_username
VITE_TCT_PASSWORD=your_password

# Amadeus
VITE_AMADEUS_API_KEY=your_key
VITE_AMADEUS_API_SECRET=your_secret
```

**Status:** ⚠️ Fajl verovatno postoji lokalno, ali MORA biti u `.gitignore`

---

## 5️⃣ NAZIVI VARIJABLI - Analiza Intelektualne Svojine

### 5.1 Problematični Nazivi (Identični Dokumentaciji)

#### SOLVEX

| Varijabla | Fajl | Linija | Rizik | Obrazloženje |
|-----------|------|--------|-------|--------------|
| `SearchHotelServices` | `solvexSearchService.ts` | 38 | 🔴 **VISOK** | Direktan naziv SOAP metode iz WSDL |
| `HotelServices` | `solvexSearchService.ts` | 55 | 🔴 **VISOK** | Naziv XML elementa iz Solvex response-a |
| `diffgr:diffgram` | `solvexSearchService.ts` | 54 | 🟡 SREDNJI | Microsoft format, ali korišćen u Solvex kontekstu |
| `DocumentElement` | `solvexSearchService.ts` | 55 | 🟡 SREDNJI | Microsoft ADO.NET, ali Solvex-specifičan |
| `CalcItemsResult` | `solvexSearchService.ts` | 61 | 🔴 **VISOK** | Solvex-specifičan naziv |
| `QuoteType` | `solvexSearchService.ts` | 137 | 🟡 SREDNJI | Moguće generički, ali identičan Solvex polju |
| `ContractPrKey` | `solvexSearchService.ts` | 135 | 🔴 **VISOK** | Solvex-specifičan ID ključ |

#### OPENGREECE

| Varijabla | Fajl | Rizik | Obrazloženje |
|-----------|------|-------|--------------|
| `hotelResults` | `opengreeceApiService.ts` | 🟡 SREDNJI | Generički naziv |
| `hotelCode` | `opengreeceApiService.ts` | 🟡 SREDNJI | Generički naziv |

---

### 5.2 Preporuke za Refaktorisanje

**Trenutno (Problematično):**
```typescript
// Direktno korišćenje Solvex naziva
const result = await makeSoapRequest<any>('SearchHotelServices', soapParams);
const hotelServices = dr.ResultTable['diffgr:diffgram'].DocumentElement.HotelServices;
```

**Preporučeno (Abstraktno):**
```typescript
// Generički nazivi sa mapiranjem
const SOLVEX_METHOD_SEARCH = 'SearchHotelServices'; // Konstanta
const result = await makeSoapRequest<any>(SOLVEX_METHOD_SEARCH, soapParams);

// Mapiranje sa komentarom
const hotelServices = extractHotelData(dr); // Helper funkcija koja skriva Solvex strukturu

function extractHotelData(dataResult: any) {
    // Internal mapping from Solvex-specific structure
    return dataResult.ResultTable?.['diffgr:diffgram']?.DocumentElement?.HotelServices;
}
```

---

## 6️⃣ PRAVNA PROCENA RIZIKA

### 6.1 Kategorije Rizika

| Kategorija | Rizik | Obrazloženje | Prioritet |
|------------|-------|--------------|-----------|
| **Hardcoded Credentials** | 🔴 **KRITIČNO** | Direktna povreda bezbednosnih standarda | P0 |
| **Nedostatak Rate Limitinga** | 🔴 **VISOK** | Moguća povreda NDA (bursting) | P0 |
| **Solvex-specifični XML tagovi** | 🔴 **VISOK** | Direktno kopiranje IP strukture | P1 |
| **Solvex-specifični nazivi metoda** | 🔴 **VISOK** | Identični WSDL dokumentaciji | P1 |
| **Solvex namespace** | 🔴 **VISOK** | `http://www.megatec.ru/` je proprietary | P1 |
| **Modularnost** | 🟡 SREDNJI | Moguće ukloniti, ali zahteva izmene | P2 |
| **Generički nazivi polja** | 🟢 NIZAK | `hotel`, `price`, `date` su prihvatljivi | P3 |

---

### 6.2 Scenario: Pravni Spor

**Pitanje:** Da li možete dokazati nezavisan razvoj?

**Trenutni Odgovor:** ⚠️ **DELIMIČNO**

**Dokazi ZA nezavisan razvoj:**
- ✅ Vlastita TypeScript type definicija (`solvex.types.ts`)
- ✅ Vlastiti adapter pattern (`GlobalHubSearch.tsx`)
- ✅ Vlastiti rate limiter (`rateLimiter.ts`)
- ✅ Vlastiti error handling i logging

**Dokazi PROTIV nezavisnog razvoja:**
- 🔴 Direktno korišćenje `http://www.megatec.ru/` namespace
- 🔴 Identični nazivi metoda (`SearchHotelServices`)
- 🔴 Identični nazivi XML tagova (`HotelServices`, `CalcItemsResult`)
- 🔴 Identična struktura response-a (`diffgr:diffgram.DocumentElement`)

**Zaključak:** U pravnom sporu, partner bi mogao argumentovati da ste **direktno kopirali njihovu API strukturu**, što može biti osnov za tužbu za povredu intelektualne svojine.

---

## 7️⃣ PREPORUKE ZA USKLAĐIVANJE

### 7.1 HITNE AKCIJE (P0 - Odmah)

#### 1. Ukloniti Hardcoded Credentials

**Fajlovi za izmenu:**
- `src/services/solvex/solvexAuthService.ts`
- `src/config/opengreeceConfig.ts`

**Akcija:**
```typescript
// UMESTO:
const SOLVEX_LOGIN = import.meta.env.VITE_SOLVEX_LOGIN || 'sol611s';

// KORISTITI:
const SOLVEX_LOGIN = import.meta.env.VITE_SOLVEX_LOGIN;
if (!SOLVEX_LOGIN) {
    throw new Error('VITE_SOLVEX_LOGIN not configured in .env');
}
```

---

#### 2. Primeniti Rate Limiting na Sve Dobavljače

**Fajlovi za izmenu:**
- `src/services/opengreeceApiService.ts`
- `src/services/tctApi.ts`
- `src/services/flight/amadeusInit.ts`

**Akcija:** Dodati rate limit proveru na početak svake API funkcije:
```typescript
const limitCheck = rateLimiter.checkLimit('opengreece');
if (!limitCheck.allowed) {
    return { success: false, error: `Rate limit exceeded. Retry after ${limitCheck.retryAfter}s` };
}
```

---

### 7.2 VISOKI PRIORITET (P1 - Ova Nedelja)

#### 3. Abstraktovati Solvex-Specifične Nazive

**Kreirati mapping layer:**
```typescript
// src/services/solvex/solvexMapping.ts
export const SOLVEX_METHODS = {
    SEARCH_HOTELS: 'SearchHotelServices',
    CONNECT: 'Connect',
    CHECK_CONNECT: 'CheckConnect'
} as const;

export const SOLVEX_XML_PATHS = {
    HOTEL_SERVICES: 'diffgr:diffgram.DocumentElement.HotelServices',
    CALC_ITEMS: 'CalcItemsResults.CalcItemsResult'
} as const;
```

---

#### 4. Dokumentovati Pravno Opravdanje

**Kreirati fajl:** `docs/LEGAL_JUSTIFICATION.md`

**Sadržaj:**
```markdown
# Pravno Opravdanje za Korišćenje API Struktura

## Solvex API

### SOAP Namespace: http://www.megatec.ru/
- **Razlog korišćenja:** SOAP standard zahteva korišćenje namespace-a definisanog od strane servera
- **Pravno opravdanje:** Tehnička neophodnost, ne predstavlja kopiranje IP
- **Alternativa:** Ne postoji - SOAP klijent MORA koristiti server namespace

### XML Tagovi (HotelServices, CalcItemsResult)
- **Razlog korišćenja:** XML parser mora koristiti tačne nazive tagova iz response-a
- **Pravno opravdanje:** Interoperabilnost - ne možemo promeniti nazive koje server šalje
- **Alternativa:** Mapiranje na generičke nazive u našem kodu (implementirano)
```

---

### 7.3 SREDNJI PRIORITET (P2 - Sledeći Mesec)

#### 5. Poboljšati Modularnost

**Kreirati centralni adapter:**
```typescript
// src/services/hotelProviderAdapter.ts
export interface HotelProvider {
    search(params: GenericSearchParams): Promise<GenericResult[]>;
    authenticate(): Promise<string>;
}

export class SolvexProvider implements HotelProvider {
    async search(params: GenericSearchParams): Promise<GenericResult[]> {
        // Solvex-specifična implementacija
    }
}
```

---

## 8️⃣ ZAKLJUČAK

### 8.1 Ukupna Ocena Usklađenosti

| Aspekt | Ocena | Status |
|--------|-------|--------|
| **Bezbednost Podataka** | 3/10 | 🔴 NEPRIHVATLJIVO |
| **Rate Limiting** | 4/10 | 🔴 NEDOVOLJNO |
| **Modularnost** | 7/10 | 🟡 PRIHVATLJIVO |
| **IP Zaštita** | 5/10 | 🟡 RIZIČNO |
| **Dokumentacija** | 6/10 | 🟡 NEDOVOLJNA |

**UKUPNA OCENA:** 5/10 - **ZAHTEVA HITNE IZMENE**

---

### 8.2 Pravna Preporuka

**Status:** ⚠️ **KOD JE FUNKCIONALAN, ALI PRAVNO RIZIČAN**

**Preporuke:**
1. ✅ **ODMAH** ukloniti hardcoded credentials
2. ✅ **ODMAH** primeniti rate limiting na sve dobavljače
3. ⚠️ **OVE NEDELJE** kreirati mapping layer za Solvex
4. ⚠️ **OVE NEDELJE** dokumentovati pravno opravdanje
5. 📋 **SLEDEĆI MESEC** refaktorisati u centralni adapter pattern

**Pravni Rizik:** 🟡 **SREDNJI** (sa hitnim akcijama može biti snižen na NIZAK)

---

### 8.3 Tehnička Preporuka

**Kod je dobro strukturiran**, ali zahteva:
- Uklanjanje bezbednosnih propusta
- Dosledno primenjivanje rate limitinga
- Dodatnu apstrakciju Solvex-specifičnih elemenata

**Procena:** Kod može biti **usklađen sa NDA ugovorom** uz implementaciju preporuka iz ovog dokumenta.

---

## 📎 PRILOZI

### A. Lista Fajlova za Reviziju

```
KRITIČNI FAJLOVI:
✅ src/services/solvex/solvexAuthService.ts
✅ src/config/opengreeceConfig.ts
✅ src/utils/solvexSoapClient.ts
✅ src/services/solvex/solvexSearchService.ts

FAJLOVI ZA IZMENU:
⚠️ src/services/opengreeceApiService.ts (dodati rate limiting)
⚠️ src/services/tctApi.ts (dodati rate limiting)
⚠️ src/services/flight/amadeusInit.ts (dodati rate limiting)

DOKUMENTACIJA:
📋 docs/LEGAL_JUSTIFICATION.md (kreirati)
📋 docs/API_MAPPING_LAYER.md (kreirati)
```

---

### B. Kontakt za Pravna Pitanja

**Odgovorna Osoba:** [IME PRAVNOG SAVETNIKA]  
**Email:** [EMAIL]  
**Telefon:** [TELEFON]

---

**Dokument kreirao:** Antigravity AI Assistant  
**Datum:** 2026-01-09  
**Sledeća Revizija:** Nakon implementacije P0 i P1 preporuka

---

**NAPOMENA:** Ovaj dokument je **POVERLJIV** i ne sme biti deljen sa trećim licima bez odobrenja pravnog tima.
