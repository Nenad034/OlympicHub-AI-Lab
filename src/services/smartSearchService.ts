/**
 * Smart Search Service
 * Connects SmartSearch UI with appropriate providers based on search type
 */

import { SolvexAiProvider } from './providers/SolvexAiProvider';

export interface RoomAllocation {
    adults: number;
    children: number;
    childrenAges: number[];
}

export interface SmartSearchParams {
    searchType: 'hotel' | 'flight' | 'package' | 'transfer' | 'tour' | 'charter' | 'cruise' | 'event';
    destinations: Array<{
        id: string;
        name: string;
        type: 'destination' | 'hotel';
        country?: string;
        provider?: string;
    }>;
    checkIn: string;
    checkOut: string;
    rooms: RoomAllocation[];
    mealPlan?: string;
    currency?: string;
    nationality?: string;
}

export interface SmartSearchResult {
    provider: string;
    type: 'hotel' | 'flight' | 'package' | 'transfer' | 'tour' | 'charter' | 'cruise' | 'event';
    id: string;
    name: string;
    location: string;
    price: number;
    currency: string;
    stars?: number;
    mealPlan?: string;
    images?: string[];
    description?: string;
    rooms?: any[];
    allocationResults?: Record<number, any[]>; // Maps room index to its specific available rooms
    originalData: any;
    salesCount?: number;
}

export const PROVIDER_MAPPING = {
    hotel: { providers: ['solvex'], primary: 'solvex' },
    flight: { providers: [], primary: '' },
    package: { providers: [], primary: '' },
    transfer: { providers: [], primary: '' },
    tour: { providers: [], primary: '' },
};

export async function performSmartSearch(params: SmartSearchParams): Promise<SmartSearchResult[]> {
    console.log('[SmartSearchService] Starting multi-room search...', params);

    // --- Transfer Search ---
    if (params.searchType === 'transfer') {
        return [
            {
                provider: 'Olympic',
                type: 'transfer',
                id: 'tr-1',
                name: 'Privatni Transfer (Standard)',
                location: params.destinations[0]?.name || 'Aerodrom - Hotel',
                price: 45,
                currency: 'EUR',
                originalData: {}
            }
        ];
    }

    // --- Tour Search ---
    if (params.searchType === 'tour') {
        return [
            {
                provider: 'Olympic',
                type: 'tour',
                id: 'tour-1',
                name: 'Obilazak grada sa vodičem',
                location: params.destinations[0]?.name || 'Centar grada',
                price: 25,
                currency: 'EUR',
                originalData: {}
            }
        ];
    }

    if (params.searchType !== 'hotel') {
        return [];
    }

    const solvexAi = new SolvexAiProvider();
    const finalResultsMap = new Map<string, SmartSearchResult>();

    try {
        await solvexAi.authenticate();

        // STEP 1: Identify unique room configurations to minimize API calls
        const uniqueConfigs = new Map<string, { adults: number, children: number, ages: number[], indices: number[] }>();
        params.rooms.forEach((room, idx) => {
            const key = `${room.adults}-${room.children}-${[...room.childrenAges].sort().join(',')}`;
            if (!uniqueConfigs.has(key)) {
                uniqueConfigs.set(key, { ...room, ages: room.childrenAges, indices: [idx] });
            } else {
                uniqueConfigs.get(key)!.indices.push(idx);
            }
        });

        const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

        // STEP 2: Perform searches for each unique configuration
        for (const dest of params.destinations) {
            console.log(`[SmartSearchService] Querying for destination: ${dest.name}`);

            const configResults: Array<{ config: any, results: any[] }> = [];

            // Execute unique configs with a small staggered delay to be polite to the API
            const configSearchPromises = Array.from(uniqueConfigs.values()).map(async (config, cIdx) => {
                if (cIdx > 0) await delay(200 * cIdx); // Stagger by 200ms
                const results = await solvexAi.search({
                    destination: dest.name,
                    checkIn: new Date(params.checkIn),
                    checkOut: new Date(params.checkOut),
                    adults: config.adults,
                    children: config.children,
                    childrenAges: config.ages,
                    providerId: dest.id.startsWith('solvex-') ? dest.id.split('-').pop() : dest.id,
                    providerType: dest.type === 'destination' ? 'city' : 'hotel',
                    targetProvider: dest.id.startsWith('solvex-') || dest.provider === 'Solvex' ? 'Solvex' : undefined
                });
                return { config, results };
            });

            configResults.push(...(await Promise.all(configSearchPromises)));

            // STEP 3: Merge results - a hotel must be available for ALL unique configurations
            // We group results by hotel name (case-insensitive) for merging
            const hotelsInAllConfigs = new Set<string>();

            // Prime the set with hotels from the first configuration's results
            if (configResults.length > 0) {
                configResults[0].results.forEach(r => hotelsInAllConfigs.add(r.hotelName.toLowerCase()));
            }

            // Intersect with remaining configurations
            for (let i = 1; i < configResults.length; i++) {
                const currentHotelNames = new Set(configResults[i].results.map(r => r.hotelName.toLowerCase()));
                for (const name of hotelsInAllConfigs) {
                    if (!currentHotelNames.has(name)) {
                        hotelsInAllConfigs.delete(name);
                    }
                }
            }

            // STEP 4: Build final merged results for hotels available in ALL configs
            configResults.forEach(({ config, results }) => {
                results.forEach(h => {
                    const hotelKey = h.hotelName.toLowerCase();
                    if (hotelsInAllConfigs.has(hotelKey)) {
                        if (!finalResultsMap.has(hotelKey)) {
                            finalResultsMap.set(hotelKey, {
                                provider: 'Solvex AI',
                                type: 'hotel',
                                id: h.id,
                                name: h.hotelName,
                                location: h.location,
                                price: 0, // Will sum up later
                                currency: h.currency,
                                stars: h.stars,
                                mealPlan: h.mealPlan,
                                images: h.image ? [h.image] : [],
                                rooms: [], // Legacy, will be empty in multi-room
                                allocationResults: {},
                                originalData: h.originalData
                            });
                        }

                        const existing = finalResultsMap.get(hotelKey)!;
                        config.indices.forEach((roomIdx: number) => {
                            if (!existing.allocationResults![roomIdx]) {
                                existing.allocationResults![roomIdx] = h.rooms || [];
                            } else {
                                // Append additional room/meal plan options for this room index
                                existing.allocationResults![roomIdx].push(...(h.rooms || []));
                            }
                        });

                        // Re-calculate the total starting price for the whole hotel (sum of minimums for each room index)
                        let minTotal = 0;
                        Object.values(existing.allocationResults!).forEach((rooms: any) => {
                            if (rooms && rooms.length > 0) {
                                const minForThisRoom = Math.min(...rooms.map((r: any) => r.price));
                                minTotal += Number(minForThisRoom);
                            }
                        });
                        existing.price = minTotal;
                    }
                });
            });
        }
    } catch (error) {
        console.error('[SmartSearchService] Search failed:', error);
    }

    return Array.from(finalResultsMap.values());
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
