/**
 * Generic Service Provider Interface
 * 
 * Defines the contract for additional services like excursions, insurance, and tickets.
 */

export type ServiceCategory = 'Trip' | 'Ticket' | 'Transfer' | 'Insurance' | 'Other';

export interface ExcursionSearchParams {
    location?: string;
    date?: Date;
    category?: ServiceCategory;
}

export interface ExtraService {
    id: string;
    providerName: string;
    category: ServiceCategory;
    name: string;
    description: string;
    price: number;
    currency: string;
    isMandatory: boolean;
    status: 'active' | 'inactive';
    originalData?: any;
}

export interface ServiceProvider {
    readonly name: string;
    readonly isActive: boolean;
    search(params: ExcursionSearchParams): Promise<ExtraService[]>;
    getAll?(): Promise<ExtraService[]>;
    save?(service: ExtraService): Promise<void>;
    delete?(id: string): Promise<void>;
}
