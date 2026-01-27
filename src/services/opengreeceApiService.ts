// Open Greece API Service
// Main service for interacting with Open Greece OTA XML API

import { OPENGREECE_CONFIG, getBasicAuthHeader } from '../config/opengreeceConfig';
import {
    buildStartPushProcessRQ,
    buildHotelSearchRQ,
    buildHotelDescriptiveInfoRQ,
    buildHotelAvailRQ,
    buildHotelResRQ,
    buildCancelRQ,
    type HotelAvailParams,
    type HotelBookingParams,
} from '../utils/opengreeceXmlBuilder';
import {
    parseStartPushProcessRS,
    parseHotelSearchRS,
    parseGenericResponse,
    parseHotelDescriptiveInfoRS,
    parseHotelAvailRS,
    parseHotelResRS,
    parseCancelRS,
} from '../utils/opengreeceXmlParser';
import type {
    OpenGreeceResponse,
    StartPushProcessResponse,
    OpenGreeceHotel,
    OpenGreeceHotelDetails,
    OpenGreeceAvailabilityResponse,
    OpenGreeceBooking,
    OpenGreeceCancellationResponse,
} from '../types/opengreece.types';
import { rateLimiter } from '../utils/rateLimiter';

// ============================================================================
// HTTP Client
// ============================================================================

// Helper to convert endpoint to proxy URL in development
function getProxyUrl(endpoint: string): string {
    // In development, use Vite proxy to bypass CORS
    if (import.meta.env.DEV) {
        // Convert full URL to proxy path
        if (endpoint.includes('nsCallWebServices')) {
            return '/api/opengreece/nsCallWebServices/handlerequest.aspx';
        } else if (endpoint.includes('nsCallWebService_Push')) {
            return '/api/opengreece/nsCallWebService_Push/handlerequest.aspx';
        }
    }
    // In production, use direct URL
    return endpoint;
}

async function sendXMLRequest(endpoint: string, xmlBody: string): Promise<string> {
    try {
        const url = getProxyUrl(endpoint);
        console.log(`📡 Sending request to: ${url}`);

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': getBasicAuthHeader(),
                'Content-Type': 'text/xml; charset=utf-8',
            },
            body: xmlBody,
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.text();
    } catch (error) {
        console.error('❌ Open Greece API Error:', error);
        throw error;
    }
}

// ============================================================================
// Push API Methods
// ============================================================================

/**
 * Start Push Process - Get contract updates
 * @param isFullPush - true for full download, false for delta sync
 */
export async function startPushProcess(
    isFullPush: boolean = false
): Promise<OpenGreeceResponse<StartPushProcessResponse>> {
    console.log(`🇬🇷 Starting Push Process (${isFullPush ? 'FULL' : 'DELTA'})...`);

    try {
        const xmlRequest = buildStartPushProcessRQ(isFullPush);
        console.log('📤 XML Request:', xmlRequest);

        const xmlResponse = await sendXMLRequest(OPENGREECE_CONFIG.PUSH_ENDPOINT, xmlRequest);
        console.log('📥 XML Response:', xmlResponse);

        const result = parseStartPushProcessRS(xmlResponse);
        console.log('📊 Parsed Result:', result);

        if (result.success && result.data) {
            console.log(`✅ Push Process completed: ${result.data.totalCount} hotels`);
            console.log(`   NEW: ${result.data.newCount}`);
            console.log(`   UPDATED: ${result.data.updatedCount}`);
            console.log(`   DELETED: ${result.data.deletedCount}`);
        } else {
            console.error('❌ Push Process failed:', result.errors);
        }

        return result;
    } catch (error) {
        console.error('❌ Push Process error:', error);
        return {
            success: false,
            errors: [{ type: 'NETWORK', message: String(error) }],
            timestamp: new Date().toISOString(),
        };
    }
}

// ============================================================================
// Pull API Methods
// ============================================================================

/**
 * Search Hotels
 * @param hotelCode - Optional hotel code, or undefined for all hotels
 */
export async function searchHotels(
    hotelCode?: string
): Promise<OpenGreeceResponse<OpenGreeceHotel[]>> {
    console.log(`🔍 Searching hotels${hotelCode ? ` (code: ${hotelCode})` : ' (all)'}...`);

    try {
        const xmlRequest = buildHotelSearchRQ(hotelCode);
        const xmlResponse = await sendXMLRequest(OPENGREECE_CONFIG.PULL_ENDPOINT, xmlRequest);
        const result = parseHotelSearchRS(xmlResponse);

        if (result.success && result.data) {
            console.log(`✅ Found ${result.data.length} hotels`);
        } else {
            console.error('❌ Hotel search failed:', result.errors);
        }

        return result;
    } catch (error) {
        console.error('❌ Hotel search error:', error);
        return {
            success: false,
            errors: [{ type: 'NETWORK', message: String(error) }],
            timestamp: new Date().toISOString(),
        };
    }
}

/**
 * Get Hotel Details
 * @param hotelCode - Hotel code
 */
export async function getHotelDetails(
    hotelCode: string
): Promise<OpenGreeceResponse<any>> {
    console.log(`📋 Getting hotel details for: ${hotelCode}...`);

    try {
        const xmlRequest = buildHotelDescriptiveInfoRQ(hotelCode);
        const xmlResponse = await sendXMLRequest(OPENGREECE_CONFIG.PULL_ENDPOINT, xmlRequest);
        const result = parseGenericResponse(xmlResponse);

        if (result.success) {
            console.log(`✅ Hotel details retrieved`);
        } else {
            console.error('❌ Hotel details failed:', result.errors);
        }

        return result;
    } catch (error) {
        console.error('❌ Hotel details error:', error);
        return {
            success: false,
            errors: [{ type: 'NETWORK', message: String(error) }],
            timestamp: new Date().toISOString(),
        };
    }
}

/**
 * Check Hotel Availability
 * @param params - Availability search parameters
 */
export async function checkAvailability(
    params: HotelAvailParams
): Promise<OpenGreeceResponse<any>> {
    // Rate limit check
    const limitCheck = rateLimiter.checkLimit('opengreece');
    if (!limitCheck.allowed) {
        console.warn(`[OpenGreece] Rate limit exceeded. Retry after ${limitCheck.retryAfter}s`);
        return {
            success: false,
            errors: [{
                type: 'RATE_LIMIT',
                message: `Rate limit exceeded. Please wait ${limitCheck.retryAfter} seconds before retrying.`
            }],
            timestamp: new Date().toISOString(),
        };
    }

    console.log(`📅 Checking availability...`, params);

    try {
        const xmlRequest = buildHotelAvailRQ(params);
        const xmlResponse = await sendXMLRequest(OPENGREECE_CONFIG.PULL_ENDPOINT, xmlRequest);
        const result = parseGenericResponse(xmlResponse);

        if (result.success) {
            console.log(`✅ Availability check completed`);
        } else {
            console.error('❌ Availability check failed:', result.errors);
        }

        return result;
    } catch (error) {
        console.error('❌ Availability check error:', error);
        return {
            success: false,
            errors: [{ type: 'NETWORK', message: String(error) }],
            timestamp: new Date().toISOString(),
        };
    }
}

/**
 * Create Booking
 * @param params - Booking parameters
 */
export async function createBooking(
    params: HotelBookingParams
): Promise<OpenGreeceResponse<any>> {
    console.log(`📝 Creating booking...`, params);

    try {
        const xmlRequest = buildHotelResRQ(params);
        const xmlResponse = await sendXMLRequest(OPENGREECE_CONFIG.PULL_ENDPOINT, xmlRequest);
        const result = parseGenericResponse(xmlResponse);

        if (result.success) {
            console.log(`✅ Booking created`);
        } else {
            console.error('❌ Booking creation failed:', result.errors);
        }

        return result;
    } catch (error) {
        console.error('❌ Booking creation error:', error);
        return {
            success: false,
            errors: [{ type: 'NETWORK', message: String(error) }],
            timestamp: new Date().toISOString(),
        };
    }
}

/**
 * Cancel Booking
 * @param bookingId - Booking ID to cancel
 */
export async function cancelBooking(
    bookingId: string
): Promise<OpenGreeceResponse<any>> {
    console.log(`❌ Cancelling booking: ${bookingId}...`);

    try {
        const xmlRequest = buildCancelRQ(bookingId);
        const xmlResponse = await sendXMLRequest(OPENGREECE_CONFIG.PULL_ENDPOINT, xmlRequest);
        const result = parseGenericResponse(xmlResponse);

        if (result.success) {
            console.log(`✅ Booking cancelled`);
        } else {
            console.error('❌ Booking cancellation failed:', result.errors);
        }

        return result;
    } catch (error) {
        console.error('❌ Booking cancellation error:', error);
        return {
            success: false,
            errors: [{ type: 'NETWORK', message: String(error) }],
            timestamp: new Date().toISOString(),
        };
    }
}

// ============================================================================
// Export all methods
// ============================================================================

export const OpenGreeceAPI = {
    // Push API
    startPushProcess,

    // Pull API
    searchHotels,
    getHotelDetails,
    checkAvailability,
    createBooking,
    cancelBooking,
};

export default OpenGreeceAPI;
