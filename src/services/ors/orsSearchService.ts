/**
 * ORS API Search Service
 * 
 * Handles hotel search operations using ORS API
 * Much simpler than Solvex - REST API with JSON!
 */

import { orsAuthService } from './orsAuthService';
import { ORS_ENDPOINTS, ORS_CONTENT_TYPES, ORS_DEFAULT_PARAMS } from './orsConstants';
import { orsDictionaryService } from './orsDictionaryService';
import type {
    OrsSearchRequestRegions,
    OrsSearchRequestProducts,
    OrsSearchRequestDates,
    OrsSearchRegionResponse,
    OrsSearchProductResponse,
    OrsSearchDatesResponse,
    OrsQuickSearchRequest,
    OrsContentType,
} from '../../types/ors.types';

// Our unified hotel interface (same as Solvex)
import type { HotelSearchResult, HotelSearchParams } from '../providers/HotelProviderInterface';

export interface OrsSearchParams {
    dateFrom: string; // YYYY-MM-DD
    dateTo: string; // YYYY-MM-DD
    adults: number;
    children?: number;
    childrenAges?: number[];
    regionId?: number;
    regionGroupId?: number;
    locationId?: number;
    cityName?: string;
    minDuration?: number;
    maxDuration?: number;
    minPrice?: number;
    maxPrice?: number;
    stars?: number[];
    productFacts?: string[]; // e.g., ['ski', 'beach', 'pool']
    contentType?: OrsContentType;
    language?: string;
}

export class OrsSearchService {
    /**
     * Search regions - first step in ORS recommended flow
     */
    async searchRegions(params: OrsSearchParams): Promise<OrsSearchRegionResponse> {
        const request: OrsSearchRequestRegions = {
            StartDate: params.dateFrom,
            EndDate: params.dateTo,
            MinDuration: params.minDuration || this.calculateDuration(params.dateFrom, params.dateTo),
            MaxDuration: params.maxDuration || this.calculateDuration(params.dateFrom, params.dateTo),
            AdultCount: params.adults,
            ChildrenAge: params.childrenAges || [],
        };

        // Add filters if provided
        if (params.minPrice || params.maxPrice || params.stars) {
            request.RFilter = {};

            if (params.minPrice || params.maxPrice) {
                request.RFilter.Price = {
                    Minimum: params.minPrice,
                    Maximum: params.maxPrice,
                };
            }

            if (params.stars && params.stars.length > 0) {
                request.RFilter.Category = params.stars;
            }
        }

        const contentType = params.contentType || ORS_CONTENT_TYPES.HOTEL;
        const endpoint = ORS_ENDPOINTS.SEARCH_REGIONS(contentType);

        return orsAuthService.post<OrsSearchRegionResponse>(
            endpoint,
            request,
            params.language
        );
    }

    /**
     * Search products (hotels) - second step in ORS flow
     */
    async searchProducts(params: OrsSearchParams): Promise<OrsSearchProductResponse> {
        const request: OrsSearchRequestProducts = {
            StartDate: params.dateFrom,
            EndDate: params.dateTo,
            MinDuration: params.minDuration || this.calculateDuration(params.dateFrom, params.dateTo),
            MaxDuration: params.maxDuration || this.calculateDuration(params.dateFrom, params.dateTo),
            AdultCount: params.adults,
            ChildrenAge: params.childrenAges || [],
        };

        // Add location filters
        if (params.regionId) {
            request.Region = [params.regionId];
        }
        if (params.regionGroupId) {
            request.RegionGroup = [params.regionGroupId];
        }
        if (params.locationId) {
            request.Location = [params.locationId];
        }

        // Add product facts (e.g., ski, beach)
        if (params.productFacts && params.productFacts.length > 0) {
            request.ProductFacts = params.productFacts;
        }

        const contentType = params.contentType || ORS_CONTENT_TYPES.HOTEL;
        const endpoint = ORS_ENDPOINTS.SEARCH_PRODUCTS(contentType);

        return orsAuthService.post<OrsSearchProductResponse>(
            endpoint,
            request,
            params.language
        );
    }

    /**
     * Search dates (available offers) - third step in ORS flow
     */
    async searchDates(params: OrsSearchParams & { giataIds?: number[] }): Promise<OrsSearchDatesResponse> {
        const request: OrsSearchRequestDates = {
            StartDate: params.dateFrom,
            EndDate: params.dateTo,
            MinDuration: params.minDuration || this.calculateDuration(params.dateFrom, params.dateTo),
            MaxDuration: params.maxDuration || this.calculateDuration(params.dateFrom, params.dateTo),
            AdultCount: params.adults,
            ChildrenAge: params.childrenAges || [],
        };

        // Add GIATA IDs if provided (specific hotels)
        if (params.giataIds && params.giataIds.length > 0) {
            request.GiataID = params.giataIds;
        }

        // Add location filters
        if (params.regionId) {
            request.Region = [params.regionId];
        }
        if (params.regionGroupId) {
            request.RegionGroup = [params.regionGroupId];
        }
        if (params.locationId) {
            request.Location = [params.locationId];
        }

        const contentType = params.contentType || ORS_CONTENT_TYPES.HOTEL;
        const endpoint = ORS_ENDPOINTS.SEARCH_DATES(contentType);

        return orsAuthService.post<OrsSearchDatesResponse>(
            endpoint,
            request,
            params.language
        );
    }

    /**
     * Quick search - autocomplete for products/locations
     */
    async quickSearch(
        query: string,
        contentType: OrsContentType = ORS_CONTENT_TYPES.HOTEL,
        language?: string
    ): Promise<any> {
        const request: OrsQuickSearchRequest = {
            Query: query,
            MaxResults: 20,
        };

        const endpoint = ORS_ENDPOINTS.QUICK_SEARCH(contentType);

        return orsAuthService.post(endpoint, request, language);
    }

    /**
     * Main search method - combines all steps for simplified usage
     * Similar to Solvex searchHotels method
     */
    async searchHotels(params: OrsSearchParams): Promise<HotelSearchResult[]> {
        try {
            console.log('[ORS] Starting hotel search:', params);

            // Step 1: If no region specified, try to find it by city name
            let regionId = params.regionId;
            let locationId = params.locationId;

            if (!regionId && !locationId && params.cityName) {
                const locations = await orsDictionaryService.searchLocation(
                    params.cityName,
                    params.language || 'en'
                );

                if (locations.length > 0) {
                    const location = locations[0] as any;
                    locationId = parseInt(Object.keys(location)[0]) || undefined;
                    console.log('[ORS] Found location:', location);
                }
            }

            // Step 2: Search for available dates/offers
            const datesResponse = await this.searchDates({
                ...params,
                regionId,
                locationId,
            });

            console.log('[ORS] Search results:', {
                offersCount: datesResponse.Dates?.length || 0,
                productsCount: datesResponse.Products?.length || 0,
            });

            // Step 3: Convert to our unified format
            const results = await this.convertToHotelResults(datesResponse, params.language);

            console.log('[ORS] Converted results:', results.length);

            return results;
        } catch (error) {
            console.error('[ORS] Search error:', error);
            throw error;
        }
    }

    /**
     * Convert ORS response to our unified HotelSearchResult format
     */
    private async convertToHotelResults(
        response: OrsSearchDatesResponse,
        language: string = 'en'
    ): Promise<HotelSearchResult[]> {
        if (!response.Dates || response.Dates.length === 0) {
            return [];
        }

        // Group offers by GIATA ID (hotel)
        const hotelMap = new Map<number, any>();

        for (const offer of response.Dates) {
            // Find product info
            const product = response.Products?.find(p => p.GiataID === parseInt(offer.ProductCode));

            if (!product) continue;

            const giataId = product.GiataID;

            if (!hotelMap.has(giataId)) {
                hotelMap.set(giataId, {
                    id: giataId.toString(),
                    name: product.OfferName,
                    stars: product.Category || 0,
                    city: {
                        id: product.Location?.LocationID?.toString() || '',
                        name: product.Location?.LocationName || '',
                    },
                    country: {
                        name: product.Location?.RegionGroupName || '',
                    },
                    region: {
                        name: product.Location?.RegionName || '',
                    },
                    offers: [],
                    images: product.Picture ? [product.Picture.Full] : [],
                    thumbnail: product.Picture?.Thumbnail,
                    rating: product.OfferRating,
                    recommendationPercentage: product.RecommendationPercentage,
                    facts: product.Facts || {},
                    source: 'ORS',
                });
            }

            // Add offer to hotel
            const hotel = hotelMap.get(giataId);
            hotel.offers.push({
                id: offer.HashCode,
                checkIn: offer.StartDate,
                checkOut: offer.EndDate,
                duration: offer.Duration,
                room: {
                    roomType: {
                        id: offer.RoomType || '',
                        name: offer.RoomName || '',
                    },
                    roomCategory: {
                        name: offer.RoomDetails || '',
                    },
                    accommodation: {
                        name: offer.RoomLocation || '',
                    },
                },
                pansion: {
                    id: offer.ServiceType || '',
                    code: offer.ServiceType || '',
                    name: offer.ServiceName || '',
                },
                price: {
                    amount: offer.Price,
                    currency: 'EUR',
                    priceType: offer.PriceType,
                },
                tourOperator: {
                    code: offer.TourOperator,
                    name: offer.TourOperatorName,
                },
                availability: {
                    status: offer.OfferStatusName || 'Available',
                    nonRefundable: offer.NonRefundable,
                    freeCancelUntil: offer.FreeCancelUntil,
                },
                includedServices: offer.IncludedServicesList || [],
                hashCode: offer.HashCode,
            });
        }

        return Array.from(hotelMap.values());
    }

    /**
     * Calculate duration in nights
     */
    private calculateDuration(dateFrom: string, dateTo: string): number {
        const from = new Date(dateFrom);
        const to = new Date(dateTo);
        const diff = to.getTime() - from.getTime();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    }
}

// Singleton instance
export const orsSearchService = new OrsSearchService();
