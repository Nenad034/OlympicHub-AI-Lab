/**
 * Generic Transport Provider Interface
 */

export interface TransportSearchParams {
    fromCity: string;
    toCity: string;
    date?: Date;
    type?: 'Flight' | 'Bus' | 'Ship' | 'Train';
}

export interface TransportSegment {
    id: string;
    providerName: string;
    type: 'Flight' | 'Bus' | 'Ship' | 'Train';
    carrierName?: string;
    fromCity: string;
    toCity: string;
    departureTime?: string;
    arrivalTime?: string;
    basePrice: number;
    currency: string;
    availableSeats: number;
    status: 'draft' | 'active' | 'full' | 'cancelled';
    originalData?: any;
}

export interface TransportProvider {
    readonly name: string;
    readonly isActive: boolean;
    search(params: TransportSearchParams): Promise<TransportSegment[]>;
    getAll?(): Promise<TransportSegment[]>;
    save?(segment: TransportSegment): Promise<void>;
    delete?(id: string): Promise<void>;
}
