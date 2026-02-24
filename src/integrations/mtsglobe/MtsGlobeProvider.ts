import type {
    HotelProvider,
    HotelSearchParams,
    HotelSearchResult,
    RoomOption
} from '../../services/providers/HotelProviderInterface';
import { searchHotels } from './api/mtsGlobeService';
import type { MtsGlobeHotelResult } from './types/mtsglobe.types';
import { decodeRoomCode } from './utils/roomDecoder';

/**
 * MTS Globe Hotel Provider Adapter
 * 
 * Maps between our unified Domain Model and MTS Globe's OTA XML structure.
 */
export class MtsGlobeProvider implements HotelProvider {
    readonly name: string = 'MtsGlobe';
    readonly isActive = true;

    async authenticate(): Promise<void> {
        // MTS Globe usually uses credentials per request in the XML header,
        // so we just check if they are available.
        if (!this.isConfigured()) {
            throw new Error('MTS Globe: Credentials not configured in .env');
        }
    }

    async search(params: HotelSearchParams): Promise<HotelSearchResult[]> {
        // If not configured, return mock data for demonstration
        if (!this.isConfigured()) {
            console.log('[MtsGlobeProvider] Provider not configured, returning mock data for demonstration.');
            return this.getMockResults(params);
        }

        try {
            // 1. Map generic params to MTS Globe params
            const mtsParams = {
                checkIn: params.checkIn.toISOString().split('T')[0],
                checkOut: params.checkOut.toISOString().split('T')[0],
                adults: params.adults,
                children: params.children,
                childrenAges: params.childrenAges,
                destinationCode: params.destination,
                currency: params.currency || 'EUR'
            };

            // 2. Call service
            const response = await searchHotels(mtsParams, params.abortSignal);

            if (!response.success || !response.data) {
                return [];
            }

            // 3. Map results back to Domain Model
            return response.data.map(hotel => this.mapToDomain(hotel, params));

        } catch (error) {
            console.error('[MtsGlobeProvider] Search error:', error);
            return [];
        }
    }

    private getMockResults(params: HotelSearchParams): HotelSearchResult[] {
        // Only return mock results if the destination matches some "demo" keywords or if manually testing
        const dest = params.destination.toLowerCase();
        if (!dest.includes('demo') && !dest.includes('test') && !dest.includes('rhodes') && !dest.includes('corfu')) {
            return [];
        }

        return [
            {
                id: 'mtsglobe-mock-1',
                providerName: 'MtsGlobe',
                hotelName: 'MTS Globe Demo Hotel Rhodes',
                location: 'Rhodes, Greece',
                stars: 4,
                price: 1250,
                currency: 'EUR',
                mealPlan: 'Half Board',
                image: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?auto=format&fit=crop&q=80&w=800',
                availability: 'available',
                checkIn: params.checkIn,
                checkOut: params.checkOut,
                nights: Math.ceil((params.checkOut.getTime() - params.checkIn.getTime()) / (86400000)),
                rooms: [
                    {
                        id: 'mock-room-1',
                        name: decodeRoomCode('2T', 'SUP', 'STD', 'DBL', 'PV'), // Double Superior Pool View
                        price: 1250,
                        availability: 'available',
                        mealPlan: 'Half Board'
                    }
                ]
            }
        ];
    }

    isConfigured(): boolean {
        // Checking for credentials in environment
        return !!(import.meta.env.VITE_MTS_GLOBE_USERNAME && import.meta.env.VITE_MTS_GLOBE_PASSWORD);
    }

    private mapToDomain(hotel: MtsGlobeHotelResult, params: HotelSearchParams): HotelSearchResult {
        const checkIn = params.checkIn;
        const checkOut = params.checkOut;
        const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

        return {
            id: `mtsglobe-${hotel.HotelCode}`,
            providerName: 'MtsGlobe',
            hotelName: hotel.HotelName,
            location: hotel.Address ? `${hotel.Address.CityName}, ${hotel.Address.CountryName}` : 'Unknown',
            stars: parseInt(hotel.HotelCategory) || 0,
            price: hotel.RoomStays[0]?.Total.Amount || 0,
            currency: hotel.RoomStays[0]?.Total.Currency || 'EUR',
            mealPlan: hotel.RoomStays[0]?.MealPlanName || 'Unknown',
            image: hotel.Images?.[0] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=800',
            images: hotel.Images || [],
            description: hotel.Descriptions?.[0]?.Text || '',
            availability: this.mapAvailability(hotel.RoomStays[0]?.Availability),
            checkIn,
            checkOut,
            nights,
            rooms: hotel.RoomStays.map(room => ({
                id: `${hotel.HotelCode}-${room.RoomTypeCode}-${room.RatePlanCode}`,
                name: room.RoomTypeName || decodeRoomCode(
                    (room as any).BaseCode,
                    (room as any).GradeCode,
                    (room as any).SubtypeCode,
                    (room as any).TypeCode,
                    (room as any).ViewCode
                ),
                price: room.Total.Amount,
                availability: this.mapAvailability(room.Availability),
                mealPlan: room.MealPlanName
            }))
        };
    }

    private mapAvailability(status?: string): 'available' | 'on_request' | 'unavailable' {
        switch (status) {
            case 'Available': return 'available';
            case 'OnRequest': return 'on_request';
            case 'SoldOut': return 'unavailable';
            default: return 'on_request';
        }
    }
}

export default MtsGlobeProvider;
