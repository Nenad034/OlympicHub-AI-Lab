/**
 * Amadeus Authentication Service
 * 
 * Handles OAuth2 authentication for Amadeus API
 * Manages token lifecycle (creation, caching, refresh)
 */

import type { AmadeusAuthResponse, AmadeusAuthToken, AmadeusConfig } from './amadeusTypes';

class AmadeusAuthService {
    private config: AmadeusConfig;
    private currentToken: AmadeusAuthToken | null = null;
    private tokenRefreshPromise: Promise<AmadeusAuthToken> | null = null;

    constructor(config: AmadeusConfig) {
        this.config = config;
    }

    /**
     * Get valid access token (creates new or returns cached)
     */
    async getAccessToken(): Promise<string> {
        // Check if we have a valid cached token
        if (this.currentToken && this.isTokenValid(this.currentToken)) {
            return this.currentToken.accessToken;
        }

        // If token refresh is already in progress, wait for it
        if (this.tokenRefreshPromise) {
            const token = await this.tokenRefreshPromise;
            return token.accessToken;
        }

        // Start new token refresh
        this.tokenRefreshPromise = this.fetchNewToken();

        try {
            this.currentToken = await this.tokenRefreshPromise;
            return this.currentToken.accessToken;
        } finally {
            this.tokenRefreshPromise = null;
        }
    }

    /**
     * Fetch new access token from Amadeus
     */
    private async fetchNewToken(): Promise<AmadeusAuthToken> {
        const url = `${this.config.baseUrl}/v1/security/oauth2/token`;

        const body = new URLSearchParams({
            grant_type: 'client_credentials',
            client_id: this.config.apiKey,
            client_secret: this.config.apiSecret
        });

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: body.toString()
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Amadeus auth failed: ${response.status} - ${errorText}`);
            }

            const data: AmadeusAuthResponse = await response.json();

            // Calculate expiration time (subtract 5 minutes for safety margin)
            const expiresAt = Date.now() + (data.expires_in - 300) * 1000;

            const token: AmadeusAuthToken = {
                accessToken: data.access_token,
                tokenType: data.token_type,
                expiresAt
            };

            console.log('✅ Amadeus token acquired, expires at:', new Date(expiresAt).toISOString());

            return token;
        } catch (error) {
            console.error('❌ Amadeus authentication failed:', error);
            throw error;
        }
    }

    /**
     * Check if token is still valid
     */
    private isTokenValid(token: AmadeusAuthToken): boolean {
        // Token is valid if it hasn't expired yet
        return Date.now() < token.expiresAt;
    }

    /**
     * Force token refresh
     */
    async refreshToken(): Promise<string> {
        this.currentToken = null;
        return this.getAccessToken();
    }

    /**
     * Clear cached token
     */
    clearToken(): void {
        this.currentToken = null;
    }

    /**
     * Get current token info (for debugging)
     */
    getTokenInfo(): { valid: boolean; expiresIn?: number } {
        if (!this.currentToken) {
            return { valid: false };
        }

        const valid = this.isTokenValid(this.currentToken);
        const expiresIn = valid ? Math.floor((this.currentToken.expiresAt - Date.now()) / 1000) : 0;

        return { valid, expiresIn };
    }
}

// Singleton instance
let authServiceInstance: AmadeusAuthService | null = null;

/**
 * Initialize Amadeus Auth Service
 */
export function initAmadeusAuth(config: AmadeusConfig): AmadeusAuthService {
    authServiceInstance = new AmadeusAuthService(config);
    return authServiceInstance;
}

/**
 * Get Amadeus Auth Service instance
 */
export function getAmadeusAuth(): AmadeusAuthService {
    if (!authServiceInstance) {
        throw new Error('Amadeus Auth Service not initialized. Call initAmadeusAuth() first.');
    }
    return authServiceInstance;
}

export default AmadeusAuthService;
