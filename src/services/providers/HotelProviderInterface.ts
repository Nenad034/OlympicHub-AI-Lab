/**
 * Generic Hotel Provider Interface
 * 
 * =============================================================================
 * LEGAL NOTICE: Vendor-Agnostic Architecture
 * =============================================================================
 * 
 * This interface defines a vendor-agnostic contract for hotel search providers.
 * It demonstrates that our application is NOT dependent on any single vendor's
 * API structure or terminology.
 * 
 * PURPOSE:
 * - Prove independence from specific vendors (Solvex, OpenGreece, TCT, etc.)
 * - Enable easy addition/removal of providers without affecting core application
 * - Establish our own data model using generic, industry-standard terminology
 * - Provide legal protection in case of vendor disputes
 * 
 * BENEFITS:
 * - Any hotel API can be integrated by implementing this interface
 * - Vendor-specific code is isolated in adapter classes
 * - Application logic uses only generic terms (hotel, room, price, etc.)
 * - Easy to switch vendors or use multiple vendors simultaneously
 * 
 * @see docs/legal/COMPLIANCE_ACTION_PLAN.md (Phase 3)
 * =============================================================================
 */

/**
 * Generic hotel search parameters
 * Uses industry-standard terminology, not vendor-specific names
 */
export interface HotelSearchParams {
    /** Destination (city name, hotel code, or location) */
    destination: string;

    /** Check-in date */
    checkIn: Date;

    /** Check-out date */
    checkOut: Date;

    /** Number of adult guests */
    adults: number;

    /** Number of child guests (optional) */
    children?: number;

    /** Ages of children (optional) */
    childrenAges?: number[];

    /** Number of rooms (optional, default: 1) */
    rooms?: number;

    /** Preferred currency (optional, default: EUR) */
    currency?: string;

    /** Meal plan preference (optional) */
    mealPlan?: string;

    /** Nationality (optional) */
    nationality?: string;

    /** Specific provider identifier (e.g. Solvex HotelKey or CityKey) */
    providerId?: string | number;

    /** Specific provider type (e.g. 'hotel', 'city', 'country') */
    providerType?: 'hotel' | 'city' | 'country';

    /** If providerId is specified, which provider does it belong to? */
    targetProvider?: string;
}

/**
 * Generic hotel search result
 * Represents a hotel offer in a vendor-agnostic format
 */
export interface HotelSearchResult {
    /** Unique identifier (prefixed with provider name, e.g., "solvex-123") */
    id: string;

    /** Provider name (e.g., "Solvex", "OpenGreece", "TCT") */
    providerName: string;

    /** Hotel name */
    hotelName: string;

    /** Location (city, region, country) */
    location: string;

    /** Total price */
    price: number;

    /** Currency code (ISO 4217) */
    currency: string;

    /** Star rating (1-5) */
    stars: number;

    /** Meal plan (e.g., "All Inclusive", "Half Board") */
    mealPlan: string;

    /** Main hotel image URL (optional) */
    image?: string;

    /** List of hotel image URLs (optional) */
    images?: string[];

    /** Detailed hotel description (optional) */
    description?: string;

    /** Availability status */
    availability: 'available' | 'on_request' | 'unavailable';

    /** Available room options */
    rooms: RoomOption[];

    /** Check-in date */
    checkIn: Date;

    /** Check-out date */
    checkOut: Date;

    /** Number of nights */
    nights: number;

    /** Original provider-specific data (for booking) */
    originalData?: any;
}

/**
 * Generic room option
 */
export interface RoomOption {
    /** Room type ID */
    id: string;

    /** Room type name */
    name: string;

    /** Room description */
    description?: string;

    /** Room price */
    price: number;

    /** Room availability */
    availability: 'available' | 'on_request' | 'unavailable';

    /** Maximum occupancy */
    capacity?: number;

    /** Meal plan (optional, for grouped results) */
    mealPlan?: string;
}

/**
 * Hotel Provider Interface
 * 
 * Any hotel API provider must implement this interface to be integrated
 * into the ClickToTravel Hub system.
 */
export interface HotelProvider {
    /** Provider name (e.g., "Solvex", "OpenGreece") */
    readonly name: string;

    /** Whether this provider is currently active */
    readonly isActive: boolean;

    /**
     * Authenticate with the provider
     * @throws Error if authentication fails
     */
    authenticate(): Promise<void>;

    /**
     * Search for hotels
     * @param params Generic search parameters
     * @returns Array of hotel search results in generic format
     */
    search(params: HotelSearchParams): Promise<HotelSearchResult[]>;

    /**
     * Get detailed information about a specific hotel
     * @param hotelId Hotel identifier
     * @returns Detailed hotel information
     */
    getHotelDetails?(hotelId: string): Promise<HotelSearchResult>;

    /**
     * Check if the provider is properly configured
     * @returns True if provider has valid credentials and configuration
     */
    isConfigured(): boolean;
}

/**
 * Provider configuration
 */
export interface ProviderConfig {
    /** Provider name */
    name: string;

    /** Whether provider is enabled */
    enabled: boolean;

    /** API credentials (stored securely in .env) */
    credentials?: {
        username?: string;
        password?: string;
        apiKey?: string;
        apiSecret?: string;
    };

    /** API endpoint URL */
    endpoint?: string;

    /** Additional provider-specific settings */
    settings?: Record<string, any>;
}

// End of interface definitions
