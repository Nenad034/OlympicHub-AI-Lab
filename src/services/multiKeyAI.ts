/**
 * Multi-Key AI Service
 * Manages multiple Gemini API keys with automatic failover and Supabase proxy fallback
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { aiRateLimiter } from './aiRateLimiter';
import { aiCache } from './aiCache';
import { aiUsageService } from './aiUsageService';
import type { HotelSearchResult, AvailabilityStatus } from '../pages/PrimeSmartSearch/types';
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
    provider: 'gemini' | 'openrouter';
}

interface GenerateOptions {
    useCache?: boolean;
    cacheCategory?: 'chat' | 'analysis' | 'prices' | 'milica' | 'default';
    model?: string;
    temperature?: number;
    maxOutputTokens?: number;
    tools?: any[]; // For function calling
    history?: { role: 'user' | 'ai' | 'player' | 'model', text: string }[];
    attachment?: { name: string; type: string; base64: string; mimeType: string; preview?: string };
    systemPrompt?: string;
}

class MultiKeyAIService {
    private apiKeys: APIKey[] = [];
    private currentKeyIndex = 0;
    private readonly maxFailures = 3;
    private readonly failureResetTime = 60 * 60 * 1000; // 1 hour
    private readonly defaultModel = 'models/gemini-2.0-flash';
    private readonly defaultEmbeddingModel = 'models/gemini-embedding-001';

    constructor() {
        this.loadAPIKeys();
        console.log(`🔑 [MULTI-KEY] Service initialized with ${this.apiKeys.length} API keys.`);
    }

    /**
     * Load API keys from environment
     */
    private loadAPIKeys() {
        const keys: APIKey[] = [];

        // Always try Supabase proxy first (most secure)
        const useProxy = false;

        if (useProxy) {
            keys.push({
                key: 'PROXY',
                name: 'Supabase Proxy (Secure)',
                priority: 2,
                enabled: true,
                failureCount: 0,
                lastFailure: null,
                isProxy: true,
                provider: 'gemini'
            });
        }

        // OpenRouter API Key (Very High Priority if available)
        const openRouterKey = import.meta.env.VITE_OPENROUTER_API_KEY;
        if (openRouterKey && openRouterKey.trim().length > 10 && openRouterKey !== 'YOUR_API_KEY') {
            keys.push({
                key: openRouterKey.trim(),
                name: 'OpenRouter (Multi-Model)',
                priority: 1,
                enabled: true,
                failureCount: 0,
                lastFailure: null,
                provider: 'openrouter'
            });
            console.log(`🔑 [MULTI-KEY] Found OpenRouter key! Accessing unlimited models.`);
        }

        // Direct Gemini API keys as fallback (for when proxy is unavailable)
        const directKeyNames = [
            'VITE_GEMINI_KEY_1', 'VITE_GEMINI_KEY_2', 'VITE_GEMINI_KEY_3',
            'VITE_GEMINI_API_KEY', 'VITE_GEMINI_KEY'
        ];
        let directPriority = 3;
        for (const keyName of directKeyNames) {
            const keyValue = (import.meta.env as any)[keyName];
            if (keyValue && keyValue.trim().length > 10 && keyValue !== 'YOUR_API_KEY') {
                keys.push({
                    key: keyValue.trim(),
                    name: `Direct (${keyName})`,
                    priority: directPriority++,
                    enabled: true,
                    failureCount: 0,
                    lastFailure: null,
                    provider: 'gemini'
                });
                console.log(`🔑 [MULTI-KEY] Found direct key: ${keyName}`);
            }
        }

        this.apiKeys = keys;
        console.log(`🔑 [MULTI-KEY] Loaded ${this.apiKeys.length} API key(s) (Proxy: ${useProxy})`);
        this.apiKeys.forEach(k => {
            const maskedKey = k.isProxy ? 'N/A' : `${k.key.substring(0, 6)}...`;
            console.log(`   - ${k.name}: Priority ${k.priority} (${maskedKey})`);
        });
    }

    /**
     * Get next available API key
     */
    private getNextKey(requiredProvider?: 'gemini' | 'openrouter'): APIKey | null {
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
                lastFailure: null,
                provider: 'gemini'
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

        // Priority-based selection
        const availableKeys = this.apiKeys
            .filter(k => {
                const isEnabled = k.enabled && k.failureCount < this.maxFailures;
                if (!isEnabled) return false;
                if (requiredProvider) return k.provider === requiredProvider || k.isProxy;
                return true;
            })
            .sort((a, b) => a.priority - b.priority);

        if (availableKeys.length === 0) {
            console.error('❌ [MULTI-KEY] No available API keys! Total keys in registry:', this.apiKeys.length);
            this.apiKeys.forEach(k => console.log(`- ${k.name}: enabled=${k.enabled}, failures=${k.failureCount}`));
            return null;
        }

        // We use the first key (highest priority) if it's the first attempt, 
        // or we can still do round-robin within the same priority level if needed.
        // For simplicity and effectiveness, we'll pick the best available one.
        const selected = availableKeys[0];
        console.log(`🎯 [MULTI-KEY] Selected Best: ${selected.name} (Priority: ${selected.priority})`);
        return selected;
    }

    /**
     * Mark key as failed
     */
    private markKeyFailed(keyName: string, error?: any) {
        const key = this.apiKeys.find(k => k.name === keyName);
        if (key) {
            // Don't disable keys for 429 (Rate Limit) errors, as those are temporary
            const errorStr = String(error || '').toLowerCase();
            const isRateLimit = errorStr.includes('429') || 
                               errorStr.includes('quota') || 
                               errorStr.includes('rate limit');

            if (isRateLimit) {
                console.log(`⚠️ [MULTI-KEY] ${key.name} hit rate limit. Not disabling.`);
                return;
            }

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
            model = this.defaultModel
        } = options;

        // Check daily token/request limits before execution
        aiUsageService.checkQuotaBeforeExecution('gemini'); // Default to gemini check if general

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
                        if (apiKey.provider === 'openrouter') {
                            console.log(`🌐 [MULTI-KEY] Routing through OpenRouter...`);
                            
                            // Format messages for OpenRouter (multimodal if attachment is present)
                            const messages: any[] = [];
                            
                            if (options.systemPrompt) {
                                messages.push({ role: 'system', content: options.systemPrompt });
                            }

                            if (options.history) {
                                options.history.forEach(h => {
                                    messages.push({ 
                                        role: (h.role === 'ai' || h.role === 'model') ? 'assistant' : 'user', 
                                        content: h.text 
                                    });
                                });
                            }

                            if (options.attachment && options.attachment.mimeType.startsWith('image/')) {
                                messages.push({
                                    role: 'user',
                                    content: [
                                        { type: 'text', text: prompt || `Analiziraj ovu sliku: ${options.attachment.name}` },
                                        { type: 'image_url', image_url: { url: `data:${options.attachment.mimeType};base64,${options.attachment.base64}` } }
                                    ]
                                });
                            } else {
                                messages.push({ role: 'user', content: prompt });
                            }

                            const orResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
                                method: "POST",
                                headers: {
                                    "Authorization": `Bearer ${apiKey.key}`,
                                    "HTTP-Referer": window.location.origin,
                                    "X-Title": "Olympic Hub",
                                    "Content-Type": "application/json"
                                },
                                body: JSON.stringify({
                                    "model": model.includes('gemini') ? "google/gemini-2.0-flash-001" : model,
                                    "messages": messages,
                                    "temperature": options.temperature ?? 0.7,
                                    "max_tokens": options.maxOutputTokens
                                })
                            });

                            const orData = await orResponse.json();
                            if (orData.error) throw new Error(`OpenRouter Error: ${orData.error.message || orData.error}`);
                            if (!orData.choices?.[0]?.message?.content) throw new Error('No content from OpenRouter');
                            return orData.choices[0].message.content;
                        } else if (apiKey.isProxy) {
                            console.log(`📡 [MULTI-KEY] Routing through Supabase Proxy...`);
                            const { data, error } = await supabase.functions.invoke('gemini-proxy', {
                                body: {
                                    prompt,
                                    model: model,
                                    temperature: options.temperature,
                                    maxTokens: options.maxOutputTokens,
                                    history: options.history
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
                                tools: options.tools,
                                systemInstruction: options.systemPrompt
                            });

                            // Handle history mapping for Gemini
                            const geminiHistory = (options.history || []).map(h => ({
                                role: (h.role === 'ai' || h.role === 'model') ? 'model' : 'user',
                                parts: [{ text: h.text }]
                            }));

                            // If attachment is present (Vision / Multimodal)
                            if (options.attachment) {
                                const parts: any[] = [
                                    { text: prompt || `Analiziraj ovaj fajl: ${options.attachment.name}` },
                                    {
                                        inline_data: {
                                            mime_type: options.attachment.mimeType,
                                            data: options.attachment.base64
                                        }
                                    }
                                ];
                                
                                const result = await geminiModel.generateContent({ contents: [...geminiHistory.map(h => ({ role: h.role, parts: h.parts })), { role: 'user', parts }] });
                                return result.response.text();
                            }

                            // Normal chat with history or tools
                            if (options.history || options.tools) {
                                const chat = geminiModel.startChat({
                                    history: geminiHistory,
                                });
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
                    this.markKeyFailed(apiKey.name, error);

                    // Track failed API call
                    ActivityLogger.logAPICall(
                        'Gemini',
                        model || 'gemini-2.0-flash',
                        0,
                        false,
                        error.message
                    );

                    // Always continue to next key (rate limit OR proxy errors)
                    // This enables direct key fallback when proxy fails
                    console.log(`⏭️ [MULTI-KEY] Trying next available key...`);
                    continue;
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
     * Generate embeddings with automatic failover
     */
    async embedContent(
        content: string,
        model: string = this.defaultEmbeddingModel,
        useCache: boolean = true
    ): Promise<number[]> {
        // --- DEVELOPMENT BYPASS ---
        if (import.meta.env.VITE_AI_DEV_MODE === 'true') {
            console.log(`⚡ [MULTI-KEY] EMBED DEV MODE: Returning mock vector.`);
            return Array.from({ length: 768 }, () => Math.random() * 2 - 1);
        }

        // --- CACHE CHECK ---
        if (useCache) {
            const cacheKey = `embed_${content}`;
            const cached = aiCache.get(cacheKey, 'default');
            if (cached) {
                try {
                    return JSON.parse(cached);
                } catch (e) {
                    console.warn('[MULTI-KEY] Cache parse failed for embedding');
                }
            }
        }

        // Try each available key
        let lastError: Error | null = null;
        const maxAttempts = Math.max(this.apiKeys.length, 1);

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            // For embedding we EXCLUSIVELY need Gemini (Direct or Proxy)
            const apiKey = this.getNextKey('gemini');
            if (!apiKey) {
                throw new Error('No available API keys or proxy');
            }

            try {
                const startTime = Date.now();

                const vector = await aiRateLimiter.queueRequest(async () => {
                    if (apiKey.isProxy) {
                        console.log(`📡 [MULTI-KEY] Routing Embedding through Supabase Proxy...`);
                        const { data, error } = await supabase.functions.invoke('gemini-proxy', {
                            body: {
                                prompt: content,
                                taskType: 'EMBEDDING',
                                model: model
                            }
                        });

                        if (error) throw new Error(`Proxy Error: ${error.message}`);
                        if (!data?.embedding) throw new Error('No embedding from proxy');
                        return data.embedding;
                    } else {
                        const genAI = new GoogleGenerativeAI(apiKey.key);
                        const embedModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
                        const result = await embedModel.embedContent(content);
                        let values = result.embedding.values;
                        // Matryoshka slicing: Keep only first 768 dimensions for compatibility
                        if (values.length > 768) {
                            values = values.slice(0, 768);
                        }
                        return values;
                    }
                });

                // Success!
                const tokens = Math.ceil(content.length / 4);
                const durationMs = Date.now() - startTime;

                aiUsageService.recordUsage('gemini-embedding', tokens);
                ActivityLogger.logAPICall('Gemini-Embedding', model, durationMs, true);

                console.log(`✅ [MULTI-KEY] Embedding success with ${apiKey.name}`);

                // --- CACHE SAVE ---
                if (useCache) {
                    aiCache.set(`embed_${content}`, JSON.stringify(vector), tokens, 'default');
                }

                return vector;

            } catch (error: any) {
                lastError = error;
                console.error(`❌ [MULTI-KEY] Embedding failed with ${apiKey.name}:`, error.message);
                this.markKeyFailed(apiKey.name, error);
                continue;
            }
        }

        throw lastError || new Error('All API keys failed for embedding');
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
            lastFailure: null,
            provider: 'gemini'
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
            return "Ja sam Milica, vaš turistički savetnik. Tu sam da vam pomognem da donesete najbolju odluku za vaš odmor. Možete me pitati o destinacijama, hotelima ili specifičnim zahtevima koje imate.";
        }

        // Default analysis/insight mock
        if (lowerPrompt.includes('hi') || lowerPrompt.includes('zdravo') || lowerPrompt.includes('ćao')) {
            return "Zdravo! Ja sam Milica. Dozvolite mi da vam pomognem u kreiranju vašeg idealnog odmora. Gde biste najradije uživali ovog leta?";
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
