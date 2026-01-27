/**
 * OpenGreece API Bridge (Adapter Pattern)
 * 
 * =============================================================================
 * LEGAL NOTICE: Independent Development
 * =============================================================================
 * 
 * This adapter was developed independently using standard web protocols 
 * and vendor-agnostic architectural patterns.
 * 
 * TECHNICAL NECESSITY:
 * - Method parameters and API structures are defined by the remote server.
 * - This isolation ensures we can remove or swap OpenGreece without 
 *   changing any UI or Business Logic.
 * 
 * @see docs/legal/COMPLIANCE_ACTION_PLAN.md
 * =============================================================================
 */

import type { HotelProvider, HotelSearchParams, HotelSearchResult } from './HotelProviderInterface';
import { OPENGREECE_MOCK_HOTELS } from '../opengreece/opengreeceMockData';

export class OpenGreeceProvider implements HotelProvider {
    readonly name = 'OpenGreece';
    readonly isActive = true;

    async authenticate(): Promise<void> {
        // OpenGreece uses Basic Auth, no separate auth step needed
    }

    async search(params: HotelSearchParams): Promise<HotelSearchResult[]> {
        console.log('[OpenGreece Provider] Searching with params:', params);

        // Use cached hotel list from Push API
        // Filter by destination if specified
        const destination = params.destination.toLowerCase();

        // Map destination to Greek locations
        const locationMap: Record<string, string[]> = {
            'crete': ['heraklion', 'crete', 'kreta'],
            'heraklion': ['heraklion', 'crete'],
            'mykonos': ['mykonos'],
            'santorini': ['santorini', 'oia'],
            'rhodes': ['rhodes', 'rodos'],
            'corfu': ['corfu', 'krf'],
            'athens': ['athens', 'atina'],
            'greece': ['greece', 'grčka', 'greek'],
        };

        // Find matching location keywords
        let matchingHotels = OPENGREECE_MOCK_HOTELS;

        for (const [key, keywords] of Object.entries(locationMap)) {
            if (keywords.some(kw => destination.includes(kw))) {
                // For now, return all hotels since we don't have location data in mock
                // In production, this would filter by actual hotel location
                console.log(`[OpenGreece Provider] Matched location: ${key}`);
                break;
            }
        }

        // Transform to generic format
        const results: HotelSearchResult[] = matchingHotels.map((hotel) => ({
            id: `opengreece-${hotel.hotelCode}`,
            providerName: this.name,
            hotelName: hotel.hotelName,
            location: 'Greece', // TODO: Add actual location from hotel details
            price: 450 + Math.random() * 500, // Mock price for now
            currency: 'EUR',
            stars: 4, // Default, TODO: get from hotel details
            mealPlan: 'BB', // Default breakfast
            availability: hotel.status === 'NEW' || hotel.status === 'UPDATED' ? 'available' : 'on_request',
            rooms: [
                {
                    id: `${hotel.hotelCode}-standard`,
                    name: 'Standard Room',
                    description: 'Comfortable room with modern amenities',
                    price: 450 + Math.random() * 500,
                    availability: 'available',
                    capacity: `${params.adults}+${params.children || 0}`
                }
            ],
            checkIn: params.checkIn,
            checkOut: params.checkOut,
            nights: Math.ceil((params.checkOut.getTime() - params.checkIn.getTime()) / (1000 * 60 * 60 * 24)),
            image: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&q=80&w=800',
            originalData: hotel
        }));

        console.log(`[OpenGreece Provider] Returning ${results.length} hotels`);
        return results;
    }

    isConfigured(): boolean {
        return !!(import.meta.env.VITE_OPENGREECE_USERNAME && import.meta.env.VITE_OPENGREECE_PASSWORD);
    }
}
