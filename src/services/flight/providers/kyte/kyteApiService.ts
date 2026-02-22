/**
 * Kyte API Service
 */

import type {
    KyteConfig,
    KyteSearchRequest,
    KyteSearchResponse,
    KyteOrderRequest,
    KyteOrderResponse
} from './kyteTypes';

import { mapKyteResponseToUnified } from './kyteMapper';

import type {
    FlightSearchParams,
    UnifiedFlightOffer,
    FlightBookingRequest,
    FlightBookingResponse
} from '../../../../types/flight.types';

class KyteApiService {
    private config: KyteConfig;

    constructor(config: KyteConfig) {
        this.config = config;
    }

    async searchFlights(params: FlightSearchParams): Promise<UnifiedFlightOffer[]> {
        console.log('[Kyte] Searching flights:', params);

        const journeys = [
            {
                departureAirport: params.origin,
                arrivalAirport: params.destination,
                date: {
                    main: params.departureDate,
                    type: 'departure' as const
                }
            }
        ];

        // Add return journey if applicable
        if (params.returnDate) {
            journeys.push({
                departureAirport: params.destination,
                arrivalAirport: params.origin,
                date: {
                    main: params.returnDate,
                    type: 'departure' as const
                }
            });
        }

        const passengers = [];
        for (let i = 0; i < params.adults; i++) passengers.push({ age: 30 });
        for (let i = 0; i < (params.children || 0); i++) passengers.push({ age: 10 });
        for (let i = 0; i < (params.infants || 0); i++) passengers.push({ age: 1 });

        const request: KyteSearchRequest = {
            journeys,
            passengers,
            cabinType: this.mapCabinClass(params.cabinClass),
            exactMatch: true,
            splitOffer: true,
            miniFareRule: true
        };

        const response = await fetch(`${this.config.baseUrl}/api/v3/flights/shop`, {
            method: 'POST',
            headers: {
                'x-api-key': this.config.apiKey,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(request)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Kyte API Error (${response.status}): ${errorText}`);
        }

        const data: KyteSearchResponse = await response.json();
        return mapKyteResponseToUnified(data);
    }

    /**
     * Create a booking order in Kyte
     */
    async createOrder(request: FlightBookingRequest): Promise<FlightBookingResponse> {
        console.log('[Kyte] Creating order:', request);

        const kyteRequest: KyteOrderRequest = {
            offerId: request.bookingToken,
            passengers: request.passengers.map((p, idx) => ({
                id: `PAX${idx + 1}`,
                type: (p.type === 'adult' ? 'adult' : 'child') as 'adult' | 'child',
                name: {
                    firstName: p.firstName,
                    lastName: p.lastName,
                    title: p.title?.toUpperCase() || 'MR'
                },
                gender: p.gender === 'M' ? 'male' : 'female',
                dateOfBirth: p.dateOfBirth
            })),
            contactPoint: {
                email: request.passengers[0].email || 'noreply@olympictravel.rs',
                phone: {
                    number: request.passengers[0].phone?.replace(/\s/g, '') || '0000000',
                    countryCode: '381'
                }
            }
        };

        const response = await fetch(`${this.config.baseUrl}/air/orders`, {
            method: 'POST',
            headers: {
                'x-api-key': this.config.apiKey,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(kyteRequest)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Kyte Booking Error: ${errorData.message || response.statusText}`);
        }

        const data: KyteOrderResponse = await response.json();

        return {
            success: true,
            status: data.status === 'confirmed' ? 'confirmed' : 'pending',
            bookingReference: data.id,
            pnr: data.pnr,
            providerBookingId: data.id,
            totalPrice: {
                total: data.totalPrice,
                base: data.totalPrice * 0.9,
                taxes: data.totalPrice * 0.1,
                currency: data.currency
            },
            bookedAt: new Date().toISOString(),
            originalData: data
        };
    }


    private mapCabinClass(cabinClass?: string): any {
        if (!cabinClass) return 'economy';
        const mapping: Record<string, string> = {
            'ECONOMY': 'economy',
            'PREMIUM_ECONOMY': 'premium_economy',
            'BUSINESS': 'business',
            'FIRST': 'first'
        };
        return mapping[cabinClass] || 'economy';
    }
}

let instance: KyteApiService | null = null;

export function initKyteApi(config: KyteConfig): KyteApiService {
    instance = new KyteApiService(config);
    return instance;
}

export function getKyteApi(): KyteApiService {
    if (!instance) {
        const apiKey = import.meta.env.VITE_KYTE_API_KEY;
        const baseUrl = import.meta.env.VITE_KYTE_BASE_URL || 'https://api.sandbox.gokyte.com';

        if (!apiKey) {
            throw new Error('Kyte API Key not found in Environment');
        }

        instance = new KyteApiService({ apiKey, baseUrl });
    }
    return instance;
}

export default KyteApiService;
