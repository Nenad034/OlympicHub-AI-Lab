# Hotelbeds APItude Suite — Integraciona Dokumentacija
## ClickToTravel Hub

> **Datum:** 2026-03-01  
> **API Verzija:** APItude v1  
> **Status integracije:** TEST / SANDBOX READY  
> **Implementirao:** AI Assistant (Antigravity)

---

## 1. O Hotelbedsu

**Hotelbeds** je vodeća B2B platforma u travel industriji:
- **180,000+** hotela globalno
- Activities, Transfers i Car Rentals u istoj platformi
- Odvojena API suita (APItude) od Worldpay-a — **to su dva potpuno različita proizvoda!**

> ⚠️ **VAŽNO:** Worldpay je payment gateway. Hotelbeds je travel inventory supplier. Nemaju direktne veze.

**Dokumentacija:** https://developer.hotelbeds.com/documentation/

---

## 2. Autentifikacija

Hotelbeds koristi **X-Signature** autentifikaciju (SHA-256 hash), što je **osjetljivo na server-side implementaciju**:

```http
Api-Key: YOUR_API_KEY
X-Signature: SHA256(apiKey + secret + unixTimestamp)
Accept: application/json
Content-Type: application/json
```

### Generisanje X-Signature
```typescript
// ⚠️ OVO TREBA IĆI NA BACKEND U PRODUKCIJI — ne exposovati secret key frontendu!
const timestamp = Math.floor(Date.now() / 1000).toString();
const signatureInput = apiKey + apiSecret + timestamp;
const signature = SHA256(signatureInput); // hex digest
```

---

## 3. Base URLs

```
Test:        https://api.test.hotelbeds.com
Produkcija:  https://api.hotelbeds.com
```

---

## 4. API Suite Overview

Hotelbeds ima **više odvojenih API servisa** pod APItude platformom:

| API Suite | Opis | Base Path |
|-----------|------|-----------|
| Hotel Booking API | Dostupnost, tarife, booking hotela | `/hotel-api/1.0/` |
| Hotel Content API | Statički sadržaj (opisi, slike, amenities) | `/hotel-content-api/1.0/` |
| Activities API | Ture, aktivnosti, izleti | `/activities-api/0.1/` |
| Transfers API | Airport/station transferi | `/transfers-api/1.0/` |
| Car Rental API | Iznajmljivanje vozila | `/car-rental-api/` |
| Excursions API | Opcioni izleti | `/excursion-api/` |

---

## 5. Hotel Booking API — Endpointi

### Pretraga i Provera Dostupnosti

| Metoda | Endpoint | Opis |
|--------|----------|------|
| `POST` | `/hotel-api/1.0/hotels` | Pretraga hotela sa dostupnošću i cenama |
| `POST` | `/hotel-api/1.0/checkrates` | Provera tačne cene za izabrane rate-ove |

### Booking

| Metoda | Endpoint | Opis |
|--------|----------|------|
| `POST` | `/hotel-api/1.0/bookings` | Kreiranje rezervacije hotela |
| `GET` | `/hotel-api/1.0/bookings/{reference}` | Dohvatanje rezervacije |
| `DELETE` | `/hotel-api/1.0/bookings/{reference}` | Otkazivanje rezervacije |
| `GET` | `/hotel-api/1.0/bookings` | Lista rezervacija sa filterima |

### Sadržaj

| Metoda | Endpoint | Opis |
|--------|----------|------|
| `GET` | `/hotel-content-api/1.0/hotels` | Lista hotela sa opisima |
| `GET` | `/hotel-content-api/1.0/hotels/{hotelCode}/details` | Detalji hotela |
| `GET` | `/hotel-content-api/1.0/locations/destinations` | Lista destinacija |
| `GET` | `/hotel-content-api/1.0/types/rooms` | Tipovi soba |
| `GET` | `/hotel-content-api/1.0/types/boards` | Plansovi ishrane |
| `GET` | `/hotel-content-api/1.0/types/facilities` | Sadržaji hotela |

---

## 6. Activities API — Endpointi

| Metoda | Endpoint | Opis |
|--------|----------|------|
| `GET` | `/activities-api/0.1/activities` | Pretraga aktivnosti |
| `GET` | `/activities-api/0.1/activities/{activityCode}` | Detalji aktivnosti |
| `GET` | `/activities-api/0.1/activities/{activityCode}/availability` | Dostupnost aktivnosti |
| `POST` | `/activities-api/0.1/bookings` | Booking aktivnosti |
| `GET` | `/activities-api/0.1/bookings/{reference}` | Status bookinga |

---

## 7. Transfers API — Endpointi

| Metoda | Endpoint | Opis |
|--------|----------|------|
| `GET` | `/transfers-api/1.0/types/transfertypes` | Tipovi transfera |
| `POST` | `/transfers-api/1.0/availability` | Provera dostupnosti transfera |
| `POST` | `/transfers-api/1.0/bookings` | Booking transfera |
| `GET` | `/transfers-api/1.0/bookings/{reference}` | Dohvatanje bookinga |
| `DELETE` | `/transfers-api/1.0/bookings/{reference}` | Otkazivanje transfera |

---

## 8. Booking Flow (Hoteli)

```
KORAK 1: POST /hotel-api/1.0/hotels
         → Unesite: stay (checkIn, checkOut), occupancies, destination
         → Dobijate: listu hotela sa dostupnim rate-ovima

KORAK 2: POST /hotel-api/1.0/checkrates
         → Potvrdite cenu izabrane sobe/rate-a pre bookinga
         → OBAVEZNO — rate-ovi se menjaju u realnom vremenu

KORAK 3: POST /hotel-api/1.0/bookings
         → Kreirajte rezervaciju sa:
           - holder (kontakt podaci)
           - rooms (pax info)
           - rateKey (iz checkrates odgovora)
         → Dobijate: reference, status, bookingInfo

KORAK 4: GET /hotel-api/1.0/bookings/{reference}
         → Proverite status rezervacije

KORAK 5 (opciono): DELETE /hotel-api/1.0/bookings/{reference}
         → Otkazivanje unutar cancellation deadline-a
```

---

## 9. Rate Types

| Tip | Opis |
|-----|------|
| `BOOKABLE` | Rate je odmah bookable |
| `RECHECK` | Rate zahteva recheck pre bookinga |
| `ON_REQUEST` | Zahteva manuelnu potvrdu |

---

## 10. Status Kodovi Rezervacije

| Status | Opis |
|--------|------|
| `NEW` | Kreirana, čeka potvrdu |
| `CONFIRMED` | Potvrđena od strane hotela |
| `PENDING_CANCELLATION` | Zahtev za otkazivanje u toku |
| `CANCELLED` | Otkazana |

---

## 11. Implementirani Fajlovi u Projektu

```
src/integrations/hotelbeds/
├── types/
│   └── hotelbedsTypes.ts       → TypeScript tipovi (Hotels, Activities, Transfers)
└── api/
    └── hotelbedsApiService.ts  → Singleton API servis (mock ready)

src/pages/
├── HotelbedsTest.tsx           → Test stranica sa 4 taba (Hotels, Activities, Transfers, Bookings)
└── HotelbedsTest.css           → Stilovi
```

### 11.1 Dostupne Metode u hotelbedsApiService.ts

```typescript
// Konfiguracija
hotelbedsApiService.configure({ apiKey, apiSecret, environment })
hotelbedsApiService.isConfigured()

// Hoteli
hotelbedsApiService.searchHotels({ stay, occupancies, destination })
hotelbedsApiService.checkRates({ rooms })
hotelbedsApiService.bookHotel({ holder, rooms, clientReference, remark })
hotelbedsApiService.getBooking(reference)
hotelbedsApiService.cancelBooking(reference)
hotelbedsApiService.getBookings({ from, to, status })

// Activities
hotelbedsApiService.searchActivities({ destination, from, to, adults, children })
hotelbedsApiService.getActivity(activityCode)
hotelbedsApiService.bookActivity({ activityCode, date, language, paxes, contactInfo })

// Transfers
hotelbedsApiService.searchTransfers({ fromType, toType, fromCode, toCode, language, adults, children, departureDate })
hotelbedsApiService.bookTransfer({ transferId, rateKey, passengers, contactInfo, ... })
```

---

## 12. Migracija na Production

1. **API Key i Secret** od Hotelbeds Business Development:
   ```typescript
   hotelbedsApiService.configure({
     apiKey: process.env.HOTELBEDS_API_KEY,
     apiSecret: process.env.HOTELBEDS_API_SECRET,
     environment: 'production'
   });
   ```

2. **Implementovati backend proxy** za X-Signature generisanje (ne otkrivati secret na frontendu!)

3. Zameniti mock pozive realnim `fetch()` pozivima unutar `hotelbedsApiService.ts`

---

## 13. Resursi

| Resurs | Link |
|--------|------|
| Developer portal | https://developer.hotelbeds.com/ |
| Getting Started | https://developer.hotelbeds.com/documentation/getting-started/ |
| Hotel Booking API | https://developer.hotelbeds.com/documentation/hotels/ |
| Activities API | https://developer.hotelbeds.com/documentation/activities/ |
| Transfers API | https://developer.hotelbeds.com/documentation/transfers/ |
| Sandbox Console | https://developer.hotelbeds.com/api-tester/ |
