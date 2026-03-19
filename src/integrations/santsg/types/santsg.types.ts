/**
 * SAN TSG (TourVisio) API Types
 */

export interface SanTsgAuthRequest {
    AgencyCode: string;
    UserCode: string;
    Password?: string;
}

export interface SanTsgAuthResponse {
    Header: {
        RequestId: string;
        Success: boolean;
        Messages: Array<{ Code: string; Message: string }>;
    };
    Body: {
        Token: string;
        ExpiresIn: number;
    };
}

export interface SanTsgHotelSearchResult {
    Hotel: {
        Id: string;
        Name: string;
        Stars: number;
        Location: string;
        Images: string[];
        Latitude?: number;
        Longitude?: number;
    };
    Rooms: Array<{
        Id: string;
        Name: string;
        Price: number;
        Currency: string;
        MealPlan: string;
        Availability: number; // 1 = Available, 0 = On Request
    }>;
}

export interface SanTsgCharterFlight {
    FlightNumber: string;
    DepartureDate: string;
    ArrivalDate: string;
    Route: string;
    SeatsAvailable: number;
    Price: number;
    Currency: string;
}

export interface SanTsgDynamicPackage {
    PackageId: string;
    HotelName: string;
    FlightDetails: string;
    TotalPrice: number;
    Currency: string;
}
