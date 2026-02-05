// Solvex Search Service
import { makeSoapRequest, buildHotelSearchParams } from '../../utils/solvexSoapClient';
import type {
    SolvexHotelSearchResult,
    SolvexHotelSearchParams,
    SolvexApiResponse
} from '../../types/solvex.types';
import { connect } from './solvexAuthService';
import { rateLimiter } from '../../utils/rateLimiter';
import { SOLVEX_SOAP_METHODS, SOLVEX_RESPONSE_PATHS } from './solvexConstants';

/**
 * Search for hotel availability
 * This is the primary search method for Solvex
 */
export async function searchHotels(params: Omit<SolvexHotelSearchParams, 'guid'>): Promise<SolvexApiResponse<SolvexHotelSearchResult[]>> {
    try {
        // Check rate limit BEFORE making request
        const limitCheck = rateLimiter.checkLimit('solvex');
        if (!limitCheck.allowed) {
            console.warn(`[Solvex Search] Rate limit exceeded. Retry after ${limitCheck.retryAfter}s`);
            return {
                success: false,
                error: `Rate limit exceeded. Please wait ${limitCheck.retryAfter} seconds before retrying.`
            };
        }

        const auth = await connect();
        if (!auth.success || !auth.data) {
            return { success: false, error: auth.error };
        }

        const soapParams = buildHotelSearchParams({
            ...params,
            guid: auth.data
        });

        // Using SearchHotelServices method name from constants
        const result = await makeSoapRequest<any>(SOLVEX_SOAP_METHODS.SEARCH_HOTELS, soapParams);

        console.log('[Solvex Search] Raw SOAP result:', result);

        let items: any[] = [];

        // Navigate response using constants for better abstraction
        if (result?.Data?.[SOLVEX_RESPONSE_PATHS.DATA_REQUEST_RESULT]) {
            const dataReqResults = Array.isArray(result.Data[SOLVEX_RESPONSE_PATHS.DATA_REQUEST_RESULT])
                ? result.Data[SOLVEX_RESPONSE_PATHS.DATA_REQUEST_RESULT]
                : [result.Data[SOLVEX_RESPONSE_PATHS.DATA_REQUEST_RESULT]];

            console.log(`[Solvex Search] Processing ${dataReqResults.length} data results`);

            dataReqResults.forEach((dr: any, idx: number) => {
                const rt = dr[SOLVEX_RESPONSE_PATHS.RESULT_TABLE];
                const diffgram = rt?.[SOLVEX_RESPONSE_PATHS.DIFFGRAM];
                const docElement = diffgram?.[SOLVEX_RESPONSE_PATHS.DOCUMENT_ELEMENT];

                console.log(`[Solvex Search] Result[${idx}] keys:`, Object.keys(dr));
                if (rt) console.log(`[Solvex Search] Result[${idx}] ResultTable keys:`, Object.keys(rt));

                if (docElement?.[SOLVEX_RESPONSE_PATHS.HOTEL_SERVICES]) {
                    const hotelServices = docElement[SOLVEX_RESPONSE_PATHS.HOTEL_SERVICES];
                    const services = Array.isArray(hotelServices) ? hotelServices : [hotelServices];
                    items = items.concat(services);
                    console.log(`[Solvex Search] Result[${idx}] Found ${services.length} services`);
                } else {
                    console.warn(`[Solvex Search] Result[${idx}] no services found in DocumentElement`);
                }
            });
        } else {
            console.error('[Solvex Search] No DataRequestResult found in response. Available keys:', Object.keys(result?.Data || {}));
        }

        if (items.length === 0) {
            console.warn('[Solvex Search] No items found in response structure.');
            return {
                success: true,
                data: []
            };
        }

        console.log(`[Solvex Search] Found ${items.length} hotel services`);

        // 4a. Fetch enriched content from Supabase
        const uniqueHotelIds = [...new Set(items.map(s => String(s.HotelKey || '0')))];
        let enrichedMap: Record<string, any> = {};

        if (uniqueHotelIds.length > 0) {
            try {
                // Dynamically import supabase client
                // @ts-ignore
                const { supabase } = await import('../../supabaseClient');
                if (supabase) {
                    const { data: hotelsData } = await supabase
                        .from('properties')
                        .select('id, images, content, propertyAmenities')
                        .in('id', uniqueHotelIds.map(id => `solvex_${id}`));

                    if (hotelsData) {
                        hotelsData.forEach((h: any) => {
                            const solvexId = h.id.replace('solvex_', '');
                            enrichedMap[solvexId] = h;
                        });
                    }
                }
            } catch (e2) {
                console.warn('[Solvex Search] Could not load Supabase client for enrichment', e2);
            }
        }

        // Map SOAP results to our typed interface
        const mappedResults: SolvexHotelSearchResult[] = items.map(s => {
            const hotelId = String(s.HotelKey || '0');
            const hotelName = String(s.HotelName || 'Unknown Hotel');
            const enriched = enrichedMap[hotelId];

            // Solvex stores star rating in Description field, NOT in a separate Stars field
            // Format: "5*  (\Golden Sands)" or "4*+  (\Golden Sands)" or "Not defined  (\Golden Sands)"
            let starRating = 0;
            const rawDescription = String(s.Description || s.HotelDescription || '');

            // Try to extract stars from description (e.g. "5*", "4*+", "3*")
            const descStarMatch = rawDescription.match(/(\d)\s*\*+/);
            if (descStarMatch) {
                starRating = parseInt(descStarMatch[1]);
            }

            // Fallback: try hotel name if description didn't have it
            if (starRating === 0) {
                const nameStarMatch = hotelName.match(/(\d)\s*\*+/);
                if (nameStarMatch) {
                    starRating = parseInt(nameStarMatch[1]);
                }
            }

            // Use Enriched description if available
            const finalDescription = enriched?.content?.description || rawDescription;
            const finalImages = enriched?.images || [];

            return {
                hotel: {
                    id: parseInt(hotelId),
                    name: hotelName,
                    city: {
                        id: parseInt(String(s.CityKey || '0')),
                        name: String(s.CityName || ''),
                        nameLat: String(s.CityName || '')
                    },
                    country: {
                        id: parseInt(String(s.CountryKey || '0')),
                        name: 'Bulgaria',
                        nameLat: 'Bulgaria'
                    },
                    starRating: starRating,
                    nameLat: hotelName,
                    priceType: 0,
                    // Attach enriched data
                    // @ts-ignore
                    description: finalDescription,
                    // @ts-ignore
                    images: finalImages,
                    // @ts-ignore
                    amenities: enriched?.propertyAmenities || []
                },
                room: {
                    roomType: {
                        id: parseInt(String(s.RtKey || '0')),
                        name: String(s.RoomTypeName || s.RtName || s.RtCode || ''),
                        nameLat: String(s.RoomTypeName || s.RtName || s.RtCode || ''),
                        places: 0,
                        exPlaces: 0
                    },
                    roomCategory: {
                        id: parseInt(String(s.RcKey || '0')),
                        name: String(s.RoomCategoryName || s.RcName || ''),
                        nameLat: String(s.RoomCategoryName || s.RcName || '')
                    },
                    roomAccommodation: {
                        id: parseInt(String(s.AcKey || '0')),
                        name: String(s.RoomAccommodationName || s.AcName || ''),
                        nameLat: String(s.RoomAccommodationName || s.AcName || ''),
                        adultMainPlaces: 0,
                        childMainPlaces: 0
                    }
                },
                pansion: {
                    id: parseInt(String(s.PnKey || '0')),
                    name: String(s.PansionName || s.PnName || s.PnCode || ''),
                    nameLat: String(s.PansionName || s.PnName || s.PnCode || ''),
                    code: String(s.PnCode || '')
                },
                totalCost: parseFloat(String(s.TotalCost || s.Cost || '0')),
                quotaType: parseInt(String(s.QuoteType || '0')),
                tariff: {
                    id: parseInt(String(s.TariffId || '0')),
                    name: String(s.TariffName || '')
                },
                duration: Math.ceil((new Date(params.dateTo).getTime() - new Date(params.dateFrom).getTime()) / (1000 * 60 * 60 * 24)),
                startDate: params.dateFrom
            };
        });

        return {
            success: true,
            data: mappedResults
        };
    } catch (error) {
        console.error('[Solvex Search] searchHotels failed:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to perform hotel search'
        };
    }
}

export default {
    searchHotels
};
