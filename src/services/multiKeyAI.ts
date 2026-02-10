/**
 * Multi-Key AI Service
 * Manages multiple Gemini API keys with automatic failover and Supabase proxy fallback
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { aiRateLimiter } from './aiRateLimiter';
import { aiCache } from './aiCache';
import { aiUsageService } from './aiUsageService';
import { supabase } from '../supabaseClient';
import { ActivityLogger } from './activityLogger';
import { useAuthStore } from '../stores/authStore';

interface APIKey {
    key: string;
    name: string;
    priority: number;
    enabled: boolean;
    failureCount: number;
    lastFailure: number | null;
    isProxy?: boolean;
}

interface GenerateOptions {
    useCache?: boolean;
    cacheCategory?: 'chat' | 'analysis' | 'prices' | 'default';
    model?: string;
    temperature?: number;
    maxOutputTokens?: number;
}

class MultiKeyAIService {
    private apiKeys: APIKey[] = [];
    private currentKeyIndex = 0;
    private readonly maxFailures = 3;
    private readonly failureResetTime = 60 * 60 * 1000; // 1 hour

    constructor() {
        this.loadAPIKeys();
        console.log(`🔑 [MULTI-KEY] Service initialized with ${this.apiKeys.length} API keys.`);
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

        // Vercel / Supabase Fallback (Edge Function)
        // If no keys found or explicitly requested, add Proxy as a low-priority fallback
        const useProxy = import.meta.env.VITE_USE_EDGE_FUNCTION === 'true' || keys.length === 0 || import.meta.env.PROD;
        if (useProxy) {
            keys.push({
                key: 'PROXY',
                name: 'Supabase Proxy (Fallback)',
                priority: 10,
                enabled: true,
                failureCount: 0,
                lastFailure: null,
                isProxy: true
            });
        }

        this.apiKeys = keys.sort((a, b) => a.priority - b.priority);
        console.log(`🔑 [MULTI-KEY] Loaded ${this.apiKeys.length} API key(s) (Proxy: ${useProxy})`);
        this.apiKeys.forEach(k => console.log(`   - ${k.name}: Priority ${k.priority}${import.meta.env.DEV && !k.isProxy ? ` (${k.key.substring(0, 6)}...)` : ''}`));
    }

    /**
     * Get next available API key
     */
    private getNextKey(): APIKey | null {
        const now = Date.now();
        const authState = useAuthStore.getState();

        // Check if user has their own Gemini key
        if (authState.aiKeys?.gemini) {
            console.log(`👤 [MULTI-KEY] Using User's Personal Gemini Key`);
            return {
                key: authState.aiKeys.gemini,
                name: `Personal (${authState.userName})`,
                priority: -1, // Highest priority
                enabled: true,
                failureCount: 0,
                lastFailure: null
            };
        }

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
            console.error('❌ [MULTI-KEY] No available API keys! Total keys in registry:', this.apiKeys.length);
            this.apiKeys.forEach(k => console.log(`- ${k.name}: enabled=${k.enabled}, failures=${k.failureCount}`));
            return null;
        }

        // Round-robin through available keys
        this.currentKeyIndex = (this.currentKeyIndex + 1) % availableKeys.length;
        const selected = availableKeys[this.currentKeyIndex];
        console.log(`🎯 [MULTI-KEY] Selected: ${selected.name} (Priority: ${selected.priority})`);
        return selected;
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

        // --- DEVELOPMENT BYPASS ---
        if (import.meta.env.VITE_AI_DEV_MODE === 'true') {
            const mockResponse = "[AI Simulation] Ova ponuda je visoko ocenjena zbog odlične lokacije i pristupačne cene.";
            console.log(`⚡ [MULTI-KEY] DEV MODE: Bypassing real AI call. Returning mock.`);
            return mockResponse;
        }

        // Check cache first
        if (useCache) {
            const cached = aiCache.get(prompt, cacheCategory);
            if (cached) {
                return cached;
            }
        }

        // Try each available key
        let lastError: Error | null = null;
        const maxAttempts = Math.max(this.apiKeys.length, 1);

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const apiKey = this.getNextKey();
            if (!apiKey) {
                throw new Error('No available API keys or proxy');
            }

            try {
                const startTime = Date.now(); // Track API call duration

                // Use rate limiter
                const response = await aiRateLimiter.queueRequest(async () => {
                    if (apiKey.isProxy) {
                        console.log(`📡 [MULTI-KEY] Routing through Supabase Proxy...`);
                        const { data, error } = await supabase.functions.invoke('gemini-proxy', {
                            body: {
                                prompt,
                                model: model,
                                temperature: options.temperature,
                                maxTokens: options.maxOutputTokens
                            }
                        });

                        if (error) throw new Error(`Proxy Error: ${error.message}`);
                        if (!data?.response) throw new Error('No response from proxy');
                        return data.response;
                    } else {
                        const genAI = new GoogleGenerativeAI(apiKey.key);
                        const geminiModel = genAI.getGenerativeModel({
                            model,
                            generationConfig: {
                                temperature: options.temperature,
                                maxOutputTokens: options.maxOutputTokens
                            }
                        });
                        const result = await geminiModel.generateContent(prompt);
                        return result.response.text();
                    }
                });

                // Success! Track usage
                const tokens = Math.ceil(prompt.length / 4) + Math.ceil(response.length / 4);
                const endTime = Date.now();
                const durationMs = endTime - startTime;

                // Track for Gemini
                aiUsageService.recordUsage('gemini', tokens);

                // Track API call activity
                ActivityLogger.logAPICall(
                    'Gemini',
                    model || 'gemini-2.0-flash',
                    durationMs,
                    true
                );

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

                // Track failed API call
                ActivityLogger.logAPICall(
                    'Gemini',
                    model || 'gemini-2.0-flash',
                    0,
                    false,
                    error.message
                );

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
     * Update or add a custom API key at runtime (e.g. from Settings UI)
     */
    updateKey(key: string, name: string = 'Custom (Settings)', priority: number = 0) {
        if (!key) return;

        const existingIndex = this.apiKeys.findIndex(k => k.name === name);
        const newKey: APIKey = {
            key,
            name,
            priority,
            enabled: true,
            failureCount: 0,
            lastFailure: null
        };

        if (existingIndex >= 0) {
            this.apiKeys[existingIndex] = newKey;
        } else {
            this.apiKeys.push(newKey);
            this.apiKeys.sort((a, b) => a.priority - b.priority);
        }

        console.log(`🔑 [MULTI-KEY] Key updated/added: ${name}`);
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
