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

    /** Specific provider id if targetProvider is set */
    providerId?: string | number;

    /** Specific provider type if targetProvider is set */
    providerType?: 'hotel' | 'city' | 'country' | 'destination';

    /** Target provider name */
    targetProvider?: string;

    /** Category filter (e.g. ['4', '5']) */
    stars?: string[] | number[];

    /** Meal plan filters (e.g. ['AI', 'HB']) */
    board?: string[];

    /** Abort signal to cancel in-flight request */
    abortSignal?: AbortSignal;
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

    /** Meal plan (e.g., "All Inclusive", "Half Board") - First/Selected one */
    mealPlan: string;

    /** List of all available meal plans for this hotel */
    mealPlans?: string[];

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

    /** Latitude for map display */
    latitude?: number;

    /** Longitude for map display */
    longitude?: number;

    /** Contact information (optional) */
    contactInfo?: {
        phone?: string;
        email?: string;
        website?: string;
        fax?: string;
        emergencyContact?: string;
    };
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

    /** Tariff information */
    tariff?: any;

    /** Cancellation policy parameters */
    cancellationPolicyRequestParams?: any;
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
     * Get detailed cancellation policy for a specific room
     * @param room The room option to get policy for
     */
    getCancellationPolicy?(room: RoomOption, abortSignal?: AbortSignal): Promise<any>;

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
