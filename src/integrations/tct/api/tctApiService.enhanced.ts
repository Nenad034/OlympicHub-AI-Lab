/**
 * TCT API Service - Enhanced Version
 * Sa Timeout, Retry, Circuit Breaker, Logging
 */

import { post, APIError, apiCircuitBreaker } from '../utils/apiHelpers';
import { tctApiLogger } from './tctApiLogger';

// API Configuration
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

// Base64 encode credentials
const getAuthHeader = () => {
    const credentials = `${TCT_CONFIG.username}:${TCT_CONFIG.password}`;
    return `Basic ${btoa(credentials)}`;
};

// Common headers
const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'API-SOURCE': TCT_CONFIG.apiSource,
    'Authorization': getAuthHeader(),
});

// Enhanced API request with timeout, retry, circuit breaker
async function tctRequest<T>(
    endpoint: string,
    body?: any,
    sessionId?: string
): Promise<{ data: T | null; error: string | null; success: boolean }> {
    if (!isConfigured()) {
        return {
            data: null,
            error: 'TCT API credentials not configured',
            success: false,
        };
    }

    try {
        // Circuit breaker protection
        const data = await apiCircuitBreaker.execute(async () => {
            const url = `${TCT_CONFIG.baseUrl}${endpoint}`;

            // Headers
            const headers: Record<string, string> = {
                ...getHeaders()
            };

            if (sessionId) {
                headers['SESSIONID'] = sessionId;
            }

            // API request sa timeout i retry
            return await post<T>(url, body || {}, {
                headers,
                timeout: 10000, // 10 sekundi
                retries: 3,
                retryDelay: 1000,
                onRetry: (attempt, error) => {
                    console.warn(`🔄 TCT API Retry ${attempt}/3:`, error.message);
                    tctApiLogger.logEvent({
                        type: 'RETRY',
                        endpoint,
                        attempt,
                        error: error.message
                    });
                }
            });
        });

        return {
            data,
            error: null,
            success: true,
        };
    } catch (error) {
        console.error(`❌ TCT API Error [${endpoint}]:`, error);

        // Log error
        tctApiLogger.logEvent({
            type: 'ERROR',
            endpoint,
            error: error instanceof Error ? error.message : 'Unknown error'
        });

        return {
            data: null,
            error: error instanceof APIError
                ? error.message
                : error instanceof Error
                    ? error.message
                    : 'Unknown error occurred',
            success: false,
        };
    }
}

// ============ Connection Test ============

export async function testConnection() {
    console.log('🔌 Testing TCT API connection...');
    return tctRequest('/v1/nbc/nationalities');
}

// ============ Static Data / NBC ============

export async function getNationalities() {
    return tctRequest('/v1/nbc/nationalities');
}

export async function getGeography() {
    return tctRequest('/v1/nbc/geography');
}

export async function getAirports() {
    return tctRequest('/v1/nbc/airports');
}

export async function getHotelCategories() {
    return tctRequest('/v1/nbc/hotelCategories');
}

export async function getHotelMealPlans() {
    return tctRequest('/v1/nbc/hotelMealPlans');
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

    return tctRequest(`/v1/nbc/hotelInformation?${queryParams.toString()}`);
}

// ============ Hotel Search ============

export interface HotelSearchParams {
    search_type: 'city' | 'region' | 'country' | 'hotel';
    location: string;
    airport?: string;
    hotel_ids?: string[];
    checkin: string;
    checkout: string;
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
    return tctRequest('/v1/hotel/searchSync', params);
}

export async function searchHotels(params: HotelSearchParams) {
    return tctRequest('/v1/hotel/search', params);
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
    return tctRequest('/v1/hotel/results', params, sessionId);
}

// ============ Hotel Valuation & Details ============

export interface ValuationParams {
    id: string;
    code: string;
}

export async function getHotelValuation(params: ValuationParams, sessionId?: string) {
    return tctRequest('/v1/hotel/valuation', params, sessionId);
}

export interface HotelDetailsParams {
    hid_undeduplicated: string;
    availsearch_id: number;
}

export async function getHotelDetails(params: HotelDetailsParams, sessionId?: string) {
    return tctRequest('/v1/hotel/hotelDetails', params, sessionId);
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
    return tctRequest('/v1/hotel/book', params, sessionId);
}

export interface BookingDetailsParams {
    code?: string;
    external_reference?: string;
}

export async function getBookingDetails(params: BookingDetailsParams) {
    return tctRequest('/v1/hotel/bookingDetails', params);
}

export async function cancelBooking(code: string) {
    return tctRequest('/v1/hotel/cancel', { code });
}

// ============ Package API ============

export type PackageQuery = 'all' | 'sk' | 'tour' | 'cruise' | 'circuit';

export async function getPackageDepartures(query: PackageQuery = 'all') {
    return tctRequest(`/v1/package/getPackageDepartures?query=${query}`);
}

// ============ Export ============

export const tctApiEnhanced = {
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

    // Utilities
    getCircuitBreakerState: () => apiCircuitBreaker.getState(),
    resetCircuitBreaker: () => apiCircuitBreaker.reset(),
};

export default tctApiEnhanced;
