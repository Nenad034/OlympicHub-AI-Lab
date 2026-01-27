/**
 * Amadeus Integration Initializer
 * 
 * Initializes Amadeus API services on app startup
 */

import { initAmadeusAuth } from './providers/amadeus/amadeusAuthService';
import { initAmadeusApi } from './providers/amadeus/amadeusApiService';
import type { AmadeusConfig } from './providers/amadeus/amadeusTypes';

/**
 * Initialize Amadeus services
 */
export function initializeAmadeus(): boolean {
    const apiKey = import.meta.env.VITE_AMADEUS_API_KEY;
    const apiSecret = import.meta.env.VITE_AMADEUS_API_SECRET;
    const baseUrl = import.meta.env.VITE_AMADEUS_BASE_URL || 'https://test.api.amadeus.com';

    // Check if credentials are provided
    if (!apiKey || !apiSecret) {
        console.warn('⚠️  Amadeus credentials not found. Using mock service only.');
        console.warn('   Set VITE_AMADEUS_API_KEY and VITE_AMADEUS_API_SECRET in .env');
        return false;
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
