/**
 * Flight Mock Service
 * 
 * Mock implementacija Flight API-ja za razvoj i testiranje
 * Simulira ponašanje realnih provajdera (Amadeus, Kiwi, Duffel)
 */

import type {
    FlightSearchParams,
    FlightSearchResponse,
    UnifiedFlightOffer,
    FlightValidationRequest,
    FlightValidationResponse,
    FlightBookingRequest,
    FlightBookingResponse,
    FlightProvider
} from '../types/flight.types';

/**
 * Mock Flight Service
 */
export const flightMockService = {
    /**
     * Simulira pretragu letova
     */
    async searchFlights(params: FlightSearchParams): Promise<FlightSearchResponse> {
        console.log('🔍 Mock Flight Search:', params);

        // Simuliraj network delay (1-2 sekunde)
        await delay(1500);

        const offers = generateMockOffers(params);

        return {
            success: true,
            offers,
            searchId: `mock-search-${Date.now()}`,
            totalResults: offers.length,
            providers: [
                {
                    provider: 'amadeus',
                    status: 'complete',
                    resultCount: Math.floor(offers.length / 3),
                    error: undefined
                },
                {
                    provider: 'kiwi',
                    status: 'complete',
                    resultCount: Math.floor(offers.length / 3),
                    error: undefined
                },
                {
                    provider: 'duffel',
                    status: 'complete',
                    resultCount: Math.floor(offers.length / 3),
                    error: undefined
                }
            ],
            searchTime: 1500,
            timestamp: new Date().toISOString()
        };
    },

    /**
     * Simulira validaciju ponude pre rezervacije
     */
    async validateOffer(request: FlightValidationRequest): Promise<FlightValidationResponse> {
        console.log('✅ Mock Flight Validation:', request);

        await delay(500);

        // 90% šanse da je validna, 10% da se promenila cena
        const priceChanged = Math.random() < 0.1;

        return {
            valid: true,
            priceChanged,
            newPrice: priceChanged ? {
                total: 385.00,
                base: 310.00,
                taxes: 75.00,
                currency: 'EUR'
            } : undefined,
            available: true,
            seatsRemaining: Math.floor(Math.random() * 9) + 1,
            message: priceChanged ? 'Cena se promenila od poslednje pretrage' : 'Ponuda je i dalje validna',
            warnings: priceChanged ? ['Cena je povećana za 10%'] : [],
            validatedAt: new Date().toISOString()
        };
    },

    /**
     * Simulira kreiranje rezervacije
     */
    async bookFlight(request: FlightBookingRequest): Promise<FlightBookingResponse> {
        console.log('📝 Mock Flight Booking:', request);

        // Simuliraj duži proces rezervacije (2-3 sekunde)
        await delay(2500);

        // 95% šanse za uspeh, 5% za failure
        const success = Math.random() < 0.95;

        if (!success) {
            return {
                success: false,
                status: 'failed',
                message: 'Rezervacija nije uspela. Molimo pokušajte ponovo.',
                errors: ['Sedišta više nisu dostupna', 'Molimo pokušajte drugu ponudu']
            };
        }

        return {
            success: true,
            status: 'confirmed',
            bookingReference: `MOCK${generateRandomString(6)}`,
            pnr: generateRandomString(6).toUpperCase(),
            providerBookingId: `${request.provider}-${Date.now()}`,
            totalPrice: {
                total: 350.00,
                base: 280.00,
                taxes: 70.00,
                currency: 'EUR'
            },
            ticketNumbers: request.passengers.map(() => `157-${generateRandomString(10)}`),
            message: 'Rezervacija uspešno kreirana!',
            bookedAt: new Date().toISOString()
        };
    }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Generiše mock ponude na osnovu search parametara
 */
function generateMockOffers(params: FlightSearchParams): UnifiedFlightOffer[] {
    const offers: UnifiedFlightOffer[] = [];
    const providers: FlightProvider[] = ['amadeus', 'kiwi', 'duffel'];

    // Generiši 9-15 ponuda
    const offerCount = Math.floor(Math.random() * 7) + 9;

    for (let i = 0; i < offerCount; i++) {
        const provider = providers[i % providers.length];
        const isDirectFlight = Math.random() < 0.4; // 40% direktni letovi

        offers.push({
            id: `mock-${provider}-${i}-${Date.now()}`,
            provider,
            price: generateMockPrice(),
            slices: generateMockSlices(params, isDirectFlight),
            bookingToken: `MOCK_TOKEN_${generateRandomString(20)}`,
            validUntil: new Date(Date.now() + 30 * 60000).toISOString(), // 30 minuta
            cabinClass: params.cabinClass || 'economy',
            baggageAllowance: {
                cabin: {
                    quantity: 1,
                    weight: 8,
                    dimensions: '55x40x20cm'
                },
                checked: {
                    quantity: 1,
                    weight: 23
                }
            },
            amenities: generateMockAmenities(),
            originalData: {}
        });
    }

    // Sortiraj po ceni
    return offers.sort((a, b) => a.price.total - b.price.total);
}

/**
 * Generiše mock cenu
 */
function generateMockPrice() {
    const base = Math.floor(Math.random() * 400) + 150; // 150-550 EUR
    const taxes = Math.floor(base * 0.25); // ~25% takse

    return {
        total: base + taxes,
        base,
        taxes,
        currency: 'EUR'
    };
}

/**
 * Generiše mock slices (delove putovanja)
 */
function generateMockSlices(params: FlightSearchParams, isDirectFlight: boolean) {
    const slices = [];

    // Odlazak
    slices.push(generateMockSlice(
        params.origin,
        params.destination,
        params.departureDate,
        isDirectFlight
    ));

    // Povratak (ako postoji)
    if (params.returnDate) {
        slices.push(generateMockSlice(
            params.destination,
            params.origin,
            params.returnDate,
            isDirectFlight
        ));
    }

    return slices;
}

/**
 * Generiše jedan mock slice
 */
function generateMockSlice(origin: string, destination: string, date: string, isDirect: boolean) {
    const carriers = [
        { code: 'JU', name: 'Air Serbia' },
        { code: 'AF', name: 'Air France' },
        { code: 'LH', name: 'Lufthansa' },
        { code: 'TK', name: 'Turkish Airlines' },
        { code: 'OS', name: 'Austrian Airlines' },
        { code: 'LX', name: 'Swiss International' }
    ];

    const carrier = carriers[Math.floor(Math.random() * carriers.length)];
    const departureHour = Math.floor(Math.random() * 16) + 6; // 6-22h
    const flightDuration = isDirect ? 120 : 180; // 2h ili 3h

    const departureTime = new Date(`${date}T${String(departureHour).padStart(2, '0')}:00:00`);
    const arrivalTime = new Date(departureTime.getTime() + flightDuration * 60000);

    const segments = [];

    if (isDirect) {
        // Direktan let
        segments.push({
            carrierCode: carrier.code,
            carrierName: carrier.name,
            flightNumber: `${carrier.code}${Math.floor(Math.random() * 9000) + 1000}`,
            aircraft: 'A320',
            origin: getMockAirport(origin),
            destination: getMockAirport(destination),
            departure: departureTime.toISOString(),
            arrival: arrivalTime.toISOString(),
            duration: flightDuration,
            cabinClass: 'economy' as const
        });
    } else {
        // Let sa presedanjem
        const stopoverAirports = ['VIE', 'FRA', 'MUC', 'ZRH', 'IST'];
        const stopover = stopoverAirports[Math.floor(Math.random() * stopoverAirports.length)];

        const firstLegDuration = 90;
        const layoverDuration = 60;
        const secondLegDuration = 90;

        const stopoverArrival = new Date(departureTime.getTime() + firstLegDuration * 60000);
        const stopoverDeparture = new Date(stopoverArrival.getTime() + layoverDuration * 60000);
        const finalArrival = new Date(stopoverDeparture.getTime() + secondLegDuration * 60000);

        segments.push({
            carrierCode: carrier.code,
            carrierName: carrier.name,
            flightNumber: `${carrier.code}${Math.floor(Math.random() * 9000) + 1000}`,
            aircraft: 'A320',
            origin: getMockAirport(origin),
            destination: getMockAirport(stopover),
            departure: departureTime.toISOString(),
            arrival: stopoverArrival.toISOString(),
            duration: firstLegDuration,
            cabinClass: 'economy' as const
        });

        segments.push({
            carrierCode: carrier.code,
            carrierName: carrier.name,
            flightNumber: `${carrier.code}${Math.floor(Math.random() * 9000) + 1000}`,
            aircraft: 'A321',
            origin: getMockAirport(stopover),
            destination: getMockAirport(destination),
            departure: stopoverDeparture.toISOString(),
            arrival: finalArrival.toISOString(),
            duration: secondLegDuration,
            cabinClass: 'economy' as const
        });
    }

    return {
        origin: getMockAirport(origin),
        destination: getMockAirport(destination),
        departure: departureTime.toISOString(),
        arrival: segments[segments.length - 1].arrival,
        duration: segments.reduce((sum, seg) => sum + seg.duration, 0),
        segments,
        stops: segments.length - 1,
        overnight: false
    };
}

/**
 * Mock airport data
 */
function getMockAirport(iataCode: string) {
    const airports: Record<string, any> = {
        BEG: { iataCode: 'BEG', name: 'Belgrade Nikola Tesla Airport', city: 'Belgrade', country: 'Serbia', countryCode: 'RS' },
        CDG: { iataCode: 'CDG', name: 'Charles de Gaulle Airport', city: 'Paris', country: 'France', countryCode: 'FR' },
        LHR: { iataCode: 'LHR', name: 'London Heathrow Airport', city: 'London', country: 'United Kingdom', countryCode: 'GB' },
        JFK: { iataCode: 'JFK', name: 'John F. Kennedy International Airport', city: 'New York', country: 'United States', countryCode: 'US' },
        FRA: { iataCode: 'FRA', name: 'Frankfurt Airport', city: 'Frankfurt', country: 'Germany', countryCode: 'DE' },
        VIE: { iataCode: 'VIE', name: 'Vienna International Airport', city: 'Vienna', country: 'Austria', countryCode: 'AT' },
        MUC: { iataCode: 'MUC', name: 'Munich Airport', city: 'Munich', country: 'Germany', countryCode: 'DE' },
        ZRH: { iataCode: 'ZRH', name: 'Zurich Airport', city: 'Zurich', country: 'Switzerland', countryCode: 'CH' },
        IST: { iataCode: 'IST', name: 'Istanbul Airport', city: 'Istanbul', country: 'Turkey', countryCode: 'TR' },
        AMS: { iataCode: 'AMS', name: 'Amsterdam Schiphol Airport', city: 'Amsterdam', country: 'Netherlands', countryCode: 'NL' }
    };

    return airports[iataCode] || {
        iataCode,
        name: `${iataCode} Airport`,
        city: iataCode,
        country: 'Unknown',
        countryCode: 'XX'
    };
}

/**
 * Generiše mock amenities
 */
function generateMockAmenities(): string[] {
    const allAmenities = [
        'Wi-Fi',
        'In-flight entertainment',
        'Power outlets',
        'USB charging',
        'Complimentary snacks',
        'Complimentary beverages',
        'Extra legroom',
        'Priority boarding'
    ];

    const count = Math.floor(Math.random() * 4) + 2; // 2-5 amenities
    return allAmenities.slice(0, count);
}

/**
 * Generiše random string
 */
function generateRandomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

/**
 * Delay helper
 */
function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export default flightMockService;
