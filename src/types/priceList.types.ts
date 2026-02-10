// Advanced Price List Types for Olympic Hub
import type { RatePlan, CancellationPolicy } from './property.types';

export interface AgeCategory {
    id: string;
    name: string; // e.g., "ADL", "CHD1"
    minAge: number;
    maxAge: number;
    isDefault?: boolean;
}

export type PricingType = 'PerPersonPerDay' | 'PerPersonPerPeriod' | 'PerRoomPerDay' | 'PerRoomPerPeriod';

export interface BasePriceEntry {
    id: string;
    ageCategoryId: string;
    dateFrom: string;
    dateTo: string;
    amount: number;
    currency: string;
    pricingType: PricingType;
}

export interface OccupancyRule {
    id: string;
    bedSetupId: string; // References BedSetupVariant.id from RoomType
    variantKey: string; // e.g., "2ADL_1CHD1"
    isActive: boolean;
    bookingFrom?: string;
    bookingTo?: string;
    stayFrom: string;
    stayTo: string;
    roomTypeIds: string[]; // Can apply to multiple room types
}

export interface SurchargeOrDiscount {
    id: string;
    type: 'Surcharge' | 'Discount';
    subType: 'Mandatory' | 'Optional';
    paymentMode: 'Agency' | 'OnSite';
    name: string; // Public name
    value: number;
    valueType: 'Fixed' | 'Percent';
    appliesTo: 'BasePrice' | 'SpecificSurcharges' | 'Total';
    condition?: string;
    roomTypeIds?: string[];
}

export interface SpecialOffer {
    id: string;
    offerType: 'EarlyBooking' | 'LastMinute' | 'SpecialOffer';
    name: string;
    discountValue: number;
    discountType: 'Fixed' | 'Percent';
    bookingFrom?: string;
    bookingTo?: string;
    stayFrom?: string;
    stayTo?: string;
    applyToBasePrice: boolean;
    applyToSurcharges: string[]; // IDs of surcharges it applies to
    roomTypeIds: string[];
}

export interface AdvancedPriceList {
    id: string;
    hotelId: string;
    name: string;
    ageCategories: AgeCategory[];
    basePrices: BasePriceEntry[];
    occupancyRules: OccupancyRule[];
    surcharges: SurchargeOrDiscount[];
    discounts: SurchargeOrDiscount[];
    specialOffers: SpecialOffer[];
    cancellationPolicy: CancellationPolicy;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}
