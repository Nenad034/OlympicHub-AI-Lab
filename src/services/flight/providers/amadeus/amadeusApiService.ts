/**
 * Amadeus API Service
 * 
 * Main service for interacting with Amadeus Flight API
 * Implements search, pricing, and booking functionality
 */

import type {
    AmadeusConfig,
    AmadeusFlightOffersSearchRequest,
    AmadeusFlightOffersSearchResponse,
    AmadeusFlightOffersPricingRequest,
    AmadeusFlightOffersPricingResponse,
    AmadeusFlightCreateOrderRequest,
    AmadeusFlightCreateOrderResponse,
    AmadeusError,
    AmadeusFlightOffer
} from './amadeusTypes';

import type {
    FlightSearchParams,
    UnifiedFlightOffer,
    FlightValidationRequest,
    FlightValidationResponse,
    FlightBookingRequest,
    FlightBookingResponse,
    PassengerDetails
} from '../../../../types/flight.types';

import { getAmadeusAuth } from './amadeusAuthService';
import { mapAmadeusOffersToUnified, mapAmadeusOfferToUnified } from './amadeusMapper';
import { rateLimiter } from '../../../../utils/rateLimiter';

class AmadeusApiService {
    private config: AmadeusConfig;

    constructor(config: AmadeusConfig) {
        this.config = config;
    }

    /**
     * Search for flight offers
     */
    async searchFlights(params: FlightSearchParams): Promise<UnifiedFlightOffer[]> {
        // Rate limit check
        const limitCheck = rateLimiter.checkLimit('amadeus');
        if (!limitCheck.allowed) {
            console.warn(`[Amadeus] Rate limit exceeded. Retry after ${limitCheck.retryAfter}s`);
            throw new Error(`Rate limit exceeded. Please wait ${limitCheck.retryAfter} seconds before retrying.`);
        }

        console.log('🔍 Amadeus Search:', params);

        try {
            const token = await getAmadeusAuth().getAccessToken();

            // Build search request
            const searchParams: AmadeusFlightOffersSearchRequest = {
                originLocationCode: params.origin,
                destinationLocationCode: params.destination,
                departureDate: params.departureDate,
                returnDate: params.returnDate,
                adults: params.adults,
                children: params.children > 0 ? params.children : undefined,
                travelClass: mapCabinClass(params.cabinClass),
                currencyCode: params.currency || 'EUR',
                max: 50, // Limit results
                nonStop: params.directFlightsOnly
            };

            // Build query string
            const queryString = new URLSearchParams(
                Object.entries(searchParams)
                    .filter(([_, value]) => value !== undefined)
                    .map(([key, value]) => [key, String(value)])
            ).toString();

            const url = `${this.config.baseUrl}/v2/shopping/flight-offers?${queryString}`;

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                await this.handleError(response);
            }

            const data: AmadeusFlightOffersSearchResponse = await response.json();

            console.log(`✅ Amadeus returned ${data.data.length} offers`);

            // Map to unified format
            return mapAmadeusOffersToUnified(data.data, data.dictionaries);

        } catch (error) {
            console.error('❌ Amadeus search failed:', error);
            throw error;
        }
    }

    /**
     * Validate and price a specific offer
     */
    async validateOffer(request: FlightValidationRequest): Promise<FlightValidationResponse> {
        console.log('✅ Amadeus Validation:', request);

        try {
            const token = await getAmadeusAuth().getAccessToken();

            // Get original Amadeus offer from booking token
            const originalOffer = JSON.parse(
                atob(request.bookingToken)
            ) as AmadeusFlightOffer;

            // Build pricing request
            const pricingRequest: AmadeusFlightOffersPricingRequest = {
                data: {
                    type: 'flight-offers-pricing',
                    flightOffers: [originalOffer]
                }
            };

            const url = `${this.config.baseUrl}/v1/shopping/flight-offers/pricing`;

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(pricingRequest)
            });

            if (!response.ok) {
                await this.handleError(response);
            }

            const data: AmadeusFlightOffersPricingResponse = await response.json();
            const pricedOffer = data.data.flightOffers[0];

            // Compare prices
            const originalPrice = parseFloat(originalOffer.price.total);
            const newPrice = parseFloat(pricedOffer.price.total);
            const priceChanged = Math.abs(originalPrice - newPrice) > 0.01;

            console.log(`✅ Amadeus validation complete. Price changed: ${priceChanged}`);

            return {
                valid: true,
                priceChanged,
                newPrice: priceChanged ? {
                    total: newPrice,
                    base: parseFloat(pricedOffer.price.base),
                    taxes: newPrice - parseFloat(pricedOffer.price.base),
                    currency: pricedOffer.price.currency
                } : undefined,
                available: true,
                seatsRemaining: pricedOffer.numberOfBookableSeats,
                message: priceChanged ? 'Price has changed since search' : 'Offer is still valid',
                updatedBookingToken: btoa(JSON.stringify(pricedOffer)),
                validatedAt: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ Amadeus validation failed:', error);

            return {
                valid: false,
                priceChanged: false,
                available: false,
                message: 'Validation failed. Please search again.',
                validatedAt: new Date().toISOString()
            };
        }
    }

    /**
     * Create flight booking
     */
    async bookFlight(request: FlightBookingRequest): Promise<FlightBookingResponse> {
        console.log('📝 Amadeus Booking:', request);

        try {
            const token = await getAmadeusAuth().getAccessToken();

            // Get priced offer from booking token
            const pricedOffer = JSON.parse(
                atob(request.bookingToken)
            ) as AmadeusFlightOffer;

            // Build booking request
            const bookingRequest: AmadeusFlightCreateOrderRequest = {
                data: {
                    type: 'flight-order',
                    flightOffers: [pricedOffer],
                    travelers: mapPassengersToAmadeus(request.passengers),
                    contacts: [{
                        addresseeName: {
                            firstName: request.passengers[0].firstName,
                            lastName: request.passengers[0].lastName
                        },
                        purpose: 'STANDARD',
                        phones: [{
                            deviceType: 'MOBILE',
                            countryCallingCode: '381',
                            number: request.passengers[0].phone || '0000000'
                        }],
                        emailAddress: request.passengers[0].email || 'noreply@example.com',
                        address: {
                            lines: ['Street 1'],
                            postalCode: '11000',
                            cityName: 'Belgrade',
                            countryCode: 'RS'
                        }
                    }]
                }
            };

            const url = `${this.config.baseUrl}/v1/booking/flight-orders`;

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(bookingRequest)
            });

            if (!response.ok) {
                await this.handleError(response);
            }

            const data: AmadeusFlightCreateOrderResponse = await response.json();

            console.log('✅ Amadeus booking successful:', data.data.id);

            // Extract PNR from associated records
            const pnr = data.data.associatedRecords?.[0]?.reference || data.data.id;

            return {
                success: true,
                status: 'confirmed',
                bookingReference: data.data.id,
                pnr,
                providerBookingId: data.data.id,
                message: 'Booking confirmed successfully',
                bookedAt: new Date().toISOString(),
                originalData: data
            };

        } catch (error) {
            console.error('❌ Amadeus booking failed:', error);

            return {
                success: false,
                status: 'failed',
                message: error instanceof Error ? error.message : 'Booking failed',
                errors: [error instanceof Error ? error.message : 'Unknown error']
            };
        }
    }

    /**
     * Handle API errors
     */
    private async handleError(response: Response): Promise<never> {
        let errorMessage = `Amadeus API error: ${response.status}`;

        try {
            const errorData: AmadeusError = await response.json();
            if (errorData.errors && errorData.errors.length > 0) {
                const firstError = errorData.errors[0];
                errorMessage = `${firstError.title}: ${firstError.detail}`;
            }
        } catch {
            // If JSON parsing fails, use status text
            errorMessage = `Amadeus API error: ${response.status} ${response.statusText}`;
        }

        throw new Error(errorMessage);
    }
}

/**
 * Helper: Map cabin class to Amadeus format
 */
function mapCabinClass(cabinClass?: string): 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST' | undefined {
    if (!cabinClass) return undefined;

    const mapping: Record<string, 'ECONOMY' | 'PREMIUM_ECONOMY' | 'BUSINESS' | 'FIRST'> = {
        'economy': 'ECONOMY',
        'premium_economy': 'PREMIUM_ECONOMY',
        'business': 'BUSINESS',
        'first': 'FIRST'
    };

    return mapping[cabinClass];
}

/**
 * Helper: Map passengers to Amadeus format
 */
function mapPassengersToAmadeus(passengers: PassengerDetails[]) {
    return passengers.map((passenger, index) => ({
        id: String(index + 1),
        dateOfBirth: passenger.dateOfBirth,
        name: {
            firstName: passenger.firstName,
            lastName: passenger.lastName
        },
        gender: passenger.gender === 'M' ? 'MALE' as const : 'FEMALE' as const,
        contact: {
            emailAddress: passenger.email,
            phones: passenger.phone ? [{
                deviceType: 'MOBILE' as const,
                countryCallingCode: '381',
                number: passenger.phone
            }] : undefined
        },
        documents: passenger.passport ? [{
            documentType: 'PASSPORT' as const,
            number: passenger.passport.number,
            expiryDate: passenger.passport.expiryDate,
            issuanceCountry: passenger.passport.issuingCountry,
            validityCountry: passenger.passport.issuingCountry,
            nationality: passenger.passport.nationality || passenger.passport.issuingCountry,
            holder: true
        }] : undefined
    }));
}

// Singleton instance
let apiServiceInstance: AmadeusApiService | null = null;

/**
 * Initialize Amadeus API Service
 */
export function initAmadeusApi(config: AmadeusConfig): AmadeusApiService {
    apiServiceInstance = new AmadeusApiService(config);
    return apiServiceInstance;
}

/**
 * Get Amadeus API Service instance
 */
export function getAmadeusApi(): AmadeusApiService {
    if (!apiServiceInstance) {
        throw new Error('Amadeus API Service not initialized. Call initAmadeusApi() first.');
    }
    return apiServiceInstance;
}

export default AmadeusApiService;
