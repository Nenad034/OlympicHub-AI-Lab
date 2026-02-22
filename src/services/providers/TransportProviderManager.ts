/**
 * Transport Provider Manager
 */

import type { TransportProvider, TransportSearchParams, TransportSegment } from './TransportProviderInterface';
import { LocalTransportProvider } from './LocalTransportProvider';

export class TransportProviderManager {
    private providers: Map<string, TransportProvider> = new Map();

    constructor() {
        this.registerProvider(new LocalTransportProvider());
    }

    registerProvider(provider: TransportProvider): void {
        this.providers.set(provider.name, provider);
    }

    async getAllSegments(): Promise<TransportSegment[]> {
        const local = this.providers.get('Local');
        if (local && local.getAll) {
            return local.getAll();
        }
        return [];
    }

    async saveSegment(segment: TransportSegment): Promise<void> {
        const local = this.providers.get('Local');
        if (local && local.save) {
            await local.save(segment);
        }
    }

    async deleteSegment(id: string): Promise<void> {
        const local = this.providers.get('Local');
        if (local && local.delete) {
            await local.delete(id);
        }
    }
}

const instance = new TransportProviderManager();
export const transportProviderManager = instance;
export default transportProviderManager;
