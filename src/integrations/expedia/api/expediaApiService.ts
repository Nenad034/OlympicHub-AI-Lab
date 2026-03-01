// ============================================================
//  EXPEDIA GROUP — RAPID API SERVICE
//  Docs: https://developers.expediagroup.com/rapid
//
//  AUTH: EAN Header format:
//    Authorization: EAN APIKey={key},Signature=SHA512(key+secret+timestamp),timestamp={ts}
//
//  ⚠️ VAŽNO: Generisanje SHA-512 potpisa mora ići kroz backend proxy
//  u produkciji radi zaštite API ključeva!
//  Ovaj servis koristi mock podatke dok nije dostupan backend.
// ============================================================

import type {
    ExpediaCredentials,
    PropertyAvailabilityRequest,
    PropertyAvailabilityResult,
    PropertyContentRequest,
    PropertyContentResult,
    PriceCheckRequest,
    PriceCheckResponse,
    BookingRequest,
    BookingResponse,
    ItineraryRetrieveResponse,
    RegionSearchRequest,
    RegionResult,
} from '../types/expediaTypes';

// ─── Endpointi ────────────────────────────────────────────────────────────────

const EXPEDIA_ENDPOINTS = {
    test: 'https://test.ean.com/v3',
    production: 'https://api.ean.com/v3',
} as const;

// API putanje prema Rapid API dokumentaciji
const API_PATHS = {
    // Shopping
    properties: '/properties/availability',
    // Content
    propertiesContent: '/properties/content',
    // Geo
    regions: '/regions',
    regionsSearch: '/regions?query=',
    // Booking
    itineraries: '/itineraries',
} as const;

// ─── Servis ───────────────────────────────────────────────────────────────────

export class ExpediaApiService {
    private credentials: ExpediaCredentials | null = null;
    private baseUrl: string = EXPEDIA_ENDPOINTS.test;

    // ─── Konfiguracija ────────────────────────────────────────────────
    configure(credentials: ExpediaCredentials) {
        this.credentials = credentials;
        this.baseUrl = credentials.environment === 'production'
            ? EXPEDIA_ENDPOINTS.production
            : EXPEDIA_ENDPOINTS.test;
        console.log(`[Expedia Rapid] Konfigurisan za ${credentials.environment} okruženje. Base URL: ${this.baseUrl}`);
    }

    isConfigured(): boolean {
        return !!(this.credentials?.apiKey && this.credentials?.apiSecret);
    }

    getEnvironment(): 'test' | 'production' {
        return this.credentials?.environment ?? 'test';
    }

    // ─── Auth Header Generator ────────────────────────────────────────
    //
    // Expedia Rapid Auth formula:
    //   Authorization: EAN APIKey={apiKey},Signature=SHA512(apiKey+secret+timestamp),timestamp={ts}
    //
    // ⚠️ SHA-512 u browser okruženju je MOCK! U produkciji koristiti backend proxy.
    private generateAuthHeader(): string {
        if (!this.credentials) throw new Error('[Expedia] Kredencijali nisu postavljeni.');

        const timestamp = Math.floor(Date.now() / 1000); // UNIX timestamp u sekundama
        const { apiKey, apiSecret } = this.credentials;

        // MOCK hash za browser -- backend treba da generiše pravi SHA-512
        // Pravi kod: CryptoJS.SHA512(apiKey + apiSecret + timestamp).toString()
        const rawSignature = apiKey + apiSecret + timestamp;
        const mockHash = btoa(rawSignature).replace(/[^a-zA-Z0-9]/g, '').substring(0, 128);

        return `EAN APIKey=${apiKey},Signature=${mockHash},timestamp=${timestamp}`;
    }

    private getHeaders(customerIp = '127.0.0.1', sessionId?: string): Record<string, string> {
        if (!this.credentials) throw new Error('[Expedia] Servis nije konfigurisan. Pozovite configure() najpre.');

        const headers: Record<string, string> = {
            'Authorization': this.generateAuthHeader(),
            'Accept': 'application/json',
            'Accept-Encoding': 'gzip',
            'Content-Type': 'application/json',
            'Customer-Ip': customerIp,
            'Test': this.credentials.environment === 'test' ? 'standard' : '',
        };

        if (sessionId) {
            headers['Customer-Session-Id'] = sessionId;
        }

        return headers;
    }

    // ─── Mock delay ───────────────────────────────────────────────────
    private async mockDelay(ms = 600) {
        await new Promise(resolve => setTimeout(resolve, ms));
    }

    // ─── Mock property ID generator ──────────────────────────────────
    private mockPropertyId(n: number) {
        return `EXP-PROP-${String(n).padStart(6, '0')}`;
    }


    // ═══════════════════════════════════════════════════════════════════
    //  SHOPPING API — Pretraga dostupnih nekretnina
    // ═══════════════════════════════════════════════════════════════════

    /**
     * Pretraga dostupnih nekretnina (hotela)
     * Live: GET /v3/properties/availability
     * Docs: https://developers.expediagroup.com/rapid/reference/get-properties-availability
     */
    async searchProperties(request: PropertyAvailabilityRequest): Promise<PropertyAvailabilityResult[]> {
        console.log('[Expedia] Pretraga nekretnina...', {
            checkin: request.checkin,
            checkout: request.checkout,
            currency: request.currency,
            occupancy: request.occupancy,
        });

        await this.mockDelay(800);

        // ── MOCK ODGOVOR ──────────────────────────────────────────────
        const mockProperties: PropertyAvailabilityResult[] = [
            {
                property_id: this.mockPropertyId(1001),
                status: 'available',
                links: {
                    price_check: { method: 'GET', href: `${this.baseUrl}/properties/${this.mockPropertyId(1001)}/availability` }
                },
                rooms: [
                    {
                        id: 'ROOM-DBLST',
                        room_name: 'Deluxe Room, 2 Double Beds',
                        rates: [
                            {
                                id: 'RATE-001',
                                status: 'available',
                                available_rooms: 6,
                                refundable: true,
                                deposit_required: false,
                                fenced_deal: false,
                                member_deal_available: false,
                                sale_scenario: { package: false, member: false, corporate: false, distribution: true },
                                merchant_of_record: 'expedia',
                                amenities: {
                                    '2017': { id: '2017', name: 'Free Wifi' },
                                    '9159': { id: '9159', name: 'Breakfast included' },
                                },
                                links: {
                                    price_check: { method: 'GET', href: `${this.baseUrl}/properties/${this.mockPropertyId(1001)}/rooms/ROOM-DBLST/rates/RATE-001/price-check` },
                                    payment_options: { method: 'GET', href: `${this.baseUrl}/properties/${this.mockPropertyId(1001)}/payment-options` },
                                },
                                bed_groups: {
                                    'BG-001': {
                                        id: 'BG-001',
                                        description: '2 Double Beds',
                                        configuration: [{ type: 'Double', size: 'Full', quantity: 2 }],
                                        links: {
                                            price_check: { method: 'GET', href: `${this.baseUrl}/price-check?token=mock-token-001` },
                                        },
                                    }
                                },
                                cancel_penalties: [
                                    { end: request.checkin, amount: '0', currency: request.currency },
                                    { start: request.checkin, percent: '100' },
                                ],
                                occupancy_pricing: {
                                    '2': {
                                        nightly: [
                                            [
                                                { type: 'base_rate', value: '145.00' },
                                                { type: 'tax_and_service_fee', value: '21.75' },
                                            ]
                                        ],
                                        stay: [{ type: 'base_rate', value: '145.00' }],
                                        totals: {
                                            inclusive: {
                                                billable_currency: { value: '166.75', currency: request.currency },
                                                request_currency: { value: '166.75', currency: request.currency },
                                            },
                                            exclusive: {
                                                billable_currency: { value: '145.00', currency: request.currency },
                                                request_currency: { value: '145.00', currency: request.currency },
                                            },
                                        }
                                    }
                                }
                            }
                        ]
                    },
                    {
                        id: 'ROOM-SUITE',
                        room_name: 'Junior Suite, 1 King Bed, Balcony',
                        rates: [
                            {
                                id: 'RATE-002',
                                status: 'available',
                                available_rooms: 3,
                                refundable: false,
                                deposit_required: false,
                                fenced_deal: true,
                                member_deal_available: true,
                                sale_scenario: { package: false, member: true, corporate: false, distribution: true },
                                merchant_of_record: 'expedia',
                                amenities: {
                                    '2017': { id: '2017', name: 'Free Wifi' },
                                    '2001': { id: '2001', name: 'Ocean View' },
                                    '51': { id: '51', name: 'Balcony' },
                                },
                                links: {
                                    price_check: { method: 'GET', href: `${this.baseUrl}/price-check?token=mock-token-002` },
                                    payment_options: { method: 'GET', href: `${this.baseUrl}/properties/${this.mockPropertyId(1001)}/payment-options` },
                                },
                                bed_groups: {
                                    'BG-002': {
                                        id: 'BG-002',
                                        description: '1 King Bed',
                                        configuration: [{ type: 'King', size: 'King', quantity: 1 }],
                                        links: {
                                            price_check: { method: 'GET', href: `${this.baseUrl}/price-check?token=mock-token-002` },
                                        },
                                    }
                                },
                                cancel_penalties: [
                                    { percent: '100', start: request.checkin },
                                ],
                                occupancy_pricing: {
                                    '2': {
                                        nightly: [
                                            [
                                                { type: 'base_rate', value: '280.00' },
                                                { type: 'tax_and_service_fee', value: '42.00' },
                                            ]
                                        ],
                                        stay: [{ type: 'base_rate', value: '280.00' }],
                                        totals: {
                                            inclusive: {
                                                billable_currency: { value: '322.00', currency: request.currency },
                                                request_currency: { value: '322.00', currency: request.currency },
                                            },
                                            exclusive: {
                                                billable_currency: { value: '280.00', currency: request.currency },
                                                request_currency: { value: '280.00', currency: request.currency },
                                            },
                                            inclusive_strikethrough: {
                                                billable_currency: { value: '380.00', currency: request.currency },
                                                request_currency: { value: '380.00', currency: request.currency },
                                            },
                                        }
                                    }
                                }
                            }
                        ]
                    }
                ]
            },
            {
                property_id: this.mockPropertyId(2002),
                status: 'available',
                links: {
                    price_check: { method: 'GET', href: `${this.baseUrl}/properties/${this.mockPropertyId(2002)}/availability` }
                },
                rooms: [
                    {
                        id: 'ROOM-STD',
                        room_name: 'Standard Room, 1 Queen Bed',
                        rates: [
                            {
                                id: 'RATE-003',
                                status: 'available',
                                available_rooms: 12,
                                refundable: true,
                                deposit_required: false,
                                fenced_deal: false,
                                member_deal_available: false,
                                sale_scenario: { package: false, member: false, corporate: false, distribution: true },
                                merchant_of_record: 'expedia',
                                amenities: {
                                    '2017': { id: '2017', name: 'Free Wifi' },
                                },
                                links: {
                                    price_check: { method: 'GET', href: `${this.baseUrl}/price-check?token=mock-token-003` },
                                    payment_options: { method: 'GET', href: `${this.baseUrl}/properties/${this.mockPropertyId(2002)}/payment-options` },
                                },
                                bed_groups: {
                                    'BG-003': {
                                        id: 'BG-003',
                                        description: '1 Queen Bed',
                                        configuration: [{ type: 'Queen', size: 'Queen', quantity: 1 }],
                                        links: {
                                            price_check: { method: 'GET', href: `${this.baseUrl}/price-check?token=mock-token-003` },
                                        },
                                    }
                                },
                                cancel_penalties: [],
                                occupancy_pricing: {
                                    '2': {
                                        nightly: [
                                            [
                                                { type: 'base_rate', value: '95.00' },
                                                { type: 'tax_and_service_fee', value: '14.25' },
                                            ]
                                        ],
                                        stay: [{ type: 'base_rate', value: '95.00' }],
                                        totals: {
                                            inclusive: {
                                                billable_currency: { value: '109.25', currency: request.currency },
                                                request_currency: { value: '109.25', currency: request.currency },
                                            },
                                            exclusive: {
                                                billable_currency: { value: '95.00', currency: request.currency },
                                                request_currency: { value: '95.00', currency: request.currency },
                                            },
                                        }
                                    }
                                }
                            }
                        ]
                    }
                ]
            },
            {
                property_id: this.mockPropertyId(3003),
                status: 'sold_out',
                links: {},
                rooms: []
            },
        ];

        return mockProperties;
    }


    // ═══════════════════════════════════════════════════════════════════
    //  CONTENT API — Statički podaci o nekretninama
    // ═══════════════════════════════════════════════════════════════════

    /**
     * Povlačenje sadržaja nekretnine (tip, adresa, slike, pogodnosti)
     * Live: GET /v3/properties/content
     * Docs: https://developers.expediagroup.com/rapid/reference/get-property-content
     */
    async getPropertyContent(request: PropertyContentRequest): Promise<PropertyContentResult[]> {
        console.log('[Expedia] Dohvatanje sadržaja nekretnina...', request.property_id);
        await this.mockDelay(700);

        return [
            {
                property_id: this.mockPropertyId(1001),
                name: 'The Grand Expedia Belgrade',
                address: {
                    line_1: 'Knez Mihailova 35',
                    city: 'Belgrade',
                    postal_code: '11000',
                    country_code: 'RS',
                    obfuscation_required: false,
                },
                ratings: {
                    property: { rating: '5', type: 'Star' },
                    guest: {
                        count: 1842,
                        overall: '4.6',
                        cleanliness: '4.7',
                        service: '4.8',
                        comfort: '4.5',
                        condition: '4.6',
                        location: '4.9',
                        neighborhood: '4.8',
                        quality: '4.7',
                        value: '4.4',
                        amenities: '4.6',
                        recommendation_percent: '93',
                    }
                },
                location: {
                    coordinates: { latitude: 44.8186, longitude: 20.4569 },
                },
                phone: '+381112345678',
                category: { id: '1', name: 'Hotel' },
                business_model: { expedia_collect: true, property_collect: false },
                checkin: { begin_time: '15:00', end_time: '23:59', instructions: 'Check-in na recepciji.', min_age: 18 },
                checkout: { time: '12:00' },
                amenities: {
                    '2017': { id: '2017', name: 'Free WiFi' },
                    '2065': { id: '2065', name: 'Outdoor pool' },
                    '2111': { id: '2111', name: 'Spa' },
                    '2057': { id: '2057', name: 'Fitness center' },
                    '2000': { id: '2000', name: 'Restaurant' },
                    '2002': { id: '2002', name: 'Bar/lounge' },
                    '2063': { id: '2063', name: 'Parking' },
                    '316': { id: '316', name: '24-hour front desk' },
                },
                images: [
                    {
                        caption: 'Hotel Lobby',
                        hero_image: true,
                        category: 1,
                        links: {
                            '70px': { method: 'GET', href: 'https://i.travelapi.com/lodging/1001/lobby_70w.jpg' },
                            '350px': { method: 'GET', href: 'https://i.travelapi.com/lodging/1001/lobby_350w.jpg' },
                            '1000px': { method: 'GET', href: 'https://i.travelapi.com/lodging/1001/lobby_1000w.jpg' },
                        },
                    },
                    {
                        caption: 'Outdoor Pool',
                        hero_image: false,
                        category: 6,
                        links: {
                            '70px': { method: 'GET', href: 'https://i.travelapi.com/lodging/1001/pool_70w.jpg' },
                            '350px': { method: 'GET', href: 'https://i.travelapi.com/lodging/1001/pool_350w.jpg' },
                            '1000px': { method: 'GET', href: 'https://i.travelapi.com/lodging/1001/pool_1000w.jpg' },
                        },
                    },
                ],
                descriptions: {
                    headline: 'Luksuzni hotel u centru Beograda sa pogledom na Kalemegdan.',
                    general: 'The Grand Expedia Belgrade nudi vrhunski smeštaj u srcu srpske prestonice.',
                    amenities: 'Bazen, spa, fitness centar, 3 restorana i rooftop bar.',
                    location: 'Smešten na pešačkoj zoni Knez Mihailova, 5 minuta hoda od Kalemegdana.',
                },
                dates: {
                    added: '2020-01-15',
                    updated: '2026-02-01',
                },
            },
            {
                property_id: this.mockPropertyId(2002),
                name: 'City Center Inn',
                address: {
                    line_1: 'Terazije 12',
                    city: 'Belgrade',
                    postal_code: '11000',
                    country_code: 'RS',
                    obfuscation_required: false,
                },
                ratings: {
                    property: { rating: '3', type: 'Star' },
                    guest: {
                        count: 567,
                        overall: '3.8',
                        cleanliness: '3.9',
                        service: '3.7',
                        comfort: '3.8',
                        condition: '3.6',
                        location: '4.5',
                        neighborhood: '4.4',
                        quality: '3.7',
                        value: '4.0',
                        amenities: '3.5',
                        recommendation_percent: '75',
                    }
                },
                location: {
                    coordinates: { latitude: 44.8150, longitude: 20.4612 },
                },
                category: { id: '1', name: 'Hotel' },
                business_model: { expedia_collect: true, property_collect: false },
                checkin: { begin_time: '14:00', end_time: '22:00', min_age: 18 },
                checkout: { time: '11:00' },
                amenities: {
                    '2017': { id: '2017', name: 'Free WiFi' },
                    '316': { id: '316', name: '24-hour front desk' },
                },
                images: [
                    {
                        caption: 'Hotel Exterior',
                        hero_image: true,
                        category: 0,
                        links: {
                            '350px': { method: 'GET', href: 'https://i.travelapi.com/lodging/2002/exterior_350w.jpg' },
                            '1000px': { method: 'GET', href: 'https://i.travelapi.com/lodging/2002/exterior_1000w.jpg' },
                        },
                    },
                ],
                descriptions: {
                    headline: 'Pristupačan hotel u centru Beograda.',
                    general: 'City Center Inn nudi udoban smeštaj po povoljnoj ceni na samom centru Beograda.',
                    location: 'Direktno na Terazijama, odmah pored SVE linija gradskog prevoza.',
                },
                dates: {
                    added: '2018-06-20',
                    updated: '2025-11-10',
                },
            }
        ];
    }


    // ═══════════════════════════════════════════════════════════════════
    //  PRICE CHECK — Provera cene pre rezervacije
    // ═══════════════════════════════════════════════════════════════════

    /**
     * Provera aktuelnosti cene pre slanja rezervacije
     * Live: GET (URL iz price_check linka u Shopping odgovoru)
     * Docs: https://developers.expediagroup.com/rapid/reference/get-price-check
     *
     * ⚠️ Token se dobija iz bed_group.links.price_check.href u Shopping odgovoru
     */
    async checkPrice(request: PriceCheckRequest): Promise<PriceCheckResponse> {
        console.log('[Expedia] Price check...', request.token);
        await this.mockDelay(500);

        // Simuliramo "cena se promenila" u 10% slučajeva za realizam
        const statusOptions = ['matched', 'matched', 'matched', 'matched', 'matched', 'matched', 'matched', 'matched', 'price_changed', 'sold_out'] as const;
        const randomStatus = statusOptions[Math.floor(Math.random() * statusOptions.length)];

        return {
            status: randomStatus,
            links: randomStatus === 'matched'
                ? { book: { method: 'POST', href: `${this.baseUrl}/itineraries` } }
                : undefined,
            cancel_penalties: [
                { end: '2026-07-14', amount: '0', currency: 'EUR' },
                { start: '2026-07-14', percent: '100' },
            ],
            occupancy_pricing: randomStatus === 'matched' ? undefined : {
                '2': {
                    totals: {
                        inclusive: {
                            billable_currency: { value: '175.00', currency: 'EUR' },
                            request_currency: { value: '175.00', currency: 'EUR' },
                        },
                        exclusive: {
                            billable_currency: { value: '152.17', currency: 'EUR' },
                            request_currency: { value: '152.17', currency: 'EUR' },
                        },
                    }
                }
            }
        };
    }


    // ═══════════════════════════════════════════════════════════════════
    //  BOOKING API — Kreiranje novog itinerera (rezervacije)
    // ═══════════════════════════════════════════════════════════════════

    /**
     * Kreira novu rezervaciju (itinerer)
     * Live: POST /v3/itineraries
     * Docs: https://developers.expediagroup.com/rapid/reference/create-itinerary
     *
     * ⚠️ Poziv se šalje na URL iz price_check.links.book, ne direktno na /itineraries
     */
    async createItinerary(request: BookingRequest): Promise<BookingResponse> {
        console.log('[Expedia] Kreiranje rezervacije:', request.affiliate_reference_id);
        await this.mockDelay(1000);

        const itineraryId = `EXP-ITN-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

        return {
            itinerary_id: itineraryId,
            reservation_id: `EXP-RES-${Math.random().toString(36).substring(2, 10).toUpperCase()}`,
            status: 'booked',
            links: {
                retrieve: { method: 'GET', href: `${this.baseUrl}/itineraries/${itineraryId}?token=mock-retrieve-token` },
                cancel: { method: 'DELETE', href: `${this.baseUrl}/itineraries/${itineraryId}` },
            }
        };
    }


    // ═══════════════════════════════════════════════════════════════════
    //  ITINERARY MANAGEMENT — Upravljanje rezervacijom
    // ═══════════════════════════════════════════════════════════════════

    /**
     * Dohvata detalje rezervacije
     * Live: GET /v3/itineraries/{itinerary_id}
     * Docs: https://developers.expediagroup.com/rapid/reference/get-itinerary
     */
    async getItinerary(itineraryId: string): Promise<ItineraryRetrieveResponse> {
        console.log('[Expedia] Dohvatanje itinerera:', itineraryId);
        await this.mockDelay(450);

        return {
            itinerary_id: itineraryId,
            property_id: this.mockPropertyId(1001),
            affiliate_reference_id: 'CTT-2026-EXP-001',
            email: 'putnik@example.com',
            creation_date_time: new Date().toISOString(),
            rooms: [
                {
                    id: 'ROOM-DBLST',
                    confirmation_id: {
                        expedia: `EXP-CONF-${Date.now()}`,
                        property: `PROP-CONF-${Date.now()}`,
                    },
                    bed_group_id: 'BG-001',
                    checkin: '2026-07-15',
                    checkout: '2026-07-22',
                    number_of_adults: 2,
                    child_ages: [],
                    given_name: 'Marko',
                    family_name: 'Marković',
                    status: {
                        current: 'booked',
                    },
                }
            ],
            links: {
                cancel: { method: 'DELETE', href: `${this.baseUrl}/itineraries/${itineraryId}` },
            },
        };
    }

    /**
     * Otkazuje rezervaciju
     * Live: DELETE /v3/itineraries/{itinerary_id}/rooms/{room_id}
     * Docs: https://developers.expediagroup.com/rapid/reference/delete-room
     *
     * ⚠️ Vraća HTTP 204 (No Content) ako je uspešno, nema tela odgovora.
     */
    async cancelItinerary(itineraryId: string): Promise<{ success: boolean; itinerary_id: string }> {
        console.log('[Expedia] Otkazivanje rezervacije:', itineraryId);
        await this.mockDelay(700);

        return {
            success: true,
            itinerary_id: itineraryId,
        };
    }


    // ═══════════════════════════════════════════════════════════════════
    //  GEO API — Pretraga regiona i lokacija
    // ═══════════════════════════════════════════════════════════════════

    /**
     * Pretraga regiona/gradova/aerodroma po tekstu
     * Live: GET /v3/regions?query={query}
     * Docs: https://developers.expediagroup.com/rapid/reference/get-regions
     */
    async searchRegions(request: RegionSearchRequest): Promise<RegionResult[]> {
        console.log('[Expedia] Pretraga regiona:', request.query);
        await this.mockDelay(400);

        const mockResults: RegionResult[] = [
            {
                id: '178286',
                type: 'city',
                name: 'Belgrade',
                name_full: 'Belgrade, Central Serbia, Serbia',
                country_code: 'RS',
                country_subdiv_code: 'RS-00',
                center: { lat: 44.8186, lng: 20.4569 },
                ancestors: [
                    { type: 'country', id: '8015', name: 'Serbia', country_code: 'RS' },
                    { type: 'continent', id: '6', name: 'Europe' },
                ],
            },
            {
                id: '6054439',
                type: 'airport',
                name: 'Belgrade Nikola Tesla Airport (BEG)',
                name_full: 'BEG - Belgrade Nikola Tesla Airport, Serbia',
                country_code: 'RS',
                center: { lat: 44.8184, lng: 20.3091 },
                ancestors: [
                    { type: 'city', id: '178286', name: 'Belgrade', country_code: 'RS' },
                ],
            },
        ].filter(r =>
            r.name.toLowerCase().includes(request.query.toLowerCase()) ||
            r.name_full.toLowerCase().includes(request.query.toLowerCase())
        );

        return mockResults;
    }
}

// ─── Singleton ────────────────────────────────────────────────────────────────
const expediaApiService = new ExpediaApiService();
export default expediaApiService;
