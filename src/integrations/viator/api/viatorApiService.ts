import type {
    ViatorCredentials,
    ViatorDestinationsResponse,
    ViatorProductsResponse,
    ViatorProduct,
    ViatorSearchRequest,
    ViatorSearchResponse,
    ViatorFreetextSearchRequest,
    ViatorAvailabilityCheckRequest,
    ViatorAvailabilityCheckResponse,
    ViatorAvailabilitySchedule,
    ViatorBookingHoldRequest,
    ViatorBookingHoldResponse,
    ViatorBookingRequest,
    ViatorBookingResponse,
    ViatorBookingStatusResponse,
    ViatorCancellationReason,
    ViatorCancellationRequest,
    ViatorCancellationResponse,
    ViatorRecommendationsRequest,
    ViatorRecommendationsResponse,
    ViatorTagsResponse,
    ViatorReviewsResponse,
} from '../types/viatorTypes';

// ─── Base URLs ────────────────────────────────────────────────────────────────

const VIATOR_BASE_URLS = {
    sandbox: 'https://api.sandbox.viator.com/partner',
    production: 'https://api.viator.com/partner',
};

const VIATOR_API_VERSION = '2.0';

// ─── Servis ───────────────────────────────────────────────────────────────────

export class ViatorApiService {
    private credentials: ViatorCredentials | null = null;
    private baseUrl: string = VIATOR_BASE_URLS.sandbox;

    // ─── Konfiguracija ────────────────────────────────────────────────
    configure(credentials: ViatorCredentials): void {
        this.credentials = credentials;
        this.baseUrl = credentials.environment === 'production'
            ? VIATOR_BASE_URLS.production
            : VIATOR_BASE_URLS.sandbox;
        console.log(`[Viator] Konfigurisan za ${credentials.environment} (${credentials.partnerType}). Base: ${this.baseUrl}`);
    }

    isConfigured(): boolean {
        return !!this.credentials?.apiKey;
    }

    getEnvironment(): string {
        return this.credentials?.environment ?? 'sandbox';
    }

    getPartnerType(): string {
        return this.credentials?.partnerType ?? 'affiliate';
    }

    // ─── Headers ──────────────────────────────────────────────────────
    private getHeaders(language = 'en-US'): Record<string, string> {
        if (!this.credentials) {
            throw new Error('[Viator] Servis nije konfigurisan. Pozovite configure() najpre.');
        }
        return {
            'exp-api-key': this.credentials.apiKey,
            'Accept-Language': language,
            'Accept': 'application/json;version=' + VIATOR_API_VERSION,
            'Content-Type': 'application/json',
        };
    }

    // ─── Mock delay ───────────────────────────────────────────────────
    private async mockDelay(ms = 650): Promise<void> {
        await new Promise(resolve => setTimeout(resolve, ms));
    }

    // ─── Mock audit helper ────────────────────────────────────────────
    private mockPagination(total: number, count: number) {
        return { count, totalCount: total };
    }

    // ═══════════════════════════════════════════════════════════════════
    //  DESTINATIONS
    // ═══════════════════════════════════════════════════════════════════

    /**
     * Dohvata listu destinacija
     * Live: GET /destinations
     */
    async getDestinations(): Promise<ViatorDestinationsResponse> {
        console.log('[Viator] Dohvatanje destinacija...');
        await this.mockDelay(500);
        return {
            destinations: [
                { destinationId: 732, destinationName: 'Rome', destinationType: 'CITY', destinationUrlName: 'Rome', defaultCurrencyCode: 'EUR', lookupId: '2.6.732', timeZone: 'Europe/Rome' },
                { destinationId: 662, destinationName: 'Barcelona', destinationType: 'CITY', destinationUrlName: 'Barcelona', defaultCurrencyCode: 'EUR', lookupId: '2.5.662', timeZone: 'Europe/Madrid' },
                { destinationId: 687, destinationName: 'Paris', destinationType: 'CITY', destinationUrlName: 'Paris', defaultCurrencyCode: 'EUR', lookupId: '2.5.687', timeZone: 'Europe/Paris' },
                { destinationId: 694, destinationName: 'New York', destinationType: 'CITY', destinationUrlName: 'New-York', defaultCurrencyCode: 'USD', lookupId: '77.5694', timeZone: 'America/New_York' },
                { destinationId: 562, destinationName: 'Dubrovnik', destinationType: 'CITY', destinationUrlName: 'Dubrovnik', defaultCurrencyCode: 'EUR', lookupId: '2.7.562', timeZone: 'Europe/Zagreb' },
                { destinationId: 1000, destinationName: 'Beograd', destinationType: 'CITY', destinationUrlName: 'Belgrade', defaultCurrencyCode: 'EUR', lookupId: '2.7.1000', timeZone: 'Europe/Belgrade' },
            ],
            pagination: this.mockPagination(250, 6),
        };
    }

    /**
     * Dohvata listu tagova/kategorija
     * Live: GET /tags
     */
    async getTags(): Promise<ViatorTagsResponse> {
        console.log('[Viator] Dohvatanje tagova...');
        await this.mockDelay(400);
        return {
            tags: [
                { tagId: 1, allNamesByLocale: { 'en': 'Tours', 'sr': 'Ture' } },
                { tagId: 2, allNamesByLocale: { 'en': 'Museum Tickets', 'sr': 'Ulaznice za muzeje' } },
                { tagId: 3, allNamesByLocale: { 'en': 'Food & Drink', 'sr': 'Hrana i piće' } },
                { tagId: 4, allNamesByLocale: { 'en': 'Outdoor Activities', 'sr': 'Aktivnosti na otvorenom' } },
                { tagId: 5, allNamesByLocale: { 'en': 'Day Trips', 'sr': 'Jednodnevni izleti' } },
                { tagId: 6, allNamesByLocale: { 'en': 'Boat Tours', 'sr': 'Izleti brodom' } },
                { tagId: 7, allNamesByLocale: { 'en': 'Skip-the-Line', 'sr': 'Preskakanje reda' } },
                { tagId: 8, allNamesByLocale: { 'en': 'Cultural & Theme Tours', 'sr': 'Kulturne ture' } },
            ]
        };
    }

    // ═══════════════════════════════════════════════════════════════════
    //  PRODUCTS — SEARCH
    // ═══════════════════════════════════════════════════════════════════

    /**
     * Slobodna tekstualna pretraga (Destinations + Products)
     * Live: POST /search/freetext
     */
    async freetextSearch(request: ViatorFreetextSearchRequest): Promise<ViatorSearchResponse> {
        console.log('[Viator] Freetext pretraga:', request.searchTerm);
        await this.mockDelay(700);
        return {
            products: {
                results: this.mockProductList(request.searchTerm),
                totalCount: 3,
            },
            destinations: {
                results: [
                    { destinationId: 732, destinationName: 'Rome', destinationType: 'CITY', destinationUrlName: 'Rome', defaultCurrencyCode: 'EUR', lookupId: '2.6.732', timeZone: 'Europe/Rome' },
                ],
                totalCount: 1,
            }
        };
    }

    /**
     * Pretraga produkata sa filterima
     * Live: POST /products/search
     */
    async searchProducts(request: ViatorSearchRequest): Promise<ViatorSearchResponse> {
        console.log('[Viator] Pretraga produkata filtri...', request.filtering);
        await this.mockDelay(750);
        return {
            products: {
                results: this.mockProductList(),
                totalCount: 3,
            }
        };
    }

    // ═══════════════════════════════════════════════════════════════════
    //  PRODUCTS — CONTENT
    // ═══════════════════════════════════════════════════════════════════

    /**
     * Detalji jednog produkta
     * Live: GET /products/{product-code}
     */
    async getProduct(productCode: string): Promise<ViatorProduct> {
        console.log('[Viator] Dohvatanje produkta:', productCode);
        await this.mockDelay(500);
        return this.mockFullProduct(productCode);
    }

    /**
     * Bulk produkata (za više odjednom)
     * Live: POST /products/bulk
     */
    async getProductsBulk(productCodes: string[]): Promise<ViatorProductsResponse> {
        console.log('[Viator] Bulk produkata:', productCodes.length);
        await this.mockDelay(600);
        return {
            products: productCodes.map(code => this.mockFullProduct(code)),
            pagination: this.mockPagination(productCodes.length, productCodes.length),
        };
    }

    /**
     * Recenzije produkta
     * Live: GET /products/{product-code}/reviews
     */
    async getProductReviews(productCode: string, count = 10): Promise<ViatorReviewsResponse> {
        console.log('[Viator] Recenzije za:', productCode);
        await this.mockDelay(450);
        return {
            reviews: [
                {
                    reviewReference: 'RVW-001',
                    productCode,
                    rating: 5,
                    helpfulVotes: 12,
                    publishedDate: '2026-02-20',
                    title: 'Fantastično iskustvo!',
                    text: 'Vodič je bio odličan, sve je organizovano savršeno. Toplo preporučujem svima koji posećuju grad.',
                    travelerType: 'Couple',
                    submissionDate: '2026-02-19',
                    reviewer: { displayName: 'Marko M.', countryCode: 'RS' },
                },
                {
                    reviewReference: 'RVW-002',
                    productCode,
                    rating: 4,
                    helpfulVotes: 5,
                    publishedDate: '2026-02-15',
                    title: 'Preporučujem',
                    text: 'Veoma lep izlet, malo duže čekanje na ulazu ali uglavnom dobro.',
                    submissionDate: '2026-02-14',
                    reviewer: { displayName: 'Jovanka P.', countryCode: 'RS' },
                }
            ],
            totalCount: 2,
            rating: { averageRating: 4.8, ratingCount: 2 },
        };
    }

    // ═══════════════════════════════════════════════════════════════════
    //  AVAILABILITY
    // ═══════════════════════════════════════════════════════════════════

    /**
     * Detaljan raspored dostupnosti za produkt
     * Live: GET /availability/schedules/{product-code}
     */
    async getAvailabilitySchedule(productCode: string): Promise<ViatorAvailabilitySchedule> {
        console.log('[Viator] Raspored dostupnosti za:', productCode);
        await this.mockDelay(550);
        return {
            productCode,
            currency: 'EUR',
            summary: { fromPrice: 45.00 },
            bookableItems: [
                {
                    productOptionCode: 'standard',
                    availability: [
                        { startTime: '09:00', available: true, vacancies: 20 },
                        { startTime: '11:00', available: true, vacancies: 15 },
                        { startTime: '14:00', available: false, vacancies: 0 },
                        { startTime: '16:00', available: true, vacancies: 8 },
                    ]
                }
            ]
        };
    }

    /**
     * Provera dostupnosti + cene za konkretan datum i pax mix
     * Live: POST /availability/check
     */
    async checkAvailability(request: ViatorAvailabilityCheckRequest): Promise<ViatorAvailabilityCheckResponse> {
        console.log('[Viator] Check availability:', request.productCode, request.travelDate, request.paxMix);
        await this.mockDelay(650);

        const adultCount = request.paxMix.find(p => p.ageBand === 'ADULT')?.numberOfTravelers ?? 1;
        const childCount = request.paxMix.find(p => p.ageBand === 'CHILD')?.numberOfTravelers ?? 0;
        const pricePerAdult = 55.00;
        const pricePerChild = 35.00;
        const totalRetail = adultCount * pricePerAdult + childCount * pricePerChild;
        const totalNet = totalRetail * 0.82;

        return {
            productCode: request.productCode,
            productOptionCode: request.productOptionCode,
            currency: request.currency,
            travelDate: request.travelDate,
            startTime: request.startTime,
            lineItems: [
                ...(adultCount > 0 ? [{
                    ageBand: 'ADULT' as const,
                    numberOfTravelers: adultCount,
                    subtotalPrice: {
                        recommendedRetailPrice: adultCount * pricePerAdult,
                        partnerNetPrice: adultCount * pricePerAdult * 0.82,
                        bookingFee: 2.50,
                        currencyCode: request.currency,
                    }
                }] : []),
                ...(childCount > 0 ? [{
                    ageBand: 'CHILD' as const,
                    numberOfTravelers: childCount,
                    subtotalPrice: {
                        recommendedRetailPrice: childCount * pricePerChild,
                        partnerNetPrice: childCount * pricePerChild * 0.82,
                        bookingFee: 1.50,
                        currencyCode: request.currency,
                    }
                }] : [])
            ],
            totalPrice: {
                recommendedRetailPrice: totalRetail,
                partnerNetPrice: totalNet,
                bookingFee: adultCount * 2.5 + childCount * 1.5,
                currencyCode: request.currency,
            },
            paxMix: request.paxMix,
        };
    }

    // ═══════════════════════════════════════════════════════════════════
    //  BOOKING
    // ═══════════════════════════════════════════════════════════════════

    /**
     * Hold availability + pricing
     * Live: POST /bookings/hold
     */
    async holdBooking(request: ViatorBookingHoldRequest): Promise<ViatorBookingHoldResponse> {
        console.log('[Viator] Hold booking za:', request.productCode, request.travelDate);
        await this.mockDelay(700);

        const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 min hold
        const adultCount = request.paxMix.find(p => p.ageBand === 'ADULT')?.numberOfTravelers ?? 1;

        return {
            cartRef: `VTR-HOLD-${Date.now()}`,
            expires: expiresAt,
            lineItems: [{
                ageBand: 'ADULT',
                numberOfTravelers: adultCount,
                subtotalPrice: {
                    recommendedRetailPrice: adultCount * 55.00,
                    partnerNetPrice: adultCount * 45.10,
                    bookingFee: 2.50,
                    currencyCode: request.currency,
                }
            }],
            totalPrice: {
                recommendedRetailPrice: adultCount * 55.00,
                partnerNetPrice: adultCount * 45.10,
                bookingFee: 2.50,
                currencyCode: request.currency,
            }
        };
    }

    /**
     * Potvrda / kreiranje rezervacije
     * Live: POST /bookings/book
     */
    async confirmBooking(request: ViatorBookingRequest): Promise<ViatorBookingResponse> {
        console.log('[Viator] Kreiranje rezervacije:', request.productCode, request.travelDate);
        await this.mockDelay(900);

        const bookingRef = `VTR-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
        const adultCount = request.paxMix.find(p => p.ageBand === 'ADULT')?.numberOfTravelers ?? 1;

        return {
            bookings: [{
                bookingRef,
                partnerBookingRef: request.partnerBookingRef,
                productCode: request.productCode,
                productOptionCode: request.productOptionCode,
                bookingStatus: 'CONFIRMED',
                createdAt: new Date().toISOString(),
                travelDate: request.travelDate,
                startTime: request.startTime,
                paxMix: request.paxMix,
                currency: request.currency,
                totalPrice: {
                    recommendedRetailPrice: adultCount * 55.00,
                    partnerNetPrice: adultCount * 45.10,
                    bookingFee: 2.50,
                    currencyCode: request.currency,
                },
                voucherInfo: {
                    barcode: `VCH-${bookingRef}`,
                    entries: [
                        { description: 'Booking Reference', value: bookingRef },
                        { description: 'Voucher Type', value: 'ELECTRONIC' },
                        { description: 'Exchange For', value: 'Ticket at venue' },
                    ]
                },
                confirmationType: 'INSTANT',
                cancellationPolicy: {
                    type: 'STANDARD',
                    description: 'Full refund if cancelled 24 hours before travel date',
                    cancelIfBadWeather: false,
                    cancelIfInsufficientTravelers: false,
                    refundEligibility: [
                        { dayRangeMin: 1, percentageRefundable: 100, policyType: 'STANDARD' },
                        { dayRangeMin: 0, dayRangeMax: 1, percentageRefundable: 0, policyType: 'STANDARD' },
                    ]
                }
            }]
        };
    }

    /**
     * Status rezervacije
     * Live: GET /bookings/status?bookingRef={ref}
     */
    async getBookingStatus(bookingRef: string): Promise<ViatorBookingStatusResponse> {
        console.log('[Viator] Status rezervacije:', bookingRef);
        await this.mockDelay(400);
        return {
            bookingRef,
            bookingStatus: 'CONFIRMED',
            productCode: 'VTR-PROD-001',
            travelDate: '2026-07-20',
            createdAt: new Date().toISOString(),
            totalPrice: {
                recommendedRetailPrice: 110.00,
                partnerNetPrice: 90.20,
                currencyCode: 'EUR',
            },
            voucherInfo: { barcode: `VCH-${bookingRef}` }
        };
    }

    /**
     * Razlozi za otkazivanje
     * Live: GET /cancellations/reasons
     */
    async getCancellationReasons(): Promise<ViatorCancellationReason[]> {
        await this.mockDelay(300);
        return [
            { cancellationReasonCode: 'CUSTOMER_CANCELLATION', cancellationReasonText: 'Klijent je otkazao putovanje' },
            { cancellationReasonCode: 'WEATHER', cancellationReasonText: 'Loše vremenski uslovi' },
            { cancellationReasonCode: 'HEALTH', cancellationReasonText: 'Zdravstveni razlog' },
            { cancellationReasonCode: 'TRAVEL_PLANS_CHANGED', cancellationReasonText: 'Promena planova putovanja' },
            { cancellationReasonCode: 'DOUBLE_BOOKING', cancellationReasonText: 'Dupla rezervacija' },
            { cancellationReasonCode: 'OTHER', cancellationReasonText: 'Ostali razlozi' },
        ];
    }

    /**
     * Otkazivanje rezervacije
     * Live: DELETE /bookings/{booking-ref}
     */
    async cancelBooking(request: ViatorCancellationRequest): Promise<ViatorCancellationResponse> {
        console.log('[Viator] Otkazivanje rezervacije:', request.bookingRef);
        await this.mockDelay(700);
        return {
            bookingRef: request.bookingRef,
            status: 'CANCELLED',
            refundDetails: {
                refundAmount: 110.00,
                currencyCode: 'EUR',
                refundPercentage: 100,
            }
        };
    }

    /**
     * Preporuke sličnih produkata
     * Live: POST /products/recommendations
     */
    async getRecommendations(request: ViatorRecommendationsRequest): Promise<ViatorRecommendationsResponse> {
        console.log('[Viator] Preporuke za:', request.productCodes);
        await this.mockDelay(500);
        return {
            products: this.mockProductList(),
        };
    }

    // ═══════════════════════════════════════════════════════════════════
    //  MOCK DATA HELPERS
    // ═══════════════════════════════════════════════════════════════════

    private mockProductList(searchTerm?: string) {
        return [
            {
                productCode: 'VTR-ROME-001',
                title: 'Koleoseum & Rimski Forum Tura — Preskakanje reda',
                description: 'Obilazak Koloseuma, Rimskog Foruma i Palatinskog brda sa profesionalnim vodičem bez čekanja u redu.',
                productUrl: 'https://www.viator.com/tours/Rome/rome-colosseum/d548-VTR-ROME-001',
                images: [{ imageSource: 'LIBRARY', caption: 'Colosseum', isCover: true, variants: [{ url: 'https://images.viator.com/rome-colosseum.jpg', width: 800, height: 600 }] }],
                pricing: { fromPrice: 55.00, currencyCode: 'EUR' },
                reviews: { combinedAverageRating: 4.8, totalReviews: 12450 },
                duration: { fixedDurationInMinutes: 180 },
                destinations: [{ ref: '732', primary: true }],
                tags: [1, 7, 8],
            },
            {
                productCode: 'VTR-BCN-001',
                title: 'Sagrada Família — Privatan Obilazak sa Pristupom Tornjima',
                description: 'Ekskluzivni pristup Sagrada Família sa ulaznicama za tornjeve i stručnim vodičem koji priča priču o Gaudijevom majstordelu.',
                productUrl: 'https://www.viator.com/tours/Barcelona/sagrada-familia/d562-VTR-BCN-001',
                images: [{ imageSource: 'LIBRARY', caption: 'Sagrada Familia', isCover: true, variants: [{ url: 'https://images.viator.com/sagrada-familia.jpg', width: 800, height: 600 }] }],
                pricing: { fromPrice: 89.00, currencyCode: 'EUR' },
                reviews: { combinedAverageRating: 4.9, totalReviews: 8200 },
                duration: { variableDurationFromMinutes: 90, variableDurationToMinutes: 120 },
                destinations: [{ ref: '662', primary: true }],
                tags: [1, 2, 7],
            },
            {
                productCode: 'VTR-PAR-001',
                title: 'Eiffelov Toranj — Tura s Pristupom Vrhu',
                description: 'Dočekajte zalazak sunca sa vrha Eiffelovog tornja sa pristupom i komentarom od strane stručnog vodiča. Uključuje lift na vrh.',
                productUrl: 'https://www.viator.com/tours/Paris/eiffel-tower/d479-VTR-PAR-001',
                images: [{ imageSource: 'LIBRARY', caption: 'Eiffel Tower', isCover: true, variants: [{ url: 'https://images.viator.com/eiffel-tower.jpg', width: 800, height: 600 }] }],
                pricing: { fromPrice: 72.00, currencyCode: 'EUR' },
                reviews: { combinedAverageRating: 4.7, totalReviews: 18900 },
                duration: { fixedDurationInMinutes: 120 },
                destinations: [{ ref: '687', primary: true }],
                tags: [1, 5, 7],
            }
        ];
    }

    private mockFullProduct(productCode: string): import('../types/viatorTypes').ViatorProduct {
        return {
            productCode,
            status: 'ACTIVE',
            productUrl: `https://www.viator.com/tours/${productCode}`,
            title: 'Koleoseum & Rimski Forum Tura — Preskakanje reda',
            description: 'Obilazak Koloseuma, Rimskog Foruma i Palatinskog brda sa profesionalnim vodičem bez čekanja u redu.\n\nOva tura vam omogućava da preskočite dugačke redove i direktno uđete u jedan od najimpresivnijih istorijskih lokaliteta na svetu.',
            shortDescription: 'Koloseums sa profy vodičem bez čekanja',
            duration: { fixedDurationInMinutes: 180 },
            pricingInfo: {
                type: 'PER_PERSON',
                ageBands: [
                    { ageBand: 'ADULT', startAge: 18, endAge: 99, minTravelersPerBooking: 1, maxTravelersPerBooking: 15 },
                    { ageBand: 'CHILD', startAge: 6, endAge: 17, minTravelersPerBooking: 0, maxTravelersPerBooking: 10 },
                    { ageBand: 'INFANT', startAge: 0, endAge: 5, minTravelersPerBooking: 0, maxTravelersPerBooking: 5 },
                ]
            },
            pricing: { fromPrice: 55.00, currencyCode: 'EUR' },
            images: [
                { imageSource: 'LIBRARY', caption: 'Colosseum exterior', isCover: true, variants: [{ url: 'https://images.viator.com/colosseum-ext.jpg', width: 800, height: 600 }, { url: 'https://images.viator.com/colosseum-ext-thumb.jpg', width: 400, height: 300 }] },
                { imageSource: 'LIBRARY', caption: 'Roman Forum', isCover: false, variants: [{ url: 'https://images.viator.com/roman-forum.jpg', width: 800, height: 600 }] },
            ],
            reviews: { combinedAverageRating: 4.8, totalReviews: 12450 },
            destinations: [{ ref: '732', primary: true }],
            tags: [1, 7, 8],
            flags: ['SKIP_THE_LINE'],
            inclusions: [
                { categoryType: 'TRANSPORT', typeDescription: 'Ticket / entrance fee' },
                { categoryType: 'GUIDE', typeDescription: 'Professional local guide' },
            ],
            exclusions: [
                { categoryType: 'FOOD_AND_DRINK', typeDescription: 'Food and drinks' },
            ],
            additionalInfo: [
                { type: 'PHYSICAL_REQUIREMENTS', description: 'Walking involved — comfortable shoes recommended' },
                { type: 'CONFIRMATION', description: 'You will receive a confirmation by email' },
            ],
            bookingConfirmationSettings: { confirmationType: 'INSTANT' },
            bookingQuestions: [
                { id: 'BQ-FULL_NAMES_FIRST', question: 'First/given name for lead traveler', required: true, hint: 'As shown on passport', inputType: 'TEXT_SHORT', sanitizedAnswer: undefined, group: 'PER_BOOKING', travelerRequirement: 'PER_BOOKING' },
                { id: 'BQ-FULL_NAMES_LAST', question: 'Last/family name for lead traveler', required: true, hint: 'As shown on passport', inputType: 'TEXT_SHORT', sanitizedAnswer: undefined, group: 'PER_BOOKING', travelerRequirement: 'PER_BOOKING' },
            ],
            cancellationPolicy: {
                type: 'STANDARD',
                description: 'Full refund if cancelled 24 hours before travel date',
                cancelIfBadWeather: false,
                cancelIfInsufficientTravelers: false,
            },
            languageGuides: [{ type: 'GUIDE', language: 'en' }, { type: 'GUIDE', language: 'it' }],
            productOptions: [
                { productOptionCode: 'standard', description: 'Standard entry', title: 'Standard' },
                { productOptionCode: 'premium', description: 'Premium entry with underground rooms', title: 'Premium' },
            ],
            supplier: { name: 'Roma Travel Tours SRL', supplierId: 'SUP-12345' },
            logistics: {
                start: [{ location: { ref: 'LOC-COLOS', name: 'Colosseum main entrance' }, description: 'Meet guide at main entrance' }],
            },
            timeZone: 'Europe/Rome',
        };
    }
}

// ─── Singleton ────────────────────────────────────────────────────────────────
const viatorApiService = new ViatorApiService();
export default viatorApiService;
