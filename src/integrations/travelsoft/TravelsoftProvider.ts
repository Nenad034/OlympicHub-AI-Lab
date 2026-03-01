/**
 * Travelsoft NDC - Provider Adapter
 * 
 * Implementira FlightProvider interfejs koji koristi FlightProviderManager.
 * Ovo je adapter koji "upaja" Travelsoft NDC API u postojeći sistem.
 */

import type { FlightProvider, FlightSearchParams, FlightOffer } from '../../services/providers/FlightProviderInterface';
import type { FlightBookingRequest, FlightBookingResponse } from '../../types/flight.types';
import { initTravelsoftFromEnv, getTravelsoftApi } from './api/travelsoftApiService';

export class TravelsoftProvider implements FlightProvider {
    readonly name = 'Travelsoft';
    readonly isActive = true;

    private initialized = false;

    async authenticate(): Promise<void> {
        // Autentikacija se vrši lazy u auth servisu
        // ovde samo osiguravamo da je API inicijalizovan
        if (!this.initialized) {
            const api = initTravelsoftFromEnv();
            this.initialized = api !== null;
        }
    }

    async search(params: FlightSearchParams): Promise<FlightOffer[]> {
        const api = getTravelsoftApi();

        // Mapiramo pasažire u NDC format
        const passengers: Array<{ Code: 'ADT' | 'CHD' | 'INF'; Quantity: number }> = [
            { Code: 'ADT', Quantity: params.adults || 1 }
        ];
        if ((params.children || 0) > 0) {
            passengers.push({ Code: 'CHD', Quantity: params.children! });
        }
        if ((params.infants || 0) > 0) {
            passengers.push({ Code: 'INF', Quantity: params.infants! });
        }

        const cabinMap: Record<string, 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST'> = {
            'ECONOMY': 'ECONOMY',
            'PREMIUM_ECONOMY': 'PREMIUM_ECONOMY',
            'BUSINESS': 'BUSINESS',
            'FIRST': 'FIRST'
        };

        const { offers, shoppingResponseId } = await api.searchFlights({
            origin: params.origin,
            destination: params.destination,
            departureDate: params.departureDate instanceof Date
                ? params.departureDate.toISOString().split('T')[0]
                : String(params.departureDate),
            returnDate: params.returnDate
                ? (params.returnDate instanceof Date
                    ? params.returnDate.toISOString().split('T')[0]
                    : String(params.returnDate))
                : undefined,
            passengers,
            cabinPreference: cabinMap[params.travelClass || 'ECONOMY'],
            currency: 'EUR'
        });

        // Konvertujemo UnifiedFlightOffer -> FlightOffer (interface za provider manager)
        return offers.map(o => ({
            id: o.id,
            providerName: 'Travelsoft',
            airline: o.validatingAirlineCodes?.[0] || o.slices[0]?.segments[0]?.carrierCode || 'XX',
            price: o.price.total,
            currency: o.price.currency,
            itineraries: o.slices.map(slice => ({
                duration: slice.duration,
                segments: slice.segments.map(seg => ({
                    id: seg.flightNumber,
                    carrierCode: seg.carrierCode,
                    number: seg.flightNumber.replace(seg.carrierCode, ''),
                    aircraft: { code: seg.aircraft || 'N/A' },
                    departure: {
                        iataCode: seg.origin.iataCode,
                        terminal: seg.origin.terminal,
                        at: seg.departure
                    },
                    arrival: {
                        iataCode: seg.destination.iataCode,
                        terminal: seg.destination.terminal,
                        at: seg.arrival
                    }
                }))
            })),
            validatingAirlineCodes: o.validatingAirlineCodes || [],
            // Čuvamo shoppingResponseId u originalData za nastavak sesije
            _shoppingResponseId: shoppingResponseId
        } as any));
    }

    async book(request: FlightBookingRequest): Promise<FlightBookingResponse> {
        const api = getTravelsoftApi();

        // Dekodiramo bookingToken koji je sačuvao offerId i shoppingResponseId
        let offerId = request.offerId;
        let shoppingResponseId = '';

        try {
            const decoded = JSON.parse(atob(request.bookingToken));
            offerId = decoded.offerId || offerId;
            shoppingResponseId = decoded.shoppingResponseId || '';
        } catch {
            console.warn('[Travelsoft] Could not decode bookingToken, using offerId directly');
        }

        // Mapiramo pasažire u NDC format
        const ndcPassengers = request.passengers.map((p, i) => ({
            PassengerID: `PAX${i + 1}`,
            Type: p.type === 'adult' ? 'ADT' as const :
                p.type === 'child' ? 'CHD' as const : 'INF' as const,
            Title: p.title?.toUpperCase(),
            FirstName: p.firstName,
            LastName: p.lastName,
            DateOfBirth: p.dateOfBirth,
            Gender: p.gender === 'M' ? 'Male' as const : 'Female' as const,
            Nationality: p.passport?.nationality,
            ContactEmail: p.email,
            ContactPhone: p.phone,
            Document: p.passport ? {
                Type: 'PASSPORT' as const,
                Number: p.passport.number,
                ExpiryDate: p.passport.expiryDate,
                IssuingCountry: p.passport.issuingCountry,
                Nationality: p.passport.nationality || p.passport.issuingCountry
            } : undefined
        }));

        return api.createOrder({
            shoppingResponseId,
            offerId,
            passengers: ndcPassengers,
            contactEmail: request.passengers[0]?.email || '',
            contactPhone: request.passengers[0]?.phone || '',
            agentReference: request.agencyReference
        });
    }

    isConfigured(): boolean {
        const baseUrl = import.meta.env.VITE_TRAVELSOFT_BASE_URL;
        const username = import.meta.env.VITE_TRAVELSOFT_USERNAME;
        const password = import.meta.env.VITE_TRAVELSOFT_PASSWORD;
        return !!(baseUrl && username && password);
    }
}
