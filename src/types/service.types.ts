export interface ExtraService {
    id: string;
    name: string;
    category: 'Trip' | 'Ticket' | 'Transfer' | 'Insurance' | 'Other';
    providerId: string; // Linked to Supplier
    description: string;
    price: number;
    currency: string;
    isMandatory: boolean;
    status: 'active' | 'archived';
}
