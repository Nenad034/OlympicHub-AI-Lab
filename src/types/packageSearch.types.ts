// Package Search Wizard Types

import type { UnifiedFlightOffer, FlightSearchParams } from './flight.types';
import type { DynamicPackage, PackageDestination, PackageFlight, PackageHotel, PackageTransfer, PackageExtra } from './package.types';

// ============================================================================
// Basic Info (Moved up for better module resolution)
// ============================================================================

import type { BasicInfoData, TravelerCount, DestinationInput } from './step1.types';
export * from './step1.types';

export type {
    UnifiedFlightOffer,
    FlightSearchParams,
    DynamicPackage,
    PackageDestination,
    PackageFlight,
    PackageHotel,
    PackageTransfer,
    PackageExtra
};

// ============================================================================
// Wizard State
// ============================================================================

export interface WizardStep {
    id: number;
    name: string;
    title: string;
    description: string;
    isComplete: boolean;
    isActive: boolean;
}

export interface PackageSearchState {
    currentStep: number;
    steps: WizardStep[];
    basicInfo: BasicInfoData | null;
    selectedFlights: PackageFlight[];
    selectedHotels: PackageHotel[];
    selectedTransfers: PackageTransfer[];
    selectedExtras: PackageExtra[];
    totalPrice: number;
    isDraft: boolean;
}

// Step 1: Basic Info
// ============================================================================

// Definitions moved to top for better module resolution

// ============================================================================
// Step 2: Flight Selection
// ============================================================================

export interface FlightSearchRequest {
    origin: string;
    destination: string;
    departureDate: string;
    returnDate?: string;
    passengers: {
        adults: number;
        children: number;
    };
    cabinClass: 'economy' | 'premium_economy' | 'business' | 'first';
    directFlightsOnly?: boolean;
    maxStops?: number;
}

export interface FlightSelectionData {
    outboundFlight: UnifiedFlightOffer | null;
    returnFlight: UnifiedFlightOffer | null;
    multiCityFlights: UnifiedFlightOffer[];
    totalPrice: number;
}

// ============================================================================
// Step 3: Hotel Selection
// ============================================================================

export interface HotelSearchRequest {
    destination: string;
    checkIn: string;
    checkOut: string;
    rooms: number;
    adults: number;
    children: number;
    minStars?: number;
    maxPrice?: number;
}

export interface Hotel {
    id: string;
    name: string;
    stars: number;
    address: string;
    city: string;
    country: string;
    latitude: number;
    longitude: number;
    images: string[];
    description: string;
    amenities: string[];
    rooms: HotelRoom[];
    reviews: {
        rating: number;
        count: number;
    };
    distance?: {
        city_center: number;
        airport: number;
    };
}

export interface HotelRoom {
    id: string;
    name: string;
    description: string;
    capacity: {
        adults: number;
        children: number;
    };
    bedType: string;
    size: number; // m²
    amenities: string[];
    mealPlans: MealPlan[];
    images: string[];
}

export interface MealPlan {
    id: string;
    code: 'RO' | 'BB' | 'HB' | 'FB' | 'AI';
    name: string;
    description: string;
    price: number;
}

export interface HotelSelectionData {
    destinationId: string;
    hotel: Hotel;
    room: HotelRoom;
    mealPlan: MealPlan;
    checkIn: string;
    checkOut: string;
    nights: number;
    totalPrice: number;
}

// ============================================================================
// Step 4: Transfer Selection
// ============================================================================

export interface TransferSearchRequest {
    from: string;
    to: string;
    date: string;
    time: string;
    passengers: number;
    luggage: number;
}

export interface Transfer {
    id: string;
    type: 'airport_hotel' | 'hotel_airport' | 'inter_city' | 'custom';
    from: string;
    to: string;
    distance: number; // km
    duration: number; // minutes
    vehicles: TransferVehicle[];
}

export interface TransferVehicle {
    id: string;
    name: string;
    type: 'sedan' | 'van' | 'minibus' | 'bus' | 'luxury';
    capacity: {
        passengers: number;
        luggage: number;
    };
    amenities: string[];
    image: string;
    price: number;
    currency: string;
}

export interface TransferSelectionData {
    transfer: Transfer;
    vehicle: TransferVehicle;
    date: string;
    time: string;
    totalPrice: number;
}

// ============================================================================
// Step 5: Extras Selection
// ============================================================================

export interface Extra {
    id: string;
    name: string;
    category: 'tour' | 'ticket' | 'activity' | 'restaurant' | 'insurance' | 'other';
    destination: string;
    description: string;
    duration?: string;
    included: string[];
    excluded: string[];
    images: string[];
    price: number;
    currency: string;
    availability: {
        days: string[]; // ['monday', 'tuesday', ...]
        times: string[]; // ['09:00', '14:00', ...]
    };
    minParticipants?: number;
    maxParticipants?: number;
}

export interface ExtraSelectionData {
    extra: Extra;
    date: string;
    time?: string;
    quantity: number;
    totalPrice: number;
}

// ============================================================================
// Step 6: Review & Confirm
// ============================================================================

export interface PackageReview {
    basicInfo: BasicInfoData;
    flights: FlightSelectionData;
    hotels: HotelSelectionData[];
    transfers: TransferSelectionData[];
    extras: ExtraSelectionData[];
    itinerary: PackageItineraryDay[];
    pricing: PackagePricing;
    mapData: PackageMapData;
}

export interface PackageItineraryDay {
    day: number;
    date: string;
    dayOfWeek: string;
    destination: string;
    activities: PackageActivity[];
}

export interface PackageActivity {
    id: string;
    time: string;
    type: 'flight' | 'hotel' | 'transfer' | 'extra' | 'free_time';
    title: string;
    description: string;
    location?: string;
    duration?: string;
    icon: string;
}

export interface PackagePricing {
    flights: number;
    hotels: number;
    transfers: number;
    extras: number;
    subtotal: number;
    taxes: number;
    total: number;
    perPerson: number;
    currency: string;
}

export interface PackageMapData {
    destinations: MapDestination[];
    routes: MapRoute[];
    hotels: MapHotel[];
    center: [number, number]; // [lat, lng]
    zoom: number;
}

export interface MapDestination {
    id: string;
    city: string;
    country: string;
    coordinates: [number, number]; // [lat, lng]
    nights: number;
    checkIn: string;
    checkOut: string;
    order: number;
}

export interface MapRoute {
    id: string;
    from: MapDestination;
    to: MapDestination;
    type: 'flight' | 'transfer';
    color: string;
    dashArray?: string;
}

export interface MapHotel {
    id: string;
    name: string;
    coordinates: [number, number]; // [lat, lng]
    stars: number;
    nights: number;
    destinationId: string;
}

// ============================================================================
// AI Assistant
// ============================================================================

export interface AIPromptRequest {
    prompt: string;
    language: 'sr' | 'en';
}

export interface AIPromptResponse {
    understood: boolean;
    parsedData: BasicInfoData;
    suggestions: string[];
    confidence: number; // 0-1
}

export interface AIPackageSuggestion {
    id: string;
    name: string;
    description: string;
    destinations: string[];
    duration: number;
    travelers: number;
    flights: UnifiedFlightOffer[];
    hotels: Hotel[];
    transfers: Transfer[];
    extras: Extra[];
    totalPrice: number;
    pricePerPerson: number;
    highlights: string[];
    matchScore: number; // 0-100
}

// ============================================================================
// Search Filters
// ============================================================================

export interface FlightFilters {
    maxPrice?: number;
    airlines?: string[];
    maxStops?: number;
    departureTimeRange?: [string, string]; // ['06:00', '12:00']
    arrivalTimeRange?: [string, string];
    cabinClass?: string[];
}

export interface HotelFilters {
    minStars?: number;
    maxStars?: number;
    minPrice?: number;
    maxPrice?: number;
    amenities?: string[];
    mealPlans?: string[];
    distanceFromCenter?: number; // km
    guestRating?: number; // 0-10
}

export interface TransferFilters {
    vehicleTypes?: string[];
    maxPrice?: number;
    amenities?: string[];
}

export interface ExtraFilters {
    categories?: string[];
    maxPrice?: number;
    duration?: string;
    availability?: string; // day of week
}

// ============================================================================
// Utility Types
// ============================================================================

export type WizardStepId = 1 | 2 | 3 | 4 | 5 | 6;

export interface WizardNavigation {
    canGoBack: boolean;
    canGoNext: boolean;
    canSave: boolean;
    canSubmit: boolean;
}

export interface ValidationError {
    field: string;
    message: string;
}

export interface StepValidation {
    isValid: boolean;
    errors: ValidationError[];
}
