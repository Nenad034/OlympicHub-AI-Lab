/**
 * Amadeus API Constants and Mappings
 * 
 * =============================================================================
 * LEGAL NOTICE: Technical Necessity and Independent Development
 * =============================================================================
 */

export const AMADEUS_RESOURCES = {
    FLIGHT_OFFERS: '/shopping/flight-offers',
    HOTEL_OFFERS: '/shopping/hotel-offers'
} as const;

export const AMADEUS_FIELD_MAPPING = {
    'id': 'offerId',
    'price': 'totalPrice',
    'currency': 'currency'
} as const;

export default {
    AMADEUS_RESOURCES,
    AMADEUS_FIELD_MAPPING
};
