/**
 * Kyte API Type Definitions
 */

export interface KyteConfig {
    baseUrl: string;
    apiKey: string;
}

export interface KyteSearchRequest {
    journeys: {
        id?: string;
        departureAirport: string;
        arrivalAirport: string;
        date: {
            main: string; // YYYY-MM-DD
            time?: string; // HH:mm
            type: 'departure' | 'arrival';
            flexibilityRange?: number;
        };
        aircraftPreference?: {
            code: string;
            name: string;
        };
        action?: 'add' | 'remove' | 'replace';
    }[];
    exactMatch?: boolean;
    nonStopFlight?: boolean;
    cabinType: 'economy' | 'premium_economy' | 'business' | 'first';
    flexibility?: 'lowest' | 'flexible' | 'fully_flexible';
    fareType?: 'public' | 'private' | 'net';
    passengers: {
        age: number;
        seatRequested?: boolean;
        frequentFlyer?: {
            airlineCode: string;
            number: string;
        }[];
    }[];
    miniFareRule?: boolean;
    splitOffer?: boolean;
    originCurrency?: boolean;
    corporateAccount?: {
        airlineCode: string;
        number: string;
    }[];
}

export interface KyteSearchResponse {
    offers: Record<string, KyteOffer>;
    flightSolutions: Record<string, KyteFlightSolution>;
    legs: Record<string, KyteLeg>;
    errors?: KyteError[];
}

export interface KyteOffer {
    id: string;
    flightSolutions: string[];
    totalPrice: number;
    currency: {
        code: string;
        decimals: number;
    };
    owner: string;
    expiration: string;
}

export interface KyteFlightSolution {
    id: string;
    segments: KyteSegment[];
    totalDuration: number;
}

export interface KyteSegment {
    id: string;
    marketingCarrier: {
        code: string;
        name: string;
    };
    flightNumber: string;
    departure: KyteTimeAndPlace;
    arrival: KyteTimeAndPlace;
    duration: number;
}

export interface KyteTimeAndPlace {
    airport: {
        code: string;
        name: string;
    };
    date: string;
    time: string;
}

export interface KyteLeg {
    id: string;
    departureAirport: string;
    arrivalAirport: string;
}

export interface KyteError {
    code: string;
    message: string;
}

// ORDER / BOOKING TYPES

export interface KyteOrderRequest {
    offerId: string;
    passengers: KytePassenger[];
    contactPoint: KyteContactPoint;
}

export interface KytePassenger {
    id: string;
    type: 'adult' | 'child' | 'infant';
    name: {
        firstName: string;
        lastName: string;
        title?: string;
    };
    gender: 'male' | 'female';
    dateOfBirth: string; // YYYY-MM-DD
}

export interface KyteContactPoint {
    email: string;
    phone: {
        number: string;
        countryCode: string;
    };
}

export interface KyteOrderResponse {
    id: string;
    status: 'confirmed' | 'held' | 'cancelled';
    pnr: string;
    totalPrice: number;
    currency: string;
    errors?: KyteError[];
}
