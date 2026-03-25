/**
 * AI Caching Service
 * Centralized caching for AI responses to save tokens
 */

import { apiCache } from '../utils/apiCache';

class AiCacheService {
    private readonly defaultTtl = 30 * 60 * 1000; // 30 minutes for AI results

    get(prompt: string, category: string = 'default'): string | null {
        const key = this.generateKey(prompt, category);
        return apiCache.get<string>(key);
    }

    set(prompt: string, response: string, tokens: number, category: string = 'default', ttlMs?: number): void {
        const key = this.generateKey(prompt, category);
        apiCache.set(key, response, ttlMs || this.defaultTtl);
        console.log(`💾 [AI CACHE] Saved query to category: ${category} (${tokens} tokens saved for future)`);
    }

    private generateKey(prompt: string, category: string): string {
        // Create a simple identity string for identical prompts in same category
        return `ai:${category}:${prompt.substring(0, 100).replace(/\s+/g, '_')}_${prompt.length}`;
    }

    clear(): void {
        apiCache.clear();
    }
}

export const aiCache = new AiCacheService();
export default aiCache;
