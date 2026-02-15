/**
 * Filos (One Tourismo) API Bridge (Adapter Pattern)
 * 
 * Maps Filos JSON API v2 to our generic HotelProvider interface.
 */

import type {
    HotelProvider,
    HotelSearchParams,
    HotelSearchResult
} from './HotelProviderInterface';

import { filosApiService } from '../filos/api/filosApiService';
import { sentinelEvents } from '../../utils/sentinelEvents';

export class FilosProvider implements HotelProvider {
    readonly name: string = 'Filos';
    readonly isActive = true;

    /**
     * Authenticate (Filos uses credentials in every request, so no dedicated auth step needed)
     */
    async authenticate(): Promise<void> {
        // Ping or simple check can be added if needed
        return Promise.resolve();
    }

    /**
     * Search implementation
     */
    async search(params: HotelSearchParams): Promise<HotelSearchResult[]> {
        try {
            const mappedInfo = this.mapDestinationToHotelCodes(params.destination);

            // Safer date formatting (local instead of UTC to avoid off-by-one errors)
            const formatDate = (d: Date) => {
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            };

            // Distinguish between searching a specific hotel and a destination/region
            const isSpecificHotel = params.providerId && !isNaN(Number(params.providerId));

            // If searching by destination, we need to get hotel list first
            // because destination codes cause "No access (OT43)" errors
            let hotelCodesToSearch: string[] | undefined;

            if (!isSpecificHotel && params.destination) {
                try {
                    // Get all hotels from the account
                    const hotelsResult = await filosApiService.getHotels();
                    if (hotelsResult.success && hotelsResult.data) {
                        const allHotels = Array.isArray(hotelsResult.data) ? hotelsResult.data : (hotelsResult.data.hotels || hotelsResult.data.results || []);

                        // Filter by location if we can
                        const destLower = params.destination.toLowerCase();
                        const matchingHotels = allHotels.filter((h: any) => {
                            const hotelName = (h.name || h.hotel_name || '').toLowerCase();
                            let hotelLocation = '';
                            if (h.location) {
                                if (typeof h.location === 'string') {
                                    hotelLocation = h.location.toLowerCase();
                                } else if (h.location.city) {
                                    hotelLocation = h.location.city.toLowerCase();
                                } else if (h.location.address) {
                                    hotelLocation = h.location.address.toLowerCase();
                                }
                            }

                            // Match by location or hotel name
                            const isMatch = hotelLocation.includes(destLower) ||
                                (hotelLocation.includes('corfu') && destLower.includes('krf')) ||
                                (hotelLocation.includes('athens') && destLower.includes('atina')) ||
                                (hotelLocation.includes('golden sands') && (destLower.includes('zlatni pjasci') || destLower.includes('zlatni pjasici'))) ||
                                (hotelLocation.includes('sunny beach') && (destLower.includes('suncev breg') || destLower.includes('sunčev breg'))) ||
                                (hotelLocation.includes('nessebar') && (destLower.includes('nesebar') || destLower.includes('nesebat')));

                            return isMatch;
                        });

                        if (matchingHotels.length > 0) {
                            hotelCodesToSearch = matchingHotels.map((h: any) => h.id || h.hotel_id).filter(Boolean).slice(0, 50);
                            console.log('[FilosProvider] Found', hotelCodesToSearch.length, 'hotels matching destination');
                        } else {
                            console.log('[FilosProvider] No hotels found for destination:', params.destination);
                            return [];
                        }
                    }
                } catch (e) {
                    console.warn('[FilosProvider] Failed to get hotel list:', e);
                    // Fall back to destination code if hotel list fails
                }
            }

            // Filos API requires check-in to be in the future
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            tomorrow.setHours(0, 0, 0, 0);

            const effectiveCheckIn = params.checkIn < tomorrow ? tomorrow : params.checkIn;
            const effectiveCheckOut = params.checkOut <= effectiveCheckIn ? new Date(effectiveCheckIn.getTime() + (params.checkOut.getTime() - params.checkIn.getTime())) : params.checkOut;

            if (params.checkOut <= effectiveCheckIn) {
                // If original stay was X nights, preserve it
                const nights = Math.max(1, Math.ceil((params.checkOut.getTime() - params.checkIn.getTime()) / (1000 * 60 * 60 * 24)));
                effectiveCheckOut.setDate(effectiveCheckIn.getDate() + nights);
            }

            const filosParams = {
                start_date: formatDate(effectiveCheckIn),
                end_date: formatDate(effectiveCheckOut),
                nationality: 'RS',
                rooms: [{
                    adults: params.adults,
                    children: params.children || 0,
                    childrenAges: params.childrenAges || []
                }],
                // Only use destination code if we don't have specific hotels
                destination: (!hotelCodesToSearch && mappedInfo?.destinationCode) ? mappedInfo.destinationCode : undefined,
                hotelCodes: hotelCodesToSearch || (isSpecificHotel ? [String(params.providerId)] : undefined)
            };

            console.log('[FilosProvider] Calling Filos API with params:', filosParams);

            const result = await filosApiService.getAvailability(filosParams);

            console.log('[FilosProvider] Filos API response:', { success: result.success, error: result.error, dataType: typeof result.data });

            if (!result.success || !result.data) {
                if (!result.success) {
                    console.warn('[FilosProvider] Filos API error:', result.error);
                    sentinelEvents.emit({
                        title: 'Filos: Greška pri pretrazi',
                        message: `Filos API je vratio grešku: ${result.error || 'Nepoznata greška'}.`,
                        type: 'warning',
                        provider: 'Filos'
                    });
                }
                return [];
            }

            // Filos API v2 can return results as a direct array OR an object with a 'hotels' property
            const hotelsArray = Array.isArray(result.data)
                ? result.data
                : (result.data.hotels || result.data.results || []);

            console.log('[FilosProvider] Hotels array:', { isArray: Array.isArray(hotelsArray), length: hotelsArray.length });

            if (!Array.isArray(hotelsArray) || hotelsArray.length === 0) {
                console.log('[FilosProvider] No hotels found in response');
                return [];
            }

            // Map Filos results to our Domain Model
            const mapped = hotelsArray.map((h: any) => this.mapToDomain(h, params));
            console.log('[FilosProvider] Mapped results:', mapped.length);
            return mapped;

        } catch (error) {
            console.error('[FilosProvider] Search failure:', error);
            throw error;
        }
    }

    isConfigured(): boolean {
        // We have demo credentials hardcoded for now in filosApiService
        return true;
    }

    private mapToDomain(filosHotel: any, params: HotelSearchParams): HotelSearchResult {
        const checkIn = params.checkIn;
        const checkOut = params.checkOut;
        const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

        // Extract hotel basic info
        const hotelId = filosHotel.id || filosHotel.hotel_id || 'unknown';
        const hotelName = filosHotel.name || filosHotel.hotel_name || 'Hotel';

        // Extract location from nested structure
        let location = 'Greece';
        if (filosHotel.location) {
            if (typeof filosHotel.location === 'string') {
                location = filosHotel.location;
            } else if (filosHotel.location.city) {
                location = filosHotel.location.city;
            } else if (filosHotel.location.address) {
                location = filosHotel.location.address;
            }
        }

        // Extract stars from rating object
        const stars = filosHotel.rating?.value || filosHotel.stars || 3;

        // Extract first photo
        const photos = filosHotel.photos || [];
        const image = photos.length > 0 ? photos[0] : "https://images.unsplash.com/photo-1544161442-e3db36c4f67c?auto=format&fit=crop&q=80&w=800";

        // Process rooms array
        const rooms = (filosHotel.rooms || []).map((r: any) => {
            // Extract meal plan from nested structure
            let mealPlan = 'RO';
            if (r.mealPlan) {
                mealPlan = typeof r.mealPlan === 'string' ? r.mealPlan : (r.mealPlan.name || r.mealPlan.code || 'RO');
            }

            // Extract price from nested structure
            let roomPrice = 0;
            if (r.price) {
                roomPrice = typeof r.price === 'number' ? r.price : (r.price.total || r.price.amount || 0);
            }

            return {
                id: r.id || r.room_id || `room-${Math.random()}`,
                name: r.name || r.room_name || 'Standard Room',
                description: r.description || '',
                price: roomPrice,
                availability: 'available',
                capacity: r.pax || r.capacity || 2,
                mealPlan: mealPlan
            };
        });

        // Calculate minimum price from rooms
        const minPrice = rooms.length > 0 ? Math.min(...rooms.map((r: { price: number }) => r.price)) : 0;

        return {
            id: `filos-${hotelId}`,
            providerName: 'Filos',
            hotelName: hotelName,
            location: location,
            stars: stars,
            price: minPrice,
            currency: 'EUR',
            mealPlan: rooms.length > 0 ? rooms[0].mealPlan : 'RO',
            image: image,
            availability: 'available',
            checkIn,
            checkOut,
            nights,
            rooms: rooms,
            originalData: filosHotel
        };
    }

    /**
     * Helper to map our common destination names to Filos internal codes
     * Using OT-LOC-GEO IDs from Filos static/destinations endpoint
     */
    private mapDestinationToHotelCodes(destination: string): { destinationCode?: string } | undefined {
        const d = destination.toLowerCase();

        // Greece Mappings (using actual Filos GEO IDs)
        if (d.includes('corfu') || d.includes('krf')) return { destinationCode: 'OT-LOC-GEO-2463678' }; // Corfu Island
        if (d.includes('athens') || d.includes('atina')) return { destinationCode: 'OT-LOC-GEO-9186' }; // Athens Center
        if (d.includes('rhodes') || d.includes('rodos') || d.includes('rhodos') || d.includes('faliraki') || d.includes('lindos')) {
            // Rhodes not available in demo account, but keeping mapping for when real credentials are used
            return { destinationCode: 'OT-LOC-GEO-RHODES' }; // Placeholder - needs real GEO ID
        }

        // Note: Other destinations need to be mapped when we get their GEO IDs from the API
        // For now, we'll try to search by hotel name if no destination code matches

        return undefined;
    }
}

export default FilosProvider;
