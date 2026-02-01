/**
 * Rate Limiter Utility
 * Prevents "bursting" and systematic information extraction
 * Complies with API provider terms (e.g., OpenGreece, Solvex, TCT)
 */

interface RateLimitConfig {
    maxRequests: number;      // Max requests allowed
    windowMs: number;         // Time window in milliseconds
    identifier: string;       // Unique identifier (e.g., 'solvex', 'opengreece')
}

interface RequestRecord {
    timestamp: number;
    count: number;
}

class RateLimiter {
    private requestLog: Map<string, RequestRecord[]> = new Map();
    private configs: Map<string, RateLimitConfig> = new Map();

    /**
     * Register a rate limit configuration for an API
     */
    registerLimit(config: RateLimitConfig): void {
        this.configs.set(config.identifier, config);
        console.log(`[RateLimiter] Registered limit for ${config.identifier}: ${config.maxRequests} req/${config.windowMs}ms`);
    }

    /**
     * Check if request is allowed under rate limit
     * @returns { allowed: boolean, retryAfter?: number }
     */
    checkLimit(identifier: string): { allowed: boolean; retryAfter?: number; currentCount?: number } {
        const config = this.configs.get(identifier);

        if (!config) {
            console.warn(`[RateLimiter] No config found for ${identifier}, allowing request`);
            return { allowed: true };
        }

        const now = Date.now();
        const windowStart = now - config.windowMs;

        // Get or initialize request log for this identifier
        let log = this.requestLog.get(identifier) || [];

        // Remove expired entries (outside current window)
        log = log.filter(record => record.timestamp > windowStart);

        // Count requests in current window
        const requestCount = log.reduce((sum, record) => sum + record.count, 0);

        if (requestCount >= config.maxRequests) {
            // Calculate retry-after (time until oldest request expires)
            const oldestTimestamp = log[0]?.timestamp || now;
            const retryAfter = Math.ceil((oldestTimestamp + config.windowMs - now) / 1000); // in seconds

            console.warn(`[RateLimiter] ${identifier} rate limit exceeded: ${requestCount}/${config.maxRequests} in ${config.windowMs}ms. Retry after ${retryAfter}s`);

            return {
                allowed: false,
                retryAfter,
                currentCount: requestCount
            };
        }

        // Log this request
        log.push({ timestamp: now, count: 1 });
        this.requestLog.set(identifier, log);

        return {
            allowed: true,
            currentCount: requestCount + 1
        };
    }

    /**
     * Manually reset rate limit for an identifier (for testing or admin override)
     */
    reset(identifier: string): void {
        this.requestLog.delete(identifier);
        console.log(`[RateLimiter] Reset limit for ${identifier}`);
    }

    /**
     * Get current usage stats
     */
    getStats(identifier: string): { current: number; max: number; windowMs: number } | null {
        const config = this.configs.get(identifier);
        if (!config) return null;

        const now = Date.now();
        const windowStart = now - config.windowMs;
        const log = this.requestLog.get(identifier) || [];
        const validLog = log.filter(record => record.timestamp > windowStart);
        const current = validLog.reduce((sum, record) => sum + record.count, 0);

        return {
            current,
            max: config.maxRequests,
            windowMs: config.windowMs
        };
    }
}

// Singleton instance
export const rateLimiter = new RateLimiter();

// Default configurations (conservative, can be adjusted based on provider SLA)
rateLimiter.registerLimit({
    identifier: 'solvex',
    maxRequests: 20,        // 20 requests per minute
    windowMs: 60 * 1000     // 1 minute
});

rateLimiter.registerLimit({
    identifier: 'opengreece',
    maxRequests: 20,        // 20 requests per minute
    windowMs: 60 * 1000
});

rateLimiter.registerLimit({
    identifier: 'tct',
    maxRequests: 30,        // 30 requests per minute
    windowMs: 60 * 1000
});

rateLimiter.registerLimit({
    identifier: 'gemini-api',
    maxRequests: 60,        // 60 requests per minute (Gemini free tier)
    windowMs: 60 * 1000
});

export default rateLimiter;
