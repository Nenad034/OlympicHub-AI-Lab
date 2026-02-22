/**
 * TCT API Service
 * Travel Connection Technology API Integration
 * 
 * API Documentation: https://imc-dev.tct.travel/docs
 */

// API Configuration from environment variables
const TCT_CONFIG = {
    baseUrl: import.meta.env.VITE_TCT_API_URL || 'https://imc-dev.tct.travel',
    username: import.meta.env.VITE_TCT_USERNAME,
    password: import.meta.env.VITE_TCT_PASSWORD,
    apiSource: import.meta.env.VITE_TCT_API_SOURCE || 'B2B',
};

// Check if credentials are configured
const isConfigured = () => {
    return !!(TCT_CONFIG.username && TCT_CONFIG.password);
};

// Base64 encode credentials for Basic Auth
const getAuthHeader = () => {
    const credentials = `${TCT_CONFIG.username}:${TCT_CONFIG.password}`;
    const encoded = btoa(credentials);
    return `Basic ${encoded}`;
};

// Common headers for all requests
const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'API-SOURCE': TCT_CONFIG.apiSource,
    'Authorization': getAuthHeader(),
});

// Generic API request function
async function tctRequest<T>(
    endpoint: string,
    options: RequestInit = {}
): Promise<{ data: T | null; error: string | null; success: boolean }> {
    if (!isConfigured()) {
        return {
            data: null,
            error: 'TCT API credentials not configured. Please check your .env file.',
            success: false,
        };
    }

    try {
        const url = `${TCT_CONFIG.baseUrl}${endpoint}`;
        const response = await fetch(url, {
            ...options,
            headers: {
                ...getHeaders(),
                ...options.headers,
            },
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(
                errorData.message || `HTTP ${response.status}: ${response.statusText}`
            );
        }

        const data = await response.json();
        return {
            data,
            error: null,
            success: true,
        };
    } catch (error) {
        console.error(`TCT API Error [${endpoint}]:`, error);
        return {
            data: null,
            error: error instanceof Error ? error.message : 'Unknown error occurred',
            success: false,
        };
    }
}

// ============ Connection Test ============

export async function testConnection() {
    console.log('🔌 Testing TCT API connection...');
    return tctRequest('/v1/nbc/nationalities', {
        method: 'POST',
    });
}

// ============ Static Data / NBC ============

export async function getNationalities() {
    return tctRequest('/v1/nbc/nationalities', {
        method: 'POST',
    });
}

export async function getGeography() {
    return tctRequest('/v1/nbc/geography', {
        method: 'POST',
    });
}

export async function getAirports() {
    return tctRequest('/v1/nbc/airports', {
        method: 'POST',
    });
}

export async function getHotelCategories() {
    return tctRequest('/v1/nbc/hotelCategories', {
        method: 'GET',
    });
}

export async function getHotelMealPlans() {
    return tctRequest('/v1/nbc/hotelMealPlans', {
        method: 'GET',
    });
}

export interface HotelInfoParams {
    country?: string;
    region?: string;
    city?: string;
    hotel?: string[];
    start?: number;
    limit?: number;
    detail?: 'minimal' | 'basic' | 'standard' | 'full';
}

export async function getHotelInformation(params: HotelInfoParams) {
    const queryParams = new URLSearchParams();

    if (params.country) queryParams.append('country', params.country);
    if (params.region) queryParams.append('region', params.region);
    if (params.city) queryParams.append('city', params.city);
    if (params.hotel) {
        params.hotel.forEach((h, i) => queryParams.append(`hotel[${i}]`, h));
    }
    if (params.start !== undefined) queryParams.append('start', params.start.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.detail) queryParams.append('detail', params.detail);

    return tctRequest(`/v1/nbc/hotelInformation?${queryParams.toString()}`, {
        method: 'GET',
    });
}

// ============ Hotel Search ============

export interface HotelSearchParams {
    search_type: 'city' | 'region' | 'country' | 'hotel';
    location: string;
    location_id?: string;
    airport?: string;
    hotel_ids?: string[];
    checkin: string; // YYYY-MM-DD
    checkout: string; // YYYY-MM-DD
    rooms: Array<{
        adults: number;
        children?: number;
        children_ages?: number[];
    }>;
    currency: string;
    nationality: string;
    residence: string;
}

export async function searchHotelsSync(params: HotelSearchParams) {
    return tctRequest('/v1/hotel/searchSync', {
        method: 'POST',
        body: JSON.stringify(params),
    });
}

export async function searchHotels(params: HotelSearchParams) {
    return tctRequest('/v1/hotel/search', {
        method: 'POST',
        body: JSON.stringify(params),
    });
}

export interface HotelResultsParams {
    hid?: string[];
    search_id: number;
    search_code: string;
    last_check: number;
    hotel_min_info?: boolean;
    only_giata?: number;
    solutions_nr?: number;
}

export async function getHotelResults(params: HotelResultsParams, sessionId?: string) {
    const headers: Record<string, string> = {};
    if (sessionId) {
        headers['SESSIONID'] = sessionId;
    }

    return tctRequest('/v1/hotel/results', {
        method: 'POST',
        headers,
        body: JSON.stringify(params),
    });
}

// ============ Hotel Valuation & Details ============

export interface ValuationParams {
    id: string;
    code: string;
}

export async function getHotelValuation(params: ValuationParams, sessionId?: string) {
    const headers: Record<string, string> = {};
    if (sessionId) {
        headers['SESSIONID'] = sessionId;
    }

    return tctRequest('/v1/hotel/valuation', {
        method: 'POST',
        headers,
        body: JSON.stringify(params),
    });
}

export interface HotelDetailsParams {
    hid_undeduplicated: string;
    availsearch_id: number;
}

export async function getHotelDetails(params: HotelDetailsParams, sessionId?: string) {
    const headers: Record<string, string> = {};
    if (sessionId) {
        headers['SESSIONID'] = sessionId;
    }

    return tctRequest('/v1/hotel/hotelDetails', {
        method: 'POST',
        headers,
        body: JSON.stringify(params),
    });
}

// ============ Hotel Booking ============

export interface BookingParams {
    id: string;
    code: string;
    cemail: string;
    quote?: number;
    blockquote?: number;
    persons: Array<Array<{
        leader?: boolean;
        fname: string;
        lname: string;
        salutation: number;
        child_year?: number;
        child_month?: number;
        child_day?: number;
        children?: number[];
    }>>;
    payment_method: number;
    client_return_url?: string;
    invoiceDetails?: any;
    external_reference?: string;
}

export async function bookHotel(params: BookingParams, sessionId?: string) {
    const headers: Record<string, string> = {};
    if (sessionId) {
        headers['SESSIONID'] = sessionId;
    }

    return tctRequest('/v1/hotel/book', {
        method: 'POST',
        headers,
        body: JSON.stringify(params),
    });
}

export interface BookingDetailsParams {
    code?: string;
    external_reference?: string;
}

export async function getBookingDetails(params: BookingDetailsParams) {
    return tctRequest('/v1/hotel/bookingDetails', {
        method: 'POST',
        body: JSON.stringify(params),
    });
}

export async function cancelBooking(code: string) {
    return tctRequest('/v1/hotel/cancel', {
        method: 'POST',
        body: JSON.stringify({ code }),
    });
}

// ============ Package API ============

export type PackageQuery = 'all' | 'sk' | 'tour' | 'cruise' | 'circuit';

export async function getPackageDepartures(query: PackageQuery = 'all') {
    return tctRequest(`/v1/package/getPackageDepartures?query=${query}`, {
        method: 'GET',
    });
}

// ============ Export ============

export const tctApi = {
    // Configuration
    config: TCT_CONFIG,
    isConfigured,

    // Connection
    testConnection,

    // Static Data
    getNationalities,
    getGeography,
    getAirports,
    getHotelCategories,
    getHotelMealPlans,
    getHotelInformation,

    // Hotel Search
    searchHotelsSync,
    searchHotels,
    getHotelResults,

    // Hotel Details
    getHotelValuation,
    getHotelDetails,

    // Booking
    bookHotel,
    getBookingDetails,
    cancelBooking,

    // Packages
    getPackageDepartures,
};

export default tctApi;
