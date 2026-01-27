export type ProductType = 'ACCOMMODATION' | 'TOUR' | 'TRANSPORT' | 'ADDITIONAL_SERVICE';

export interface DateRange {
    from: string;
    to: string;
}

export interface PricelistHeader {
    id: number;
    name: string;
    serviceName: string;
    productId: string;
    productType: ProductType;

    // Ključno: Razlika između vremena bukiranja i vremena boravka
    bookingValidity: DateRange; // Kada se kreira rezervacija
    stayValidity: DateRange;    // Kada se boravi
}

export type CalculationBasis = 'PER_PERSON_PER_DAY' | 'PER_ROOM_PER_DAY' | 'PER_PERSON_PER_STAY' | 'PER_ROOM_PER_STAY';

export interface BaseRate {
    id: string;
    definitionId: number;
    title: string;

    // Period važenja cene
    dateRange: DateRange;

    // Obračun
    basis: CalculationBasis;
    stayNights?: number;

    // Cene (MARS Logic)
    netPrice: number;
    provisionPercent: number; // Provizija (npr. 21%)
    grossPrice: number;
    currency: string;

    // Restrikcije boravka
    minStay: number;
    maxStay?: number;
    releaseDays?: number;

    // Restrikcije dolaska/odlaska
    arrivalDays: number[];
    departureDays: number[];

    // Osobe (MARS Section)
    minAdults?: number;
    maxAdults?: number;
    minChildren?: number;
    maxChildren?: number;
    exclusiveForOccupancy?: number;

    // Opis (MARS Section)
    descriptions?: { [lang: string]: { title: string, content: string } };
}

// Baza definicija za pravila (da se ne dupliraju)
export interface MasterRuleDefinition {
    id: number;
    type: 'supplement' | 'discount' | 'tax';
    name: string; // Unutrašnji naziv (npr. "Kućni ljubimci")
    externalMappings: {
        source: 'API' | 'EXCEL' | 'XML';
        externalTitle: string;
        externalId: number;
    }[];
}

export interface RuleEntry {
    definitionId: number;
    title: string;
    type: string;
    netPrice?: number;
    markupValue?: number;
    grossPrice?: number;
    percent?: number;
    dateRange: DateRange;
    ageFrom: number; // Eksplicitno dodato jer MARS nema
    ageTo: number;   // Eksplicitno dodato jer MARS nema
    conditions: {
        minStay?: number;
        numberOfAdultsRequired?: number; // npr. popust važi uz 2 odrasle
        numberOfChildrenInRoom?: number; // npr. popust važi ako ima 2 dece
        occupancyLogic: 'FIXED' | 'MIN_MAX' | 'EXACT_MIX';
    };
}

export interface ProductPriceStructure {
    header: PricelistHeader;
    units: {
        unitId: number;
        unitName: string;
        baseRates: BaseRate[];
        supplements: RuleEntry[];
        discounts: RuleEntry[];
        taxes: RuleEntry[];
    }[];
    commonItems: {
        supplements: RuleEntry[];
        discounts: RuleEntry[];
        taxes: RuleEntry[];
    };
}
