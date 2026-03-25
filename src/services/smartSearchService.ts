/**
 * Smart Search Service
 * Connects SmartSearch UI with appropriate providers based on search type
 */

import { getHotelProviderManager } from './providers/HotelProviderManager';

export interface RoomAllocation {
    adults: number;
    children: number;
    childrenAges: number[];
}

export interface SmartSearchParams {
    searchType: 'hotel' | 'flight' | 'package' | 'transfer' | 'tour' | 'charter' | 'cruise' | 'event' | 'ski';
    destinations: Array<{
        id: string | number;
        name: string;
        type: 'destination' | 'hotel' | 'country' | 'city';
        country?: string;
        provider?: string;
    }>;
    checkIn: string;
    checkOut: string;
    roomConfig: RoomAllocation[];
    mealPlan?: string;
    flexibility?: number;
    stars?: string[] | number[];
    board?: string[];
    currency?: string;
    nationality?: string;
    enabledProviders?: Record<string, boolean>;
    abortSignal?: AbortSignal;
    onPartialResults?: (results: SmartSearchResult[]) => void;
}

export interface SmartSearchResult {
    provider: string;
    type: 'hotel' | 'flight' | 'package' | 'transfer' | 'tour' | 'charter' | 'cruise' | 'event' | 'ski';
    id: string;
    name: string;
    location: string | { city: string; country: string };
    price: number;
    currency: string;
    stars?: number;
    mealPlan?: string;
    mealPlans?: string[];
    images?: string[];
    description?: string;
    rooms?: any[];
    allocationResults?: Record<number, any[]>; // Maps room index to its specific available rooms
    originalData: any;
    salesCount?: number;
    availability?: string;
    latitude?: number;
    longitude?: number;
}

// Smart Search Configuration
export const PROVIDER_MAPPING = {
    hotel: { providers: ['Solvex', 'Filos', 'MtsGlobe', 'TCT'], primary: 'Solvex' },
    flight: { providers: [], primary: '' },
    package: { providers: [], primary: '' },
    transfer: { providers: [], primary: '' },
    tour: { providers: [], primary: '' },
};

// Smart Search Cache (simple in-memory)
const searchCache = new Map<string, { timestamp: number, results: SmartSearchResult[] }>();
const CACHE_TTL = 3 * 60 * 1000; // 3 minutes
const PROVIDER_TIMEOUT = 30000; // 30s (adjusted for potential proxy overhead)

/**
 * Perform Smart Search (ORCHESTRATOR)
 */
export async function performSmartSearch(params: SmartSearchParams): Promise<SmartSearchResult[]> {
    console.log('🚀 [START] Smart Search Orchestration:', params);
    
    // Check Cache
    const cacheKey = JSON.stringify({ 
        t: params.searchType, 
        d: params.destinations.map(d => d.id), 
        i: params.checkIn, 
        o: params.checkOut, 
        r: params.roomConfig 
    });
    const cached = searchCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
        console.log('[SmartSearchService] Returning results from cache...');
        return cached.results;
    }

    const providerManager = getHotelProviderManager();
    const finalResultsMap = new Map<string, SmartSearchResult>();
    
    // Determine active providers and normalize them (case-insensitive match with registered names)
    const registeredNames = providerManager.getProviderNames();
    const rawKeys = params.enabledProviders 
        ? Object.keys(params.enabledProviders).filter(k => (params.enabledProviders as any)[k])
        : ['Solvex', 'Filos', 'MtsGlobe', 'Travelgate', 'TCT'];

    const activeProviderKeys = rawKeys.map(key => {
        const match = registeredNames.find(name => name.toLowerCase() === key.toLowerCase());
        return match || key;
    });

    // 1. Authenticate all providers in parallel
    await Promise.all(activeProviderKeys.map(async (key) => {
        try {
            const provider = providerManager.getProvider(key);
            if (provider) await provider.authenticate();
        } catch (e) {
            console.error(`auth failed for ${key}`, e);
        }
    }));

    const searchTasks: Promise<void>[] = [];

    // 2. Parallel Search across ALL destinations and ALL room configs
    for (const dest of params.destinations) {
        // Unique room configs to avoid redundant requests
        const uniqueConfigs = Array.from(new Set(params.roomConfig.map(r => JSON.stringify(r))))
            .map(s => JSON.parse(s));

        for (const room of uniqueConfigs) {
            for (const providerKey of activeProviderKeys) {
                const searchTask = (async () => {
                    const provider = providerManager.getProvider(providerKey);
                    if (!provider) return;

                    const providerParams = {
                        destination: dest.name,
                        checkIn: new Date(params.checkIn),
                        checkOut: new Date(params.checkOut),
                        adults: room.adults,
                        children: room.children,
                        childrenAges: room.childrenAges,
                        nationality: params.nationality || 'RS',
                        providerId: dest.id,
                        providerType: dest.type,
                        targetProvider: (dest as any).provider, // ONLY if explicitly set
                        stars: params.stars,
                        board: params.board,
                        abortSignal: params.abortSignal
                    };

                    try {
                        const results = await Promise.race([
                            provider.search(providerParams),
                            new Promise((_, reject) => setTimeout(() => reject(new Error('TIMEOUT')), PROVIDER_TIMEOUT))
                        ]) as any[];

                        if (!results || results.length === 0) return;

                        results.forEach(h => {
                            // Filter out 0 price results
                            const price = h.price || h.totalPrice || h.lowestTotalPrice || 0;
                            if (price <= 0) return;

                            const hotelKey = (h.hotelName || h.name || '').toLowerCase();
                            if (!hotelKey) return;

                            if (!finalResultsMap.has(hotelKey)) {
                                finalResultsMap.set(hotelKey, {
                                    provider: providerKey,
                                    type: 'hotel',
                                    id: h.id || `h-${Math.random()}`,
                                    name: h.hotelName || h.name,
                                    location: h.location,
                                    price: 0,
                                    currency: h.currency || 'EUR',
                                    stars: h.stars,
                                    mealPlan: h.mealPlan,
                                    mealPlans: h.mealPlan ? [h.mealPlan] : [],
                                    images: h.image ? [h.image] : (h.images || []),
                                    rooms: h.rooms || [],
                                    allocationResults: {},
                                    originalData: h.originalData || h,
                                    latitude: h.latitude,
                                    longitude: h.longitude,
                                    availability: h.availability || 'available'
                                });
                            }

                            const existing = finalResultsMap.get(hotelKey)!;
                            
                            // Initialize allocationResults if missing (unlikely but safe)
                            if (!existing.allocationResults) existing.allocationResults = {};

                            params.roomConfig.forEach((rc, slotIdx) => {
                                if (JSON.stringify(rc) === JSON.stringify(room)) {
                                    existing.allocationResults![slotIdx] = h.rooms || [];
                                }
                            });

                            const currentPrice = h.price || 0;
                            if (existing.price === 0 || currentPrice < existing.price) {
                                existing.price = currentPrice;
                                existing.provider = providerKey;
                            }
                        });

                        // Emit partial results
                        if (params.onPartialResults) {
                            const currentBatch = Array.from(finalResultsMap.values());
                            const sorted = currentBatch.sort((a: any, b: any) => {
                                if (a.provider === 'Solvex' && b.provider !== 'Solvex') return -1;
                                if (b.provider === 'Solvex' && a.provider !== 'Solvex') return 1;
                                return (b.stars || 0) - (a.stars || 0);
                            });
                            params.onPartialResults(sorted);
                        }
                    } catch (err) {
                        console.warn(`⚠️ [PROVIDER TIMEOUT/ERROR] ${providerKey}:`, err);
                    }
                })();
                searchTasks.push(searchTask);
            }
        }
    }

    await Promise.all(searchTasks);
    const finalResults = Array.from(finalResultsMap.values());
    searchCache.set(cacheKey, { timestamp: Date.now(), results: finalResults });
    return finalResults;
}

export function getProvidersForSearchType(searchType: string): readonly string[] {
    return (PROVIDER_MAPPING as any)[searchType]?.providers || [];
}

export function isProviderSupported(searchType: string, provider: string): boolean {
    return (PROVIDER_MAPPING as any)[searchType]?.providers.includes(provider) || false;
}

/**
 * Get detailed cancellation policy for a room from a specific provider
 */
export async function getDetailedCancellationPolicy(provider: string, room: any): Promise<any> {
    const providerManager = getHotelProviderManager();
    const providerInstance = providerManager.getProvider(provider);
    if (providerInstance && providerInstance.getCancellationPolicy) {
        return providerInstance.getCancellationPolicy(room);
    }
    return null;
}

export default {
    performSmartSearch,
    getDetailedCancellationPolicy
};
