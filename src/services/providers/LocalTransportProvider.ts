/**
 * Local Transport Provider
 * 
 * Uses the existing cloud/local storage for transport segments.
 */

import type { TransportProvider, TransportSearchParams, TransportSegment } from './TransportProviderInterface';
import { saveToCloud, loadFromCloud } from '../../utils/storageUtils';

export class LocalTransportProvider implements TransportProvider {
    readonly name = 'Local';
    readonly isActive = true;

    async search(params: TransportSearchParams): Promise<TransportSegment[]> {
        const segments = await this.getAll();
        return segments.filter(s => {
            const matchesType = !params.type || s.type === params.type;
            const matchesFrom = !params.fromCity || s.fromCity.toLowerCase().includes(params.fromCity.toLowerCase());
            const matchesTo = !params.toCity || s.toCity.toLowerCase().includes(params.toCity.toLowerCase());
            return matchesType && matchesFrom && matchesTo;
        });
    }

    async getAll(): Promise<TransportSegment[]> {
        const { success, data } = await loadFromCloud('transport_segments');
        return success && data ? (data as any[]).map(s => ({ ...s, providerName: this.name })) : [];
    }

    async save(segment: TransportSegment): Promise<void> {
        const segments = await this.getAll();
        const index = segments.findIndex(s => s.id === segment.id);

        let updated;
        if (index >= 0) {
            updated = [...segments];
            updated[index] = segment;
        } else {
            updated = [...segments, segment];
        }

        await saveToCloud('transport_segments', updated);
    }

    async delete(id: string): Promise<void> {
        const segments = await this.getAll();
        const updated = segments.filter(s => s.id !== id);
        await saveToCloud('transport_segments', updated);
    }
}
