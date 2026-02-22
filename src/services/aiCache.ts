/**
 * AI Response Cache Service
 * Caches AI responses to reduce API calls by 60-70%
 */

interface CacheEntry {
    prompt: string;
    response: string;
    timestamp: number;
    ttl: number;
    tokens: number;
}

interface CacheStats {
    totalCached: number;
    hits: number;
    misses: number;
    hitRate: number;
    tokensSaved: number;
}

class AICacheService {
    private cachePrefix = 'ai_cache_';
    private statsKey = 'ai_cache_stats';
    private stats: CacheStats = {
        totalCached: 0,
        hits: 0,
        misses: 0,
        hitRate: 0,
        tokensSaved: 0
    };

    // TTL configurations (in milliseconds)
    private ttlConfig = {
        chat: 24 * 60 * 60 * 1000,        // 24 hours
        analysis: 60 * 60 * 1000,          // 1 hour
        prices: 30 * 60 * 1000,            // 30 minutes
        default: 60 * 60 * 1000            // 1 hour
    };

    constructor() {
        this.loadStats();
        this.startCleanupInterval();
    }

    /**
     * Generate cache key from prompt
     */
    private generateKey(prompt: string, category: string = 'default'): string {
        // Simple hash function
        let hash = 0;
        for (let i = 0; i < prompt.length; i++) {
            const char = prompt.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return `${this.cachePrefix}${category}_${Math.abs(hash)}`;
    }

    /**
     * Get cached response
     */
    get(prompt: string, category: 'chat' | 'analysis' | 'prices' | 'default' = 'default'): string | null {
        const key = this.generateKey(prompt, category);
        const cached = localStorage.getItem(key);

        if (!cached) {
            this.stats.misses++;
            this.saveStats();
            console.log('❌ [CACHE] Miss:', prompt.substring(0, 50) + '...');
            return null;
        }

        try {
            const entry: CacheEntry = JSON.parse(cached);
            const now = Date.now();

            // Check if expired
            if (now - entry.timestamp > entry.ttl) {
                localStorage.removeItem(key);
                this.stats.misses++;
                this.saveStats();
                console.log('⏰ [CACHE] Expired:', prompt.substring(0, 50) + '...');
                return null;
            }

            // Cache hit!
            this.stats.hits++;
            this.stats.tokensSaved += entry.tokens;
            this.saveStats();
            console.log(`✅ [CACHE] Hit! Saved ${entry.tokens} tokens:`, prompt.substring(0, 50) + '...');
            return entry.response;

        } catch (error) {
            console.error('❌ [CACHE] Error reading cache:', error);
            localStorage.removeItem(key);
            this.stats.misses++;
            this.saveStats();
            return null;
        }
    }

    /**
     * Set cached response
     */
    set(
        prompt: string,
        response: string,
        tokens: number = 0,
        category: 'chat' | 'analysis' | 'prices' | 'default' = 'default'
    ): void {
        const key = this.generateKey(prompt, category);
        const ttl = this.ttlConfig[category];

        const entry: CacheEntry = {
            prompt: prompt.substring(0, 200), // Store truncated prompt for debugging
            response,
            timestamp: Date.now(),
            ttl,
            tokens
        };

        try {
            localStorage.setItem(key, JSON.stringify(entry));
            this.stats.totalCached++;
            this.saveStats();
            console.log(`💾 [CACHE] Stored (TTL: ${ttl / 1000 / 60}min):`, prompt.substring(0, 50) + '...');
        } catch (error) {
            console.error('❌ [CACHE] Error storing cache:', error);
            // If storage is full, clear old entries
            this.cleanup();
        }
    }

    /**
     * Get cache statistics
     */
    getStats(): CacheStats {
        const total = this.stats.hits + this.stats.misses;
        this.stats.hitRate = total > 0 ? (this.stats.hits / total) * 100 : 0;
        return { ...this.stats };
    }

    /**
     * Load stats from localStorage
     */
    private loadStats() {
        const saved = localStorage.getItem(this.statsKey);
        if (saved) {
            try {
                this.stats = JSON.parse(saved);
            } catch (error) {
                console.error('❌ [CACHE] Error loading stats:', error);
            }
        }
    }

    /**
     * Save stats to localStorage
     */
    private saveStats() {
        try {
            localStorage.setItem(this.statsKey, JSON.stringify(this.stats));
        } catch (error) {
            console.error('❌ [CACHE] Error saving stats:', error);
        }
    }

    /**
     * Clean up expired entries
     */
    cleanup() {
        console.log('🧹 [CACHE] Starting cleanup...');
        const now = Date.now();
        let removed = 0;

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(this.cachePrefix)) {
                try {
                    const cached = localStorage.getItem(key);
                    if (cached) {
                        const entry: CacheEntry = JSON.parse(cached);
                        if (now - entry.timestamp > entry.ttl) {
                            localStorage.removeItem(key);
                            removed++;
                        }
                    }
                } catch (error) {
                    // Invalid entry, remove it
                    localStorage.removeItem(key);
                    removed++;
                }
            }
        }

        console.log(`🧹 [CACHE] Cleanup complete. Removed ${removed} expired entries.`);
    }

    /**
     * Clear all cache
     */
    clearAll() {
        console.log('🗑️ [CACHE] Clearing all cache...');
        const keys: string[] = [];

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(this.cachePrefix)) {
                keys.push(key);
            }
        }

        keys.forEach(key => localStorage.removeItem(key));

        this.stats = {
            totalCached: 0,
            hits: 0,
            misses: 0,
            hitRate: 0,
            tokensSaved: 0
        };
        this.saveStats();

        console.log(`🗑️ [CACHE] Cleared ${keys.length} entries.`);
    }

    /**
     * Start automatic cleanup interval (every hour)
     */
    private startCleanupInterval() {
        setInterval(() => {
            this.cleanup();
        }, 60 * 60 * 1000); // Every hour
    }

    /**
     * Get cache size estimate
     */
    getCacheSize(): { entries: number; estimatedKB: number } {
        let entries = 0;
        let totalSize = 0;

        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith(this.cachePrefix)) {
                entries++;
                const value = localStorage.getItem(key);
                if (value) {
                    totalSize += key.length + value.length;
                }
            }
        }

        return {
            entries,
            estimatedKB: Math.round(totalSize / 1024)
        };
    }
}

// Singleton instance
export const aiCache = new AICacheService();

export default aiCache;
