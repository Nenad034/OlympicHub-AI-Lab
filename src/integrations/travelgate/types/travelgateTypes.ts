// =============================================================================
// Travelgate Hotel-X GraphQL API — TypeScript Types
// API: https://api.travelgate.com/
// Docs: https://docs.travelgate.com/docs/apis/for-buyers/hotel-x-pull-buyers-api/
// =============================================================================

// ─── Config ──────────────────────────────────────────────────────────────────

export interface TravelgateConfig {
    apiKey: string;
    client: string;
    endpoint?: string; // default: https://api.travelgate.com/
    timeout?: number;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
// Auth je API Key based — header "TGX-Auth-API-Key": apiKey

// ─── Search / Availability ────────────────────────────────────────────────────

export interface TravelgatePax {
    age: number;
}

export interface TravelgateOccupancy {
    paxes: TravelgatePax[];
}

export interface TravelgateSearchCriteria {
    checkIn: string;           // YYYY-MM-DD
    checkOut: string;          // YYYY-MM-DD
    hotels?: string[];         // hotel codes (max 200)
    destinations?: string[];   // destination codes (alternative to hotels)
    occupancies: TravelgateOccupancy[];
    currency?: string;         // EUR, USD...
    markets?: string[];        // ES, RS, DE...
    language?: string;         // en, sr...
    nationality?: string;      // country code
}

export interface TravelgateSearchSettings {
    context?: string;
    client?: string;
    testMode?: boolean;
    auditTransactions?: boolean;
    timeout?: number;
    suppliers?: TravelgateSupplierSettings[];
}

export interface TravelgateSupplierSettings {
    supplier: string;
    accesses?: string[];
}

export interface TravelgateFilterInput {
    includes?: TravelgateFilterRuleInput[];
    excludes?: TravelgateFilterRuleInput[];
}

export interface TravelgateFilterRuleInput {
    type: string;
    codes: string[];
}

// ─── Search Response ──────────────────────────────────────────────────────────

export interface TravelgateSearchResponse {
    data?: {
        hotelX?: {
            search?: {
                options?: TravelgateOption[];
                errors?: TravelgateError[];
                warnings?: TravelgateWarning[];
            };
        };
    };
    errors?: TravelgateGQLError[];
}

export interface TravelgateOption {
    id: string;                        // optionRefId for Quote/Book
    supplierCode: string;
    accessCode: string;
    market: string;
    hotelCode: string;
    hotelCodeSupplier: string;
    hotelName?: string;
    boardCode: string;
    boardName?: string;
    paymentType: TravelgatePaymentType;
    status: TravelgateOptionStatus;
    occupancies: TravelgateOccupancyOption[];
    rooms?: TravelgateRoom[];
    price: TravelgatePrice;
    supplements?: TravelgateSupplement[];
    surcharges?: TravelgateSurcharge[];
    rateRules?: TravelgateRateRule[];
    cancelPolicy?: TravelgateCancelPolicy;
    remarks?: string;
    addOns?: Record<string, any>;
    token?: string;
}

export type TravelgatePaymentType = 'MERCHANT' | 'DIRECT' | 'CARD_BOOKING' | 'CARD_CHECK_IN' | 'FREE' | 'OTHER';
export type TravelgateOptionStatus = 'OK' | 'RQ';
export type TravelgateRateRule = 'NON_REFUNDABLE' | 'PACKAGE' | 'OLDER55' | 'CANARY_RESIDENT' | 'BALEARIC_RESIDENT' | 'LARGE_FAMILY' | 'HONEYMOON' | 'NEGOTIATED' | 'MOBILE' | 'ESTABLISHED_WORKER';

export interface TravelgateOccupancyOption {
    id: number;
    paxes: TravelgatePaxOption[];
}

export interface TravelgatePaxOption {
    age: number;
}

export interface TravelgateRoom {
    occupancyRefId: number;
    legacyRoomId?: string;
    code: string;
    supplierCode?: string;
    description?: string;
    refundable?: boolean;
    beds?: TravelgateBed[];
    rateplans?: TravelgateRateplan[];
    totalStayPrice?: TravelgatePrice;
    features?: TravelgateFeature[];
    medias?: TravelgateMedia[];
}

export interface TravelgateBed {
    type?: string;
    count?: number;
    shared?: boolean;
    description?: string;
}

export interface TravelgateRateplan {
    code: string;
    supplierCode?: string;
    name?: string;
    effectiveDate?: string;
    expireDate?: string;
}

export interface TravelgateFeature {
    code: string;
    title?: string;
}

export interface TravelgateMedia {
    code?: string;
    url?: string;
    title?: string;
    type?: string;
}

export interface TravelgatePrice {
    currency: string;
    binding?: boolean;
    net?: number;
    gross?: number;
    exchange?: TravelgateExchange;
    markups?: TravelgateMarkup[];
    breakdown?: TravelgatePriceBreakdown[];
}

export interface TravelgateExchange {
    currency: string;
    rate: number;
}

export interface TravelgateMarkup {
    channel?: string;
    currency?: string;
    binding?: boolean;
    net?: number;
    gross?: number;
    rules: TravelgateMarkupRule[];
}

export interface TravelgateMarkupRule {
    id?: string;
    type?: string;
    value?: number;
    applyType?: string;
}

export interface TravelgatePriceBreakdown {
    effectiveDate?: string;
    expireDate?: string;
    price: TravelgatePrice;
}

export interface TravelgateSupplement {
    code: string;
    name?: string;
    description?: string;
    supplementType?: string;
    chargeType?: string;
    mandatory?: boolean;
    durationType?: string;
    quantity?: number;
    unit?: string;
    effectiveDate?: string;
    expireDate?: string;
    resort?: string;
    price?: TravelgatePrice;
}

export interface TravelgateSurcharge {
    chargeType?: string;
    mandatory?: boolean;
    price: TravelgatePrice;
    description?: string;
}

export interface TravelgateCancelPolicy {
    refundable: boolean;
    cancelPenalties?: TravelgateCancelPenalty[];
    guarantees?: TravelgateGuarantee[];
}

export interface TravelgateCancelPenalty {
    hoursBefore?: number;
    penaltyType?: string;
    currency?: string;
    value?: number;
    deadline?: string;
}

export interface TravelgateGuarantee {
    guaranteeType?: string;
    deadline?: string;
}

export interface TravelgateError {
    code: string;
    type: string;
    description?: string;
}

export interface TravelgateWarning {
    code: string;
    type: string;
    description?: string;
}

export interface TravelgateGQLError {
    message: string;
    locations?: { line: number; column: number }[];
    path?: string[];
    extensions?: Record<string, any>;
}

// ─── Quote ────────────────────────────────────────────────────────────────────

export interface TravelgateQuoteCriteria {
    optionRefId: string;
    language?: string;
}

export interface TravelgateQuoteResponse {
    data?: {
        hotelX?: {
            quote?: {
                optionQuote?: TravelgateOptionQuote;
                errors?: TravelgateError[];
                warnings?: TravelgateWarning[];
            };
        };
    };
    errors?: TravelgateGQLError[];
}

export interface TravelgateOptionQuote {
    optionRefId: string;
    status: TravelgateOptionStatus;
    price: TravelgatePrice;
    cancelPolicy?: TravelgateCancelPolicy;
    rooms?: TravelgateRoom[];
    surcharges?: TravelgateSurcharge[];
    remarks?: string;
}

// ─── Book ─────────────────────────────────────────────────────────────────────

export interface TravelgateBookInput {
    optionRefId: string;
    clientReference: string;
    holder: TravelgateHolder;
    rooms: TravelgateBookRoom[];
    language?: string;
    deltaPrice?: TravelgateDeltaPrice;
    remarks?: string;
    paymentCard?: TravelgatePaymentCard;
}

export interface TravelgateHolder {
    name: string;
    surname: string;
    email?: string;
    phone?: string;
}

export interface TravelgateBookRoom {
    occupancyRefId: number;
    paxes: TravelgateBookPax[];
}

export interface TravelgateBookPax {
    name: string;
    surname: string;
    age: number;
    email?: string;
    phone?: string;
    title?: string;
}

export interface TravelgateDeltaPrice {
    amount?: number;
    percent?: number;
    applyBoth?: boolean;
}

export interface TravelgatePaymentCard {
    paymentType: string;
    cardNumber: string;
    expire: { month: number; year: number };
    CVC: string;
    holder: TravelgateHolder;
}

export interface TravelgateBookResponse {
    data?: {
        hotelX?: {
            book?: {
                booking?: TravelgateBooking;
                errors?: TravelgateError[];
                warnings?: TravelgateWarning[];
            };
        };
    };
    errors?: TravelgateGQLError[];
}

export interface TravelgateBooking {
    id?: string;
    clientReference?: string;
    supplierReference?: string;
    status?: TravelgateBookingStatus;
    price?: TravelgatePrice;
    cancelPolicy?: TravelgateCancelPolicy;
    hotel?: TravelgateBookingHotel;
    holder?: TravelgateHolder;
    payable?: string;
}

export type TravelgateBookingStatus = 'OK' | 'RQ' | 'UNKNOWN' | 'CANCELLED';

export interface TravelgateBookingHotel {
    hotelCode?: string;
    hotelName?: string;
    checkIn?: string;
    checkOut?: string;
    boardCode?: string;
    boardName?: string;
    rooms?: TravelgateRoom[];
}

// ─── Cancel ───────────────────────────────────────────────────────────────────

export interface TravelgateCancelInput {
    bookingID: string;
    language?: string;
}

export interface TravelgateCancelResponse {
    data?: {
        hotelX?: {
            cancel?: {
                booking?: TravelgateBooking;
                errors?: TravelgateError[];
                warnings?: TravelgateWarning[];
            };
        };
    };
    errors?: TravelgateGQLError[];
}

// ─── Booking List / Retrieve ──────────────────────────────────────────────────

export interface TravelgateBookingFilterInput {
    bookingID?: string;
    clientReferences?: string[];
    supplierReferences?: string[];
    hotelCode?: string;
    dates?: TravelgateBookingDates;
}

export interface TravelgateBookingDates {
    dateType: 'BOOKING' | 'CHECK_IN' | 'CHECK_OUT';
    start?: string;
    end?: string;
}

export type TravelgateBookingTypeInput = 'BOOKING' | 'QUOTE';
