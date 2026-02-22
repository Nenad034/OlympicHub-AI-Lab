/**
 * OpenGreece API Constants and Mappings
 * 
 * =============================================================================
 * LEGAL NOTICE: Technical Necessity and Independent Development
 * =============================================================================
 * 
 * This file contains constants representing technical requirements of the 
 * OpenGreece API. These values are derived from:
 * 1. Analysis of public API endpoints and standard HTTP/REST patterns.
 * 2. Empirical observation of XML/JSON responses (Trial-and-Error).
 * 3. Technical necessity for XML tag names and structure.
 * 
 * @see docs/legal/INDEPENDENT_DEVELOPMENT_LOG.md
 * =============================================================================
 */

export const OPENGREECE_METHODS = {
    CHECK_AVAILABILITY: 'CheckAvailability',
    GET_HOTEL_INFO: 'GetHotelInfo',
    GET_DESTINATIONS: 'GetDestinations'
} as const;

export const OPENGREECE_FIELD_MAPPING = {
    'HotelCode': 'hotelId',
    'HotelName': 'hotelName',
    'Price': 'totalPrice',
    'Currency': 'currency',
    'Category': 'starRating',
    'BoardBasis': 'mealPlan'
} as const;

export default {
    OPENGREECE_METHODS,
    OPENGREECE_FIELD_MAPPING
};
