/**
 * Antigravity API Caching Utility
 * 
 * =============================================================================
 * LEGAL NOTICE: Antigravity Security Protocol - Caching Component
 * =============================================================================
 * 
 * PURPOSE:
 * - Reduce API bursting by reusing recent search results.
 * - Improve application performance and user experience.
 * - Protect partner APIs from redundant requests.
 * 
 * TTL (Time To Live): Default 5 minutes (as per strategy).
 */

interface CacheItem<T> {
    data: T;
    expiry: number;
}

export class ApiCache {
    private cache: Map<string, CacheItem<any>> = new Map();
    private defaultTtl: number;

    constructor(defaultTtlMinutes: number = 5) {
        this.defaultTtl = defaultTtlMinutes * 60 * 1000;
    }

    /**
     * Generate a unique key for the search parameters
     */
    generateKey(provider: string, params: any): string {
        return `${provider}:${JSON.stringify(params)}`;
    }

    /**
     * Get data from cache if it hasn't expired
     */
    get<T>(key: string): T | null {
        const item = this.cache.get(key);
        if (!item) return null;

        if (Date.now() > item.expiry) {
            this.cache.delete(key);
            return null;
        }

        return item.data as T;
    }

    /**
     * Set data in cache with a specific TTL
     */
    set<T>(key: string, data: T, ttlMs?: number): void {
        const expiry = Date.now() + (ttlMs || this.defaultTtl);
        this.cache.set(key, { data, expiry });
    }

    /**
     * Clear expired items from memory
     */
    cleanup(): void {
        const now = Date.now();
        for (const [key, item] of this.cache.entries()) {
            if (now > item.expiry) {
                this.cache.delete(key);
            }
        }
    }

    /**
     * Clear all cache
     */
    clear(): void {
        this.cache.clear();
    }
}

// Singleton instance for global app use
export const apiCache = new ApiCache(5);

export default apiCache;
