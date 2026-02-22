# Solvex API - Implementation Plan

## 🎯 Cilj
Integrisati Solvex (Master-Interlook) SOAP API za pretragu i rezervaciju hotela.

## 📋 Faze Implementacije

### Faza 1: Setup & Infrastructure ⏱️ 2-3h

#### 1.1 SOAP Client Setup
- [ ] Instalirati `soap` ili `axios` za SOAP zahteve
- [ ] Kreirati SOAP wrapper utility
- [ ] Testirati osnovnu konekciju

#### 1.2 Environment Configuration
- [ ] Dodati credentials u `.env`
- [ ] Ažurirati `.env.example`
- [ ] Kreirati config fajl za Solvex

#### 1.3 TypeScript Types
- [ ] Kreirati `types/solvex.types.ts`
- [ ] Definisati sve interfejse (Hotel, Room, Reservation, itd.)
- [ ] Tipizirati SOAP request/response objekte

### Faza 2: Core Services ⏱️ 4-5h

#### 2.1 Authentication Service
```typescript
// src/services/solvex/solvexAuthService.ts
- connect(): Promise<string> // Returns auth token
- checkConnect(guid: string): Promise<boolean>
- refreshToken(): Promise<string>
```

#### 2.2 Dictionary Service
```typescript
// src/services/solvex/solvexDictionaryService.ts
- getCountries()
- getCities(countryId?)
- getRegions()
- getHotels(cityId)
- getRoomTypes()
- getRoomCategories()
- getPansions()
- getAccommodations(hotelId)
- getTariffs()
```

#### 2.3 Search Service
```typescript
// src/services/solvex/solvexSearchService.ts
- searchHotelsMinPrice(params): Promise<HotelSearchResult[]>
- searchHotelsFull(params): Promise<HotelSearchResult[]>
- checkQuota(hotelId, dateFrom, dateTo)
- getQuotaInfo(hotelId, dateFrom, dateTo)
```

#### 2.4 Booking Service
```typescript
// src/services/solvex/solvexBookingService.ts
- createReservation(booking): Promise<Reservation>
- getReservation(externalId): Promise<Reservation>
- cancelReservation(externalId): Promise<boolean>
- getReservationPenalties(externalId)
- getCancellationPolicy(params)
```

### Faza 3: UI Components ⏱️ 3-4h

#### 3.1 Test Page
- [ ] Kreirati `SolvexTest.tsx` (kao OpenGreeceTest)
- [ ] Tab 1: Authentication test
- [ ] Tab 2: Dictionary loading
- [ ] Tab 3: Hotel search
- [ ] Tab 4: Booking test

#### 3.2 Search Integration
- [ ] Dodati Solvex u Global Hub Search
- [ ] Kombinovati rezultate sa OpenGreece
- [ ] Unified prikaz rezultata

### Faza 4: Advanced Features ⏱️ 2-3h

#### 4.1 Caching
- [ ] Cache auth token (localStorage)
- [ ] Cache dictionaries (IndexedDB)
- [ ] TTL management

#### 4.2 Error Handling
- [ ] SOAP error parser
- [ ] User-friendly poruke
- [ ] Retry logic za timeout

#### 4.3 Cancellation Policy Display
- [ ] Komponenta za prikaz penala
- [ ] Kalkulacija pre otkazivanja

### Faza 5: Testing & Optimization ⏱️ 2h

- [ ] Unit testovi za servise
- [ ] Integration testovi
- [ ] Performance optimization
- [ ] Documentation update

## 🔧 Tehnički Detalji

### SOAP Client Options

**Opcija 1: axios + xml2js**
```bash
npm install axios xml2js
npm install -D @types/xml2js
```

**Opcija 2: soap (Node.js)**
```bash
npm install soap
npm install -D @types/soap
```

**Opcija 3: Custom Fetch + XML Parser**
- Najlakša za Vite/React
- Bez dodatnih dependencija

### Folder Structure
```
src/
├── services/
│   └── solvex/
│       ├── solvexAuthService.ts
│       ├── solvexDictionaryService.ts
│       ├── solvexSearchService.ts
│       ├── solvexBookingService.ts
│       └── utils/
│           ├── soapClient.ts
│           └── xmlParser.ts
├── types/
│   └── solvex.types.ts
├── pages/
│   └── SolvexTest.tsx
└── utils/
    └── solvexXmlBuilder.ts
```

## 📊 Prioriteti

### Must Have (MVP)
1. ✅ Authentication (Connect)
2. ✅ Search Hotels (SearchHotelServicesMinHotel)
3. ✅ Create Booking (CreateReservation)
4. ✅ Get Reservation
5. ✅ Basic dictionaries (Countries, Cities, Hotels)

### Should Have
6. Cancel Reservation
7. Cancellation Policy
8. Full search (SearchHotelServices)
9. Quota check
10. All dictionaries

### Nice to Have
11. Advanced filtering
12. Price comparison
13. Multi-provider search
14. Booking history

## ⚠️ Challenges & Solutions

### Challenge 1: SOAP u React/Vite
**Problem:** SOAP nije native za browser  
**Solution:** Custom fetch wrapper sa XML building/parsing

### Challenge 2: Complex XML Structure
**Problem:** Veliki i kompleksni XML payloads  
**Solution:** XML builder utility + templates

### Challenge 3: Auth Token Management
**Problem:** Token expiration  
**Solution:** Auto-refresh + localStorage cache

### Challenge 4: Cyrillic Characters
**Problem:** Imena na ćirilici  
**Solution:** UTF-8 encoding + proper XML headers

## 📅 Timeline

| Faza | Trajanje | Status |
|------|----------|--------|
| Faza 1: Setup | 2-3h | 🔄 Pending |
| Faza 2: Services | 4-5h | ⏸️ Waiting |
| Faza 3: UI | 3-4h | ⏸️ Waiting |
| Faza 4: Advanced | 2-3h | ⏸️ Waiting |
| Faza 5: Testing | 2h | ⏸️ Waiting |
| **TOTAL** | **13-17h** | |

## 🚀 Next Steps

1. **Odluka:** Koju SOAP biblioteku koristiti?
2. **Setup:** Instalirati dependencies
3. **Proof of Concept:** Testirati Connect metod
4. **Iteracija:** Graditi servis po servis

---

**Created:** 2026-01-06  
**Status:** Planning Phase
