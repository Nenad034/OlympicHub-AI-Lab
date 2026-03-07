/**
 * Search Prefetch Service (Singleton)
 *
 * Lives OUTSIDE React render cycle - no stale closures, no double-firing.
 * Supports MULTIPLE subscribers (SmartSearch + GlobalHubSearch can both listen).
 * Guarantees that only ONE fetch runs at a time for a given key.
 */

import { performSmartSearch, type SmartSearchResult } from './smartSearchService';
import { getMonthlyReservationCount, getBulkMonthlyReservationCounts } from './reservationService';

interface PrefetchParams {
    destinations: Array<{ id: string | number; name: string; type: 'destination' | 'hotel' | 'country' | 'city'; provider?: string }>;
    checkIn: string;
    checkOut: string;
    allocations: Array<{ adults: number; children: number; childrenAges: number[] }>;
    mealPlan: string;
    nationality: string;
    searchType: string;
    enabledProviders?: Record<string, boolean>;
}

type PrefetchCallback = (results: SmartSearchResult[], key: string) => void;
type SimpleCallback = () => void;

interface Subscriber {
    id: string;
    onComplete: PrefetchCallback;
    onStart?: SimpleCallback;
    onEnd?: SimpleCallback;
}

class SearchPrefetchService {
    private debounceTimer: ReturnType<typeof setTimeout> | null = null;
    private abortController: AbortController | null = null;

    // The key that is currently FETCHING or was last successfully fetched
    private inFlightPromise: Promise<SmartSearchResult[]> | null = null;
    private subscribers: Map<string, Subscriber> = new Map();
    private currentKey: string = '';
    private fetchingKey: string = '';

    /** Build a stable cache key from params */
    buildKey(params: PrefetchParams): string {
        const activeAllocations = params.allocations.filter(r => r.adults > 0);
        return [
            params.destinations.map(d => d.id).sort().join(','),
            params.checkIn,
            params.checkOut,
            JSON.stringify(activeAllocations),
            params.mealPlan,
            params.nationality,
            params.searchType
        ].join('|');
    }

    /** Registration of subscribers */
    subscribe(id: string, callbacks: {
        onComplete: PrefetchCallback;
        onStart?: SimpleCallback;
        onEnd?: SimpleCallback;
    }): () => void {
        this.subscribers.set(id, { id, ...callbacks });
        return () => {
            this.subscribers.delete(id);
        };
    }

    /** Schedule a pre-fetch. Debounced - safe to call on every state change. */
    schedule(params: PrefetchParams, debounceMs = 1200): void {
        const hasBroadSearch = params.destinations.some(d => d.type === 'country');
        const activeAllocations = params.allocations.filter(r => r.adults > 0);

        if (
            params.destinations.length === 0 ||
            !params.checkIn ||
            !params.checkOut ||
            activeAllocations.length === 0 ||
            hasBroadSearch
        ) {
            return;
        }

        const key = this.buildKey(params);
        if (this.currentKey === key && this.fetchingKey === '') return;
        if (this.fetchingKey === key) return;

        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = null;
        }

        this.debounceTimer = setTimeout(() => {
            this.debounceTimer = null;
            this.execute(params, key);
        }, debounceMs);
    }

    /** Check if a search is in flight for a specific key */
    getInFlight(key: string): Promise<SmartSearchResult[]> | null {
        if (this.fetchingKey === key && this.inFlightPromise) {
            return this.inFlightPromise;
        }
        return null;
    }

    /** Cancel any pending debounce and in-flight fetch */
    cancel(): void {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = null;
        }
        if (this.abortController) {
            this.abortController.abort();
            this.abortController = null;
        }
        this.fetchingKey = '';
        this.inFlightPromise = null;
    }

    private notifyStart(): void {
        this.subscribers.forEach(s => s.onStart?.());
    }

    private notifyEnd(): void {
        this.subscribers.forEach(s => s.onEnd?.());
    }

    private notifyComplete(results: SmartSearchResult[], key: string): void {
        this.subscribers.forEach(s => s.onComplete(results, key));
    }

    /** Allow components to manually update the latest results (e.g., after a direct search) */
    notifyResultsUpdated(results: SmartSearchResult[]): void {
        this.currentKey = 'direct-update';
        this.notifyComplete(results, this.currentKey);
    }

    private async execute(params: PrefetchParams, key: string): Promise<void> {
        if (this.fetchingKey === key) return;

        if (this.abortController) {
            this.abortController.abort();
        }
        this.abortController = new AbortController();

        this.fetchingKey = key;
        this.notifyStart();

        console.log(`[PrefetchService] Starting pre-fetch for key: ${key.substring(0, 60)}...`);

        this.inFlightPromise = (async () => {
            try {
                const activeAllocations = params.allocations.filter(r => r.adults > 0);
                const results = await performSmartSearch({
                    searchType: params.searchType as any,
                    destinations: params.destinations.map(d => ({
                        id: String(d.id).replace('solvex-c-', ''),
                        name: d.name,
                        type: d.type
                    })),
                    checkIn: params.checkIn,
                    checkOut: params.checkOut,
                    rooms: activeAllocations,
                    mealPlan: params.mealPlan || '',
                    currency: 'EUR',
                    nationality: params.nationality || 'RS',
                    enabledProviders: params.enabledProviders,
                    abortSignal: this.abortController!.signal
                });

                // NOTIFY IMMEDIATELY with raw results for instant UI response
                if (this.fetchingKey === key) {
                    console.log(`[PrefetchService] ⚡ Instant notify: ${results.length} results`);
                    this.notifyComplete(results, key);
                }

                // THEN enrich with CRM sales data via single bulk request
                let counts: Record<string, number> = {};
                try {
                    const hotelNames = results.map(h => h.name);
                    counts = await getBulkMonthlyReservationCounts(hotelNames);
                } catch (e) {
                    console.error('[PrefetchService] Bulk data error', e);
                }

                const enriched = results.map((h) => ({
                    ...h,
                    salesCount: counts[h.name] || 0
                }));

                return enriched;
            } catch (error) {
                throw error;
            }
        })();

        try {
            const enriched = await this.inFlightPromise;

            if (this.fetchingKey !== key) return;

            this.currentKey = key;
            console.log(`[PrefetchService] ✅ Enrichment complete: ${enriched.length} results`);
            this.notifyComplete(enriched, key);
        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                console.log('[PrefetchService] Fetch aborted.');
            } else {
                console.error('[PrefetchService] Pre-fetch failed:', error);
                if (this.fetchingKey === key) this.currentKey = '';
            }
        } finally {
            if (this.fetchingKey === key) {
                this.fetchingKey = '';
                this.inFlightPromise = null;
            }
            this.notifyEnd();
        }
    }
}

// Singleton instance - shared across SmartSearch and GlobalHubSearch
export const searchPrefetchService = new SearchPrefetchService();
