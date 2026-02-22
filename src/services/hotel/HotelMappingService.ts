/**
 * Hotel Mapping & Deduplication Service
 * 
 * This service is responsible for:
 * 1. Identifying duplicate hotels across different providers (Solvex, ORS, TCT, etc.)
 * 2. Merging results into a single "Master" hotel with multiple price options.
 * 3. Utilizing GIATA ID or name-address similarity for mapping.
 */

import type { SmartSearchResult } from '../smartSearchService';

export interface MappedHotel {
    masterId: string;
    giataId?: string;
    name: string;
    offers: SmartSearchResult[];
    bestPrice: number;
    bestProvider: string;
}

class HotelMappingService {
    /**
     * Deduplicates search results from multiple sources
     */
    async deduplicateResults(results: SmartSearchResult[]): Promise<SmartSearchResult[]> {
        const mappedResults: Map<string, SmartSearchResult> = new Map();

        for (const res of results) {
            // Priority 1: GIATA ID mapping
            const mapKey = res.giataId || this.generateFallbackKey(res);

            if (mappedResults.has(mapKey)) {
                const existing = mappedResults.get(mapKey)!;
                this.mergeResults(existing, res);
            } else {
                // Initialize with mapping trackers
                const newRes = {
                    ...res,
                    providers: [
                        {
                            name: res.provider,
                            id: res.id,
                            price: res.price
                        }
                    ]
                };
                mappedResults.set(mapKey, newRes);
            }
        }

        return Array.from(mappedResults.values());
    }

    private generateFallbackKey(res: SmartSearchResult): string {
        // Fallback: Name + Simplified Location (Normalized)
        const normalizedName = res.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        const normalizedLocation = res.location.toLowerCase().replace(/[^a-z0-9]/g, '');
        return `fb-${normalizedName}-${normalizedLocation}`;
    }

    private mergeResults(target: SmartSearchResult, source: SmartSearchResult): void {
        // Keep the lowest price
        if (source.price < target.price) {
            target.price = source.price;
            target.provider = `Aggregated (${source.provider} is cheapest)`;
        }

        // Add to providers list for price comparison
        if (!target.providers) target.providers = [];
        target.providers.push({
            name: source.provider,
            id: source.id,
            price: source.price
        });

        // Enrich images or descriptions if target is missing them
        if ((!target.images || target.images.length === 0) && source.images) {
            target.images = source.images;
        }
    }
}

export const hotelMappingService = new HotelMappingService();
