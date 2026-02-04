/**
 * Flight Search Manager
 * 
 * Orchestrates flight searches across multiple providers
 * Aggregates and normalizes results
 */

import type {
    FlightSearchParams,
    FlightSearchResponse,
    UnifiedFlightOffer
} from '../../types/flight.types';

import { flightMockService } from '../flightMockService';
import { getAmadeusApi } from './providers/amadeus/amadeusApiService';

class FlightSearchManager {
    /**
     * Search flights across all enabled providers
     */
    async searchFlights(params: FlightSearchParams): Promise<FlightSearchResponse> {
        const startTime = Date.now();
        console.log('🔍 Starting unified flight search:', params);

        const results: UnifiedFlightOffer[] = [];
        const providerStatuses: FlightSearchResponse['providers'] = [];

        // 1. Construct generic search params
        const genericParams = {
            origin: params.origin,
            destination: params.destination,
            departureDate: new Date(params.departureDate),
            returnDate: params.returnDate ? new Date(params.returnDate) : undefined,
            adults: params.adults,
            children: params.children,
            infants: 0,
            travelClass: (params.cabinClass?.toUpperCase() || 'ECONOMY') as any
        };

        // 2. Try the unified provider manager
        const manager = await import('../providers/FlightProviderManager').then(m => m.getFlightProviderManager());
        const providerOffers = await manager.searchAll(genericParams);

        if (providerOffers.length > 0) {
            // Transform generic offers back to UnifiedFlightOffer for UI compatibility
            providerOffers.forEach(o => {
                const providerId: any = o.providerName.toLowerCase();

                results.push({
                    id: o.id,
                    provider: providerId as any,
                    price: {
                        total: o.price,
                        currency: o.currency,
                        base: o.price * 0.8,
                        taxes: o.price * 0.2
                    },
                    slices: o.itineraries.map(it => ({
                        duration: it.duration ? 120 : 0, // Simplified duration
                        departure: it.segments[0].departure.at,
                        arrival: it.segments[it.segments.length - 1].arrival.at,
                        stops: it.segments.length - 1,
                        origin: {
                            iataCode: it.segments[0].departure.iataCode,
                            city: it.segments[0].departure.iataCode,
                            name: 'Airport Name',
                            country: 'Country',
                            terminal: it.segments[0].departure.terminal
                        },
                        destination: {
                            iataCode: it.segments[it.segments.length - 1].arrival.iataCode,
                            city: it.segments[it.segments.length - 1].arrival.iataCode,
                            name: 'Airport Name',
                            country: 'Country',
                            terminal: it.segments[it.segments.length - 1].arrival.terminal
                        },
                        segments: it.segments.map((seg: any) => ({
                            id: seg.id,
                            carrierCode: seg.carrierCode,
                            carrierName: seg.carrierCode,
                            flightNumber: seg.number,
                            aircraft: seg.aircraft?.code || 'N/A',
                            duration: 0,
                            departure: seg.departure.at,
                            arrival: seg.arrival.at,
                            origin: {
                                iataCode: seg.departure.iataCode,
                                city: seg.departure.iataCode,
                                name: 'Airport Name',
                                country: 'Country'
                            },
                            destination: {
                                iataCode: seg.arrival.iataCode,
                                city: seg.arrival.iataCode,
                                name: 'Airport Name',
                                country: 'Country'
                            }
                        }))
                    })),
                    validatingAirlineCodes: o.validatingAirlineCodes,
                    bookingToken: `token-${o.id}`,
                    validUntil: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
                    cabinClass: params.cabinClass || 'economy',
                    originalData: o
                });
            });

            // Aggregate counts by provider
            const countsByProvider = providerOffers.reduce((acc, offer) => {
                const name = offer.providerName.toLowerCase();
                acc[name] = (acc[name] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);

            Object.entries(countsByProvider).forEach(([name, count]) => {
                providerStatuses.push({
                    provider: name as any,
                    status: 'complete',
                    resultCount: count
                });
            });
        }

        // 3. Fallback to mock if no results found
        if (results.length === 0) {
            console.log('ℹ️ No live results, falling back to mock service');
            try {
                const mockResponse = await flightMockService.searchFlights(params);
                results.push(...mockResponse.offers);
                providerStatuses.push({
                    provider: 'mock',
                    status: 'complete',
                    resultCount: mockResponse.offers.length
                });
            } catch (mockError) {
                console.error('❌ Mock fallback failed:', mockError);
            }
        }

        const searchTime = Date.now() - startTime;
        results.sort((a, b) => a.price.total - b.price.total);

        return {
            success: results.length > 0,
            offers: results,
            searchId: `search-${Date.now()}`,
            totalResults: results.length,
            providers: providerStatuses,
            searchTime,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Check if Amadeus is configured (for UI hints)
     */
    public isAmadeusConfigured(): boolean {
        const apiKey = import.meta.env.VITE_AMADEUS_API_KEY;
        const apiSecret = import.meta.env.VITE_AMADEUS_API_SECRET;

        return !!(apiKey && apiSecret);
    }
}

// Singleton instance
const flightSearchManager = new FlightSearchManager();

export default flightSearchManager;
