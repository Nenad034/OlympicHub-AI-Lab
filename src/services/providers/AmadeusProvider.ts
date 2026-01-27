/**
 * Amadeus Flight Provider Adapter
 * 
 * =============================================================================
 * LEGAL NOTICE: Antigravity Security Protocol
 * =============================================================================
 */

import type { FlightProvider, FlightSearchParams, FlightOffer } from './FlightProviderInterface';
import { getAmadeusApi } from '../flight/providers/amadeus/amadeusApiService';

export class AmadeusProvider implements FlightProvider {
    readonly name = 'Amadeus';
    readonly isActive = true;

    async authenticate(): Promise<void> {
        // Amadeus service handles auth internally via its singleton
    }

    async search(params: FlightSearchParams): Promise<FlightOffer[]> {
        const api = getAmadeusApi();
        const results = await api.searchFlights({
            originLocationCode: params.origin,
            destinationLocationCode: params.destination,
            departureDate: params.departureDate.toISOString().split('T')[0],
            returnDate: params.returnDate?.toISOString().split('T')[0],
            adults: params.adults,
            children: params.children || 0,
            infants: params.infants || 0,
            travelClass: params.travelClass || 'ECONOMY'
        });

        return results.map(res => ({
            id: `amadeus-${res.id}`,
            providerName: this.name,
            airline: res.validatingAirlineCodes[0],
            price: parseFloat(res.price.total),
            currency: res.price.currency,
            itineraries: res.itineraries,
            validatingAirlineCodes: res.validatingAirlineCodes
        }));
    }

    isConfigured(): boolean {
        return !!(import.meta.env.VITE_AMADEUS_API_KEY && import.meta.env.VITE_AMADEUS_API_SECRET);
    }
}
