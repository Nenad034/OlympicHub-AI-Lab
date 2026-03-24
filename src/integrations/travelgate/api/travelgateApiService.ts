// =============================================================================
// Travelgate Hotel-X — API Service
// Endpoint: https://api.travelgate.com/
// Auth: Header "TGX-Auth-API-Key: {apiKey}"
// =============================================================================

import type {
    TravelgateConfig,
    TravelgateSearchCriteria,
    TravelgateSearchSettings,
    TravelgateSearchResponse,
    TravelgateOption,
    TravelgateQuoteCriteria,
    TravelgateQuoteResponse,
    TravelgateOptionQuote,
    TravelgateBookInput,
    TravelgateBookResponse,
    TravelgateBooking,
    TravelgateCancelInput,
    TravelgateCancelResponse,
    TravelgateBookingFilterInput,
    TravelgateBookingTypeInput,
} from '../types/travelgateTypes';

import {
    TRAVELGATE_SEARCH_QUERY,
    TRAVELGATE_QUOTE_QUERY,
    TRAVELGATE_BOOK_MUTATION,
    TRAVELGATE_CANCEL_MUTATION,
    TRAVELGATE_BOOKING_LIST_QUERY,
} from './travelgateQueries';

const DEFAULT_ENDPOINT = 'https://api.travelgate.com/';
const DEFAULT_TIMEOUT = 30000;

// ─── Rate limiter ─────────────────────────────────────────────────────────────
class RateLimiter {
    private callTimestamps: number[] = [];
    private readonly maxCallsPerMinute: number;

    constructor(maxPerMinute = 60) {
        this.maxCallsPerMinute = maxPerMinute;
    }

    async waitIfNeeded(): Promise<void> {
        const now = Date.now();
        this.callTimestamps = this.callTimestamps.filter(t => now - t < 60_000);
        if (this.callTimestamps.length >= this.maxCallsPerMinute) {
            const oldest = this.callTimestamps[0];
            const wait = 60_000 - (now - oldest);
            console.warn(`[Travelgate] Rate limit hit — waiting ${wait}ms`);
            await new Promise(resolve => setTimeout(resolve, wait));
        }
        this.callTimestamps.push(Date.now());
    }
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class TravelgateApiService {
    private readonly config: TravelgateConfig;
    private readonly endpoint: string;
    private readonly rateLimiter: RateLimiter;

    constructor(config: TravelgateConfig) {
        this.config = config;
        this.endpoint = config.endpoint || DEFAULT_ENDPOINT;
        this.rateLimiter = new RateLimiter(60);
    }

    // ─── isConfigured ─────────────────────────────────────────────────────────

    isConfigured(): boolean {
        return !!(this.config.apiKey && this.config.client);
    }

    // ─── Core GraphQL fetch ──────────────────────────────────────────────────

    private async graphql<T>(
        query: string,
        variables: Record<string, any>
    ): Promise<T> {
        await this.rateLimiter.waitIfNeeded();

        const controller = new AbortController();
        const timer = setTimeout(
            () => controller.abort(),
            this.config.timeout || DEFAULT_TIMEOUT
        );

        const PROXY_URL = 'https://corsproxy.io/?';
        const fullUrl = `${PROXY_URL}${this.endpoint}`;

        try {
            const response = await fetch(fullUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'TGX-Auth-API-Key': this.config.apiKey,
                },
                body: JSON.stringify({ query, variables }),
                signal: controller.signal,
            });

            clearTimeout(timer);

            if (!response.ok) {
                throw new Error(`[Travelgate] HTTP ${response.status}: ${response.statusText}`);
            }

            const json = await response.json() as T;
            return json;
        } catch (err: any) {
            clearTimeout(timer);
            if (err.name === 'AbortError') {
                throw new Error('[Travelgate] Request timeout');
            }
            throw err;
        }
    }

    // ─── Settings helper ─────────────────────────────────────────────────────

    private buildSettings(overrides?: Partial<TravelgateSearchSettings>) {
        return {
            client: this.config.client,
            context: this.config.client,
            testMode: false,
            auditTransactions: false,
            timeout: (this.config.timeout || DEFAULT_TIMEOUT),
            ...overrides,
        };
    }

    // ─── Search ───────────────────────────────────────────────────────────────

    async search(params: {
        criteria: TravelgateSearchCriteria;
        accesses?: string[];
    }): Promise<TravelgateOption[]> {
        console.log('[Travelgate] 🔍 AirShopping/Search...', params.criteria);

        const settings = this.buildSettings();
        // If accesses provided, set them as suppliers
        const filterSearch = params.accesses?.length
            ? { includes: [{ type: 'ACCESS', codes: params.accesses }] }
            : undefined;

        const response = await this.graphql<TravelgateSearchResponse>(
            TRAVELGATE_SEARCH_QUERY,
            {
                criteriaSearch: params.criteria,
                settings,
                filterSearch,
            }
        );

        this.throwIfGQLErrors(response);

        const search = response.data?.hotelX?.search;
        if (search?.errors?.length) {
            console.error('[Travelgate] Search errors:', search.errors);
        }

        const options = search?.options || [];
        console.log(`[Travelgate] ✅ Search: ${options.length} opcija pronađeno`);
        return options;
    }

    // ─── Quote ────────────────────────────────────────────────────────────────

    async quote(params: {
        criteria: TravelgateQuoteCriteria;
    }): Promise<TravelgateOptionQuote> {
        console.log('[Travelgate] 💰 Quote za optionRefId:', params.criteria.optionRefId.substring(0, 30) + '...');

        const response = await this.graphql<TravelgateQuoteResponse>(
            TRAVELGATE_QUOTE_QUERY,
            {
                criteriaQuote: params.criteria,
                settings: this.buildSettings(),
            }
        );

        this.throwIfGQLErrors(response);

        const quote = response.data?.hotelX?.quote;
        if (quote?.errors?.length) {
            throw new Error(`[Travelgate] Quote errors: ${quote.errors.map(e => e.description).join(', ')}`);
        }

        if (!quote?.optionQuote) {
            throw new Error('[Travelgate] Quote: nema optionQuote u odgovoru');
        }

        console.log('[Travelgate] ✅ Quote uspešan, status:', quote.optionQuote.status);
        return quote.optionQuote;
    }

    // ─── Book ─────────────────────────────────────────────────────────────────

    async book(input: TravelgateBookInput): Promise<TravelgateBooking> {
        console.log('[Travelgate] 📋 Kreiranje rezervacije, ref:', input.clientReference);

        const response = await this.graphql<TravelgateBookResponse>(
            TRAVELGATE_BOOK_MUTATION,
            {
                bookInput: input,
                settings: {
                    ...this.buildSettings(),
                    timeout: 180_000, // Book max 180s
                },
            }
        );

        this.throwIfGQLErrors(response);

        const book = response.data?.hotelX?.book;
        if (book?.errors?.length) {
            throw new Error(`[Travelgate] Book errors: ${book.errors.map(e => e.description).join(', ')}`);
        }

        if (!book?.booking) {
            throw new Error('[Travelgate] Book: nema booking u odgovoru');
        }

        console.log('[Travelgate] ✅ Rezervacija kreirana, status:', book.booking.status, '| ID:', book.booking.id);
        return book.booking;
    }

    // ─── Cancel ───────────────────────────────────────────────────────────────

    async cancel(input: TravelgateCancelInput): Promise<TravelgateBooking> {
        console.log('[Travelgate] ❌ Otkazivanje rezervacije:', input.bookingID);

        const response = await this.graphql<TravelgateCancelResponse>(
            TRAVELGATE_CANCEL_MUTATION,
            {
                cancelInput: input,
                settings: this.buildSettings(),
            }
        );

        this.throwIfGQLErrors(response);

        const cancel = response.data?.hotelX?.cancel;
        if (cancel?.errors?.length) {
            throw new Error(`[Travelgate] Cancel errors: ${cancel.errors.map(e => e.description).join(', ')}`);
        }

        if (!cancel?.booking) {
            throw new Error('[Travelgate] Cancel: nema booking u odgovoru');
        }

        console.log('[Travelgate] ✅ Rezervacija otkazana, status:', cancel.booking.status);
        return cancel.booking;
    }

    // ─── Booking List ─────────────────────────────────────────────────────────

    async getBookingList(
        filter: TravelgateBookingFilterInput,
        bookingType?: TravelgateBookingTypeInput
    ): Promise<TravelgateBooking[]> {
        console.log('[Travelgate] 📋 Lista rezervacija...');

        const response = await this.graphql<any>(
            TRAVELGATE_BOOKING_LIST_QUERY,
            {
                filterBookingList: filter,
                bookingType,
                settings: this.buildSettings(),
            }
        );

        this.throwIfGQLErrors(response);

        const bookings = response.data?.hotelX?.bookingList?.bookings || [];
        console.log(`[Travelgate] ✅ ${bookings.length} rezervacija pronađeno`);
        return bookings;
    }

    // ─── Error handling ───────────────────────────────────────────────────────

    private throwIfGQLErrors(response: any): void {
        if (response.errors?.length) {
            const messages = response.errors.map((e: any) => e.message).join('; ');
            throw new Error(`[Travelgate] GraphQL error: ${messages}`);
        }
    }
}

// ─── Singleton factory ────────────────────────────────────────────────────────

let _instance: TravelgateApiService | null = null;

export function getTravelgateApiService(config?: TravelgateConfig): TravelgateApiService {
    if (!_instance) {
        const cfg: TravelgateConfig = config || {
            apiKey: import.meta.env.VITE_TRAVELGATE_API_KEY || 'test0000-0000-0000-0000-000000000000',
            client: import.meta.env.VITE_TRAVELGATE_CLIENT || 'client_demo',
            endpoint: import.meta.env.VITE_TRAVELGATE_ENDPOINT || DEFAULT_ENDPOINT,
            timeout: 30_000,
        };
        _instance = new TravelgateApiService(cfg);
    }
    return _instance;
}

export function resetTravelgateApiService(): void {
    _instance = null;
}

export default TravelgateApiService;
