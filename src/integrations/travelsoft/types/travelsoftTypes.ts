/**
 * Travelsoft NDC API Types
 * 
 * TypeScript definicije za IATA NDC 19.2 XML poruke
 * koje Travelsoft NDC gateway koristi
 */

// ============================================================================
// KONFIGURACIJA
// ============================================================================

export interface TravelsoftConfig {
    baseUrl: string;          // https://...../ndc/ws/rest/19.2
    username: string;
    password: string;
    provider: string;         // npr. "SWITCHALLINONE"
    apiVersion: string;       // "1.0"
    timeout: number;          // ms
}

// ============================================================================
// AUTENTIKACIJA
// ============================================================================

export interface TravelsoftLoginRequest {
    username: string;
    password: string;
}

export interface TravelsoftLoginResponse {
    token: string;
    expiresAt: string;  // ISO datetime
    agencyId?: string;
}

export interface TravelsoftAuthToken {
    value: string;
    expiresAt: Date;
}

// ============================================================================
// AIR SHOPPING (pretraga letova)
// ============================================================================

export interface NDCPassengerQuantity {
    Code: 'ADT' | 'CHD' | 'INF';  // Adult, Child, Infant
    Quantity: number;
    Age?: number;
}

export interface NDCAirShoppingRequest {
    origin: string;           // IATA kod
    destination: string;      // IATA kod
    departureDate: string;    // YYYY-MM-DD
    returnDate?: string;      // YYYY-MM-DD
    passengers: NDCPassengerQuantity[];
    cabinPreference?: 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST';
    directOnly?: boolean;
    currency?: string;
}

// NDC Offer iz airShopping odgovora
export interface NDCOffer {
    OfferID: string;
    OwnerCode: string;        // IATA avio-kompanija
    ValidatingCarrier: string;
    TotalPrice: {
        TotalAmount: number;
        CurrencyCode: string;
        BaseAmount?: number;
        TaxAmount?: number;
    };
    Itineraries: NDCItinerary[];
    FareDetails?: NDCFareDetail[];
    BaggageAllowance?: NDCBaggageAllowance;
    ShoppingResponseID?: string;
}

export interface NDCItinerary {
    OriginDestinationID: string;
    Departure: {
        AirportCode: string;
        AirportName?: string;
        CityName?: string;
        Date: string;
        Time: string;
        Terminal?: string;
    };
    Arrival: {
        AirportCode: string;
        AirportName?: string;
        CityName?: string;
        Date: string;
        Time: string;
        Terminal?: string;
    };
    Segments: NDCSegment[];
    Duration?: number;  // minuti
    Stops: number;
}

export interface NDCSegment {
    SegmentKey: string;
    Departure: {
        AirportCode: string;
        AirportName?: string;
        Date: string;
        Time: string;
        Terminal?: string;
    };
    Arrival: {
        AirportCode: string;
        AirportName?: string;
        Date: string;
        Time: string;
        Terminal?: string;
    };
    MarketingCarrier: {
        AirlineID: string;  // IATA 2-letter (npr. "JU")
        Name?: string;
        FlightNumber: string;
    };
    OperatingCarrier?: {
        AirlineID: string;
        Name?: string;
        FlightNumber?: string;
    };
    Equipment?: {
        AircraftCode: string;
        Name?: string;
    };
    Duration?: number;  // minuti
    ClassOfService?: string;
    CabinType?: {
        Code: string;
        Name?: string;
    };
}

export interface NDCFareDetail {
    FareBasis: {
        Code: string;
        FareClasses: string;
    };
    PassengerFare?: {
        PassengerType: 'ADT' | 'CHD' | 'INF';
        BaseFare: { Amount: number; CurrencyCode: string };
        Taxes?: { Total: number; CurrencyCode: string };
        TotalFare: { Amount: number; CurrencyCode: string };
    };
}

export interface NDCBaggageAllowance {
    CabinBag?: {
        Quantity: number;
        WeightUnit?: string;
        Weight?: number;
    };
    CheckedBag?: {
        Quantity: number;
        WeightUnit?: string;
        Weight?: number;
    };
}

// ============================================================================
// OFFER PRICE (kvotiranje)
// ============================================================================

export interface NDCOfferPriceRequest {
    offerIds: string[];
    shoppingResponseId: string;
    passengers: NDCPassengerQuantity[];
}

export interface NDCOfferPriceResponse {
    offers: NDCOffer[];
    warnings?: string[];
}

// ============================================================================
// SERVICE LIST (ancillary usluge)
// ============================================================================

export interface NDCServiceListRequest {
    shoppingResponseId: string;
    offerId: string;
    passengers: NDCPassengerQuantity[];
}

export interface NDCService {
    ServiceID: string;
    Name: string;
    Description?: string;
    Code: string;
    ServiceType: 'BAGGAGE' | 'SEAT' | 'MEAL' | 'OTHER';
    Price?: {
        Amount: number;
        CurrencyCode: string;
    };
    Segments?: string[];  // SegmentKey array
}

// ============================================================================
// SEAT AVAILABILITY (mapa sedišta)
// ============================================================================

export interface NDCSeatAvailabilityRequest {
    shoppingResponseId: string;
    offerId: string;
    segmentIds?: string[];
}

export interface NDCSeat {
    Column: string;
    Row: string;
    SeatNumber: string;
    Available: boolean;
    SeatCharacteristics?: string[];  // npr. "W" (window), "A" (aisle)
    Price?: {
        Amount: number;
        CurrencyCode: string;
    };
    PassengerType?: string;
}

export interface NDCSeatRow {
    Row: string;
    Seats: NDCSeat[];
}

export interface NDCSeatMap {
    SegmentID: string;
    CabinType: string;
    Rows: NDCSeatRow[];
}

// ============================================================================
// ORDER CREATE (kreiranje rezervacije)
// ============================================================================

export interface NDCOrderCreateRequest {
    shoppingResponseId: string;
    offerId: string;
    passengers: NDCPassengerDetail[];
    selectedSeats?: NDCSeatSelection[];
    selectedServices?: NDCServiceSelection[];
    contactEmail: string;
    contactPhone: string;
    agentReference?: string;
}

export interface NDCPassengerDetail {
    PassengerID: string;
    Type: 'ADT' | 'CHD' | 'INF';
    Title?: string;
    FirstName: string;
    LastName: string;
    DateOfBirth: string;  // YYYY-MM-DD
    Gender: 'Male' | 'Female';
    Nationality?: string;
    ContactEmail?: string;
    ContactPhone?: string;
    Document?: {
        Type: 'PASSPORT' | 'ID_CARD';
        Number: string;
        ExpiryDate: string;
        IssuingCountry: string;
        Nationality: string;
    };
    FrequentFlyer?: {
        CarrierCode: string;
        AccountNumber: string;
    };
}

export interface NDCSeatSelection {
    PassengerID: string;
    SegmentID: string;
    SeatNumber: string;
}

export interface NDCServiceSelection {
    PassengerID: string;
    SegmentID?: string;
    ServiceID: string;
    Quantity: number;
}

// ============================================================================
// ORDER CREATE RESPONSE
// ============================================================================

export interface NDCOrderCreateResponse {
    OrderID: string;
    GdsBookingRef?: string;  // PNR
    AirlineBookingRef?: string;
    Status: 'CONFIRMED' | 'PENDING' | 'FAILED';
    TotalPrice?: {
        Amount: number;
        CurrencyCode: string;
    };
    TicketNumbers?: string[];
    Passengers?: NDCPassengerDetail[];
    Itineraries?: NDCItinerary[];
    Warnings?: string[];
}

// ============================================================================
// ORDER RETRIEVE
// ============================================================================

export interface NDCOrderRetrieveRequest {
    orderId: string;
    surname?: string;
}

// ============================================================================
// ORDER CANCEL  
// ============================================================================

export interface NDCOrderCancelRequest {
    orderId: string;
}

export interface NDCOrderCancelResponse {
    Success: boolean;
    RefundAmount?: {
        Amount: number;
        CurrencyCode: string;
    };
    Message?: string;
}

// ============================================================================
// ORDER RESHOP (naknada za otkazivanje)
// ============================================================================

export interface NDCOrderReshopRequest {
    orderId: string;
}

export interface NDCOrderReshopResponse {
    CancelFee?: {
        Amount: number;
        CurrencyCode: string;
    };
    RefundAmount?: {
        Amount: number;
        CurrencyCode: string;
    };
    Conditions?: string[];
}

// ============================================================================
// ORDER CHANGE (ticketing)
// ============================================================================

export interface NDCOrderChangeRequest {
    orderId: string;
    action: 'ISSUE_TICKET' | 'CHANGE_SEGMENT';
}

export interface NDCOrderChangeResponse {
    Success: boolean;
    TicketNumbers?: string[];
    Status?: string;
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export interface NDCError {
    Code: string;
    DescText: string;
    LangCode?: string;
    OwnerName?: string;
}

export interface NDCResponse<T> {
    success: boolean;
    data?: T;
    errors?: NDCError[];
    correlationId?: string;
    timestamp?: string;
}

// ============================================================================
// SHOPPING SESSION (cuva ShoppingResponseID)
// ============================================================================

export interface TravelsoftShoppingSession {
    shoppingResponseId: string;
    searchParams: NDCAirShoppingRequest;
    offers: NDCOffer[];
    createdAt: string;
    expiresAt: string;
}
