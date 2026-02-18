/**
 * Search Prefetch Service (Singleton)
 *
 * Lives OUTSIDE React render cycle - no stale closures, no double-firing.
 * Supports MULTIPLE subscribers (SmartSearch + GlobalHubSearch can both listen).
 * Guarantees that only ONE fetch runs at a time for a given key.
 */

import { performSmartSearch, type SmartSearchResult } from './smartSearchService';
import { getMonthlyReservationCount } from './reservationService';

interface PrefetchParams {
    destinations: Array<{ id: string; name: string; type: 'destination' | 'hotel' | 'country'; provider?: string }>;
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
    private currentKey: string = '';
    // The key that is currently IN-FLIGHT (being fetched right now)
    private fetchingKey: string = '';

    private subscribers: Map<string, Subscriber> = new Map();

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

    /**
     * Register a subscriber. Returns an unsubscribe function.
     * Each page (SmartSearch, GlobalHub) registers separately.
     */
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
    schedule(params: PrefetchParams, debounceMs = 200): void {
        // Skip country-level searches (too broad)
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

        // Already successfully fetched this exact key - nothing to do
        if (this.currentKey === key && this.fetchingKey === '') {
            return;
        }

        // Already fetching this exact key - don't queue another
        if (this.fetchingKey === key) {
            return;
        }

        // Cancel pending debounce (a newer schedule call supersedes this one)
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = null;
        }

        this.debounceTimer = setTimeout(() => {
            this.debounceTimer = null;
            this.execute(params, key);
        }, debounceMs);
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

    private async execute(params: PrefetchParams, key: string): Promise<void> {
        // Guard: if already fetching this key, skip entirely
        if (this.fetchingKey === key) {
            console.log(`[PrefetchService] Already fetching key, skipping duplicate.`);
            return;
        }

        // Abort any previous in-flight request
        if (this.abortController) {
            this.abortController.abort();
        }
        this.abortController = new AbortController();

        this.fetchingKey = key;
        this.notifyStart();

        console.log(`[PrefetchService] Starting pre-fetch for key: ${key.substring(0, 60)}...`);

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
                abortSignal: this.abortController.signal
            });

            // Check if superseded by a newer request
            if (this.fetchingKey !== key) {
                console.log('[PrefetchService] Result superseded, discarding.');
                return;
            }

            // Enrich with CRM sales data so cache is fully ready for instant display
            const enriched = await Promise.all(
                results.map(async (h) => {
                    const count = await getMonthlyReservationCount(h.name);
                    return { ...h, salesCount: count };
                })
            );

            // Final check after async enrichment
            if (this.fetchingKey !== key) {
                console.log('[PrefetchService] Enrichment superseded, discarding.');
                return;
            }

            this.currentKey = key;
            console.log(`[PrefetchService] ✅ Pre-fetch complete: ${enriched.length} results`);
            this.notifyComplete(enriched, key);

        } catch (error) {
            if (error instanceof Error && error.name === 'AbortError') {
                console.log('[PrefetchService] Fetch aborted.');
            } else {
                console.error('[PrefetchService] Pre-fetch failed:', error);
                // Reset so next attempt will retry
                if (this.fetchingKey === key) {
                    this.currentKey = '';
                }
            }
        } finally {
            if (this.fetchingKey === key) {
                this.fetchingKey = '';
            }
            this.notifyEnd();
        }
    }
}

// Singleton instance - shared across SmartSearch and GlobalHubSearch
export const searchPrefetchService = new SearchPrefetchService();
