// Solvex Dictionary Service
import { makeSoapRequest } from '../../utils/solvexSoapClient';
import type {
    SolvexCountry,
    SolvexCity,
    SolvexRegion,
    SolvexApiResponse
} from '../../types/solvex.types';
import { connect } from './solvexAuthService';

/**
 * Get list of countries
 */
export async function getCountries(): Promise<SolvexApiResponse<SolvexCountry[]>> {
    try {
        const auth = await connect();
        if (!auth.success || !auth.data) {
            return { success: false, error: auth.error };
        }

        const result = await makeSoapRequest<any>('GetCountries', {
            'guid': auth.data
        });

        console.log('[Solvex Dictionaries] GetCountries Raw Result:', result);

        // Try to find the array of items more robustly
        const countriesArr = result.Country || result.Countries || Object.values(result).find(val => Array.isArray(val)) || [];
        const countries: SolvexCountry[] = Array.isArray(countriesArr) ? countriesArr : (countriesArr ? [countriesArr] : []);

        return {
            success: true,
            data: countries.map((c: any) => ({
                id: parseInt(String(c.ID || 0)),
                name: String(c.Name || ''),
                nameLat: String(c.NameLat || ''),
                code: String(c.Code || '')
            }))
        };
    } catch (error) {
        console.error('[Solvex Dictionaries] GetCountries failed:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch countries'
        };
    }
}

/**
 * Get list of cities for a country
 */
export async function getCities(countryId: number): Promise<SolvexApiResponse<SolvexCity[]>> {
    try {
        const auth = await connect();
        if (!auth.success || !auth.data) {
            return { success: false, error: auth.error };
        }

        const result = await makeSoapRequest<any>('GetCities', {
            'countryKey': countryId,
            'regionKey': -1 // -1 usually means "Any" in Master-Tour
        });

        console.log('[Solvex Dictionaries] GetCities Raw Result:', result);

        const citiesArr = result.City || result.Cities || Object.values(result).find(val => Array.isArray(val)) || [];
        const cities: SolvexCity[] = Array.isArray(citiesArr) ? citiesArr : (citiesArr ? [citiesArr] : []);

        return {
            success: true,
            data: cities.map((c: any) => ({
                id: parseInt(String(c.ID || 0)),
                name: String(c.Name || ''),
                nameLat: String(c.NameLat || ''),
                countryId: parseInt(String(c.CountryID || 0)),
                regionId: parseInt(String(c.RegionID || 0))
            }))
        };
    } catch (error) {
        console.error('[Solvex Dictionaries] GetCities failed:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch cities'
        };
    }
}

/**
 * Get list of regions for a country
 */
export async function getRegions(countryId: number): Promise<SolvexApiResponse<SolvexRegion[]>> {
    try {
        const auth = await connect();
        if (!auth.success || !auth.data) {
            return { success: false, error: auth.error };
        }

        const result = await makeSoapRequest<any>('GetRegions', {
            'countryKey': countryId
        });

        const regionsArr = result.Region || [];
        const regions: SolvexRegion[] = Array.isArray(regionsArr) ? regionsArr : [regionsArr];

        return {
            success: true,
            data: regions.map((r: any) => ({
                id: parseInt(String(r.ID || 0)),
                name: String(r.Name || ''),
                nameLat: String(r.NameLat || '')
            }))
        };
    } catch (error) {
        console.error('[Solvex Dictionaries] GetRegions failed:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch regions'
        };
    }
}

/**
 * Get list of hotels for a city
 */
export async function getHotels(cityId: number): Promise<SolvexApiResponse<any[]>> {
    try {
        const auth = await connect();
        if (!auth.success || !auth.data) {
            return { success: false, error: auth.error };
        }

        const result = await makeSoapRequest<any>('GetHotels', {
            'guid': auth.data,
            'cityKey': cityId
        });

        console.log(`[Solvex Dictionaries] GetHotels for city ${cityId} Raw Result:`, result);

        // Standard Solvex/MasterTour response navigation (Dataset with diffgram)
        const hotelsData = result?.Data?.diffgram?.DocumentElement?.Hotels ||
            result?.Hotel ||
            result?.Hotels ||
            result?.GetHotelsResult?.Hotel;

        const hotelsArr = Array.isArray(hotelsData) ? hotelsData : (hotelsData ? [hotelsData] : []);

        return {
            success: true,
            data: hotelsArr.map((h: any) => {
                const description = String(h.Description || '');
                let images: string[] = [];
                const additionalParams = h.AdditionalParams?.ParameterPair;
                if (additionalParams) {
                    const paramsArr = Array.isArray(additionalParams) ? additionalParams : [additionalParams];
                    paramsArr.forEach((p: any) => {
                        const key = String(p.Key || '').toLowerCase();
                        const val = String(p.Value || '');
                        if ((key.includes('image') || key.includes('picture') || key.includes('photo')) && val.startsWith('http')) {
                            images.push(val);
                        }
                    });
                }

                return {
                    id: parseInt(String(h.HotelKey || h.HotelID || h.ID || h.Key || 0)),
                    name: String(h.HotelName || h.Name || ''),
                    stars: parseInt(String(h.Stars || h.StarRating || h.HotelCategory?.Name || 0)),
                    description: description,
                    images: images,
                    city: String(h.CityName || h.City?.Name || '')
                };
            })
        };
    } catch (error) {
        console.error('[Solvex Dictionaries] GetHotels failed:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch hotels'
        };
    }
}

/**
 * Get detailed information for multiple hotels using SearchHotelServices 
 * (which returns AdditionalParams like images and full descriptions)
 */
export async function getDetailedHotels(ids: number[]): Promise<any[]> {
    try {
        const { searchHotels } = await import('./solvexSearchService');

        // Use Peak Summer Season to ensure availability (Hotels are closed in winter!)
        const now = new Date();
        // If we are past August, aim for next year. Otherwise, this year.
        const targetYear = now.getMonth() > 7 ? now.getFullYear() + 1 : now.getFullYear();

        const dateFrom = `${targetYear}-07-15`;
        const dateTo = `${targetYear}-07-22`;

        console.log(`[Deep Sync] Searching for details in Peak Season: ${dateFrom} - ${dateTo}`);

        const response = await searchHotels({
            dateFrom,
            dateTo,
            adults: 2,
            hotelId: ids as any // We modified client to handle number[]
        });

        if (!response.success || !response.data) return [];

        return response.data.map(item => {
            const h = item.hotel;
            return {
                id: h.id,
                name: h.name,
                stars: h.starRating,
                city: h.city.name,
                // FIX: Description and Images are attached to the 'hotel' object (h), not the root item
                description: (h as any).description || "",
                images: (h as any).images || [],
                rawData: item
            };
        });
    } catch (error) {
        console.error('[Solvex Dictionaries] getDetailedHotels failed:', error);
        return [];
    }
}

export default {
    getCountries,
    getCities,
    getRegions,
    getHotels,
    getDetailedHotels
};
