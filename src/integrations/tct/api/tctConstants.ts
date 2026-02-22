/**
 * TCT API Constants and Mappings
 * 
 * =============================================================================
 * LEGAL NOTICE: Technical Necessity and Independent Development
 * =============================================================================
 */

export const TCT_ENDPOINTS = {
    SEARCH: '/hotels/search',
    DETAILS: '/hotels/details',
    GEOGRAPHY: '/geography'
} as const;

export const TCT_FIELD_MAPPING = {
    'id': 'hotelId',
    'name': 'hotelName',
    'price_total': 'totalPrice',
    'currency_code': 'currency',
    'stars': 'starRating',
    'meal_plan': 'mealPlan'
} as const;

export default {
    TCT_ENDPOINTS,
    TCT_FIELD_MAPPING
};
