# ClickToTravel — API Integracije (Pregled)

> **Poslednje ažuriranje:** 2026-03-01  
> **Projekat:** PrimeClickToTravel — refaktorisano  
> **Dev server:** `npm run dev` → http://localhost:5173

---

## Status Svih Integracija

| Integracija | Tip | Status | Test Page | Dokumentacija |
|-------------|-----|--------|-----------|---------------|
| **Amadeus** | Flights GDS | 🟢 Active | `/amadeus-test` | `amadeus/docs/` |
| **MARS (IATA NDC)** | Flights NDC | 🟡 Testing | `/mars-test` | `mars/docs/` |
| **GIATA** | Hotel Mapping | 🟢 Active | `/giata-test` | — |
| **Hotelbeds** | Hotels/Activities/Transfers | 🟡 Testing | `/hotelbeds-test` | [docs/hotelbeds-api-docs.md](hotelbeds/docs/hotelbeds-api-docs.md) |
| **Viator** | Tours & Experiences | 🟡 Testing | `/viator-test` | [docs/viator-api-docs.md](viator/docs/viator-api-docs.md) |
| **Worldpay** | Payment Gateway | 🟡 Testing | `/worldpay-test` | — |
| **Filos** | Travel Content | 🔵 Dev | — | `filos/docs/` |
| **Kyte** | — | 🔵 Dev | — | `kyte/docs/` |

---

## Arhitektura Integrations Foldera

```
src/integrations/
├── amadeus/
│   ├── api/
│   ├── types/
│   ├── mappers/
│   └── docs/
├── hotelbeds/          ← Hotels, Activities, Transfers
│   ├── api/
│   │   └── hotelbedsApiService.ts
│   ├── types/
│   │   └── hotelbedsTypes.ts
│   └── docs/
│       └── hotelbeds-api-docs.md  ← DOKUMENTACIJA
├── viator/             ← Tours & Experiences
│   ├── api/
│   │   └── viatorApiService.ts
│   ├── types/
│   │   └── viatorTypes.ts
│   └── docs/
│       └── viator-api-docs.md     ← DOKUMENTACIJA
├── mars/
│   ├── api/
│   ├── docs/
│   └── ...
├── giata/
│   ├── api/
│   └── types/
└── worldpay/
    └── api/
```

---

## Patterns koje koristimo

### 1. Singleton Servis Pattern
Svaka integracija ima singleton servis:
```typescript
import viatorApiService from '../integrations/viator/api/viatorApiService';
viatorApiService.configure({ apiKey: '...', environment: 'sandbox', ... });
const results = await viatorApiService.searchProducts({ ... });
```

### 2. Mock-first Development
- Svaki servis implementuje `mockDelay()` i mock podatke
- Lako se zamenjuje realnim API pozivima kada se dobiju production credencijali

### 3. TypeScript Types
- Svi tipovi su u `types/` folderu integirsane integracije
- Striktno tipizirani request/response objekti

---

## Authorizacija po Integraciji

| Integracija | Tip Autentifikacije | Gde se drži secret |
|-------------|--------------------|--------------------|
| Amadeus | OAuth 2.0 (Client Credentials) | Server-side |
| Hotelbeds | API Key + X-Signature (SHA256) | ⚠️ Secret mora biti server-side |
| Viator | API Key u header-u | ⚠️ Key mora biti server-side |
| GIATA | Bearer Token (JWT) | Server-side |
| Worldpay | Basic Auth (username:password) | Server-side |
| MARS | API Key + OAuth | Server-side |

> **NAPOMENA:** Nikad ne commitovati API ključeve u kod! Koristiti environment varijable.

---

## Test Stranice (Putanje)

Sve test stranice su dostupne kao child routes unutar aplikacije:

```
http://localhost:5173/hotelbeds-test  → Hotelbeds APItude (Hotels, Activities, Transfers)
http://localhost:5173/viator-test     → Viator Partner API (Tours & Experiences)
http://localhost:5173/worldpay-test   → Worldpay Payment Gateway
http://localhost:5173/giata-test      → GIATA Mapping
http://localhost:5173/amadeus-test    → Amadeus Flights GDS
```

Ili putem: **APIConnectionsHub** (`/api-connections`) → kliknuti "Testiraj" na svakoj kartici.
