# Dynamic Package Builder - Architecture

## 📦 Koncept

Dynamic Package Builder omogućava kreiranje kompleksnih putovanja kombinovanjem različitih usluga:
- ✈️ **Letovi** (multi-city itinerary)
- 🏨 **Hoteli** (različite destinacije)
- 🚗 **Transferi** (aerodrom ↔ hotel)
- 🎫 **Dodatne Usluge** (ulaznice, izleti, restorani)
- 📅 **Visual Itinerary** (dan-po-dan timeline)

---

## 🎯 Primer Paketa

### **Milano & Pariz - 7 Dana**

#### **Dan 1: Beograd → Milano**
- 🛫 **Let**: JU500 BEG-MXP (10:00-12:30)
- 🚗 **Transfer**: Aerodrom Malpensa → Hotel (opciono)
- 🏨 **Check-in**: Hotel Principe di Savoia (4*)
- 🌙 **Noćenje**: Milano

#### **Dan 2-3: Milano**
- 🏨 **Boravak**: Hotel Principe di Savoia
- 🍳 **Usluga**: Bed & Breakfast
- 🎫 **Opciono**: Tura po gradu, Duomo ulaznica

#### **Dan 4: Milano → Pariz**
- 🚗 **Transfer**: Hotel → Aerodrom Malpensa
- 🛫 **Let**: AF1234 MXP-CDG (14:00-16:00)
- 🚗 **Transfer**: Aerodrom CDG → Hotel
- 🏨 **Check-in**: Hotel Le Marais (4*)
- 🌙 **Noćenje**: Pariz

#### **Dan 5-6: Pariz**
- 🏨 **Boravak**: Hotel Le Marais
- 🍳 **Usluga**: Half Board
- 🎫 **Disneyland**: 1-dnevna ulaznica (Dan 5)
- 🎫 **Opciono**: Eiffel Tower, Louvre

#### **Dan 7: Pariz → Beograd**
- 🚗 **Transfer**: Hotel → Aerodrom CDG
- 🛫 **Let**: JU501 CDG-BEG (18:00-21:30)
- 🏠 **Povratak**: Beograd

---

## 🏗️ Arhitektura

### **1. Data Model**

```typescript
interface DynamicPackage {
  id: string;
  name: string;
  description: string;
  
  // Destinations
  destinations: PackageDestination[];
  
  // Components
  flights: PackageFlight[];
  hotels: PackageHotel[];
  transfers: PackageTransfer[];
  extras: PackageExtra[];
  
  // Itinerary
  itinerary: DayByDayItinerary[];
  
  // Pricing
  pricing: PackagePricing;
  
  // Metadata
  duration: number; // days
  travelers: number;
  createdAt: string;
  status: 'draft' | 'confirmed' | 'cancelled';
}

interface PackageDestination {
  city: string;
  country: string;
  arrivalDate: string;
  departureDate: string;
  nights: number;
}

interface PackageFlight {
  id: string;
  type: 'outbound' | 'return' | 'internal';
  origin: string;
  destination: string;
  departureDate: string;
  arrivalDate: string;
  flightNumber: string;
  airline: string;
  price: number;
  bookingReference?: string;
}

interface PackageHotel {
  id: string;
  destination: string;
  hotelName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  roomType: string;
  mealPlan: 'RO' | 'BB' | 'HB' | 'FB' | 'AI';
  price: number;
  bookingReference?: string;
}

interface PackageTransfer {
  id: string;
  type: 'airport_to_hotel' | 'hotel_to_airport' | 'inter_hotel';
  from: string;
  to: string;
  date: string;
  time: string;
  vehicleType: 'private' | 'shared' | 'shuttle';
  price: number;
}

interface PackageExtra {
  id: string;
  type: 'ticket' | 'tour' | 'restaurant' | 'activity';
  name: string;
  description: string;
  destination: string;
  date: string;
  time?: string;
  price: number;
  quantity: number;
}

interface DayByDayItinerary {
  day: number;
  date: string;
  destination: string;
  activities: ItineraryActivity[];
}

interface ItineraryActivity {
  time: string;
  type: 'flight' | 'hotel' | 'transfer' | 'extra';
  icon: string;
  title: string;
  description: string;
  location?: string;
  duration?: string;
  componentId: string; // Reference to flight/hotel/transfer/extra
}

interface PackagePricing {
  flights: number;
  hotels: number;
  transfers: number;
  extras: number;
  subtotal: number;
  taxes: number;
  total: number;
  currency: string;
  perPerson: number;
}
```

---

### **2. Package Builder UI**

#### **Step 1: Package Info**
- Naziv paketa
- Opis
- Broj putnika
- Datum početka

#### **Step 2: Destinations**
- Dodavanje destinacija
- Broj noćenja po destinaciji
- Drag & drop za redosled

#### **Step 3: Flights**
- Multi-city flight search
- Automatski predlog na osnovu destinacija
- Mogućnost manuelnog dodavanja

#### **Step 4: Hotels**
- Search hotela po destinaciji
- Izbor hotela za svaku destinaciju
- Meal plan selection

#### **Step 5: Transfers**
- Automatski predlog transfera
- Aerodrom → Hotel
- Hotel → Aerodrom
- Inter-hotel (ako menjaju hotel)

#### **Step 6: Extras**
- Katalog dodatnih usluga
- Ulaznice (Disneyland, muzeji, itd.)
- Izleti i ture
- Restorani
- Aktivnosti

#### **Step 7: Review & Pricing**
- Visual itinerary timeline
- Price breakdown
- Edit opcije
- Finalizacija

---

### **3. Visual Itinerary Timeline**

```
┌─────────────────────────────────────────────────────────┐
│  Dan 1 - Ponedeljak, 15. Jun 2026                       │
│  📍 Beograd → Milano                                     │
├─────────────────────────────────────────────────────────┤
│  10:00  🛫  Let JU500 BEG-MXP                           │
│         ✈️  Air Serbia                                   │
│         ⏱  2h 30min                                      │
│                                                          │
│  12:30  🛬  Dolazak u Milano Malpensa                   │
│                                                          │
│  13:00  🚗  Transfer do hotela                          │
│         🚙  Private Transfer                             │
│         ⏱  45min                                         │
│                                                          │
│  14:00  🏨  Check-in: Hotel Principe di Savoia          │
│         ⭐  4-star hotel                                 │
│         🍳  Bed & Breakfast                              │
│                                                          │
│  19:00  🍽  Večera (slobodno vreme)                     │
│                                                          │
│  🌙  Noćenje u Milano                                    │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│  Dan 2 - Utorak, 16. Jun 2026                           │
│  📍 Milano                                               │
├─────────────────────────────────────────────────────────┤
│  08:00  🍳  Doručak u hotelu                            │
│                                                          │
│  10:00  🎫  Tura po gradu Milano                        │
│         🚶  Walking tour                                 │
│         ⏱  3h                                            │
│         📍  Duomo, Galleria, La Scala                   │
│                                                          │
│  14:00  🍽  Ručak (slobodno vreme)                      │
│                                                          │
│  🌙  Noćenje u Milano                                    │
└─────────────────────────────────────────────────────────┘

... (itd za sve dane)
```

---

### **4. Components**

#### **PackageBuilder.tsx**
- Main component
- Step-by-step wizard
- State management

#### **DestinationSelector.tsx**
- Dodavanje destinacija
- Drag & drop reorder
- Date range picker

#### **FlightSelector.tsx**
- Multi-city flight search
- Integration sa Flight API
- Automatic suggestions

#### **HotelSelector.tsx**
- Hotel search po destinaciji
- Integration sa Hotel API (TCT, Open Greece)
- Room & meal plan selection

#### **TransferManager.tsx**
- Transfer options
- Automatic suggestions
- Manual override

#### **ExtrasMarketplace.tsx**
- Katalog dodatnih usluga
- Filter po destinaciji
- Add to package

#### **ItineraryTimeline.tsx**
- Visual day-by-day display
- Timeline view
- Edit inline

#### **PackagePricing.tsx**
- Price breakdown
- Per person calculation
- Currency conversion

---

### **5. API Integration**

#### **Flight API** (Amadeus)
- Multi-city search
- Price validation
- Booking

#### **Hotel API** (TCT, Open Greece)
- Search by destination
- Availability check
- Booking

#### **Transfer API** (New)
- Transfer options
- Pricing
- Booking

#### **Extras API** (New)
- Catalog of activities
- Pricing
- Booking

---

### **6. Database Schema**

```sql
-- Packages
CREATE TABLE packages (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  description TEXT,
  duration INT,
  travelers INT,
  status VARCHAR(50),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Package Destinations
CREATE TABLE package_destinations (
  id UUID PRIMARY KEY,
  package_id UUID REFERENCES packages(id),
  city VARCHAR(100),
  country VARCHAR(100),
  arrival_date DATE,
  departure_date DATE,
  nights INT,
  sequence INT
);

-- Package Flights
CREATE TABLE package_flights (
  id UUID PRIMARY KEY,
  package_id UUID REFERENCES packages(id),
  type VARCHAR(50),
  origin VARCHAR(3),
  destination VARCHAR(3),
  departure_date TIMESTAMP,
  arrival_date TIMESTAMP,
  flight_number VARCHAR(20),
  airline VARCHAR(100),
  price DECIMAL(10,2),
  booking_reference VARCHAR(50)
);

-- Package Hotels
CREATE TABLE package_hotels (
  id UUID PRIMARY KEY,
  package_id UUID REFERENCES packages(id),
  destination VARCHAR(100),
  hotel_name VARCHAR(255),
  check_in DATE,
  check_out DATE,
  nights INT,
  room_type VARCHAR(100),
  meal_plan VARCHAR(10),
  price DECIMAL(10,2),
  booking_reference VARCHAR(50)
);

-- Package Transfers
CREATE TABLE package_transfers (
  id UUID PRIMARY KEY,
  package_id UUID REFERENCES packages(id),
  type VARCHAR(50),
  from_location VARCHAR(255),
  to_location VARCHAR(255),
  date DATE,
  time TIME,
  vehicle_type VARCHAR(50),
  price DECIMAL(10,2)
);

-- Package Extras
CREATE TABLE package_extras (
  id UUID PRIMARY KEY,
  package_id UUID REFERENCES packages(id),
  type VARCHAR(50),
  name VARCHAR(255),
  description TEXT,
  destination VARCHAR(100),
  date DATE,
  time TIME,
  price DECIMAL(10,2),
  quantity INT
);
```

---

## 🎨 UI/UX Features

### **Package Builder Wizard**
- Progress indicator (7 steps)
- Save draft functionality
- Back/Next navigation
- Real-time pricing updates

### **Visual Timeline**
- Day-by-day cards
- Time-based layout
- Icons for each activity type
- Expandable details
- Edit/Remove actions

### **Drag & Drop**
- Reorder destinations
- Reorder activities within day
- Visual feedback

### **Smart Suggestions**
- Automatic transfer suggestions
- Popular extras per destination
- Optimal flight connections

### **Price Calculator**
- Real-time total
- Per person breakdown
- Component-wise pricing
- Currency conversion

---

## 🚀 Implementation Plan

### **Phase 1: Core Builder** (Week 1-2)
- [ ] Data model & types
- [ ] PackageBuilder component
- [ ] DestinationSelector
- [ ] Basic state management

### **Phase 2: Flight & Hotel Integration** (Week 3-4)
- [ ] FlightSelector with multi-city
- [ ] HotelSelector per destination
- [ ] Integration sa postojećim API-jima

### **Phase 3: Transfers & Extras** (Week 5-6)
- [ ] TransferManager
- [ ] ExtrasMarketplace
- [ ] Catalog of activities

### **Phase 4: Itinerary & Pricing** (Week 7-8)
- [ ] ItineraryTimeline component
- [ ] Visual day-by-day display
- [ ] PackagePricing calculator
- [ ] Review & finalize

### **Phase 5: Booking & Confirmation** (Week 9-10)
- [ ] Package booking flow
- [ ] Payment integration
- [ ] Confirmation & vouchers
- [ ] Email notifications

---

## 📈 Success Metrics

- **Package Creation Time**: < 15 minutes
- **Booking Conversion**: > 30%
- **Average Package Value**: > 1500 EUR
- **Customer Satisfaction**: > 4.5/5

---

## 🔮 Future Enhancements

- **AI-Powered Suggestions**: ML-based package recommendations
- **Template Library**: Pre-built package templates
- **Collaborative Editing**: Multiple agents working on same package
- **Mobile App**: Package builder on mobile
- **Customer Portal**: Self-service package customization

---

**Status**: 📋 Architecture Defined  
**Next Step**: Implementation Phase 1  
**ETA**: 10 weeks for full implementation
