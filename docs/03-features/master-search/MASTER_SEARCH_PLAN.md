# Master Search & Subagent System - Implementation Plan

**Datum kreiranja**: 2026-01-10  
**Status**: U razvoju - Faza 1  
**Verzija**: 1.0

---

## 📌 Pregled Projekta

Master Search je centralizovani modul pretrage koji objedinjuje sve postojeće tipove pretraga (smeštaj, letovi, transferi, usluge, putovanja) u jednu koherentnu celinu sa naprednim funkcionalnostima za kreiranje dinamičkih paketa i upravljanje subagentima.

---

## 🎯 Ciljevi

1. **Unifikacija Pretraga**: Sve vrste pretraga na jednom mestu
2. **Dynamic Package Builder**: Automatsko kreiranje paketa pri izboru 2+ komponenti
3. **Supplier Management**: Fleksibilan izbor dobavljača sa kontrolom pristupa
4. **Subagent System**: Kompletan B2B sistem za upravljanje subagentima
5. **Scalability**: Priprema za budući B2B portal

---

## 🏗️ Arhitektura Modula

### 1. Master Search Module

**Lokacija**: `src/pages/MasterSearch.tsx`

#### Tab Sistem
- 🏨 **Smeštaj** - Pretraga hotela (TCT, OpenGreece, ručni unos)
- ✈️ **Letovi** - Pretraga letova (Amadeus, Kiwi, ručni unos)
- 🚐 **Transfer** - Pretraga transfera (iz Dinamik Wizarda)
- 🎯 **Dodatne Usluge** - Izleti, restorani, ulaznice (iz Dinamik Wizarda)
- 🌍 **Putovanja** - Grupna putovanja

#### Dynamic Mode Logika
```
IF (selectedTabs.length >= 2) {
  MODE = "Dynamic Package"
  WORKFLOW = [
    Step 1: Prevoz (let/bus)
    Step 2: Smeštaj
    Step 3: Dodatne usluge (opciono)
  ]
} ELSE {
  MODE = "Single Search"
  SHOW = Rezultati za izabrani tab
}
```

#### Supplier Selector
- Checkbox lista svih dobavljača
- Grupisanje: API vs Ručni unos
- Vidljivost kontrolisana preko `userLevel` i `allowedAPIs`
- Search funkcionalnost
- "Select All" / "Deselect All"

#### Sortiranje Rezultata
- **Uvek**: Od najniže ka višoj ceni
- Kombinovani rezultati iz svih izabranih dobavljača
- Filter opcije (zvezdice, lokacija, ocena...)

---

### 2. Subagent Admin Panel

**Lokacija**: `src/pages/SubagentAdmin.tsx`

#### Funkcionalnosti

##### 2.1 Upravljanje Subagentima
- Lista svih subagenata (tabela sa paginacijom)
- CRUD operacije (Create, Read, Update, Delete)
- Status management (Active, Suspended, Pending)
- Search i filter opcije

##### 2.2 Dozvole i Pristup
```typescript
interface SubagentPermissions {
  allowedAPIs: string[];        // ['tct', 'opengreece', 'amadeus']
  allowedSuppliers: string[];   // ['supplier-1', 'supplier-2']
  canCreateReservations: boolean;
  canViewFinancials: boolean;
  canDownloadDocuments: boolean;
}
```

##### 2.3 Provizije
```typescript
interface CommissionRates {
  accommodation: number;  // % provizija za smeštaj
  flights: number;        // % provizija za letove
  transfers: number;      // % provizija za transfere
  services: number;       // % provizija za usluge
  tours: number;          // % provizija za putovanja
  globalRate?: number;    // Globalna provizija (override)
}
```

##### 2.4 Finansijski Dashboard
- Ukupan promet (total revenue)
- Ukupna provizija (total commission)
- Trenutno stanje (balance)
- Dugovanja (outstanding)
- Istorija transakcija
- Grafički prikaz (charts)

##### 2.5 Izveštaji
- Mesečni izveštaji po subagentu
- Export u Excel/PDF
- Filter po periodu
- Komparacija performansi

---

### 3. Data Models

#### Subagent Model
```typescript
interface Subagent {
  id: string;
  name: string;
  companyName: string;
  email: string;
  phone: string;
  address: string;
  taxId: string;
  registrationNumber: string;
  
  // Pristup i dozvole
  permissions: SubagentPermissions;
  
  // Provizije
  commissionRates: CommissionRates;
  
  // Finansije
  financials: {
    totalRevenue: number;
    totalCommission: number;
    balance: number;
    outstanding: number;
    lastPaymentDate: string;
  };
  
  // Status
  status: 'Active' | 'Suspended' | 'Pending';
  createdAt: string;
  updatedAt: string;
  
  // Kontakt osoba
  contactPerson: {
    name: string;
    email: string;
    phone: string;
  };
}
```

#### Dynamic Package Model
```typescript
interface DynamicPackage {
  id: string;
  name: string;
  components: {
    transport?: TransportComponent;
    accommodation?: AccommodationComponent;
    transfers?: TransferComponent[];
    services?: ServiceComponent[];
  };
  totalPrice: number;
  currency: string;
  passengers: Passenger[];
  status: 'Draft' | 'Confirmed' | 'Cancelled';
  createdBy: string;
  createdAt: string;
}
```

---

## 🚀 Faze Implementacije

### **Faza 1: Master Search - Osnovna Struktura** ⏳ (U toku)

**Fajlovi za kreiranje:**
- `src/pages/MasterSearch.tsx`
- `src/pages/MasterSearch.css`
- `src/components/SupplierSelector.tsx`
- `src/components/SearchTabBar.tsx`

**Zadaci:**
1. ✅ Kreiranje osnovne strukture komponente
2. ✅ Implementacija tab sistema
3. ✅ Detekcija Dynamic Mode (2+ tabova)
4. ✅ Supplier Selector UI
5. ✅ Integracija sa postojećim search modulima
6. ✅ Dodavanje u Dashboard
7. ✅ Kreiranje rute

**Očekivano trajanje**: 2-3 sata

---

### **Faza 2: Dynamic Package Workflow** 📅 (Sledeća)

**Fajlovi za kreiranje:**
- `src/components/DynamicPackageBuilder.tsx`
- `src/components/PackageCart.tsx`
- `src/components/PackageSteps.tsx`

**Zadaci:**
1. Step-by-step wizard (Prevoz → Smeštaj → Usluge)
2. Korpa za dodavanje komponenti
3. Kalkulacija ukupne cene
4. Preview paketa
5. Kreiranje rezervacije iz paketa

**Očekivano trajanje**: 4-5 sati

---

### **Faza 3: Subagent Admin Panel** 📅 (Planirana)

**Fajlovi za kreiranje:**
- `src/pages/SubagentAdmin.tsx`
- `src/pages/SubagentAdmin.css`
- `src/components/SubagentForm.tsx`
- `src/components/SubagentFinancials.tsx`
- `src/stores/subagentStore.ts`

**Zadaci:**
1. CRUD operacije za subagente
2. Dozvole i API pristup UI
3. Provizije i finansije
4. Dashboard sa statistikama
5. Izveštaji i export

**Očekivano trajanje**: 6-8 sati

---

### **Faza 4: B2B Portal** 📅 (Budućnost)

**Fajlovi za kreiranje:**
- `src/pages/B2BPortal.tsx`
- `src/pages/B2BLogin.tsx`
- `src/pages/B2BReservations.tsx`
- `src/pages/B2BFinancials.tsx`
- `src/pages/B2BDocuments.tsx`

**Funkcionalnosti:**
1. Poseban login za subagente
2. Ograničeni Master Search (samo dozvoljeni API-ji)
3. Pregled svih svojih rezervacija
4. Finansijski dashboard
5. Download dokumenata (profakture, voucher-i, računi)
6. Notifikacije i poruke

**Očekivano trajanje**: 10-12 sati

---

## 🔐 Nivoi Pristupa

### User Types
```typescript
type UserType = 'Admin' | 'Employee' | 'Subagent';
```

### Access Matrix

| Funkcionalnost | Admin | Employee | Subagent |
|----------------|-------|----------|----------|
| Master Search (svi API-ji) | ✅ | ✅ | ❌ |
| Master Search (dozvoljeni API-ji) | ✅ | ✅ | ✅ |
| Kreiranje rezervacija | ✅ | ✅ | ✅ |
| Subagent Admin Panel | ✅ | ❌ | ❌ |
| Finansijski izveštaji (svi) | ✅ | ✅ | ❌ |
| Finansijski izveštaji (sopstveni) | ✅ | ✅ | ✅ |
| API konfiguracija | ✅ | ❌ | ❌ |
| B2B Portal pristup | ❌ | ❌ | ✅ |

---

## 📊 Integracija sa Postojećim Modulima

### Ne menjamo:
- ❌ `GlobalHubSearch.tsx` - Ostaje nezavisan
- ❌ `FlightBooking.tsx` - Ostaje nezavisan
- ❌ `PackageSearch.tsx` (Dinamik Wizard) - Ostaje nezavisan

### Koristimo:
- ✅ Servise iz postojećih modula
- ✅ Komponente za prikaz rezultata
- ✅ API konekcije
- ✅ Data models

### Dodajemo:
- ✅ Master Search kao novi entry point
- ✅ Wrapper komponente za unifikaciju
- ✅ Subagent sistem kao novi layer

---

## 🎨 Dizajn Principi

1. **Konzistentnost**: Koristi postojeću premium dark temu
2. **Responsivnost**: Mobile-first pristup
3. **Performance**: Lazy loading, optimizacija
4. **UX**: Intuitivna navigacija, jasni call-to-action
5. **Accessibility**: ARIA labels, keyboard navigation

---

## 📝 Tehnički Stack

- **Frontend**: React + TypeScript
- **State Management**: Zustand stores
- **Styling**: CSS Modules + CSS Variables
- **Icons**: Lucide React
- **Animations**: Framer Motion
- **Forms**: React Hook Form (za Subagent Admin)
- **Charts**: Recharts (za finansijske dashboarde)

---

## 🧪 Testing Plan

### Faza 1 Testing
- [ ] Tab switching funkcioniše
- [ ] Dynamic mode se aktivira sa 2+ tabova
- [ ] Supplier selector filtrira rezultate
- [ ] Integracija sa postojećim pretragama radi

### Faza 2 Testing
- [ ] Step wizard navigacija
- [ ] Dodavanje u korpu
- [ ] Kalkulacija cene
- [ ] Kreiranje rezervacije

### Faza 3 Testing
- [ ] CRUD operacije za subagente
- [ ] Dozvole se primenjuju
- [ ] Provizije se kalkulišu tačno
- [ ] Finansijski izveštaji tačni

---

## 📅 Timeline

| Faza | Trajanje | Početak | Završetak |
|------|----------|---------|-----------|
| Faza 1 | 2-3h | 2026-01-10 | 2026-01-10 |
| Faza 2 | 4-5h | TBD | TBD |
| Faza 3 | 6-8h | TBD | TBD |
| Faza 4 | 10-12h | TBD | TBD |

**Ukupno**: ~25-30 sati čistog razvoja

---

## 🔄 Git Workflow

### Branch Strategy
- `main` - Production ready kod
- `develop` - Development branch
- `feature/master-search` - Master Search modul
- `feature/subagent-admin` - Subagent Admin
- `feature/b2b-portal` - B2B Portal

### Commit Convention
```
feat: Add Master Search tab system
fix: Correct supplier selector filtering
docs: Update Master Search plan
style: Improve MasterSearch CSS
refactor: Extract SupplierSelector component
```

---

## 📚 Dokumentacija

### Za Developere
- Ovaj dokument (MASTER_SEARCH_PLAN.md)
- API dokumentacija (TBD)
- Component documentation (JSDoc)

### Za Korisnike
- User manual (TBD)
- Video tutorial (TBD)
- FAQ (TBD)

---

## 🐛 Known Issues & Future Improvements

### Known Issues
- Nema (još uvek u razvoju)

### Future Improvements
1. Real-time search results (WebSocket)
2. Advanced filtering (AI-powered)
3. Price prediction (ML model)
4. Multi-language support
5. Mobile app (React Native)

---

## 📞 Kontakt & Support

**Developer**: Antigravity AI  
**Project Owner**: Nenad (Olympic Travel)  
**Start Date**: 2026-01-10  

---

## 📄 Changelog

### Version 1.0 (2026-01-10)
- Initial plan creation
- Defined all 4 phases
- Created data models
- Established architecture

---

**Poslednja izmena**: 2026-01-10 08:59  
**Status**: Faza 1 u toku
