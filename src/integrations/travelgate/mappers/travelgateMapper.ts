// =============================================================================
// Travelgate Hotel-X → Unified Hotel Types Mapper
// =============================================================================

import type {
    TravelgateOption,
    TravelgateOptionQuote,
    TravelgateBooking,
    TravelgatePrice,
    TravelgateCancelPolicy,
    TravelgateCancelPenalty,
} from '../types/travelgateTypes';

import type {
    HotelSearchResult,
    RoomOption,
} from '../../../services/providers/HotelProviderInterface';

// ─── Extended result type with Travelgate extras ──────────────────────────────

export interface TravelgateMappedResult extends HotelSearchResult {
    originalData: {
        optionRefId: string;
        supplierCode: string;
        accessCode: string;
        boardCode: string;
        boardName?: string;
        paymentType: string;
        status: string;
        rateRules: string[];
        refundable: boolean;
        cancelPolicy: any;
        cancelPolicySummary: string;
        surcharges: any[];
        market: string;
        remarks?: string;
        _raw: TravelgateOption;
    };
}

// ─── Option → HotelSearchResult ───────────────────────────────────────────────

export function mapTravelgateOptionToHotelResult(
    option: TravelgateOption,
    searchCheckIn: string,
    searchCheckOut: string
): TravelgateMappedResult {
    const priceValue = option.price?.net ?? option.price?.gross ?? 0;
    const nights = calcNights(searchCheckIn, searchCheckOut);
    const refundable = option.cancelPolicy?.refundable ?? true;
    const cancelPolicySummary = buildCancelSummary(option.cancelPolicy, option.price.currency);

    return {
        // ── HotelSearchResult required fields ──
        id: `travelgate-${option.id}`,
        providerName: 'Travelgate',
        hotelName: option.hotelName || option.hotelCode,
        location: option.market || '',
        price: priceValue,
        currency: option.price.currency,
        stars: 0,
        mealPlan: option.boardName || option.boardCode || '',
        mealPlans: [option.boardName || option.boardCode || ''],
        availability: option.status === 'OK' ? 'available' : 'on_request',
        checkIn: new Date(searchCheckIn),
        checkOut: new Date(searchCheckOut),
        nights,
        rooms: (option.rooms || []).map((room): RoomOption => ({
            id: room.code,
            name: room.description || room.code,
            description: room.description,
            price: priceValue,
            availability: 'available',
            capacity: room.occupancyRefId,
            tariff: { optionRefId: option.id, room },
        })),

        // ── Travelgate extras ──
        originalData: {
            optionRefId: option.id,
            supplierCode: option.supplierCode,
            accessCode: option.accessCode,
            boardCode: option.boardCode,
            boardName: option.boardName,
            paymentType: option.paymentType,
            status: option.status,
            rateRules: option.rateRules || [],
            refundable,
            cancelPolicy: mapCancelPolicy(option.cancelPolicy),
            cancelPolicySummary,
            surcharges: (option.surcharges || []).map(s => ({
                type: s.chargeType || 'UNKNOWN',
                mandatory: s.mandatory ?? false,
                description: s.description || '',
                amount: s.price?.net ?? s.price?.gross ?? 0,
                currency: s.price.currency,
            })),
            market: option.market,
            remarks: option.remarks,
            _raw: option,
        },
    };
}

// ─── Quote → updated result ───────────────────────────────────────────────────

export function mapTravelgateQuoteToResult(
    quote: TravelgateOptionQuote,
    original: TravelgateMappedResult
): TravelgateMappedResult {
    const priceValue = quote.price?.net ?? quote.price?.gross ?? original.price;
    return {
        ...original,
        price: priceValue,
        currency: quote.price.currency,
        originalData: {
            ...original.originalData,
            optionRefId: quote.optionRefId,
            status: quote.status,
            refundable: quote.cancelPolicy?.refundable ?? original.originalData.refundable,
            cancelPolicy: mapCancelPolicy(quote.cancelPolicy),
            cancelPolicySummary: buildCancelSummary(quote.cancelPolicy, quote.price.currency),
            remarks: quote.remarks || original.originalData.remarks,
        },
    };
}

// ─── Booking result ───────────────────────────────────────────────────────────

export function mapTravelgateBookingToResult(booking: TravelgateBooking) {
    return {
        provider: 'travelgate',
        bookingId: booking.id,
        clientReference: booking.clientReference,
        supplierReference: booking.supplierReference,
        status: booking.status,
        price: booking.price ? (booking.price.net ?? booking.price.gross ?? 0) : 0,
        currency: booking.price?.currency || 'EUR',
        refundable: booking.cancelPolicy?.refundable ?? true,
        cancelPolicy: mapCancelPolicy(booking.cancelPolicy),
        hotel: booking.hotel,
        holder: booking.holder,
        payable: booking.payable,
    };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcNights(checkIn: string, checkOut: string): number {
    try {
        const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
        return Math.max(1, Math.round(diff / (1000 * 60 * 60 * 24)));
    } catch {
        return 1;
    }
}

function extractPriceValue(price?: TravelgatePrice | null): number {
    return price?.net ?? price?.gross ?? 0;
}

function mapCancelPolicy(policy?: TravelgateCancelPolicy | null) {
    if (!policy) return null;
    return {
        refundable: policy.refundable,
        penalties: (policy.cancelPenalties || []).map((p: TravelgateCancelPenalty) => ({
            hoursBefore: p.hoursBefore,
            type: p.penaltyType,
            currency: p.currency,
            value: p.value,
            deadline: p.deadline,
        })),
    };
}

function buildCancelSummary(
    policy?: TravelgateCancelPolicy | null,
    currency?: string
): string {
    if (!policy) return 'Storno politika nepoznata';
    if (!policy.refundable) return '🚫 Nerefundabilno';
    if (!policy.cancelPenalties?.length) return '✅ Besplatno otkazivanje';

    const first = policy.cancelPenalties[0];
    if (first.hoursBefore !== undefined) {
        const days = Math.round(first.hoursBefore / 24);
        const amount = first.penaltyType === 'PERCENT'
            ? `${first.value}%`
            : `${first.value} ${currency || ''}`;
        return `✅ Besplatno do ${days}d → Penalizacija: ${amount}`;
    }
    return '⚠️ Pogledati storno politiku';
}
