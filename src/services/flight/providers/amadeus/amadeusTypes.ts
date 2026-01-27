/**
 * Amadeus-Specific Types
 * 
 * Type definitions for Amadeus Flight API responses and requests
 * Based on Amadeus for Developers API v2
 */

// ============================================================================
// AUTHENTICATION
// ============================================================================

export interface AmadeusAuthResponse {
    type: string;
    username: string;
    application_name: string;
    client_id: string;
    token_type: string;
    access_token: string;
    expires_in: number;
    state: string;
    scope: string;
}

// ============================================================================
// SEARCH TYPES
// ============================================================================

export interface AmadeusFlightOffersSearchRequest {
    originLocationCode: string;
    destinationLocationCode: string;
    departureDate: string; // YYYY-MM-DD
    returnDate?: string;
    adults: number;
    children?: number;
    infants?: number;
    travelClass?: 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST';
    currencyCode?: string;
    max?: number; // Max results (default 250)
    nonStop?: boolean;
}

export interface AmadeusFlightOffersSearchResponse {
    meta: {
        count: number;
        links?: {
            self: string;
        };
    };
    data: AmadeusFlightOffer[];
    dictionaries?: {
        locations?: Record<string, AmadeusLocation>;
        aircraft?: Record<string, string>;
        currencies?: Record<string, string>;
        carriers?: Record<string, string>;
    };
}

export interface AmadeusFlightOffer {
    type: string;
    id: string;
    source: string;
    instantTicketingRequired: boolean;
    nonHomogeneous: boolean;
    oneWay: boolean;
    lastTicketingDate: string;
    numberOfBookableSeats: number;
    itineraries: AmadeusItinerary[];
    price: AmadeusPrice;
    pricingOptions: {
        fareType: string[];
        includedCheckedBagsOnly: boolean;
    };
    validatingAirlineCodes: string[];
    travelerPricings: AmadeusTravelerPricing[];
}

export interface AmadeusItinerary {
    duration: string; // ISO 8601 duration (e.g., "PT2H30M")
    segments: AmadeusSegment[];
}

export interface AmadeusSegment {
    departure: AmadeusEndpoint;
    arrival: AmadeusEndpoint;
    carrierCode: string;
    number: string;
    aircraft: {
        code: string;
    };
    operating?: {
        carrierCode: string;
    };
    duration: string;
    id: string;
    numberOfStops: number;
    blacklistedInEU: boolean;
}

export interface AmadeusEndpoint {
    iataCode: string;
    terminal?: string;
    at: string; // ISO 8601 datetime
}

export interface AmadeusPrice {
    currency: string;
    total: string;
    base: string;
    fees?: AmadeusFee[];
    grandTotal: string;
    additionalServices?: AmadeusAdditionalService[];
}

export interface AmadeusFee {
    amount: string;
    type: string;
}

export interface AmadeusAdditionalService {
    amount: string;
    type: string;
}

export interface AmadeusTravelerPricing {
    travelerId: string;
    fareOption: string;
    travelerType: string;
    price: {
        currency: string;
        total: string;
        base: string;
    };
    fareDetailsBySegment: AmadeusFareDetails[];
}

export interface AmadeusFareDetails {
    segmentId: string;
    cabin: string;
    fareBasis: string;
    brandedFare?: string;
    class: string;
    includedCheckedBags: {
        quantity?: number;
        weight?: number;
        weightUnit?: string;
    };
}

export interface AmadeusLocation {
    cityCode: string;
    countryCode: string;
}

// ============================================================================
// PRICING TYPES
// ============================================================================

export interface AmadeusFlightOffersPricingRequest {
    data: {
        type: 'flight-offers-pricing';
        flightOffers: AmadeusFlightOffer[];
    };
}

export interface AmadeusFlightOffersPricingResponse {
    data: {
        type: string;
        flightOffers: AmadeusFlightOffer[];
    };
    dictionaries?: {
        locations?: Record<string, AmadeusLocation>;
    };
}

// ============================================================================
// BOOKING TYPES
// ============================================================================

export interface AmadeusFlightCreateOrderRequest {
    data: {
        type: 'flight-order';
        flightOffers: AmadeusFlightOffer[];
        travelers: AmadeusTraveler[];
        remarks?: {
            general?: Array<{
                subType: string;
                text: string;
            }>;
        };
        ticketingAgreement?: {
            option: string;
            delay?: string;
        };
        contacts?: AmadeusContact[];
    };
}

export interface AmadeusTraveler {
    id: string;
    dateOfBirth: string; // YYYY-MM-DD
    name: {
        firstName: string;
        lastName: string;
    };
    gender: 'MALE' | 'FEMALE';
    contact: {
        emailAddress?: string;
        phones?: Array<{
            deviceType: 'MOBILE' | 'LANDLINE';
            countryCallingCode: string;
            number: string;
        }>;
    };
    documents?: Array<{
        documentType: 'PASSPORT' | 'IDENTITY_CARD';
        birthPlace?: string;
        issuanceLocation?: string;
        issuanceDate?: string;
        number: string;
        expiryDate: string;
        issuanceCountry: string;
        validityCountry: string;
        nationality: string;
        holder: boolean;
    }>;
}

export interface AmadeusContact {
    addresseeName: {
        firstName: string;
        lastName: string;
    };
    companyName?: string;
    purpose: 'STANDARD' | 'INVOICE';
    phones: Array<{
        deviceType: 'MOBILE' | 'LANDLINE';
        countryCallingCode: string;
        number: string;
    }>;
    emailAddress: string;
    address: {
        lines: string[];
        postalCode: string;
        cityName: string;
        countryCode: string;
    };
}

export interface AmadeusFlightCreateOrderResponse {
    data: {
        type: string;
        id: string;
        queuingOfficeId: string;
        associatedRecords: Array<{
            reference: string;
            creationDate: string;
            originSystemCode: string;
            flightOfferId: string;
        }>;
        flightOffers: AmadeusFlightOffer[];
        travelers: AmadeusTraveler[];
        contacts?: AmadeusContact[];
    };
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export interface AmadeusError {
    errors: Array<{
        status: number;
        code: number;
        title: string;
        detail: string;
        source?: {
            parameter?: string;
            pointer?: string;
            example?: string;
        };
    }>;
}

// ============================================================================
// CONFIGURATION
// ============================================================================

export interface AmadeusConfig {
    apiKey: string;
    apiSecret: string;
    baseUrl: string;
    environment: 'test' | 'production';
}

export interface AmadeusAuthToken {
    accessToken: string;
    tokenType: string;
    expiresAt: number; // Unix timestamp
}
