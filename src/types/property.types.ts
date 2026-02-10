// TCT-IMC / OTA Standard Data Types for Accommodation Management

export interface PropertyIdentifiers {
    internalId: string; // UUID
    legalEntityId?: string;
    pmsId?: string;
    channelMappings?: {
        expediaId?: string;
        bookingComId?: string;
        googleHotelId?: string;
        gdsCode?: string;
    };
}

export interface Address {
    addressLine1: string; // Required
    addressLine2?: string;
    city: string; // Required
    postalCode: string; // Required
    countryCode: string; // ISO 3166-1 alpha-2
    country?: string; // Full country name
    stateProvince?: string; // ISO 3166-2
}

export interface GeoCoordinates {
    latitude: number; // Min 6 decimals
    longitude: number;
    coordinateSource: 'GPS_DEVICE' | 'MAP_PIN' | 'ADDRESS_GEOCODING';
    googlePlaceId?: string;
}

export interface PointOfInterest {
    poiName: string;
    distanceMeters: number;
    poiType: 'Airport' | 'TrainStation' | 'CityCenter' | 'Beach' | 'SkiLift' | 'Restaurant' | 'Shop';
}

export interface PropertyContent {
    languageCode: string; // ISO 639-1
    officialName: string;
    displayName: string;
    shortDescription: string; // Max 300 chars
    longDescription: string; // 2000+ chars
    locationDescription?: string;
    policyText?: string;
    // SEO & AI
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
    structuredJson?: string; // Hidden JSON-LD
}

export interface PropertyImage {
    url: string; // Min 1280px width
    category: 'Exterior' | 'Lobby' | 'Room' | 'Bathroom' | 'Pool' | 'Restaurant' | 'View' | 'Amenity';
    roomTypeId?: string; // Nullable - if specific to room type
    sortOrder: number;
    caption?: string;
    altText?: string;
    isMain?: boolean;
}

export const AGE_CATEGORIES = {
    INFANT: { min: 0, max: 2, label: 'Infant' },
    CHD1: { min: 2, max: 7, label: 'Child 2-7' },
    CHD2: { min: 7, max: 12, label: 'Child 7-12' },
    CHD3: { min: 12, max: 15, label: 'Child 12-15' },
    ADL: { min: 15, max: 120, label: 'Adult 15+' }
} as const;

export interface BeddingConfiguration {
    bedTypeCode: 'KING' | 'QUEEN' | 'DOUBLE' | 'TWIN' | 'SOFA_BED' | 'BUNK_BED';
    quantity: number;
    isExtraBed: boolean;
}

export interface RoomType {
    roomTypeId: string;
    code: string; // Internal code
    nameInternal: string;
    category: 'Room' | 'Suite' | 'Apartment' | 'Dormitory' | 'Villa';
    standardOccupancy: number;
    maxAdults: number;
    maxChildren: number;
    maxOccupancy: number;
    minOccupancy: number;
    osnovniKreveti: number; // Default/Primary count
    pomocniKreveti: number; // Default/Primary count
    bedSetupVariants: {
        id: string;
        basic: number;
        extra: number;
    }[];
    allowChildSharingBed: boolean; // Dete deli krevet
    allowAdultsOnExtraBeds: boolean; // Odrasli na pomoćnom ležaju
    allowInfantSharingBed: boolean; // Beba deli krevet
    babyCotAvailable: boolean; // Kreveac dostupan
    isNonSmoking: boolean; // Nepušačka soba
    isAccessible: boolean; // Pristupačno osobama sa invaliditetom
    petsAllowed: boolean; // Dozvoljeni ljubimci
    allowedOccupancyVariants?: string[]; // e.g., ["2+0", "2+1", "1+1"]
    childSharingVariants?: string[]; // Variants that allow child sharing bed
    sizeSqm?: number;
    floorNumber?: number;
    totalFloors?: number;
    viewType?: 'SeaView' | 'GardenView' | 'CityView' | 'PoolView' | 'MountainView';
    bathroomCount: number;
    bathroomType: 'Private' | 'Shared';
    beddingConfigurations: BeddingConfiguration[];
    amenities: RoomAmenity[];
    images: PropertyImage[];
    capacity?: {
        type: 'Allotment' | 'OnRequest' | 'FixedLease' | 'StopSale';
        releasePeriod: number;
        calendar: Record<string, { // Date string key: "YYYY-MM-DD"
            assigned: number;
            sold: number;
            remaining: number;
        }>;
    };
}

export interface Amenity {
    amenityId: string;
    otaCode: string; // OTA HAC/RMA code
    name: string;
    category: string;
    isFree: boolean;
    onSite: boolean;
    reservationRequired: boolean;
}

export interface RoomAmenity extends Amenity {
    roomTypeId: string;
}

export interface PropertyAmenity extends Amenity {
    propertyId: string;
}

export interface CancellationPolicy {
    policyType: 'NonRefundable' | 'FreeCancellation' | 'PartiallyRefundable';
    rules: {
        offsetUnit: 'Day' | 'Hour';
        offsetValue: number;
        penaltyType: 'Percent' | 'FixedAmount';
        penaltyValue: number;
    }[];
}

export interface RatePlan {
    ratePlanId: string;
    roomTypeId: string;
    name: string;
    mealPlanCode: 'RO' | 'BB' | 'HB' | 'FB' | 'AI'; // Room Only, Bed & Breakfast, Half Board, Full Board, All Inclusive
    cancellationPolicy: CancellationPolicy;
    paymentMode: 'PREPAY' | 'HOTEL_COLLECT';
    minLOS?: number; // Minimum Length of Stay
    maxLOS?: number;
    cutOffDays?: number;
    basePrice?: number;
    currency?: string;
    supplierId?: string; // Link to Supplier (Partner)
}

export interface Tax {
    taxType: 'VAT' | 'CityTax' | 'CleaningFee' | 'ResortFee';
    calculationType: 'Percent' | 'PerPerson' | 'PerNight' | 'PerStay';
    value: number;
    currency?: string;
}

export interface HouseRules {
    checkInStart: string; // HH:MM format
    checkInEnd: string;
    checkOutTime: string;
    smokingAllowed: boolean;
    partiesAllowed: boolean;
    petsAllowed: boolean;
    petDetails?: {
        dogsOnly: boolean;
        maxWeight?: number;
        petFee?: number;
    };
    ageRestriction?: number;
}

export interface KeyCollection {
    method: 'Keybox' | 'MeetGreeter' | 'DigitalLock' | 'Reception';
    instructions?: string; // Sent after booking confirmation
}

export interface HostProfile {
    hostName: string;
    responseTime?: string;
    languagesSpoken: string[]; // ISO codes
    profileImageUrl?: string;
}

export interface AIPromptHistory {
    id: string;
    userId: string;
    userName: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
    impactedFields?: string[];
}

export interface Property {
    id: string;
    identifiers: PropertyIdentifiers;
    propertyType: 'Hotel' | 'Apartment' | 'Villa' | 'Resort' | 'Hostel' | 'GuestHouse';
    starRating?: number;
    supplierId?: string; // Dobavljač
    chainId?: string; // Lanac Hotela
    brandId?: string; // Brand Hotela
    address: Address;
    geoCoordinates?: GeoCoordinates;
    content: PropertyContent[];
    images: PropertyImage[];
    roomTypes: RoomType[];
    propertyAmenities: PropertyAmenity[];
    ratePlans: RatePlan[];
    taxes: Tax[];
    pointsOfInterest: PointOfInterest[];
    houseRules: HouseRules;
    keyCollection?: KeyCollection;
    hostProfile?: HostProfile;
    bookingPolicy: {
        allOnRequest?: boolean;
        paymentPolicy?: string;
    };
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    aiPromptHistory?: AIPromptHistory[];
}

// Validation Rules
export const validateProperty = (property: Partial<Property>): string[] => {
    const errors: string[] = [];

    // Required fields
    if (!property.propertyType) errors.push('Property type is required');
    if (!property.address?.addressLine1) errors.push('Address line 1 is required');
    if (!property.address?.city) errors.push('City is required');
    if (!property.address?.postalCode) errors.push('Postal code is required');
    if (!property.address?.countryCode) errors.push('Country code is required');

    // Geo coordinates validation
    if (property.geoCoordinates) {
        if (property.geoCoordinates.latitude < -90 || property.geoCoordinates.latitude > 90) {
            errors.push('Latitude must be between -90 and 90');
        }
        if (property.geoCoordinates.longitude < -180 || property.geoCoordinates.longitude > 180) {
            errors.push('Longitude must be between -180 and 180');
        }
    }

    // Room type validation
    if (property.roomTypes) {
        property.roomTypes.forEach((room, index) => {
            if (room.maxOccupancy < room.maxAdults) {
                errors.push(`Room ${index + 1}: Max occupancy must be >= max adults`);
            }
            if (room.standardOccupancy > room.maxOccupancy) {
                errors.push(`Room ${index + 1}: Standard occupancy cannot exceed max occupancy`);
            }
        });
    }

    // Type-specific validation
    if ((property.propertyType === 'Apartment' || property.propertyType === 'Villa') && !property.keyCollection) {
        errors.push('Key collection method is required for apartments and villas');
    }

    // Rate plan validation
    if (property.isActive && (!property.ratePlans || property.ratePlans.length === 0)) {
        errors.push('Active property must have at least one rate plan');
    }

    return errors;
};
