import type { LucideIcon } from 'lucide-react';

// ─────────────────────────────────────────────────────────────
// 1. SEARCH TABS (8 Modula)
// ─────────────────────────────────────────────────────────────
export type SearchTabType =
    | 'hotel'       // 🛏️ Smeštaj
    | 'flight'      // ✈️ Letovi
    | 'package'     // 📦 Paketi (Wizard)
    | 'car'         // 🚗 Rent-a-car
    | 'things-to-do'// 🎟️ Izleti & Aktivnosti
    | 'cruise'      // 🚢 Krstarenja
    | 'charter'     // 🎫 Čarteri (Allotment)
    | 'tour'        // 🌍 Putovanja (Tours)
    | 'transfer';   // 🚌 Transferi (aerodrom↔hotel)

export interface SearchTab {
    id: SearchTabType;
    label: string;
    icon: LucideIcon;
    emoji: string;
}

// ─────────────────────────────────────────────────────────────
// 2. SEARCH MODES
// ─────────────────────────────────────────────────────────────
export type SearchModeType =
    | 'classic'         // Standard form
    | 'narrative'       // Milica AI (natural language)
    | 'immersive'       // Fullscreen immersive
    | 'immersive-map'   // Map Explorer
    | 'semantic'        // AI Semantic Search
    | 'hybrid';         // AI Semantic + Fields

// ─────────────────────────────────────────────────────────────
// 3. AVAILABILITY STATUS (Semafor Logika)
// ─────────────────────────────────────────────────────────────
export type AvailabilityStatus =
    | 'instant'   // ⚡ Zeleno - Odmah potvrđeno
    | 'on-request'// ❓ Žuto - Na Upit
    | 'sold-out'; // 🚫 Ne prikazujemo - Filtrirano u Orchestratoru

// ─────────────────────────────────────────────────────────────
// 4. PAX (PUTNICI) LOGIKA
// ─────────────────────────────────────────────────────────────
export interface RoomAllocation {
    adults: number;
    children: number;
    childrenAges: number[]; // Uzrast svakog deteta (npr. [5, 8, 12])
}

export interface PaxSummary {
    totalAdults: number;
    totalChildren: number;
    childrenAges: number[];   // Svi uzrasti, svi putnici
    totalRooms: number;
    nights: number;
    checkIn: string;
    checkOut: string;
}

// ─────────────────────────────────────────────────────────────
// 5. DESTINACIJA
// ─────────────────────────────────────────────────────────────
export type DestinationType = 'city' | 'hotel' | 'airport' | 'country' | 'region';

export interface Destination {
    id: string;
    name: string;
    type: DestinationType;
    country: string;
    countryCode?: string;
    stars?: number;
    provider?: string;
    iataCode?: string; // Za aerodrome
}

// ─────────────────────────────────────────────────────────────
// 6. FILTERI
// ─────────────────────────────────────────────────────────────
export type BudgetType = 'total' | 'person' | 'room';

export interface SearchFilters {
    hotelName?: string;
    stars: string[];                     // ['3', '4', '5'] ili ['all']
    mealPlans: string[];                 // ['BB', 'HB', 'AI'] ili ['all']
    availability: AvailabilityStatus[];  // ['instant', 'on-request']
    onlyRefundable: boolean;
    onlyInstantBook: boolean;            // V6: Brzi filter samo za ⚡
    budgetFrom: string;
    budgetTo: string;
    budgetType: BudgetType;
}

// ─────────────────────────────────────────────────────────────
// 7. PACKAGE BASKET (Korpa za Pakete)
// ─────────────────────────────────────────────────────────────
export type PackageItemType = 'flight' | 'hotel-room' | 'transfer' | 'activity' | 'insurance' | 'car' | 'cruise' | 'tour';

export interface PackageBasketItem {
    id: string;
    type: PackageItemType;
    label: string;              // Npr. "Air Serbia - BEG→CDG"
    details: string;            // Npr. "07:30 - 10:45, Ekonomska klasa"
    pricePerUnit: number;       // Cena po osobi ili po usluzi
    totalPrice: number;         // UKUPNA cena za sve putnike/sobe
    currency: string;
    status: AvailabilityStatus;
    provider?: string;
    icon: string;               // Emoji za vizuelni prikaz
    isRemovable: boolean;       // Da li korisnik može da ukloni stavku
}

// ─────────────────────────────────────────────────────────────
// 8. REZULTATI UNIFICIRANI (Orchestrator Output)
// ─────────────────────────────────────────────────────────────
export type ProviderId = 'manual' | 'charter' | 'solvex' | 'amadeus' | 'skyscanner' | 'webbeds' | 'opengreece';

export interface ProviderRef {
    id: ProviderId;
    hotelKey: string;       // Originalni ID iz tog provajdera
    price: number;          // Cena iz tog provajdera
    currency: string;
}

export interface RoomOption {
    id: string;
    name: string;           // Pun naziv (npr. "Standard Double Room")
    description?: string;
    maxAdults: number;
    maxChildren: number;
    maxOccupancy: number;   // Ukupan kapacitet sobe
    mealPlans: MealPlanOption[];
}

export interface MealPlanOption {
    code: string;           // 'BB', 'HB', 'FB', 'AI', 'RO'
    label: string;          // Pun naziv: "Noćenje sa doručkom", "Polupansion"...
    totalPrice: number;     // UKUPNA cena za sve putnike, sva noćenja
    pricePerPersonPerNight: number;
    status: AvailabilityStatus;
    isRefundable: boolean;
    cancellationDeadline?: string;  // Datum do kada je besplatno otkazivanje
}

export interface HotelSearchResult {
    id: string;
    name: string;
    stars: number;
    rating?: number;        // Ocena gostiju (npr. 8.6)
    ratingCount?: number;
    images: string[];
    location: {
        city: string;
        country: string;
        address?: string;
        lat?: number;
        lng?: number;
    };
    isPrime: boolean;       // 🏆 Vaš inventar - PRIME badge
    priority: number;       // Orchestrator weight
    lowestTotalPrice: number;       // Najniža dostupna cena (sve sobe, sve usluge)
    lowestMealPlanLabel: string;    // Npr. "Noćenje sa doručkom" uz najnižu cenu
    currency: string;
    status: AvailabilityStatus;     // Status za celu karticu hotela
    amenities?: string[];
    description?: string;
    roomOptions?: RoomOption[];     // Popunjava se pri ulasku u detalje hotela
    allocationResults?: Record<number, any[]>; // Faza 6: Multi-room rezultati iz Orchestratora

    // Failover Logic (Kritično za silent booking recovery)
    primaryProvider: ProviderRef;
    failoverProvider?: ProviderRef;
}

// ─────────────────────────────────────────────────────────────
// 9. PRIKAZ UPOZORENJA I NOTIFIKACIJA
// ─────────────────────────────────────────────────────────────
export type AlertSeverity = 'info' | 'warning' | 'error';

export interface SearchAlert {
    id: string;
    severity: AlertSeverity;
    message: string;
    actionLabel?: string;
    onAction?: () => void;
}

// ─────────────────────────────────────────────────────────────
// 10. ALTERNATIVNI DATUMI (Alternative Date Engine)
// ─────────────────────────────────────────────────────────────
export interface AlternativeDateSuggestion {
    checkIn: string;
    checkOut: string;
    nights: number;
    label: string;           // Npr. "Najbliži slobodan termin pre"
    lowestPrice?: number;
    currency?: string;
}

// ─────────────────────────────────────────────────────────────
// 11. SMART CONCIERGE (Upsell / Cross-sell)
// ─────────────────────────────────────────────────────────────
export interface ConciergeOffer {
    id: string;
    type: PackageItemType;
    title: string;           // Npr. "🚐 Privatni transfer do hotela"
    description: string;     // Kratki upsell tekst
    price: number;
    currency: string;
    imageUrl?: string;
    hotelTag?: string;       // Koji hotel/destinacija okida ovu ponudu
}

// ─────────────────────────────────────────────────────────────
// 12. LETOVI — Tipovi
// ─────────────────────────────────────────────────────────────
export type CabinClass = 'economy' | 'premium' | 'business' | 'first';
export type TripType   = 'roundtrip' | 'oneway' | 'multicity';

export interface FlightSearchParams {
    tripType: TripType;
    origin: string;             // IATA kod, npr. 'BEG'
    originCity: string;
    destination: string;
    destinationCity: string;
    departDate: string;
    returnDate?: string;
    adults: number;
    children: number;
    infants: number;
    cabinClass: CabinClass;
    directOnly: boolean;
}

/** Jedan segment leta (BEG → VIE ili VIE → TIV) */
export interface FlightSegment {
    origin: string;             // IATA
    destination: string;
    departTime: string;         // ISO datetime string
    arriveTime: string;
    duration: number;           // minuti
    flightNo: string;           // Npr. 'JU 322'
    aircraft?: string;
    operatedBy?: string;        // Za code-share
    originCity?: string;        // Pun naziv grada polaska
    originAirport?: string;     // Pun naziv aerodroma polaska
    destinationCity?: string;   // Pun naziv grada dolaska
    destinationAirport?: string;// Pun naziv aerodroma dolaska
}

/** Jedan pravac (može imati više segmenata ako ima presedanja) */
export interface FlightLeg {
    id: string;
    direction: 'outbound' | 'return';
    segments: FlightSegment[];
    totalDuration: number;      // Ukupno vreme u minutima (let + čekanje)
    stops: number;              // 0 = direktan
    stopoverAirports: string[];
    stopoverDuration?: number;  // Čekanje na presedanju u minutima
    price: number;              // Ukupna cena za sve putnike
    pricePerPerson: number;
    currency: string;
    status: AvailabilityStatus;
    isRefundable: boolean;
    baggageIncluded: boolean;   // Da li ručni prtljag uključen
    checkedBagIncluded: boolean;
    fareBrand?: string;         // Npr. 'FLEX', 'LITE', 'PLUS'
    provider: string;           // 'air-serbia' | 'amadeus' | ...
    isPrime?: boolean;
}

/** Kompletna pretraga leta (polazak + povratak) */
export interface FlightSearchResult {
    id: string;
    outbound: FlightLeg;
    inbound?: FlightLeg;        // Samo za roundtrip
    totalPrice: number;         // Polazak + Povratak
    currency: string;
    airline: string;
    airlineLogo: string;        // Emoji ili URL logoa
    isPrime: boolean;
    priority: number;
}

// ─────────────────────────────────────────────────────────────
// 13. ČARTERI — Tipovi
// ─────────────────────────────────────────────────────────────
export interface CharterSearchParams {
    originCode: string;         // IATA — npm. 'BEG'
    originCity: string;
    destinationCode: string;
    destinationCity: string;
    departMonth: string;        // 'YYYY-MM' format
    adults: number;
    children: number;
    infants: number;
    flexWeeks: number;          // 0 = tačna nedelja, 1 = ±1 ned, 2 = ceo mesec
}

/** Jedan planirani polazak na čarter relaciji */
export interface CharterDeparture {
    id: string;
    departDate: string;         // 'YYYY-MM-DD'
    returnDate: string;
    nights: number;
    availableSeats: number;     // 0 = rasprodato
    totalSeats: number;
    pricePerPerson: number;
    totalPrice: number;         // Za sve putnike
    currency: string;
    status: AvailabilityStatus;
    isOwnAllotment: boolean;    // true = naš čarter (prioritet)
    allotmentNote?: string;     // 'Posljednja 4 mesta!' i sl.
}

/** Čarter relacija sa svim polascima */
export interface CharterResult {
    id: string;
    airline: string;
    airlineLogo: string;
    origin: string;             // IATA
    originCity: string;
    destination: string;
    destinationCity: string;
    flightDuration: number;     // minuti
    flightNo: string;
    departureTime: string;      // 'HH:MM'
    returnTime: string;
    cabinClass: CabinClass;
    baggageIncluded: boolean;
    checkedBagKg: number;       // 0 = nije uključen
    departures: CharterDeparture[];
    isPrime: boolean;           // Vlastiti allotment
    contractType: 'own' | 'block' | 'seat-only';
}

// ─────────────────────────────────────────────────────────────
// 13. TRANSFERI — Tipovi
// ─────────────────────────────────────────────────────────────
export type TransferType = 'private' | 'shared' | 'shuttle' | 'bus' | 'vip';
export type TransferDirection = 'one-way' | 'round-trip';

export interface TransferSearchParams {
    pickupType: 'airport' | 'hotel' | 'address' | 'port';
    pickupCode: string;             // IATA ili mesto kod
    pickupName: string;
    dropoffType: 'airport' | 'hotel' | 'address' | 'port';
    dropoffCode: string;
    dropoffName: string;
    departureDate: string;          // 'YYYY-MM-DD'
    departureTime: string;          // 'HH:MM'
    returnDate?: string;            // Za round-trip
    returnTime?: string;
    direction: TransferDirection;
    adults: number;
    children: number;
    infants: number;
    flightNo?: string;              // Za aerodromske transfere (flight tracking)
}

export interface TransferVehicle {
    id: string;
    name: string;                   // npr. 'Mercedes Vito 8-sed'
    image: string;                  // Emoji
    category: TransferType;
    categoryLabel: string;
    seats: number;
    luggage: number;                // Broj kofera
    hasAC: boolean;
    hasMeetGreet: boolean;         // Čekanje na tablu u terminalu
    hasFlightTracking: boolean;    // Prati let i čeka na kašnjenje
    hasChildSeat: boolean;
    hasWifi: boolean;
}

export interface TransferResult {
    id: string;
    supplierId: string;
    supplierName: string;
    supplierLogo: string;
    vehicle: TransferVehicle;
    pickupName: string;
    dropoffName: string;
    distance: number;               // km
    durationMinutes: number;
    priceOneWay: number;
    priceRoundTrip: number;
    currency: string;
    status: AvailabilityStatus;
    isPrime: boolean;               // Vlastiti vozački park
    priority: number;
    cancellationPolicy: string;     // npr. 'Besplatno otkazivanje 24h pre'
    notes?: string;
    rating?: number;                // 1-5, opcionalno
    reviewCount?: number;
}
// ─────────────────────────────────────────────────────────────
// 14. PUTOVANJA (TOURS) — Tipovi
// ─────────────────────────────────────────────────────────────
export type TourCategory = 'bus' | 'flight' | 'exotic' | 'cruise-tour' | 'weekend' | 'ski' | 'adventure';

export interface TourSearchParams {
    destination: string;         // Zemlja, regija ili grad
    destinationName: string;
    monthOfTravel: string;       // npr. '2026-06' ili 'any'
    durationDaysMin: number;
    durationDaysMax: number;
    category: TourCategory | 'all';
    adults: number;
    children: number;
    infants: number;
}

export interface TourDay {
    dayNumber: number;
    title: string;
    description: string;
    mealsIncluded?: ('D' | 'R' | 'V')[]; // Doručak, Ručak, Večera
}

export interface TourIncluded {
    flights: boolean;
    transfers: boolean;
    hotels: boolean;
    guide: boolean;             // Vodič na srpskom
    insurance: boolean;
    meals: boolean;
    visas: boolean;
}

export interface TourResult {
    id: string;
    name: string;               // npr. "Velika tura kroz Italiju"
    image: string;              // Emoji ili URL
    supplierName: string;
    supplierLogo: string;
    destinationName: string;
    category: TourCategory;
    categoryLabel: string;
    durationDays: number;
    durationNights: number;
    departureDates: string[];   // Lista raspoloživih datuma polaska
    transportType: 'bus' | 'plane' | 'mixed';
    includedPax: number;        // Koliko putnika je obuhvaćeno cenom
    pricePerPerson: number;
    totalPrice: number;
    currency: string;
    included: TourIncluded;
    itinerarySummary: string;
    itineraryDetails: TourDay[];
    status: AvailabilityStatus;
    isPrime?: boolean;          // PrimeClick Travel vlastiti aranžman
    cancellationPolicy: string;
    rating?: number;
    reviewCount?: number;
}

// ─────────────────────────────────────────────────────────────
// 15. IZLETI I AKTIVNOSTI (THINGS TO DO)
// ─────────────────────────────────────────────────────────────
export type ActivityCategory = 'culture' | 'nature' | 'adrenaline' | 'water' | 'tickets' | 'gastronomy';

export interface ActivitySearchParams {
    location: string;
    locationName: string;
    date: string;
    category: ActivityCategory | 'all';
    pax: number;
}

export interface ActivityResult {
    id: string;
    title: string;
    image: string;
    locationName: string;
    category: ActivityCategory;
    supplierName: string;
    durationDescription: string;
    pricePerPerson: number;
    currency: string;
    status: AvailabilityStatus;
    isPrime?: boolean;
    cancellationPolicy: string;
    included: string[];
    rating?: number;
    reviewCount?: number;
}

// ─────────────────────────────────────────────────────────────
// 16. KRSTARENJA (CRUISES)
// ─────────────────────────────────────────────────────────────
export type CruiseRegion = 'mediterranean' | 'caribbean' | 'northern-europe' | 'middle-east' | 'world' | 'river' | 'all';
export type CabinType = 'inside' | 'oceanview' | 'balcony' | 'suite';

export interface CruiseSearchParams {
    region: CruiseRegion;
    portOfDeparture: string;     // Prazno na frontend-u => "Sve luke"
    monthOfTravel: string;       // YYYY-MM
    durationDays: number;        // npr 7
    pax: number;
}

export interface CruiseDay {
    dayNumber: number;
    port: string;
    arrivalTime?: string;        // Opciono (npr plovidba tokom dana)
    departureTime?: string;
    isSeaDay: boolean;           // Dan na moru = true
}

export interface CruiseCabinOption {
    type: CabinType;
    label: string;
    pricePerPerson: number;
    available: number;
    included: string[];          // npr. "Lučke takse", "Piće uz obrok"
}

export interface CruiseResult {
    id: string;
    cruiseLine: string;          // npr. MSC Cruises
    cruiseLineLogo: string;
    shipName: string;            // npr. MSC World Europa
    image: string;
    regionName: string;
    durationDays: number;
    durationNights: number;
    departureDate: string;
    portOfDeparture: string;
    itinerarySummary: string[];  // ['Đenova', 'Napulj', 'Mesina', 'Valeta', 'Barselona', 'Marsej']
    itineraryDetails: CruiseDay[];
    cabins: CruiseCabinOption[];
    status: AvailabilityStatus;
    isPrime?: boolean;
    cancellationPolicy: string;
    rating?: number;
    reviewCount?: number;
}

// ─────────────────────────────────────────────────────────────
export type Theme = 'light' | 'navy';
export type CarCategory = 'mini' | 'economy' | 'compact' | 'standard' | 'fullsize' | 'suv' | 'premium' | 'van' | 'convertible';
export type TransmissionType = 'manual' | 'automatic';
export type FuelType = 'petrol' | 'diesel' | 'electric' | 'hybrid';

export interface CarSearchParams {
    pickupLocationCode: string;     // IATA ili grad kod
    pickupLocationName: string;
    dropoffLocationCode: string;    // Prazno = isti kao pickup
    dropoffLocationName: string;
    pickupDate: string;             // 'YYYY-MM-DD'
    pickupTime: string;             // 'HH:MM'
    dropoffDate: string;
    dropoffTime: string;
    driverAge: number;              // Default: 30
    driverNationality: string;      // 'RS' default
}

export interface CarIncludedPolicy {
    unlimitedMileage: boolean;
    theftProtection: boolean;
    collisionDamageWaiver: boolean;
    liabilityInsurance: boolean;
    freeCancellationHours: number;  // 0 = nema, 48 = 48h pre
}

export interface CarVehicle {
    id: string;
    supplierId: string;
    supplierName: string;
    supplierLogo: string;           // Emoji ili URL
    name: string;                   // npr. 'Volkswagen Golf ili sličan'
    category: CarCategory;
    categoryLabel: string;
    image: string;                  // Emoji placeholder
    transmission: TransmissionType;
    fuel: FuelType;
    seats: number;
    doors: number;
    largeBags: number;
    smallBags: number;
    hasAC: boolean;
    minDriverAge: number;
    pricePerDay: number;
    totalPrice: number;             // pricePerDay × dana
    priceCurrency: string;
    depositAmount: number;          // Blokada na kartici
    status: AvailabilityStatus;
    policy: CarIncludedPolicy;
    pickupLocationName: string;
    dropoffLocationName: string;
    isPrime: boolean;
    priority: number;
}

// ─────────────────────────────────────────────────────────────
// 15. GLOBALNI STATE (Zustand Store Shape)
// ─────────────────────────────────────────────────────────────
export interface SearchState {
    // Tab & Mode
    activeTab: SearchTabType;
    searchMode: SearchModeType;
    semanticQuery: string; // NEW: AI Narrative raw text

    // Destinacije (max 3)
    destinations: Destination[];

    // Datumi
    checkIn: string;        // ISO format: '2026-08-10'
    checkOut: string;       // ISO format: '2026-08-17'
    flexDays: number;       // 0, 3 ili 7

    // Putnici & Sobe
    roomAllocations: RoomAllocation[];  // Niz soba
    nationality: string;    // Default: 'RS'

    // Filteri
    filters: SearchFilters;

    // Sortiranje
    sortBy: 'smart' | 'price_asc' | 'price_desc' | 'stars_desc' | 'rating_desc';

    // Status Pretrage
    isSearching: boolean;
    searchPerformed: boolean;

    // Hotel Rezultati
    results: HotelSearchResult[];
    selectedHotel: HotelSearchResult | null;

    // Flight Rezultati
    flightSearchParams: FlightSearchParams | null;
    flightResults: FlightSearchResult[];
    selectedFlight: FlightSearchResult | null;

    // Charter Rezultati
    charterSearchParams: CharterSearchParams | null;
    charterResults: CharterResult[];

    // Rent-a-Car Rezultati
    carSearchParams: CarSearchParams | null;
    carResults: CarVehicle[];

    // Transfer Rezultati
    transferSearchParams: TransferSearchParams | null;
    transferResults: TransferResult[];

    // Putovanja (Tours) Rezultati
    tourSearchParams: TourSearchParams | null;
    tourResults: TourResult[];

    // Izleti i Aktivnosti Rezultati
    activitySearchParams: ActivitySearchParams | null;
    activityResults: ActivityResult[];

    // Krstarenja Rezultati
    cruiseSearchParams: CruiseSearchParams | null;
    cruiseResults: CruiseResult[];

    // Package Wizard
    packageBasket: PackageBasketItem[];
    packageWizardStep: number;          // 1–6 (aktivni korak)
    packageWizardSelections: {
        flight?: FlightSearchResult;
        outboundFlight?: FlightLeg;
        returnFlight?: FlightLeg;
        hotelId?: string;
        roomId?: string;
        mealPlanCode?: string;
        transferId?: string;
        extraIds: string[];
    };

    showPackageCheckout: boolean;

    // Upozorenja
    alerts: SearchAlert[];

    // Alternative datumi (kada nema rezultata)
    alternativeDates: AlternativeDateSuggestion[];

    // Smart Concierge ponude
    conciergeOffers: ConciergeOffer[];

    // ─────────────────────────────────────────────────────────────
    // 16. SAVED OFFERS & ALERTS (NEW: Faza 6)
    // ─────────────────────────────────────────────────────────────
    savedOffers: SavedOffer[];
    lastPriceChangeNotification?: PriceChangeNotification;

    // ─────────────────────────────────────────────────────────────
    // 17. INTERACTIVE & RANGE (NEW: Faza 6.1)
    // ─────────────────────────────────────────────────────────────
    pendingClarification: {
        type: 'pax_split' | 'dates' | null;
        question: string;
        options: Array<{ label: string, value: any }>;
    } | null;
    dateRangeResults: Array<{
        checkIn: string;
        checkOut: string;
        price: number;
        currency: string;
        isRecommended?: boolean;
    }>;
}

export interface SavedOffer {
    id: string;
    type: 'hotel' | 'flight' | 'package';
    label: string;
    description: string;
    totalPrice: number;
    currency: string;
    timestamp: number;
    // Data needed to recreate the offer or re-check price
    data: any; 
    hasPriceDropAlert: boolean;
}

export interface PriceChangeNotification {
    offerId: string;
    oldPrice: number;
    newPrice: number;
    currency: string;
    isHigher: boolean;
}
// ─────────────────────────────────────────────────────────────
// 17. DYNAMIC PACKAGE OPTIONS (NEW: Faza 6)
// ─────────────────────────────────────────────────────────────
export interface TransferOption {
    id: string;
    type: 'shared' | 'private' | 'luxury';
    vehicle: string;
    from: string;
    to: string;
    fromCode: string;           // Aerodrom IATA
    toLabel: string;            // Naziv hotela / grada
    durationMinutes: number;
    distanceKm: number;
    pricePerPerson: number;
    totalPrice: number;         // Za sve putnike
    currency: string;
    maxPassengers: number;
    includes: string[];         // ['A/C', 'Bespl. čekanje 60min', ...]
    status: AvailabilityStatus;
    isPrime: boolean;
}

export interface ActivityOption {
    id: string;
    category: 'tour' | 'sport' | 'culture' | 'food' | 'wellness' | 'insurance';
    title: string;
    description: string;
    emoji: string;
    durationHours: number;
    departureTime?: string;
    meetingPoint?: string;
    includes: string[];
    pricePerPerson: number;
    totalPrice: number;          // Za sve putnike
    currency: string;
    status: AvailabilityStatus;
    minParticipants?: number;
    maxParticipants?: number;
    isRefundable: boolean;
    cancellationHours?: number;  // Besplatno otkazivanje do N sati pre
}
