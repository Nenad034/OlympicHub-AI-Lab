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
            'regionKey': -1
        });

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
 * Get detailed information for multiple hotels
 */
export async function getDetailedHotels(ids: number[]): Promise<any[]> {
    try {
        const { searchHotels } = await import('./solvexSearchService');
        const now = new Date();
        const targetYear = now.getMonth() > 7 ? now.getFullYear() + 1 : now.getFullYear();
        const dateFrom = `${targetYear}-07-15`;
        const dateTo = `${targetYear}-07-22`;

        const response = await searchHotels({
            dateFrom,
            dateTo,
            adults: 2,
            hotelId: ids as any
        });

        if (!response.success || !response.data) return [];

        return response.data.map(item => {
            const h = item.hotel;
            return {
                id: h.id,
                name: h.name,
                stars: h.starRating,
                city: h.city.name,
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

/**
 * Get full hotel content (images, descriptions) using GetRoomDescriptions
 */
export async function getHotelFullContent(hotelId: number): Promise<SolvexApiResponse<{ images: string[], description: string }>> {
    try {
        const auth = await connect();
        if (!auth.success || !auth.data) {
            return { success: false, error: auth.error };
        }

        const result = await makeSoapRequest<any>('GetRoomDescriptions', {
            'guid': auth.data,
            'hotelKey': hotelId
        });

        console.log(`[Solvex Content] Parsing rich content for hotel ${hotelId}...`);

        let images: string[] = [];
        let description = '';

        // 1. Recursive search for fields in GetRoomDescriptions payload
        const findData = (obj: any) => {
            if (!obj || typeof obj !== 'object' || obj === null) return;

            if (Array.isArray(obj)) {
                obj.forEach(item => findData(item));
                return;
            }

            for (const key in obj) {
                const val = obj[key];

                // Potential descriptions
                if (['Description', 'HotelDescription', 'LongDescription', 'Text', 'Value'].includes(key) && typeof val === 'string') {
                    if (val.length > 40 && val.includes(' ') && !val.startsWith('http')) {
                        if (val.length > description.length) description = val;
                    }
                }

                // Potential images (direct fields)
                if (['Image', 'Picture', 'Photo', 'Path', 'Url', 'HotelImage'].includes(key) && typeof val === 'string' && val.startsWith('http')) {
                    if (!images.includes(val)) images.push(val);
                }

                if (typeof val === 'object') findData(val);
            }
        };

        findData(result);

        // 2. Fallback: Search Hotel Availability for this specific hotel to get the "HotelImage" from result table
        if (images.length === 0) {
            console.log(`[Solvex Content] No images in descriptions for ${hotelId}, trying Search discovery...`);
            try {
                const { searchHotels } = await import('./solvexSearchService');
                // Minimum search to trigger data return
                const dateFrom = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                const dateTo = new Date(dateFrom.getTime() + 7 * 24 * 60 * 60 * 1000);

                const searchRes = await searchHotels({
                    dateFrom: dateFrom.toISOString().split('T')[0],
                    dateTo: dateTo.toISOString().split('T')[0],
                    hotelId: hotelId,
                    adults: 2,
                    rooms: 1
                });

                if (searchRes.success && searchRes.data && searchRes.data.length > 0) {
                    const firstMatch = searchRes.data[0];
                    if (firstMatch.images && firstMatch.images.length > 0) {
                        images = [...new Set([...images, ...firstMatch.images])];
                    }
                    if (!description && firstMatch.description) {
                        description = firstMatch.description;
                    }
                }
            } catch (e) {
                console.warn(`[Solvex Content] Search discovery failed for ${hotelId}`);
            }
        }

        // 3. Brute-force regex for anything that missed
        const stringified = JSON.stringify(result);
        const urlRegex = /https?:\/\/[^\s\"\'<>]+/gi;
        const urlMatches = stringified.match(urlRegex);

        if (urlMatches) {
            urlMatches.forEach(url => {
                const cleanUrl = url.replace(/\\"/g, '').replace(/\"/g, '').replace(/&amp;/g, '&');
                if ((cleanUrl.match(/\.(jpg|jpeg|png|webp|gif|ashx)/i) || cleanUrl.includes('HotelPhoto')) &&
                    !cleanUrl.includes('megatec.ru') && !cleanUrl.includes('schemas.xmlsoap.org')) {
                    if (!images.includes(cleanUrl)) images.push(cleanUrl);
                }
            });
        }

        return {
            success: true,
            data: {
                images: images.filter(img => img.startsWith('http')),
                description: description || ""
            }
        };
    } catch (error) {
        console.error(`[Solvex Content] Failed for hotel ${hotelId}:`, error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch hotel content'
        };
    }
}

export default {
    getCountries,
    getCities,
    getRegions,
    getHotels,
    getDetailedHotels,
    getHotelFullContent
};
