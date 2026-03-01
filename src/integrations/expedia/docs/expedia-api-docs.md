# Expedia Group — Rapid API — Integraciona Dokumentacija
## ClickToTravel Hub

> **Datum:** 2026-03-01  
> **API Verzija:** Rapid v3  
> **Status integracije:** TEST / SANDBOX READY (Mock Mode)  
> **Implementirao:** AI Assistant (Antigravity)
> **Docs:** https://developers.expediagroup.com/rapid

---

## 1. O Expedia Rapid API

**Expedia Group Rapid API** je jedan od vodećih B2B travel API-ja na tržištu:
- **700,000+** nekretnina globalno (hoteli, lejkarte, vile, hosteli)
- Pokriva: **Lodging, Flights, Cars, Activities**
- Kompanija u vlasništvu Expedia Group, uključuje brendove Expedia, Hotels.com, Vrbo, Orbitz

> ⚠️ **VAŽNO:** Expedia Rapid API je B2B platforma. Zahteva formalnu partnersku registraciju i Site Review pre produktionog pristupa.

---

## 2. Autentifikacija

Expedia koristi **custom EAN header** sa SHA-512 hash potpisom:

```http
Authorization: EAN APIKey={apiKey},Signature={sha512Hash},timestamp={unixTimestamp}
Customer-Ip: {korisnikova_IP_adresa}
Accept: application/json
Accept-Encoding: gzip
```

### Generisanje Signature-a
```typescript
// Formula: SHA512(apiKey + apiSecret + unixTimestamp)
// ⚠️ OVO TREBA IĆI NA BACKEND U PRODUKCIJI — ne exposovati secret key frontendu!

import { SHA512 } from 'crypto-js';  // ili Node.js 'crypto' modul na backendu

const timestamp = Math.floor(Date.now() / 1000); // UNIX sekunde
const hash = SHA512(apiKey + apiSecret + timestamp).toString();
const authHeader = `EAN APIKey=${apiKey},Signature=${hash},timestamp=${timestamp}`;
```

### Signature Generator Alat
Expedia pruža [online Signature Generator](https://developers.expediagroup.com/rapid/developer-tools/signature-generator) za testiranje vaše implementacije hešovanja.

---

## 3. Base URLs

```
Test:        https://test.ean.com/v3
Produkcija:  https://api.ean.com/v3
```

> Test okruženje vrača mock podatke. Rezervacije se NE naplaćuju i NE šalju do hotela.

### Test Header
Da biste koristili test okruženje, dodajte:
```http
Test: standard
```

---

## 4. API Suite Overview

| Kategorija | Opis | Base Path |
|------------|------|-----------|
| **Shopping** | Pretraga dostupnosti i cena nekretnina | `GET /properties/availability` |
| **Content** | Statički podaci (opisi, slike, amenities) | `GET /properties/content` |
| **Booking** | Kreiranje i upravljanje itinereriom | `POST /itineraries` |
| **Geography** | Pretraga regiona, gradova, aerodroma | `GET /regions` |
| **Payments** | Opcije plaćanja, payment sessions | `GET /properties/{id}/payment-options` |

---

## 5. Shopping API — Endpointi

### Pretraga nekretnina

| Metoda | Endpoint | Opis |
|--------|----------|------|
| `GET` | `/properties/availability` | Pretraga hotela sa dostupnošću i cenama |
| `GET` | `/properties/availability?property_id=...` | Pretraga konkretnih nekretnina po ID-u |

### Ključni query parametri:
```
checkin=2026-07-15
checkout=2026-07-22
currency=EUR
language=en-US
country_code=RS
occupancy=2               (odrasli)
occupancy=2-1-8           (2 odrasla + 1 dete starosto 8)
property_id=1234&property_id=5678   (opciono)
sales_channel=website
sales_environment=hotel_only
include=tax_breakdown
```

---

## 6. Content API — Endpointi

| Metoda | Endpoint | Opis |
|--------|----------|------|
| `GET` | `/properties/content` | Sadržaj nekretnina (opisi, slike, amenities) |
| `GET` | `/properties/catalog` | Katalog svih nekretnina sa osnovnim podacima |

> **Preporuka:** Content se kešira lokalno jer se retko menja. Ne pozivati pri svakoj pretrazi.

---

## 7. Booking Flow (Itinerary)

```
KORAK 1: GET /properties/availability
         → Parametri: checkin, checkout, occupancy, currency, language
         → Odgovor: lista nekretnina sa sobama i rate-ovima
         → Svaka soba sadrži bed_groups sa price_check linkom (TOKEN)

KORAK 2: GET {price_check_link_from_step_1}
         → Token iz bed_group.links.price_check.href
         → Odgovor: status = "matched" | "price_changed" | "sold_out"
         → Ako "matched": dobijate book link za naredni korak

KORAK 3: POST /itineraries  (ili URL iz price_check.links.book)
         → Body: affiliate_reference_id, email, phone, rooms[], payments[]
         → Odgovor: itinerary_id, reservation_id, status, links

KORAK 4: GET /itineraries/{itinerary_id}?token={token}
         → Proverite status rezervacije i dobijte confirmation_id od hotela

KORAK 5 (opciono): DELETE /itineraries/{itinerary_id}/rooms/{room_id}
         → Otkazivanje unutar cancellation deadline-a
         → Vraća HTTP 204 (bez tela odgovora)
```

---

## 8. Geography API — Endpointi

| Metoda | Endpoint | Opis |
|--------|----------|------|
| `GET` | `/regions?query={text}` | Pretraga regiona/gradova/aerodroma po tekstu |
| `GET` | `/regions/{region_id}` | Detalji specifičnog regiona |
| `GET` | `/regions/{region_id}/properties` | Nekretnine u regionu |

### Tipovi regiona:
`continent`, `country`, `province`, `city`, `airport`, `metro_station`, `point_of_interest`, `neighborhood`, `high_level_region`, `train_station`

---

## 9. Status Kodovi Rezervacije

| Status | Opis |
|--------|------|
| `pending` | Kreirana, čeka potvrdu |
| `booked` | Potvrđena |
| `cancelled` | Otkazana |
| `failed` | Neuspešna rezervacija |

### Price Check Statusi:

| Status | Opis | Akcija |
|--------|------|--------|
| `matched` | Cena nepromenjena | Nastavi sa rezervacijom |
| `price_changed` | Cena se promenila | Prikaži novu cenu korisniku |
| `sold_out` | Soba popunjena | Ponudi alternativne opcije |

---

## 10. Merchant of Record

Expedia podržava dva modela naplate:

| Model | Opis |
|-------|------|
| `expedia_collect` | Expedia naplaćuje gosta, vi dobijate neto iznos |
| `property_collect` | Vi (ili hotel) naplaćujete gosta direktno |

> Vaš nalog određuje koji modeli su dostupni.

---

## 11. Implementirani Fajlovi u Projektu

```
src/integrations/expedia/
├── types/
│   └── expediaTypes.ts          → TypeScript interfejsi (Shopping, Content, Booking, Geo)
├── api/
│   └── expediaApiService.ts     → Singleton API servis (mock ready)
└── docs/
    └── expedia-api-docs.md      → Ova dokumentacija

src/pages/
└── ExpediaTest.tsx              → Test stranica (Shopping, Content, Booking tabovi)
```

### 11.1 Dostupne Metode u expediaApiService.ts

```typescript
// Konfiguracija
expediaApiService.configure({ apiKey, apiSecret, environment })
expediaApiService.isConfigured()
expediaApiService.getEnvironment()

// Shopping
expediaApiService.searchProperties({ checkin, checkout, currency, language, country_code, occupancy })

// Content
expediaApiService.getPropertyContent({ property_id, language })

// Price Check
expediaApiService.checkPrice({ token })

// Booking
expediaApiService.createItinerary({ affiliate_reference_id, email, rooms, payments })
expediaApiService.getItinerary(itineraryId)
expediaApiService.cancelItinerary(itineraryId)

// Geo
expediaApiService.searchRegions({ query, language })
```

---

## 12. Migracija na Production

1. **Partnerska registracija** na Expedia Group Developer Hub.

2. **Site Review** — Expedia pregledava vaš UI pre odobrenja produkcije:
   - Prikaz tačnih otkaznih rokova
   - Istaknuto prikazivanje ukupne cene (sa porezima)
   - Expedia logo na stranici gde se prikazuje sadržaj

3. **Backend Proxy** za generisanje SHA-512 signature-a:
   ```typescript
   // Backend (Node.js/Express)
   import crypto from 'crypto';
   const timestamp = Math.floor(Date.now() / 1000);
   const hash = crypto.createHash('sha512')
     .update(apiKey + apiSecret + timestamp)
     .digest('hex');
   ```

4. **Zameniti mock pozive realnim `fetch()` pozivima** unutar `expediaApiService.ts`

5. **Skinuti `Test: standard` header** iz produkcijskih poziva

---

## 13. Display Compliance (Obavezno)

Expedia zahteva određeni prikaz sadržaja:

| Zahtev | Detalj |
|--------|--------|
| **Ukupna cena** | Mora biti prikazana sa svim taksama (`inclusive` total) |
| **Otkazni rokovi** | Moraju biti jasno prikazani pre potvrde rezervacije |
| **Hotel naziv** | Mora biti identičan imenu iz Content API odgovora |
| **Expedia logo** | Obavezan na stranicama sa Expedia sadržajem (B2C) |
| **Recenzije** | Ne smeju biti modifikovane ni filtrirane |

---

## 14. Resursi

| Resurs | Link |
|--------|------|
| Developer Hub | https://developers.expediagroup.com/rapid |
| API Reference | https://developers.expediagroup.com/rapid/reference |
| Signature Generator | https://developers.expediagroup.com/rapid/developer-tools/signature-generator |
| Postman Collection | Dostupna unutar Developer Hub portala |
| Launch Requirements | https://developers.expediagroup.com/rapid/get-started |
| OpenAPI Spec (Swagger) | Preuzimanje unutar API Reference sekcije |
