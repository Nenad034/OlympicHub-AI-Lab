# 🔌 ORS API Integration - Quick Start

## Šta je implementirano?

Implementirana je **Faza 1** ORS API integracije - svi core servisi za pretragu hotela:

### ✅ Implementirano
- **Authentication Service** - API key autentifikacija
- **Dictionary Service** - Regioni, gradovi, lokacije, meal plans
- **Search Service** - Regions, Products, Dates search
- **Provider Adapter** - Za integraciju sa GlobalHubSearch
- **Test Page** - Comprehensive test suite na `/ors-test`

### 🚧 U toku (Type fixes)
- Usklađivanje tipova sa postojećim `HotelProviderInterface`
- Dodavanje missing properties u type definitions

### 📋 Planirano (Faza 2)
- Booking functionality
- GlobalHubSearch integracija
- Advanced features (flight info, product details)

---

## 🚀 Kako testirati?

### 1. **Dodaj API Key**
```bash
# U .env fajl dodaj:
REACT_APP_ORS_API_KEY=your_api_key_here
```

### 2. **Pokreni aplikaciju**
```bash
npm run dev
```

### 3. **Otvori test stranicu**
```
http://localhost:3000/ors-test
```

### 4. **Testiraj funkcionalnosti**

**Dictionary Tests:**
- Get Languages - Lista podržanih jezika
- Get Regions - Sve regije
- Get Locations - Lokacije (paginirano)
- Search Location - Pretraga po imenu
- Get Service Codes - Meal plans (BB, HB, AI...)

**Search Tests:**
- Search Regions - Pretraga regiona
- Search Products - Pretraga hotela
- Search Dates - Dostupni termini
- **Full Hotel Search** - Kompletan search flow

---

## 📖 API Dokumentacija

### **Base URL**
```
https://api.ors.si/crs/v2
```

### **Authentication**
```typescript
headers: {
  'X-API-Key': 'your_api_key',
  'Accept-Language': 'en',
  'Content-Type': 'application/json'
}
```

### **Content Types**
- `hotel` - Samo smeštaj
- `pauschal` - Smeštaj + let (package)
- `trips` - Organizovana putovanja

---

## 💻 Primeri Korišćenja

### **1. Search Location**
```typescript
import { orsDictionaryService } from './services/ors/orsDictionaryService';

const locations = await orsDictionaryService.searchLocation('Porec', 'en');
console.log(locations); // Array of matching locations
```

### **2. Search Hotels**
```typescript
import { orsSearchService } from './services/ors/orsSearchService';

const results = await orsSearchService.searchHotels({
  dateFrom: '2026-07-01',
  dateTo: '2026-07-08',
  adults: 2,
  children: 0,
  cityName: 'Porec',
  language: 'en'
});

console.log(results); // Array of HotelSearchResult
```

### **3. Get Service Codes (Meal Plans)**
```typescript
import { orsDictionaryService } from './services/ors/orsDictionaryService';

const serviceCodes = await orsDictionaryService.getServiceCodes();
console.log(serviceCodes);
// {
//   'HP': { en: 'Half Board', hr: 'Polupansion', ... },
//   'AI': { en: 'All Inclusive', hr: 'All Inclusive', ... },
//   ...
// }
```

---

## 🔧 Struktura Servisa

```
ORS Integration
│
├── orsConstants.ts
│   ├── API Configuration
│   ├── Endpoints
│   ├── Enumerations
│   └── Rate Limiting
│
├── orsAuthService.ts
│   ├── API Key Management
│   ├── Request Headers
│   └── Rate Limit Check
│
├── orsDictionaryService.ts
│   ├── Languages
│   ├── Regions
│   ├── Locations
│   ├── Service Codes
│   ├── Room Types
│   └── Caching (24h TTL)
│
├── orsSearchService.ts
│   ├── Search Regions
│   ├── Search Products
│   ├── Search Dates
│   ├── Quick Search
│   └── Convert to Unified Format
│
└── OrsProvider.ts
    ├── Search Hotels
    ├── Map Parameters
    └── Provider Interface
```

---

## 🎯 ORS vs Solvex

| Feature | Solvex | ORS |
|---------|--------|-----|
| **Protocol** | SOAP/XML | **REST/JSON** ✅ |
| **Auth** | Connect() → GUID | **API Key** ✅ |
| **Complexity** | High | **Low** ✅ |
| **Content Types** | Hotels only | **3 types** ✅ |
| **Hotel IDs** | Internal | **GIATA** ✅ |
| **Optional Bookings** | ❌ | **✅** |

**Zaključak:** ORS je **lakši za integraciju** od Solvexa!

---

## 📝 Known Issues

### **Type Mismatches (U toku)**
```
- OrsSearchParams vs HotelSearchParams
- OrsLocationData missing 'id' property
- Date format conversions
```

**Status:** Biće popravljeno u sledećem koraku

---

## 📞 Podrška

### **ORS**
- Website: https://orstravel.com
- API Docs: https://api.ors.si/docs/v2
- Email: support@ors.si

### **Olympic Hub**
- Dokumentacija: `docs/02-api-integration/ors/`
- Test stranica: `/ors-test`

---

## ✅ Checklist za Production

- [ ] Dobiti production API key
- [ ] Testirati sa realnim podacima
- [ ] Popraviti type mismatches
- [ ] Dodati u GlobalHubSearch
- [ ] Implementirati booking
- [ ] Error handling
- [ ] Logging
- [ ] Rate limiting monitoring

---

**Status:** ✅ **CORE SERVICES READY FOR TESTING!**

Sledeći korak: Zatraži ORS API kredencijale i testiraj sa realnim podacima! 🚀
