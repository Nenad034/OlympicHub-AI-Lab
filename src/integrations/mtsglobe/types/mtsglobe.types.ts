/**
 * MTS Globe / Axisdata (OTA Based) Type Definitions
 */

export interface MtsGlobeConfig {
    username: string;
    password: string;
    agencyCode: string;
    endpoint: string;
}

export interface MtsGlobeHotelSearchParams {
    checkIn: string; // YYYY-MM-DD
    checkOut: string; // YYYY-MM-DD
    adults: number;
    children?: number;
    childrenAges?: number[];
    destinationCode?: string;
    hotelCode?: string;
    currency?: string;
}

/**
 * OTA standard hotel result structure partially adapted for MTS Globe
 */
export interface MtsGlobeHotelResult {
    HotelCode: string;
    HotelName: string;
    HotelCategory: string; // Stars
    Address?: {
        CityName: string;
        CountryName: string;
    };
    Descriptions?: {
        Text: string;
    }[];
    Images?: string[];
    Position?: {
        Latitude: string;
        Longitude: string;
    };
    RoomStays: MtsGlobeRoomStay[];
}

export interface MtsGlobeRoomStay {
    RoomTypeCode: string;
    RoomTypeName: string;
    RatePlanCode: string;
    MealPlanCode: string;
    MealPlanName: string;
    Total: {
        Amount: number;
        Currency: string;
    };
    Availability: 'Available' | 'OnRequest' | 'SoldOut';
    OriginalData?: any; // Raw XML/JSON from provider
}

export interface MtsGlobeApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}
