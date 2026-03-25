// Solvex Authentication Service
import { makeSoapRequest } from './solvexSoapClient';
import type { SolvexAuthResponse, SolvexApiResponse } from '../types/solvex.types';

const getEnvVar = (key: string) => {
    // 1. Try Vite env (for frontend) - PRIMARY for web apps
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key] !== undefined) {
        // @ts-ignore
        const val = import.meta.env[key];
        return val;
    }

    // 2. Try process.env (for scripts/Node)
    if (typeof process !== 'undefined' && process.env && process.env[key] !== undefined) {
        return process.env[key];
    }

    return undefined;
};

const SOLVEX_LOGIN = getEnvVar('VITE_SOLVEX_LOGIN');
const SOLVEX_PASSWORD = getEnvVar('VITE_SOLVEX_PASSWORD');

// Token cache
let cachedToken: string | null = null;
let tokenExpiry: number | null = null;
const TOKEN_LIFETIME = 30 * 60 * 1000; // 30 minutes
let connectionPromise: Promise<SolvexApiResponse<string>> | null = null;

/**
 * Connect to Solvex API and obtain authentication token
 */
export async function connect(): Promise<SolvexApiResponse<string>> {
    try {
        // 1. Check in-memory cache
        if (cachedToken && tokenExpiry && Date.now() < tokenExpiry) {
            return { success: true, data: cachedToken };
        }

        // 2. Check localStorage cache (Persistence across reloads)
        const storedToken = localStorage.getItem('solvex_token');
        const storedExpiry = localStorage.getItem('solvex_token_expiry');
        if (storedToken && storedExpiry && Date.now() < parseInt(storedExpiry)) {
            cachedToken = storedToken;
            tokenExpiry = parseInt(storedExpiry);
            console.log('[Solvex Auth] Restored token from storage');
            return { success: true, data: storedToken };
        }

        // 3. Prevent parallel connection attempts
        if (connectionPromise) {
            console.log('[Solvex Auth] Waiting for existing connection attempt...');
            return connectionPromise;
        }

        connectionPromise = (async () => {
            try {
                // Under the Fortress architecture, credentials are injected by the Supabase Edge Function Proxy.
                const login = getEnvVar('VITE_SOLVEX_LOGIN') || SOLVEX_LOGIN || 'proxy_auth';
                const password = getEnvVar('VITE_SOLVEX_PASSWORD') || SOLVEX_PASSWORD || 'proxy_auth';

                console.log('[Solvex Auth] Requesting new token (proxy handled)...');

                const result = await makeSoapRequest<string>('Connect', {
                    'login': login,
                    'password': password
                });

                if (!result) {
                    throw new Error('Solvex API nije vratio token (prazan odgovor)');
                }

                if (result.includes('Connection result code:') || result.toLowerCase().includes('invalid')) {
                    throw new Error(`Solvex API Auth Error: ${result}`);
                }

                // Cache the token in memory
                cachedToken = result;
                tokenExpiry = Date.now() + TOKEN_LIFETIME;

                // Persist token in storage
                localStorage.setItem('solvex_token', result);
                localStorage.setItem('solvex_token_expiry', tokenExpiry.toString());
                
                console.log('[Solvex Auth] Token obtained successfully');

                return { success: true, data: result };
            } catch (authError: any) {
                console.error('[Solvex Auth] Connection attempt failed:', authError);
                return { success: false, error: authError.message || 'Failed to connect to Solvex' };
            } finally {
                connectionPromise = null;
            }
        })();

        return connectionPromise;
    } catch (error) {
        console.error('[Solvex Auth] Connection failed:', error);

        // Clear cache on error
        cachedToken = null;
        tokenExpiry = null;
        localStorage.removeItem('solvex_token');
        localStorage.removeItem('solvex_token_expiry');

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
    localStorage.removeItem('solvex_token');
    localStorage.removeItem('solvex_token_expiry');
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
