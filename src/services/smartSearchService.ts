/**
 * Smart Search Service
 * Connects SmartSearch UI with appropriate providers based on search type
 */

import { SolvexAiProvider } from './providers/SolvexAiProvider';

export interface SmartSearchParams {
    searchType: 'hotel' | 'flight' | 'package' | 'transfer' | 'tour';
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

export const PROVIDER_MAPPING = {
    hotel: { providers: ['solvex'], primary: 'solvex' },
    flight: { providers: [], primary: '' },
    package: { providers: [], primary: '' },
    transfer: { providers: [], primary: '' },
    tour: { providers: [], primary: '' },
};

export async function performSmartSearch(params: SmartSearchParams): Promise<SmartSearchResult[]> {
    console.log('[SmartSearchService] Starting search...', params);

    if (params.searchType !== 'hotel') {
        return [];
    }

    const results: SmartSearchResult[] = [];
    const solvexAi = new SolvexAiProvider();

    try {
        for (const dest of params.destinations) {
            console.log(`[SmartSearchService] Querying Solvex for: ${dest.name}`);

            const aiResults = await solvexAi.search({
                destination: dest.name,
                checkIn: params.checkIn ? new Date(params.checkIn) : new Date(),
                checkOut: params.checkOut ? new Date(params.checkOut) : new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000),
                adults: params.adults,
                children: params.children || 0,
                childrenAges: params.childrenAges || [],
                providerId: dest.id.startsWith('solvex-h-') ? dest.id.replace('solvex-h-', '') : dest.id,
                providerType: dest.type === 'destination' ? 'city' : 'hotel',
                targetProvider: 'Solvex'
            });

            if (aiResults && aiResults.length > 0) {
                results.push(...aiResults.map(h => ({
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
            }
        }
    } catch (error) {
        console.error('[SmartSearchService] Solvex error:', error);
    }

    console.log(`[SmartSearchService] Finished. Found ${results.length} results.`);
    return results;
}

export function getProvidersForSearchType(searchType: string): readonly string[] {
    return (PROVIDER_MAPPING as any)[searchType]?.providers || [];
}

export function isProviderSupported(searchType: string, provider: string): boolean {
    return (PROVIDER_MAPPING as any)[searchType]?.providers.includes(provider) || false;
}

export default {
    performSmartSearch,
};
