/**
 * ORS Provider Adapter
 * 
 * Adapter for integrating ORS API with our unified provider system
 * Similar to SolvexProvider but for ORS REST API
 */

import { orsSearchService, type OrsSearchParams } from '../ors/orsSearchService';
import type { HotelSearchResult, HotelSearchParams } from './HotelProviderInterface';

export class OrsProvider {
    private enabled: boolean = true;

    /**
     * Search hotels using ORS API
     */
    async searchHotels(params: HotelSearchParams): Promise<HotelSearchResult[]> {
        if (!this.enabled) {
            console.log('[ORS Provider] Provider is disabled');
            return [];
        }

        try {
            console.log('[ORS Provider] Starting search with params:', params);

            // Convert our unified params to ORS params
            const orsParams: OrsSearchParams = {
                dateFrom: params.checkIn,
                dateTo: params.checkOut,
                adults: params.adults || 2,
                children: params.children || 0,
                childrenAges: params.childrenAges || [],
                cityName: params.destination,
                regionId: params.regionId,
                locationId: params.locationId,
                minDuration: params.minNights,
                maxDuration: params.maxNights,
                minPrice: params.minPrice,
                maxPrice: params.maxPrice,
                stars: params.stars,
                productFacts: this.mapProductFacts(params),
                language: params.language || 'en',
            };

            const results = await orsSearchService.searchHotels(orsParams);

            console.log('[ORS Provider] Search completed:', {
                resultsCount: results.length,
            });

            // Add provider metadata
            return results.map(hotel => ({
                ...hotel,
                source: 'ORS',
                provider: 'ORS',
            }));
        } catch (error) {
            console.error('[ORS Provider] Search failed:', error);

            // Return empty array on error (don't break other providers)
            return [];
        }
    }

    /**
     * Map our search params to ORS product facts
     */
    private mapProductFacts(params: HotelSearchParams): string[] | undefined {
        const facts: string[] = [];

        // Map special search types to ORS facts
        if (params.searchType === 'ski') {
            facts.push('ski');
        }
        if (params.searchType === 'beach') {
            facts.push('bea'); // beach
        }
        if (params.amenities?.includes('pool')) {
            facts.push('pol'); // pool
        }
        if (params.amenities?.includes('spa')) {
            facts.push('wel'); // wellness
        }
        if (params.amenities?.includes('wifi')) {
            facts.push('wifi');
        }
        if (params.amenities?.includes('parking')) {
            facts.push('park');
        }
        if (params.amenities?.includes('restaurant')) {
            facts.push('res'); // restaurant
        }

        return facts.length > 0 ? facts : undefined;
    }

    /**
     * Get hotel details by GIATA ID
     */
    async getHotelDetails(
        giataId: number,
        tourOperator: string,
        language: string = 'en'
    ): Promise<any> {
        try {
            const endpoint = `/info/product/by-gid/${giataId}/${tourOperator}`;
            // This would use orsAuthService.get() but we'll implement it when needed
            console.log('[ORS Provider] Getting hotel details:', { giataId, tourOperator });
            return null;
        } catch (error) {
            console.error('[ORS Provider] Failed to get hotel details:', error);
            return null;
        }
    }

    /**
     * Check availability for specific offer
     */
    async checkAvailability(
        tourOperator: string,
        hashCode: string,
        passengers: any[]
    ): Promise<any> {
        try {
            console.log('[ORS Provider] Checking availability:', {
                tourOperator,
                hashCode,
                passengersCount: passengers.length,
            });

            // This would use the verify endpoint
            // We'll implement it when we add booking functionality
            return null;
        } catch (error) {
            console.error('[ORS Provider] Availability check failed:', error);
            return null;
        }
    }

    /**
     * Enable/disable provider
     */
    setEnabled(enabled: boolean): void {
        this.enabled = enabled;
        console.log(`[ORS Provider] Provider ${enabled ? 'enabled' : 'disabled'}`);
    }

    /**
     * Check if provider is enabled
     */
    isEnabled(): boolean {
        return this.enabled;
    }

    /**
     * Get provider info
     */
    getInfo() {
        return {
            id: 'ors',
            name: 'ORS',
            description: 'Online Reservation System - Multi-operator platform',
            enabled: this.enabled,
            features: [
                'Hotels',
                'Packages (Hotel + Flight)',
                'Organized Trips',
                'Multi-language support',
                'GIATA standard IDs',
                'Optional bookings',
            ],
            contentTypes: ['hotel', 'pauschal', 'trips'],
            coverage: 'Europe, Mediterranean, Worldwide',
            apiType: 'REST/JSON',
        };
    }
}

// Singleton instance
export const orsProvider = new OrsProvider();
