/**
 * ORS API Dictionary Service
 * 
 * Handles fetching and caching of static data (regions, cities, hotels, etc.)
 * Similar to Solvex dictionary service but with REST API
 */

import { orsAuthService } from './orsAuthService';
import { ORS_ENDPOINTS } from './orsConstants';
import type {
    OrsTranslations,
    OrsRegion,
    OrsLocationData,
    OrsTourOperator,
} from '../../types/ors.types';

export class OrsDictionaryService {
    private cache: Map<string, { data: any; timestamp: number }> = new Map();
    private readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

    /**
     * Get cached data or fetch from API
     */
    private async getCached<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
        const cached = this.cache.get(key);

        if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
            return cached.data as T;
        }

        const data = await fetcher();
        this.cache.set(key, { data, timestamp: Date.now() });
        return data;
    }

    /**
     * Clear cache
     */
    clearCache(): void {
        this.cache.clear();
    }

    /**
     * Get supported languages
     */
    async getLanguages(): Promise<Record<string, string>> {
        return this.getCached('languages', () =>
            orsAuthService.get<Record<string, string>>(ORS_ENDPOINTS.LANGUAGES)
        );
    }

    /**
     * Get room types
     */
    async getRoomTypes(): Promise<Record<string, OrsTranslations>> {
        return this.getCached('roomcodes', () =>
            orsAuthService.get<Record<string, OrsTranslations>>(ORS_ENDPOINTS.ROOM_CODES)
        );
    }

    /**
     * Get room subtypes (classifications)
     */
    async getRoomSubtypes(): Promise<Record<string, OrsTranslations>> {
        return this.getCached('roomsubtypes', () =>
            orsAuthService.get<Record<string, OrsTranslations>>(ORS_ENDPOINTS.ROOM_SUBTYPES)
        );
    }

    /**
     * Get room locations (views)
     */
    async getRoomLocations(): Promise<Record<string, OrsTranslations>> {
        return this.getCached('roomlocations', () =>
            orsAuthService.get<Record<string, OrsTranslations>>(ORS_ENDPOINTS.ROOM_LOCATIONS)
        );
    }

    /**
     * Get room facilities
     */
    async getRoomFacilities(): Promise<Record<string, OrsTranslations>> {
        return this.getCached('roomfacilities', () =>
            orsAuthService.get<Record<string, OrsTranslations>>(ORS_ENDPOINTS.ROOM_FACILITIES)
        );
    }

    /**
     * Get product attributes (facts)
     */
    async getFacts(): Promise<Record<string, OrsTranslations>> {
        return this.getCached('facts', () =>
            orsAuthService.get<Record<string, OrsTranslations>>(ORS_ENDPOINTS.FACTS)
        );
    }

    /**
     * Get service types (meal plans)
     */
    async getServiceCodes(): Promise<Record<string, OrsTranslations>> {
        return this.getCached('servicecodes', () =>
            orsAuthService.get<Record<string, OrsTranslations>>(ORS_ENDPOINTS.SERVICE_CODES)
        );
    }

    /**
     * Get tour operators
     */
    async getTourOperators(): Promise<Record<string, OrsTourOperator>> {
        return this.getCached('touroperators', () =>
            orsAuthService.get<Record<string, OrsTourOperator>>(ORS_ENDPOINTS.TOUR_OPERATORS)
        );
    }

    /**
     * Get region groups
     */
    async getRegionGroups(): Promise<Record<string, OrsTranslations>> {
        return this.getCached('regiongroups', () =>
            orsAuthService.get<Record<string, OrsTranslations>>(ORS_ENDPOINTS.REGION_GROUPS)
        );
    }

    /**
     * Get regions
     */
    async getRegions(): Promise<Record<string, OrsRegion>> {
        return this.getCached('regions', () =>
            orsAuthService.get<Record<string, OrsRegion>>(ORS_ENDPOINTS.REGIONS)
        );
    }

    /**
     * Get locations (paginated)
     */
    async getLocations(page: number = 1): Promise<{
        Page: number;
        Count: number;
        Results: Record<string, OrsLocationData>;
    }> {
        const cacheKey = `locations_${page}`;
        return this.getCached(cacheKey, () =>
            orsAuthService.get<{
                Page: number;
                Count: number;
                Results: Record<string, OrsLocationData>;
            }>(`${ORS_ENDPOINTS.LOCATIONS}/${page}`)
        );
    }

    /**
     * Get all locations (fetches all pages)
     */
    async getAllLocations(): Promise<Record<string, OrsLocationData>> {
        const cacheKey = 'all_locations';

        return this.getCached(cacheKey, async () => {
            const allLocations: Record<string, OrsLocationData> = {};
            let page = 1;
            let hasMore = true;

            while (hasMore) {
                const response = await this.getLocations(page);
                Object.assign(allLocations, response.Results);

                // Check if there are more pages
                hasMore = Object.keys(response.Results).length > 0;
                page++;

                // Safety limit
                if (page > 100) break;
            }

            return allLocations;
        });
    }

    /**
     * Get airports
     */
    async getAirports(): Promise<Record<string, any>> {
        return this.getCached('airports', () =>
            orsAuthService.get<Record<string, any>>(ORS_ENDPOINTS.AIRPORTS)
        );
    }

    /**
     * Get subtypes
     */
    async getSubtypes(): Promise<Record<string, string[]>> {
        return this.getCached('subtypes', () =>
            orsAuthService.get<Record<string, string[]>>(ORS_ENDPOINTS.SUBTYPES)
        );
    }

    /**
     * Search for location by name
     */
    async searchLocation(query: string, language: string = 'en'): Promise<OrsLocationData[]> {
        const locations = await this.getAllLocations();
        const lowerQuery = query.toLowerCase();

        return Object.entries(locations)
            .filter(([_, location]) => {
                const name = location.Translations[language as keyof OrsTranslations]?.toLowerCase() || '';
                return name.includes(lowerQuery);
            })
            .map(([id, location]) => ({
                ...location,
                id: parseInt(id),
            }))
            .slice(0, 20); // Limit results
    }

    /**
     * Search for region by name
     */
    async searchRegion(query: string, language: string = 'en'): Promise<Array<OrsRegion & { id: string }>> {
        const regions = await this.getRegions();
        const lowerQuery = query.toLowerCase();

        return Object.entries(regions)
            .filter(([_, region]) => {
                const name = region.Translations[language as keyof OrsTranslations]?.toLowerCase() || '';
                return name.includes(lowerQuery);
            })
            .map(([id, region]) => ({
                ...region,
                id,
            }))
            .slice(0, 20); // Limit results
    }

    /**
     * Get human-readable service name
     */
    async getServiceName(code: string, language: string = 'en'): Promise<string> {
        const serviceCodes = await this.getServiceCodes();
        return serviceCodes[code]?.[language as keyof OrsTranslations] || code;
    }

    /**
     * Get human-readable room type name
     */
    async getRoomTypeName(code: string, language: string = 'en'): Promise<string> {
        const roomTypes = await this.getRoomTypes();
        return roomTypes[code]?.[language as keyof OrsTranslations] || code;
    }
}

// Singleton instance
export const orsDictionaryService = new OrsDictionaryService();
