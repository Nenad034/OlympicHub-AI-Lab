// Pricing System Types

export interface PersonCategory {
    code: 'ADL' | 'CHD1' | 'CHD2' | 'CHD3' | 'INF';
    label: string;
    ageFrom: number;
    ageTo: number;
}

export interface BedOccupant {
    bedType: 'osnovni' | 'pomocni';
    bedIndex: number;
    personCategory: 'ADL' | 'CHD1' | 'CHD2' | 'CHD3' | 'INF';
}

export interface Discount {
    type: 'early_booking' | 'child_discount' | 'last_minute' | 'custom';
    label: string;
    amount?: number;
    percentage?: number;
}

export interface Surcharge {
    type: 'single_use' | 'extra_bed' | 'sea_view' | 'custom';
    label: string;
    amount?: number;
    percentage?: number;
}

export interface PricingRule {
    id: string;
    isActive: boolean;

    // Bed assignment
    bedAssignment: BedOccupant[];

    // Pricing
    basePrice: number;
    discounts?: Discount[];
    surcharges?: Surcharge[];
    finalPrice: number;

    // Metadata
    notes?: string;
}

export interface RoomTypePricing {
    roomTypeId: string;
    roomTypeName: string;

    // Base occupancy rules from RoomsStep
    baseOccupancyVariants: string[]; // e.g., ["2ADL_1CHD", "3ADL_0CHD"]

    // Generated pricing rules with age categories
    pricingRules: PricingRule[];
}

export interface PriceList {
    id: string; // Format: {propertyId}_{timestamp}
    name: string;
    propertyId: string;

    // Validity periods
    validFrom: Date; // Za rezervacije od
    validTo: Date; // Za rezervacije do
    stayFrom?: Date; // Za boravke od
    stayTo?: Date; // Za boravke do

    // Supplier info
    supplierId?: string; // Dobavljač
    supplierCommission?: number; // Provizija dobavljača (popust koji nam dobavljač odobrava)

    // Service details
    serviceName?: string; // Naziv usluge
    paymentModel?: string; // Model plaćanja (npr. "Akontacija 40%, ostatak do 15 dana pre polaska")
    cancellationPolicy?: string; // Uslovi otkaza
    currency: string; // Valuta (EUR, USD, RSD...)
    subagentCommission?: number; // Provizija za Subagenta

    // Person categories
    personCategories: PersonCategory[];

    // Room type pricing
    roomTypePricing: RoomTypePricing[];

    // Card-based sections (Microsoft ToDo style)
    priceIncludes: PriceCard[]; // Cena uključuje
    priceExcludes: PriceCard[]; // Cena ne uključuje
    notes: PriceCard[]; // Napomene

    // AI Assistant metadata
    aiGeneratedRules?: AIGeneratedRule[];
    validationStatus: 'pending' | 'approved' | 'rejected';
    validationNotes?: string;

    // Import metadata
    importSource?: ImportSource;

    // Timestamps
    createdAt?: Date;
    updatedAt?: Date;
}

export interface PriceCard {
    id: string;
    text: string;
    completed?: boolean;
    order: number;
}

export interface AIGeneratedRule {
    ruleId: string;
    prompt: string;
    generatedAt: Date;
    validatedAt?: Date;
    validatedBy?: string;
    feedback?: string;
}

export interface ImportSource {
    type: 'excel' | 'pdf' | 'json' | 'xml' | 'html';
    fileName: string;
    uploadedAt: Date;
    parsedData?: any;
}

export interface ImportPreview {
    personCategories: PersonCategory[];
    roomTypePricing: RoomTypePricing[];
    warnings: string[];
    errors: string[];
}

export interface AIAssistantMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;

    // For assistant messages
    preview?: ImportPreview | PricingRule[];
    requiresValidation?: boolean;
    validationStatus?: 'pending' | 'approved' | 'rejected';
}
