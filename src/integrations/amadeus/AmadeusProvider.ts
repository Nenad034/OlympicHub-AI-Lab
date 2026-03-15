/**
 * Amadeus Flight Provider Adapter
 * 
 * =============================================================================
 * LEGAL NOTICE: Antigravity Security Protocol
 * =============================================================================
 */

import type { FlightProvider, FlightSearchParams, FlightOffer } from '../../services/providers/FlightProviderInterface' ;
import { getAmadeusApi } from './api/amadeusApiService';

export class AmadeusProvider implements FlightProvider {
    readonly name = 'Amadeus';
    readonly isActive = true;

    async authenticate(): Promise<void> {
        // Amadeus service handles auth internally via its singleton
    }

    async search(params: FlightSearchParams): Promise<FlightOffer[]> {
        const api = getAmadeusApi();

        // Map to the types expected by the newer AmadeusApiService (flight.types.ts)
        const mappedParams: import('../../types/flight.types').FlightSearchParams = {
            origin: params.origin,
            destination: params.destination,
            departureDate: params.departureDate.toISOString().split('T')[0],
            returnDate: params.returnDate ? params.returnDate.toISOString().split('T')[0] : undefined,
            adults: params.adults,
            children: params.children || 0,
            childrenAges: [], // Required by the new interface
            infants: params.infants || 0,
            cabinClass: params.travelClass?.toLowerCase() as any
        };

        const results = await api.searchFlights(mappedParams);

        // Map back from UnifiedFlightOffer to the expected FlightOffer interface
        return results.map(res => ({
            id: res.id,
            providerName: res.provider,
            airline: res.validatingAirlineCodes?.[0] || 'Unknown',
            price: res.price.total,
            currency: res.price.currency,
            itineraries: res.slices, // Assuming slices is the equivalent of itineraries
            validatingAirlineCodes: res.validatingAirlineCodes || []
        }));
    }

    async book(request: any): Promise<any> {
        throw new Error('Amadeus booking not implemented yet');
    }

    isConfigured(): boolean {
        const apiKey = import.meta.env.VITE_AMADEUS_API_KEY;
        const apiSecret = import.meta.env.VITE_AMADEUS_API_SECRET;
        return !!(apiKey && apiSecret && apiKey !== 'proxy_auth');
    }
}
