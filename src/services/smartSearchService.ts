/**
 * Smart Search Service
 * Connects SmartSearch UI with appropriate providers based on search type
 */

import { OpenGreeceAPI } from './opengreeceApiService';
import * as TCTApi from './tctApiService';
import { getAmadeusApi } from './flight/providers/amadeus/amadeusApiService';
import { SolvexAiProvider } from './providers/SolvexAiProvider';

// Provider mapping by search type
export const PROVIDER_MAPPING = {
    hotel: {
        providers: ['opengreece', 'tct', 'solvex'] as const,
        primary: 'opengreece' as const,
    },
    flight: {
        providers: ['amadeus'] as const,
        primary: 'amadeus' as const,
    },
    package: {
        providers: ['tct'] as const,
        primary: 'tct' as const,
    },
    transfer: {
        providers: ['tct'] as const,
        primary: 'tct' as const,
    },
    tour: {
        providers: ['tct'] as const,
        primary: 'tct' as const,
    },
} as const;

export type SearchType = keyof typeof PROVIDER_MAPPING;
export type HotelProvider = typeof PROVIDER_MAPPING.hotel.providers[number];
export type FlightProvider = typeof PROVIDER_MAPPING.flight.providers[number];

// Search parameters interface
export interface SmartSearchParams {
    searchType: SearchType;
    destinations: Array<{
        id: string;
        name: string;
        type: 'destination' | 'hotel';
        country?: string;
        provider?: string;
    }>;
    checkIn: string;
    checkOut: string;
    adults: number;
    children: number;
    childrenAges?: number[];
    mealPlan?: string;
    currency?: string;
    nationality?: string;
}

// Unified search result interface
export interface SmartSearchResult {
    provider: string;
    type: 'hotel' | 'flight' | 'package' | 'transfer' | 'tour';
    id: string;
    name: string;
    location: string;
    price: number;
    currency: string;
    stars?: number;
    mealPlan?: string;
    images?: string[];
    description?: string;
    originalData: any;
}

/**
 * Search hotels across multiple providers
 */
export async function searchHotels(
    params: SmartSearchParams
): Promise<SmartSearchResult[]> {
    const results: SmartSearchResult[] = [];
    const { destinations, checkIn, checkOut, adults, children } = params;
    const promises: Promise<void>[] = [];

    // Search OpenGreece
    promises.push((async () => {
        try {
            for (const dest of destinations) {
                if (dest.type === 'hotel' && dest.provider === 'OpenGreece') {
                    // Search specific hotel
                    const response = await OpenGreeceAPI.checkAvailability({
                        hotelCode: dest.id,
                        checkIn,
                        checkOut,
                        adults,
                        children: children || 0,
                    });

                    if (response.success && response.data) {
                        // Map OpenGreece results to unified format
                        results.push({
                            provider: 'OpenGreece',
                            type: 'hotel',
                            id: dest.id,
                            name: dest.name,
                            location: dest.country || '',
                            price: 0, // Extract from response
                            currency: 'EUR',
                            originalData: response.data,
                        });
                    }
                } else if (dest.type === 'destination') {
                    // Search by destination
                    const response = await OpenGreeceAPI.searchHotels();
                    if (response.success && response.data) {
                        // Filter by destination and map results
                        const filtered = response.data.filter((hotel: any) =>
                            hotel.location?.toLowerCase().includes(dest.name.toLowerCase())
                        );

                        results.push(...filtered.map((hotel: any) => ({
                            provider: 'OpenGreece',
                            type: 'hotel' as const,
                            id: hotel.hotelCode,
                            name: hotel.name,
                            location: hotel.location || '',
                            price: 0,
                            currency: 'EUR',
                            stars: hotel.stars,
                            originalData: hotel,
                        })));
                    }
                }
            }
        } catch (error) {
            console.error('[SmartSearch] OpenGreece error:', error);
        }
    })());

    // Search TCT
    promises.push((async () => {
        try {
            for (const dest of destinations) {
                const searchParams: any = {
                    search_type: dest.type === 'hotel' ? 'hotel' : 'city',
                    location: dest.name,
                    checkin: checkIn,
                    checkout: checkOut,
                    adults,
                    children: children || 0,
                    currency: params.currency || 'EUR',
                    nationality: params.nationality || 'RS',
                    residence: 'RS',
                    rooms: [{
                        adults,
                        children: children || 0,
                        children_ages: params.childrenAges || [],
                    }],
                };

                if (dest.type === 'hotel') {
                    searchParams.hotel_ids = [dest.id];
                }

                const searchResponse = await TCTApi.searchHotels(searchParams);

                if (searchResponse.success && searchResponse.data) {
                    const { search_id, search_code } = searchResponse.data as any;

                    // Poll for results
                    const resultsResponse = await TCTApi.getHotelResults({
                        search_id,
                        search_code,
                        last_check: 0,
                    });

                    if (resultsResponse.success && (resultsResponse.data as any)?.hotels) {
                        results.push(...(resultsResponse.data as any).hotels.map((hotel: any) => ({
                            provider: 'TCT',
                            type: 'hotel' as const,
                            id: hotel.hid,
                            name: hotel.name,
                            location: hotel.location || dest.name,
                            price: hotel.price?.amount || 0,
                            currency: hotel.price?.currency || 'EUR',
                            stars: hotel.stars,
                            mealPlan: hotel.meal_plan,
                            images: hotel.images || [],
                            originalData: hotel,
                        })));
                    }
                }
            }
        } catch (error) {
            console.error('[SmartSearch] TCT error:', error);
        }
    })());

    // Search Solvex AI (Agoda Engine Model)
    promises.push((async () => {
        try {
            const solvexAi = new SolvexAiProvider();
            for (const dest of destinations) {
                const isBulgaria = dest.country?.toLowerCase() === 'bulgaria' ||
                    dest.name.toLowerCase().includes('bulgaria') ||
                    ['bansa', 'borovets', 'sunny beach', 'golden sands', 'varna', 'burgas', 'sofia', 'pamporovo'].some(city => dest.name.toLowerCase().includes(city));

                if (isBulgaria || dest.provider === 'Solvex' || dest.provider === 'solvex') {
                    const aiResults = await solvexAi.search({
                        destination: dest.name,
                        checkIn: new Date(checkIn),
                        checkOut: new Date(checkOut),
                        adults,
                        children: children || 0,
                        childrenAges: params.childrenAges || [],
                        providerId: dest.id.startsWith('solvex-h-') ? dest.id.replace('solvex-h-', '') : dest.id,
                        providerType: dest.type === 'destination' ? 'city' : 'hotel',
                        targetProvider: 'Solvex'
                    });

                    if (aiResults && aiResults.length > 0) {
                        results.push(...aiResults.map((h: any) => ({
                            provider: 'Solvex AI',
                            type: 'hotel' as const,
                            id: h.id,
                            name: h.hotelName,
                            location: h.location,
                            price: h.price,
                            currency: h.currency,
                            stars: h.stars,
                            mealPlan: h.mealPlan,
                            originalData: h.originalData,
                        })));
                    }
                }
            }
        } catch (error) {
            console.error('[SmartSearch] Solvex AI error:', error);
        }
    })());

    await Promise.all(promises);
    return results;
}

/**
 * Search flights using Amadeus
 */
export async function searchFlights(
    params: SmartSearchParams
): Promise<SmartSearchResult[]> {
    const results: SmartSearchResult[] = [];
    const { destinations, checkIn, adults, children } = params;

    try {
        const amadeusApi = getAmadeusApi();

        for (const dest of destinations) {
            // Assume destination name is IATA code or city name
            const searchParams = {
                originLocationCode: 'BEG', // Belgrade - should be dynamic
                destinationLocationCode: dest.id, // Assume dest.id is IATA code
                departureDate: checkIn,
                adults,
                children: children || 0,
                travelClass: 'ECONOMY',
                currencyCode: params.currency || 'EUR',
            };

            const offers = await amadeusApi.searchFlights(searchParams as any);

            results.push(...offers.map((offer: any) => ({
                provider: 'Amadeus',
                type: 'flight' as const,
                id: offer.id,
                name: `${offer.itineraries[0].segments[0].departure.iataCode} → ${offer.itineraries[0].segments[offer.itineraries[0].segments.length - 1].arrival.iataCode}`,
                location: dest.name,
                price: parseFloat(offer.price.total),
                currency: offer.price.currency,
                originalData: offer,
            })));
        }
    } catch (error) {
        console.error('[SmartSearch] Amadeus error:', error);
    }

    return results;
}

/**
 * Search packages using TCT
 */
export async function searchPackages(
    params: SmartSearchParams
): Promise<SmartSearchResult[]> {
    const results: SmartSearchResult[] = [];

    try {
        const response = await TCTApi.getPackageDepartures();
        const data = response.data as any;

        if (response.success && data) {
            // Filter and map package results
            results.push(...data.map((pkg: any) => ({
                provider: 'TCT',
                type: 'package' as const,
                id: pkg.id,
                name: pkg.name,
                location: pkg.destination || '',
                price: pkg.price || 0,
                currency: 'EUR',
                originalData: pkg,
            })));
        }
    } catch (error) {
        console.error('[SmartSearch] TCT Packages error:', error);
    }

    return results;
}

/**
 * Main search function - routes to appropriate provider based on search type
 */
export async function performSmartSearch(
    params: SmartSearchParams
): Promise<SmartSearchResult[]> {
    console.log('[SmartSearch] Performing search:', params);

    switch (params.searchType) {
        case 'hotel':
            return searchHotels(params);

        case 'flight':
            return searchFlights(params);

        case 'package':
            return searchPackages(params);

        case 'transfer':
        case 'tour':
            // TODO: Implement transfer and tour search
            console.warn(`[SmartSearch] ${params.searchType} search not yet implemented`);
            return [];

        default:
            throw new Error(`Unknown search type: ${params.searchType}`);
    }
}

/**
 * Get available providers for a search type
 */
export function getProvidersForSearchType(searchType: SearchType): readonly string[] {
    return PROVIDER_MAPPING[searchType].providers;
}

/**
 * Check if a provider supports a search type
 */
export function isProviderSupported(searchType: SearchType, provider: string): boolean {
    return PROVIDER_MAPPING[searchType].providers.includes(provider as any);
}

export default {
    performSmartSearch,
    searchHotels,
    searchFlights,
    searchPackages,
    getProvidersForSearchType,
    isProviderSupported,
    PROVIDER_MAPPING,
};
