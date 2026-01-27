/**
 * Mars API V1 - TypeScript Type Definitions
 * 
 * Source: https://marsapi.stoplight.io/docs/mars-api-v1/
 * Provider: Neolab (https://www.neolab.hr)
 */

// ============================================================================
// API Response Wrappers
// ============================================================================

export interface MarsApiResponse<T> {
    status: boolean;
    messages: MarsApiMessage[];
    data: T[];
}

export interface MarsApiMessage {
    type?: 'error' | 'warning' | 'info';
    message?: string;
}

// ============================================================================
// Index Service
// ============================================================================

export interface MarsAccommodationIndex {
    object: {
        id: number;
        last_modified: string; // "2020-06-19 10:43:05"
    };
}

export type MarsIndexResponse = MarsApiResponse<MarsAccommodationIndex>;

// ============================================================================
// Details Service
// ============================================================================

export interface MarsAccommodation {
    name: string;
    id: number;
    location: MarsLocation;
    images: MarsImage[];
    amenities: MarsAmenity[];
    units: MarsUnit[];
    commonItems: MarsCommonItems;
}

export type MarsDetailsResponse = MarsApiResponse<MarsAccommodation>;

// ============================================================================
// Location
// ============================================================================

export interface MarsLocation {
    address: string;
    lat: number;
    lng: number;
    place: string; // City name
}

// ============================================================================
// Images
// ============================================================================

export interface MarsImage {
    big: string; // Full HD image URL
}

// ============================================================================
// Amenities
// ============================================================================

export interface MarsAmenity {
    name: string;
    values: boolean | number | string;
}

export interface MarsUnitAmenityGroup {
    name: string; // "GENERAL", "Room_1", "Room_2", etc.
    amenities: MarsAmenity[];
}

// Amenity value enums
export type MarsAirportPickup = 'no' | 'yesPaid' | 'yesFree';
export type MarsInternet = 'yesFree' | 'no' | 'yes' | 'yesPaid';
export type MarsParking = 'no' | 'yes';
export type MarsPetAllowed = 'yes' | 'yesPaid' | 'yesFree' | 'yesRequest' | 'no';
export type MarsPool = 'no' | 'yes' | 'yesPaid' | 'yesFree';

// ============================================================================
// Units (Rooms/Apartments)
// ============================================================================

export interface MarsUnit {
    id: number;
    name: string;
    type: string; // "room", "apartment", etc.
    baseService: MarsBaseService | null;
    basicBeds: number;
    extraBeds: number;
    minOccupancy: number;
    images: MarsImage[];
    amenities: MarsUnitAmenityGroup[];
    availabilities: MarsAvailability[];
    pricelist: MarsPricelist;
}

export type MarsBaseService =
    | 'classic'
    | 'junior'
    | 'superior'
    | 'executive'
    | 'business'
    | 'standard'
    | 'comfort'
    | 'deluxe'
    | 'presidentialSuite'
    | 'premium'
    | 'duplex'
    | 'mezzanin'
    | 'family';

// ============================================================================
// Availability
// ============================================================================

export interface MarsAvailability {
    dateFrom: string; // "2022-01-01"
    dateTo: string; // "2024-01-01"
    type: string; // "Instant booking", etc.
    validUntil: string | null;
    quantity: number;
}

// ============================================================================
// Pricelist
// ============================================================================

export interface MarsPricelist {
    baseRate: MarsPricelistItem[];
    supplement: MarsPricelistItem[];
    discount: MarsPricelistItem[];
    touristTax: MarsPricelistItem[];
}

export interface MarsPricelistItem {
    dateFrom: string; // "2022-07-11"
    dateTo: string; // "2022-07-22"
    price?: number | null;
    currency?: string; // "EUR", "USD", etc.
    percent?: number | null;
    arrivalDays?: string | null; // "1,2,3,4,5" (Mon-Fri)
    departureDays?: string | null; // "6,7" (Sat-Sun)
    ageFrom?: number | null;
    ageTo?: number | null;
    minAdult?: number | null;
    maxAdult?: number | null;
    minChild?: number | null;
    validFrom?: string | null;
    validUntil?: string | null;
    minStay?: number;
    maxStay?: number | null;
    release?: number | null; // Minimum days before arrival
    onSpot?: boolean | null; // Pay on arrival
    subtractDays?: number | null; // For special offers (e.g., pay 7 stay 10)
    numberOfPersons?: number | null;
    paymentType?: MarsPaymentType;
    definitionId?: number;
    type?: string;
    title?: string;
}

export type MarsPaymentType =
    | 'perPersonPerDay'
    | 'perPerson'
    | 'Once'
    | 'perUnitPerWeek'
    | 'perHour'
    | 'perDay';

// ============================================================================
// Common Items
// ============================================================================

export interface MarsCommonItems {
    supplement: MarsPricelistItem[];
    discount: MarsPricelistItem[];
    touristTax: MarsPricelistItem[];
}

// ============================================================================
// Request Parameters
// ============================================================================

export interface MarsIndexRequest {
    responseType?: 'json' | 'xml';
}

export interface MarsDetailsRequest {
    id: number;
    responseType?: 'json' | 'xml';
}

// ============================================================================
// Price Calculation Helpers
// ============================================================================

export interface MarsPriceCalculationParams {
    unitId: number;
    checkIn: string; // "2026-07-01"
    checkOut: string; // "2026-07-08"
    adults: number;
    children?: number;
    childrenAges?: number[];
}

export interface MarsPriceCalculationResult {
    basePrice: number;
    supplements: MarsPriceBreakdown[];
    discounts: MarsPriceBreakdown[];
    touristTax: number;
    totalPrice: number;
    currency: string;
    breakdown: string[];
}

export interface MarsPriceBreakdown {
    title: string;
    amount: number;
    type: string;
}

// ============================================================================
// Error Types
// ============================================================================

export interface MarsApiError {
    status: false;
    messages: MarsApiMessage[];
    error?: string;
}
