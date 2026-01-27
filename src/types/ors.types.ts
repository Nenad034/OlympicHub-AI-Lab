/**
 * ORS API Type Definitions
 * 
 * Based on ORS API v2 documentation
 */

// ============================================================================
// Common Types
// ============================================================================

export interface OrsTranslations {
    en?: string;
    hr?: string;
    si?: string;
    de?: string;
    rs?: string;
    sk?: string;
}

export interface OrsLocation {
    LocationName?: string;
    LocationID?: number;
    RegionGroupID?: string;
    RegionGroupName?: string;
    RegionID?: number;
    RegionName?: string;
    Latitude?: number;
    Longitude?: number;
}

export interface OrsPicture {
    Thumbnail: string;
    Full: string;
}

export interface OrsProduct {
    OfferName: string;
    GiataID: number;
    Picture?: OrsPicture;
    Category?: number;
    OfferRating?: number;
    RecommendationPercentage?: number;
    Location?: OrsLocation;
    Facts?: Record<string, string>;
    Resort?: string;
    ResortName?: string;
}

// ============================================================================
// Search Request Types
// ============================================================================

export interface OrsSearchRequestBase {
    StartDate: string; // YYYY-MM-DD
    EndDate: string; // YYYY-MM-DD
    MinDuration?: number;
    MaxDuration?: number;
    AdultCount: number;
    ChildrenAge?: number[];
    Region?: number[];
    RegionGroup?: number[];
    Location?: number[];
    ProductName?: string;
    GiataID?: number[];
    Subtype?: string; // cruise, ski, etc.
    ProductFacts?: string[];
    Tags?: string[];
    Filter?: OrsSearchFilter;
}

export interface OrsSearchFilter {
    Price?: {
        Minimum?: number;
        Maximum?: number;
    };
    Category?: number[]; // Hotel stars
    ProductFacts?: string[];
    RegionGroup?: string[];
}

export interface OrsSearchRequestRegions extends OrsSearchRequestBase {
    RFilter?: OrsSearchFilter;
}

export interface OrsSearchRequestProducts extends OrsSearchRequestBase {
    Page?: number;
    PageSize?: number;
}

export interface OrsSearchRequestDates extends OrsSearchRequestBase {
    Page?: number;
    PageSize?: number;
}

export interface OrsQuickSearchRequest {
    Query: string;
    MaxResults?: number;
}

// ============================================================================
// Search Response Types
// ============================================================================

export interface OrsSearchRegionResponse {
    RequestID: string;
    Regions: OrsRegionResult[];
    Paging?: OrsPaging;
}

export interface OrsRegionResult {
    RegionID: number;
    RegionName: string;
    RegionGroupID: string;
    RegionGroupName: string;
    MinPrice: number;
    OfferCount: number;
    Currency: string;
}

export interface OrsSearchProductResponse {
    RequestID: string;
    Products: OrsProductResult[];
    Paging?: OrsPaging;
}

export interface OrsProductResult {
    Product: OrsProduct;
    MinPrice: number;
    MaxPrice: number;
    Currency: string;
    OfferCount: number;
    TourOperators: string[];
}

export interface OrsSearchDatesResponse {
    RequestID: string;
    Products: OrsProduct[];
    Dates: OrsDateOffer[];
    Calendar?: OrsCalendar;
    Paging?: OrsPaging;
}

export interface OrsDateOffer {
    OfferID?: number;
    StartDate: string;
    EndDate: string;
    TourOperator: string;
    TourOperatorName: string;
    ProductCode: string;
    ProductName: string;
    ServiceCode?: string;
    Duration: number;
    HashCode: string;
    OfferSubType: string;
    Price: number;
    PriceType: string; // PERSON, ROOM, ALL
    ServiceType?: string; // HP, BB, AI, etc.
    ServiceName?: string;
    RoomType?: string;
    RoomName?: string;
    RoomLocationCode?: string;
    RoomLocationName?: string;
    RoomLocation?: string;
    RoomFacilites?: string;
    RoomDetails?: string;
    MealDetails?: string;
    IncludedServices?: string;
    IncludedServicesList?: string[];
    MinOccupancy?: number;
    MaxOccupancy?: number;
    MinAdults?: number;
    MaxAdults?: number;
    MaxChildren?: number;
    OfferStatus?: number;
    OfferStatusName?: string;
    NonRefundable?: boolean;
    FreeCancelUntil?: string;
    EntryPoint?: string;
    EntryPointName?: string;
}

export interface OrsCalendar {
    [tourOperator: string]: {
        [startDate: string]: number; // Minimum price for that date
    };
}

export interface OrsPaging {
    Page: number;
    PageSize: number;
    TotalPages: number;
    TotalResults: number;
}

// ============================================================================
// Availability & Booking Types
// ============================================================================

export interface OrsAvailabilityRequest {
    Passengers: OrsPassenger[];
    Customer?: OrsCustomer;
    ExtraServices?: OrsExtraService[];
}

export interface OrsPassenger {
    PassengerType: string; // D (adult), H (adult), C (child), I (infant)
    FirstName: string;
    LastName: string;
    BirthDate?: string;
    Age?: number;
}

export interface OrsCustomer {
    FirstName: string;
    LastName: string;
    Email: string;
    Phone: string;
    Address?: string;
    City?: string;
    ZIPCode?: string;
    Country?: string;
}

export interface OrsExtraService {
    Type: string;
    Code: string;
    Count?: number;
    TravelersList?: number[];
}

export interface OrsAvailabilityResponse {
    RequestID: string;
    StatusCode: OrsStatusCode;
    Price: OrsPrice;
    Booker: OrsBooker;
    Operator: OrsOperator;
    Record: OrsRecord;
    ServiceDesc: OrsServiceDescription[];
    Customer: OrsCustomer;
    Travelers: Record<string, OrsPassenger>;
    Services: Record<string, OrsService>;
    ExtraServices: OrsExtraService[];
    OfferInfo: OrsOfferInfo;
    Payment?: OrsPayment;
    CancellationPolicies?: OrsCancellationPolicy[];
}

export interface OrsStatusCode {
    Status: number; // 1=success, 2=request, 3=error
    ID: number;
    Text: string;
}

export interface OrsPrice {
    Currency: string;
    TotalPrice: number;
    PricePerPerson: number;
}

export interface OrsBooker {
    AgencyID: number;
    AgencyName: string;
    AgencyEmail: string;
    UserName: string;
    UserEmail: string;
    UserID?: number;
}

export interface OrsOperator {
    Action: string;
    TourOperator: string;
    Agenture: string;
    HashCode: string;
}

export interface OrsRecord {
    Status: string; // OK, RQ, OP, etc.
}

export interface OrsServiceDescription {
    Type?: string;
    HotelCode?: string;
    ServiceCode?: string;
    OfferName?: string;
    Category?: string;
    RoomType?: string;
    RoomName?: string;
    ServiceType?: string;
    ServiceName?: string;
    GiataID?: string;
    Location?: string;
    Region?: string;
    LocationName?: string;
    RegionName?: string;
    RoomDetails?: string;
    RoomFacilites?: string;
    Duration?: string;
    StartDate?: string;
    EndDate?: string;
    Stock?: number;
    Services?: number[];
}

export interface OrsService {
    MarkerField?: string;
    Type: string;
    Code: string | number;
    Paramaters?: string;
    OptionalParamaters?: string;
    Count?: number;
    Travelers?: string;
    TravelersList?: number[];
    StartDate: string;
    EndDate: string;
    Status?: string;
    Price?: number;
}

export interface OrsOfferInfo {
    Products: OrsProduct[];
    Dates: OrsDateOffer[];
}

export interface OrsPayment {
    PaymentType: string;
    Amount: number;
    Currency: string;
    DueDate?: string;
}

export interface OrsCancellationPolicy {
    PolicyKey: number;
    DateFrom?: string;
    DateTo?: string;
    PenaltyValue: number;
    IsPercent: boolean;
    TotalPenalty: number;
    Description: string;
}

// ============================================================================
// Dictionary Types
// ============================================================================

export interface OrsRegion {
    Translations: OrsTranslations;
    RegionGroup: string;
}

export interface OrsLocationData {
    Translations: OrsTranslations;
    RegionID?: string;
    RegionName?: OrsTranslations;
    ResortID?: number;
    ski_resort?: boolean;
    is_resort?: boolean;
}

export interface OrsTourOperator {
    Name: string;
    Group?: string;
    Email: string;
    country: string;
    SupportedLanguages: string[];
    OptionsEnabled: boolean;
    OptionsExpires: number;
    OptionsStatusAfterExpiration?: string;
}

// ============================================================================
// Error Types
// ============================================================================

export interface OrsError {
    RequestID: string;
    errorCode: number;
    error: string;
}

// ============================================================================
// Utility Types
// ============================================================================

export type OrsContentType = 'hotel' | 'pauschal' | 'trips';

export type OrsPriceType = 'PERSON' | 'ROOM' | 'ALL' | 'NONE';

export type OrsBookingStatus = 0 | 1 | 2 | 3 | 4; // Confirmed, NotConfirmed, WaitingConfirmation, Canceled, WaitingCancelation
