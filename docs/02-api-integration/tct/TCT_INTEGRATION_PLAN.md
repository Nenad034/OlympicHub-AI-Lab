# 🏔️ TCT API Integration Plan

## 📋 Status Pregleda

### ✅ Završeno (Korak 1)
- [x] Dodati TCT kredencijale u `.env` fajl
- [x] Kreiran `tctApiService.ts` sa svim API endpointima
- [x] Kreiran `tctMockService.ts` sa mock podacima
- [x] Kreiran `tctApi.ts` sa unified API i auto-switch
- [x] Kreirana `TCTConnectionTest` komponenta
- [x] Testirana konekcija - identifikovan problem
- [x] **Dodatna Sigurnost:**
  - [x] `tctApiTest.ts` - Automatsko testiranje svih endpointa
  - [x] `tctApiLogger.ts` - Detaljni logging svih API poziva
  - [x] `tctApiDryRun.ts` - Dry Run mode za bezbedno testiranje
  - [x] `TCT_SECURITY_TOOLS.md` - Kompletna dokumentacija

### ⚠️ Trenutni Problem
**B2B API pristup nije aktiviran**
- Kredencijali su validni za portal login
- API Key: `689b54e328f3e759abfdced76ad8e8d0`
- Username: `nenad.tomic@olympic.rs`
- Greška: "Invalid b2b system credentials"

**Kontakt za aktivaciju:** sebastian.rabei@tct.travel

---

## 🎯 Trenutni Pristup: Mock Development

Dok čekamo B2B aktivaciju, razvijamo sa mock podacima.

### Faza 1: Mock TCT Servis ✅ ZAVRŠENO
- ✅ Mock podaci za hotele
- ✅ Mock podaci za letove
- ✅ Mock podaci za pakete
- ✅ Mock podaci za rezervacije
- ✅ **Dodatni Sigurnosni Alati:**
  - ✅ Automatsko testiranje
  - ✅ Detaljni logging
  - ✅ Dry Run mode

### Faza 2: UI Development
Razviti kompletan UI za:
1. **Hotel Search Module**
   - Forma za pretragu
   - Prikaz rezultata
   - Detalji hotela
   - Rezervacija

2. **Flight Search Module** (Ako TCT ima)
   - Forma za pretragu letova
   - Prikaz rezultata
   - Detalji leta

3. **Package Search Module**
   - Pretraga paketa
   - Prikaz rezultata
   - Rezervacija paketa

4. **Booking Management**
   - Lista rezervacija
   - Detalji rezervacije
   - Otkazivanje

### Faza 3: Integracija sa Pravim API-jem
Kada dobijemo B2B pristup:
- Zameniti mock servis sa pravim API pozivima
- Testirati sve funkcionalnosti
- Finalizovati integraciju

---

## 📁 Struktura Projekta

```
src/
├── services/
│   ├── tctApiService.ts          ✅ Kreiran (Real API)
│   └── tctMockService.ts         🔄 U toku (Mock API)
├── modules/
│   └── tct/
│       ├── TCTHub.tsx            📋 Planirano (Main Module)
│       ├── TCTHub.css            📋 Planirano
│       ├── components/
│       │   ├── HotelSearch.tsx   📋 Planirano
│       │   ├── HotelResults.tsx  📋 Planirano
│       │   ├── HotelDetails.tsx  📋 Planirano
│       │   ├── FlightSearch.tsx  📋 Planirano
│       │   ├── FlightResults.tsx 📋 Planirano
│       │   ├── PackageSearch.tsx 📋 Planirano
│       │   ├── BookingForm.tsx   📋 Planirano
│       │   └── BookingList.tsx   📋 Planirano
│       └── hooks/
│           └── useTCTApi.ts      📋 Planirano (Switch Mock/Real)
└── components/
    └── tct/
        ├── TCTConnectionTest.tsx ✅ Kreiran
        └── TCTConnectionTest.css ✅ Kreiran
```

---

## 🔧 Tehnički Detalji

### Environment Variables (.env)
```bash
# TCT API Configuration
VITE_TCT_API_URL=https://imc-dev.tct.travel
VITE_TCT_USERNAME=nenad.tomic@olympic.rs
VITE_TCT_PASSWORD=689b54e328f3e759abfdced76ad8e8d0
VITE_TCT_API_SOURCE=B2B
VITE_TCT_USE_MOCK=true  # Switch to false when B2B is activated
```

### API Endpoints Implementirani

#### Static Data / NBC
- ✅ `getNationalities()` - Lista nacionalnosti
- ✅ `getGeography()` - Geografija (zemlje, regioni, gradovi)
- ✅ `getAirports()` - Lista aerodroma
- ✅ `getHotelCategories()` - Kategorije hotela
- ✅ `getHotelMealPlans()` - Planovi ishrane
- ✅ `getHotelInformation()` - Informacije o hotelima

#### Hotel API
- ✅ `searchHotelsSync()` - Sinhron pretraga hotela
- ✅ `searchHotels()` - Asinhron pretraga hotela
- ✅ `getHotelResults()` - Rezultati pretrage
- ✅ `getHotelValuation()` - Provera cene i dostupnosti
- ✅ `getHotelDetails()` - Detalji hotela
- ✅ `bookHotel()` - Rezervacija hotela
- ✅ `getBookingDetails()` - Detalji rezervacije
- ✅ `cancelBooking()` - Otkazivanje rezervacije

#### Package API
- ✅ `getPackageDepartures()` - Polasci paketa

---

## 🎨 UI/UX Dizajn

### Stil
- VSCode-style layout (konzistentan sa ostatkom aplikacije)
- Glassmorphism efekti
- Responsive dizajn
- Dark/Light/Cream/Navy teme

### Komponente
- Forme za pretragu sa validacijom
- Kartice za prikaz rezultata
- Modali za detalje i rezervacije
- Loading states
- Error handling

---

## 📊 Mock Data Struktura

### Hotel Mock Data
```typescript
{
  id: "1",
  name: "Hotel Sunrise Grand Select",
  city: "Hurgada",
  country: "Egipat",
  stars: 5,
  price: 850,
  currency: "EUR",
  mealPlan: "All Inclusive",
  images: [...],
  description: "...",
  facilities: [...]
}
```

### Flight Mock Data (Ako postoji)
```typescript
{
  id: "FL001",
  from: "BEG",
  to: "HRG",
  departure: "2026-02-15T10:00:00",
  arrival: "2026-02-15T14:30:00",
  price: 350,
  currency: "EUR"
}
```

---

## 🔄 Prelazak sa Mock na Real API

Kada dobijemo B2B pristup:

1. **Update .env**
   ```bash
   VITE_TCT_USE_MOCK=false
   ```

2. **Testiranje**
   - Pokrenuti sve testove
   - Proveriti sve API pozive
   - Validirati podatke

3. **Deployment**
   - Push na GitHub
   - Deploy na production

---

## 📞 Kontakt Informacije

**TCT Support:**
- Email: sebastian.rabei@tct.travel
- Portal: https://imc-dev.tct.travel
- Dokumentacija: https://imc-dev.tct.travel/docs

**Potrebno za aktivaciju:**
- Account: nenad.tomic@olympic.rs
- Zahtev: Aktivacija B2B API pristupa

---

## 📝 Napomene

- Mock servis će koristiti **realističke podatke** iz Postman kolekcije
- Svi API pozivi će biti **identični** kao pravi API
- Prelazak sa mock na real će biti **seamless** (samo env varijabla)
- UI će biti **potpuno funkcionalan** sa mock podacima

---

**Poslednje ažuriranje:** 2026-01-04
**Status:** Mock Development - Faza 1 u toku
