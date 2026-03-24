import type { 
    UnifiedFlightOffer, 
    FlightSlice, 
    FlightSegment as ServiceSegment 
} from '../../../types/flight.types';
import type { 
    FlightSearchResult, 
    FlightLeg, 
    FlightSegment as UISegment 
} from '../types';

/**
 * Maps a single flight segment from service to UI format
 */
const mapSegment = (seg: ServiceSegment): UISegment => {
    return {
        origin: seg.origin.iataCode,
        destination: seg.destination.iataCode,
        departTime: seg.departure,
        arriveTime: seg.arrival,
        duration: seg.duration,
        flightNo: seg.flightNumber,
        aircraft: seg.aircraft,
        operatedBy: seg.operatingCarrier,
        originCity: seg.origin.city,
        originAirport: seg.origin.name,
        destinationCity: seg.destination.city,
        destinationAirport: seg.destination.name
    };
};

/**
 * Maps a flight slice (outbound or return) from service to UI format
 */
const mapLeg = (slice: FlightSlice, direction: 'outbound' | 'return'): FlightLeg => {
    return {
        id: `leg-${direction}-${Date.now()}-${Math.random()}`,
        direction,
        segments: slice.segments.map(mapSegment),
        totalDuration: slice.duration,
        stops: slice.segments.length - 1,
        stopoverAirports: slice.segments.slice(0, -1).map(s => s.destination.iataCode),
        price: 0, // Will be filled by the result object
        pricePerPerson: 0,
        currency: '',
        status: 'instant',
        isRefundable: true,
        baggageIncluded: true,
        checkedBagIncluded: true,
        provider: 'aggregator'
    };
};

/**
 * Maps a UnifiedFlightOffer from the aggregator service to the UI FlightSearchResult
 */
export const mapServiceOfferToUI = (offer: UnifiedFlightOffer): FlightSearchResult => {
    const outboundSlice = offer.slices[0];
    const inboundSlice = offer.slices[1];

    const outbound = mapLeg(outboundSlice, 'outbound');
    outbound.price = offer.price.total;
    outbound.currency = offer.price.currency;
    outbound.pricePerPerson = offer.price.total; // Defaulting if perPassenger is missing
    outbound.provider = offer.provider;

    let inbound: FlightLeg | undefined = undefined;
    if (inboundSlice) {
        inbound = mapLeg(inboundSlice, 'return');
        inbound.price = 0; // Price is usually total for the offer
        inbound.currency = offer.price.currency;
        inbound.provider = offer.provider;
    }

    return {
        id: offer.id,
        outbound,
        inbound,
        totalPrice: offer.price.total,
        currency: offer.price.currency,
        airline: outboundSlice.segments[0].carrierName,
        airlineLogo: outboundSlice.segments[0].carrierCode, // Can be used for logo mapping
        isPrime: offer.provider === 'Kyte' || offer.provider === 'travelsoft',
        priority: 10
    };
};

/**
 * Maps a full Service Search Response to UI Search Results
 */
export const mapFlightResults = (offers: UnifiedFlightOffer[]): FlightSearchResult[] => {
    return offers.map(mapServiceOfferToUI);
};
