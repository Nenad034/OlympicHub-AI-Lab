import type { PropertyImage } from './property.types';

export type TransportType = 'Flight' | 'Bus' | 'Ship' | 'Train' | 'Transfer' | 'Other';

export interface TransportSegment {
    id: string;
    type: TransportType;
    fromCity: string;
    toCity: string;
    departureTime?: string;
    arrivalTime?: string;
    provider?: string; // Link to Supplier
    details?: string;
}

export interface DayActivity {
    id: string;
    timeSlot?: string; // e.g., "09:00", "Morning"
    type: 'Accommodation' | 'Sightseeing' | 'FreeTime' | 'Meal' | 'Transit' | 'FakultativniIzlet';
    title: string;
    description: string;
    locationName?: string;
    geoCoords?: { lat: number; lng: number };
    includedInPrice: boolean;
    priceIfOptional?: number;
    currency?: string;
}

export interface TourDay {
    dayNumber: number;
    title: string;
    description: string;
    location?: string;
    accommodation?: {
        hotelId: string;
        hotelName: string;
        roomTypeId?: string;
    };
    accommodationHotelId?: string; // Legacy
    activities: DayActivity[];
    transportSegments: TransportSegment[];
}

export interface TourSupplement {
    id: string;
    name: string;
    price: number;
    currency: string;
    type: 'Required' | 'Optional';
}

export interface Tour {
    id: string;
    title: string;
    slug: string;
    category: 'Grupno' | 'Individualno' | 'Krstarenje' | 'StayAndCruise';
    status: 'Draft' | 'Published' | 'Archived';

    // Core Info
    shortDescription: string;
    longDescription: string;
    highlights: string[];
    mainImage?: PropertyImage;
    gallery: PropertyImage[];

    // Logistics
    startDate: string;
    endDate: string;
    durationDays: number;
    totalSeats: number;
    availableSeats: number;

    // The Timeline
    itinerary: TourDay[];

    // Commercial
    basePrice: number;
    currency: string;
    supplements: TourSupplement[];

    createdAt: string;
    updatedAt: string;
}

export const validateTour = (tour: Partial<Tour>): string[] => {
    const errors: string[] = [];
    if (!tour.title) errors.push('Naslov putovanja je obavezan.');
    if (!tour.basePrice || tour.basePrice <= 0) errors.push('Osnovna cena mora biti veća od 0.');
    if (!tour.durationDays || tour.durationDays <= 0) errors.push('Trajanje mora biti definisano.');
    return errors;
};
