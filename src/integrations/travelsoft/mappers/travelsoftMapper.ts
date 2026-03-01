/**
 * Travelsoft NDC - Mapper
 * 
 * Konvertuje NDC 19.2 odgovore u UnifiedFlightOffer format
 * koji koristi ostatak aplikacije (FlightSearch, FlightBooking, itd.)
 */

import type { NDCOffer, NDCItinerary, NDCSegment } from '../types/travelsoftTypes';
import type {
    UnifiedFlightOffer,
    FlightSlice,
    FlightSegment,
    FlightPrice,
    Airport,
    CabinClass
} from '../../../types/flight.types';

// ============================================================================
// MAIN MAPPER
// ============================================================================

/**
 * Konvertuje niz NDC offera u UnifiedFlightOffer[]
 */
export function mapNDCOffersToUnified(
    offers: NDCOffer[],
    shoppingResponseId: string,
    cabinClass: CabinClass = 'economy'
): UnifiedFlightOffer[] {
    return offers
        .map(offer => mapNDCOfferToUnified(offer, shoppingResponseId, cabinClass))
        .filter(Boolean) as UnifiedFlightOffer[];
}

/**
 * Konvertuje jedan NDC offer u UnifiedFlightOffer
 */
export function mapNDCOfferToUnified(
    offer: NDCOffer,
    shoppingResponseId: string,
    cabinClass: CabinClass = 'economy'
): UnifiedFlightOffer | null {
    try {
        const price = mapNDCPrice(offer.TotalPrice);
        const slices = mapNDCItineraries(offer.Itineraries || []);

        // validatingAirlineCodes
        const validatingAirlineCodes = offer.ValidatingCarrier
            ? [offer.ValidatingCarrier]
            : [];

        // bookingToken = JSON encoded session info za kasnije pozive
        const bookingToken = btoa(JSON.stringify({
            offerId: offer.OfferID,
            shoppingResponseId,
            providerRaw: offer
        }));

        return {
            id: offer.OfferID,
            provider: 'travelsoft' as any,
            price,
            slices,
            bookingToken,
            validUntil: new Date(Date.now() + 30 * 60 * 1000).toISOString(), // 30 min
            cabinClass,
            validatingAirlineCodes,
            baggageAllowance: offer.BaggageAllowance ? {
                cabin: offer.BaggageAllowance.CabinBag ? {
                    quantity: offer.BaggageAllowance.CabinBag.Quantity,
                    weight: offer.BaggageAllowance.CabinBag.Weight
                } : undefined,
                checked: offer.BaggageAllowance.CheckedBag ? {
                    quantity: offer.BaggageAllowance.CheckedBag.Quantity,
                    weight: offer.BaggageAllowance.CheckedBag.Weight
                } : undefined
            } : undefined,
            originalData: offer
        };
    } catch (err) {
        console.error('[Travelsoft Mapper] Error mapping offer:', err, offer);
        return null;
    }
}

// ============================================================================
// PRICE MAPPER
// ============================================================================

function mapNDCPrice(ndcPrice: NDCOffer['TotalPrice']): FlightPrice {
    const total = ndcPrice.TotalAmount || 0;
    const base = ndcPrice.BaseAmount || total * 0.8;
    const taxes = ndcPrice.TaxAmount || (total - base);

    return {
        total,
        base,
        taxes,
        currency: ndcPrice.CurrencyCode || 'EUR'
    };
}

// ============================================================================
// ITINERARY MAPPER
// ============================================================================

function mapNDCItineraries(itineraries: NDCItinerary[]): FlightSlice[] {
    return itineraries.map(it => mapNDCItinerary(it)).filter(Boolean) as FlightSlice[];
}

function mapNDCItinerary(it: NDCItinerary): FlightSlice | null {
    if (!it) return null;

    const segments = (it.Segments || []).map(mapNDCSegment).filter(Boolean) as FlightSegment[];
    if (segments.length === 0) return null;

    const firstSeg = segments[0];
    const lastSeg = segments[segments.length - 1];

    const departureIso = buildISODateTime(it.Departure?.Date, it.Departure?.Time) || firstSeg.departure;
    const arrivalIso = buildISODateTime(it.Arrival?.Date, it.Arrival?.Time) || lastSeg.arrival;

    const durationMinutes = it.Duration ||
        (new Date(arrivalIso).getTime() - new Date(departureIso).getTime()) / 60000;

    return {
        origin: buildAirport(it.Departure),
        destination: buildAirport(it.Arrival),
        departure: departureIso,
        arrival: arrivalIso,
        duration: Math.round(durationMinutes),
        stops: it.Stops ?? Math.max(0, segments.length - 1),
        segments
    };
}

// ============================================================================
// SEGMENT MAPPER
// ============================================================================

function mapNDCSegment(seg: NDCSegment): FlightSegment | null {
    if (!seg) return null;

    const carrierCode = seg.MarketingCarrier?.AirlineID || 'XX';
    const carrierName = seg.MarketingCarrier?.Name || getAirlineName(carrierCode);
    const flightNumber = `${carrierCode}${seg.MarketingCarrier?.FlightNumber || ''}`;

    const departureIso = buildISODateTime(seg.Departure?.Date, seg.Departure?.Time) || new Date().toISOString();
    const arrivalIso = buildISODateTime(seg.Arrival?.Date, seg.Arrival?.Time) || new Date().toISOString();

    const durationMinutes = seg.Duration ||
        Math.round((new Date(arrivalIso).getTime() - new Date(departureIso).getTime()) / 60000);

    return {
        carrierCode,
        carrierName,
        flightNumber,
        aircraft: seg.Equipment?.Name || seg.Equipment?.AircraftCode,
        origin: {
            iataCode: seg.Departure?.AirportCode || '',
            name: seg.Departure?.AirportName || seg.Departure?.AirportCode || '',
            city: seg.Departure?.AirportCode || '',
            country: '',
            terminal: seg.Departure?.Terminal
        },
        destination: {
            iataCode: seg.Arrival?.AirportCode || '',
            name: seg.Arrival?.AirportName || seg.Arrival?.AirportCode || '',
            city: seg.Arrival?.AirportCode || '',
            country: '',
            terminal: seg.Arrival?.Terminal
        },
        departure: departureIso,
        arrival: arrivalIso,
        duration: durationMinutes,
        operatingCarrier: seg.OperatingCarrier?.AirlineID,
        cabinClass: mapCabinCode(seg.CabinType?.Code),
        bookingClass: seg.ClassOfService
    };
}

// ============================================================================
// UTILS
// ============================================================================

function buildAirport(loc: any): Airport {
    return {
        iataCode: loc?.AirportCode || '',
        name: loc?.AirportName || loc?.AirportCode || '',
        city: loc?.CityName || loc?.AirportCode || '',
        country: '',
        terminal: loc?.Terminal
    };
}

function buildISODateTime(date?: string, time?: string): string {
    if (!date) return new Date().toISOString();
    if (!time) return `${date}T00:00:00`;
    // date: YYYY-MM-DD, time: HH:MM or HH:MM:SS
    const t = time.length === 5 ? `${time}:00` : time;
    return `${date}T${t}`;
}

function mapCabinCode(code?: string): CabinClass {
    const map: Record<string, CabinClass> = {
        'ECONOMY': 'economy',
        'Y': 'economy',
        'PREMIUM_ECONOMY': 'premium_economy',
        'W': 'premium_economy',
        'BUSINESS': 'business',
        'C': 'business',
        'J': 'business',
        'FIRST': 'first',
        'F': 'first'
    };
    return map[code?.toUpperCase() || ''] || 'economy';
}

// Mapa poznatih IATA kodova na nazive avio-kompanija
function getAirlineName(code: string): string {
    const airlines: Record<string, string> = {
        'JU': 'Air Serbia',
        'AF': 'Air France',
        'KL': 'KLM',
        'LH': 'Lufthansa',
        'BA': 'British Airways',
        'TK': 'Turkish Airlines',
        'QR': 'Qatar Airways',
        'EK': 'Emirates',
        'W6': 'Wizz Air',
        'FR': 'Ryanair',
        'VY': 'Vueling',
        'U2': 'easyJet',
        'OS': 'Austrian Airlines',
        'SN': 'Brussels Airlines',
        'AZ': 'ITA Airways',
        'OU': 'Croatia Airlines',
        'JP': 'Adria Airways',
        'DT': 'TAAG Angola Airlines'
    };
    return airlines[code] || code;
}
