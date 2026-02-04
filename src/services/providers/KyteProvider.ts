/**
 * Kyte Flight Provider Adapter
 */

import type { FlightProvider, FlightSearchParams, FlightOffer } from './FlightProviderInterface';
import type { FlightBookingRequest, FlightBookingResponse } from '../../types/flight.types';
import { getKyteApi } from '../flight/providers/kyte/kyteApiService';

export class KyteProvider implements FlightProvider {
    readonly name = 'Kyte';
    readonly isActive = true;

    async authenticate(): Promise<void> {
        // Kyte uses API key in headers, no separate auth call needed for fetching
    }

    async search(params: FlightSearchParams): Promise<FlightOffer[]> {
        const api = getKyteApi();

        // Convert local FlightSearchParams to the detailed one if needed
        // But AmadeusProvider converts it as well.
        // Wait, searchFlights takes FlightSearchParams from types/flight.types.ts
        // While provider.search takes FlightSearchParams from FlightProviderInterface.ts

        // Let's assume they are compatible enough for a quick search or map them.

        const results = await api.searchFlights({
            origin: params.origin,
            destination: params.destination,
            departureDate: params.departureDate.toISOString().split('T')[0],
            returnDate: params.returnDate?.toISOString().split('T')[0],
            adults: params.adults,
            children: params.children || 0,
            childrenAges: [],
            infants: params.infants || 0,
            cabinClass: (params.travelClass?.toLowerCase() as any) || 'economy'
        });

        return results.map(res => {
            const firstSegment = (res.slices as any)?.[0]?.segments?.[0];
            return {
                id: res.id,
                providerName: this.name,
                airline: firstSegment?.carrierName || res.validatingAirlineCodes?.[0] || 'Unknown',
                price: res.price.total,
                currency: res.price.currency,
                itineraries: res.slices as any,
                validatingAirlineCodes: res.validatingAirlineCodes || []
            };
        });
    }

    async book(request: FlightBookingRequest): Promise<FlightBookingResponse> {
        const api = getKyteApi();
        return await api.createOrder(request);
    }

    isConfigured(): boolean {
        return !!import.meta.env.VITE_KYTE_API_KEY;
    }
}

export default KyteProvider;
