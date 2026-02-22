# Flight API Integration Architecture

## 📋 Pregled Projekta

**Cilj**: Kreiranje sveobuhvatnog sistema za pretragu i rezervaciju avionskih karata kroz integraciju sa vodećim provajderima (Amadeus, Kiwi.com, Duffel, TravelFusion).

**Datum Početka**: 2026-01-05  
**Status**: 🟢 U Razvoju - Faza 1 (Mock Service & UI)

---

## 🏗️ Arhitektura Sistema

### Unified Flight Model (UFM)

Centralni model podataka koji normalizuje sve provajdere u jedinstvenu strukturu.

```
┌─────────────────────────────────────────────────────────────┐
│                    Flight Search UI                          │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              Flight Search Manager                           │
│  (Agregira rezultate iz svih provajdera)                    │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┬──────────────┐
        ▼              ▼              ▼              ▼
   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐
   │ Amadeus │   │  Kiwi   │   │ Duffel  │   │TravelF. │
   │ Service │   │ Service │   │ Service │   │ Service │
   └─────────┘   └─────────┘   └─────────┘   └─────────┘
        │              │              │              │
        └──────────────┴──────────────┴──────────────┘
                       │
                       ▼
              Unified Flight Model
```

---

## 📁 Struktura Fajlova

```
src/
├── services/
│   ├── flight/
│   │   ├── providers/
│   │   │   ├── amadeus/
│   │   │   │   ├── amadeusApiService.ts      # Amadeus API implementacija
│   │   │   │   ├── amadeusAuthService.ts     # OAuth2 autentifikacija
│   │   │   │   ├── amadeusMapper.ts          # Mapiranje na UFM
│   │   │   │   └── amadeusTypes.ts           # Amadeus-specifični tipovi
│   │   │   ├── kiwi/
│   │   │   │   ├── kiwiApiService.ts         # Kiwi.com Tequila API
│   │   │   │   ├── kiwiMapper.ts             # Mapiranje na UFM
│   │   │   │   └── kiwiTypes.ts              # Kiwi-specifični tipovi
│   │   │   ├── duffel/
│   │   │   │   ├── duffelApiService.ts       # Duffel API
│   │   │   │   ├── duffelMapper.ts           # Mapiranje na UFM
│   │   │   │   └── duffelTypes.ts            # Duffel-specifični tipovi
│   │   │   ├── travelFusion/
│   │   │   │   ├── travelFusionApiService.ts # TravelFusion XML API
│   │   │   │   ├── travelFusionMapper.ts     # Mapiranje na UFM
│   │   │   │   └── travelFusionTypes.ts      # TravelFusion tipovi
│   │   │   └── IFlightProvider.ts            # Provider interfejs
│   │   ├── unifiedFlightModel.ts             # UFM definicija
│   │   ├── flightSearchManager.ts            # Agregacija pretrage
│   │   ├── flightValidationManager.ts        # Pre-booking validacija
│   │   └── flightBookingManager.ts           # Booking orchestration
│   └── flightMockService.ts                  # Mock za razvoj
├── types/
│   └── flight.types.ts                       # Globalni flight tipovi
└── pages/
    ├── FlightSearch.tsx                      # UI komponenta
    └── FlightSearch.css                      # Stilovi
```

---

## 🔄 Implementacioni Plan

### **Sprint 1: Osnove (Sedmica 1-2)** ✅ U TOKU
- [x] Kreirati dokumentaciju
- [ ] Implementirati `flight.types.ts`
- [ ] Kreirati Mock Service
- [ ] Kreirati UI komponentu
- [ ] Dodati u Router
- [ ] Dodati u Sidebar

### **Sprint 2: Amadeus Integracija (Sedmica 3-5)**
- [ ] OAuth2 autentifikacija
- [ ] Search endpoint
- [ ] Price validation endpoint
- [ ] Booking endpoint
- [ ] Mapiranje na UFM
- [ ] Error handling

### **Sprint 3: Kiwi.com Integracija (Sedmica 6-8)**
- [ ] API Key autentifikacija
- [ ] Search sa Virtual Interlining
- [ ] `check_flights` validacija
- [ ] Asinhroni booking
- [ ] Polling mehanizam
- [ ] Mapiranje na UFM

### **Sprint 4: Duffel Integracija (Sedmica 9-10)**
- [ ] Bearer token auth
- [ ] Offer Request
- [ ] Offer Response
- [ ] Order Creation
- [ ] Mapiranje na UFM

### **Sprint 5: TravelFusion Integracija (Sedmica 11-13)**
- [ ] XML Login
- [ ] GetFlightsRequest
- [ ] Polling mehanizam
- [ ] ProcessTerms
- [ ] StartBooking
- [ ] Mapiranje na UFM

---

## 🔑 Ključne Tehničke Odluke

### 1. **Provider Interface Pattern**
Svaki provajder implementira `IFlightProvider` interfejs sa metodama:
- `authenticate()`: Autentifikacija
- `search()`: Pretraga letova
- `validate()`: Pre-booking validacija
- `book()`: Kreiranje rezervacije

### 2. **Unified Flight Model (UFM)**
Centralni model koji normalizuje:
- **Pricing**: `total`, `base`, `taxes`, `currency`
- **Itinerary**: `slices` (delovi putovanja)
- **Segments**: Pojedinačni letovi
- **Metadata**: `bookingToken`, `validUntil`, `provider`

### 3. **Error Handling Strategy**
```typescript
FlightAPIError {
  provider: string;
  code: string;
  message: string;
  originalError: any;
}
```

### 4. **Caching Strategy**
- **Search Results**: 10-15 minuta
- **Booking Tokens**: Pratiti `validUntil` timestamp
- **Auth Tokens**: Auto-refresh 5 min pre isteka

### 5. **Authentication Management**
Centralizovani `authManager.ts` koji:
- Kešira tokene po provajderu
- Automatski osvežava tokene
- Rukuje sa 401 Unauthorized greškama

---

## 🔐 Environment Variables

```env
# Amadeus
VITE_AMADEUS_API_KEY=your_api_key
VITE_AMADEUS_API_SECRET=your_api_secret
VITE_AMADEUS_BASE_URL=https://test.api.amadeus.com

# Kiwi.com
VITE_KIWI_API_KEY=your_api_key
VITE_KIWI_BASE_URL=https://tequila-api.kiwi.com

# Duffel
VITE_DUFFEL_API_TOKEN=your_bearer_token
VITE_DUFFEL_BASE_URL=https://api.duffel.com

# TravelFusion
VITE_TRAVELFUSION_USERNAME=your_username
VITE_TRAVELFUSION_PASSWORD=your_password
VITE_TRAVELFUSION_BASE_URL=https://xml.travelfusion.com
```

---

## 📊 Provider Comparison Matrix

| Feature | Amadeus | Kiwi.com | Duffel | TravelFusion |
|---------|---------|----------|--------|--------------|
| **Auth** | OAuth2 | API Key | Bearer Token | XML Login |
| **Format** | JSON | JSON | JSON | XML |
| **Complexity** | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| **Virtual Interlining** | ❌ | ✅ | ❌ | ❌ |
| **NDC Support** | ✅ | ❌ | ✅ | ✅ |
| **LCC Coverage** | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **GDS Coverage** | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Booking Type** | Sync | Async | Sync | Async |
| **Documentation** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |

---

## 🎯 Success Criteria

### Phase 1 (Mock Service)
- ✅ UI prikazuje mock rezultate
- ✅ Search forma funkcioniše
- ✅ Rezultati se prikazuju u kartama

### Phase 2 (Amadeus)
- ✅ Uspešna autentifikacija
- ✅ Search vraća realne rezultate
- ✅ Price validation funkcioniše
- ✅ Booking kreira PNR

### Phase 3 (Kiwi)
- ✅ Virtual Interlining rezultati
- ✅ Asinhroni booking sa polling-om
- ✅ Check flights validacija

### Phase 4 (Duffel)
- ✅ Offer creation
- ✅ Order creation
- ✅ Najbrža implementacija

### Phase 5 (TravelFusion)
- ✅ XML parsing
- ✅ Polling mehanizam
- ✅ LCC agregacija

---

## 📝 Changelog

### 2026-01-05
- ✅ Kreirana arhitektura dokumentacija
- 🟢 Započet Sprint 1: Osnove

---

## 🔗 Reference

- [Amadeus for Developers](https://developers.amadeus.com/)
- [Kiwi.com Tequila API](https://tequila.kiwi.com/portal/docs/tequila_api)
- [Duffel API Docs](https://duffel.com/docs/api)
- [TravelFusion XML API](https://www.travelfusion.com/developers)

---

**Sledeći Korak**: Implementacija `flight.types.ts`
