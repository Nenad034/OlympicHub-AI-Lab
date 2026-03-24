// Solvex Search Service
import { makeSoapRequest, buildHotelSearchParams, formatSolvexDate } from './solvexSoapClient';
import type {
    SolvexHotelSearchResult,
    SolvexHotelSearchParams,
    SolvexApiResponse,
    SolvexCancellationPolicy
} from '../types/solvex.types';
import { connect } from './solvexAuthService';
import { rateLimiter } from '../../../utils/rateLimiter';
import { SOLVEX_SOAP_METHODS, SOLVEX_RESPONSE_PATHS } from './solvexConstants';

/**
 * Search for hotel availability
 * This is the primary search method for Solvex
 */
export async function searchHotels(
    params: Omit<SolvexHotelSearchParams, 'guid'>,
    signal?: AbortSignal
): Promise<SolvexApiResponse<SolvexHotelSearchResult[]>> {
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

        const result = await makeSoapRequest<any>(SOLVEX_SOAP_METHODS.SEARCH_HOTELS, soapParams, signal);

        let items: any[] = [];

        // Navigate response: result.Data.DataRequestResult.ResultTable.diffgram.DocumentElement.HotelServices
        if (result?.Data?.[SOLVEX_RESPONSE_PATHS.DATA_REQUEST_RESULT]) {
            const dataReqResults = Array.isArray(result.Data[SOLVEX_RESPONSE_PATHS.DATA_REQUEST_RESULT])
                ? result.Data[SOLVEX_RESPONSE_PATHS.DATA_REQUEST_RESULT]
                : [result.Data[SOLVEX_RESPONSE_PATHS.DATA_REQUEST_RESULT]];

            console.log(`[Solvex Search] Processing ${dataReqResults.length} data results`);

            dataReqResults.forEach((dr: any, idx: number) => {
                const rt = dr[SOLVEX_RESPONSE_PATHS.RESULT_TABLE];
                const diffgram = rt?.[SOLVEX_RESPONSE_PATHS.DIFFGRAM];
                const docElement = diffgram?.[SOLVEX_RESPONSE_PATHS.DOCUMENT_ELEMENT];

                if (docElement?.[SOLVEX_RESPONSE_PATHS.HOTEL_SERVICES]) {
                    const hotelServices = docElement[SOLVEX_RESPONSE_PATHS.HOTEL_SERVICES];
                    const services = Array.isArray(hotelServices) ? hotelServices : [hotelServices];
                    items = items.concat(services);
                    console.log(`[Solvex Search] Result[${idx}] Found ${services.length} services`);
                } else {
                    console.warn(`[Solvex Search] Result[${idx}] no services found`);
                }
            });
        } else {
            console.error('[Solvex Search] No DataRequestResult found. Keys:', Object.keys(result?.Data || {}));
        }

        if (items.length === 0) {
            return { success: true, data: [] };
        }

        console.log(`[Solvex Search] Found ${items.length} hotel services total`);

        // Fetch enriched content from Supabase (images, descriptions)
        const uniqueHotelIds = [...new Set(items.map(s => String(s.HotelKey || '0')))];
        let enrichedMap: Record<string, any> = {};

        if (uniqueHotelIds.length > 0) {
            try {
                const { supabase } = await import('../../../supabaseClient');
                if (supabase) {
                    // Chunk uniqueHotelIds to avoid URL length limits (400 Bad Request)
                    const chunkSize = 20;
                    const idChunks = [];
                    for (let i = 0; i < uniqueHotelIds.length; i += chunkSize) {
                        idChunks.push(uniqueHotelIds.slice(i, i + chunkSize));
                    }

                    console.log(`[Solvex Search] Fetching enrichment in ${idChunks.length} chunks...`);

                    for (const chunk of idChunks) {
                        const { data: hotelsData, error } = await supabase
                            .from('properties')
                            .select('id, images, content, propertyAmenities')
                            .in('id', chunk.map(id => `solvex_${id}`));

                        if (error) {
                            console.error('[Solvex Search] Chunk fetch error:', error);
                            continue;
                        }

                        if (hotelsData) {
                            hotelsData.forEach((h: any) => {
                                const solvexId = h.id.replace('solvex_', '');
                                enrichedMap[solvexId] = h;
                            });
                        }
                    }
                    console.log(`[Solvex Search] Enriched ${Object.keys(enrichedMap).length} hotels total from Supabase`);
                }
            } catch (e2) {
                console.warn('[Solvex Search] Could not load Supabase for enrichment', e2);
            }
        }

        // Map SOAP results to our typed interface
        const mappedResults: SolvexHotelSearchResult[] = items.map(s => {
            const hotelId = String(s.HotelKey || '0');
            const hotelName = String(s.HotelName || 'Unknown Hotel');
            const enriched = enrichedMap[hotelId];

            // Extract star rating (Solvex puts stars in Description or HotelName)
            let starRating = 0;
            const rawDescription = String(s.Description || s.HotelDescription || '');
            const descStarMatch = rawDescription.match(/(\d)\s*\*+/);
            if (descStarMatch) starRating = parseInt(descStarMatch[1]);
            if (starRating === 0) {
                const nameStarMatch = hotelName.match(/(\d)\s*\*+/);
                if (nameStarMatch) starRating = parseInt(nameStarMatch[1]);
            }

            // --- DEEP CONTENT EXTRACTION START ---
            let extractedImages: string[] = [];
            let extractedDescription = rawDescription;
            let extractedLat: number | undefined = undefined;
            let extractedLng: number | undefined = undefined;
            const additionalParams = s.AdditionalParams?.ParameterPair;

            // Recursive function to find images/coords anywhere in the object
            const findContentRecursively = (obj: any) => {
                if (!obj) return;

                // 1. Direct string check for URLs
                if (typeof obj === 'string' &&
                    (obj.startsWith('http') || obj.startsWith('https') || obj.startsWith('/')) &&
                    (obj.match(/\.(jpg|jpeg|png|gif|webp)$/i) || obj.includes('image') || obj.includes('photo'))) {
                    extractedImages.push(obj);
                    return;
                }

                // 2. Iterate Arrays
                if (Array.isArray(obj)) {
                    obj.forEach(item => findContentRecursively(item));
                    return;
                }

                // 3. Iterate Objects
                if (typeof obj === 'object') {
                    for (const key in obj) {
                        const val = obj[key];
                        const lowerKey = key.toLowerCase();

                        // Coordinates check
                        if (lowerKey === 'latitude' || lowerKey === 'lat') extractedLat = extractedLat || parseFloat(val);
                        if (lowerKey === 'longitude' || lowerKey === 'lng' || lowerKey === 'lon') extractedLng = extractedLng || parseFloat(val);

                        // Description check
                        if ((key === 'Description' || key === 'HotelDescription') && typeof val === 'string' && val.length > extractedDescription.length) {
                            extractedDescription = val;
                        }

                        // Image keywords search
                        if (lowerKey.includes('image') || lowerKey.includes('photo') || lowerKey.includes('picture') || lowerKey.includes('url')) {
                            if (typeof val === 'string' && (val.startsWith('http') || val.startsWith('/'))) extractedImages.push(val);
                            else findContentRecursively(val);
                        } else {
                            findContentRecursively(val);
                        }
                    }
                }
            };

            // First pass: Try the standard AdditionalParams location
            if (additionalParams) {
                const paramsArr = Array.isArray(additionalParams) ? additionalParams : [additionalParams];
                paramsArr.forEach((p: any) => {
                    const key = String(p.Key || '').toLowerCase();
                    const val = String(p.Value || '');

                    if ((key.includes('image') || key.includes('picture') || key.includes('photo')) && (val.startsWith('http') || val.startsWith('/'))) {
                        extractedImages.push(val);
                    }
                    else if (key === 'description' || key === 'hoteldescription') {
                        if (val.length > extractedDescription.length) {
                            extractedDescription = val;
                        }
                    }
                    else if (key === 'latitude' || key === 'lat') {
                        extractedLat = extractedLat || parseFloat(val);
                    }
                    else if (key === 'longitude' || key === 'lng' || key === 'lon') {
                        extractedLng = extractedLng || parseFloat(val);
                    }
                });
            }

            // Second pass: unleashing the deep search
            findContentRecursively(s);
            // Deduplicate and encode URI for Cyrillic characters
            extractedImages = [...new Set(extractedImages)].map(u => encodeURI(u));
            // --- DEEP EXTRACTION END ---

            const finalImages = (enriched?.images || (extractedImages.length > 0 ? extractedImages : []))
                .map((u: string) => encodeURI(u));
            const finalDescription = enriched?.content?.description || extractedDescription;
            const finalLat = enriched?.latitude || extractedLat;
            const finalLng = enriched?.longitude || extractedLng;

            return {
                hotel: {
                    id: parseInt(hotelId),
                    name: hotelName,
                    nameLat: hotelName,
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
                    starRating,
                    priceType: 0,
                    // @ts-ignore
                    description: finalDescription,
                    // @ts-ignore
                    images: finalImages,
                    // @ts-ignore
                    latitude: finalLat,
                    // @ts-ignore
                    longitude: finalLng,
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
                cancellationPolicyRequestParams: s.CancellationPolicyRequestParams || {
                    DateFrom: formatSolvexDate(params.dateFrom),
                    DateTo: formatSolvexDate(params.dateTo),
                    HotelKey: parseInt(hotelId),
                    PansionKey: parseInt(String(s.PnKey || '0')),
                    AccommodationKey: parseInt(String(s.AcKey || '0')),
                    RoomTypeKey: parseInt(String(s.RtKey || '0')),
                    RoomCategoryKey: parseInt(String(s.RcKey || '0')),
                    Pax: params.adults + (params.children || 0),
                    Ages: { int: params.childrenAges || [] }
                },
                duration: Math.ceil((new Date(params.dateTo).getTime() - new Date(params.dateFrom).getTime()) / (1000 * 60 * 60 * 24)),
                startDate: params.dateFrom
            };
        });

        return { success: true, data: mappedResults };

    } catch (error) {
        console.error('[Solvex Search] searchHotels failed:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to perform hotel search'
        };
    }
}

/**
 * Get detailed cancellation policy with penalties for a specific room configuration
 */
export async function getCancellationPolicy(
    room: any,
    signal?: AbortSignal
): Promise<SolvexApiResponse<SolvexCancellationPolicy[]>> {
    try {
        const auth = await connect();
        if (!auth.success || !auth.data) {
            return { success: false, error: auth.error };
        }

        const params = room.cancellationPolicyRequestParams;
        if (!params) {
            return { success: false, error: 'No cancellation request parameters available for this room.' };
        }

        const soapParams = {
            'guid': auth.data,
            'dateFrom': params.DateFrom || params.dateFrom || params.startDate,
            'dateTo': params.DateTo || params.dateTo || params.endDate,
            'HotelKey': params.HotelKey || params.hotelKey || params.hotelId,
            'PansionKey': params.PansionKey || params.pansionKey || params.pansionId,
            'AccommodationKey': params.AccommodationKey || params.accommodationKey || params.accommodationId,
            'RoomTypeKey': params.RoomTypeKey || params.roomTypeKey || params.roomTypeId,
            'RoomCategoryKey': params.RoomCategoryKey || params.roomCategoryKey || params.roomCategoryId,
            'Pax': params.Pax || params.pax || 2,
            'Ages': params.Ages || params.ages || { int: [] },
            'CancellationDate': formatSolvexDate(new Date()) // Today
        };
        const response = await makeSoapRequest<any>(SOLVEX_SOAP_METHODS.GET_CANCELLATION_POLICY, soapParams, signal);

        // Handle possible data paths (SOAP can return single object or array)
        const info = response?.Data?.CancellationPolicyInfoWithPenalty;
        const mainInfo = Array.isArray(info) ? info[0] : info;

        if (!mainInfo?.PolicyData) {
            console.warn('[Solvex Search] No PolicyData found in response', response);
            return { success: true, data: [] };
        }

        const policyData = mainInfo.PolicyData;
        const rawPolicies = Array.isArray(policyData.CancellationPolicyWithPenaltyValue)
            ? policyData.CancellationPolicyWithPenaltyValue
            : (policyData.CancellationPolicyWithPenaltyValue ? [policyData.CancellationPolicyWithPenaltyValue] : []);

        const mappedPolicies: SolvexCancellationPolicy[] = rawPolicies.map((p: any) => ({
            policyKey: parseInt(p.PolicyKey || '0'),
            dateFrom: p.DateFrom || null,
            dateTo: p.DateTo || null,
            penaltyValue: parseFloat(p.PenaltyValue || '0'),
            isPercent: p.IsPercent === true || p.IsPercent === 'true' || String(p.IsPercent).toLowerCase() === 'true',
            totalPenalty: parseFloat(p.PenaltyTotal || '0'),
            description: p.Description || `Otkaz od ${p.DateFrom ? new Date(p.DateFrom).toLocaleDateString('sr-RS') : 'nepoznatog datuma'}`
        }));

        return { success: true, data: mappedPolicies };
    } catch (error) {
        console.error('[Solvex Search] getCancellationPolicy failed:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch cancellation policy'
        };
    }
}

export default { searchHotels, getCancellationPolicy };
