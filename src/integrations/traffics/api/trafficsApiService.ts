import type {
    TrafficsCredentials,
    TrafficsServiceConfig,
    TrafficsHotelSearchParams,
    TrafficsHotelSearchResponse,
    TrafficsHotelListItem,
    TrafficsTopHotelsParams,
    TrafficsTopHotelsResponse,
    TrafficsHotelContent,
    TrafficsDeeplinkParams,
    TrafficsProductType,
    TrafficsLanguage,
    TrafficsCurrency,
    TrafficsFlight,
    TrafficsTransfer,
    TrafficsBoardTypeInfo,
    TrafficsTourOperator,
} from '../types/trafficsTypes';

// ─── Base URL ─────────────────────────────────────────────────────────────────

const TRAFFICS_API_BASE = 'https://ibe.traffics.de/api/v3/rest/feeds';

// ─── Tour operatori (dobavljači) prisutni u Traffics mreži ───────────────────
// Svaki paket/ponuda u API-ju nosi tourOperator objekat.
// Ispod su STVARNI tur-operatori koji rade sa Traffics sistemom.
const TOUR_OPERATORS: Record<string, TrafficsTourOperator> = {
    TUI: {
        code: 'TUI',
        name: 'TUI Deutschland',
        brandColor: '#e2001a',
        websiteUrl: 'https://www.tui.com',
        description: 'Najveći evropski tur-operator. Paket aranžmani u sve ključne destinacije.',
    },
    DER: {
        code: 'DER',
        name: 'Dertour',
        brandColor: '#003087',
        websiteUrl: 'https://www.dertour.de',
        description: 'REWE Touristik — premium destinacije, individualna putovanja.',
    },
    NCK: {
        code: 'NCK',
        name: 'Neckermann Reisen',
        brandColor: '#ff6600',
        websiteUrl: 'https://www.neckermann-reisen.de',
        description: 'Thomas Cook Group — povoljni all-inclusive paketi.',
    },
    FTI: {
        code: 'FTI',
        name: 'FTI Touristik',
        brandColor: '#009fe3',
        websiteUrl: 'https://www.fti.de',
        description: 'Treći najveći nemački tur-operator. Široka ponuda paketa.',
    },
    ALT: {
        code: 'ALT',
        name: 'alltours',
        brandColor: '#f7a600',
        websiteUrl: 'https://www.alltours.de',
        description: 'Povoljni sun & beach paketi za celu porodicu.',
    },
    ITS: {
        code: 'ITS',
        name: 'ITS Coop Travel',
        brandColor: '#e2001a',
        websiteUrl: 'https://www.its.de',
        description: 'Coop Travel — svestrana ponuda letovanjskih paketa.',
    },
    BGM: {
        code: 'BGM',
        name: 'Berge & Meer',
        brandColor: '#1a6b3c',
        websiteUrl: 'https://www.berge-meer.de',
        description: 'Premium tur-operator — egzotične i luksuzne destinacije.',
    },
    LTR: {
        code: 'LTR',
        name: 'Ltur',
        brandColor: '#6600cc',
        websiteUrl: 'https://www.ltur.com',
        description: 'Last minute i early booking specijalist.',
    },
};

// ─── Servis ───────────────────────────────────────────────────────────────────

export class TrafficsApiService {
    private credentials: TrafficsCredentials | null = null;
    private apiBaseUrl: string = TRAFFICS_API_BASE;
    private ibeBaseUrl: string = 'https://ibe.traffics.de';
    private defaultLanguage: TrafficsLanguage = 'en';
    private defaultCurrency: TrafficsCurrency = 'EUR';

    // ─── Konfiguracija ────────────────────────────────────────────────

    configure(config: TrafficsServiceConfig): void {
        this.credentials = config.credentials;
        if (config.apiBaseUrl) this.apiBaseUrl = config.apiBaseUrl;
        if (config.ibeBaseUrl) this.ibeBaseUrl = config.ibeBaseUrl;
        if (config.defaultLanguage) this.defaultLanguage = config.defaultLanguage;
        if (config.defaultCurrency) this.defaultCurrency = config.defaultCurrency;
        console.log(`[Traffics] Konfigurisan — env: ${config.credentials.environment}, licence: ${config.credentials.licenceNumber.slice(0, 4)}****`);
    }

    isConfigured(): boolean {
        return !!this.credentials?.licenceNumber;
    }

    getEnvironment(): string {
        return this.credentials?.environment ?? 'sandbox';
    }

    getLicenceNumber(): string {
        return this.credentials?.licenceNumber ?? '';
    }

    // ─── Mock delay ───────────────────────────────────────────────────

    private async mockDelay(ms = 700): Promise<void> {
        await new Promise(resolve => setTimeout(resolve, ms));
    }

    // ─── Licence helper ───────────────────────────────────────────────

    private getLicence(): string {
        if (!this.credentials?.licenceNumber) {
            throw new Error('[Traffics] Servis nije konfigurisan. Pozovite configure() najpre.');
        }
        return this.credentials.licenceNumber;
    }

    // ═══════════════════════════════════════════════════════════════════
    //  HOTELS — SEARCH
    //  Live: GET /hotels?licence=XXXX&productType=pauschal|hotelonly&...
    //
    //  Ključna razlika:
    //  - productType=hotelonly → vraća samo hotelske cene
    //  - productType=pauschal  → vraća paket (avion+hotel+transfer)
    //    Odgovor sadrži bestPriceFlight (let) i transferList (transferi)
    // ═══════════════════════════════════════════════════════════════════

    async searchHotels(params: Omit<TrafficsHotelSearchParams, 'licence'>): Promise<TrafficsHotelSearchResponse> {
        const _licence = this.getLicence();
        const isPauschal = (params.productType ?? 'hotelonly') === 'pauschal';
        console.log(`[Traffics] Pretraga hotela — tip: ${isPauschal ? '✈️ PAKET (pauschal)' : '🏨 hotelonly'}`, params);
        await this.mockDelay(900);

        let filtered = this.mockHotelList(isPauschal);
        const page = params.page ?? 0;
        const pageSize = params.pageSize ?? 10;

        if (params.category) {
            filtered = filtered.filter(h => (h.category ?? 0) >= params.category!);
        }
        if (params.minPrice) {
            filtered = filtered.filter(h => (h.bestPricePerPerson ?? 0) >= params.minPrice!);
        }
        if (params.maxPrice) {
            filtered = filtered.filter(h => (h.bestPricePerPerson ?? 0) <= params.maxPrice!);
        }
        if (params.sortBy === 'price') {
            filtered.sort((a, b) => (a.bestPricePerPerson ?? 0) - (b.bestPricePerPerson ?? 0));
        } else if (params.sortBy === 'category') {
            filtered.sort((a, b) => (b.category ?? 0) - (a.category ?? 0));
        }

        const paged = filtered.slice(page * pageSize, page * pageSize + pageSize);

        return {
            totalResultCount: filtered.length,
            page,
            pageSize,
            hotelList: paged,
        };
    }

    // ═══════════════════════════════════════════════════════════════════
    //  HOTELS — TOP
    //  Live: GET /hotels/top?licence=XXXX&regionId=...
    // ═══════════════════════════════════════════════════════════════════

    async getTopHotels(params: Omit<TrafficsTopHotelsParams, 'licence'>): Promise<TrafficsTopHotelsResponse> {
        const _licence = this.getLicence();
        const isPauschal = (params.productType ?? 'hotelonly') === 'pauschal';
        console.log(`[Traffics] Top hoteli za region: ${params.regionId} (${isPauschal ? 'pauschal' : 'hotelonly'})`);
        await this.mockDelay(700);

        const all = this.mockHotelList(isPauschal);
        const top = all.filter(h => !params.category || (h.category ?? 0) >= params.category);
        const sorted = top.sort((a, b) => (b.category ?? 0) - (a.category ?? 0)).slice(0, 6);

        return {
            totalResultCount: sorted.length,
            hotelList: sorted,
        };
    }

    // ═══════════════════════════════════════════════════════════════════
    //  HOTELS — CONTENT (Static)
    //  Live: GET /hotels/{giataId}?licence=XXXX
    // ═══════════════════════════════════════════════════════════════════

    async getHotelContent(giataId: string): Promise<TrafficsHotelContent> {
        this.getLicence();
        console.log('[Traffics] Sadržaj hotela:', giataId);
        await this.mockDelay(600);
        return this.mockHotelContent(giataId);
    }

    // ═══════════════════════════════════════════════════════════════════
    //  IBE DEEP LINKS
    //  Docs: https://ibe-dokumentation.traffics.de
    //
    //  Za paket aranžmane koristiti travelType='pauschalreise'
    //  Za hotelonly koristiti travelType='hotel'
    // ═══════════════════════════════════════════════════════════════════

    generateDeeplink(params: TrafficsDeeplinkParams): string {
        const base = params.ibeBaseUrl || this.ibeBaseUrl;
        const path = `/${params.travelType}/${params.view}`;
        const query = new URLSearchParams();

        if (params.regionList) query.set('regionList', params.regionList);
        if (params.destinationName) query.set('destinationName', params.destinationName);
        if (params.minCategory) query.set('minCategory', String(params.minCategory));
        if (params.searchDate) query.set('searchDate', params.searchDate);
        if (params.adults) query.set('adults', String(params.adults));
        if (params.children) query.set('children', params.children);
        if (params.sortBy) query.set('sortBy', params.sortBy);
        if (params.departureAirport) query.set('departureAirport', params.departureAirport);

        const queryString = query.toString();
        return `${base}${path}${queryString ? '?' + queryString : ''}`;
    }

    generateRegionsLink(travelType: TrafficsProductType = 'hotelonly', searchParams?: {
        adults?: number;
        fromDate?: string;
        toDate?: string;
        nights?: number;
        minCategory?: number;
        sortBy?: 'price' | 'category' | 'quality';
        departureAirport?: string;
    }): string {
        let searchDate = '';
        if (searchParams?.fromDate && searchParams?.toDate && searchParams?.nights) {
            const from = searchParams.fromDate.replace(/(\d{2})(\d{2})(\d{4})/, (_, d, m, y) => `${d}${m}${y.slice(2)}`);
            const to = searchParams.toDate.replace(/(\d{2})(\d{2})(\d{4})/, (_, d, m, y) => `${d}${m}${y.slice(2)}`);
            searchDate = `${from},${to},${searchParams.nights}`;
        }

        return this.generateDeeplink({
            travelType: travelType === 'pauschal' ? 'pauschalreise' : 'hotel',
            view: 'regionen',
            ibeBaseUrl: this.ibeBaseUrl,
            searchDate: searchDate || undefined,
            adults: searchParams?.adults,
            minCategory: searchParams?.minCategory,
            sortBy: searchParams?.sortBy,
            departureAirport: searchParams?.departureAirport,
        });
    }

    // ═══════════════════════════════════════════════════════════════════
    //  MOCK DATA
    // ═══════════════════════════════════════════════════════════════════

    /**
     * Mock let za paket aranžman (productType=pauschal)
     * Realan primer outbound leta BEG → destinacija
     */
    private mockFlight(destAirport: string, destCityName: string, isPauschal: boolean): TrafficsFlight | undefined {
        if (!isPauschal) return undefined;

        type AirlineInfo = { code: string; name: string };
        const airlines: Record<string, AirlineInfo> = {
            PMI: { code: 'VY', name: 'Vueling Airlines' },
            TFS: { code: 'TOM', name: 'TUI Airways' },
            ZTH: { code: 'A3', name: 'Aegean Airlines' },
            BJV: { code: 'PC', name: 'Pegasus Airlines' },
            DBV: { code: 'OU', name: 'Croatia Airlines' },
            FAO: { code: 'FR', name: 'Ryanair' },
            SSH: { code: 'XQ', name: 'SunExpress' },
        };
        const durationMap: Record<string, number> = {
            SSH: 255, BJV: 210, FAO: 195, TFS: 300, PMI: 140, ZTH: 130, DBV: 85,
        };

        const airline = airlines[destAirport] ?? { code: 'W6', name: 'Wizz Air' };
        const duration = durationMap[destAirport] ?? 150;
        const arrHour = Math.floor((7 * 60 + 15 + duration) / 60);
        const arrMin = (7 * 60 + 15 + duration) % 60;
        const arrTime = `${String(arrHour).padStart(2, '0')}:${String(arrMin).padStart(2, '0')}`;

        return {
            direction: 'outbound',
            segments: [
                {
                    departureAirport: 'BEG',
                    departureAirportName: 'Beograd Nikola Tesla',
                    arrivalAirport: destAirport,
                    arrivalAirportName: destCityName,
                    departureDateTime: '2026-06-01T07:15:00',
                    arrivalDateTime: `2026-06-01T${arrTime}:00`,
                    airlineCode: airline.code,
                    airlineName: airline.name,
                    flightNumber: `${airline.code}${1000 + Math.abs(destAirport.charCodeAt(0) - 65) * 37 % 8999}`,
                    durationMinutes: duration,
                    cabinClass: 'economy',
                    isDirect: true,
                }
            ],
            totalDurationMinutes: duration,
            stops: 0,
            pricePerPerson: 149,
            includedBaggageKg: 23,
            handBaggageKg: 7,
        };
    }

    private mockTransfer(isPauschal: boolean): TrafficsTransfer[] {
        if (!isPauschal) return [];
        return [
            {
                type: 'SHARED_SHUTTLE',
                name: 'Deljeni autobus aerodrom — hotel (round trip)',
                price: 38,
                pricePerPerson: 19,
                durationMinutes: 30,
                included: false,
                description: 'Deljeni minibus transfer sa aerodroma do hotela i nazad. Polazak svakih 30 minuta.',
            },
            {
                type: 'PRIVATE_TRANSFER',
                name: 'Privatni transfer (VIP)',
                price: 120,
                pricePerPerson: 60,
                durationMinutes: 20,
                included: false,
                description: 'Privatni kombi/sedan — direktno bez čekanja.',
            },
        ];
    }

    private mockBoard(code: 'AI' | 'HB' | 'BB' | 'RO' | 'UAI'): TrafficsBoardTypeInfo {
        const names: Record<string, string> = {
            RO: 'Room Only', BB: 'Bed & Breakfast', HB: 'Polupansion',
            FB: 'Puni pansion', AI: 'All Inclusive', UAI: 'Ultra All Inclusive',
        };
        return { code, name: names[code] };
    }

    private mockHotelList(isPauschal = false): TrafficsHotelListItem[] {
        const ai = this.mockBoard('AI');
        const uai = this.mockBoard('UAI');
        const hb = this.mockBoard('HB');
        const flight = (ap: string, name: string) => this.mockFlight(ap, name, isPauschal);
        const transfers = () => this.mockTransfer(isPauschal);
        const surcharge = isPauschal ? 149 : undefined;
        const ot: TrafficsProductType = isPauschal ? 'pauschal' : 'hotelonly';
        const op = (code: string) => isPauschal ? TOUR_OPERATORS[code] : undefined;

        return [
            {
                code: 'TRF-MAL-001', name: 'Riu Concordia', category: 4,
                location: { city: 'Playa de Palma', country: 'Spain', countryCode: 'ES', latitude: 39.515, longitude: 2.733 },
                region: { id: '133', name: 'Mallorca' },
                bestPricePerPerson: isPauschal ? 638 : 489, totalPrice: isPauschal ? 1276 : 978,
                currency: 'EUR', airportList: [{ code: 'PMI', name: 'Palma de Mallorca' }],
                giata: { id: '12344' }, description: 'Modern all-inclusive hotel on Playa de Palma with spectacular sea views.',
                bookable: true, departureDate: '2026-06-01', returnDate: '2026-06-08', nights: 7,
                boardType: ai, offerType: ot, tourOperator: op('TUI'),
                bestPriceFlight: flight('PMI', 'Palma de Mallorca'), transferList: transfers(),
                flightSurchargePerPerson: surcharge, packageTotalPrice: isPauschal ? 1276 : undefined,
            },
            {
                code: 'TRF-MAL-002', name: 'Iberostar Selection Playa de Palma', category: 5,
                location: { city: 'Playa de Palma', country: 'Spain', countryCode: 'ES', latitude: 39.512, longitude: 2.735 },
                region: { id: '133', name: 'Mallorca' },
                bestPricePerPerson: isPauschal ? 898 : 749, totalPrice: isPauschal ? 1796 : 1498,
                currency: 'EUR', airportList: [{ code: 'PMI', name: 'Palma de Mallorca' }],
                giata: { id: '12567' }, description: '5-star beachfront resort with private beach and multiple pools.',
                bookable: true, departureDate: '2026-06-01', returnDate: '2026-06-08', nights: 7,
                boardType: uai, offerType: ot, tourOperator: op('DER'),
                bestPriceFlight: flight('PMI', 'Palma de Mallorca'), transferList: transfers(),
                flightSurchargePerPerson: surcharge, packageTotalPrice: isPauschal ? 1796 : undefined,
            },
            {
                code: 'TRF-TNF-001', name: 'Bahía Príncipe Grand Tenerife', category: 5,
                location: { city: 'San Miguel de Abona', country: 'Spain', countryCode: 'ES', latitude: 28.056, longitude: -16.622 },
                region: { id: '210', name: 'Tenerife' },
                bestPricePerPerson: isPauschal ? 738 : 589, totalPrice: isPauschal ? 1476 : 1178,
                currency: 'EUR', airportList: [{ code: 'TFS', name: 'Tenerife South' }],
                giata: { id: '15890' }, description: 'Grand all-inclusive resort with waterpark and beachfront access.',
                bookable: true, departureDate: '2026-06-01', returnDate: '2026-06-08', nights: 7,
                boardType: ai, offerType: ot, tourOperator: op('TUI'),
                bestPriceFlight: flight('TFS', 'Tenerife South Airport'), transferList: transfers(),
                flightSurchargePerPerson: surcharge, packageTotalPrice: isPauschal ? 1476 : undefined,
            },
            {
                code: 'TRF-GRC-001', name: 'Atlantica Eleon Grand Resort & Spa', category: 5,
                location: { city: 'Tragaki', country: 'Greece', countryCode: 'GR', latitude: 37.802, longitude: 20.89 },
                region: { id: '450', name: 'Zakynthos' },
                bestPricePerPerson: isPauschal ? 848 : 699, totalPrice: isPauschal ? 1696 : 1398,
                currency: 'EUR', airportList: [{ code: 'ZTH', name: 'Zakynthos' }],
                giata: { id: '22341' }, description: 'Luxury 5-star resort with panoramic sea views and award-winning spa.',
                bookable: true, departureDate: '2026-06-15', returnDate: '2026-06-22', nights: 7,
                boardType: ai, offerType: ot, tourOperator: op('FTI'),
                bestPriceFlight: flight('ZTH', 'Zakynthos Airport'), transferList: transfers(),
                flightSurchargePerPerson: surcharge, packageTotalPrice: isPauschal ? 1696 : undefined,
            },
            {
                code: 'TRF-TUR-001', name: 'Rixos Premium Bodrum', category: 5,
                location: { city: 'Yalikavak', country: 'Turkey', countryCode: 'TR', latitude: 37.1, longitude: 27.28 },
                region: { id: '520', name: 'Bodrum' },
                bestPricePerPerson: isPauschal ? 1348 : 1199, totalPrice: isPauschal ? 2696 : 2398,
                currency: 'EUR', airportList: [{ code: 'BJV', name: 'Bodrum Milas' }],
                giata: { id: '31122' }, description: 'Ultra-all-inclusive resort on the Aegean coast with butler service.',
                bookable: true, departureDate: '2026-07-01', returnDate: '2026-07-08', nights: 7,
                boardType: uai, offerType: ot, tourOperator: op('BGM'),
                bestPriceFlight: flight('BJV', 'Bodrum Milas Airport'), transferList: transfers(),
                flightSurchargePerPerson: surcharge, packageTotalPrice: isPauschal ? 2696 : undefined,
            },
            {
                code: 'TRF-CRO-001', name: 'Valamar Lacroma Dubrovnik', category: 4,
                location: { city: 'Dubrovnik', country: 'Croatia', countryCode: 'HR', latitude: 42.65, longitude: 18.09 },
                region: { id: '330', name: 'Dubrovnik' },
                bestPricePerPerson: isPauschal ? 698 : 549, totalPrice: isPauschal ? 1396 : 1098,
                currency: 'EUR', airportList: [{ code: 'DBV', name: 'Dubrovnik' }],
                giata: { id: '18990' }, description: '4-star hotel with stunning views of Dubrovnik old town.',
                bookable: true, departureDate: '2026-07-10', returnDate: '2026-07-17', nights: 7,
                boardType: hb, offerType: ot, tourOperator: op('ITS'),
                bestPriceFlight: flight('DBV', 'Dubrovnik Airport'), transferList: transfers(),
                flightSurchargePerPerson: surcharge, packageTotalPrice: isPauschal ? 1396 : undefined,
            },
            {
                code: 'TRF-POR-001', name: 'Tivoli Carvoeiro Algarve Resort', category: 5,
                location: { city: 'Carvoeiro', country: 'Portugal', countryCode: 'PT', latitude: 37.1, longitude: -8.47 },
                region: { id: '610', name: 'Algarve' },
                bestPricePerPerson: isPauschal ? 968 : 819, totalPrice: isPauschal ? 1936 : 1638,
                currency: 'EUR', airportList: [{ code: 'FAO', name: 'Faro' }],
                giata: { id: '27543' }, description: 'Dramatic cliffside resort with world-class spa and golf access.',
                bookable: true, departureDate: '2026-06-20', returnDate: '2026-06-27', nights: 7,
                boardType: hb, offerType: ot, tourOperator: op('NCK'),
                bestPriceFlight: flight('FAO', 'Faro International Airport'), transferList: transfers(),
                flightSurchargePerPerson: surcharge, packageTotalPrice: isPauschal ? 1936 : undefined,
            },
            {
                code: 'TRF-EGY-001', name: 'Rixos Premium Seagate', category: 5,
                location: { city: 'Sharm El Sheikh', country: 'Egypt', countryCode: 'EG', latitude: 28.07, longitude: 34.42 },
                region: { id: '700', name: 'Sharm El Sheikh' },
                bestPricePerPerson: isPauschal ? 548 : 399, totalPrice: isPauschal ? 1096 : 798,
                currency: 'EUR', airportList: [{ code: 'SSH', name: 'Sharm El Sheikh' }],
                giata: { id: '35210' }, description: 'Ultra-all-inclusive on the Red Sea with private beach and snorkeling reef.',
                bookable: true, departureDate: '2026-05-15', returnDate: '2026-05-22', nights: 7,
                boardType: uai, offerType: ot, tourOperator: op('ALT'),
                bestPriceFlight: flight('SSH', 'Sharm El Sheikh Airport'), transferList: transfers(),
                flightSurchargePerPerson: surcharge, packageTotalPrice: isPauschal ? 1096 : undefined,
            },
        ];
    }


    private mockHotelContent(giataId: string): TrafficsHotelContent {
        return {
            giataId,
            name: 'Riu Concordia',
            category: 4,
            description: 'Moderan all-inclusive hotel u prvom redu sa pogledom na more. Direktan pristup plaži, 3 bazena i 5 restorana.',
            descriptionLong: 'Riu Concordia se nalazi na prestižnoj lokaciji u Playa de Palma, jednoj od najpopularnijih plaža na Majorki. Hotel nudi izuzetan all-inclusive paket sa besplatnom hranom i pićem tokom celog dana.',
            location: {
                city: 'Playa de Palma', country: 'Spain', countryCode: 'ES',
                address: 'Carrer de la Gran Via Asima', latitude: 39.515, longitude: 2.733,
            },
            coordinates: { lat: 39.515, lng: 2.733 },
            images: [
                { url: 'https://photos.hotelbeds.com/giata/original/exterior_01.jpg', title: 'Hotel Exterior', category: 'exterior' },
                { url: 'https://photos.hotelbeds.com/giata/original/pool_01.jpg', title: 'Pool Area', category: 'pool' },
                { url: 'https://photos.hotelbeds.com/giata/original/room_01.jpg', title: 'Standard Room', category: 'room' },
                { url: 'https://photos.hotelbeds.com/giata/original/restaurant_01.jpg', title: 'Main Restaurant', category: 'restaurant' },
                { url: 'https://photos.hotelbeds.com/giata/original/beach_01.jpg', title: 'Beach', category: 'beach' },
            ],
            facilities: [
                { id: 'fac-001', name: 'Private Beach', category: 'beach' },
                { id: 'fac-002', name: 'Outdoor Pool (3x)', category: 'pool' },
                { id: 'fac-003', name: 'All-Inclusive', category: 'board' },
                { id: 'fac-004', name: 'Spa & Wellness', category: 'spa' },
                { id: 'fac-005', name: 'Fitness Center', category: 'fitness' },
                { id: 'fac-006', name: 'Kids Club', category: 'kids' },
                { id: 'fac-007', name: 'Animation Team', category: 'entertainment' },
                { id: 'fac-008', name: 'Buffet Restaurant (3x)', category: 'food' },
                { id: 'fac-009', name: 'A La Carte Restaurant (2x)', category: 'food' },
                { id: 'fac-010', name: 'Free WiFi', category: 'connectivity' },
                { id: 'fac-011', name: 'Air Conditioning', category: 'comfort' },
                { id: 'fac-012', name: 'Tennis Court', category: 'sports' },
            ],
            rooms: [
                { code: 'SGL', name: 'Single Room', maxOccupancy: 1, description: 'Sea or garden view, air conditioning, satellite TV.' },
                { code: 'DBL', name: 'Double Room / Twin Room', maxOccupancy: 2, description: 'Balcony, sea or pool view, minibar.' },
                { code: 'SUP', name: 'Superior Room', maxOccupancy: 2, description: 'Larger balcony, direct sea view, upgraded amenities.' },
                { code: 'FAM', name: 'Family Room', maxOccupancy: 4, description: 'Connecting family room, ideal for families with children.' },
            ],
            checkIn: '14:00',
            checkOut: '12:00',
            websiteUrl: 'https://www.riu.com/en/hotel/spain/playa-de-palma/hotel-riu-concordia/',
            phone: '+34 971 26 08 04',
            email: 'info@riu.com',
            chainCode: 'RIU',
            chainName: 'RIU Hotels & Resorts',
        };
    }
}


// ─── Singleton ────────────────────────────────────────────────────────────────

const trafficsApiService = new TrafficsApiService();
export default trafficsApiService;
export { trafficsApiService };
