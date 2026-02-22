/**
 * Service Provider Manager
 * 
 * Orchestrates multiple service providers (local storage and future APIs).
 */

import type { ServiceProvider, ExcursionSearchParams, ExtraService } from './ServiceProviderInterface';
import { LocalServiceProvider } from './LocalServiceProvider';
import { searchHistory } from '../../utils/searchHistory';

export class ServiceProviderManager {
    private providers: Map<string, ServiceProvider> = new Map();

    constructor() {
        this.registerProvider(new LocalServiceProvider());
    }

    registerProvider(provider: ServiceProvider): void {
        this.providers.set(provider.name, provider);
    }

    async getAllServices(): Promise<ExtraService[]> {
        const local = this.providers.get('Local');
        if (local && local.getAll) {
            return local.getAll();
        }
        return [];
    }

    async saveService(service: ExtraService): Promise<void> {
        const local = this.providers.get('Local');
        if (local && local.save) {
            await local.save(service);
        }
    }

    async deleteService(id: string): Promise<void> {
        const local = this.providers.get('Local');
        if (local && local.delete) {
            await local.delete(id);
        }
    }

    /**
     * Future-ready search across all providers (e.g., local + Viator)
     */
    async searchAll(params: ExcursionSearchParams): Promise<ExtraService[]> {
        const activeProviders = Array.from(this.providers.values()).filter(p => p.isActive);
        const results = await Promise.allSettled(
            activeProviders.map(p => p.search(params))
        );

        const all: ExtraService[] = [];
        results.forEach(res => {
            if (res.status === 'fulfilled') {
                all.push(...res.value);
            }
        });

        // Log search history
        await searchHistory.logSearch({
            search_type: 'services',
            search_params: params,
            results_count: all.length,
            providers_searched: activeProviders.map(p => p.name)
        });

        return all;
    }
}

const instance = new ServiceProviderManager();
export const serviceProviderManager = instance;
export default serviceProviderManager;
