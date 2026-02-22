export interface TransportSegment {
    id: string;
    type: 'Flight' | 'Bus' | 'Ship' | 'Train';
    providerId: string; // Linked to Supplier
    fromCity: string;
    toCity: string;
    departureTime?: string;
    arrivalTime?: string;
    duration?: string;
    carrierName?: string;
    flightNumber?: string;
    basePrice: number;
    currency: string;
    availableSeats: number;
    status: 'active' | 'cancelled' | 'draft';
}

export interface TransportRoute {
    id: string;
    name: string;
    segments: TransportSegment[];
    totalPrice: number;
    currency: string;
}
