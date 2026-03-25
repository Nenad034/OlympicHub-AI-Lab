/**
 * AI Rate Limiter Service
 * Proxies requests to the central utility for consistent state
 */

import { rateLimiter } from '../utils/rateLimiter';

class AiRateLimiterService {
    private readonly identifier = 'gemini-api';

    async queueRequest<T>(request: () => Promise<T>): Promise<T> {
        const check = rateLimiter.checkLimit(this.identifier);
        
        if (!check.allowed) {
            console.warn(`⏳ [AI RATE LIMIT] Pausing for ${check.retryAfter}s...`);
            await new Promise(resolve => setTimeout(resolve, (check.retryAfter || 1) * 1000));
        }
        
        return await request();
    }

    getStats() {
        return rateLimiter.getStats(this.identifier);
    }
}

export const aiRateLimiter = new AiRateLimiterService();
export default aiRateLimiter;
