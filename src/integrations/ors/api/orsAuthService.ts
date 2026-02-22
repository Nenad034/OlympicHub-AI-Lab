/**
 * ORS API Authentication Service
 * 
 * Handles authentication and request headers for ORS API
 * Much simpler than Solvex - just needs API key in header!
 */

import { ORS_CONFIG, ORS_LANGUAGES, checkRateLimit, getRateLimitStatus } from './orsConstants';

export class OrsAuthService {
    private apiKey: string;
    private defaultLanguage: string;

    constructor() {
        // Use API key from config
        this.apiKey = ORS_CONFIG.API_KEY || '';
        this.defaultLanguage = ORS_LANGUAGES.EN;
    }

    /**
     * Get authentication headers for ORS API requests
     */
    getHeaders(language?: string): HeadersInit {
        return {
            'X-API-Key': this.apiKey,
            'Accept-Language': language || this.defaultLanguage,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
        };
    }

    /**
     * Set API key (for testing or dynamic configuration)
     */
    setApiKey(apiKey: string): void {
        this.apiKey = apiKey;
    }

    /**
     * Set default language
     */
    setLanguage(language: string): void {
        this.defaultLanguage = language;
    }

    /**
     * Check if API key is configured
     */
    isConfigured(): boolean {
        return !!this.apiKey && this.apiKey.length > 0;
    }

    /**
     * Check rate limit before making request
     */
    canMakeRequest(): boolean {
        return checkRateLimit();
    }

    /**
     * Get rate limit status
     */
    getRateLimitStatus() {
        return getRateLimitStatus();
    }

    /**
     * Make authenticated request to ORS API
     */
    async makeRequest<T>(
        endpoint: string,
        options: RequestInit = {},
        language?: string
    ): Promise<T> {
        // Check rate limit
        if (!this.canMakeRequest()) {
            const status = this.getRateLimitStatus();
            throw new Error(
                `Rate limit exceeded. Try again after ${status.resetAt.toLocaleTimeString()}`
            );
        }

        // Check API key
        if (!this.isConfigured()) {
            throw new Error('ORS API key not configured');
        }

        const url = `${ORS_CONFIG.BASE_URL}${endpoint}`;

        const response = await fetch(url, {
            ...options,
            headers: {
                ...this.getHeaders(language),
                ...options.headers,
            },
            signal: AbortSignal.timeout(ORS_CONFIG.TIMEOUT),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(
                `ORS API error (${response.status}): ${errorText || response.statusText}`
            );
        }

        return response.json();
    }

    /**
     * Make GET request
     */
    async get<T>(endpoint: string, language?: string): Promise<T> {
        return this.makeRequest<T>(endpoint, { method: 'GET' }, language);
    }

    /**
     * Make POST request
     */
    async post<T>(endpoint: string, body: any, language?: string): Promise<T> {
        return this.makeRequest<T>(
            endpoint,
            {
                method: 'POST',
                body: JSON.stringify(body),
            },
            language
        );
    }
}

// Singleton instance
export const orsAuthService = new OrsAuthService();
