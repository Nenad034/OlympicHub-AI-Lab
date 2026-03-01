# Viator Partner API v2 — Integraciona Dokumentacija
## ClickToTravel Hub

> **Datum:** 2026-03-01  
> **Verzija API:** 2.0  
> **Status integracije:** TEST / SANDBOX READY  
> **Implementirao:** AI Assistant (Antigravity)

---

## 1. O Viatoru

Viator je deo **Tripadvisor grupe** i najveća je platforma za tours & experiences na svetu:
- **300,000+** aktivnosti, tura i iskustava globalno
- **190+ zemalja** pokrivenosti
- Direktan pristup inventaru za B2B partnere

**Dokumentacija:** https://docs.viator.com/partner-api/technical/

---

## 2. Autentifikacija

Viator koristi **API Key** autentifikaciju — bez potpisa, bez OAuth, samo header:

```http
exp-api-key: YOUR_VIATOR_API_KEY
Accept-Language: en-US
Accept: application/json;version=2.0
Content-Type: application/json
```

**Napomena:** Lokalizacija se kontroliše per-call pomoću `Accept-Language` headera (ne per API ključ kao u starijim verzijama).

### Kako dobiti API Key
Kontaktirati Viator Business Development tim. Postoje dve vrste pristupa:

---

## 3. Tipovi Partnerstava

### 3.1 Affiliate Partner
| Karakteristika | Detalji |
|----------------|---------|
| Pristup sadržaju | ✅ Pun pristup (Products, Images, Reviews) |
| Pretraga | ✅ Freetext + Filtrovana |
| Booking | ❌ Ne — klijent se preusmerava na viator.com |
| Komisija | ✅ Na svaku prodaju via cookie tracking |
| API level | `READ` |

### 3.2 Merchant Partner
| Karakteristika | Detalji |
|----------------|---------|
| Pristup sadržaju | ✅ Pun pristup |
| Pretraga | ✅ Freetext + Filtrovana |
| Booking | ✅ Direktan (/bookings/hold + /bookings/book) |
| Upravljanje rezervacijama | ✅ Status, Cancel, Voucher |
| Merchant of Record | ✅ Direktna naplata od kupca |
| API level | `FULL` |

---

## 4. Base URLs

```
Sandbox:    https://api.sandbox.viator.com/partner
Produkcija: https://api.viator.com/partner
```

---

## 5. Kompletan Pregled Endpointa

### 5.1 Reference Data (Dostupno svima)

| Metoda | Endpoint | Opis |
|--------|----------|------|
| `GET` | `/destinations` | Lista svih destinacija sa Viator kodovima |
| `GET` | `/tags` | Lista tagova/kategorija produkata |
| `GET` | `/locations` | Lokacije (Places, POI) |
| `GET` | `/cancellations/reasons` | Razlozi za otkazivanje (Merchant) |

### 5.2 Products — Content (Dostupno svima)

| Metoda | Endpoint | Opis |
|--------|----------|------|
| `GET` | `/products/{product-code}` | Detalji jednog produkta (real-time) |
| `POST` | `/products/bulk` | Detalji za više produkata odjednom (max 500 per request) |
| `POST` | `/products/modified-since` | Delta update kataloga za ingestion |
| `POST` | `/products/recommendations` | Preporuke sličnih produkata |

### 5.3 Search (Dostupno svima)

| Metoda | Endpoint | Opis | Napomena |
|--------|----------|------|----------|
| `POST` | `/search/freetext` | Slobodna tekstualna pretraga | Vraća Products + Destinations |
| `POST` | `/products/search` | Filtrovana pretraga | Filteri: destinacija, tagovi, cena, trajanje, ocena |

### 5.4 Availability (Dostupno svima)

| Metoda | Endpoint | Opis |
|--------|----------|------|
| `GET` | `/availability/schedules/{product-code}` | Raspored dostupnosti za produkt (real-time) |
| `POST` | `/availability/schedules` | Bulk raspored dostupnosti |
| `POST` | `/availability/schedules/modified-since` | Delta update rasporeda (ingestion) |
| `POST` | `/availability/check` | **Ključno:** Provera dostupnosti + exaktna cena za datum/pax mix |

### 5.5 Booking (Samo Merchant / Full Access + Booking)

| Metoda | Endpoint | Opis |
|--------|----------|------|
| `POST` | `/bookings/hold` | Hold availability + pricing (15 minuta) |
| `POST` | `/bookings/cart/hold` | Hold za shopping cart (više produkata) |
| `POST` | `/bookings/book` | Finalizacija rezervacije |
| `POST` | `/bookings/cart/book` | Booking iz cart-a |
| `GET` | `/bookings/status` | Status rezervacije po `bookingRef` |
| `DELETE` | `/bookings/{booking-ref}` | Otkazivanje rezervacije |

---

## 6. Ključni Koncepti

### 6.1 Age Bands
Viator podržava 6 kategorija putnika:

| Kategorija | Opis |
|-----------|------|
| `ADULT` | Odrasli (opseg definiše supplier) |
| `CHILD` | Deca |
| `INFANT` | Bebe |
| `YOUTH` | Omladina |
| `SENIOR` | Penzioneri |
| `TRAVELER` | Koristi se SAMO za Unit Pricing (cena po grupi) |

**Opseg godina** definiše svaki supplier zasebno. Primer iz `/products/{code}`:
```json
"ageBands": [
  { "ageBand": "INFANT", "startAge": 0, "endAge": 2, "minTravelersPerBooking": 0, "maxTravelersPerBooking": 15 },
  { "ageBand": "CHILD",  "startAge": 3, "endAge": 11, "minTravelersPerBooking": 0, "maxTravelersPerBooking": 15 },
  { "ageBand": "ADULT",  "startAge": 12, "endAge": 80, "minTravelersPerBooking": 1, "maxTravelersPerBooking": 15 }
]
```

### 6.2 Pricing Types
- **Per-Person** — cena se računa po osobi za svaki age band → `PER_PERSON`
- **Per-Unit** — jedinstvena cena za celu grupu/vozilo (boat, jeep) → koristi `TRAVELER` age band

### 6.3 Cancellation Policies
```
STANDARD        → Standardna Viator politika (obično pun refund 24h pre ture)
CUSTOM          → Supplier definiše spopstvenu politiku i rokove
ALL_SALES_FINAL → Nema refunda
```

### 6.4 Booking Confirmation Types
```
INSTANT → Rezervacija se potvrđuje odmah (automatski)
MANUAL  → Supplier ručno potvrđuje (može trajati do X sati)
```

---

## 7. Booking Flow (Merchant Model)

```
KORAK 1: /availability/check
         → Unesite: productCode, travelDate, paxMix (ageBand + numberOfTravelers), currency
         → Dobijate: recommendedRetailPrice, partnerNetPrice, bookingFee

KORAK 2: /bookings/hold
         → Rezervišite availability za 15 minuta
         → Dobijate: cartRef, expires timestamp

KORAK 3: Naplata
         → Koristite Viator iframe solution ILI vlastiti payment form
         → (Samo za Affiliate sa "Full Access + Booking" ili Merchant)

KORAK 4: /bookings/book
         → Potvrdite rezervaciju sa bookerInfo i bookingAnswers
         → Dobijate: bookingRef, voucherInfo, cancellationPolicy
```

---

## 8. Pricing — Šta su različite cene?

| Polje | Opis |
|-------|------|
| `recommendedRetailPrice` | Cena koju kupac vidi na Viatoru — vi je koristite kao javnu cenu |
| `partnerNetPrice` | Cena koju partner plaća Viatoru — vaša nabavna cena |
| `bookingFee` | Viator processing fee (uključen u net cenu) |
| `fromPrice` | Minimalna od cena prikazana u listingu (za pregled) |

**Marža = recommendedRetailPrice - partnerNetPrice**

---

## 9. Rate Limiting & Error Handling

- **HTTP 429** → Rate limit prekoračen → Koristite exponential backoff
- **HTTP 400** → Greška u zahtevu (validacija)
- **HTTP 401** → Nevalidan API Key
- **HTTP 404** → Produkt/Booking ne postoji

---

## 10. Dva Modela Rada

### Model 1: Real-time (preporučeno za početak)
```
Korisnik traži ↔ API poziv u realnom vremenu ↔ Viator
```
- Uvek svezi podaci
- Više latency (400-800ms tipično)
- Nema lokalnog storage-a

### Model 2: Ingestion (za veće sisteme)
```
Nočni batch → /products/modified-since → Lokalna baza
Nočni batch → /availability/schedules/modified-since → Lokalna baza
Korisnik traži → Lokalna baza (brzo)
Za booking → Real-time /availability/check
```
- Mnogo brži prikaz sadržaja
- Potrebna baza i batch job infrastruktura
- **Ne koristiti /products/bulk za ingestion** (limitirano)

---

## 11. Implementirani Fajlovi u Projektu

```
src/integrations/viator/
├── types/
│   └── viatorTypes.ts          → Svi TypeScript tipovi (Products, Availability, Booking...)
└── api/
    └── viatorApiService.ts     → Singleton API servis sa svim metodama (mock ready)

src/pages/
├── ViatorTest.tsx              → Test stranica sa 6 tabova
└── ViatorTest.css              → Stilovi (dark/light mode)
```

### 11.1 Dostupne Metode u viatorApiService.ts

```typescript
// Reference Data
viatorApiService.getDestinations()
viatorApiService.getTags()

// Pretraga
viatorApiService.freetextSearch({ searchTerm, searchTypes, currency })
viatorApiService.searchProducts({ filtering, sorting, pagination, currency })

// Products
viatorApiService.getProduct(productCode)
viatorApiService.getProductsBulk(productCodes[])
viatorApiService.getProductReviews(productCode, count)
viatorApiService.getRecommendations({ productCodes, currency })

// Availability
viatorApiService.getAvailabilitySchedule(productCode)
viatorApiService.checkAvailability({ productCode, currency, travelDate, paxMix, startTime })

// Booking (Merchant only)
viatorApiService.holdBooking({ productCode, travelDate, paxMix, currency })
viatorApiService.confirmBooking({ productCode, travelDate, paxMix, currency, bookerInfo, ... })
viatorApiService.getBookingStatus(bookingRef)

// Cancellation
viatorApiService.getCancellationReasons()
viatorApiService.cancelBooking({ bookingRef, reasonCode })
```

---

## 12. Migracija na Production

Kada budete imali realni Viator API Key:

1. **Konfiguriši servis** sa realnim kredencijalima:
   ```typescript
   viatorApiService.configure({
     apiKey: process.env.VIATOR_API_KEY,
     environment: 'production',
     partnerType: 'merchant'
   });
   ```

2. **Zameniti mock pozive** realnim HTTP pozivima u `viatorApiService.ts`:
   - Zameniti `await this.mockDelay()` → `await fetch(this.baseUrl + endpoint, { headers: this.getHeaders() })`
   - Parsirati realne JSON response-e

3. **Preporučeno:** Dodati backend proxy za čuvanje API Key-a server-side (ne exposovati frontend-u)

4. **Testirati** na sandbox pre switch-a na produkciju

---

## 13. Resursi

| Resurs | Link |
|--------|------|
| Tehnička dokumentacija | https://docs.viator.com/partner-api/technical/ |
| Partner Resources | https://partnerresources.viator.com/travel-commerce/ |
| Affiliate info | https://partnerresources.viator.com/travel-commerce/affiliate/ |
| Merchant info | https://partnerresources.viator.com/travel-commerce/merchant/ |
| Age Bands Guide | https://partnerresources.viator.com/travel-commerce/merchant/agebands-pax-mix |
| Booking Workflow Guide | https://partnerresources.viator.com/travel-commerce/technical-guide/#/booking-workflow |
| API Payments | https://partnerresources.viator.com/travel-commerce/api-payments/ |
| Partner Support | dpsupport@viator.com |
