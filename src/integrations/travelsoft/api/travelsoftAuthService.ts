/**
 * Travelsoft NDC - Auth Service
 * 
 * Upravljanje autentikacijom: login + token caching (~1 sat validnost)
 * Token se čuva u memoriji i automatski obnavlja kada istekne.
 */

import type { TravelsoftConfig, TravelsoftAuthToken } from '../types/travelsoftTypes';
import { buildLoginXml, parseLoginResponse } from './travelsoftXmlBuilder';

class TravelsoftAuthService {
    private config: TravelsoftConfig;
    private cachedToken: TravelsoftAuthToken | null = null;

    constructor(config: TravelsoftConfig) {
        this.config = config;
    }

    /**
     * Vraća validan AuthToken. Ako token postoji i nije istekao — koristi cached.
     * Ako nije ili je istekao — radi novi login.
     */
    async getAuthToken(): Promise<string> {
        if (this.cachedToken && this.isTokenValid(this.cachedToken)) {
            console.log('[Travelsoft Auth] Using cached token (still valid)');
            return this.cachedToken.value;
        }

        console.log('[Travelsoft Auth] Token expired or missing. Logging in...');
        return this.login();
    }

    /**
     * Izvršava login i kešira token
     */
    private async login(): Promise<string> {
        const loginXml = buildLoginXml(this.config.username, this.config.password);

        const response = await fetch(`${this.config.baseUrl}/Login`, {
            method: 'POST',
            headers: this.buildHeaders(),
            body: loginXml,
            signal: AbortSignal.timeout(this.config.timeout)
        });

        if (!response.ok) {
            throw new Error(`[Travelsoft Auth] Login failed: HTTP ${response.status}`);
        }

        const xmlText = await response.text();
        const parsed = parseLoginResponse(xmlText);

        if (!parsed.token) {
            throw new Error(`[Travelsoft Auth] Login failed: No token in response`);
        }

        // Keširanje tokena
        this.cachedToken = {
            value: parsed.token,
            expiresAt: parsed.expiresAt ? new Date(parsed.expiresAt) : this.defaultExpiry()
        };

        console.log(`[Travelsoft Auth] Login successful. Token expires at: ${this.cachedToken.expiresAt.toISOString()}`);
        return this.cachedToken.value;
    }

    /**
     * Proverava da li je token još validan (uz 5 minuta buffer)
     */
    private isTokenValid(token: TravelsoftAuthToken): boolean {
        const bufferMs = 5 * 60 * 1000; // 5 minuta buffer
        return token.expiresAt.getTime() - bufferMs > Date.now();
    }

    /**
     * Default expiry: 55 minuta od sada (Travelsoft token traje ~1 sat)
     */
    private defaultExpiry(): Date {
        return new Date(Date.now() + 55 * 60 * 1000);
    }

    /**
     * Gradi HTTP headere za Travelsoft REST endpoint
     */
    buildHeaders(authToken?: string): HeadersInit {
        const headers: HeadersInit = {
            'Content-Type': 'text/xml;charset=UTF-8',
            'Accept-Encoding': 'gzip',
            [`Orx-Control-Provider`]: this.config.provider,
            [`Orx-Control-ApiVersion`]: this.config.apiVersion
        };

        if (authToken) {
            headers['AuthToken'] = authToken;
        }

        return headers;
    }

    /**
     * Gradi headere sa tokenom (za zaštićene endpointe)
     */
    async buildAuthHeaders(): Promise<HeadersInit> {
        const token = await this.getAuthToken();
        return this.buildHeaders(token);
    }

    /**
     * Manuelno invalidira token (npr. na logout ili 401 grešku)
     */
    invalidateToken(): void {
        this.cachedToken = null;
        console.log('[Travelsoft Auth] Token invalidated');
    }

    /**
     * Vraća info o trenutnom tokenu (za debugging)
     */
    getTokenInfo(): { hasToken: boolean; expiresAt?: string; isValid?: boolean } {
        if (!this.cachedToken) {
            return { hasToken: false };
        }
        return {
            hasToken: true,
            expiresAt: this.cachedToken.expiresAt.toISOString(),
            isValid: this.isTokenValid(this.cachedToken)
        };
    }
}

// ============================================================================
// SINGLETON
// ============================================================================

let authInstance: TravelsoftAuthService | null = null;

export function initTravelsoftAuth(config: TravelsoftConfig): TravelsoftAuthService {
    authInstance = new TravelsoftAuthService(config);
    return authInstance;
}

export function getTravelsoftAuth(): TravelsoftAuthService {
    if (!authInstance) {
        throw new Error('[Travelsoft Auth] Service not initialized. Call initTravelsoftAuth() first.');
    }
    return authInstance;
}

export default TravelsoftAuthService;
