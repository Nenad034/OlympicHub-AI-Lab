/**
 * Travelport+ (Galileo) API Types
 * Based on JSON Air APIs v11
 */

export interface TravelportCredentials {
    clientId: string;
    clientSecret: string;
    environment: 'test' | 'production';
}

export interface TravelportTokenResponse {
    access_token: string;
    token_type: string;
    expires_in: number;
    scope: string;
}

// --- Air Search Types ---

export interface AirSearchRequest {
    origin: string;
    destination: string;
    departureDate: string;
    returnDate?: string;
    passengers: {
        adults: number;
        children?: number;
        infants?: number;
    };
    cabinClass?: 'Economy' | 'Business' | 'First' | 'PremiumEconomy';
}

export interface AirOffer {
    id: string;
    totalPrice: number;
    basePrice: number;
    taxes: number;
    currency: string;
    segments: FlightSegment[];
    platingCarrier: string;
    lastTicketingDate?: string;
}

export interface FlightSegment {
    id: string;
    origin: string;
    destination: string;
    departureTime: string;
    arrivalTime: string;
    carrier: string;
    flightNumber: string;
    aircraft: string;
    duration: string;
    bookingCode: string;
    cabin: string;
}

export interface AirSearchResponse {
    offers: AirOffer[];
    traceId: string;
}

// --- Booking / Order Types ---

export interface CreateOrderRequest {
    offerId: string;
    passengers: PassengerDetails[];
}

export interface PassengerDetails {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: 'M' | 'F';
    email: string;
    phone: string;
}

export interface OrderResponse {
    orderId: string;
    pnr: string;
    status: 'Confirmed' | 'Pending' | 'Cancelled';
    offers: AirOffer[];
}
