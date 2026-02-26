/**
 * Search Cache Service
 * Stores and retrieves recent search results to improve perceived performance.
 * Part of the "Munjevita Pretraga" (Lightning Search) initiative.
 */

import type { SmartSearchResult, SmartSearchParams } from './smartSearchService';

interface CacheEntry {
    paramsKey: string;
    results: SmartSearchResult[];
    timestamp: number;
}

const CACHE_KEY = 'tct_search_cache_v1';
const MAX_CACHE_AGE = 2 * 60 * 60 * 1000; // 2 hours in ms
const MAX_ENTRIES = 20;

class SearchCacheService {
    private static instance: SearchCacheService;
    private cache: CacheEntry[] = [];

    private constructor() {
        this.loadFromStorage();
    }

    public static getInstance(): SearchCacheService {
        if (!SearchCacheService.instance) {
            SearchCacheService.instance = new SearchCacheService();
        }
        return SearchCacheService.instance;
    }

    private loadFromStorage() {
        try {
            const stored = localStorage.getItem(CACHE_KEY);
            if (stored) {
                this.cache = JSON.parse(stored);
                // Clean up expired entries on load
                const now = Date.now();
                this.cache = this.cache.filter(entry => now - entry.timestamp < MAX_CACHE_AGE);
            }
        } catch (e) {
            console.error('[SearchCache] Failed to load cache', e);
            this.cache = [];
        }
    }

    private saveToStorage() {
        try {
            localStorage.setItem(CACHE_KEY, JSON.stringify(this.cache.slice(0, MAX_ENTRIES)));
        } catch (e) {
            console.error('[SearchCache] Failed to save cache', e);
        }
    }

    /**
     * Generates a unique key for search params to match cache
     */
    private generateParamsKey(params: SmartSearchParams): string {
        const destIds = params.destinations.map(d => d.id).sort().join(',');
        const roomConfig = params.rooms.map(r => `${r.adults}-${r.children}-${r.childrenAges.sort().join('')}`).join('|');
        // We only care about destination, dates, and passengers for primary cache
        return `${params.searchType}:${destIds}:${params.checkIn}:${params.checkOut}:${roomConfig}`;
    }

    /**
     * Retrieves cached results for a given set of params
     */
    public getCachedResults(params: SmartSearchParams): SmartSearchResult[] | null {
        const key = this.generateParamsKey(params);
        const entry = this.cache.find(e => e.paramsKey === key);

        if (entry) {
            const age = Date.now() - entry.timestamp;
            if (age < MAX_CACHE_AGE) {
                console.log(`[SearchCache] Cache HIT (Age: ${Math.round(age / 1000)}s)`);
                return entry.results;
            } else {
                // Remove expired entry
                this.cache = this.cache.filter(e => e.paramsKey !== key);
                this.saveToStorage();
            }
        }

        console.log('[SearchCache] Cache MISS');
        return null;
    }

    /**
     * Saves results to cache
     */
    public setCachedResults(params: SmartSearchParams, results: SmartSearchResult[]) {
        if (results.length === 0) return;

        const key = this.generateParamsKey(params);
        const now = Date.now();

        // Remove existing entry for same key
        this.cache = this.cache.filter(e => e.paramsKey !== key);

        // Add new entry to the beginning
        this.cache.unshift({
            paramsKey: key,
            results: results,
            timestamp: now
        });

        // Limit cache size
        if (this.cache.length > MAX_ENTRIES) {
            this.cache = this.cache.slice(0, MAX_ENTRIES);
        }

        this.saveToStorage();
    }
}

export const searchCacheService = SearchCacheService.getInstance();
