/**
 * Unified TCT API
 * Automatically switches between Mock and Real API based on environment variable
 */

import { tctApi as realApi } from './tctApiService.secure';
import { tctMockApi as mockApi } from './tctMockService';
import { rateLimiter } from '../utils/rateLimiter';

// Force Mock mode for now since B2B is not activated
const FORCE_MOCK = true;

const envValue = import.meta.env.VITE_TCT_USE_MOCK;
const useMock = FORCE_MOCK || envValue === 'true' || envValue === true;

// Log which API we're using
if (useMock) {
    console.log('🧪 TCT API: Using MOCK service (B2B not activated yet)');
} else {
    console.log('🔌 TCT API: Using REAL service');
}

// Wrapper to handle failover
const wrapApi = (realFn: any, mockFn: any) => {
    return async (...args: any[]) => {
        // Rate limit check (applies to both real and mock for consistency)
        const limitCheck = rateLimiter.checkLimit('tct');
        if (!limitCheck.allowed) {
            console.warn(`[TCT API] Rate limit exceeded. Retry after ${limitCheck.retryAfter}s`);
            return {
                success: false,
                error: `Rate limit exceeded. Please wait ${limitCheck.retryAfter} seconds before retrying.`
            };
        }

        if (useMock) return mockFn(...args);

        try {
            const result = await realFn(...args);
            // Ako dobijemo grešku sa kredencijalima, možemo automatski prebaciti na mock za UI demo
            if (!result.success && result.error?.includes('Invalid')) {
                console.warn('⚠️ TCT Real API failed - falling back to Mock for demo');
                return mockFn(...args);
            }
            return result;
        } catch (err) {
            console.error('TCT Real API crash - falling back to Mock', err);
            return mockFn(...args);
        }
    };
};

export const tctApi = {
    ...realApi,
    config: useMock ? mockApi.config : realApi.config,
    isConfigured: () => true,

    // Wrapped functions
    searchHotelsSync: wrapApi(realApi.searchHotelsSync, mockApi.searchHotelsSync),
    getNationalities: wrapApi(realApi.getNationalities, mockApi.getNationalities),
    getGeography: wrapApi(realApi.getGeography, mockApi.getGeography),
};

export const {
    searchHotelsSync,
    getNationalities,
    getGeography
} = tctApi;

export default tctApi;
