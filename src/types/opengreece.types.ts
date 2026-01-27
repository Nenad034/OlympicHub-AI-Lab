// Open Greece API Types
// TypeScript interfaces for Open Greece OTA XML API

// ============================================================================
// HOTEL TYPES
// ============================================================================

export interface OpenGreeceHotel {
    hotelCode: string;
    hotelName: string;
    contractEndDate: string; // DD-MM-YYYY format
    status: 'NEW' | 'UPDATED' | 'DELETED';
}

export interface OpenGreeceHotelDetails extends OpenGreeceHotel {
    description?: string;
    address?: OpenGreeceAddress;
    contact?: OpenGreeceContact;
    amenities?: string[];
    images?: OpenGreeceImage[];
    position?: OpenGreecePosition;
}

export interface OpenGreeceAddress {
    addressLine1?: string;
    addressLine2?: string;
    cityName?: string;
    postalCode?: string;
    countryCode?: string;
}

export interface OpenGreeceContact {
    phone?: string;
    email?: string;
    website?: string;
}

export interface OpenGreeceImage {
    url: string;
    category?: string;
    description?: string;
}

export interface OpenGreecePosition {
    latitude?: number;
    longitude?: number;
}

// ============================================================================
// AVAILABILITY TYPES
// ============================================================================

export interface OpenGreeceAvailabilityRequest {
    checkIn: string; // YYYY-MM-DD
    checkOut: string; // YYYY-MM-DD
    hotelCode?: string; // Optional - if not provided, search all hotels
    adults: number;
    children?: number;
    rooms?: number;
}

export interface OpenGreeceAvailability {
    hotelCode: string;
    hotelName: string;
    available: boolean;
    rooms: OpenGreeceRoom[];
}

export interface OpenGreeceRoom {
    roomCode: string;
    roomTypeCode: string;
    roomName: string;
    description?: string;
    maxOccupancy: number;
    maxAdults?: number;
    maxChildren?: number;
    bedType?: string;
    size?: string; // e.g., "35 sqm"
    amenities?: string[];
    images?: OpenGreeceImage[];
    rates: OpenGreeceRoomRate[];
    available: boolean;
}

export interface OpenGreeceRoomRate {
    ratePlanCode: string;
    ratePlanName?: string;
    mealPlan: OpenGreeceMealPlan;
    price: OpenGreecePrice;
    cancellationPolicy?: OpenGreeceCancellationPolicy;
    promotions?: string[];
    restrictions?: OpenGreeceRateRestrictions;
}

export interface OpenGreeceMealPlan {
    code: string; // RO, BB, HB, FB, AI, UAI
    name: string;
    description?: string;
}

export const MEAL_PLAN_CODES: Record<string, string> = {
    'RO': 'Room Only',
    'BB': 'Bed & Breakfast',
    'HB': 'Half Board',
    'FB': 'Full Board',
    'AI': 'All Inclusive',
    'UAI': 'Ultra All Inclusive',
};

export interface OpenGreecePrice {
    amount: number;
    currency: string;
    perNight: boolean;
    totalNights?: number;
    totalAmount?: number;
    taxesIncluded?: boolean;
    taxes?: number;
    commission?: number;
    netPrice?: number;
}

export interface OpenGreeceCancellationPolicy {
    refundable: boolean;
    freeCancellationUntil?: string; // ISO date
    penalties: OpenGreeceCancellationPenalty[];
    description?: string;
}

export interface OpenGreeceCancellationPenalty {
    fromDate: string; // ISO date
    toDate?: string;
    penaltyType: 'PERCENTAGE' | 'NIGHTS' | 'FIXED';
    penaltyValue: number; // percentage, nights count, or fixed amount
    currency?: string;
}

export interface OpenGreeceRateRestrictions {
    minStay?: number;
    maxStay?: number;
    closedToArrival?: boolean;
    closedToDeparture?: boolean;
    lastMinuteBooking?: boolean;
    advanceBookingDays?: number;
}

// ============================================================================
// BOOKING TYPES
// ============================================================================

export interface OpenGreeceBookingRequest {
    hotelCode: string;
    hotelName?: string;
    roomTypeCode: string;
    ratePlanCode: string;
    checkIn: string; // YYYY-MM-DD
    checkOut: string; // YYYY-MM-DD
    nights: number;
    rooms: number;
    guests: OpenGreeceGuestGroup[];
    mainContact: OpenGreeceMainContact;
    specialRequests?: string;
    totalPrice: OpenGreecePrice;
}

export interface OpenGreeceGuestGroup {
    roomNumber: number;
    adults: OpenGreeceGuest[];
    children?: OpenGreeceChildGuest[];
}

export interface OpenGreeceGuest {
    title?: 'Mr' | 'Mrs' | 'Ms' | 'Dr';
    firstName: string;
    lastName: string;
    isMainGuest?: boolean;
}

export interface OpenGreeceChildGuest extends OpenGreeceGuest {
    age: number;
}

export interface OpenGreeceMainContact {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    countryCode?: string;
    address?: OpenGreeceAddress;
}

export interface OpenGreeceBooking {
    bookingId: string;
    confirmationNumber: string;
    status: 'CONFIRMED' | 'PENDING' | 'CANCELLED' | 'ON_REQUEST';
    hotelCode: string;
    hotelName: string;
    roomTypeName?: string;
    ratePlanName?: string;
    mealPlan?: string;
    checkIn: string;
    checkOut: string;
    nights: number;
    rooms: number;
    totalPrice: OpenGreecePrice;
    cancellationPolicy?: OpenGreeceCancellationPolicy;
    confirmationDate: string;
    remarks?: string;
}

export interface OpenGreeceCancellationResponse {
    success: boolean;
    bookingId: string;
    cancellationNumber?: string;
    cancellationDate: string;
    cancellationFee?: OpenGreecePrice;
    refundAmount?: OpenGreecePrice;
    status: 'CANCELLED' | 'PENDING_CANCELLATION' | 'CANCELLATION_FAILED';
}

// ============================================================================
// AVAILABILITY RESPONSE TYPES
// ============================================================================

export interface OpenGreeceHotelResult {
    hotelCode: string;
    hotelName: string;
    starRating?: number;
    address?: OpenGreeceAddress;
    position?: OpenGreecePosition;
    mainImage?: string;
    rooms: OpenGreeceRoom[];
    lowestPrice?: OpenGreecePrice;
    available: boolean;
}

export interface OpenGreeceAvailabilityResponse {
    searchId?: string;
    checkIn: string;
    checkOut: string;
    nights: number;
    hotelResults: OpenGreeceHotelResult[];
    totalHotelsFound: number;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface OpenGreeceResponse<T> {
    success: boolean;
    data?: T;
    errors?: OpenGreeceError[];
    timestamp: string;
    echoToken?: string;
}

export interface OpenGreeceError {
    type: string;
    code?: string;
    message: string;
}

// ============================================================================
// PUSH PROCESS TYPES
// ============================================================================

export interface StartPushProcessRequest {
    isFullPush: boolean;
}

export interface StartPushProcessResponse {
    success: boolean;
    hotels: OpenGreeceHotel[];
    totalCount: number;
    newCount: number;
    updatedCount: number;
    deletedCount: number;
}

// ============================================================================
// XML BUILDER TYPES
// ============================================================================

export interface OTARequestOptions {
    echoToken?: string;
    timestamp?: string;
    version?: string;
}

export interface POSAuthentication {
    username: string;
    password: string;
    requestorType?: string;
}
