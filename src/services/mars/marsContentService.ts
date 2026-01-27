/**
 * Mars API V1 - Content Service
 * 
 * Handles fetching accommodation data (index and details)
 */

import { marsAuthService } from './marsAuthService';
import { MARS_ENDPOINTS, MARS_CACHE_CONFIG, MARS_DEFAULTS } from './marsConstants';
import type {
    MarsIndexResponse,
    MarsDetailsResponse,
    MarsAccommodation,
    MarsAccommodationIndex,
    MarsIndexRequest,
    MarsDetailsRequest,
} from '../../types/mars.types';

// Simple in-memory cache
interface CacheEntry<T> {
    data: T;
    timestamp: number;
}

export class MarsContentService {
    private cache: Map<string, CacheEntry<any>> = new Map();

    /**
     * Get list of all accommodations (index)
     */
    async getIndex(options?: MarsIndexRequest): Promise<MarsAccommodationIndex[]> {
        const cacheKey = MARS_CACHE_CONFIG.INDEX_KEY;

        // Check cache
        const cached = this.getFromCache<MarsAccommodationIndex[]>(
            cacheKey,
            MARS_CACHE_CONFIG.INDEX_TTL
        );
        if (cached) {
            console.log('[Mars Content] Returning cached index');
            return cached;
        }

        console.log('[Mars Content] Fetching index from API...');

        const params = {
            responseType: options?.responseType || MARS_DEFAULTS.RESPONSE_TYPE,
        };

        const response = await marsAuthService.get<MarsIndexResponse>(
            MARS_ENDPOINTS.INDEX,
            params
        );

        if (!response.status) {
            throw new Error('Mars API returned error status');
        }

        const accommodations = response.data;

        // Cache the result
        this.setCache(cacheKey, accommodations);

        console.log(`[Mars Content] Fetched ${accommodations.length} accommodations`);

        return accommodations;
    }

    /**
     * Get accommodation details by ID
     */
    async getDetails(
        accommodationId: number,
        options?: Omit<MarsDetailsRequest, 'id'>
    ): Promise<MarsAccommodation> {
        const cacheKey = `${MARS_CACHE_CONFIG.DETAILS_KEY_PREFIX}${accommodationId}`;

        // Check cache
        const cached = this.getFromCache<MarsAccommodation>(
            cacheKey,
            MARS_CACHE_CONFIG.DETAILS_TTL
        );
        if (cached) {
            console.log(`[Mars Content] Returning cached details for accommodation ${accommodationId}`);
            return cached;
        }

        console.log(`[Mars Content] Fetching details for accommodation ${accommodationId}...`);

        const params = {
            id: accommodationId,
            responseType: options?.responseType || MARS_DEFAULTS.RESPONSE_TYPE,
        };

        const response = await marsAuthService.get<MarsDetailsResponse>(
            MARS_ENDPOINTS.DETAILS,
            params
        );

        if (!response.status) {
            throw new Error('Mars API returned error status');
        }

        if (!response.data || response.data.length === 0) {
            throw new Error(`Accommodation ${accommodationId} not found`);
        }

        const accommodation = response.data[0];

        // Cache the result
        this.setCache(cacheKey, accommodation);

        console.log(`[Mars Content] Fetched details for: ${accommodation.name}`);

        return accommodation;
    }

    /**
     * Get multiple accommodation details
     */
    async getMultipleDetails(accommodationIds: number[]): Promise<MarsAccommodation[]> {
        console.log(`[Mars Content] Fetching details for ${accommodationIds.length} accommodations...`);

        const promises = accommodationIds.map((id) => this.getDetails(id));
        const results = await Promise.allSettled(promises);

        const accommodations = results
            .filter((result): result is PromiseFulfilledResult<MarsAccommodation> =>
                result.status === 'fulfilled'
            )
            .map((result) => result.value);

        const failed = results.filter((result) => result.status === 'rejected').length;
        if (failed > 0) {
            console.warn(`[Mars Content] Failed to fetch ${failed} accommodations`);
        }

        return accommodations;
    }

    /**
     * Get all accommodations with full details
     */
    async getAllAccommodations(): Promise<MarsAccommodation[]> {
        console.log('[Mars Content] Fetching all accommodations with details...');

        // First, get the index
        const index = await this.getIndex();

        // Then, fetch details for each
        const ids = index.map((item) => item.object.id);
        const accommodations = await this.getMultipleDetails(ids);

        console.log(`[Mars Content] Fetched ${accommodations.length} accommodations with details`);

        return accommodations;
    }

    /**
     * Search accommodations by city/place
     */
    async searchByPlace(placeName: string): Promise<MarsAccommodation[]> {
        console.log(`[Mars Content] Searching accommodations in: ${placeName}`);

        // Get all accommodations (will use cache if available)
        const allAccommodations = await this.getAllAccommodations();

        // Filter by place name (case-insensitive)
        const searchTerm = placeName.toLowerCase();
        const results = allAccommodations.filter((acc) =>
            acc.location.place.toLowerCase().includes(searchTerm)
        );

        console.log(`[Mars Content] Found ${results.length} accommodations in ${placeName}`);

        return results;
    }

    /**
     * Search accommodations by name
     */
    async searchByName(name: string): Promise<MarsAccommodation[]> {
        console.log(`[Mars Content] Searching accommodations by name: ${name}`);

        const allAccommodations = await this.getAllAccommodations();

        const searchTerm = name.toLowerCase();
        const results = allAccommodations.filter((acc) =>
            acc.name.toLowerCase().includes(searchTerm)
        );

        console.log(`[Mars Content] Found ${results.length} accommodations matching "${name}"`);

        return results;
    }

    /**
     * Get accommodations updated since a specific date
     */
    async getUpdatedSince(date: Date): Promise<MarsAccommodationIndex[]> {
        console.log(`[Mars Content] Fetching accommodations updated since: ${date.toISOString()}`);

        const index = await this.getIndex();

        const results = index.filter((item) => {
            const lastModified = new Date(item.object.last_modified);
            return lastModified >= date;
        });

        console.log(`[Mars Content] Found ${results.length} updated accommodations`);

        return results;
    }

    /**
     * Clear all cache
     */
    clearCache(): void {
        this.cache.clear();
        console.log('[Mars Content] Cache cleared');
    }

    /**
     * Clear cache for specific accommodation
     */
    clearAccommodationCache(accommodationId: number): void {
        const cacheKey = `${MARS_CACHE_CONFIG.DETAILS_KEY_PREFIX}${accommodationId}`;
        this.cache.delete(cacheKey);
        console.log(`[Mars Content] Cache cleared for accommodation ${accommodationId}`);
    }

    /**
     * Get data from cache if not expired
     */
    private getFromCache<T>(key: string, ttl: number): T | null {
        const entry = this.cache.get(key);
        if (!entry) return null;

        const now = Date.now();
        if (now - entry.timestamp > ttl) {
            this.cache.delete(key);
            return null;
        }

        return entry.data as T;
    }

    /**
     * Set data in cache
     */
    private setCache<T>(key: string, data: T): void {
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
        });
    }

    /**
     * Get cache statistics
     */
    getCacheStats(): {
        size: number;
        keys: string[];
    } {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys()),
        };
    }
}

// Singleton instance
export const marsContentService = new MarsContentService();
