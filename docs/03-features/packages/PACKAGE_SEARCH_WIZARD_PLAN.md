# Dynamic Package Search Wizard - Implementation Plan

## 🎯 Cilj

Kreirati interaktivni wizard koji omogućava:
1. **Pretragu komponenti** - Letovi, hoteli, transferi
2. **AI-powered search** - Natural language upiti
3. **Multi-step selection** - Korak-po-korak izbor komponenti
4. **Map visualization** - Vizualizacija rute na mapi
5. **Package creation** - Kreiranje paketa od izabranih komponenti

---

## 📋 User Flow

### Scenario 1: Manual Search (Step-by-Step)

```
1. Osnovne Informacije
   ├─ Destinacije (multi-select)
   ├─ Datumi (check-in/check-out po destinaciji)
   ├─ Broj putnika (odrasli/deca)
   └─ Budget (optional)

2. Izbor Letova
   ├─ Pretraga letova (Flight API)
   ├─ Prikaz rezultata (kao u Flight Search)
   ├─ Izbor outbound leta
   ├─ Izbor return leta
   └─ Multi-city opcija (za više destinacija)

3. Izbor Hotela
   ├─ Pretraga hotela po destinaciji (Global Hub API)
   ├─ Prikaz rezultata (kao u Global Hub)
   ├─ Izbor hotela za svaku destinaciju
   └─ Izbor sobe i meal plana

4. Izbor Transfera
   ├─ Automatski predlozi (aerodrom → hotel, hotel → aerodrom)
   ├─ Inter-city transferi (Milano → Paris)
   ├─ Izbor tipa vozila
   └─ Opcija za rent-a-car

5. Dodatne Usluge (Optional)
   ├─ Ture i aktivnosti
   ├─ Ulaznice (muzeji, parkovi)
   ├─ Restorani
   └─ Osiguranje

6. Pregled i Potvrda
   ├─ Vizualizacija itinerara na mapi
   ├─ Timeline dan-po-dan
   ├─ Price breakdown
   └─ Kreiranje paketa
```

### Scenario 2: AI-Powered Search

```
1. AI Prompt Input
   └─ "Želim 7 dana u Italiji, Milano i Rim, 2 odraslih, budget 3000€"

2. AI Processing
   ├─ Parse prompt (destinacije, datumi, putnici, budget)
   ├─ Automatska pretraga komponenti
   └─ Generisanje predloga paketa

3. AI Suggestions
   ├─ 3-5 predloženih paketa
   ├─ Različite kombinacije letova/hotela
   └─ Različiti budžeti

4. User Selection
   ├─ Izbor jednog od predloga
   └─ Ili customize (ide u Manual Search)

5. Finalizacija
   └─ Kao u Manual Search (korak 6)
```

---

## 🏗️ Architecture

### Components Structure

```
src/
├── pages/
│   ├── PackageSearch.tsx          # Main search wizard page
│   ├── PackageSearch.css
│   └── PackageBuilder.tsx         # Existing (display only)
│
├── components/
│   └── packages/
│       ├── SearchWizard/
│       │   ├── WizardContainer.tsx
│       │   ├── WizardProgress.tsx
│       │   └── WizardNavigation.tsx
│       │
│       ├── Steps/
│       │   ├── Step1_BasicInfo.tsx
│       │   ├── Step2_FlightSelection.tsx
│       │   ├── Step3_HotelSelection.tsx
│       │   ├── Step4_TransferSelection.tsx
│       │   ├── Step5_ExtrasSelection.tsx
│       │   └── Step6_ReviewConfirm.tsx
│       │
│       ├── AIAssistant/
│       │   ├── AIPromptInput.tsx
│       │   ├── AISuggestions.tsx
│       │   └── AIPackageCard.tsx
│       │
│       └── MapVisualization/
│           ├── PackageMap.tsx
│           ├── RouteLayer.tsx
│           └── DestinationMarkers.tsx
│
├── services/
│   ├── packageSearchService.ts    # Orchestrates search
│   ├── packageAIService.ts        # AI prompt processing
│   └── packageMapService.ts       # Map utilities
│
└── types/
    └── packageSearch.types.ts     # Search-specific types
```

---

## 🔧 Technical Implementation

### 1. Search Service Integration

```typescript
// packageSearchService.ts
export class PackageSearchService {
  // Search flights using existing Flight API
  async searchFlights(params: FlightSearchParams): Promise<FlightOffer[]> {
    return flightSearchManager.searchFlights(params);
  }

  // Search hotels using existing Global Hub API
  async searchHotels(params: HotelSearchParams): Promise<Hotel[]> {
    return tctApi.searchHotels(params);
  }

  // Search transfers (mock for now, real API later)
  async searchTransfers(params: TransferSearchParams): Promise<Transfer[]> {
    return transferMockService.search(params);
  }

  // Search extras (mock for now)
  async searchExtras(destination: string): Promise<Extra[]> {
    return packageMockService.getExtrasCatalog();
  }

  // Combine all into package
  async createPackage(components: PackageComponents): Promise<DynamicPackage> {
    return {
      flights: components.selectedFlights,
      hotels: components.selectedHotels,
      transfers: components.selectedTransfers,
      extras: components.selectedExtras,
      itinerary: this.generateItinerary(components),
      pricing: this.calculatePricing(components)
    };
  }
}
```

### 2. AI Service Integration

```typescript
// packageAIService.ts
export class PackageAIService {
  async parsePrompt(prompt: string): Promise<SearchParams> {
    const response = await geminiService.chat([
      {
        role: 'user',
        content: `Parse this travel request into structured data:
        "${prompt}"
        
        Return JSON with:
        - destinations: string[]
        - dates: { start: string, end: string }
        - travelers: { adults: number, children: number }
        - budget: number (if mentioned)
        - preferences: string[]`
      }
    ]);

    return JSON.parse(response);
  }

  async generatePackageSuggestions(params: SearchParams): Promise<PackageSuggestion[]> {
    // Search all components
    const flights = await packageSearchService.searchFlights(params);
    const hotels = await packageSearchService.searchHotels(params);
    const transfers = await packageSearchService.searchTransfers(params);

    // Generate 3-5 combinations
    return this.combineComponents(flights, hotels, transfers, params.budget);
  }

  private combineComponents(
    flights: FlightOffer[],
    hotels: Hotel[],
    transfers: Transfer[],
    budget?: number
  ): PackageSuggestion[] {
    // AI logic to create optimal combinations
    // Consider price, quality, timing, etc.
  }
}
```

### 3. Map Visualization

```typescript
// Using Leaflet.js for map
import L from 'leaflet';
import 'leaflet-routing-machine';

export class PackageMapService {
  createMap(containerId: string): L.Map {
    return L.map(containerId).setView([45.0, 10.0], 5);
  }

  addDestinationMarkers(map: L.Map, destinations: PackageDestination[]) {
    destinations.forEach((dest, idx) => {
      const marker = L.marker([dest.lat, dest.lng])
        .bindPopup(`
          <b>${dest.city}</b><br>
          ${dest.nights} noći<br>
          ${dest.arrivalDate} - ${dest.departureDate}
        `);
      marker.addTo(map);
    });
  }

  addRouteLines(map: L.Map, destinations: PackageDestination[]) {
    // Draw flight routes
    for (let i = 0; i < destinations.length - 1; i++) {
      const from = destinations[i];
      const to = destinations[i + 1];
      
      L.polyline(
        [[from.lat, from.lng], [to.lat, to.lng]],
        { color: '#667eea', weight: 3, dashArray: '10, 10' }
      ).addTo(map);
    }
  }

  addHotelMarkers(map: L.Map, hotels: PackageHotel[]) {
    hotels.forEach(hotel => {
      const icon = L.icon({
        iconUrl: '/icons/hotel-marker.png',
        iconSize: [32, 32]
      });
      
      L.marker([hotel.lat, hotel.lng], { icon })
        .bindPopup(`<b>${hotel.hotelName}</b><br>${hotel.nights} noći`)
        .addTo(map);
    });
  }
}
```

---

## 🎨 UI/UX Design

### Wizard Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Dynamic Package Search                                      │
│  ┌─────┬─────┬─────┬─────┬─────┬─────┐                     │
│  │  1  │  2  │  3  │  4  │  5  │  6  │  Progress Steps     │
│  └─────┴─────┴─────┴─────┴─────┴─────┘                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                                                       │  │
│  │         STEP CONTENT AREA                            │  │
│  │                                                       │  │
│  │  (Forms, Search Results, Selections)                 │  │
│  │                                                       │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  PACKAGE SUMMARY (Sticky Sidebar)                    │  │
│  │  ─────────────────────────────────────────────────   │  │
│  │  ✈️ Flights: 2 selected          800.00 €           │  │
│  │  🏨 Hotels: 1 selected          1,200.00 €           │  │
│  │  🚗 Transfers: 0 selected           0.00 €           │  │
│  │  🎫 Extras: 0 selected              0.00 €           │  │
│  │  ─────────────────────────────────────────────────   │  │
│  │  TOTAL:                         2,000.00 €           │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  [← Back]                              [Next →] [Save]      │
└─────────────────────────────────────────────────────────────┘
```

### AI Assistant Mode

```
┌─────────────────────────────────────────────────────────────┐
│  🤖 AI Package Assistant                                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Opišite svoje putovanje:                                   │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Želim 7 dana u Italiji, Milano i Rim, 2 odraslih,   │  │
│  │ budget 3000€, hotel 4*, direktni letovi              │  │
│  └──────────────────────────────────────────────────────┘  │
│                                           [🔍 Pretraži]     │
│                                                              │
│  💡 Predlozi:                                                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Package 1: Milano & Rome Classic      2,850.00 €    │  │
│  │  ✈️ Air Serbia direktno                              │  │
│  │  🏨 4★ hoteli u centru                               │  │
│  │  🚗 Privatni transferi                               │  │
│  │                                    [Izaberi] [Detalji]│  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Package 2: Milano & Rome Deluxe       3,200.00 €    │  │
│  │  ✈️ Lufthansa sa 1 presedanjem                       │  │
│  │  🏨 5★ luxury hoteli                                 │  │
│  │  🚗 Premium transferi + ture                         │  │
│  │                                    [Izaberi] [Detalji]│  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Map View (Step 6)

```
┌─────────────────────────────────────────────────────────────┐
│  📍 Vaš Itinerar na Mapi                                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                                                       │  │
│  │         [Interactive Map]                            │  │
│  │                                                       │  │
│  │    BEG ✈️ -----> MXP 🏨 -----> FCO 🏨 -----> BEG    │  │
│  │                   │              │                    │  │
│  │                Milano          Roma                   │  │
│  │                3 noći         4 noći                  │  │
│  │                                                       │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  Legend:                                                     │
│  ✈️ Letovi  🏨 Hoteli  🚗 Transferi  📍 Destinacije        │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Dependencies

### New Dependencies to Install

```json
{
  "dependencies": {
    "leaflet": "^1.9.4",
    "leaflet-routing-machine": "^3.2.12",
    "@types/leaflet": "^1.9.8"
  }
}
```

---

## 🚀 Implementation Phases

### Phase 1: Basic Wizard Structure (Sprint 5)
- [ ] Create wizard container component
- [ ] Implement progress stepper
- [ ] Create 6 step components (basic structure)
- [ ] Implement wizard navigation (back/next)
- [ ] Add sticky package summary sidebar

**Estimated Time**: 1 day

### Phase 2: Step 1 - Basic Info (Sprint 5)
- [ ] Multi-destination selector
- [ ] Date pickers (per destination)
- [ ] Traveler count inputs
- [ ] Budget slider (optional)
- [ ] Form validation

**Estimated Time**: 0.5 day

### Phase 3: Step 2 - Flight Selection (Sprint 5)
- [ ] Integrate with existing Flight API
- [ ] Display flight results (reuse FlightSearch UI)
- [ ] Multi-city flight support
- [ ] Selected flights summary
- [ ] Price calculation

**Estimated Time**: 1 day

### Phase 4: Step 3 - Hotel Selection (Sprint 6)
- [ ] Integrate with Global Hub API
- [ ] Display hotel results per destination
- [ ] Room and meal plan selection
- [ ] Selected hotels summary
- [ ] Price calculation

**Estimated Time**: 1 day

### Phase 5: Step 4 - Transfer Selection (Sprint 6)
- [ ] Create transfer mock service
- [ ] Auto-suggest transfers (airport ↔ hotel)
- [ ] Inter-city transfer options
- [ ] Vehicle type selection
- [ ] Price calculation

**Estimated Time**: 0.5 day

### Phase 6: Step 5 - Extras Selection (Sprint 6)
- [ ] Display extras catalog
- [ ] Filter by destination
- [ ] Quantity selection
- [ ] Selected extras summary
- [ ] Price calculation

**Estimated Time**: 0.5 day

### Phase 7: Step 6 - Review & Map (Sprint 7)
- [ ] Install Leaflet.js
- [ ] Create map component
- [ ] Add destination markers
- [ ] Draw flight routes
- [ ] Add hotel markers
- [ ] Timeline visualization
- [ ] Final price breakdown
- [ ] Create package button

**Estimated Time**: 1.5 days

### Phase 8: AI Assistant (Sprint 7)
- [ ] Create AI prompt input component
- [ ] Implement prompt parsing (Gemini)
- [ ] Generate package suggestions
- [ ] Display AI suggestions
- [ ] Select suggestion → populate wizard
- [ ] Customize suggestion option

**Estimated Time**: 1.5 days

### Phase 9: Integration & Polish (Sprint 8)
- [ ] Connect to router
- [ ] Add to Dashboard
- [ ] Add to navigation
- [ ] Responsive design
- [ ] Error handling
- [ ] Loading states
- [ ] Save draft functionality
- [ ] Testing

**Estimated Time**: 1 day

---

## 📊 Total Estimated Time

- **Phase 1-7**: ~6.5 days (Manual Search Wizard)
- **Phase 8**: ~1.5 days (AI Assistant)
- **Phase 9**: ~1 day (Integration)

**Total**: ~9 days of development

---

## 🎯 Success Criteria

### Functionality
- ✅ User can search and select flights from multiple providers
- ✅ User can search and select hotels from Global Hub
- ✅ User can select transfers between locations
- ✅ User can add extras (tours, tickets, etc.)
- ✅ System generates complete itinerary
- ✅ Map shows visual route with markers
- ✅ AI can parse natural language requests
- ✅ AI generates relevant package suggestions
- ✅ Package is created and saved

### UX
- ✅ Wizard is intuitive and easy to navigate
- ✅ Progress is clearly visible
- ✅ Selected items are summarized in sidebar
- ✅ Price updates in real-time
- ✅ Map is interactive and informative
- ✅ AI suggestions are relevant and helpful

### Performance
- ✅ Search results load in < 3 seconds
- ✅ Map renders smoothly
- ✅ AI response in < 5 seconds
- ✅ Wizard navigation is instant

---

## 🔄 Next Steps

1. **Review this plan** - Da li je sve jasno?
2. **Prioritize features** - Šta je najvažnije prvo?
3. **Start implementation** - Krenem sa Phase 1?

**Pitanja**:
1. Da li želiš da odmah krenem sa implementacijom?
2. Da li ima nešto što treba dodati/promeniti u planu?
3. Da li želiš AI Assistant odmah ili prvo manual search?
4. Koja mapa biblioteka ti odgovara (Leaflet, Mapbox, Google Maps)?

---

**Status**: 📋 **PLAN READY**  
**Next**: Awaiting approval to start implementation
