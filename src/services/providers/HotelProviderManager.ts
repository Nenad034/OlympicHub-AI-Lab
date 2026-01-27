/**
 * Hotel Provider Manager
 * 
 * =============================================================================
 * LEGAL NOTICE: Centralized Provider Management
 * =============================================================================
 * 
 * This manager class demonstrates complete INDEPENDENCE from any single vendor.
 * 
 * PURPOSE:
 * - Manage multiple hotel providers (Solvex, OpenGreece, TCT, etc.)
 * - Enable/disable providers without code changes
 * - Aggregate results from multiple providers
 * - Prove that no single vendor is essential to the application
 * 
 * LEGAL PROTECTION:
 * - Application works with ANY provider that implements HotelProvider interface
 * - Providers can be added/removed at runtime
 * - No vendor-specific logic in core application
 * - Demonstrates vendor-agnostic architecture
 * 
 * BENEFITS:
 * - Easy to add new providers (just implement the interface)
 * - Easy to remove providers (just unregister them)
 * - Can use multiple providers simultaneously
 * - Automatic failover if one provider fails
 * 
 * @see src/services/providers/HotelProviderInterface.ts - Generic contract
 * @see docs/legal/COMPLIANCE_ACTION_PLAN.md (Phase 3)
 * =============================================================================
 */

import type {
    HotelProvider,
    HotelSearchParams,
    HotelSearchResult
} from './HotelProviderInterface';

import { apiCache } from '../../utils/apiCache';
import { sentinelEvents } from '../../utils/sentinelEvents';
import { SolvexProvider } from './SolvexProvider';
import { OpenGreeceProvider } from './OpenGreeceProvider';
import { TCTProvider } from './TCTProvider';
import { searchHistory } from '../../utils/searchHistory';

/**
 * Hotel Provider Manager
 * 
 * Centralized management of all hotel search providers.
 * Handles provider registration, search aggregation, and failover.
 */
export class HotelProviderManager {
    private providers: Map<string, HotelProvider> = new Map();

    constructor() {
        // Register all available providers
        this.registerDefaultProviders();
    }

    /**
     * Register default providers
     * 
     * This is where we register all available hotel providers.
     * Providers can be easily added or removed from this list.
     */
    private registerDefaultProviders(): void {
        // Register Solvex provider
        try {
            const solvexProvider = new SolvexProvider();
            if (solvexProvider.isConfigured()) {
                this.registerProvider(solvexProvider);
                console.log('✅ Solvex provider registered');
            } else {
                console.warn('⚠️ Solvex provider not configured (missing credentials)');
            }
        } catch (error) {
            console.error('❌ Failed to register Solvex provider:', error);
        }

        // Register OpenGreece provider
        try {
            const openGreeceProvider = new OpenGreeceProvider();
            if (openGreeceProvider.isConfigured()) {
                this.registerProvider(openGreeceProvider);
                console.log('✅ OpenGreece provider registered');
            } else {
                console.warn('⚠️ OpenGreece provider not configured');
            }
        } catch (error) {
            console.error('❌ Failed to register OpenGreece provider:', error);
        }

        // Register TCT provider
        try {
            const tctProvider = new TCTProvider();
            if (tctProvider.isConfigured()) {
                this.registerProvider(tctProvider);
                console.log('✅ TCT provider registered');
            } else {
                console.warn('⚠️ TCT provider not configured');
            }
        } catch (error) {
            console.error('❌ Failed to register TCT provider:', error);
        }
    }

    /**
     * Register a hotel provider
     * 
     * @param provider Provider instance implementing HotelProvider interface
     */
    registerProvider(provider: HotelProvider): void {
        this.providers.set(provider.name, provider);
        console.log(`[ProviderManager] Registered provider: ${provider.name}`);
    }

    /**
     * Unregister a hotel provider
     * 
     * @param providerName Name of the provider to unregister
     */
    unregisterProvider(providerName: string): void {
        if (this.providers.delete(providerName)) {
            console.log(`[ProviderManager] Unregistered provider: ${providerName}`);
        }
    }

    /**
     * Get list of registered provider names
     */
    getProviderNames(): string[] {
        return Array.from(this.providers.keys());
    }

    /**
     * Get a specific provider by name
     */
    getProvider(providerName: string): HotelProvider | undefined {
        return this.providers.get(providerName);
    }

    /**
     * Search all active providers
     * 
     * Aggregates results from all registered providers.
     * Continues even if some providers fail (automatic failover).
     * 
     * @param params Generic search parameters
     * @returns Combined results from all providers
     */
    async searchAll(params: HotelSearchParams): Promise<HotelSearchResult[]> {
        const activeProviders = Array.from(this.providers.values())
            .filter(p => p.isActive);

        if (activeProviders.length === 0) {
            console.warn('[ProviderManager] No active providers available');
            return [];
        }

        console.log(`[ProviderManager] Searching ${activeProviders.length} providers...`);

        // Search all providers in parallel
        const results = await Promise.allSettled(
            activeProviders.map(provider => this.searchProvider(provider, params))
        );

        // Aggregate successful results
        const allResults: HotelSearchResult[] = [];
        let successCount = 0;
        let failureCount = 0;

        results.forEach((result, index) => {
            const providerName = activeProviders[index].name;

            if (result.status === 'fulfilled') {
                const providerResults = result.value;
                allResults.push(...providerResults);
                successCount++;
                console.log(`✅ ${providerName}: ${providerResults.length} results`);
            } else {
                failureCount++;
                console.error(`❌ ${providerName} failed:`, result.reason);
            }
        });

        console.log(`[ProviderManager] Search complete: ${successCount} succeeded, ${failureCount} failed, ${allResults.length} total results`);

        // Log search history for analytics
        const bestPrice = allResults.length > 0
            ? Math.min(...allResults.map(r => r.price || Infinity))
            : undefined;

        await searchHistory.logSearch({
            search_type: 'hotels',
            search_params: params,
            results_count: allResults.length,
            best_price: bestPrice !== Infinity ? bestPrice : undefined,
            providers_searched: activeProviders.map(p => p.name)
        });

        return allResults;
    }

    /**
     * Search a specific provider by name
     * 
     * @param providerName Name of the provider to search
     * @param params Generic search parameters
     * @returns Results from the specified provider
     */
    async searchByProvider(
        providerName: string,
        params: HotelSearchParams
    ): Promise<HotelSearchResult[]> {
        const provider = this.providers.get(providerName);

        if (!provider) {
            throw new Error(`Provider "${providerName}" not found`);
        }

        if (!provider.isActive) {
            throw new Error(`Provider "${providerName}" is not active`);
        }

        return this.searchProvider(provider, params);
    }

    /**
     * Internal method to search a single provider
     */
    private async searchProvider(
        provider: HotelProvider,
        params: HotelSearchParams
    ): Promise<HotelSearchResult[]> {
        const cacheKey = apiCache.generateKey(provider.name, params);

        // 1. Check if we have a valid cached result
        const cachedResults = apiCache.get<HotelSearchResult[]>(cacheKey);
        if (cachedResults) {
            console.log(`[ProviderManager] ⚡ Returning CACHED results for ${provider.name}`);
            return cachedResults;
        }

        try {
            // Authenticate if needed
            await provider.authenticate();

            // Perform search
            const results = await provider.search(params);

            // 2. Store results in cache for 5 minutes
            if (results.length > 0) {
                apiCache.set(cacheKey, results);
            }

            return results;

        } catch (error) {
            console.error(`[ProviderManager] ${provider.name} search failed:`, error);

            // Trigger Sentinel Alert
            sentinelEvents.emit({
                title: `${provider.name} API Problem`,
                message: `Greška u komunikaciji sa ${provider.name}: ${error instanceof Error ? error.message : 'Nepoznata greška'}. Pokušavam automatski failover.`,
                type: 'critical',
                sendTelegram: true
            });

            throw error;
        }
    }

    /**
     * Get statistics about registered providers
     */
    getStats(): {
        total: number;
        active: number;
        configured: number;
        providers: Array<{
            name: string;
            active: boolean;
            configured: boolean;
        }>;
    } {
        const providers = Array.from(this.providers.values());

        return {
            total: providers.length,
            active: providers.filter(p => p.isActive).length,
            configured: providers.filter(p => p.isConfigured()).length,
            providers: providers.map(p => ({
                name: p.name,
                active: p.isActive,
                configured: p.isConfigured()
            }))
        };
    }
}

// Singleton instance
let managerInstance: HotelProviderManager | null = null;

/**
 * Get the singleton instance of HotelProviderManager
 */
export function getHotelProviderManager(): HotelProviderManager {
    if (!managerInstance) {
        managerInstance = new HotelProviderManager();
    }
    return managerInstance;
}

/**
 * Reset the singleton instance (useful for testing)
 */
export function resetHotelProviderManager(): void {
    managerInstance = null;
}

export default HotelProviderManager;
