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
    tools?: any[]; // For function calling
    history?: { role: 'user' | 'ai' | 'player', text: string }[];
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
        } else if (import.meta.env.DEV) {
            // Development fallback key found in test files
            keys.push({
                key: 'AIzaSyB6au4kyI_Y-e4T6NrKdzgmR7Jaz9lPEho',
                name: 'Project Dev Fallback',
                priority: 5,
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
        const hasDirectKeys = keys.length > 0;
        const useProxy = import.meta.env.VITE_USE_EDGE_FUNCTION === 'true' || !hasDirectKeys || import.meta.env.PROD === true;

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
        this.apiKeys.forEach(k => {
            const maskedKey = k.isProxy ? 'N/A' : `${k.key.substring(0, 6)}...`;
            console.log(`   - ${k.name}: Priority ${k.priority} (${maskedKey})`);
        });
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
            const mockResponse = this.getSmartMockResponse(prompt, options.history);
            console.log(`⚡ [MULTI-KEY] DEV MODE: Bypassing real AI call. Returning intelligent mock.`);
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

        // --- MULTI-TAB REQUEST LOCKING ---
        const requestHash = this.getSimpleHash(prompt);
        const lockKey = `ai_pending_${requestHash}`;

        // Check if another tab is already processing this
        const existingLock = localStorage.getItem(lockKey);
        if (existingLock) {
            const lockData = JSON.parse(existingLock);
            const lockAge = Date.now() - lockData.timestamp;

            // If lock is fresh (< 30s), wait and check cache again instead of calling API
            if (lockAge < 30000) {
                console.log(`⏳ [MULTI-KEY] Identical request detected in another tab. Waiting for cache...`);
                await new Promise(resolve => setTimeout(resolve, 2000));
                const cachedAfterWait = aiCache.get(prompt, cacheCategory);
                if (cachedAfterWait) {
                    console.log(`✨ [MULTI-KEY] Result retrieved from other tab's cache! Tokens saved.`);
                    return cachedAfterWait;
                }
                // If still not in cache after wait, we'll proceed but this prevents massive parallel spikes
            }
        }

        // Set our own lock
        localStorage.setItem(lockKey, JSON.stringify({ timestamp: Date.now(), tab: (window as any).name || 'unknown' }));

        try {
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
                                },
                                tools: options.tools
                            });

                            // Start a chat if tools are provided to enable multi-turn function calling
                            if (options.tools) {
                                const chat = geminiModel.startChat();
                                const result = await chat.sendMessage(prompt);
                                return result.response.text();
                            } else {
                                const result = await geminiModel.generateContent(prompt);
                                return result.response.text();
                            }
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
        } finally {
            // ALWAYS remove lock
            localStorage.removeItem(lockKey);
        }

        // All keys failed
        throw lastError || new Error('All API keys failed');
    }

    /**
     * Simple numeric hash for prompt deduplication
     */
    private getSimpleHash(str: string): string {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16);
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
     * Generates a smart mock response based on prompt analysis and optional history
     */
    private getSmartMockResponse(prompt: string, history: { role: string, text: string }[] = []): string {
        const lowerPrompt = prompt.toLowerCase();

        // Combine history for context analysis
        const fullContext = history.map(h => h.text).join(' ').toLowerCase() + ' ' + lowerPrompt;

        // Smart Concierge - Offer request
        if (lowerPrompt.includes('ponuda') || lowerPrompt.includes('hotel') || lowerPrompt.includes('smeštaj') || lowerPrompt.includes('golden') || lowerPrompt.includes('gde')) {

            // Step 1: Check for dates and pax (MOCK logic) in full context (including history)
            const hasDates = fullContext.match(/\d{1,2}\.\d{1,2}/) ||
                fullContext.includes('leto') ||
                fullContext.includes('jun') ||
                fullContext.includes('jul') ||
                fullContext.includes('avgust') ||
                fullContext.includes('maj') ||
                fullContext.includes('septembar');

            const hasPax = fullContext.includes('odrasl') ||
                fullContext.includes('dece') ||
                fullContext.includes('osob') ||
                fullContext.includes('osoba') ||
                fullContext.match(/\d\s*odrasl/) ||
                fullContext.match(/\d\s*dece/);

            // Allow bypassing if it's a follow-up question
            const isFollowUp = history.length > 2 && (lowerPrompt.includes('još') || lowerPrompt.includes('druge') || lowerPrompt.includes('pokaži') || lowerPrompt.includes('ima li'));

            if (!hasDates || !hasPax) {
                if (!isFollowUp) {
                    return `Rado ću vam pronaći najbolje ponude! Da bih bio precizan, recite mi:
1. U kom **terminu** planirate putovanje?
2. Za koliko **odraslih i dece** (uzrast dece) vam je potreban smeštaj?`;
                }
            }

            let destination = "Grčka";
            if (lowerPrompt.includes('krf')) destination = "Krf, Grčka";
            else if (lowerPrompt.includes('rodos')) destination = "Rodos, Grčka";
            else if (lowerPrompt.includes('tasos')) destination = "Tasos, Grčka";
            else if (lowerPrompt.includes('bugarska')) destination = "Sunčev Breg, Bugarska";
            else if (lowerPrompt.includes('golden') || lowerPrompt.includes('sands')) destination = "Zlatni Pjasci, Bugarska";

            return `Naravno! Na osnovu vaših kriterijuma, izdvojio sam top 3 ponude u destinaciji ${destination}:

[CARD: {
  "hotel_name": "Premium Resort & Spa *****",
  "image_url": "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?q=80&w=800",
  "rating": 4.9,
  "price_total": "920 EUR",
  "booking_link": "#",
  "risk_score": "Green"
}]

[CARD: {
  "hotel_name": "Family Haven Blue ****",
  "image_url": "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?q=80&w=800",
  "rating": 4.6,
  "price_total": "680 EUR",
  "booking_link": "#",
  "risk_score": "Green"
}]

[CARD: {
  "hotel_name": "Seaside Budget Inn ***",
  "image_url": "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=800",
  "rating": 4.2,
  "price_total": "450 EUR",
  "booking_link": "#",
  "risk_score": "Yellow"
}]

Ovo su trenutno najpovoljnije opcije. Želite li da pogledate kompletnu listu od preko 50 hotela u našem pretraživaču?

[OPEN_SMART_SEARCH]`;
        }

        // Generic assistance
        if (lowerPrompt.includes('pomoć') || lowerPrompt.includes('kako radi')) {
            return "Ja sam vaš Smart Concierge. Mogu vam pomoći da pronađete najbolji smeštaj, odgovorim na pitanja o destinacijama ili vam pomognem oko rezervacije. Samo me pitajte nešto poput: 'Pronađi mi hotel na Krfu za 4 osobe'.";
        }

        // Default analysis/insight mock
        if (lowerPrompt.includes('hi') || lowerPrompt.includes('zdravo') || lowerPrompt.includes('ćao')) {
            return "Zdravo! Ja sam vaš Smart Concierge. Kako vam mogu pomoći sa planiranjem putovanja danas?";
        }

        return "Na osnovu dostupnih podataka, ova opcija predstavlja odličan izbor za putnike koji traže komfor i dobru lokaciju po pristupačnoj ceni.";
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
