/**
 * Local Service Provider
 * 
 * Adapts existing cloud/local storage for extra services.
 */

import type { ServiceProvider, ExcursionSearchParams, ExtraService } from './ServiceProviderInterface';
import { saveToCloud, loadFromCloud } from '../../utils/storageUtils';

export class LocalServiceProvider implements ServiceProvider {
    readonly name = 'Local';
    readonly isActive = true;

    async search(params: ExcursionSearchParams): Promise<ExtraService[]> {
        const services = await this.getAll();
        return services.filter(s => {
            const matchesCat = !params.category || s.category === params.category;
            const matchesLoc = !params.location || s.description.toLowerCase().includes(params.location.toLowerCase());
            return matchesCat && matchesLoc;
        });
    }

    async getAll(): Promise<ExtraService[]> {
        const { success, data } = await loadFromCloud('extra_services');
        if (success && data) {
            return (data as any[]).map(s => ({
                ...s,
                providerName: this.name,
                // Ensure price is a number for the UI
                price: typeof s.price === 'string' ? parseFloat(s.price) : s.price
            }));
        }
        return [];
    }

    async save(service: ExtraService): Promise<void> {
        const services = await this.getAll();
        const index = services.findIndex(s => s.id === service.id);

        let updated;
        if (index >= 0) {
            updated = [...services];
            updated[index] = service;
        } else {
            updated = [...services, service];
        }

        await saveToCloud('extra_services', updated);
    }

    async delete(id: string): Promise<void> {
        const services = await this.getAll();
        const updated = services.filter(s => s.id !== id);
        await saveToCloud('extra_services', updated);
    }
}
