/**
 * Flight API Types
 * 
 * Unified type definitions for flight search, booking, and management
 * across multiple providers (Amadeus, Kiwi.com, Duffel, TravelFusion)
 */

// ============================================================================
// CORE TYPES
// ============================================================================

export type FlightProvider = 'amadeus' | 'kiwi' | 'duffel' | 'travelFusion' | 'mock' | 'Kyte';
export type CabinClass = 'economy' | 'premium_economy' | 'business' | 'first';
export type PassengerType = 'adult' | 'child' | 'infant';
export type BookingStatus = 'confirmed' | 'pending' | 'processing' | 'failed' | 'cancelled';

// ============================================================================
// UNIFIED FLIGHT MODEL (UFM)
// ============================================================================

/**
 * Unified Flight Offer
 * Normalizovani model koji agregira podatke iz svih provajdera
 */
export interface UnifiedFlightOffer {
    // Identifikacija
    id: string;
    provider: FlightProvider;

    // Cena
    price: FlightPrice;

    // Itinerar (putovanje)
    slices: FlightSlice[];

    // Metadata
    bookingToken: string;
    validUntil: string; // ISO datetime
    cabinClass: CabinClass;

    // Dodatne informacije
    baggageAllowance?: BaggageAllowance;
    amenities?: string[];
    validatingAirlineCodes?: string[];

    // Provider-specific raw data (za debugging i advanced features)
    originalData: any;
}

/**
 * Flight Price Structure
 */
export interface FlightPrice {
    total: number;
    base: number;
    taxes: number;
    fees?: number;
    currency: string;

    // Breakdown po putniku (opciono)
    perPassenger?: {
        adult?: number;
        child?: number;
        infant?: number;
    };
}

/**
 * Flight Slice (Deo putovanja - npr. odlazak ili povratak)
 */
export interface FlightSlice {
    origin: Airport;
    destination: Airport;
    departure: string; // ISO datetime
    arrival: string; // ISO datetime
    duration: number; // minuti

    // Segmenti (pojedinačni letovi)
    segments: FlightSegment[];

    // Dodatne informacije
    stops: number; // Broj presedanja
    overnight?: boolean; // Da li uključuje noćenje
}

/**
 * Flight Segment (Pojedinačni let)
 */
export interface FlightSegment {
    // Avio-kompanija
    carrierCode: string; // IATA kod (npr. "JU", "AF")
    carrierName: string; // Puno ime (npr. "Air Serbia")
    flightNumber: string; // Broj leta (npr. "JU500")

    // Avion
    aircraft?: string; // Tip aviona (npr. "A320")

    // Ruta
    origin: Airport;
    destination: Airport;
    departure: string; // ISO datetime
    arrival: string; // ISO datetime
    duration: number; // minuti

    // Dodatne informacije
    operatingCarrier?: string; // Ako je codeshare
    cabinClass?: CabinClass;
    bookingClass?: string; // Fare class (npr. "Y", "J")
}

/**
 * Airport Information
 */
export interface Airport {
    iataCode: string; // 3-letter kod (npr. "BEG")
    name: string; // Puno ime (npr. "Belgrade Nikola Tesla Airport")
    city: string;
    country: string;
    countryCode?: string; // ISO 2-letter (npr. "RS")
    terminal?: string;
}

/**
 * Baggage Allowance
 */
export interface BaggageAllowance {
    cabin?: {
        quantity: number;
        weight?: number; // kg
        dimensions?: string; // npr. "55x40x20cm"
    };
    checked?: {
        quantity: number;
        weight?: number; // kg
    };
}

// ============================================================================
// SEARCH PARAMETERS
// ============================================================================

/**
 * Flight Search Parameters
 */
export interface FlightSearchParams {
    // Ruta
    origin: string; // IATA kod
    destination: string; // IATA kod

    // Datumi
    departureDate: string; // YYYY-MM-DD
    returnDate?: string; // YYYY-MM-DD (opciono za one-way)

    // Putnici
    adults: number;
    children: number;
    childrenAges: number[];
    infants?: number;

    // Preferencije
    cabinClass?: CabinClass;
    currency?: string; // ISO 3-letter (npr. "EUR", "RSD")

    // Napredne opcije
    directFlightsOnly?: boolean;
    maxStops?: number;
    preferredCarriers?: string[]; // IATA kodovi
    maxPrice?: number;

    // Provider-specific
    providerFilters?: {
        amadeus?: any;
        kiwi?: any;
        duffel?: any;
        travelFusion?: any;
    };
}

/**
 * Search Response
 */
export interface FlightSearchResponse {
    success: boolean;
    offers: UnifiedFlightOffer[];
    searchId?: string;

    // Metadata
    totalResults: number;
    providers: {
        provider: FlightProvider;
        status: 'complete' | 'in_progress' | 'failed';
        resultCount: number;
        error?: string;
    }[];

    // Timing
    searchTime: number; // milliseconds
    timestamp: string; // ISO datetime
}

// ============================================================================
// BOOKING TYPES
// ============================================================================

/**
 * Passenger Details for Booking
 */
export interface PassengerDetails {
    // Tip
    type: PassengerType;

    // Osnovno
    title?: 'mr' | 'mrs' | 'ms' | 'miss' | 'dr';
    firstName: string;
    lastName: string;
    middleName?: string;
    dateOfBirth: string; // YYYY-MM-DD
    gender: 'M' | 'F' | 'X';

    // Kontakt (obavezno za prvog putnika)
    email?: string;
    phone?: string;

    // Dokumenti
    passport?: PassportDetails;

    // Dodatno
    frequentFlyerNumber?: string;
    specialRequests?: string[];

    // Za bebe - povezivanje sa odraslim
    associatedAdultId?: string;
}

/**
 * Passport Details
 */
export interface PassportDetails {
    number: string;
    expiryDate: string; // YYYY-MM-DD
    issuingCountry: string; // ISO 2-letter
    nationality?: string; // ISO 2-letter
}

/**
 * Payment Details
 */
export interface PaymentDetails {
    method: 'credit_card' | 'debit_card' | 'bank_transfer' | 'wallet' | 'agent_link' | 'ips_qr';

    // Za kartice
    cardNumber?: string;
    cardHolderName?: string;
    expiryMonth?: string;
    expiryYear?: string;
    cvv?: string;

    // Billing adresa
    billingAddress?: {
        street: string;
        city: string;
        postalCode: string;
        country: string;
    };
}

/**
 * Flight Booking Request
 */
export interface FlightBookingRequest {
    // Offer
    offerId: string;
    provider: FlightProvider;
    bookingToken: string;

    // Putnici
    passengers: PassengerDetails[];

    // Plaćanje
    payment: PaymentDetails;

    // Dodatne usluge
    selectedSeats?: SeatSelection[];
    extraBaggage?: BaggageSelection[];
    specialMeals?: MealSelection[];

    // Metadata
    customerReference?: string;
    agencyReference?: string;
    notes?: string;
}

/**
 * Seat Selection
 */
export interface SeatSelection {
    passengerId: string;
    segmentId: string;
    seatNumber: string;
    price?: number;
}

/**
 * Baggage Selection
 */
export interface BaggageSelection {
    passengerId: string;
    segmentId: string;
    quantity: number;
    weight: number;
    price: number;
}

/**
 * Meal Selection
 */
export interface MealSelection {
    passengerId: string;
    segmentId: string;
    mealCode: string; // IATA meal codes (npr. "VGML", "KSML")
    price?: number;
}

/**
 * Booking Response
 */
export interface FlightBookingResponse {
    success: boolean;
    status: BookingStatus;

    // Booking Reference
    bookingReference?: string; // Naš interni ID
    pnr?: string; // Airline PNR (6-character)

    // Provider-specific
    providerBookingId?: string;

    // Detalji
    offer?: UnifiedFlightOffer;
    passengers?: PassengerDetails[];
    totalPrice?: FlightPrice;

    // Dokumenti
    ticketNumbers?: string[];
    eTicketUrls?: string[];

    // Poruke
    message?: string;
    errors?: string[];

    // Timing
    bookedAt?: string; // ISO datetime

    // Provider raw data
    originalData?: any;
}

// ============================================================================
// VALIDATION TYPES
// ============================================================================

/**
 * Pre-Booking Validation Request
 */
export interface FlightValidationRequest {
    offerId: string;
    provider: FlightProvider;
    bookingToken: string;
    passengers?: PassengerDetails[]; // Za validaciju broja putnika
}

/**
 * Validation Response
 */
export interface FlightValidationResponse {
    valid: boolean;

    // Promene
    priceChanged: boolean;
    newPrice?: FlightPrice;

    // Dostupnost
    available: boolean;
    seatsRemaining?: number;

    // Poruke
    message?: string;
    warnings?: string[];

    // Ažurirani booking token (ako je potrebno)
    updatedBookingToken?: string;

    // Timestamp
    validatedAt: string; // ISO datetime
}

// ============================================================================
// ERROR TYPES
// ============================================================================

/**
 * Flight API Error
 */
export interface FlightAPIError {
    provider: FlightProvider;
    code: string;
    message: string;
    details?: any;
    originalError?: any;
    timestamp: string;
}

// ============================================================================
// PROVIDER-SPECIFIC TYPES (za internal use)
// ============================================================================

/**
 * Provider Configuration
 */
export interface ProviderConfig {
    name: FlightProvider;
    enabled: boolean;
    priority: number; // Za sortiranje rezultata

    // Auth
    apiKey?: string;
    apiSecret?: string;
    baseUrl: string;

    // Limits
    timeout?: number; // milliseconds
    maxRetries?: number;

    // Features
    supportsVirtualInterlining?: boolean;
    supportsNDC?: boolean;
    supportsLCC?: boolean;
}

/**
 * Provider Status
 */
export interface ProviderStatus {
    provider: FlightProvider;
    status: 'online' | 'offline' | 'degraded';
    lastCheck: string; // ISO datetime
    responseTime?: number; // milliseconds
    errorRate?: number; // percentage
}
