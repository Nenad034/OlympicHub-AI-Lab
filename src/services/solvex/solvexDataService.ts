import { makeSoapRequest } from '../../utils/solvexSoapClient';
import { connect } from './solvexAuthService';

export interface SolvexHotel {
    id: number;
    name: string;
    cityId: number;
    cityName: string;
    starRating: number;
}

/**
 * Fetch list of hotels from Solvex API for a specific city or globally
 */
export async function getSolvexHotels(cityId?: number): Promise<SolvexHotel[]> {
    try {
        const auth = await connect();
        if (!auth.success || !auth.data) {
            console.error('[Solvex Data] Auth failed:', auth.error);
            return [];
        }

        const params: any = { guid: auth.data };
        if (cityId) {
            params.cityKey = cityId;
        }

        // Using GetHotels method from WSDL
        const result = await makeSoapRequest<any>('GetHotels', params);

        // Response structure navigation (diffgram -> DocumentElement -> Hotels)
        const hotelsData = result?.Data?.diffgram?.DocumentElement?.Hotels;
        if (!hotelsData) return [];

        const hotels = Array.isArray(hotelsData) ? hotelsData : [hotelsData];

        return hotels.map((h: any) => ({
            id: parseInt(String(h.HotelKey || '0')),
            name: String(h.HotelName || h.Name || 'Unknown Hotel'),
            cityId: parseInt(String(h.CityKey || '0')),
            cityName: String(h.CityName || ''),
            starRating: 0 // GetHotels usually doesn't return stars directly, but we can store it
        }));
    } catch (error) {
        console.error('[Solvex Data] Failed to fetch hotels:', error);
        return [];
    }
}

/**
 * Fetch list of cities from Solvex API
 */
export async function getSolvexCities(): Promise<{ id: number, name: string }[]> {
    try {
        const auth = await connect();
        if (!auth.success || !auth.data) return [];

        const result = await makeSoapRequest<any>('GetCities', {
            guid: auth.data,
            countryKey: 2 // Bulgaria is usually key 2 in Solvex
        });

        const citiesData = result?.Data?.diffgram?.DocumentElement?.Cities;
        if (!citiesData) return [];

        const cities = Array.isArray(citiesData) ? citiesData : [citiesData];

        return cities.map((c: any) => ({
            id: parseInt(String(c.CityKey || '0')),
            name: String(c.Name || '')
        }));
    } catch (error) {
        console.error('[Solvex Data] Failed to fetch cities:', error);
        return [];
    }
}
