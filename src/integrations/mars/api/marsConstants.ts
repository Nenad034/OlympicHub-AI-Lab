/**
 * Mars API V1 - Constants and Configuration
 * 
 * Source: https://marsapi.stoplight.io/docs/mars-api-v1/
 * Provider: Neolab (https://www.neolab.hr)
 */

// ============================================================================
// Environment Variables
// ============================================================================

export const MARS_CONFIG = {
    // Base URL - should be replaced with actual Mars domain
    BASE_URL: import.meta.env.VITE_MARS_BASE_URL || 'https://yourMarsDomain',

    // Mock server for testing
    MOCK_URL: 'https://stoplight.io/mocks/marsapi/mars-api-v1/73778095',

    // Authentication credentials
    USERNAME: import.meta.env.VITE_MARS_USERNAME || '',
    PASSWORD: import.meta.env.VITE_MARS_PASSWORD || '',

    // Use mock server if no credentials
    USE_MOCK: import.meta.env.VITE_MARS_USE_MOCK === 'true' || false,
} as const;

// ============================================================================
// API Endpoints
// ============================================================================

export const MARS_ENDPOINTS = {
    // Index Service - Get all accommodations
    INDEX: '/mapi/v1/objects/index',

    // Details Service - Get accommodation details
    DETAILS: '/mapi/v1/objects/details',
} as const;

// ============================================================================
// Response Types
// ============================================================================

export const MARS_RESPONSE_TYPES = {
    JSON: 'json',
    XML: 'xml',
} as const;

// ============================================================================
// Base Service Types
// ============================================================================

export const MARS_BASE_SERVICES = {
    CLASSIC: 'classic',
    JUNIOR: 'junior',
    SUPERIOR: 'superior',
    EXECUTIVE: 'executive',
    BUSINESS: 'business',
    STANDARD: 'standard',
    COMFORT: 'comfort',
    DELUXE: 'deluxe',
    PRESIDENTIAL_SUITE: 'presidentialSuite',
    PREMIUM: 'premium',
    DUPLEX: 'duplex',
    MEZZANIN: 'mezzanin',
    FAMILY: 'family',
} as const;

// ============================================================================
// Payment Types
// ============================================================================

export const MARS_PAYMENT_TYPES = {
    PER_PERSON_PER_DAY: 'perPersonPerDay',
    PER_PERSON: 'perPerson',
    ONCE: 'Once',
    PER_UNIT_PER_WEEK: 'perUnitPerWeek',
    PER_HOUR: 'perHour',
    PER_DAY: 'perDay',
} as const;

// ============================================================================
// Amenity Values
// ============================================================================

export const MARS_AMENITY_VALUES = {
    AIRPORT_PICKUP: {
        NO: 'no',
        YES_PAID: 'yesPaid',
        YES_FREE: 'yesFree',
    },
    INTERNET: {
        YES_FREE: 'yesFree',
        NO: 'no',
        YES: 'yes',
        YES_PAID: 'yesPaid',
    },
    PARKING: {
        NO: 'no',
        YES: 'yes',
    },
    PET_ALLOWED: {
        YES: 'yes',
        YES_PAID: 'yesPaid',
        YES_FREE: 'yesFree',
        YES_REQUEST: 'yesRequest',
        NO: 'no',
    },
    POOL: {
        NO: 'no',
        YES: 'yes',
        YES_PAID: 'yesPaid',
        YES_FREE: 'yesFree',
    },
} as const;

// ============================================================================
// Common Amenity Names
// ============================================================================

export const MARS_AMENITIES = {
    // General
    ADULTS_ONLY: 'adultsOnly',
    AIR_CONDITIONING: 'airConditioning',
    AIRCONDITION: 'aircondition',
    AIRPORT_DISTANCE: 'airportDistance',
    AIRPORT_PICKUP: 'airportPickup',
    AREA: 'area',
    BEACH_DISTANCE: 'beachDistance',
    CATEGORY: 'category',
    CENTER_DISTANCE: 'centerDistance',
    CHECK_IN: 'checkIn',
    CHECK_OUT: 'checkOut',
    INTERNET: 'internet',
    PARKING: 'parking',
    PET_ALLOWED: 'petAllowed',
    POOL: 'pool',
    POOL_TYPES: 'poolTypes',

    // Bathroom
    BATHROOM: 'bathroom',

    // Activities
    ACTIVITIES: 'activities',
    ADDITIONAL_CONTENT: 'additionalContentInTheFacility',

    // Room-specific (Room_1 to Room_9)
    ROOM_SIZE: 'roomSize',
    NUMBER_OF_GUESTS: 'numberOfGuestsPerRoom',
    SINGLE_BED: 'singleBed',
    DOUBLE_BED: 'doubleBed',
    KING_BED: 'kingBed',
    QUEEN_BED: 'queenBed',
    SOFA_BED: 'sofaBed',
    BUNK_BED: 'bunkBed',
    FUTON_MAT: 'futonMat',
    PRIVATE_BATHROOM: 'privateBathroom',
    ROOM_TYPE: 'roomType',
} as const;

// ============================================================================
// Room View Types
// ============================================================================

export const MARS_ROOM_VIEWS = {
    RIVER_VIEW: 'riverView',
    SKI_VIEW: 'skiView',
    POOL_VIEW: 'poolView',
    SEA_VIEW: 'seaView',
    PARK_VIEW: 'parkView',
    GARDEN_VIEW: 'gardenView',
    LAKE_VIEW: 'lakeView',
    CITY_VIEW: 'cityView',
    SEASIDE: 'seaside',
    MOUNTAIN_VIEW: 'mountainView',
    STREET_SIDE: 'streetSide',
    LANDMARK_VIEW: 'landmarkView',
} as const;

// ============================================================================
// Pool Types
// ============================================================================

export const MARS_POOL_TYPES = {
    SHARED: 'sharedPool',
    INDOOR: 'indoorPool',
    CHILDREN: 'childrenPool',
    OUTDOOR: 'outdoorPool',
    HEATED: 'heatedPool',
} as const;

// ============================================================================
// Activities
// ============================================================================

export const MARS_ACTIVITIES = {
    DIVING: 'diving',
    BICYCLE_RENTAL: 'bicycleRental',
    CYCLING: 'cycling',
    SPA: 'spa',
    GAME_ROOM: 'gameRoom',
} as const;

// ============================================================================
// Additional Facility Content
// ============================================================================

export const MARS_FACILITY_CONTENT = {
    KIDS_PLAYGROUND: 'kidsPlayground',
    MASSAGE: 'massage',
    SAUNA: 'sauna',
    JACUZZI: 'jacuzzi',
} as const;

// ============================================================================
// Bathroom Features
// ============================================================================

export const MARS_BATHROOM_FEATURES = {
    TOILET: 'toilet',
    SHOWER: 'shower',
    BATHTUB: 'bathtub',
    HAIR_DRYER: 'hairDryer',
} as const;

// ============================================================================
// HTTP Status Codes
// ============================================================================

export const MARS_HTTP_STATUS = {
    SUCCESS: 200,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    NOT_FOUND: 404,
} as const;

// ============================================================================
// Cache Configuration
// ============================================================================

export const MARS_CACHE_CONFIG = {
    // Cache TTL in milliseconds
    INDEX_TTL: 24 * 60 * 60 * 1000, // 24 hours
    DETAILS_TTL: 6 * 60 * 60 * 1000, // 6 hours

    // Cache keys
    CACHE_PREFIX: 'mars_api_',
    INDEX_KEY: 'mars_api_index',
    DETAILS_KEY_PREFIX: 'mars_api_details_',
} as const;

// ============================================================================
// Default Values
// ============================================================================

export const MARS_DEFAULTS = {
    RESPONSE_TYPE: 'json' as const,
    CURRENCY: 'EUR',
    MIN_STAY: 1,
    MAX_STAY: 365,
} as const;

// ============================================================================
// API Contact Information
// ============================================================================

export const MARS_CONTACT = {
    PROVIDER: 'Neolab',
    WEBSITE: 'https://www.neolab.hr/en/contact',
    EMAIL: 'info@neolab.hr',
    API_DOCS: 'https://marsapi.stoplight.io/docs/mars-api-v1/',
} as const;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get the active base URL (mock or production)
 */
export const getMarsBaseUrl = (): string => {
    return MARS_CONFIG.USE_MOCK ? MARS_CONFIG.MOCK_URL : MARS_CONFIG.BASE_URL;
};

/**
 * Check if Mars API is configured
 */
export const isMarsConfigured = (): boolean => {
    return !!(MARS_CONFIG.USERNAME && MARS_CONFIG.PASSWORD) || MARS_CONFIG.USE_MOCK;
};

/**
 * Get Basic Auth header value
 */
export const getMarsAuthHeader = (): string => {
    const credentials = `${MARS_CONFIG.USERNAME}:${MARS_CONFIG.PASSWORD}`;
    return `Basic ${btoa(credentials)}`;
};
