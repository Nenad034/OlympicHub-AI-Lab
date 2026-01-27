// Solvex Authentication Service
import { makeSoapRequest } from '../../utils/solvexSoapClient';
import type { SolvexAuthResponse, SolvexApiResponse } from '../../types/solvex.types';

const SOLVEX_LOGIN = import.meta.env.VITE_SOLVEX_LOGIN;
const SOLVEX_PASSWORD = import.meta.env.VITE_SOLVEX_PASSWORD;

// Validate that credentials are configured
if (!SOLVEX_LOGIN || !SOLVEX_PASSWORD) {
    console.error(
        '[Solvex Auth] CRITICAL: Solvex credentials not configured!\n' +
        'Please set VITE_SOLVEX_LOGIN and VITE_SOLVEX_PASSWORD in your .env file.\n' +
        'See .env.example for template.'
    );
}

// Token cache
let cachedToken: string | null = null;
let tokenExpiry: number | null = null;
const TOKEN_LIFETIME = 30 * 60 * 1000; // 30 minutes

/**
 * Connect to Solvex API and obtain authentication token
 */
export async function connect(): Promise<SolvexApiResponse<string>> {
    try {
        // Check if we have a valid cached token
        if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) {
            console.log('[Solvex Auth] Using cached token');
            return {
                success: true,
                data: cachedToken
            };
        }

        console.log('[Solvex Auth] Requesting new token...');

        const result = await makeSoapRequest<string>('Connect', {
            'login': SOLVEX_LOGIN,
            'password': SOLVEX_PASSWORD
        });

        // Cache the token
        cachedToken = result;
        tokenExpiry = Date.now() + TOKEN_LIFETIME;

        console.log('[Solvex Auth] Token obtained successfully');

        return {
            success: true,
            data: result
        };
    } catch (error) {
        console.error('[Solvex Auth] Connection failed:', error);

        // Clear cache on error
        cachedToken = null;
        tokenExpiry = null;

        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to connect to Solvex API'
        };
    }
}

/**
 * Check if connection is active
 */
export async function checkConnect(guid: string): Promise<SolvexApiResponse<boolean>> {
    try {
        const result = await makeSoapRequest<boolean>('CheckConnect', {
            'guid': guid
        });

        return {
            success: true,
            data: result
        };
    } catch (error) {
        console.error('[Solvex Auth] Check connection failed:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to check connection'
        };
    }
}

/**
 * Get current cached token (if valid)
 */
export function getCachedToken(): string | null {
    if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) {
        return cachedToken;
    }
    return null;
}

/**
 * Clear cached token
 */
export function clearToken(): void {
    cachedToken = null;
    tokenExpiry = null;
    console.log('[Solvex Auth] Token cache cleared');
}

/**
 * Refresh token (force new connection)
 */
export async function refreshToken(): Promise<SolvexApiResponse<string>> {
    clearToken();
    return connect();
}

export default {
    connect,
    checkConnect,
    getCachedToken,
    clearToken,
    refreshToken
};
