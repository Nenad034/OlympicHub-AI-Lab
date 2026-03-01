import type {
    HotelbedsCredentials,
    HotelAvailabilityRequest,
    HotelAvailabilityResponse,
    CheckRatesRequest,
    CheckRatesResponse,
    HotelBookingRequest,
    HotelBookingResponse,
    HotelContentResult,
    ActivitySearchRequest,
    ActivitySearchResponse,
    TransferSearchRequest,
    TransferSearchResponse,
    TransferBookingRequest,
    TransferBookingResponse,
} from '../types/hotelbedsTypes';

// ─── Endpointi ────────────────────────────────────────────────────────────────

const HOTELBEDS_ENDPOINTS = {
    test: 'https://api.test.hotelbeds.com',
    production: 'https://api.hotelbeds.com',
};

const API_PATHS = {
    hotelAvailability: '/hotel-api/1.0/hotels',
    checkRates: '/hotel-api/1.0/checkrates',
    bookings: '/hotel-api/1.0/bookings',
    hotelContent: '/hotel-content-api/1.0/hotels',
    activities: '/activity-api/3.0/activities/availability',
    activitiesContent: '/activity-api/3.0/activities',
    transfers: '/transfer-api/1.0/availability',
    transferBookings: '/transfer-api/1.0/bookings',
};

// ─── Servis ───────────────────────────────────────────────────────────────────

export class HotelbedsApiService {
    private credentials: HotelbedsCredentials | null = null;
    private baseUrl: string = HOTELBEDS_ENDPOINTS.test;

    // ─── Konfiguracija ────────────────────────────────────────────────
    configure(credentials: HotelbedsCredentials) {
        this.credentials = credentials;
        this.baseUrl = credentials.environment === 'production'
            ? HOTELBEDS_ENDPOINTS.production
            : HOTELBEDS_ENDPOINTS.test;
        console.log(`[Hotelbeds] Konfigurisan za ${credentials.environment} okruženje. Base URL: ${this.baseUrl}`);
    }

    isConfigured(): boolean {
        return !!(this.credentials?.apiKey && this.credentials?.apiSecret);
    }

    getEnvironment(): 'test' | 'production' {
        return this.credentials?.environment ?? 'test';
    }

    // ─── X-Signature Generator ────────────────────────────────────────
    // Formula: SHA256(apiKey + apiSecret + epochSeconds)
    // Ovo mora biti uradjeno na serveru u produkciji! Na frontu je mock.
    private generateSignature(): string {
        if (!this.credentials) throw new Error('[Hotelbeds] Kredencijali nisu postavljeni.');

        // Browser SHA-256 implementacija (samo za test/demo svrhe)
        // U produkciji: koristiti backend proxy koji kreira potpis
        const timestamp = Math.floor(Date.now() / 1000).toString();
        const raw = this.credentials.apiKey + this.credentials.apiSecret + timestamp;

        // Simuliramo hash za browser okruženje (u produkciji ide kroz backend)
        return `mock_sig_${btoa(raw).substring(0, 32)}_${timestamp}`;
    }

    private getHeaders(): Record<string, string> {
        if (!this.credentials) throw new Error('[Hotelbeds] Servis nije konfigurisan. Pozovite configure() najpre.');

        return {
            'Api-key': this.credentials.apiKey,
            'X-Signature': this.generateSignature(),
            'Accept': 'application/json',
            'Accept-Encoding': 'gzip',
            'Content-Type': 'application/json',
        };
    }

    // ─── Mock delay ───────────────────────────────────────────────────
    private async mockDelay(ms = 600) {
        await new Promise(resolve => setTimeout(resolve, ms));
    }

    // ═══════════════════════════════════════════════════════════════════
    //  HOTEL BOOKING API
    // ═══════════════════════════════════════════════════════════════════

    /**
     * Pretraga dostupnih hotela
     * Live: POST /hotel-api/1.0/hotels
     */
    async searchHotels(request: HotelAvailabilityRequest): Promise<HotelAvailabilityResponse> {
        console.log('[Hotelbeds] Pretraga hotela...', {
            checkIn: request.stay.checkIn,
            checkOut: request.stay.checkOut,
            destination: request.destination?.code,
        });

        await this.mockDelay(800);

        // MOCK ODGOVOR
        return {
            auditData: this.mockAuditData(),
            hotels: {
                checkIn: request.stay.checkIn,
                checkOut: request.stay.checkOut,
                total: 3,
                hotels: [
                    {
                        code: 1234,
                        name: 'Hotel Iberostar Santa Eulalia',
                        categoryCode: '4EST',
                        categoryName: '4 Stars',
                        destinationCode: request.destination?.code ?? 'IBZ',
                        destinationName: 'Ibiza',
                        zoneCode: 20,
                        zoneName: 'Santa Eulalia',
                        latitude: '38.979721',
                        longitude: '1.540000',
                        minRate: '185.60',
                        maxRate: '320.40',
                        currency: 'EUR',
                        rooms: [
                            {
                                status: 'AVAILABLE',
                                id: 1,
                                code: 'DBL.ST',
                                name: 'Double Standard',
                                rates: [
                                    {
                                        rateKey: `${request.stay.checkIn}|${request.stay.checkOut}|W|1|1234|DBL.ST|AI|1~1~0|RO|0|0|0|0|0`,
                                        rateClass: 'NOR',
                                        rateType: 'BOOKABLE',
                                        net: '185.60',
                                        sellingRate: '210.00',
                                        hotelMandatory: false,
                                        allotment: 8,
                                        paymentType: 'AT_WEB',
                                        packaging: false,
                                        boardCode: 'AI',
                                        boardName: 'All Inclusive',
                                        cancellationPolicies: [
                                            { amount: '185.60', from: request.stay.checkIn }
                                        ],
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        code: 5678,
                        name: 'Hotel Meliá Ibiza',
                        categoryCode: '5EST',
                        categoryName: '5 Stars',
                        destinationCode: request.destination?.code ?? 'IBZ',
                        destinationName: 'Ibiza',
                        zoneCode: 10,
                        zoneName: 'Playa d\'en Bossa',
                        latitude: '38.877800',
                        longitude: '1.406900',
                        minRate: '280.00',
                        maxRate: '520.00',
                        currency: 'EUR',
                        rooms: [
                            {
                                status: 'AVAILABLE',
                                id: 1,
                                code: 'SUI.JR',
                                name: 'Junior Suite Sea View',
                                rates: [
                                    {
                                        rateKey: `${request.stay.checkIn}|${request.stay.checkOut}|W|1|5678|SUI.JR|BB|1~2~0|NOR|0|0|0|0|0`,
                                        rateClass: 'NOR',
                                        rateType: 'BOOKABLE',
                                        net: '280.00',
                                        sellingRate: '320.00',
                                        hotelMandatory: false,
                                        allotment: 4,
                                        paymentType: 'AT_WEB',
                                        packaging: false,
                                        boardCode: 'BB',
                                        boardName: 'Bed & Breakfast',
                                        cancellationPolicies: [
                                            { amount: '140.00', from: request.stay.checkIn }
                                        ],
                                    }
                                ]
                            }
                        ]
                    },
                    {
                        code: 9012,
                        name: 'Palladium Hotel Palmyra',
                        categoryCode: '4EST',
                        categoryName: '4 Stars',
                        destinationCode: request.destination?.code ?? 'IBZ',
                        destinationName: 'Ibiza',
                        zoneCode: 30,
                        zoneName: 'Port de Sant Miguel',
                        latitude: '39.012000',
                        longitude: '1.421000',
                        minRate: '155.00',
                        maxRate: '270.00',
                        currency: 'EUR',
                        rooms: [
                            {
                                status: 'AVAILABLE',
                                id: 1,
                                code: 'DBL.SEA',
                                name: 'Double Sea View',
                                rates: [
                                    {
                                        rateKey: `${request.stay.checkIn}|${request.stay.checkOut}|W|1|9012|DBL.SEA|HB|1~2~1|NOR|0|0|0|0|0`,
                                        rateClass: 'NOR',
                                        rateType: 'BOOKABLE',
                                        net: '155.00',
                                        sellingRate: '180.00',
                                        hotelMandatory: false,
                                        allotment: 12,
                                        paymentType: 'AT_WEB',
                                        packaging: false,
                                        boardCode: 'HB',
                                        boardName: 'Half Board',
                                        cancellationPolicies: [
                                            { amount: '77.50', from: request.stay.checkIn }
                                        ],
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }
        };
    }

    /**
     * Provera i potvrda cena pre rezervacije
     * Live: POST /hotel-api/1.0/checkrates
     */
    async checkRates(request: CheckRatesRequest): Promise<CheckRatesResponse> {
        console.log('[Hotelbeds] Check rates za', request.rooms.length, 'soba...');
        await this.mockDelay(500);

        const rateKey = request.rooms[0]?.rateKey ?? '';

        return {
            auditData: this.mockAuditData(),
            hotel: {
                checkIn: '2026-07-15',
                checkOut: '2026-07-22',
                code: 1234,
                name: 'Hotel Iberostar Santa Eulalia',
                categoryCode: '4EST',
                categoryName: '4 Stars',
                destinationCode: 'IBZ',
                destinationName: 'Ibiza',
                rooms: [
                    {
                        status: 'AVAILABLE',
                        id: 1,
                        code: 'DBL.ST',
                        name: 'Double Standard',
                        rates: [
                            {
                                rateKey,
                                rateClass: 'NOR',
                                rateType: 'BOOKABLE',
                                net: '185.60',
                                sellingRate: '210.00',
                                hotelMandatory: false,
                                allotment: 8,
                                paymentType: 'AT_WEB',
                                packaging: false,
                                boardCode: 'AI',
                                boardName: 'All Inclusive',
                                cancellationPolicies: [
                                    { amount: '185.60', from: '2026-07-14' }
                                ],
                            }
                        ]
                    }
                ],
                totalNet: '185.60',
                totalSellingRate: '210.00',
                currency: 'EUR',
                supplier: {
                    name: 'HOTELBEDS TEST',
                    vatNumber: 'ES12345678A'
                },
                modificationPolicies: {
                    cancellation: true,
                    modification: false,
                }
            }
        };
    }

    /**
     * Kreira novu rezervaciju
     * Live: POST /hotel-api/1.0/bookings
     */
    async createBooking(request: HotelBookingRequest): Promise<HotelBookingResponse> {
        console.log('[Hotelbeds] Kreiranje rezervacije:', request.clientReference);
        await this.mockDelay(900);

        const confirmationRef = `HB-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

        return {
            auditData: this.mockAuditData(),
            booking: {
                reference: confirmationRef,
                clientReference: request.clientReference,
                creationDate: new Date().toISOString().split('T')[0],
                status: 'CONFIRMED',
                creationUser: 'API_USER',
                holder: {
                    name: request.holder.name,
                    surname: request.holder.surname,
                },
                hotel: {
                    checkIn: '2026-07-15',
                    checkOut: '2026-07-22',
                    code: 1234,
                    name: 'Hotel Iberostar Santa Eulalia',
                    categoryCode: '4EST',
                    categoryName: '4 Stars',
                    destinationCode: 'IBZ',
                    destinationName: 'Ibiza',
                    rooms: [
                        {
                            id: 1,
                            code: 'DBL.ST',
                            name: 'Double Standard',
                            status: 'CONFIRMED',
                            rates: [
                                {
                                    rateKey: request.rooms[0]?.rateKey ?? '',
                                    rateClass: 'NOR',
                                    rateType: 'BOOKABLE',
                                    net: '185.60',
                                    hotelMandatory: false,
                                    allotment: 1,
                                    paymentType: 'AT_WEB',
                                    packaging: false,
                                    boardCode: 'AI',
                                    boardName: 'All Inclusive',
                                }
                            ],
                            paxes: request.rooms[0]?.paxes ?? [],
                        }
                    ]
                },
                totalNet: '185.60',
                pendingAmount: '185.60',
                currency: 'EUR',
                remark: request.remark,
                cancellationAmount: '185.60',
                modificationPolicies: {
                    cancellation: true,
                    modification: false,
                }
            }
        };
    }

    /**
     * Pregled rezervacije
     * Live: GET /hotel-api/1.0/bookings/{reference}
     */
    async getBooking(reference: string): Promise<HotelBookingResponse> {
        console.log('[Hotelbeds] Dohvatanje rezervacije:', reference);
        await this.mockDelay(400);

        return {
            auditData: this.mockAuditData(),
            booking: {
                reference,
                clientReference: 'CTT-2026-001',
                creationDate: '2026-03-01',
                status: 'CONFIRMED',
                creationUser: 'API_USER',
                holder: { name: 'Marko', surname: 'Marković' },
                hotel: {
                    checkIn: '2026-07-15',
                    checkOut: '2026-07-22',
                    code: 1234,
                    name: 'Hotel Iberostar Santa Eulalia',
                    categoryCode: '4EST',
                    categoryName: '4 Stars',
                    destinationCode: 'IBZ',
                    destinationName: 'Ibiza',
                    rooms: []
                },
                totalNet: '185.60',
                pendingAmount: '0.00',
                currency: 'EUR',
            }
        };
    }

    /**
     * Otkazivanje rezervacije
     * Live: DELETE /hotel-api/1.0/bookings/{reference}
     */
    async cancelBooking(reference: string): Promise<HotelBookingResponse> {
        console.log('[Hotelbeds] Otkazivanje rezervacije:', reference);
        await this.mockDelay(600);

        return {
            auditData: this.mockAuditData(),
            booking: {
                reference,
                cancellationReference: `CANC-${Date.now()}`,
                clientReference: 'CTT-2026-001',
                creationDate: '2026-03-01',
                status: 'CANCELLED',
                creationUser: 'API_USER',
                holder: { name: 'Marko', surname: 'Marković' },
                hotel: {
                    checkIn: '2026-07-15',
                    checkOut: '2026-07-22',
                    code: 1234,
                    name: 'Hotel Iberostar Santa Eulalia',
                    categoryCode: '4EST',
                    categoryName: '4 Stars',
                    destinationCode: 'IBZ',
                    destinationName: 'Ibiza',
                    rooms: []
                },
                totalNet: '185.60',
                pendingAmount: '0.00',
                currency: 'EUR',
                cancellationAmount: '185.60',
            }
        };
    }

    /**
     * Sadržaj hotela (statički podaci)
     * Live: GET /hotel-content-api/1.0/hotels
     */
    async getHotelContent(hotelCodes?: number[], language = 'ENG', limit = 10): Promise<{ hotels: HotelContentResult[] }> {
        console.log('[Hotelbeds] Dohvatanje sadržaja hotela...');
        await this.mockDelay(700);

        return {
            hotels: [
                {
                    code: 1234,
                    name: { content: 'Hotel Iberostar Santa Eulalia', languageCode: 'ENG' },
                    description: { content: 'Luksuzni hotel direktno na plaži sa pogledom na more. Savršen za porodična i romantična putovanja.', languageCode: 'ENG' },
                    countryCode: 'ES',
                    destinationCode: 'IBZ',
                    zoneCode: 20,
                    categoryCode: '4EST',
                    coordinates: { longitude: 1.540000, latitude: 38.979721 },
                    boardCodes: ['AI', 'HB', 'BB'],
                    address: {
                        content: 'Cala Pada s/n, Santa Eulalia, Ibiza',
                        city: 'Santa Eulalia',
                        zip: '07840',
                    },
                    web: 'https://www.iberostar.com',
                    images: [
                        { imageTypeCode: 'GEN', path: 'hotelbeds/hotel/iberostar-pool.jpg', order: 1 },
                        { imageTypeCode: 'HAB', path: 'hotelbeds/hotel/iberostar-room.jpg', order: 2 },
                    ],
                    facilities: [
                        { facilityCode: 10, facilityGroupCode: 60 }, // Pool
                        { facilityCode: 20, facilityGroupCode: 70 }, // Spa
                        { facilityCode: 30, facilityGroupCode: 80 }, // Restaurant
                    ]
                }
            ]
        };
    }

    // ═══════════════════════════════════════════════════════════════════
    //  ACTIVITIES API
    // ═══════════════════════════════════════════════════════════════════

    /**
     * Pretraga dostupnih aktivnosti
     * Live: GET /activity-api/3.0/activities/availability
     */
    async searchActivities(request: ActivitySearchRequest): Promise<ActivitySearchResponse> {
        console.log('[Hotelbeds] Pretraga aktivnosti...', {
            from: request.from,
            to: request.to,
            destination: request.destination,
        });
        await this.mockDelay(700);

        return {
            auditData: this.mockAuditData(),
            activities: [
                {
                    code: 'E-E10-SNORK01',
                    name: 'Snorkling izlet – Cala Goldona',
                    description: 'Otkrijte podvodni svet Ibize na ovom 3-časovnom snorkling izletu sa profesionalnim instruktorom.',
                    country: { code: 'ES', name: 'Spain' },
                    destination: { code: 'IBZ', name: 'Ibiza' },
                    amountFrom: 45.00,
                    amountTo: 65.00,
                    currency: 'EUR',
                    categories: [{ code: 'WATER_SPORTS', name: 'Water Sports' }],
                    minAge: 12,
                    images: [
                        { url: 'https://photos.hotelbeds.com/giata/activity/snorkeling.jpg', visualizationOrder: 1 }
                    ],
                    modalities: [
                        {
                            code: 'MOD1',
                            name: 'Adult',
                            duration: { value: 180, metric: 'MIN' },
                            rates: [
                                { rateCode: 'ADT', name: 'Adult Rate', rateType: 'STANDARD', ageCategoryType: 'ADULT', amount: 55.00, currency: 'EUR' }
                            ]
                        },
                        {
                            code: 'MOD2',
                            name: 'Family Pack (2A+2C)',
                            rates: [
                                { rateCode: 'FAM', name: 'Family Pack', rateType: 'STANDARD', ageCategoryType: 'FAMILY', amount: 140.00, currency: 'EUR' }
                            ]
                        }
                    ],
                    coordinates: { longitude: 1.6524, latitude: 38.9992 }
                },
                {
                    code: 'E-E10-SUNST01',
                    name: 'Sunset Boat Cruise – Es Vedrà',
                    description: 'Romantičan zalazak sunca brodom sa koktajlom, muzikom i pogledom na čuvenu stenu Es Vedrà.',
                    country: { code: 'ES', name: 'Spain' },
                    destination: { code: 'IBZ', name: 'Ibiza' },
                    amountFrom: 75.00,
                    amountTo: 120.00,
                    currency: 'EUR',
                    categories: [{ code: 'BOAT_TOURS', name: 'Boat Tours' }],
                    minAdultAge: 18,
                    images: [
                        { url: 'https://photos.hotelbeds.com/giata/activity/boat-cruise.jpg', visualizationOrder: 1 }
                    ],
                    modalities: [
                        {
                            code: 'MOD1',
                            name: 'Standard',
                            duration: { value: 3, metric: 'H' },
                            rates: [
                                { rateCode: 'ADT', name: 'Per Person', rateType: 'STANDARD', ageCategoryType: 'ADULT', amount: 89.00, currency: 'EUR' }
                            ]
                        }
                    ]
                },
                {
                    code: 'E-E10-JEEP01',
                    name: 'Jeep Safari – Unutrašnjost ostrva',
                    description: 'Avantura kroz prašumu i skrivena mesta Ibize u džipu sa lokalnim vodičem.',
                    country: { code: 'ES', name: 'Spain' },
                    destination: { code: 'IBZ', name: 'Ibiza' },
                    amountFrom: 55.00,
                    amountTo: 90.00,
                    currency: 'EUR',
                    categories: [{ code: 'ADVENTURE', name: 'Adventure' }],
                    minAge: 8,
                    images: [
                        { url: 'https://photos.hotelbeds.com/giata/activity/jeep-safari.jpg', visualizationOrder: 1 }
                    ],
                    modalities: [
                        {
                            code: 'MOD1',
                            name: 'Full Day',
                            duration: { value: 8, metric: 'H' },
                            rates: [
                                { rateCode: 'ADT', name: 'Adult', rateType: 'STANDARD', ageCategoryType: 'ADULT', amount: 75.00, currency: 'EUR' },
                                { rateCode: 'CHD', name: 'Child (8-12)', rateType: 'STANDARD', ageCategoryType: 'CHILD', amount: 42.00, currency: 'EUR' }
                            ]
                        }
                    ]
                }
            ],
            total: 3
        };
    }

    // ═══════════════════════════════════════════════════════════════════
    //  TRANSFERS API
    // ═══════════════════════════════════════════════════════════════════

    /**
     * Pretraga dostupnih transfera
     * Live: GET /transfer-api/1.0/availability
     */
    async searchTransfers(request: TransferSearchRequest): Promise<TransferSearchResponse> {
        console.log('[Hotelbeds] Pretraga transfera...', {
            from: request.fromCode,
            to: request.toCode,
            adults: request.adults,
        });
        await this.mockDelay(650);

        return {
            auditData: this.mockAuditData(),
            currency: 'EUR',
            total: 3,
            services: [
                {
                    id: 1001,
                    direction: 'O',
                    transferType: 'PRIVATE',
                    vehicle: {
                        code: 'SEDAN',
                        name: 'Sedan',
                        description: 'Udoban privatni sedan za do 3 osobe sa prtljagom',
                        minPax: 1,
                        maxPax: 3,
                        images: [{ url: 'https://photos.hotelbeds.com/transfers/sedan.jpg', order: 1 }]
                    },
                    category: { code: 'STANDARD', name: 'Standard' },
                    price: {
                        amount: 45.00,
                        totalAmount: 45.00,
                        currency: 'EUR',
                        commissionPct: 10,
                        commissionAmount: 4.50,
                        netAmount: 40.50,
                    },
                    rateKey: `PRIV|SEDAN|${request.fromCode}|${request.toCode}|${request.outbound.dateTime}|${request.adults}`,
                    cancellationPolicies: [
                        { amount: '0.00', from: request.outbound.dateTime, type: 'FREE' }
                    ],
                    supplierDetails: {
                        name: 'Island Transfers IBZ',
                        vatNumber: 'ES87654321B',
                        productCode: 'TRF-001'
                    }
                },
                {
                    id: 1002,
                    direction: 'O',
                    transferType: 'PRIVATE',
                    vehicle: {
                        code: 'MINIVAN',
                        name: 'Minivan',
                        description: 'Prostrana minivan za grupe do 7 osoba',
                        minPax: 4,
                        maxPax: 7,
                        images: [{ url: 'https://photos.hotelbeds.com/transfers/minivan.jpg', order: 1 }]
                    },
                    category: { code: 'STANDARD', name: 'Standard' },
                    price: {
                        amount: 65.00,
                        totalAmount: 65.00,
                        currency: 'EUR',
                        commissionPct: 10,
                        commissionAmount: 6.50,
                        netAmount: 58.50,
                    },
                    rateKey: `PRIV|MINIVAN|${request.fromCode}|${request.toCode}|${request.outbound.dateTime}|${request.adults}`,
                    cancellationPolicies: [
                        { amount: '65.00', from: request.outbound.dateTime, type: 'NON_REFUNDABLE' }
                    ],
                    supplierDetails: {
                        name: 'Island Transfers IBZ',
                        vatNumber: 'ES87654321B',
                        productCode: 'TRF-002'
                    }
                },
                {
                    id: 1003,
                    direction: 'O',
                    transferType: 'SHUTTLE',
                    vehicle: {
                        code: 'COACH',
                        name: 'Shared Coach',
                        description: 'Ekonomični zajednički shuttle bus do hotela',
                        minPax: 1,
                        maxPax: 50,
                        images: [{ url: 'https://photos.hotelbeds.com/transfers/coach.jpg', order: 1 }]
                    },
                    category: { code: 'ECONOMY', name: 'Economy' },
                    price: {
                        amount: 15.00,
                        totalAmount: 15.00 * request.adults,
                        currency: 'EUR',
                        commissionPct: 8,
                        commissionAmount: 1.20 * request.adults,
                        netAmount: 13.80 * request.adults,
                    },
                    rateKey: `SHUT|COACH|${request.fromCode}|${request.toCode}|${request.outbound.dateTime}|${request.adults}`,
                    cancellationPolicies: [
                        { amount: '0.00', from: request.outbound.dateTime, type: 'FREE' }
                    ],
                    supplierDetails: {
                        name: 'Ibiza Express Shuttle',
                        vatNumber: 'ES11223344C',
                        productCode: 'TRF-003'
                    }
                }
            ]
        };
    }

    /**
     * Kreira rezervaciju transfera
     * Live: POST /transfer-api/1.0/bookings
     */
    async bookTransfer(request: TransferBookingRequest): Promise<TransferBookingResponse> {
        console.log('[Hotelbeds] Rezervacija transfera:', request.clientReference);
        await this.mockDelay(750);

        const reference = `TRF-HB-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

        return {
            auditData: this.mockAuditData(),
            booking: {
                reference,
                status: 'CONFIRMED',
                clientReference: request.clientReference,
                creationDate: new Date().toISOString().split('T')[0],
                holder: {
                    name: request.holder.name,
                    surname: request.holder.surname,
                    email: request.holder.email,
                },
                transfers: request.transfers.map((t, i) => ({
                    id: 1001 + i,
                    status: 'CONFIRMED',
                    transferType: 'PRIVATE',
                    vehicle: {
                        code: 'SEDAN',
                        name: 'Sedan',
                    },
                    price: {
                        amount: 45.00,
                        currency: 'EUR',
                    }
                })),
                totalAmount: 45.00,
                currency: 'EUR',
                remark: request.remark,
            }
        };
    }

    // ─── Audit Data Mock ──────────────────────────────────────────────
    private mockAuditData() {
        return {
            processTime: `${Math.floor(Math.random() * 500 + 100)}`,
            timestamp: new Date().toISOString(),
            requestHost: 'api.test.hotelbeds.com',
            serverId: `test-server-${Math.floor(Math.random() * 10 + 1)}`,
            environment: 'TEST',
        };
    }
}

// ─── Singleton ────────────────────────────────────────────────────────────────
const hotelbedsApiService = new HotelbedsApiService();
export default hotelbedsApiService;
