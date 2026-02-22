/**
 * Mars API V1 - Authentication Service
 * 
 * Handles HTTP Basic Authentication for Mars API
 */

import {
    MARS_CONFIG,
    MARS_ENDPOINTS,
    MARS_HTTP_STATUS,
    getMarsBaseUrl,
    getMarsAuthHeader,
    isMarsConfigured,
} from './marsConstants';

export class MarsAuthService {
    private baseUrl: string;
    private authHeader: string;

    constructor() {
        this.baseUrl = getMarsBaseUrl();
        this.authHeader = getMarsAuthHeader();
    }

    /**
     * Check if Mars API is configured and ready
     */
    isConfigured(): boolean {
        return isMarsConfigured();
    }

    /**
     * Get authentication status
     */
    getAuthStatus(): {
        configured: boolean;
        useMock: boolean;
        baseUrl: string;
        hasCredentials: boolean;
    } {
        return {
            configured: this.isConfigured(),
            useMock: MARS_CONFIG.USE_MOCK,
            baseUrl: this.baseUrl,
            hasCredentials: !!(MARS_CONFIG.USERNAME && MARS_CONFIG.PASSWORD),
        };
    }

    /**
     * Make authenticated GET request
     */
    async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
        const url = new URL(endpoint, this.baseUrl);

        // Add query parameters
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    url.searchParams.append(key, String(value));
                }
            });
        }

        console.log('[Mars API] GET:', url.toString());

        try {
            const response = await fetch(url.toString(), {
                method: 'GET',
                headers: {
                    'Authorization': this.authHeader,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
            });

            console.log('[Mars API] Response status:', response.status);

            if (!response.ok) {
                await this.handleErrorResponse(response);
            }

            const data = await response.json();
            console.log('[Mars API] Response data:', data);

            return data as T;
        } catch (error) {
            console.error('[Mars API] Request failed:', error);
            throw error;
        }
    }

    /**
     * Make authenticated POST request
     */
    async post<T>(endpoint: string, body: any): Promise<T> {
        const url = new URL(endpoint, this.baseUrl);

        console.log('[Mars API] POST:', url.toString());
        console.log('[Mars API] Body:', body);

        try {
            const response = await fetch(url.toString(), {
                method: 'POST',
                headers: {
                    'Authorization': this.authHeader,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });

            console.log('[Mars API] Response status:', response.status);

            if (!response.ok) {
                await this.handleErrorResponse(response);
            }

            const data = await response.json();
            console.log('[Mars API] Response data:', data);

            return data as T;
        } catch (error) {
            console.error('[Mars API] Request failed:', error);
            throw error;
        }
    }

    /**
     * Handle error responses
     */
    private async handleErrorResponse(response: Response): Promise<never> {
        let errorMessage = `Mars API error: ${response.status} ${response.statusText}`;

        try {
            const errorData = await response.json();
            if (errorData.messages && errorData.messages.length > 0) {
                errorMessage = errorData.messages.map((m: any) => m.message).join(', ');
            }
        } catch {
            // If JSON parsing fails, use default error message
        }

        switch (response.status) {
            case MARS_HTTP_STATUS.UNAUTHORIZED:
                throw new Error(`Authentication failed: ${errorMessage}. Check your Mars API credentials.`);
            case MARS_HTTP_STATUS.NOT_FOUND:
                throw new Error(`Resource not found: ${errorMessage}`);
            case MARS_HTTP_STATUS.BAD_REQUEST:
                throw new Error(`Bad request: ${errorMessage}`);
            default:
                throw new Error(errorMessage);
        }
    }

    /**
     * Test connection to Mars API
     */
    async testConnection(): Promise<{
        success: boolean;
        message: string;
        data?: any;
    }> {
        try {
            console.log('[Mars API] Testing connection...');

            const response = await this.get(MARS_ENDPOINTS.INDEX, {
                responseType: 'json',
            });

            return {
                success: true,
                message: 'Successfully connected to Mars API',
                data: response,
            };
        } catch (error) {
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    /**
     * Update base URL (useful for switching between mock and production)
     */
    setBaseUrl(url: string): void {
        this.baseUrl = url;
        console.log('[Mars API] Base URL updated to:', url);
    }

    /**
     * Update credentials
     */
    setCredentials(username: string, password: string): void {
        const credentials = `${username}:${password}`;
        this.authHeader = `Basic ${btoa(credentials)}`;
        console.log('[Mars API] Credentials updated');
    }
}

// Singleton instance
export const marsAuthService = new MarsAuthService();
