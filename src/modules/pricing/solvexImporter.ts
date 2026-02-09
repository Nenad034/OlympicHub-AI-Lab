import type { SolvexHotelSearchResult } from '../../types/solvex.types';

export interface InternalPricePeriod {
    id: string;
    dateFrom: string;
    dateTo: string;
    basis: string;
    netPrice: number;
    provisionPercent: number;
    releaseDays: number;
    minStay: number;
    maxStay: number | null;
    minAdults: number;
    maxAdults: number;
    minChildren: number;
    maxChildren: number;
    arrivalDays: number[];
}

/**
 * Mappers Solvex search result items to the internal Pricing Intelligence format
 * specifically for a single hotel's periods.
 */
export function mapSolvexToInternal(solvexResults: SolvexHotelSearchResult[]) {
    if (solvexResults.length === 0) return null;

    // Use the first result to define the product state
    const first = solvexResults[0];

    const productState = {
        service: first.pansion.code || 'BB',
        prefix: '',
        type: first.room.roomType.name,
        view: first.room.roomCategory.name,
        name: first.hotel.name
    };

    // Map periods
    const periods: InternalPricePeriod[] = solvexResults.map((s, idx) => ({
        id: `solvex-${s.hotel.id}-${idx}`,
        dateFrom: s.startDate.split('T')[0],
        dateTo: new Date(new Date(s.startDate).getTime() + s.duration * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        basis: s.hotel.priceType === 1 ? 'PER_ROOM_DAY' : 'PER_PERSON_DAY',
        netPrice: s.totalCost,
        provisionPercent: 20,
        releaseDays: 0,
        minStay: 1,
        maxStay: null,
        minAdults: 2,
        maxAdults: 4,
        minChildren: 0,
        maxChildren: 2,
        arrivalDays: [1, 2, 3, 4, 5, 6, 7]
    }));

    // Mock Rules (SPO & Supplements) from Solvex
    const rules = [
        {
            id: 'spo-1',
            rule_type: 'DISCOUNT',
            title: 'Early Booking -15%',
            percentValue: 15,
            childAgeFrom: 0,
            childAgeTo: 12,
            daysBeforeArrival: 60
        },
        {
            id: 'spo-2',
            rule_type: 'SUPPLEMENT',
            title: 'Sea View Upgrade',
            netPrice: 15.00,
            percentValue: 0
        }
    ];

    return {
        productState,
        periods,
        rules
    };
}

/**
 * Mock Solvex data for demonstration (Sunny Beach - Hotel Blue Pearl)
 */
export const MOCK_SOLVEX_DATA: SolvexHotelSearchResult[] = [
    {
        hotel: {
            id: 2930,
            name: "Blue Pearl Hotel",
            city: { id: 68, name: "Sunny Beach", nameLat: "Sunny Beach" },
            country: { id: 6, name: "Bulgaria", nameLat: "Bulgaria" },
            starRating: 4,
            nameLat: "Blue Pearl Hotel",
            priceType: 0
        },
        room: {
            roomType: { id: 3, name: "Double Room", nameLat: "Double Room", places: 2, exPlaces: 1 },
            roomCategory: { id: 20, name: "Sea View", nameLat: "Sea View" },
            roomAccommodation: { id: 5558, name: "2AD", nameLat: "2AD", adultMainPlaces: 2, childMainPlaces: 0 }
        },
        pansion: { id: 3, name: "All Inclusive", nameLat: "All Inclusive", code: "AI" },
        totalCost: 852.80,
        quotaType: 1,
        tariff: { id: 0, name: "Ordinary" },
        duration: 7,
        startDate: "2026-06-18T00:00:00"
    },
    {
        hotel: {
            id: 2930,
            name: "Blue Pearl Hotel",
            city: { id: 68, name: "Sunny Beach", nameLat: "Sunny Beach" },
            country: { id: 6, name: "Bulgaria", nameLat: "Bulgaria" },
            starRating: 4,
            nameLat: "Blue Pearl Hotel",
            priceType: 0
        },
        room: {
            roomType: { id: 3, name: "Double Room", nameLat: "Double Room", places: 2, exPlaces: 1 },
            roomCategory: { id: 20, name: "Sea View", nameLat: "Sea View" },
            roomAccommodation: { id: 5558, name: "2AD", nameLat: "2AD", adultMainPlaces: 2, childMainPlaces: 0 }
        },
        pansion: { id: 3, name: "All Inclusive", nameLat: "All Inclusive", code: "AI" },
        totalCost: 945.20,
        quotaType: 1,
        tariff: { id: 0, name: "Ordinary" },
        duration: 7,
        startDate: "2026-06-25T00:00:00"
    }
];
