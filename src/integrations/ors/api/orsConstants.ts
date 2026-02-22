/**
 * ORS API Constants
 * 
 * ORS (Online Reservation System) API configuration
 * Documentation: https://api.ors.si/docs/v2
 */

// API Configuration
export const ORS_CONFIG = {
    // Always use proxy path (handled by Vite in dev, Vercel in prod)
    BASE_URL: '/api/ors',
    API_KEY: 'bdc92ca93dc7be78992a6450633df6c9',
    TIMEOUT: 30000, // 30 seconds
    RATE_LIMIT: {
        MAX_REQUESTS: 60,
        WINDOW_MS: 60000, // 1 minute
    },
} as const;

// Content Types
export const ORS_CONTENT_TYPES = {
    HOTEL: 'hotel',
    PAUSCHAL: 'pauschal', // Package with flight
    TRIPS: 'trips',
} as const;

// Service Types (Pansion/Meal Plans)
export const ORS_SERVICE_TYPES = {
    'A-': 'All Inclusive Light',
    'A+': 'All Inclusive with Extras',
    'AI': 'All Inclusive',
    'HP': 'Half Board',
    'FB': 'Full Board',
    'BB': 'Bed & Breakfast',
    'UF': 'Bed & Breakfast', // Same as BB
    'RO': 'Room Only',
    'SC': 'Self Catering',
} as const;

// Room Types
export const ORS_ROOM_TYPES = {
    'DZ': 'Double Room',
    'EZ': 'Single Room',
    '3Z': 'Triple Room',
    '4Z': 'Four Room',
    'AP': 'Apartment',
    'ST': 'Studio',
    'SU': 'Suite',
} as const;

// Price Types
export const ORS_PRICE_TYPES = {
    PERSON: 'PerPerson',
    ROOM: 'PerRoom',
    ALL: 'All',
    NONE: 'None',
} as const;

// Booking Status
export const ORS_BOOKING_STATUS = {
    CONFIRMED: 0,
    NOT_CONFIRMED: 1,
    WAITING_CONFIRMATION: 2,
    CANCELED: 3,
    WAITING_CANCELATION: 4,
} as const;

// Quota Status
export const ORS_QUOTA_STATUS = {
    NONE: 0,
    YES: 1,
    NO: 2,
    A_FEW: 3,
    REQUEST: 4,
    NO_FLIGHT: 5,
    ONLY_AGENT: 6,
    ALL: 7,
    NOT_CHECKED: 10,
} as const;

// Languages
export const ORS_LANGUAGES = {
    EN: 'en',
    HR: 'hr',
    SI: 'si',
    DE: 'de',
    RS: 'rs',
    SK: 'sk',
} as const;

// Default Search Parameters
export const ORS_DEFAULT_PARAMS = {
    MIN_DURATION: 1,
    MAX_DURATION: 30,
    ADULT_COUNT: 2,
    CHILDREN_AGE: [],
    LANGUAGE: ORS_LANGUAGES.EN,
} as const;

// API Endpoints
export const ORS_ENDPOINTS = {
    // Static Content
    LANGUAGES: '/lists/languages',
    ROOM_CODES: '/lists/roomcodes',
    ROOM_SUBTYPES: '/lists/roomsubtypes',
    ROOM_LOCATIONS: '/lists/roomlocations',
    ROOM_FACILITIES: '/lists/roomfacilities',
    FACTS: '/lists/facts',
    SERVICE_CODES: '/lists/servicecodes',
    TOUR_OPERATORS: '/lists/touroperators',
    REGION_GROUPS: '/lists/regiongroups',
    REGIONS: '/lists/regions',
    LOCATIONS: '/lists/locations',
    AIRPORTS: '/lists/airports',
    SUBTYPES: '/lists/subtypes',

    // Search
    SEARCH_REGIONS: (contentType: string) => `/search/${contentType}/regions`,
    SEARCH_PRODUCTS: (contentType: string) => `/search/${contentType}/products`,
    SEARCH_DATES: (contentType: string) => `/search/${contentType}/dates`,
    SEARCH_MATRIX: (contentType: string) => `/search/${contentType}/matrix`,
    QUICK_SEARCH: (contentType: string) => `/search/${contentType}/quicksearch`,

    // Product Info
    PRODUCT_INFO: (giataId: string, tourOperator: string) =>
        `/info/product/by-gid/${giataId}/${tourOperator}`,
    ROOM_INFO: (giataId: string, tourOperator: string, productCode: string) =>
        `/info/product/by-gid/${giataId}/${tourOperator}/${productCode}`,
    SERVICE_INFO: (giataId: string, tourOperator: string, productCode: string, serviceCode: string) =>
        `/info/product/by-gid/${giataId}/${tourOperator}/${productCode}/${serviceCode}`,

    // Availability
    VERIFY: (tourOperator: string, hashCode: string) =>
        `/offer/${tourOperator}/${hashCode}/verify`,
    OPTION_CHECK: (tourOperator: string, hashCode: string) =>
        `/offer/${tourOperator}/${hashCode}/option-check`,
    FLIGHT_INFO: (tourOperator: string, hashCode: string) =>
        `/offer/${tourOperator}/${hashCode}/flight-info`,
    OFFER_INFO: (tourOperator: string, hashCode: string) =>
        `/offer/${tourOperator}/${hashCode}/`,

    // Booking
    REGISTER: (tourOperator: string, hashCode: string) =>
        `/offer/${tourOperator}/${hashCode}/register`,
    BOOKING: (tourOperator: string, hashCode: string) =>
        `/offer/${tourOperator}/${hashCode}/booking`,
    OPTION: (tourOperator: string, hashCode: string) =>
        `/offer/${tourOperator}/${hashCode}/option`,
    CANCEL: (tourOperator: string, hashCode: string) =>
        `/offer/${tourOperator}/${hashCode}/cancel`,
} as const;

// Error Messages
export const ORS_ERROR_MESSAGES = {
    INVALID_API_KEY: 'Invalid API key',
    NO_OFFERS: 'No offers found',
    TOO_MANY_MATCHES: 'Too many matches - please refine your search',
    INVALID_DATES: 'Invalid date range',
    NETWORK_ERROR: 'Network error - please try again',
    TIMEOUT: 'Request timeout',
    PARSE_ERROR: 'Failed to parse response',
} as const;

// Rate Limiter
let requestCount = 0;
let windowStart = Date.now();

export const checkRateLimit = (): boolean => {
    const now = Date.now();

    // Reset window if needed
    if (now - windowStart > ORS_CONFIG.RATE_LIMIT.WINDOW_MS) {
        requestCount = 0;
        windowStart = now;
    }

    // Check limit
    if (requestCount >= ORS_CONFIG.RATE_LIMIT.MAX_REQUESTS) {
        return false;
    }

    requestCount++;
    return true;
};

export const getRateLimitStatus = () => ({
    remaining: Math.max(0, ORS_CONFIG.RATE_LIMIT.MAX_REQUESTS - requestCount),
    total: ORS_CONFIG.RATE_LIMIT.MAX_REQUESTS,
    resetAt: new Date(windowStart + ORS_CONFIG.RATE_LIMIT.WINDOW_MS),
});
