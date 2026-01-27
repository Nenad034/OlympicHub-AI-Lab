/**
 * Dynamic Package Types
 * 
 * Type definitions for Dynamic Package Builder
 */

// ============================================================================
// PACKAGE
// ============================================================================

export interface DynamicPackage {
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
    updatedAt: string;
    status: 'draft' | 'confirmed' | 'cancelled';
}

// ============================================================================
// DESTINATIONS
// ============================================================================

export interface PackageDestination {
    id: string;
    city: string;
    country: string;
    countryCode: string;
    arrivalDate: string;
    departureDate: string;
    nights: number;
    sequence: number; // Order in itinerary
}

// ============================================================================
// FLIGHTS
// ============================================================================

export interface PackageFlight {
    id: string;
    type: 'outbound' | 'return' | 'internal';
    origin: string;
    destination: string;
    departureDate: string;
    departureTime: string;
    arrivalDate: string;
    arrivalTime: string;
    flightNumber: string;
    airline: string;
    airlineName: string;
    duration: number; // minutes
    stops: number;
    price: number;
    currency: string;
    bookingReference?: string;
}

// ============================================================================
// HOTELS
// ============================================================================

export interface PackageHotel {
    id: string;
    destinationId: string;
    destination: string;
    hotelName: string;
    hotelCode: string;
    stars: number;
    checkIn: string;
    checkOut: string;
    nights: number;
    roomType: string;
    mealPlan: 'RO' | 'BB' | 'HB' | 'FB' | 'AI';
    mealPlanName: string;
    price: number;
    currency: string;
    bookingReference?: string;
}

// ============================================================================
// TRANSFERS
// ============================================================================

export interface PackageTransfer {
    id: string;
    type: 'airport_to_hotel' | 'hotel_to_airport' | 'inter_hotel';
    from: string;
    to: string;
    date: string;
    time: string;
    vehicleType: 'private' | 'shared' | 'shuttle';
    vehicleName: string;
    passengers: number;
    price: number;
    currency: string;
    duration?: number; // minutes
}

// ============================================================================
// EXTRAS
// ============================================================================

export interface PackageExtra {
    id: string;
    type: 'ticket' | 'tour' | 'restaurant' | 'activity';
    name: string;
    description: string;
    destinationId: string;
    destination: string;
    date: string;
    time?: string;
    duration?: number; // minutes
    price: number;
    currency: string;
    quantity: number;
    totalPrice: number;
}

// ============================================================================
// ITINERARY
// ============================================================================

export interface DayByDayItinerary {
    day: number;
    date: string;
    dayOfWeek: string;
    destination: string;
    activities: ItineraryActivity[];
}

export interface ItineraryActivity {
    id: string;
    time: string;
    type: 'flight' | 'hotel' | 'transfer' | 'extra' | 'free_time';
    icon: string;
    title: string;
    description: string;
    location?: string;
    duration?: string;
    componentId?: string; // Reference to flight/hotel/transfer/extra
    details?: any; // Full component data
}

// ============================================================================
// PRICING
// ============================================================================

export interface PackagePricing {
    flights: number;
    hotels: number;
    transfers: number;
    extras: number;
    subtotal: number;
    taxes: number;
    total: number;
    currency: string;
    perPerson: number;
    breakdown: PriceBreakdownItem[];
}

export interface PriceBreakdownItem {
    category: string;
    name: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
}

// ============================================================================
// BUILDER STATE
// ============================================================================

export interface PackageBuilderState {
    currentStep: number;
    package: Partial<DynamicPackage>;
    isLoading: boolean;
    errors: Record<string, string>;
}

// ============================================================================
// SEARCH PARAMS
// ============================================================================

export interface DestinationSearchParams {
    city: string;
    country: string;
    checkIn: string;
    checkOut: string;
}

export interface FlightSearchParams {
    segments: FlightSegment[];
    passengers: number;
    cabinClass: string;
}

export interface FlightSegment {
    origin: string;
    destination: string;
    date: string;
}

export interface HotelSearchParams {
    destination: string;
    checkIn: string;
    checkOut: string;
    rooms: number;
    adults: number;
    children: number;
}

export interface TransferSearchParams {
    from: string;
    to: string;
    date: string;
    time: string;
    passengers: number;
}

// ============================================================================
// EXTRAS CATALOG
// ============================================================================

export interface ExtrasCatalogItem {
    id: string;
    type: 'ticket' | 'tour' | 'restaurant' | 'activity';
    name: string;
    description: string;
    destination: string;
    destinations: string[]; // Available in multiple cities
    duration?: number;
    price: number;
    currency: string;
    image?: string;
    rating?: number;
    reviews?: number;
    popular?: boolean;
}

// ============================================================================
// MEAL PLANS
// ============================================================================

export const MEAL_PLANS = {
    RO: 'Room Only',
    BB: 'Bed & Breakfast',
    HB: 'Half Board',
    FB: 'Full Board',
    AI: 'All Inclusive'
} as const;

// ============================================================================
// VEHICLE TYPES
// ============================================================================

export const VEHICLE_TYPES = {
    private: 'Private Transfer',
    shared: 'Shared Shuttle',
    shuttle: 'Airport Shuttle'
} as const;
