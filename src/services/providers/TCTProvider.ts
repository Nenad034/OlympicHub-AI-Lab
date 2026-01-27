/**
 * TCT API Bridge (Adapter Pattern)
 * 
 * =============================================================================
 * LEGAL NOTICE: Independent Development
 * =============================================================================
 * 
 * This adapter was developed independently using standard web protocols 
 * and vendor-agnostic architectural patterns.
 * 
 * TECHNICAL NECESSITY:
 * - Method names and API structures are defined by the remote server.
 * - This isolation ensures we can remove or swap TCT without 
 *   changing any UI or Business Logic.
 * 
 * @see docs/legal/COMPLIANCE_ACTION_PLAN.md
 * =============================================================================
 */

import type { HotelProvider, HotelSearchParams, HotelSearchResult } from './HotelProviderInterface';
import { searchHotelsSync } from '../tctApi';

export class TCTProvider implements HotelProvider {
    readonly name = 'TCT';
    readonly isActive = true;

    async authenticate(): Promise<void> {
        // Implementation for auth if needed
    }

    async search(params: HotelSearchParams): Promise<HotelSearchResult[]> {
        const result = await searchHotelsSync({
            destination: params.destination,
            checkIn: params.checkIn.toISOString().split('T')[0],
            checkOut: params.checkOut.toISOString().split('T')[0],
            adults: params.adults
        });

        if (!result.success || !result.data) {
            return [];
        }

        const hotels = Array.isArray(result.data) ? result.data : (result.data.data || []);

        return hotels.map((res: any) => ({
            id: `tct-${res.id}`,
            providerName: this.name,
            hotelName: res.name,
            location: params.destination,
            price: res.price,
            currency: res.currency,
            stars: res.stars || 0,
            mealPlan: res.mealPlan || 'Unknown',
            availability: 'available',
            rooms: [],
            checkIn: params.checkIn,
            checkOut: params.checkOut,
            nights: Math.ceil((params.checkOut.getTime() - params.checkIn.getTime()) / (1000 * 60 * 60 * 24))
        }));
    }

    isConfigured(): boolean {
        return !!(import.meta.env.VITE_TCT_USERNAME && import.meta.env.VITE_TCT_PASSWORD);
    }
}
