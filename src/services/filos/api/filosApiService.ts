/**
 * Filos (One Tourismo) API Service
 * Endpoint: https://api-v2.onetourismo.com
 */

const FILOS_BASE_ORIGIN = 'https://api-v2.onetourismo.com';
const FILOS_STATIC_ORIGIN = 'https://api-static.onetourismo.com';

/**
 * Helper to convert full URL to proxy path in the browser to bypass CORS
 */
function getTargetUrl(origin: string, type: 'v2' | 'static'): string {
    // If we're in a browser and in development mode, use the Vite proxy
    // @ts-ignore
    if (typeof window !== 'undefined' && (import.meta.env?.DEV || window.location.hostname === 'localhost')) {
        return `/api/filos-${type}`;
    }
    return origin;
}

const BASE_URL = getTargetUrl(FILOS_BASE_ORIGIN, 'v2');
const STATIC_URL = getTargetUrl(FILOS_STATIC_ORIGIN, 'static');

export interface FilosCredentials {
    username: string;
    password: string;
}

// Credentials from Environment Variables
export const FILOS_CREDENTIALS: FilosCredentials = {
    username: import.meta.env.VITE_FILOS_USERNAME || 'demo@filostravel.gr',
    password: import.meta.env.VITE_FILOS_PASSWORD || 'filosdemo2022!'
};

export interface FilosAvailabilityRequest {
    username: string;
    password: string;
    start_date: string; // YYYY-MM-DD
    end_date: string;   // YYYY-MM-DD
    nationality: string; // 2 letters
    rooms: Array<{
        adults: number;
        children: number;
        childrenAges?: number[];
    }>;
    hotelCodes?: string[];
    destination?: string;
}

export const filosApiService = {
    /**
     * General availability search
     */
    async getAvailability(params: Omit<FilosAvailabilityRequest, 'username' | 'password'>) {
        try {
            // Try api-v2 first, but be prepared for "static mode" error
            const response = await fetch(`${BASE_URL}/availability`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...FILOS_CREDENTIALS,
                    ...params
                })
            });
            if (!response.ok) {
                const text = await response.text();
                return {
                    success: false,
                    data: null,
                    error: `HTTP ${response.status}: ${text.substring(0, 100) || 'Server error'}`
                };
            }

            const data = await response.json();

            // If the API says it's in static mode, it might mean we should use the static domain for testing
            if (data.message && data.message.includes('static mode')) {
                console.warn('API is in static mode, switching to static endpoint...');
                return this.getStaticAvailability(params);
            }

            return {
                success: data.status === 'success',
                data: data.results,
                error: data.status === 'failure' ? data.message : null
            };
        } catch (error) {
            console.error('Filos API Error (Availability):', error);
            // Check if it's a fetch error (likely CORS or network)
            const msg = error instanceof Error ? error.message : String(error);
            return {
                success: false,
                data: null,
                error: msg.includes('Failed to fetch') ? 'Nije moguće pristupiti Filos API-ju (CORS ili Network error)' : msg
            };
        }
    },

    /**
     * Try availability on the static endpoint (often used for testing)
     */
    async getStaticAvailability(params: Omit<FilosAvailabilityRequest, 'username' | 'password'>) {
        try {
            const response = await fetch(`${STATIC_URL}/availability`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...FILOS_CREDENTIALS,
                    ...params
                })
            });

            const data = await response.json();
            return {
                success: data.status === 'success',
                data: data.results,
                error: data.status === 'failure' ? data.message : null
            };
        } catch (error) {
            console.error('Filos API Error (Static Availability):', error);
            return {
                success: false,
                data: null,
                error: String(error)
            };
        }
    },

    /**
     * Get detailed hotel info (Static Data)
     * Endpoint: https://api-static.onetourismo.com/info/:HOTEL_ID
     */
    async getHotelInfo(hotelId: string) {
        try {
            console.log(`Fetching Filos Hotel Info for: ${hotelId}`);
            const auth = btoa(`${FILOS_CREDENTIALS.username}:${FILOS_CREDENTIALS.password}`);
            const response = await fetch(`${STATIC_URL}/info/${hotelId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${auth}`
                },
                body: JSON.stringify({
                    username: FILOS_CREDENTIALS.username,
                    password: FILOS_CREDENTIALS.password
                })
            });

            if (!response.ok) {
                const text = await response.text();
                return {
                    success: false,
                    data: null,
                    error: `HTTP Error ${response.status}: ${text.substring(0, 100)}`
                };
            }

            const data = await response.json();
            return {
                success: data.status === 'success',
                data: data.results,
                error: data.status === 'failure' ? data.message : null
            };
        } catch (error) {
            console.error('Filos API Error (HotelInfo):', error);
            return {
                success: false,
                data: null,
                error: String(error)
            };
        }
    },

    /**
     * Get destinations list (Static Data)
     * Endpoint: GET https://api-static.onetourismo.com/static/destinations
     */
    async getDestinations() {
        try {
            const auth = btoa(`${FILOS_CREDENTIALS.username}:${FILOS_CREDENTIALS.password}`);
            const response = await fetch(`${STATIC_URL}/static/destinations`, {
                method: 'GET',
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'Accept': 'application/json'
                }
            });

            const data = await response.json();
            return {
                success: Array.isArray(data) || data.status === 'success',
                data: Array.isArray(data) ? data : (data.results || data.destinations || data),
                error: (!Array.isArray(data) && data.status === 'failure') ? data.message : null
            };
        } catch (error) {
            console.error('Filos API Error (Destinations):', error);
            return {
                success: false,
                data: null,
                error: String(error)
            };
        }
    },

    /**
     * Get hotels list (Static Data) with FULL INFO
     * Endpoint: GET https://api-static.onetourismo.com/static/my_properties?include_static=true
     */
    async getHotels() {
        try {
            const auth = btoa(`${FILOS_CREDENTIALS.username}:${FILOS_CREDENTIALS.password}`);
            const response = await fetch(`${STATIC_URL}/static/my_properties?include_static=true`, {
                method: 'GET',
                headers: {
                    'Authorization': `Basic ${auth}`,
                    'Accept': 'application/json'
                }
            });

            const data = await response.json();
            return {
                success: Array.isArray(data) || data.status === 'success',
                data: Array.isArray(data) ? data : (data.hotels || data.results || data),
                error: (!Array.isArray(data) && data.status === 'failure') ? data.message : null
            };
        } catch (error) {
            console.error('Filos API Error (Hotels):', error);
            return {
                success: false,
                data: null,
                error: String(error)
            };
        }
    }
};

export default filosApiService;
