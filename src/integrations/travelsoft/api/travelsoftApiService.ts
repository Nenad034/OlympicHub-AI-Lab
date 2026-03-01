/**
 * Travelsoft NDC - Main API Service
 * 
 * Centralni servis za sve NDC 19.2 operacije:
 * airShopping, offerPrice, serviceList, seatAvailability,
 * orderCreate, orderRetrieve, orderChange, orderReshop, orderCancel
 */

import type {
    TravelsoftConfig,
    NDCAirShoppingRequest,
    NDCOffer,
    NDCOfferPriceRequest,
    NDCServiceListRequest,
    NDCService,
    NDCSeatAvailabilityRequest,
    NDCSeatMap,
    NDCOrderCreateRequest,
    NDCOrderCancelResponse,
    NDCOrderReshopResponse,
    NDCOrderChangeResponse
} from '../types/travelsoftTypes';
import type {
    FlightBookingRequest,
    FlightBookingResponse,
    UnifiedFlightOffer,
    CabinClass
} from '../../../types/flight.types';

import { getTravelsoftAuth, initTravelsoftAuth } from './travelsoftAuthService';
import {
    buildAirShoppingXml, parseAirShoppingResponse,
    buildOfferPriceXml, parseOfferPriceResponse,
    buildServiceListXml,
    buildSeatAvailabilityXml,
    buildOrderCreateXml, parseOrderCreateResponse,
    buildOrderRetrieveXml,
    buildOrderCancelXml,
    buildOrderReshopXml,
    buildOrderChangeXml
} from './travelsoftXmlBuilder';
import { mapNDCOffersToUnified, mapNDCOfferToUnified } from '../mappers/travelsoftMapper';

export class TravelsoftApiService {
    private config: TravelsoftConfig;
    private rateLimitState = { calls: 0, windowStart: Date.now() };
    private MAX_CALLS_PER_MINUTE = 30;

    constructor(config: TravelsoftConfig) {
        this.config = config;
        initTravelsoftAuth(config);
    }

    // ========================================================================
    // AIR SHOPPING
    // ========================================================================

    /**
     * Pretražuje letove. Vraća UnifiedFlightOffer[] za UI.
     * Čuva ShoppingResponseID za nastavak sesije.
     */
    async searchFlights(
        params: NDCAirShoppingRequest,
        cabinClass: CabinClass = 'economy'
    ): Promise<{ offers: UnifiedFlightOffer[]; shoppingResponseId: string }> {
        this.checkRateLimit();
        console.log('[Travelsoft] 🔍 AirShopping:', params);

        const xml = buildAirShoppingXml(params);
        const responseXml = await this.post('AirShopping', xml);
        const { offers: ndcOffers, shoppingResponseId } = parseAirShoppingResponse(responseXml);

        console.log(`[Travelsoft] ✅ AirShopping: ${ndcOffers.length} offera, session: ${shoppingResponseId}`);

        const unified = mapNDCOffersToUnified(ndcOffers, shoppingResponseId, cabinClass);
        return { offers: unified, shoppingResponseId };
    }

    // ========================================================================
    // OFFER PRICE
    // ========================================================================

    /**
     * Kvotira izabrani offer (proverava cenu u realnom vremenu).
     * Poziva se pre serviceList/seatAvailability i pre orderCreate.
     */
    async priceOffer(params: NDCOfferPriceRequest): Promise<NDCOffer[]> {
        this.checkRateLimit();
        console.log('[Travelsoft] 💰 OfferPrice:', params.offerIds);

        const xml = buildOfferPriceXml(params);
        const responseXml = await this.post('OfferPrice', xml);
        const offers = parseOfferPriceResponse(responseXml);

        console.log(`[Travelsoft] ✅ OfferPrice: ${offers.length} offera kvotirano`);
        return offers;
    }

    // ========================================================================
    // SERVICE LIST
    // ========================================================================

    /**
     * Vraća listu ancillarnih usluga (prtljag, sedišta za doplatu, obroci...).
     */
    async getServiceList(params: NDCServiceListRequest): Promise<NDCService[]> {
        this.checkRateLimit();
        console.log('[Travelsoft] 🧳 ServiceList for offer:', params.offerId);

        const xml = buildServiceListXml(params);
        const responseXml = await this.post('ServiceList', xml);

        // Parsira serviceList odgovor
        const services = this.parseServiceListResponse(responseXml);
        console.log(`[Travelsoft] ✅ ServiceList: ${services.length} usluga dostupno`);
        return services;
    }

    // ========================================================================
    // SEAT AVAILABILITY
    // ========================================================================

    /**
     * Vraća mapu sedišta za let.
     */
    async getSeatAvailability(params: NDCSeatAvailabilityRequest): Promise<NDCSeatMap[]> {
        this.checkRateLimit();
        console.log('[Travelsoft] 💺 SeatAvailability for offer:', params.offerId);

        const xml = buildSeatAvailabilityXml(params);
        const responseXml = await this.post('SeatAvailability', xml);

        const seatMaps = this.parseSeatAvailabilityResponse(responseXml);
        console.log(`[Travelsoft] ✅ SeatAvailability: ${seatMaps.length} kabin`);
        return seatMaps;
    }

    // ========================================================================
    // ORDER CREATE
    // ========================================================================

    /**
     * Kreira rezervaciju / booking.
     */
    async createOrder(params: NDCOrderCreateRequest): Promise<FlightBookingResponse> {
        this.checkRateLimit();
        console.log('[Travelsoft] 📝 OrderCreate for offer:', params.offerId);

        const xml = buildOrderCreateXml(params);
        const responseXml = await this.post('OrderCreate', xml);
        const result = parseOrderCreateResponse(responseXml);

        console.log(`[Travelsoft] ✅ OrderCreate: orderID=${result.orderId}, PNR=${result.pnr}, status=${result.status}`);

        return {
            success: result.status !== 'FAILED',
            status: result.status === 'CONFIRMED' ? 'confirmed' :
                result.status === 'FAILED' ? 'failed' : 'pending',
            bookingReference: result.orderId,
            pnr: result.pnr,
            providerBookingId: result.orderId,
            ticketNumbers: result.ticketNumbers,
            message: result.status === 'CONFIRMED'
                ? `Rezervacija potvrđena. PNR: ${result.pnr}`
                : 'Rezervacija je na čekanju.',
            bookedAt: new Date().toISOString()
        };
    }

    // ========================================================================
    // ORDER RETRIEVE
    // ========================================================================

    /**
     * Preuzima detalje postojeće rezervacije.
     */
    async retrieveOrder(orderId: string): Promise<any> {
        this.checkRateLimit();
        console.log('[Travelsoft] 🔎 OrderRetrieve:', orderId);

        const xml = buildOrderRetrieveXml(orderId);
        const responseXml = await this.post('OrderRetrieve', xml);
        return { raw: responseXml };
    }

    // ========================================================================
    // ORDER RESHOP (naknada za otkazivanje)
    // ========================================================================

    /**
     * Dobija informaciju o naknadi za otkazivanje pre samog cancellogja.
     */
    async reshopOrder(orderId: string): Promise<NDCOrderReshopResponse> {
        this.checkRateLimit();
        console.log('[Travelsoft] 💸 OrderReshop:', orderId);

        const xml = buildOrderReshopXml(orderId);
        const responseXml = await this.post('OrderReshop', xml);
        return this.parseReshopResponse(responseXml);
    }

    // ========================================================================
    // ORDER CANCEL
    // ========================================================================

    /**
     * Otkazuje rezervaciju.
     */
    async cancelOrder(orderId: string): Promise<NDCOrderCancelResponse> {
        this.checkRateLimit();
        console.log('[Travelsoft] ❌ OrderCancel:', orderId);

        const xml = buildOrderCancelXml(orderId);
        const responseXml = await this.post('OrderCancel', xml);
        return this.parseCancelResponse(responseXml);
    }

    // ========================================================================
    // ORDER CHANGE (ticketing)
    // ========================================================================

    /**
     * Izdaje karate (ISSUE_TICKET) za potvrđenu rezervaciju.
     */
    async changeOrder(orderId: string): Promise<NDCOrderChangeResponse> {
        this.checkRateLimit();
        console.log('[Travelsoft] 🎫 OrderChange / Issue Ticket:', orderId);

        const xml = buildOrderChangeXml(orderId);
        const responseXml = await this.post('OrderChange', xml);
        return this.parseOrderChangeResponse(responseXml);
    }

    // ========================================================================
    // HTTP LAYER
    // ========================================================================

    /**
     * Šalje POST request na Travelsoft REST endpoint.
     * Automatski pribavlja AuthToken.
     */
    private async post(operation: string, xmlBody: string): Promise<string> {
        const auth = getTravelsoftAuth();
        const headers = await auth.buildAuthHeaders();

        const url = `${this.config.baseUrl}/${operation}`;

        console.log(`[Travelsoft] POST ${url}`);

        const response = await fetch(url, {
            method: 'POST',
            headers,
            body: xmlBody,
            signal: AbortSignal.timeout(this.config.timeout)
        });

        if (response.status === 401) {
            // Token istekao — invalidiramo i pokušavamo ponovo
            auth.invalidateToken();
            const retryHeaders = await auth.buildAuthHeaders();
            const retryResponse = await fetch(url, {
                method: 'POST',
                headers: retryHeaders,
                body: xmlBody,
                signal: AbortSignal.timeout(this.config.timeout)
            });

            if (!retryResponse.ok) {
                const errText = await retryResponse.text();
                throw new Error(`[Travelsoft] ${operation} failed (retry): HTTP ${retryResponse.status}\n${errText}`);
            }

            return retryResponse.text();
        }

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`[Travelsoft] ${operation} failed: HTTP ${response.status}\n${errText.substring(0, 500)}`);
        }

        return response.text();
    }

    // ========================================================================
    // RESPONSE PARSERS (simple implementations)
    // ========================================================================

    private parseServiceListResponse(xml: string): NDCService[] {
        // Minimalna implementacija — vraća prazan niz dok nemamo realne primere
        // Proširuje se kada se dobiju realni XML primeri od Travelsofta
        const services: NDCService[] = [];
        const bagMatch = xml.match(/<Service[^>]*>([\s\S]*?)<\/Service>/g);
        (bagMatch || []).forEach((s, i) => {
            services.push({
                ServiceID: `svc-${i}`,
                Name: this.extractTag(s, 'Name') || 'Service',
                Code: this.extractTag(s, 'Code') || 'SVC',
                ServiceType: 'OTHER',
                Description: this.extractTag(s, 'Description')
            });
        });
        return services;
    }

    private parseSeatAvailabilityResponse(xml: string): NDCSeatMap[] {
        // Minimalna implementacija — proširuje se sa realnim XML primerima
        return [];
    }

    private parseReshopResponse(xml: string): NDCOrderReshopResponse {
        const feeAmount = parseFloat(this.extractTag(xml, 'Amount') || '0');
        return {
            CancelFee: feeAmount > 0 ? { Amount: feeAmount, CurrencyCode: 'EUR' } : undefined
        };
    }

    private parseCancelResponse(xml: string): NDCOrderCancelResponse {
        const success = !xml.toLowerCase().includes('<error>');
        return { Success: success };
    }

    private parseOrderChangeResponse(xml: string): NDCOrderChangeResponse {
        const success = !xml.toLowerCase().includes('<error>');
        const tickets = xml.match(/<TicketDocNbr>([^<]+)<\/TicketDocNbr>/g)?.map(t =>
            t.replace(/<\/?TicketDocNbr>/g, '')
        );
        return { Success: success, TicketNumbers: tickets };
    }

    private extractTag(xml: string, tag: string): string | undefined {
        const m = xml.match(new RegExp(`<${tag}[^>]*>([^<]+)</${tag}>`));
        return m ? m[1].trim() : undefined;
    }

    // ========================================================================
    // RATE LIMITING
    // ========================================================================

    private checkRateLimit(): void {
        const now = Date.now();
        if (now - this.rateLimitState.windowStart > 60000) {
            this.rateLimitState = { calls: 0, windowStart: now };
        }
        this.rateLimitState.calls++;
        if (this.rateLimitState.calls > this.MAX_CALLS_PER_MINUTE) {
            throw new Error(`[Travelsoft] Rate limit: max ${this.MAX_CALLS_PER_MINUTE} poziva/min. Pokušajte za trenutak.`);
        }
    }

    // ========================================================================
    // STATUS CHECK
    // ========================================================================

    isConfigured(): boolean {
        return !!(this.config.baseUrl && this.config.username && this.config.password);
    }

    getConfig(): Partial<TravelsoftConfig> {
        return {
            baseUrl: this.config.baseUrl,
            provider: this.config.provider,
            apiVersion: this.config.apiVersion
        };
    }
}

// ============================================================================
// SINGLETON
// ============================================================================

let apiInstance: TravelsoftApiService | null = null;

export function initTravelsoftApi(config: TravelsoftConfig): TravelsoftApiService {
    apiInstance = new TravelsoftApiService(config);
    return apiInstance;
}

export function getTravelsoftApi(): TravelsoftApiService {
    if (!apiInstance) {
        throw new Error('[Travelsoft] ApiService not initialized. Call initTravelsoftApi() first.');
    }
    return apiInstance;
}

/**
 * Inicijalizuje Travelsoft iz env varijabli
 */
export function initTravelsoftFromEnv(): TravelsoftApiService | null {
    const baseUrl = import.meta.env.VITE_TRAVELSOFT_BASE_URL;
    const username = import.meta.env.VITE_TRAVELSOFT_USERNAME;
    const password = import.meta.env.VITE_TRAVELSOFT_PASSWORD;
    const provider = import.meta.env.VITE_TRAVELSOFT_PROVIDER || 'SWITCHALLINONE';
    const apiVersion = import.meta.env.VITE_TRAVELSOFT_API_VERSION || '1.0';

    if (!baseUrl || !username || !password) {
        console.warn('[Travelsoft] Missing env vars. Set VITE_TRAVELSOFT_BASE_URL, VITE_TRAVELSOFT_USERNAME, VITE_TRAVELSOFT_PASSWORD');
        return null;
    }

    return initTravelsoftApi({
        baseUrl,
        username,
        password,
        provider,
        apiVersion,
        timeout: 30000
    });
}

export default TravelsoftApiService;
