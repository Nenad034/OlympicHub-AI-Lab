/**
 * Flight Provider Manager
 * 
 * =============================================================================
 * LEGAL NOTICE: Centralized Flight Provider Management
 * =============================================================================
 */

import type { FlightProvider, FlightSearchParams, FlightOffer } from './FlightProviderInterface';
import { AmadeusProvider } from './AmadeusProvider';
import { sentinelEvents } from '../../utils/sentinelEvents';
import { searchHistory } from '../../utils/searchHistory';

export class FlightProviderManager {
    private providers: Map<string, FlightProvider> = new Map();

    constructor() {
        this.registerDefaultProviders();
    }

    private registerDefaultProviders(): void {
        // Register Amadeus provider
        try {
            const amadeusProvider = new AmadeusProvider();
            if (amadeusProvider.isConfigured()) {
                this.registerProvider(amadeusProvider);
                console.log('✅ Amadeus flight provider registered');
            }
        } catch (error) {
            console.error('❌ Failed to register Amadeus provider:', error);
        }
    }

    registerProvider(provider: FlightProvider): void {
        this.providers.set(provider.name, provider);
    }

    async searchAll(params: FlightSearchParams): Promise<FlightOffer[]> {
        const activeProviders = Array.from(this.providers.values()).filter(p => p.isActive);

        if (activeProviders.length === 0) {
            return [];
        }

        const results = await Promise.allSettled(
            activeProviders.map(provider => this.searchProvider(provider, params))
        );

        const allResults: FlightOffer[] = [];
        results.forEach((result, index) => {
            const providerName = activeProviders[index].name;
            if (result.status === 'fulfilled') {
                allResults.push(...result.value);
            } else {
                console.error(`❌ Flight provider ${providerName} failed:`, result.reason);
                sentinelEvents.emit({
                    title: `Flight API Problem: ${providerName}`,
                    message: `Greška pri pretrazi letova na ${providerName}. Proverite konekciju.`,
                    type: 'warning',
                    sendTelegram: true
                });
            }
        });

        const sortedResults = allResults.sort((a, b) => a.price - b.price);

        // Log search history
        await searchHistory.logSearch({
            search_type: 'flights',
            search_params: params,
            results_count: sortedResults.length,
            best_price: sortedResults.length > 0 ? sortedResults[0].price : undefined,
            providers_searched: activeProviders.map(p => p.name)
        });

        return sortedResults;
    }

    private async searchProvider(provider: FlightProvider, params: FlightSearchParams): Promise<FlightOffer[]> {
        await provider.authenticate();
        return provider.search(params);
    }
}

let instance: FlightProviderManager | null = null;

export function getFlightProviderManager(): FlightProviderManager {
    if (!instance) {
        instance = new FlightProviderManager();
    }
    return instance;
}

export default FlightProviderManager;
