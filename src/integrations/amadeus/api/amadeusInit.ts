/**
 * Amadeus Integration Initializer
 * 
 * Initializes Amadeus API services on app startup
 */

import { initAmadeusAuth } from './amadeusAuthService';
import { initAmadeusApi } from './amadeusApiService';
import type { AmadeusConfig } from '../types/amadeusTypes';

/**
 * Initialize Amadeus services
 */
export function initializeAmadeus(): boolean {
    const isProxy = import.meta.env.VITE_USE_EDGE_FUNCTION === 'true' || import.meta.env.PROD;
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';

    let baseUrl = 'https://test.api.amadeus.com';
    let apiKey = 'local_dev_key';
    let apiSecret = 'local_dev_secret';

    if (isProxy && supabaseUrl) {
        baseUrl = `${supabaseUrl}/functions/v1/amadeus-proxy`;
        apiKey = 'proxy_auth';
        apiSecret = 'proxy_auth';
    } else {
        // Fallback for local development WITHOUT proxy if VITE variables exist
        apiKey = import.meta.env.AMADEUS_API_KEY || '';
        apiSecret = import.meta.env.AMADEUS_API_SECRET || '';
        baseUrl = import.meta.env.AMADEUS_BASE_URL || 'https://test.api.amadeus.com';

        if (!apiKey || !apiSecret) {
            console.warn('⚠️  Amadeus credentials not found and proxy is not enabled. Using mock service.');
            return false;
        }
    }

    try {
        const config: AmadeusConfig = {
            apiKey,
            apiSecret,
            baseUrl,
            environment: baseUrl.includes('test') ? 'test' : 'production'
        };

        // Initialize auth service
        initAmadeusAuth(config);

        // Initialize API service
        initAmadeusApi(config);

        console.log('✅ Amadeus integration initialized');
        console.log(`   Environment: ${config.environment}`);
        console.log(`   Base URL: ${config.baseUrl}`);

        return true;
    } catch (error) {
        console.error('❌ Failed to initialize Amadeus:', error);
        return false;
    }
}
