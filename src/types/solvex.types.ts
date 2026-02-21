// Solvex API Types

export interface SolvexAuthResponse {
    connectResult: string; // GUID token
}

export interface SolvexHotelSearchParams {
    guid: string;
    dateFrom: string; // YYYY-MM-DDTHH:mm:ss
    dateTo: string;
    cityId?: number;
    hotelId?: number;
    adults: number;
    children?: number;
    childrenAges?: number[];
    rooms?: number;
    tariffId?: number; // 0 = Ordinary, 1993 = Non-Refundable
}

export interface SolvexHotel {
    id: number;
    name: string;
    nameLat: string;
    city: {
        id: number;
        name: string;
        nameLat: string;
    };
    country: {
        id: number;
        name: string;
        nameLat: string;
    };
    starRating: number;
    priceType: number; // 0 = PerPerson, 1 = PerRoom
}

export interface SolvexRoom {
    roomType: {
        id: number;
        name: string;
        nameLat: string;
        places: number;
        exPlaces: number;
    };
    roomCategory: {
        id: number;
        name: string;
        nameLat: string;
    };
    roomAccommodation: {
        id: number;
        name: string;
        nameLat: string;
        adultMainPlaces: number;
        childMainPlaces: number;
    };
}

export interface SolvexPansion {
    id: number;
    name: string;
    nameLat: string;
    code: string;
}

export interface SolvexHotelSearchResult {
    hotel: SolvexHotel;
    room: SolvexRoom;
    pansion: SolvexPansion;
    totalCost: number; // Final price including all mandatory services
    addHotsWithCosts?: number; // Festive dinners (Christmas, New Year)
    quotaType: number; // 0 = On Request, 1 = On Quota, 2 = Stop Sales
    tariff: {
        id: number;
        name: string;
    };
    cancellationPolicyRequestParams?: any; // To hold the params for getting detailed cancellation info
    duration: number;
    startDate: string;
}

export interface SolvexTourist {
    sex: 'Male' | 'Female' | 'Child' | 'Infant';
    birthDate: string; // YYYY-MM-DDTHH:mm:ss
    firstNameLat: string;
    surNameLat: string;
    ageType: 'Adult' | 'Child' | 'Infant';
    isMain: boolean;
    id: number;
    phone?: string;
    email?: string;
    foreignPassport?: {
        serie: string;
        number: string;
        endDate: string;
    };
}

export interface SolvexReservationParams {
    guid: string;
    hasInvoices: boolean;
    rateId: number; // Currency ID
    services: SolvexService[];
    tourists: SolvexTourist[];
    countryId: number;
    cityId: number;
    externalId?: number; // 0 for new reservation
    tourOperatorId?: number;
    tourOperatorCode?: string;
}

export interface SolvexService {
    type: 'HotelService' | 'TransferService' | 'ExtraService' | 'ExcursionService';
    externalId: number;
    nMen: number; // Number of adults
    startDate: string;
    duration: number;
    id: number;
    hotelId?: number;
    room?: {
        roomTypeId: number;
        roomCategoryId: number;
        roomAccommodationId: number;
    };
    pansionId?: number;
}

export interface SolvexReservation {
    externalId: number; // Booking ID in Interlook system
    name: string; // Internal booking number
    status: 'Confirmed' | 'NotConfirmed' | 'WaitingConfirmation' | 'Canceled' | 'WaitingCancelation';
    brutto: number;
    rate: {
        id: number;
        name: string;
        code: string;
    };
    services: SolvexServiceDetails[];
    tourists: SolvexTourist[];
    startDate: string;
    endDate: string;
    creationDate: string;
}

export interface SolvexServiceDetails extends SolvexService {
    price: number;
    quota: number;
    penaltyCost?: {
        policyKey: number;
        dateFrom: string | null;
        dateTo: string | null;
        penaltyValue: number;
        isPercent: boolean;
        totalPenalty: number;
        description: string;
    };
}

export interface SolvexCancellationPolicy {
    policyKey: number;
    dateFrom: string | null;
    dateTo: string | null;
    penaltyValue: number;
    isPercent: boolean; // true = %, false = nights
    totalPenalty: number;
    description: string;
}

// Dictionary Types
export interface SolvexCountry {
    id: number;
    name: string;
    nameLat: string;
    code: string;
}

export interface SolvexCity {
    id: number;
    name: string;
    nameLat: string;
    countryId: number;
    regionId: number;
}

export interface SolvexRegion {
    id: number;
    name: string;
    nameLat: string;
}

// API Response Wrapper
export interface SolvexApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}
