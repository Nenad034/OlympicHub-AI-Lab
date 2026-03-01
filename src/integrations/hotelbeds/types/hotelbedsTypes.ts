// ============================================================
//  HOTELBEDS API — TypeScript Types
//  Pokriva: Hotel Booking API, Activities API, Transfers API
//  Docs: https://developer.hotelbeds.com
// ============================================================

// ─── Kredencijali ────────────────────────────────────────────────────────────

export interface HotelbedsCredentials {
    apiKey: string;
    apiSecret: string;
    environment: 'test' | 'production';
}

// ─── Zajednički tipovi ────────────────────────────────────────────────────────

export interface HotelbedsApiError {
    code: string;
    message: string;
    type?: string;
}

export interface HotelbedsAuditData {
    processTime: string;
    timestamp: string;
    requestHost: string;
    serverId: string;
    environment: string;
}

// ─── HOTEL BOOKING API — Pretraga ────────────────────────────────────────────

export interface HotelAvailabilityRequest {
    stay: {
        checkIn: string;   // YYYY-MM-DD
        checkOut: string;  // YYYY-MM-DD
    };
    occupancies: Array<{
        rooms: number;
        adults: number;
        children?: number;
        paxes?: Array<{ type: 'AD' | 'CH'; age?: number }>;
    }>;
    destination?: {
        code: string;      // Destination code (npr. 'PMI' za Palmu)
    };
    geolocation?: {
        longitude: number;
        latitude: number;
        radius: number;
        unit: 'km' | 'mi';
    };
    hotels?: {
        hotel: number[];   // Lista HotelBeds hotel kodova
    };
    filter?: {
        maxHotels?: number;
        maxRooms?: number;
        minRate?: number;
        maxRate?: number;
        minCategory?: number;
        maxCategory?: number;
    };
    boards?: {
        included: boolean;
        board: string[];  // npr. ['BB', 'HB', 'FB', 'AI']
    };
    rooms?: {
        included: boolean;
        room: string[];
    };
    dailyRate?: boolean;
    currency?: string;    // 'EUR', 'USD' itd.
    language?: string;    // 'ENG', 'CAS', itd.
}

export interface HotelRate {
    rateKey: string;
    rateClass: string;
    rateType: 'BOOKABLE' | 'RECHECK';
    net: string;
    sellingRate?: string;
    hotelMandatory: boolean;
    allotment: number;
    rateComments?: string;
    paymentType: 'AT_HOTEL' | 'AT_WEB';
    packaging: boolean;
    boardCode: string;
    boardName: string;
    cancellationPolicies?: Array<{
        amount: string;
        from: string;
    }>;
    taxes?: {
        allIncluded: boolean;
        tax: Array<{
            included: boolean;
            percent?: number;
            amount?: string;
            currency: string;
            type: string;
            clientAmount?: string;
            clientCurrency?: string;
        }>;
    };
    promotions?: Array<{
        code: string;
        name: string;
        remark?: string;
    }>;
    commission?: number;
    commissionVAT?: number;
    commissionPct?: number;
}

export interface HotelRoom {
    status: 'AVAILABLE' | 'ON_REQUEST' | 'UNKNOWN';
    id: number;
    code: string;
    name: string;
    rates: HotelRate[];
}

export interface HotelAvailabilityResult {
    code: number;
    name: string;
    categoryCode: string;
    categoryName: string;
    destinationCode: string;
    destinationName: string;
    zoneCode: number;
    zoneName: string;
    latitude: string;
    longitude: string;
    minRate: string;
    maxRate: string;
    currency: string;
    rooms: HotelRoom[];
}

export interface HotelAvailabilityResponse {
    auditData: HotelbedsAuditData;
    hotels: {
        hotels: HotelAvailabilityResult[];
        checkIn: string;
        checkOut: string;
        total: number;
    };
}

// ─── HOTEL BOOKING API — CheckRates ──────────────────────────────────────────

export interface CheckRatesRequest {
    rooms: Array<{
        rateKey: string;
    }>;
    upselling?: boolean;
}

export interface CheckRatesResponse {
    auditData: HotelbedsAuditData;
    hotel: {
        checkIn: string;
        checkOut: string;
        code: number;
        name: string;
        categoryCode: string;
        categoryName: string;
        destinationCode: string;
        destinationName: string;
        rooms: HotelRoom[];
        totalNet: string;
        totalSellingRate?: string;
        currency: string;
        supplier?: {
            name: string;
            vatNumber: string;
        };
        clientComments?: string;
        cancellationAmount?: string;
        upselling?: {
            rooms: HotelRoom[];
        };
    };
}

// ─── HOTEL BOOKING API — Rezervacija ─────────────────────────────────────────

export interface HotelBookingPax {
    roomId: number;
    type: 'AD' | 'CH';
    name: string;
    surname: string;
    age?: number;
    email?: string;
    phone?: string;
}

export interface HotelBookingRequest {
    holder: {
        name: string;
        surname: string;
        email?: string;
        phone?: string;
    };
    rooms: Array<{
        rateKey: string;
        paxes: HotelBookingPax[];
    }>;
    clientReference: string;   // Vaša interna referenca
    remark?: string;
    voucher?: {
        email?: {
            to: string;
            body?: string;
        };
        language?: string;
    };
    tolerance?: number;         // % prihvatljive razlike u ceni
}

export interface HotelBookingResponse {
    auditData: HotelbedsAuditData;
    booking: {
        reference: string;
        cancellationReference?: string;
        clientReference: string;
        creationDate: string;
        status: 'CONFIRMED' | 'CANCELLED' | 'ON_REQUEST';
        creationUser: string;
        holder: {
            name: string;
            surname: string;
        };
        hotel: {
            checkIn: string;
            checkOut: string;
            code: number;
            name: string;
            categoryCode: string;
            categoryName: string;
            destinationCode: string;
            destinationName: string;
            rooms: Array<{
                id: number;
                code: string;
                name: string;
                status: string;
                rates: HotelRate[];
                paxes: HotelBookingPax[];
            }>;
        };
        totalNet: string;
        pendingAmount: string;
        currency: string;
        remark?: string;
        cancellationAmount?: string;
        supplier?: string;
        modificationPolicies?: {
            cancellation: boolean;
            modification: boolean;
        };
    };
}

// ─── HOTEL CONTENT API ────────────────────────────────────────────────────────

export interface HotelContentResult {
    code: number;
    name: HotelbedsLocalizedField;
    description?: HotelbedsLocalizedField;
    countryCode: string;
    stateCode?: string;
    destinationCode: string;
    zoneCode: number;
    coordinates?: {
        longitude: number;
        latitude: number;
    };
    phones?: Array<{ phoneNumber: string; phoneType: string }>;
    email?: string;
    web?: string;
    categoryCode: string;
    categoryName?: HotelbedsLocalizedField;
    chainCode?: string;
    chainName?: HotelbedsLocalizedField;
    accommodationTypeCode?: string;
    boardCodes?: string[];
    segmentCodes?: number[];
    address?: {
        content: string;
        street?: string;
        number?: string;
        city?: string;
        zip?: string;
    };
    images?: Array<{
        imageTypeCode: string;
        path: string;
        order: number;
        visualOrder?: number;
        roomCode?: string;
        roomType?: string;
        characteristicCode?: string;
    }>;
    facilities?: Array<{
        facilityCode: number;
        facilityGroupCode: number;
        order?: number;
        number?: number;
        voucher?: boolean;
        indLogic?: boolean;
        indFee?: boolean;
    }>;
}

export interface HotelbedsLocalizedField {
    content: string;
    languageCode?: string;
}

// ─── ACTIVITIES API ───────────────────────────────────────────────────────────

export interface ActivitySearchRequest {
    from: string;           // Datum od (YYYY-MM-DD)
    to: string;             // Datum do (YYYY-MM-DD)
    destination?: string;   // Destination code
    language?: string;
    coordinates?: {
        longitude: number;
        latitude: number;
        radius: number;
        unit?: 'km' | 'mi';
    };
    categoryIds?: string[];
    subCategoryIds?: string[];
    keywords?: string;
    limit?: number;
    offset?: number;
}

export interface ActivityResult {
    code: string;
    name: string;
    description?: string;
    operationDays?: string;
    status?: string;
    minAdultAge?: number;
    minAge?: number;
    maxAge?: number;
    currency?: string;
    amountFrom?: number;
    amountTo?: number;
    country?: {
        code: string;
        name?: string;
    };
    destination?: {
        code: string;
        name?: string;
    };
    categories?: Array<{
        code: string;
        name?: string;
    }>;
    images?: Array<{
        url: string;
        visualizationOrder?: number;
    }>;
    modalities?: Array<{
        code: string;
        name?: string;
        duration?: {
            value?: number;
            metric?: string;
        };
        rates?: Array<{
            rateCode: string;
            name?: string;
            rateType?: string;
            ageCategoryType?: string;
            amount?: number;
            currency?: string;
        }>;
    }>;
    coordinates?: {
        longitude?: number;
        latitude?: number;
    };
}

export interface ActivitySearchResponse {
    auditData: HotelbedsAuditData;
    activities: ActivityResult[];
    total?: number;
}

// ─── TRANSFERS API ────────────────────────────────────────────────────────────

export interface TransferSearchRequest {
    language: string;
    fromType: 'IATA' | 'ATLAS' | 'HOTELBEDS' | 'GIATA' | 'ADDRESS';
    fromCode?: string;
    from?: {
        address?: string;
        zipCode?: string;
        country?: string;
    };
    toType: 'IATA' | 'ATLAS' | 'HOTELBEDS' | 'GIATA' | 'ADDRESS';
    toCode?: string;
    to?: {
        address?: string;
        zipCode?: string;
        country?: string;
    };
    outbound: {
        dateTime: string;  // YYYY-MM-DDTHH:mm:ss
    };
    inbound?: {
        dateTime?: string;
    };
    adults: number;
    children?: number;
    infants?: number;
    currency?: string;
    transferType?: 'SHUTTLE' | 'PRIVATE' | 'SHARED';
}

export interface TransferResult {
    id: number;
    direction: 'O' | 'I';
    transferType: string;
    vehicle: {
        code: string;
        name?: string;
        description?: string;
        minPax?: number;
        maxPax?: number;
        images?: Array<{ url: string; order?: number }>;
    };
    category?: {
        code: string;
        name?: string;
    };
    content?: {
        code?: string;
        name?: string;
        description?: string;
    };
    price: {
        amount: number;
        totalAmount?: number;
        currency?: string;
        commissionAmount?: number;
        commissionPct?: number;
        netAmount?: number;
    };
    rateKey?: string;
    cancellationPolicies?: Array<{
        amount: string;
        from: string;
        type?: string;
    }>;
    links?: Array<{
        rel: string;
        href: string;
    }>;
    supplierDetails?: {
        name: string;
        vatNumber?: string;
        productCode?: string;
    };
}

export interface TransferSearchResponse {
    auditData?: HotelbedsAuditData;
    services?: TransferResult[];
    total?: number;
    currency?: string;
}

// ─── Transfer Booking ─────────────────────────────────────────────────────────

export interface TransferBookingRequest {
    language: string;
    holder: {
        name: string;
        surname: string;
        email: string;
        phone?: string;
    };
    clientReference: string;
    remark?: string;
    transfers: Array<{
        rateKey: string;
        vehicle: {
            passengers?: Array<{
                name: string;
                surname: string;
                age?: number;
            }>;
        };
        transferDetails?: {
            flightNumber?: string;
            airline?: string;
        };
    }>;
}

export interface TransferBookingResponse {
    auditData?: HotelbedsAuditData;
    booking: {
        reference: string;
        status: 'CONFIRMED' | 'CANCELLED' | 'ON_REQUEST';
        clientReference: string;
        creationDate: string;
        holder: {
            name: string;
            surname: string;
            email: string;
        };
        transfers: Array<{
            id: number;
            status: string;
            transferType: string;
            vehicle: {
                code: string;
                name?: string;
            };
            price: {
                amount: number;
                currency: string;
            };
        }>;
        totalAmount?: number;
        currency?: string;
        remark?: string;
    };
}
