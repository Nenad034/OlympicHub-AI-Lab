/**
 * Multi-Key AI Service
 * Manages multiple Gemini API keys with automatic failover
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { aiRateLimiter } from './aiRateLimiter';
import { aiCache } from './aiCache';
import { aiUsageService } from './aiUsageService';

interface APIKey {
    key: string;
    name: string;
    priority: number;
    enabled: boolean;
    failureCount: number;
    lastFailure: number | null;
}

interface GenerateOptions {
    useCache?: boolean;
    cacheCategory?: 'chat' | 'analysis' | 'prices' | 'default';
    model?: string;
}

class MultiKeyAIService {
    private apiKeys: APIKey[] = [];
    private currentKeyIndex = 0;
    private readonly maxFailures = 3;
    private readonly failureResetTime = 60 * 60 * 1000; // 1 hour

    constructor() {
        this.loadAPIKeys();
    }

    /**
     * Load API keys from environment
     */
    private loadAPIKeys() {
        const keys: APIKey[] = [];

        // Primary key (Frontend AI - Chat, Hotel Prices)
        const primaryKey = import.meta.env.VITE_GEMINI_API_KEY_PRIMARY || import.meta.env.VITE_GEMINI_API_KEY;
        if (primaryKey) {
            keys.push({
                key: primaryKey,
                name: 'Primary (Frontend)',
                priority: 1,
                enabled: true,
                failureCount: 0,
                lastFailure: null
            });
        }

        // Secondary key (Backend AI - Intelligence Service)
        const secondaryKey = import.meta.env.VITE_GEMINI_API_KEY_SECONDARY;
        if (secondaryKey && secondaryKey !== primaryKey) {
            keys.push({
                key: secondaryKey,
                name: 'Secondary (Backend)',
                priority: 2,
                enabled: true,
                failureCount: 0,
                lastFailure: null
            });
        }

        // Development key (optional)
        const devKey = import.meta.env.VITE_GEMINI_API_KEY_DEV;
        if (devKey && devKey !== primaryKey && devKey !== secondaryKey) {
            keys.push({
                key: devKey,
                name: 'Development',
                priority: 3,
                enabled: true,
                failureCount: 0,
                lastFailure: null
            });
        }

        this.apiKeys = keys.sort((a, b) => a.priority - b.priority);
        console.log(`🔑 [MULTI-KEY] Loaded ${this.apiKeys.length} API key(s)`);
    }

    /**
     * Get next available API key
     */
    private getNextKey(): APIKey | null {
        const now = Date.now();

        // Reset failure counts for keys that have been in cooldown
        this.apiKeys.forEach(key => {
            if (key.lastFailure && now - key.lastFailure > this.failureResetTime) {
                key.failureCount = 0;
                key.enabled = true;
                key.lastFailure = null;
                console.log(`🔄 [MULTI-KEY] Reset ${key.name}`);
            }
        });

        // Find first enabled key
        const availableKeys = this.apiKeys.filter(k => k.enabled && k.failureCount < this.maxFailures);

        if (availableKeys.length === 0) {
            console.error('❌ [MULTI-KEY] No available API keys!');
            return null;
        }

        // Round-robin through available keys
        this.currentKeyIndex = (this.currentKeyIndex + 1) % availableKeys.length;
        return availableKeys[this.currentKeyIndex];
    }

    /**
     * Mark key as failed
     */
    private markKeyFailed(keyName: string) {
        const key = this.apiKeys.find(k => k.name === keyName);
        if (key) {
            key.failureCount++;
            key.lastFailure = Date.now();

            if (key.failureCount >= this.maxFailures) {
                key.enabled = false;
                console.error(`🚫 [MULTI-KEY] Disabled ${key.name} after ${this.maxFailures} failures`);
            } else {
                console.warn(`⚠️ [MULTI-KEY] ${key.name} failure ${key.failureCount}/${this.maxFailures}`);
            }
        }
    }

    /**
     * Generate content with automatic failover
     */
    async generateContent(
        prompt: string,
        options: GenerateOptions = {}
    ): Promise<string> {
        const {
            useCache = true,
            cacheCategory = 'default',
            model = 'gemini-1.5-flash'
        } = options;

        // Check cache first
        if (useCache) {
            const cached = aiCache.get(prompt, cacheCategory);
            if (cached) {
                return cached;
            }
        }

        // Try each available key
        let lastError: Error | null = null;
        const maxAttempts = this.apiKeys.length;

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const apiKey = this.getNextKey();
            if (!apiKey) {
                throw new Error('No available API keys');
            }

            try {
                console.log(`🚀 [MULTI-KEY] Attempting with ${apiKey.name}...`);

                // Use rate limiter
                const response = await aiRateLimiter.queueRequest(async () => {
                    const genAI = new GoogleGenerativeAI(apiKey.key);
                    const geminiModel = genAI.getGenerativeModel({ model });
                    const result = await geminiModel.generateContent(prompt);
                    return result.response.text();
                });

                // Success! Track usage
                const tokens = Math.ceil(prompt.length / 4) + Math.ceil(response.length / 4);

                // Track for Gemini (we can expand this if we add more providers)
                aiUsageService.recordUsage('gemini', tokens);

                // Cache the response
                if (useCache) {
                    aiCache.set(prompt, response, tokens, cacheCategory);
                }

                console.log(`✅ [MULTI-KEY] Success with ${apiKey.name} (${tokens} tokens)`);
                return response;

            } catch (error: any) {
                lastError = error;
                console.error(`❌ [MULTI-KEY] Failed with ${apiKey.name}:`, error.message);
                this.markKeyFailed(apiKey.name);

                // If it's a rate limit error, try next key immediately
                if (this.isRateLimitError(error)) {
                    console.log(`⏭️ [MULTI-KEY] Rate limit hit, trying next key...`);
                    continue;
                }

                // For other errors, throw immediately
                throw error;
            }
        }

        // All keys failed
        throw lastError || new Error('All API keys failed');
    }

    /**
     * Check if error is a rate limit error
     */
    private isRateLimitError(error: any): boolean {
        const message = error.message?.toLowerCase() || '';
        return message.includes('rate limit') ||
            message.includes('quota') ||
            message.includes('too many requests') ||
            error.status === 429;
    }

    /**
     * Get status of all keys
     */
    getKeysStatus() {
        return this.apiKeys.map(key => ({
            name: key.name,
            priority: key.priority,
            enabled: key.enabled,
            failureCount: key.failureCount,
            status: key.enabled ? 'Active' : 'Disabled'
        }));
    }

    /**
     * Reset all keys
     */
    resetAllKeys() {
        this.apiKeys.forEach(key => {
            key.failureCount = 0;
            key.enabled = true;
            key.lastFailure = null;
        });
        console.log('🔄 [MULTI-KEY] All keys reset');
    }
}

// Singleton instance
export const multiKeyAI = new MultiKeyAIService();

export default multiKeyAI;
