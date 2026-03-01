// =============================================================================
// TravelgateProvider — HotelProvider Interface Adapter
// Implements the HotelProvider interface for Travelgate Hotel-X GraphQL API
// =============================================================================

import type {
    HotelProvider,
    HotelSearchParams,
    HotelSearchResult,
    RoomOption,
} from '../../services/providers/HotelProviderInterface';

import { getTravelgateApiService } from './api/travelgateApiService';
import { mapTravelgateOptionToHotelResult } from './mappers/travelgateMapper';
import type { TravelgateSearchCriteria } from './types/travelgateTypes';

export class TravelgateProvider implements HotelProvider {
    readonly name = 'Travelgate';
    readonly isActive = true;

    private get api() {
        return getTravelgateApiService();
    }

    // ─── isConfigured ─────────────────────────────────────────────────────────

    isConfigured(): boolean {
        return this.api.isConfigured();
    }

    // ─── authenticate ─────────────────────────────────────────────────────────
    // Travelgate koristi API Key autentikaciju — nema token/login koraka

    async authenticate(): Promise<void> {
        if (!this.api.isConfigured()) {
            throw new Error('[TravelgateProvider] API Key nije konfigurisan. Postavite VITE_TRAVELGATE_API_KEY.');
        }
        // API Key je statičan — nema ništa da radimo
        console.log('✅ Travelgate provider ready (API Key auth)');
    }

    // ─── search ───────────────────────────────────────────────────────────────

    async search(params: HotelSearchParams): Promise<HotelSearchResult[]> {
        const checkIn = this.formatDate(params.checkIn);
        const checkOut = this.formatDate(params.checkOut);

        // Gradimo Travelgate-specifični criteria
        const criteria: TravelgateSearchCriteria = {
            checkIn,
            checkOut,
            occupancies: this.buildOccupancies(params),
            currency: params.currency || 'EUR',
            markets: ['RS', 'ES', 'DE'], // Default markets
            nationality: params.nationality || 'RS',
            language: 'en',
        };

        // Hotel kodovi iz providerId ili destination
        if (params.providerId) {
            criteria.hotels = [String(params.providerId)];
        } else if (params.destination) {
            // Destination search — ovde bi trebao destination plugin
            // Za sada koristimo destination kao hotel code
            criteria.hotels = [params.destination];
        }

        // Test accesses (HOTELTEST provider)
        const testAccesses = ['2', '5647'];

        const options = await this.api.search({
            criteria,
            accesses: testAccesses,
        });

        // Map to unified format
        return options.map(option =>
            mapTravelgateOptionToHotelResult(option, checkIn, checkOut) as unknown as HotelSearchResult
        );
    }

    // ─── getHotelDetails ──────────────────────────────────────────────────────

    async getHotelDetails(hotelId: string): Promise<HotelSearchResult> {
        // Travelgate nema direktan "hotel details" endpoint van searchaovog
        throw new Error(`[TravelgateProvider] getHotelDetails nije direktno podržan. Koristite search sa hotelId: ${hotelId}`);
    }

    // ─── getCancellationPolicy ────────────────────────────────────────────────

    async getCancellationPolicy(room: RoomOption, _abortSignal?: AbortSignal): Promise<any> {
        // Storno politika dolazi iz Quote operacije
        const optionRefId = room.tariff?.optionRefId || room.id;
        if (!optionRefId) {
            return null;
        }
        try {
            const quoted = await this.api.quote({ criteria: { optionRefId } });
            return quoted.cancelPolicy;
        } catch {
            return null;
        }
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private formatDate(date: Date): string {
        return date.toISOString().split('T')[0];
    }

    private buildOccupancies(params: HotelSearchParams) {
        const numRooms = params.rooms || 1;
        const occupancies = [];

        for (let i = 0; i < numRooms; i++) {
            const paxes = [];

            // Adults
            for (let a = 0; a < (params.adults || 2); a++) {
                paxes.push({ age: 30 });
            }

            // Children
            if (params.children && params.childrenAges?.length) {
                for (const age of params.childrenAges) {
                    paxes.push({ age });
                }
            } else if (params.children) {
                for (let c = 0; c < params.children; c++) {
                    paxes.push({ age: 8 });
                }
            }

            occupancies.push({ paxes });
        }

        return occupancies;
    }
}

// Singleton
let _providerInstance: TravelgateProvider | null = null;

export function getTravelgateProvider(): TravelgateProvider {
    if (!_providerInstance) {
        _providerInstance = new TravelgateProvider();
    }
    return _providerInstance;
}

export default TravelgateProvider;
