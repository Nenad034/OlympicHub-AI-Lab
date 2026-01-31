/**
 * Smart Search Service
 * Connects SmartSearch UI with appropriate providers based on search type
 */

import { OpenGreeceAPI } from './opengreeceApiService';
import * as TCTApi from './tctApiService';
import { getAmadeusApi } from './flight/providers/amadeus/amadeusApiService';
import { getHotelProviderManager } from './providers/HotelProviderManager';
import type { HotelSearchResult } from './providers/HotelProviderInterface';

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

    // Helper to wrap promise with timeout
    const withTimeout = (promise: Promise<void>, providerName: string) => {
        return Promise.race([
            promise,
            new Promise<void>((_, reject) =>
                setTimeout(() => reject(new Error(`${providerName} timeout`)), 15000)
            )
        ]).catch(err => {
            console.warn(`[SmartSearch] ${providerName} failed or timed out:`, err.message);
        });
    };

    console.log(`[SmartSearch] Starting parallel search for ${destinations.length} destinations...`);

    // Search OpenGreece - DISABLED for now
    /*
    promises.push(withTimeout((async () => {
        // ... (OpenGreece logic)
    })(), 'OpenGreece'));
    */

    // Search TCT - DISABLED for now
    /*
    promises.push(withTimeout((async () => {
        // ... (TCT logic)
    })(), 'TCT'));
    */

    // Search Solvex AI - ACTIVE (Using the Hub's Logic)
    promises.push(withTimeout((async () => {
        try {
            const manager = getHotelProviderManager();
            const solvexAi = manager.getProvider('Solvex AI');

            if (!solvexAi) {
                console.error('[SmartSearch] Solvex AI provider not found in Manager');
                return;
            }

            for (const dest of destinations) {
                console.log(`[SmartSearch] Searching Solvex AI for: ${dest.name}`);

                // Map to HotelSearchParams expected by the manager/interface
                const searchParams = {
                    destination: dest.name,
                    checkIn: checkIn ? new Date(checkIn) : new Date(),
                    checkOut: checkOut ? new Date(checkOut) : new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000),
                    adults,
                    children: children || 0,
                    childrenAges: params.childrenAges || [],
                    providerId: dest.id.startsWith('solvex-h-') ? dest.id.replace('solvex-h-', '') : dest.id,
                    providerType: dest.type === 'destination' ? 'city' : 'hotel' as 'city' | 'hotel',
                    targetProvider: 'Solvex'
                };

                // Use the manager's search provider method (handles auth & cache)
                // We use private searchProvider or just call solvexAi.search directly after auth
                await solvexAi.authenticate();
                const aiResults = await solvexAi.search(searchParams);

                if (aiResults && aiResults.length > 0) {
                    console.log(`[SmartSearch] Solvex AI found ${aiResults.length} results.`);
                    results.push(...aiResults.map((h: HotelSearchResult) => ({
                        provider: 'Solvex AI',
                        type: 'hotel' as const,
                        id: h.id,
                        name: h.hotelName,
                        location: h.location,
                        price: h.price,
                        currency: h.currency,
                        stars: h.stars,
                        mealPlan: h.mealPlan,
                        images: h.image ? [h.image] : [],
                        originalData: h.originalData,
                    })));
                } else {
                    console.warn(`[SmartSearch] Solvex AI returned 0 results for ${dest.name}`);
                }
            }
        } catch (error) {
            console.error('[SmartSearch] Solvex AI error:', error);
        }
    })(), 'Solvex AI'));

    await Promise.all(promises);
    console.log(`[SmartSearch] All providers done. Total results: ${results.length}`);
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
    return (PROVIDER_MAPPING[searchType].providers as readonly string[]).includes(provider);
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
