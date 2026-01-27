// ========================================
// EXISTING TYPES (TCT/OpenGreece)
// ========================================

export interface Guest {
    title: 'Mr' | 'Mrs' | 'Ms' | 'Dr';
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    nationality: string;
    passportNumber?: string;
    isMainGuest: boolean;
}

export interface BookingSubmission {
    source: 'TCT' | 'OpenGreece';
    hotelCode: string;
    hotelName: string;
    checkIn: string;
    checkOut: string;
    rooms: BookingRoom[];
    totalPrice: {
        amount: number;
        currency: string;
    };
    contactInfo: {
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
    };
    specialRequests?: string;
    status: 'PENDING' | 'CONFIRMED' | 'FAILED';
}

export interface BookingRoom {
    roomTypeCode: string;
    roomName: string;
    guests: Guest[];
    price: number;
}

// ========================================
// NEW TYPES (Generic Booking System for Solvex/TCT/OpenGreece)
// ========================================

/**
 * Generic guest information
 * Used for all travelers in a booking
 */
export interface GenericGuest {
    firstName: string;
    lastName: string;
    dateOfBirth: string; // YYYY-MM-DD format
    passportNumber: string;
    nationality: string; // ISO country code (e.g., "RS", "HR")
    email?: string; // Only for main guest
    phone?: string; // Only for main guest
    address?: string; // Address of the guest
    city?: string; // City of the guest
    country?: string; // Country of the guest
    isLeadPassenger?: boolean; // Flag to define travel organizer
}

/**
 * Booking data passed to BookingModal
 */
export interface BookingData {
    hotelName: string;
    location: string;
    checkIn: string; // YYYY-MM-DD
    checkOut: string; // YYYY-MM-DD
    nights: number;
    roomType: string;
    mealPlan?: string;
    adults: number;
    children: number;
    totalPrice: number;
    currency: string;
    stars?: number;
    // Provider-specific data (e.g., Solvex guid, hotel keys)
    providerData: any;
}

/**
 * Generic booking request
 * Adapters transform this to provider-specific format
 */
export interface BookingRequest {
    provider: 'solvex' | 'tct' | 'opengreece';
    hotelId: string;
    roomTypeId: string;
    checkIn: string;
    checkOut: string;
    guests: GenericGuest[];
    specialRequests?: string;
    totalPrice: number;
    currency: string;
    providerSpecificData?: any;
}

/**
 * Generic booking response
 * Adapters transform provider-specific response to this format
 */
export interface BookingResponse {
    success: boolean;
    bookingId?: string;
    status?: 'confirmed' | 'pending' | 'on-request';
    error?: string;
    providerResponse?: any;
}

/**
 * Validation result for a single guest
 */
export interface GuestValidationErrors {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    dateOfBirth?: string;
    passportNumber?: string;
    nationality?: string;
}

/**
 * Booking state
 */
export interface BookingState {
    mainGuest: GenericGuest;
    additionalGuests: GenericGuest[];
    specialRequests: string;
    termsAccepted: boolean;
    isSubmitting: boolean;
    validationErrors: Record<number, GuestValidationErrors>; // Index by guest number
}

/**
 * Booking adapter interface
 * All provider adapters must implement this
 */
export interface BookingAdapter {
    createBooking(data: BookingRequest): Promise<BookingResponse>;
    validateBooking(data: BookingRequest): Promise<{ isValid: boolean; errors?: string[] }>;
    getBookingStatus?(bookingId: string): Promise<{ status: string; details?: any }>;
}

