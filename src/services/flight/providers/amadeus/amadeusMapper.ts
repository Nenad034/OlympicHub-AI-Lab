/**
 * Amadeus Mapper
 * 
 * Maps Amadeus API responses to Unified Flight Model (UFM)
 */

import type {
    AmadeusFlightOffer,
    AmadeusItinerary,
    AmadeusSegment,
    AmadeusLocation
} from './amadeusTypes';

import type {
    UnifiedFlightOffer,
    FlightSlice,
    FlightSegment,
    Airport,
    FlightPrice
} from '../../../../types/flight.types';

/**
 * Map Amadeus Flight Offer to Unified Flight Offer
 */
export function mapAmadeusOfferToUnified(
    amadeusOffer: AmadeusFlightOffer,
    dictionaries?: {
        locations?: Record<string, AmadeusLocation>;
        carriers?: Record<string, string>;
        aircraft?: Record<string, string>;
    }
): UnifiedFlightOffer {
    return {
        id: `amadeus-${amadeusOffer.id}`,
        provider: 'amadeus',

        price: mapAmadeusPrice(amadeusOffer.price),

        slices: amadeusOffer.itineraries.map(itinerary =>
            mapAmadeusItinerary(itinerary, dictionaries)
        ),

        bookingToken: amadeusOffer.id,
        validUntil: amadeusOffer.lastTicketingDate,
        cabinClass: determineCabinClass(amadeusOffer),

        baggageAllowance: extractBaggageAllowance(amadeusOffer),
        amenities: extractAmenities(amadeusOffer),

        originalData: amadeusOffer
    };
}

/**
 * Map Amadeus Price to Unified Price
 */
function mapAmadeusPrice(amadeusPrice: any): FlightPrice {
    const total = parseFloat(amadeusPrice.total || amadeusPrice.grandTotal);
    const base = parseFloat(amadeusPrice.base);
    const taxes = total - base;

    return {
        total,
        base,
        taxes,
        currency: amadeusPrice.currency
    };
}

/**
 * Map Amadeus Itinerary to Flight Slice
 */
function mapAmadeusItinerary(
    itinerary: AmadeusItinerary,
    dictionaries?: {
        locations?: Record<string, AmadeusLocation>;
        carriers?: Record<string, string>;
        aircraft?: Record<string, string>;
    }
): FlightSlice {
    const segments = itinerary.segments.map(seg =>
        mapAmadeusSegment(seg, dictionaries)
    );

    const firstSegment = segments[0];
    const lastSegment = segments[segments.length - 1];

    return {
        origin: firstSegment.origin,
        destination: lastSegment.destination,
        departure: firstSegment.departure,
        arrival: lastSegment.arrival,
        duration: parseDuration(itinerary.duration),
        segments,
        stops: segments.length - 1,
        overnight: checkOvernight(firstSegment.departure, lastSegment.arrival)
    };
}

/**
 * Map Amadeus Segment to Flight Segment
 */
function mapAmadeusSegment(
    segment: AmadeusSegment,
    dictionaries?: {
        locations?: Record<string, AmadeusLocation>;
        carriers?: Record<string, string>;
        aircraft?: Record<string, string>;
    }
): FlightSegment {
    const carrierName = dictionaries?.carriers?.[segment.carrierCode] || segment.carrierCode;
    const aircraftName = dictionaries?.aircraft?.[segment.aircraft.code] || segment.aircraft.code;

    return {
        carrierCode: segment.carrierCode,
        carrierName,
        flightNumber: `${segment.carrierCode}${segment.number}`,
        aircraft: aircraftName,

        origin: mapAmadeusAirport(segment.departure.iataCode, dictionaries),
        destination: mapAmadeusAirport(segment.arrival.iataCode, dictionaries),

        departure: segment.departure.at,
        arrival: segment.arrival.at,
        duration: parseDuration(segment.duration),

        operatingCarrier: segment.operating?.carrierCode,
        cabinClass: undefined // Will be set from fare details if available
    };
}

/**
 * Map Amadeus Airport to Unified Airport
 */
function mapAmadeusAirport(
    iataCode: string,
    dictionaries?: {
        locations?: Record<string, AmadeusLocation>;
    }
): Airport {
    const location = dictionaries?.locations?.[iataCode];

    return {
        iataCode,
        name: `${iataCode} Airport`, // Amadeus doesn't provide full names in search
        city: location?.cityCode || iataCode,
        country: location?.countryCode || 'Unknown',
        countryCode: location?.countryCode
    };
}

/**
 * Parse ISO 8601 duration to minutes
 * Example: "PT2H30M" -> 150
 */
function parseDuration(isoDuration: string): number {
    const regex = /PT(?:(\d+)H)?(?:(\d+)M)?/;
    const match = isoDuration.match(regex);

    if (!match) return 0;

    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');

    return hours * 60 + minutes;
}

/**
 * Check if flight includes overnight stay
 */
function checkOvernight(departure: string, arrival: string): boolean {
    const depDate = new Date(departure);
    const arrDate = new Date(arrival);

    return depDate.getDate() !== arrDate.getDate();
}

/**
 * Determine cabin class from Amadeus offer
 */
function determineCabinClass(offer: AmadeusFlightOffer): 'economy' | 'premium_economy' | 'business' | 'first' {
    // Check first traveler's first segment cabin
    const firstTraveler = offer.travelerPricings?.[0];
    const firstSegment = firstTraveler?.fareDetailsBySegment?.[0];

    if (!firstSegment) return 'economy';

    const cabin = firstSegment.cabin.toUpperCase();

    if (cabin.includes('FIRST')) return 'first';
    if (cabin.includes('BUSINESS')) return 'business';
    if (cabin.includes('PREMIUM')) return 'premium_economy';

    return 'economy';
}

/**
 * Extract baggage allowance from Amadeus offer
 */
function extractBaggageAllowance(offer: AmadeusFlightOffer) {
    const firstTraveler = offer.travelerPricings?.[0];
    const firstSegment = firstTraveler?.fareDetailsBySegment?.[0];

    if (!firstSegment?.includedCheckedBags) return undefined;

    const bags = firstSegment.includedCheckedBags;

    return {
        checked: {
            quantity: bags.quantity || 0,
            weight: bags.weight
        }
    };
}

/**
 * Extract amenities from Amadeus offer
 */
function extractAmenities(offer: AmadeusFlightOffer): string[] {
    const amenities: string[] = [];

    // Check if instant ticketing is available
    if (offer.instantTicketingRequired) {
        amenities.push('Instant ticketing');
    }

    // Check fare type
    const fareType = offer.pricingOptions?.fareType?.[0];
    if (fareType) {
        amenities.push(`Fare: ${fareType}`);
    }

    return amenities;
}

/**
 * Map multiple Amadeus offers to Unified offers
 */
export function mapAmadeusOffersToUnified(
    amadeusOffers: AmadeusFlightOffer[],
    dictionaries?: {
        locations?: Record<string, AmadeusLocation>;
        carriers?: Record<string, string>;
        aircraft?: Record<string, string>;
    }
): UnifiedFlightOffer[] {
    return amadeusOffers.map(offer =>
        mapAmadeusOfferToUnified(offer, dictionaries)
    );
}
