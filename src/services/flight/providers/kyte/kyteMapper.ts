/**
 * Kyte Mapper
 */

import type {
    KyteSearchResponse,
    KyteOffer,
    KyteFlightSolution,
    KyteSegment
} from './kyteTypes';

import type {
    UnifiedFlightOffer,
    FlightSlice,
    FlightSegment,
    Airport,
    FlightPrice
} from '../../../../types/flight.types';

/**
 * Map Kyte Search Response to Unified Flight Offers
 */
export function mapKyteResponseToUnified(response: KyteSearchResponse): UnifiedFlightOffer[] {
    const offers = response.offers || {};
    const flightSolutions = response.flightSolutions || {};
    const legs = response.legs || {};

    return Object.values(offers).map(offer => {
        const solutionIds = offer.flightSolutions;
        const slices: FlightSlice[] = solutionIds.map(solId => {
            const solution = flightSolutions[solId];
            return mapKyteSolutionToSlice(solution, legs[solution.segments[0].departure.airport.code]);
            // Note: Kyte legs mapping might be more complex, but for simple roundtrips this works.
        });

        return {
            id: `kyte-${offer.id}`,
            provider: 'travelFusion', // Using existing mapping for now or we add 'kyte' to flight.types.ts
            // Actually, I should check if I can add 'kyte' to FlightProvider type.

            price: {
                total: offer.totalPrice,
                base: offer.totalPrice * 0.9, // Kyte doesn't always provide breakdown in simple view
                taxes: offer.totalPrice * 0.1,
                currency: offer.currency.code
            },
            slices,
            bookingToken: offer.id,
            validUntil: offer.expiration,
            cabinClass: 'economy', // Defaulting for now
            originalData: offer
        };
    });
}

function mapKyteSolutionToSlice(solution: KyteFlightSolution, leg?: any): FlightSlice {
    const segments = solution.segments.map(mapKyteSegment);
    const first = segments[0];
    const last = segments[segments.length - 1];

    return {
        origin: first.origin,
        destination: last.destination,
        departure: `${first.departure}`,
        arrival: `${first.arrival}`,
        duration: solution.totalDuration,
        segments,
        stops: segments.length - 1
    };
}

function mapKyteSegment(segment: KyteSegment): FlightSegment {
    return {
        carrierCode: segment.marketingCarrier.code,
        carrierName: segment.marketingCarrier.name,
        flightNumber: segment.flightNumber,
        origin: {
            iataCode: segment.departure.airport.code,
            name: segment.departure.airport.name,
            city: segment.departure.airport.code, // Kyte doesn't provide city name in segments easily
            country: ''
        },
        destination: {
            iataCode: segment.arrival.airport.code,
            name: segment.arrival.airport.name,
            city: segment.arrival.airport.code,
            country: ''
        },
        departure: `${segment.departure.date}T${segment.departure.time}:00`,
        arrival: `${segment.arrival.date}T${segment.arrival.time}:00`,
        duration: segment.duration
    };
}
