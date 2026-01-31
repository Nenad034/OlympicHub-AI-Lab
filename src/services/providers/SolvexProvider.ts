/**
 * Solvex API Bridge (Adapter Pattern)
 * 
 * This module acts as a "Bridge" between our generic application architecture 
 * and the specific Solvex (Master-Interlook) API.
 * 
 * ARCHITECTURAL RULE:
 * 1. This is the ONLY file allowed to know about Solvex data structures.
 * 2. It translates generic requests into Solvex SOAP calls.
 * 3. It translates Solvex SOAP responses back into our generic Domain Model.
 * 4. This isolation ensures we can remove or swap Solvex without changing any UI or Business Logic.
 */

import type {
    HotelProvider,
    HotelSearchParams,
    HotelSearchResult,
    RoomOption
} from './HotelProviderInterface';

import { searchHotels } from '../solvex/solvexSearchService';
import { connect } from '../solvex/solvexAuthService';
import type { SolvexHotelSearchResult } from '../../types/solvex.types';
import { sentinelEvents } from '../../utils/sentinelEvents';

/**
 * Solvex Hotel Provider Bridge implementation
 */
export class SolvexProvider implements HotelProvider {
    readonly name: string = 'Solvex';
    readonly isActive = true;

    /**
     * Authenticate and initialize the bridge
     */
    async authenticate(): Promise<void> {
        const result = await connect();
        if (!result.success) {
            throw new Error(`Solvex Bridge: Authentication failed: ${result.error}`);
        }
    }

    /**
     * The Bridge Search Method:
     * Dispatches a search to Solvex and maps the proprietary results to our internal format.
     */
    async search(params: HotelSearchParams): Promise<HotelSearchResult[]> {
        try {
            // STEP 1: Translate Generic -> Solvex Proprietary
            const solvexParams = this.bridgeSearchParams(params);

            // STEP 2: Execute Search through the Service Layer
            const result = await searchHotels(solvexParams);

            if (!result.success || !result.data || result.data.length === 0) {
                if (result.success) {
                    sentinelEvents.emit({
                        title: 'Solvex: Nema rezultata',
                        message: `Solvex sistem trenutno nema ponuda za destinaciju "${params.destination}" u izabranom terminu.`,
                        type: 'info',
                        provider: 'Solvex'
                    });
                } else {
                    sentinelEvents.emit({
                        title: 'Solvex: Greška u pretrazi',
                        message: `Solvex API je vratio grešku: ${result.error}.`,
                        type: 'warning',
                        provider: 'Solvex'
                    });
                }
                return [];
            }

            // STEP 4: Group results by (Hotel + MealPlan) to match our Domain Model
            const groupedMap = new Map<string, HotelSearchResult>();

            result.data.forEach(item => {
                const hotelId = String(item.hotel.id);
                const pansionCode = (item.pansion?.code || 'RO').trim().toUpperCase();
                const key = `${hotelId}-${pansionCode}`;

                if (!groupedMap.has(key)) {
                    groupedMap.set(key, this.bridgeResultToDomain(item, params));
                } else {
                    const existing = groupedMap.get(key)!;
                    // Add this room to the existing grouped hotel result
                    existing.rooms.push({
                        id: `${item.room.roomType.id}-${item.room.roomCategory.id}`,
                        name: `${item.room.roomType.name} - ${item.room.roomCategory.name}`,
                        description: item.room.roomAccommodation.name,
                        price: item.totalCost,
                        availability: this.bridgeAvailability(item.quotaType),
                        capacity: item.room.roomType.places
                    });

                    // Keep the lowest price as the main price for the card
                    if (item.totalCost < existing.price) {
                        existing.price = item.totalCost;
                    }
                }
            });

            return Array.from(groupedMap.values());

        } catch (error) {
            console.error('[SolvexBridge] Search failure:', error);
            const errStr = String(error);

            // Suppress network errors from UI
            if (errStr.includes('Failed to fetch') || errStr.includes('Konekcija sa Solvex sistemom nije uspela')) {
                console.warn('[SolvexBridge] Solvex system unreachable. Ignoring.');
            } else {
                sentinelEvents.emit({
                    title: 'Solvex Bridge Kritična Greška',
                    message: `Kritičan prekid u Solvex mostu: ${error instanceof Error ? error.message : 'Nepoznata greška'}.`,
                    type: 'critical',
                    provider: 'Solvex'
                });
            }
            return [];
        }
    }

    /**
     * Check if the specific bridge configuration is available
     */
    isConfigured(): boolean {
        const login = import.meta.env.VITE_SOLVEX_LOGIN;
        const password = import.meta.env.VITE_SOLVEX_PASSWORD;
        return !!(login && password);
    }

    /**
     * Internal Param Translation (Bridge Logic)
     */
    private bridgeSearchParams(params: HotelSearchParams): any {
        let cityId = this.mapDestinationToCityId(params.destination);
        let hotelId: number | undefined = undefined;

        // Use direct provider info if it matches Solvex
        if (params.targetProvider === 'Solvex' && params.providerId) {
            if (params.providerType === 'city') {
                cityId = Number(params.providerId);
            } else if (params.providerType === 'hotel') {
                hotelId = Number(params.providerId);
            }
        }

        return {
            dateFrom: params.checkIn,
            dateTo: params.checkOut,
            adults: params.adults,
            children: params.children || 0,
            childrenAges: params.childrenAges || [],
            rooms: params.rooms || 1,
            destination: params.destination,
            cityId: cityId,
            hotelId: hotelId
        };
    }

    /**
     * Destination Mapping Dictionary
     */
    private mapDestinationToCityId(destination: string): number | undefined {
        const d = destination.toLowerCase();
        // Maps based on Solvex internal City Keys
        if (d.includes('bansko')) return 9;
        if (d.includes('borovec') || d.includes('borovets')) return 6;
        if (d.includes('pamporovo')) return 10;
        if (d.includes('sofia') || d.includes('sofija')) return 41;
        if (d.includes('varna')) return 42;
        if (d.includes('burgas')) return 43;
        if (d.includes('zlatni pjasci') || d.includes('golden sands')) return 33;
        if (d.includes('sunčev breg') || d.includes('sunny beach')) return 68;
        if (d.includes('nesebar') || d.includes('nessebar')) return 1;
        return undefined;
    }

    /**
     * Result Translation (Bridge Logic)
     */
    private bridgeResultToDomain(
        solvexResult: SolvexHotelSearchResult,
        params: HotelSearchParams
    ): HotelSearchResult {
        const checkIn = params.checkIn;
        const checkOut = params.checkOut;
        const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

        // Clean the hotel name by removing redundant location info
        // Note: SearchHotelServices already includes stars in the name (e.g. "Hotel Name 5*")
        // so we don't need to append them again
        let cleanName = solvexResult.hotel.name
            .replace(/\(Golden Sands\)/gi, '') // Remove redundant town name if it's there
            .trim();

        return {
            id: `solvex-${solvexResult.hotel.id}-${solvexResult.pansion.id}-${solvexResult.room.roomType.id}`,
            providerName: 'Solvex',
            hotelName: cleanName,
            location: `${solvexResult.hotel.city.name}, ${solvexResult.hotel.country.name}`,
            stars: solvexResult.hotel.starRating,
            price: solvexResult.totalCost,
            currency: 'EUR',
            mealPlan: this.bridgeMealPlan(solvexResult.pansion.name),
            image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=800",
            availability: this.bridgeAvailability(solvexResult.quotaType),
            checkIn,
            checkOut,
            nights,
            rooms: [{
                id: `${solvexResult.room.roomType.id}`,
                name: solvexResult.room.roomType.name,
                description: solvexResult.room.roomCategory.name,
                price: solvexResult.totalCost,
                availability: this.bridgeAvailability(solvexResult.quotaType),
                capacity: solvexResult.room.roomType.places
            }],
            originalData: solvexResult
        };
    }

    /**
     * Specialized internal terminology translation
     */
    private bridgeMealPlan(solvexPansion: string): string {
        const p = solvexPansion.toUpperCase();
        if (p === 'AI') return 'All Inclusive';
        if (p === 'FB') return 'Full Board';
        if (p === 'HB') return 'Half Board';
        if (p === 'BB') return 'Bed & Breakfast';
        if (p === 'RO' || p === 'OB') return 'Room Only';
        return solvexPansion;
    }

    private bridgeAvailability(quotaType: number): 'available' | 'on_request' | 'unavailable' {
        switch (quotaType) {
            case 0: return 'on_request';
            case 1: return 'available';
            case 2: return 'unavailable';
            default: return 'on_request';
        }
    }
}

export default SolvexProvider;
