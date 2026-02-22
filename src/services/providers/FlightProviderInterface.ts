/**
 * Generic Flight Provider Interface
 * 
 * =============================================================================
 * LEGAL NOTICE: Antigravity Security Protocol
 * =============================================================================
 */

export interface FlightSearchParams {
    origin: string;
    destination: string;
    departureDate: Date;
    returnDate?: Date;
    adults: number;
    children?: number;
    infants?: number;
    travelClass?: 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST';
}

export interface FlightOffer {
    id: string;
    providerName: string;
    airline: string;
    price: number;
    currency: string;
    itineraries: any[];
    validatingAirlineCodes: string[];
}

import type { FlightBookingRequest, FlightBookingResponse } from '../../types/flight.types';

export interface FlightProvider {
    readonly name: string;
    readonly isActive: boolean;
    authenticate(): Promise<void>;
    search(params: FlightSearchParams): Promise<FlightOffer[]>;
    book(request: FlightBookingRequest): Promise<FlightBookingResponse>;
    isConfigured(): boolean;
}
