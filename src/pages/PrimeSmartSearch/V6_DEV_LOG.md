# PrimeSmartSearch V6 — Razvojni Dnevnik (Dev Log)

> **Autor:** Antigravity AI + Nenad  
> **Projekat:** PrimeClickToTravel — refaktorisano  
> **Modul:** `src/pages/PrimeSmartSearch/`  
> **Pokrenuto:** 2026-03-21  
> **Status:** 🟢 Aktivno u razvoju

---

## 📐 Arhitektura Modula (Pregled)

```
src/pages/PrimeSmartSearch/
├── PrimeSmartSearch.tsx          ← Glavni hub (integrator)
├── types.ts                      ← Sve TypeScript definicije
├── V6_TECHNICAL_DOCUMENTATION.md ← "Sveti Gral" specifikacija
├── V6_DEV_LOG.md                 ← OVAJ FAJL (razvojni dnevnik)
│
├── stores/
│   └── useSearchStore.ts         ← Zustand state (globalni)
│
├── styles/
│   └── PrimeSmartSearch.css      ← Izolovani V6 CSS Design System
│
├── components/
│   ├── SearchTabs/               ← 8 tabova navigacije
│   ├── PaxSummaryBanner/         ← Sticky putnici-sažetak
│   ├── OccupancyWizard/          ← Soba-po-soba putnici
│   ├── FilterBar/                ← Filteri i sortiranje
│   ├── HotelSearchForm/          ← Forma za hotel pretragu
│   ├── HotelCard/                ← Hotel kartica (mosaic)
│   ├── HotelRoomWizard/          ← Classic Clarity sobe
│   ├── SmartConcierge/           ← Floating upsell bubbles
│   ├── PackageBasketBar/         ← Sticky korpa
│   ├── ItineraryExport/          ← PDF/HTML/Share export
│   ├── FlightSearchForm/         ← ✈️ Forma za letove
│   └── FlightCard/               ← ✈️ Kartica leta
│
└── data/
    ├── mockResults.ts            ← Mock hotel podaci
    └── mockFlights.ts            ← Mock letovi podaci
```

---

## ═══════════════════════════════════════════════════════════
## FAZA 1 — Foundation (Temelji)
### Datum: 2026-03-21 | Status: ✅ ZAVRŠENO
## ═══════════════════════════════════════════════════════════

### Korak F1.1 — `types.ts` (Kompletni tip sistem)

**Fajl:** `src/pages/PrimeSmartSearch/types.ts`  
**Šta je urađeno:**
- Definisani svi TypeScript interfejsi za 8 modula
- `SearchTabType` — unija za 8 tabova
- `AvailabilityStatus` — `'instant' | 'on-request' | 'sold-out'` (Semafor logika)
- `RoomAllocation` — struktura jedne sobe (adults + children + childrenAges[])
- `PaxSummary` — izvedeni podaci za prikaz
- `SearchFilters` — zvezdice, obroci, budžet, instant-only
- `PackageBasketItem` — stavka korpe (tip, cena, status)
- `ProviderRef` — Failover Provider ID (kritično za booking recovery)
- `RoomOption` + `MealPlanOption` — Classic Clarity sobe
- `HotelSearchResult` — Unified result sa `primaryProvider` i `failoverProvider`
- `SearchAlert` — validacioni i info alertovi
- `ConciergeOffer` — Smart Concierge upsell
- `SearchState` — kompletan shape Zustand stora

**Ključne odluke:**
- `failoverProvider?: ProviderRef` — silent booking recovery ako primarni provajder ne može da potvrdi
- `lowestTotalPrice` uvek prikazuje **ukupnu cenu za celu grupu**, nikad po osobi

---

### Korak F1.2 — `stores/useSearchStore.ts` (Zustand Store)

**Fajl:** `src/pages/PrimeSmartSearch/stores/useSearchStore.ts`  
**Šta je urađeno:**
- Kompletni Zustand store sa svim akcijama za sve module
- `calcPaxSummary()` helper — izračunava noćenja, ukupne putnike, età dece
- `calcBasketTotal()` helper — zbir svih stavki u korpi
- Auto-sync `childrenAges[]` sa brojem dece (dodaje default uzrast 5, skraćuje niz)
- `dismissAlert()` — po ID-u, bez duplikata
- `resetFilters()` — vraća defaultne filter vrednosti

**Inicijalni state:**
```typescript
roomAllocations: [{ adults: 2, children: 0, childrenAges: [] }]
nationality: 'RS'
sortBy: 'smart'
filters: { stars: ['all'], mealPlans: ['all'], ... }
```

---

### Korak F1.3 — Router (`src/router/index.tsx`)

**Šta je urađeno:**
- Lazy import `PrimeSmartSearch` komponente
- Dodata ruta `/prime-smart-search`
- Izolovana od ostalih modula (nema uticaja na druge rute)

---

## ═══════════════════════════════════════════════════════════
## FAZA 2 — Design System + Navigacija
### Datum: 2026-03-21 | Status: ✅ ZAVRŠENO
## ═══════════════════════════════════════════════════════════

### Korak F2.1 — `styles/PrimeSmartSearch.css`

**Fajl:** `src/pages/PrimeSmartSearch/styles/PrimeSmartSearch.css`  
**Šta je urađeno:**
- Kompletni CSS Design System sa CSS Custom Properties (varijable)
- Light i Dark mode podržani kroz `.v6-dark` klasu
- **Semafor logika boja:**
  - `--v6-color-instant` → `#059669` (Emerald — odmah potvrđeno ⚡)
  - `--v6-color-on-request` → `#d97706` (Amber — na upit ❓)
  - `--v6-color-prime` → `#b45309` (Gold — PRIME inventar 🏆)
- **Tipografija:** `--v6-font: 'Inter', -apple-system, sans-serif`
- **Spacing tokens:** `--v6-radius-sm/md/lg/xl`
- **Shadow tokens:** `--v6-shadow-sm/md/lg`
- **Grid:** `v6-results-grid` (auto-fill, min 300px, max 1fr)
- **Skeleton animacija:** `v6-skeleton-shimmer` keyframe
- **Fade-in animacija:** `v6-fade-in` sa `animationDelay` za stagger efekat
- Responsive breakpointi: 1200px, 768px, 480px
- **IZOLACIJA:** Svi stilovi striktno pod `.v6-prime-hub` roditeljskim selektorom

**Neizolovani stilovi koje NISMO menjali:** NULA — striktna izolacija

---

### Korak F2.2 — `components/SearchTabs/SearchTabs.tsx`

**Fajl:** `src/pages/PrimeSmartSearch/components/SearchTabs/SearchTabs.tsx`  
**Šta je urađeno:**
- 8 tabova sa emoji ikonama i punim nazivima
- ARIA `role="tablist"` + `role="tab"` + `aria-selected` + `aria-controls`
- Klik menja `activeTab` u store i resetuje rezultate/alertove

**8 tabova:**
| Tab ID | Emoji | Naziv |
|--------|-------|-------|
| `hotel` | 🛏️ | Smeštaj |
| `flight` | ✈️ | Letovi |
| `package` | 📦 | Paketi |
| `car` | 🚗 | Rent-a-Car |
| `things-to-do` | 🎟️ | Izleti |
| `cruise` | 🚢 | Krstarenja |
| `charter` | 🎫 | Čarteri |
| `tour` | 🌍 | Putovanja |

---

### Korak F2.3 — `components/PaxSummaryBanner/PaxSummaryBanner.tsx`

**Fajl:** `src/pages/PrimeSmartSearch/components/PaxSummaryBanner/PaxSummaryBanner.tsx`  
**Šta je urađeno:**
- Sticky banner koji uvek prikazuje ko/kada/koliko soba
- Čita iz `useSearchStore()` i koristi `calcPaxSummary()`
- Prikazuje decu sa uzrastima: `2 odr. + 1 dete (7 god) · 1 soba`
- Sakriva se kada nema datuma (inicijalno stanje)

---

## ═══════════════════════════════════════════════════════════
## FAZA 3 — Hotel Forma + Mosaic Prikaz
### Datum: 2026-03-21 | Status: ✅ ZAVRŠENO
## ═══════════════════════════════════════════════════════════

### Korak F3.1 — `components/OccupancyWizard/OccupancyWizard.tsx`

**Fajl:** `src/pages/PrimeSmartSearch/components/OccupancyWizard/OccupancyWizard.tsx`  
**Šta je urađeno:**
- Dropdown panel koji se otvara iz HotelSearchForm
- Soba-po-soba alokacija sa Dodaj/Ukloni sobu (max 5 soba)
- Counter za odrasle (min 1, max 6) i decu (min 0, max 4) po sobi
- Dinamički dropdown za uzrast svakog deteta (0–17 godina)
- Auto-sync: kada se smanji broj dece → skraćuje `childrenAges[]`
- Inline stilovi (ne CSS klase) za maksimalnu izolaciju
- `onClose` callback na klik van panela (via `useEffect`)

---

### Korak F3.2 — `components/HotelSearchForm/HotelSearchForm.tsx`

**Fajl:** `src/pages/PrimeSmartSearch/components/HotelSearchForm/HotelSearchForm.tsx`  
**Šta je urađeno:**
- Destinacija tagging sistem (Enter potvrda, max 3 destinacije, Badge + X uklanjanje)
- Datumi: `checkIn` + `checkOut` sa min datumima
- Fleksibilni datumi: ±0/±3/±7 dana (radio-style dugmad)
- Integracija sa `OccupancyWizard` komponentom
- Validacija pre pretrage: destinacija obavezna, datumi, checkOut > checkIn
- Async submit simulacija (1.6s loading)
- Alert sistem za validacione greške

---

### Korak F3.3 — `components/HotelCard/HotelCard.tsx`

**Fajl:** `src/pages/PrimeSmartSearch/components/HotelCard/HotelCard.tsx`  
**Šta je urađeno:**
- **PRIME badge** (zlatni) za vlastiti inventar
- **Semafor badge**: ⚡ Odmah (emerald) / ❓ Na upit (amber)
- Lazy-load slika sa fallback gradijentom
- Zvezdice sa bojom #f59e0b
- Ocena gostiju (numerička + tekst: Izvanredno/Odlično/Dobro)
- Cena: **Ukupna za sve putnike** (pax breakdown ispod)
- `onViewOptions` callback za otvaranje Room Wizard-a
- Stagger animacija (index × 0.07s delay)
- Hover: `translateY(-4px)` + pojačana senka

---

## ═══════════════════════════════════════════════════════════
## FAZA 4 — FilterBar + Room Wizard + Mock Data
### Datum: 2026-03-21 | Status: ✅ ZAVRŠENO
## ═══════════════════════════════════════════════════════════

### Korak F4.1 — `components/FilterBar/FilterBar.tsx`

**Fajl:** `src/pages/PrimeSmartSearch/components/FilterBar/FilterBar.tsx`  
**Šta je urađeno:**
- Toggle dugmad za zvezdice (3★/4★/5★) — multi-select
- Toggle dugmad za obrok (RO/BB/HB/FB/AI) — multi-select
- ⚡ Samo odmah — instant-only filter toggle
- Reset dugme (crveni border) — pojavljuje se samo kada ima aktivnih filtera
- Broj pronađenih hotela (leva strana)
- Sort select (Preporučeno/Cena rastuće/Cena opadajuće/Zvezdice/Ocena)
- **Ne prikazuje se** dok nema rezultata pretrage

---

### Korak F4.2 — `data/mockResults.ts`

**Fajl:** `src/pages/PrimeSmartSearch/data/mockResults.ts`  
**Šta je urađeno:**
- 6 realnih hotel rezultata sa Crnogorske rivijere
- PRIME hoteli: Splendid 5★, Slovenska Plaža 4★
- Razni statusi: instant i on-request
- Failover provideri (Avala Resort: Solvex primari + WebBeds failover)
- `MOCK_ROOM_OPTIONS` — 4 tipa soba sa po 2-3 usluge svaka

**Mock hoteli:**
| Hotel | Stars | Status | Cena | Provider |
|-------|-------|--------|------|----------|
| Splendid Conference & Spa | 5★ | ⚡ | 2800€ | Manual DB (PRIME) |
| Slovenska Plaža | 4★ | ⚡ | 1650€ | Manual DB (PRIME) |
| Avala Resort & Villas | 5★ | ⚡ | 3450€ | Solvex + WebBeds failover |
| Hunguest Sun Resort | 4★ | ❓ | 1250€ | Solvex |
| Regent Porto Montenegro | 5★ | ⚡ | 5800€ | Amadeus |
| Hotel Monte Casa | 3★ | ⚡ | 680€ | Solvex |

---

### Korak F4.3 — `components/HotelRoomWizard/HotelRoomWizard.tsx`

**Fajl:** `src/pages/PrimeSmartSearch/components/HotelRoomWizard/HotelRoomWizard.tsx`  
**Šta je urađeno:**

**Classic Clarity Format:**
- Modal overlay (fiksni, 900px max-width, 90vh scroll)
- Header: Naziv hotela + zvezdice + lokacija + PRIME badge
- PAX Summary banner unutar modala (ko/kad/koliko)
- **Slot-based**: Soba 1 = Alokacija 1, Soba 2 = Alokacija 2...
- Za svaki slot: numerisani krug + naziv sobe + pax info
- Sobe se filtriraju: prikazuju se samo one koje fituju alokaciju
- **Svaka usluga = jedan red u tabeli:**
  - Pun naziv usluge (Noćenje sa doručkom, Polupansion, All Inclusive...)
  - Semafor status badge (⚡ / ❓)
  - **UKUPNA cena za sve putnike i sva noćenja** (prominentno)
  - Pax breakdown ispod cene: `2 odr + 1 dete (7 god) · 7 noćenja`
  - Otkazivanje info (zeleno ako FREE, crveno ako nije)
  - Dugme "Odaberi →" ili "✓ Izabrano"
- **Live Footer:**
  - Živi zbir svih izabranih soba (ažurira se odmah)
  - Lista izabranih stavki (Soba 1: Standard BB — 980€)
  - Dugme "Nastavi ka rezervaciji" — sivo ako nisu sve sobe izabrane, zeleno kada jeste

---

## ═══════════════════════════════════════════════════════════
## FAZA 5 — Smart Features (Concierge + Export + Basket)
### Datum: 2026-03-21 | Status: ✅ ZAVRŠENO
## ═══════════════════════════════════════════════════════════

### Korak F5.1 — `components/SmartConcierge/SmartConcierge.tsx`

**Fajl:** `src/pages/PrimeSmartSearch/components/SmartConcierge/SmartConcierge.tsx`  
**Šta je urađeno:**
- Floating bubble sistem (dno-desno, z-index 1500)
- Aktivira se kada korisnik izabere hotel (prop: `activeHotelCity`)
- Ponude se mapiraju po gradu destinacije (budva/tivat/herceg-novi)
- Max 3 ponude odjednom
- Slide-in animacija sa različitim delay-evima (0ms, 400ms, 800ms)
- Svaka ponuda ima: naslov, opis, cena/os, "Dodaj +" / "Ne hvala"
- "Dodaj +" → stavka ide direktno u `packageBasket`
- "Ne hvala" ili X → slide-out animacija + uklanjanje iz liste
- `'🎩 PRIME PREPORUKE'` label iznad kartica

**Ponude po destinaciji:**
- **Budva:** Transfer Tivat→Hotel (35€), Sunset Boat Tour (45€), Putno osiguranje (18€)
- **Tivat:** Porto Montenegro Tour (30€)
- **Herceg Novi:** Transfer do Dubrovnika (55€)

---

### Korak F5.2 — `components/ItineraryExport/ItineraryExport.tsx`

**Fajl:** `src/pages/PrimeSmartSearch/components/ItineraryExport/ItineraryExport.tsx`  
**Šta je urađeno:**
- Modal overlay (520px, centiran)
- Jedinstveni ID ponude: `Math.random().toString(36).substring(2,8).toUpperCase()`
- **PDF Print:** Otvara novi prozor, upisuje kompletni HTML, poziva `window.print()`
- **HTML Download:** `Blob` + `URL.createObjectURL()` → `.html` fajl sa brendiranim layoutom
- **HTML Template** uključuje:
  - Tamni header sa logom "✈ PrimeClick Travel"
  - PAX summary banner
  - Tabela stavki (hotel + korpa items)
  - **Ukupna cena** prominentno
  - Share link sekcija
  - Footer sa legal napomenom
  - Print @media query
- **Kopiraj link:** `navigator.clipboard.writeText()` + fallback za starije browsere
- **Share Hub** dugmad:
  | Kanal | Link |
  |-------|------|
  | 🟢 WhatsApp | `wa.me/?text=...` |
  | 🔵 Viber | `viber://forward?text=...` |
  | 🔷 Telegram | `t.me/share/url?url=...` |
  | 📘 Facebook | `facebook.com/sharer/...` |
  | 📨 Email | `mailto:?subject=...&body=...` |

---

### Korak F5.3 — `components/PackageBasketBar/PackageBasketBar.tsx`

**Fajl:** `src/pages/PrimeSmartSearch/components/PackageBasketBar/PackageBasketBar.tsx`  
**Šta je urađeno:**
- Sticky dno stranice (z-index 500)
- Prikazuje se samo kada `packageBasket.length > 0`
- Stavke kao "chips" sa emoji + naziv + cena + X dugme
- Zbir samo Extras stavki (transferi, aktivnosti...)
- `onExport` callback → otvara `ItineraryExport` modal
- Box shadow prema gore za "lebdeći" efekat

---

## ═══════════════════════════════════════════════════════════
## MODUL: LETOVI (✈️)
### Datum: 2026-03-21 | Status: ✅ ZAVRŠENO
## ═══════════════════════════════════════════════════════════

### Korak L1.1 — Tipovi za Letove (`types.ts` proširenje)

**Dodate definicije:**
```typescript
type CabinClass = 'economy' | 'premium' | 'business' | 'first'
type TripType   = 'roundtrip' | 'oneway' | 'multicity'

interface FlightSearchParams { ... }  // Parametri pretrage
interface FlightSegment { ... }       // Jedan segment (BEG→VIE)
interface FlightLeg { ... }           // Jedan pravac (sa presedanjima)
interface FlightSearchResult { ... }  // Kompletan rezultat (polazak+povratak)
```

**Store proširenje:**
```typescript
flightSearchParams: FlightSearchParams | null
flightResults: FlightSearchResult[]
selectedFlight: FlightSearchResult | null

// Akcije:
setFlightSearchParams(params)
setFlightResults(results)
setSelectedFlight(flight)
```

---

### Korak L1.2 — `components/FlightSearchForm/FlightSearchForm.tsx`

**Fajl:** `src/pages/PrimeSmartSearch/components/FlightSearchForm/FlightSearchForm.tsx`  
**Šta je urađeno:**

**Forma polja:**
- **Tip leta:** Povratni ↔ | U jednom pravcu → | Više destinacija ⊕
- **Airport Autocomplete** (za polazak i odredište):
  - 20 aerodroma u bazi (BEG, TIV, VIE, MUC, CDG, LHR, IST...)
  - Pretraga po gradu, IATA kodu ili nazivu aerodroma
  - Min 2 karaktera za filtriranje
  - Dropdown sa `listbox` ARIA rolom
  - IATA kod u mono fontu (zelena boja)
- **⇄ Swap dugme:** Zamenjuje polazak i odredište uz rotate(180deg) animaciju
- **Datumi:** `checkIn` + `checkOut` (datum povratka vidljiv samo za roundtrip)
- **Pax counteri** (3 tipa, inline):
  - Odrasli (12+ god) — min 1
  - Deca (2–11 god) — min 0
  - Bebe (0–2 god) — min 0
  - Ukupno max 9 putnika
- **Klasa** select: Ekonomska / Premium ekonomska / Biznis / Prva
- **Samo direktni letovi** checkbox

**Validacija:**
1. Polazni aerodrom obavezan
2. Odredišni aerodrom obavezan
3. Polazak ≠ Odredište
4. Datum polaska obavezan
5. Datum povratka obavezan (za roundtrip)
6. Povratak mora biti posle polaska

---

### Korak L1.3 — `data/mockFlights.ts`

**Fajl:** `src/pages/PrimeSmartSearch/data/mockFlights.ts`  
**Šta je urađeno:** 4 mock itinerera BEG→TIV (roundtrip):

| # | Aviokompanija | Tip | Cena | Status |
|---|---------------|-----|------|--------|
| 1 | Air Serbia | Direktni (PRIME) | 198€ | ⚡ Odmah |
| 2 | Air Serbia | 1 presedanje BEG→VIE→TIV | 166€ | ⚡ Odmah |
| 3 | Turkish Airlines | 1 presedanje BEG→IST→TIV | 144€ | ⚡ Odmah |
| 4 | Wizz Air | Direktni (Budget) | 120€ | ⚡/❓ Mix |

**Svaki let sadrži:**
- Realni brojevi letova (JU 480, TK 1050...)
- Tačna vremena polaska/dolaska
- Trajanje segmenata u minutima
- Čekanje na presedanju (stopoverDuration)
- Fare brand (FLEX/LITE/BASIC/ECONOMY)
- Prtljag info (baggageIncluded, checkedBagIncluded)
- Povratnost karte (isRefundable)

---

### Korak L1.4 — `components/FlightCard/FlightCard.tsx`

**Fajl:** `src/pages/PrimeSmartSearch/components/FlightCard/FlightCard.tsx`  
**Šta je urađeno:**

**Layout kartice (vertikalan za listu):**
- Header: Logo aviokompanje + Naziv + PRIME badge + Fare badge + Status badge
- Body (po pravcu — polazak + povratak):
  - `LegView` komponenta sa timeline vizualizacijom
  - Vreme polaska (bold, XL) → [linija sa trajanjem] → Vreme dolaska
  - Krug presedanja na liniji (žut) za direktne letovi (avion emoji)
  - Ispod linije: "Direktno ✓" ili "1 presedanje · VIE · čekanje 2h 15m"
  - Broj leta ispod: "JU 480 · ATR 72"
- Prtljag chips: ✓/✗ Ručni prtljag, ✓/✗ Kufer uključen, ✓ Povrat karata
- Footer: Ukupna cena / po osobi + `Odaberi let →` dugme

**Fare Brand Boje:**
| Brand | Boja |
|-------|------|
| FLEX  | Emerald |
| PLUS  | Blue |
| LITE  | Amber |
| BASIC | Gray |
| ECONOMY | Gray |

**Odaberi let →** akcija:
- Dodaje let u `packageBasket` kao `type: 'flight'` stavku
- Label: `✈ Air Serbia`
- Details: `BEG → TIV · Direktno · FLEX`

---

## ═══════════════════════════════════════════════════════════
## SLEDEĆI MODULI — Plan
## ═══════════════════════════════════════════════════════════

### 📦 MODUL: Dinamički Paket (Package Wizard)
- [x] **Korak P1** — Tipovi: `DynamicPackage`, `PackageWizardStep`, `TransferOption`, `ActivityOption`
- [x] **Korak P2** — `data/mockPackageData.ts` — Transferi, aktivnosti, osiguranje
- [x] **Korak P3** — `PackageWizard.tsx` — Glavni multi-step kontejner sa stepper + Price Build-Up paneom
- [x] **Korak P4** — `Step1_Search.tsx` — Destinacija, datumi, putnici (zajednički parametri)
- [x] **Korak P5** — `Step2_Flights.tsx` — Izbor leta iz liste (korisitmo FlightCard)
- [x] **Korak P6** — `Step3_Hotel.tsx` — Izbor hotela + sobe (koristimo HotelCard + RoomWizard light)
- [x] **Korak P7** — `Step4_Transfer.tsx` — Izbor transfera (aerodrom↔hotel)
- [x] **Korak P8** — `Step5_Extras.tsx` — Aktivnosti, izleti, osiguranje
- [x] **Korak P9** — `Step6_Summary.tsx` — Pregled + Price Build-Up + Rezervacija + Export
- [x] **Korak P10** — Integracija u `PrimeSmartSearch.tsx` (tab 'package')

### 🚗 MODUL: Rent-a-Car
- [ ] `CarSearchForm.tsx` — Lokalitet preuzimanja/vraćanja, datumi, tip vozila
- [ ] `mockCarResults.ts` — Mock vozila (Economy, Combi, SUV, Van)
- [ ] `CarCard.tsx` — Kartica vozila sa slikom, kategorijom, opremom, cenom/dan + ukupno
- [ ] Dodaj u store: `carResults`, `setCarResults`

### 🎟️ MODUL: Izleti & Aktivnosti
- [ ] `ActivitySearchForm.tsx` — Grad, datum, tip aktivnosti
- [ ] `mockActivities.ts` — Tours, sport, kultura...
- [ ] `ActivityCard.tsx` — Slika, trajanje, uključeno, polazak, cena
- [ ] Integracija sa Smart Concierge

### 🚢 MODUL: Krstarenja
- [ ] `CruiseSearchForm.tsx` — Polazna luka, destinacioni region, trajanje
- [ ] `mockCruises.ts` — MSC, Costa, Royal Caribbean...
- [ ] `CruiseCard.tsx` — Brod, itinerer, kabine, cena

### 🎫 MODUL: Čarteri / Allotment
- [ ] `CharterSearchForm.tsx` — Relacija, čarter kalendar
- [ ] Direktna konekcija sa Manual DB charter alotmanima

### 📦 MODUL: Package Wizard
- [ ] Multi-step: Let → Hotel → Transfer → Aktivnosti
- [ ] Price Build-Up (sve stavke vidljive u realnom vremenu)
- [ ] Finale: Kompletan paket u korpi

### 🚌 MODUL: Transferi (Aerodrom ↔ Hotel)
- [x] `TransferSearchForm.tsx` — Tip polaska, rute, broj leta
- [x] `mockTransfers.ts` — VIP Mercedes, Shared Shuttle, Speedboat
- [x] `TransferCard.tsx` — Ikone uključene opreme (klima, child seat, meeting)
- [x] Dodati u store: `transferResults`, `setTransferResults`

### 🎟️ MODUL: Izleti & Aktivnosti (Things To Do)
- [x] `ActivitySearchForm.tsx` — Lokacija, datum, tip (npr priroda/kultura)
- [x] `mockActivities.ts` — Brodovi, rafting, ture prirode, ulaznice
- [x] `ActivityCard.tsx` — Itinerary opcija, šta uključuje, cena sa brojanjem osoba
- [x] Integracija i dodavanje rezultata u state (`setActivityResults`)

### 🚢 MODUL: Krstarenja (Cruises)
- [x] `CruiseSearchForm.tsx` — Regija (Mediteran..), luka polaska, mesec, pax
- [x] `mockCruises.ts` — MSC, Costa, Royal Caribbean trase
- [x] `CruiseCard.tsx` — Itinereri na mapi (Đenova → Napulj), dropdown za odabir kabine 
- [x] Integracija rezultata i `CruiseCabinOption` sistem cena

### 📦 MODUL: Dinamički Paket Kasa (Package Basket & Checkout)
- [x] Oživljen `Package Basket` (Zustand) sa Total Price kalkulacijom iz svih modula zajedno
- [x] Prelepa plutajuća dno-ekrana Kartica `PackageBasket.tsx` za dodate usluge (`Ukloni x`)
- [x] Zvršni `DynamicPackageCheckout.tsx` pun-ekran modal – leva strana: inventar paketa, desna: podaci Nosioca putovanja
- [x] Integrisan uspešan feedback screen nakon simulacije slanja upita i reset Basketa.

---

## ═══════════════════════════════════════════════════════════
## MODUL: ČARTERI / ALLOTMENT (🎫)
### Datum: 2026-03-21 | Status: ✅ ZAVRŠENO
## ═══════════════════════════════════════════════════════════

### Korak C1 — Tipovi za Čartere (`types.ts` proširenje)
```typescript
type CharterSearchParams { ... }     // Relacija, mesec, noćenja, pax, PRIME only
type CharterDeparture { ... }        // Jedan polazak: datum, mesta, cena, status
type CharterResult { ... }           // Relacija sa nizom polazaka
```

### Korak C2 — `data/mockCharters.ts`
- 3 relacije: BEG→TIV (Air Serbia + Ryanair), BEG→DBV (easyJet), BEG→ATH (Aegean)
- PRIME allotment (vlastiti inventar) + blok + seat-only tipovi
- Polasci Jul/Avg 2026 sa realnim cenama i slobodnim mestima

### Korak C3 — Store proširenje
- `charterSearchParams`, `charterResults`
- `setCharterSearchParams()`, `setCharterResults()`

### Korak C4 — `components/CharterSearchForm/CharterSearchForm.tsx`
- Select za polazak/odredište + mesec + noćenja
- Pax dropdown (odrasli/deca/bebe) sa PaxCounter komponentom
- PRIME Only toggle (filter za vlastiti allotment)
- Mock filter logika: ruta + mesec + noćenja + pax cena kalkulacija

### Korak C5 — `components/CharterCard/CharterCard.tsx`
- Header: Aviokompanija + logo + PRIME badge + contractType label
- Ruta + let broj + trajanje + vreme polaska/dolaska
- Expand/Collapse sa kalendarom svih polazaka (tabela)
- `DepartureRow`: datum povratka, noćenja, slobodna mesta (color-coded), cena/os + ukupno, Odaberi dugme
- Footer info bar (legenda statusa)

---

## ═══════════════════════════════════════════════════════════
## MODUL: RENT-A-CAR (🚗)
### Datum: 2026-03-21 | Status: ✅ ZAVRŠENO
## ═══════════════════════════════════════════════════════════

### Korak R1 — Tipovi za Rent-a-Car (`types.ts` proširenje)
```typescript
type CarCategory = 'mini' | 'economy' | 'compact' | 'standard' | 'fullsize' | 'suv' | 'premium' | 'van' | 'convertible'
type TransmissionType = 'manual' | 'automatic'
type FuelType = 'petrol' | 'diesel' | 'electric' | 'hybrid'

interface CarSearchParams { ... }      // Pickup/Dropoff lokacija + datumi + vozačka dob
interface CarIncludedPolicy { ... }    // CDW, krađa, km, besplatan otkaz
interface CarVehicle { ... }           // Vozilo sa svim specifikacijama + policy + cena
```

### Korak R2 — `data/mockCars.ts`
| # | Vozilo | Kategorija | Tip | Cena/dan | Isporučilac |
|---|--------|------------|-----|----------|-------------|
| 1 | Fiat 500 | Mini | Manual/Benzin | 22€ | Budget |
| 2 | VW Polo | Economy | Manual/Benzin | 28€ | Hertz |
| 3 | Renault Clio | Economy | Manual/Benzin | 25€ | TivatRent |
| 4 | VW Golf | Kompakt | Auto/Dizel | 38€ | Avis (PRIME) |
| 5 | Toyota Corolla | Kompakt | Auto/Hybrid | 42€ | Europcar (PRIME) |
| 6 | BMW Serija 1 | Standard | Auto/Benzin | 55€ | Sixt (PRIME) |
| 7 | Toyota RAV4 | SUV | Auto/Dizel | 68€ | Hertz (PRIME) |
| 8 | VW Tiguan | SUV 7-sed | Auto/Benzin | 72€ | Avis |
| 9 | Mercedes C | Premium | Auto/Benzin | 110€ | Sixt (PRIME) |
| 10 | VW Caravelle | Van 9-sed | Auto/Dizel | 95€ | Europcar (PRIME) |
| 11 | Tesla Model 3 | Premium Electric | Auto/Elektr | 95€ | Europcar (PRIME) |

**3 policy template-a:** Full (CDW+krađa+km+48h otkaz) / Basic (km+24h otkaz) / Budget (osnovno)

### Korak R3 — `components/CarSearchForm/CarSearchForm.tsx`
- **Pickup / Dropoff lokacija** — Select sa 7 lokacija (aerodrom + centar + hotel dostava)
- **Ista lokacija** toggle — klikom "Promeni" otvara se Dropoff select
- **Datumi + Vreme** za preuzimanje i vraćanje (min validacija)
- **Vozačka dob** — counter, upozorenje za < 25 god
- **Živa kalkulacija** broja dana najma
- **Filtriraj po minDriverAge** — stavke sa dob uslovom se filtriraju
- **Recalculate totalPrice** za stvarni broj dana

### Korak R4 — `components/CarCard/CarCard.tsx`
- **Leva traka:** Emoji vozila + kategorija
- **Sredina:** Naziv + Isporučilac + Status badge + Specs grid (sedišta/vrata/torbe/klima) + Transmisija+Gorivo badge + min dob upozorenje + Pickup/Dropoff info
- **Desna kolona:** Ukupna cena (bold) + cena/dan + depozit + Policy ikone (CDW/krađa/km/otkaz) + Izaberi dugme + "Svi uslovi" expand link
- **Expand zona:** Kompletna policy tabela + napomene (depozit, gorivo, uzrast...)
- **PRIME badge traka** (zlatna, gore) za isPrime vozila
- Feedback: dugme prelazi u "✓ Dodano u korpu" na 3 sekunde

### Korak R5 — Integracija u `PrimeSmartSearch.tsx`
- CarSearchForm u TabForm `case 'car':`
- `carResults` + `setCarResults` iz store
- `carCategoryFilter` lokalni state
- Demo dugme: `🚗 Demo: Prikaži primer vozila →`
- Banner: statistike + **Category Filter pill-ovi** (8 kategorija)
- CarCard lista sa filtriranjem po kategoriji

---

## ═══════════════════════════════════════════════════════════
## SLEDEĆI MODULI — Plan (Ažurirano)
## ═══════════════════════════════════════════════════════════

| Status | Modul | Prioritet |
|--------|-------|-----------|
| ✅ | Hotel + Room Wizard | P0 |
| ✅ | Letovi | P0 |
| ✅ | Package Wizard (6 koraka) | P0 |
| ✅ | Dinamički Paket Kasa | P0 |
| ✅ | Transferi | P1 |
| ✅ | Putovanja (Tours) | P2 |
| ✅ | Izleti & Aktivnosti | P2 |
| ✅ | Krstarenja | P2 |
| ✅ | Package Live Stack & Alerts | P0 |

## ═══════════════════════════════════════════════════════════
## FAZA 6 — Package Wizard Enhancements & Live Stack
### Datum: 2026-03-22 | Status: 🟢 U TOKU (Implemented)
## ═══════════════════════════════════════════════════════════

### Korak F6.1 — `PackageLiveStack.tsx` (Dinamička Korpa)
**Fajl:** `src/pages/PrimeSmartSearch/components/PackageLiveStack.tsx`  
**Šta je urađeno:**
- Zamenjen stari `PriceBuildUp` sidebar sa modernim "Live Stack" sistemom kartica.
- Svaki segment (Let, Hotel, Transfer, Extra) prikazuje se kao **zasebna kartica** u desnom panelu.
- **Link "Izmeni"**: Svaka kartica omogućava brz povratak na specifičan korak wizard-a radi promene izbora.
- Vizuelni stil: Glassmorphism, v6-slide-up animacije, ikone segmenta.
- Integrisana dugmad za **"Sačuvaj Paket"** i **"Share"** na dnu stack-a.

### Korak F6.2 — "Save Offer" & "Share" u Modulima
**Fajlovi:** `HotelCard.tsx`, `FlightCard.tsx`  
**Šta je urađeno:**
- Dodata namenska dugmad (💾 Sačuvaj i 🔗 Podeli) na svaku karticu rezultata.
- Omogućeno čuvanje individualnih ponuda u `savedOffers` state (Zustand).
- Pripremljen UI za deljenje via social media (Viber, WhatsApp, Instagram...).

### Korak F6.3 — `SavedOffersPanel.tsx` & Price Alerts
**Fajl:** `src/pages/PrimeSmartSearch/components/SavedOffersPanel.tsx`  
**Šta je urađeno:**
- **Plutajući panel (Folder)**: Pojavljuje se u donjem desnom uglu kada korisnik ima sačuvane ponude.
- **Real-time Price Check**: Dugme "Osveži cenu" koje pokreće `checkPriceChange` akciju.
- **Price Drop Alerts**: Opcija "Obavesti me kada cena padne" (🔔) koja aktivira alarm.
- **Price Change Notification**: Toast notifikacija (📈/📉) koja iskače pri detekciji promene cene.

### Korak F6.4 — State Logic (`useSearchStore.ts`)
**Šta je dodato:**
- `savedOffers`: Niz `SavedOffer` objekata.
- `lastPriceChangeNotification`: Trenutna notifikacija o promeni cene.
- `saveOffer()`, `removeSavedOffer()`, `togglePriceDropAlert()` akcije.
- `checkPriceChange()`: Asinhrona akcija koja simulira re-check cene i poredi staru sa novom.

---

## 4. ŠTA JE SLEDEĆE? (Backlog & Roadmap)

**Sledeće:** Sve P1 i P2 stavke su gotove! Trenutno aktivan rad oko **Price Build-Up (Kasa)** je 100% integrisan u UI. Ostalo je da polako krene zamena mock podataka API integracijama, ali za domen FrontEnd-a PrimeSmartSearch V6 postigao je punu sposobnost.

---

## ═══════════════════════════════════════════════════════════
## GLOBALNI CHANGELOG (Tehnički)
## ═══════════════════════════════════════════════════════════

| Datum | Fajl | Promena |
|-------|------|---------|
| 2026-03-21 | `types.ts` | Inicijalna kreacija, svi bazni tipovi |
| 2026-03-21 | `types.ts` | Dodat Flight tip sistem |
| 2026-03-21 | `types.ts` | Dodati Charter tipovi (CharterSearchParams, CharterDeparture, CharterResult) |
| 2026-03-21 | `types.ts` | Dodati Car tipovi (CarSearchParams, CarIncludedPolicy, CarVehicle) |
| 2026-03-21 | `useSearchStore.ts` | Inicijalna kreacija, hotel+flight akcije |
| 2026-03-21 | `useSearchStore.ts` | Charter akcije (setCharterSearchParams, setCharterResults) |
| 2026-03-21 | `useSearchStore.ts` | Car akcije (setCarSearchParams, setCarResults) |
| 2026-03-21 | `mockResults.ts` | Kreiran, 6 hotela + 4 sobe |
| 2026-03-21 | `mockFlights.ts` | Kreiran, 4 itinerera BEG→TIV |
| 2026-03-21 | `mockCharters.ts` | Kreiran, 3 charter relacije, Jul/Avg 2026 |
| 2026-03-21 | `mockCars.ts` | Kreiran, 11 vozila, 5 isporučilaca, 3 policy |
| 2026-03-21 | `CharterSearchForm.tsx` | Kreiran 🎫 |
| 2026-03-21 | `CharterCard.tsx` | Kreiran 🎫 (kalendarski prikaz polazaka) |
| 2026-03-21 | `CarSearchForm.tsx` | Kreiran 🚗 |
| 2026-03-21 | `CarCard.tsx` | Kreiran 🚗 (policy expand + PRIME traka) |
| 2026-03-21 | `mockTransfers.ts` | 🚌 Kreiran, 7 mock data Transfera (Ruta, VIP, Shuttle) |
| 2026-03-21 | `TransferSearchForm.tsx` | 🚌 Kreiran transfer form |
| 2026-03-21 | `TransferCard.tsx` | 🚌 Kreiran transfer result card |
| 2026-03-21 | `mockTours.ts` | 🌍 Kreiran, Ekskluzivne / Grupne Ture po Danima |
| 2026-03-21 | `TourSearchForm.tsx` | 🌍 Kreirana travel search forma |
| 2026-03-21 | `TourCard.tsx` | 🌍 Puna tura kartica sa Itinerary drop-down |
| 2026-03-21 | `PrimeSmartSearch.tsx` | Charter, Car, Transfer, Tour uspešno UI integrisani |
| 2026-03-21 | `mockActivities.ts` | 🎟️ Kreiran, Boka Kotorska i ostale atrakcije |
| 2026-03-21 | `ActivitySearchForm.tsx` | 🎟️ Kreiran search form |
| 2026-03-21 | `ActivityCard.tsx` | 🎟️ Kartica izleta |
| 2026-03-21 | `mockCruises.ts` | 🚢 Baza brodova i ruta (MSC, Costa) |
| 2026-03-21 | `CruiseSearchForm.tsx` | 🚢 Search Engine za obale |
| 2026-03-21 | `CruiseCard.tsx` | 🚢 Prikaz broda, kabina i dnevnog itinerera |
| 2026-03-21 | `PackageBasket.tsx` | 🛒 Plutajući widget za brzi pregled paketa na dnu |
| 2026-03-21 | `DynamicPackageCheckout.tsx` | 💳 Pravljenje završne stranice (Kase) pred rezervaciju |
| 2026-03-21 | `PrimeSmartSearch.tsx` | SVI SEKTORI PRETRAGE USPEŠNO ZAVRŠENI ODOMAĆENI NA UI-U. |
| 2026-03-22 | `types.ts` | Dodati `SavedOffer` i `PriceChangeNotification` tipovi |
| 2026-03-22 | `useSearchStore.ts` | Dodata logika za čuvanje ponuda i proveru cena |
| 2026-03-22 | `PackageLiveStack.tsx` | Kreirana dinamička korpa sa "Izmeni" linkovima |
| 2026-03-22 | `HotelCard.tsx` / `FlightCard.tsx` | Dodata dugmad za Sačuvaj i Podeli |
| 2026-03-22 | `SavedOffersPanel.tsx` | Kreiran panel za upravljanje sačuvanim ponudama i alarmima |
| 2026-03-22 | `PrimeSmartSearch.tsx` | Integrisan `SavedOffersPanel` i Price Alerts |

---

## Napomene za Inženjere

> **KRITIČNO:** Sve V6 promene moraju biti unutar `.v6-prime-hub` opsega. Nikad ne menjati globalne stilove!

> **Prioriteti provajdera** (Orchestrator Weight System):
> 1. Manual DB (vlastiti inventar) — weight: 100
> 2. Charter DB (allotment) — weight: 95
> 3. Solvex — weight: 80
> 4. WebBeds — weight: 70
> 5. Amadeus/GDS — weight: 60
> 6. Skyscanner — weight: 40

> **Cene:** Uvek prikazati UKUPNU cenu za sve putnike i sva noćenja. Breakdown ispis ispod.

> **Failover:** Silent booking — ako primarni provajder vrati grešku pri booking-u, automatski pokušati `failoverProvider` bez informisanja klijenta.

