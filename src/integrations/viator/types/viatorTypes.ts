// ============================================================
// VIATOR PARTNER API v2 — TypeScript Types
// Docs: https://docs.viator.com/partner-api/technical/
// ClickToTravel Hub Integration
// ============================================================

// ─── Kredencijali ─────────────────────────────────────────────────────────────

export interface ViatorCredentials {
    apiKey: string;
    environment: 'sandbox' | 'production';
    partnerType: 'affiliate' | 'merchant';
}

// ─── Opšti ────────────────────────────────────────────────────────────────────

export interface ViatorPagination {
    count: number;
    totalCount: number;
    cursor?: string;
}

export interface ViatorError {
    code: string;
    message: string;
    field?: string;
}

export interface ViatorErrorResponse {
    errors: ViatorError[];
}

// ─── Destinacije ──────────────────────────────────────────────────────────────

export interface ViatorDestination {
    destinationId: number;
    destinationName: string;
    destinationType: 'COUNTRY' | 'REGION' | 'CITY' | 'ATTRACTION';
    parentDestinationId?: number;
    destinationUrlName: string;
    defaultCurrencyCode: string;
    lookupId: string;
    timeZone: string;
    iataCode?: string;
}

export interface ViatorDestinationsResponse {
    destinations: ViatorDestination[];
    pagination: ViatorPagination;
}

// ─── Tags / Kategorije ────────────────────────────────────────────────────────

export interface ViatorTag {
    tagId: number;
    parentTagIds?: number[];
    allNamesByLocale: Record<string, string>;
}

export interface ViatorTagsResponse {
    tags: ViatorTag[];
}

// ─── Age Bands ────────────────────────────────────────────────────────────────

export type ViatorAgeBand = 'ADULT' | 'CHILD' | 'INFANT' | 'YOUTH' | 'SENIOR' | 'TRAVELER';

export interface ViatorAgeBandDefinition {
    ageBand: ViatorAgeBand;
    startAge: number;
    endAge: number;
    minTravelersPerBooking: number;
    maxTravelersPerBooking: number;
}

export interface ViatorTravelerMix {
    [ageBand: string]: number; // npr. { ADULT: 2, CHILD: 1 }
}

// ─── Slike ────────────────────────────────────────────────────────────────────

export interface ViatorImage {
    imageSource: string;
    caption: string;
    isCover: boolean;
    variants: ViatorImageVariant[];
}

export interface ViatorImageVariant {
    url: string;
    width: number;
    height: number;
}

// ─── Recenzije ────────────────────────────────────────────────────────────────

export interface ViatorReview {
    reviewReference: string;
    productCode: string;
    productOptionCode?: string;
    rating: number;
    helpfulVotes: number;
    publishedDate: string;
    title?: string;
    text: string;
    travelerType?: string;
    submissionDate: string;
    ownerResponse?: {
        body: string;
        publishedDate: string;
    };
    reviewer?: {
        displayName: string;
        countryCode?: string;
    };
    photosInfo?: ViatorImage[];
}

export interface ViatorReviewsResponse {
    reviews: ViatorReview[];
    totalCount: number;
    rating: {
        averageRating: number;
        ratingCount: number;
    };
}

// ─── Produkt (Tour & Experience) ─────────────────────────────────────────────

export interface ViatorPricingSummary {
    fromPrice: number;
    fromPriceBeforeDiscount?: number;
    currencyCode: string;
}

export interface ViatorCancellationTerm {
    dayRangeMin: number;
    dayRangeMax?: number;
    percentageRefundable: number;
    policyType: 'STANDARD' | 'CUSTOM' | 'ALL_SALES_FINAL';
}

export interface ViatorCancellationPolicy {
    type: 'STANDARD' | 'CUSTOM' | 'ALL_SALES_FINAL';
    description: string;
    cancelIfBadWeather: boolean;
    cancelIfInsufficientTravelers: boolean;
    refundEligibility?: ViatorCancellationTerm[];
}

export interface ViatorLocation {
    ref: string;
    name?: string;
}

export interface ViatorItineraryItem {
    pointOfInterestLocation?: ViatorLocation;
    duration?: { fixedDurationInMinutes?: number };
    passByWithoutStopping?: boolean;
    admissionIncluded?: string;
    description?: string;
}

export interface ViatorInclusion {
    categoryType: string;
    typeDescription: string;
    otherDescription?: string;
}

export interface ViatorExclusion {
    categoryType: string;
    typeDescription: string;
    otherDescription?: string;
}

export interface ViatorAdditionalInfo {
    type: string;
    description: string;
}

export interface ViatorProductOption {
    productOptionCode: string;
    description: string;
    title: string;
    languageGuides?: {
        type: string;
        language: string;
        legacyGuide?: string;
    }[];
}

export interface ViatorBookingQuestion {
    id: string;
    question: string;
    required: boolean;
    hint: string;
    inputType: 'TEXT_SHORT' | 'TEXT_LONG' | 'NUMBER_ADULT' | 'DATE' | 'LOCATION' | 'MULTIPLE_SELECT';
    sanitizedAnswer?: string;
    group: string;
    travelerRequirement?: 'PER_BOOKING' | 'PER_TRAVELER';
    allowedAnswers?: string[];
    conditionalQuestion?: {
        questionId: string;
        answer: string;
    };
}

export interface ViatorProduct {
    productCode: string;
    status: 'ACTIVE' | 'INACTIVE' | 'PENDING_APPROVAL';
    productUrl: string;
    title: string;
    description: string;
    shortDescription?: string;
    duration: {
        fixedDurationInMinutes?: number;
        variableDurationFromMinutes?: number;
        variableDurationToMinutes?: number;
        unstructuredDuration?: string;
    };
    pricingInfo: {
        type: 'PER_PERSON' | 'PER_GROUP';
        ageBands: ViatorAgeBandDefinition[];
    };
    pricing: ViatorPricingSummary;
    images: ViatorImage[];
    reviews: {
        combinedAverageRating: number;
        totalReviews: number;
    };
    destinations: { ref: string; primary: boolean }[];
    tags: number[];
    flags?: string[];
    itinerary?: {
        itineraryType: 'STANDARD' | 'ACTIVITY' | 'MULTI_DAY_TOUR' | 'HOP_ON_HOP_OFF' | 'UNSTRUCTURED';
        skipTheLine?: boolean;
        privateTour?: boolean;
        pointsOfInterest?: ViatorItineraryItem[];
        routes?: any[];
        duration?: { fixedDurationInMinutes?: number };
        activityInfo?: { location?: ViatorLocation; description?: string };
    };
    inclusions?: ViatorInclusion[];
    exclusions?: ViatorExclusion[];
    additionalInfo?: ViatorAdditionalInfo[];
    bookingConfirmationSettings?: {
        confirmationType: 'INSTANT' | 'MANUAL';
        maxConfirmationHours?: number;
    };
    bookingQuestions?: ViatorBookingQuestion[];
    cancellationPolicy?: ViatorCancellationPolicy;
    languageGuides?: {
        type: string;
        language: string;
    }[];
    productOptions?: ViatorProductOption[];
    translationInfo?: {
        containsMachineTranslatedText: boolean;
    };
    supplier?: {
        name: string;
        supplierId: string;
    };
    logistics?: {
        start?: { location?: ViatorLocation; description?: string }[];
        end?: { location?: ViatorLocation; description?: string }[];
        redemption?: { redemptionType: string };
    };
    viatorLeadGenerated?: boolean;
    timeZone?: string;
    createdAt?: string;
    lastUpdatedAt?: string;
}

export interface ViatorProductsResponse {
    products: ViatorProduct[];
    pagination: ViatorPagination;
}

// ─── Pretraga Produkata ───────────────────────────────────────────────────────

export interface ViatorSearchRequest {
    filtering?: {
        destination?: string;
        tags?: number[];
        flags?: string[];
        lowestPrice?: number;
        highestPrice?: number;
        startDate?: string;
        endDate?: string;
        duration?: {
            from?: number;
            to?: number;
        };
        rating?: number;
    };
    sorting?: {
        sort: 'TOP_RATED' | 'PRICE_LOW_HIGH' | 'PRICE_HIGH_LOW' | 'RELEVANCE';
        order?: 'ASCENDING' | 'DESCENDING';
    };
    pagination?: {
        start: number;
        count: number;
    };
    currency?: string;
}

export interface ViatorFreetextSearchRequest {
    searchTerm: string;
    searchTypes?: { searchType: 'PRODUCTS' | 'DESTINATIONS' | 'ATTRACTIONS' }[];
    currency?: string;
    pagination?: {
        start: number;
        count: number;
    };
}

export interface ViatorSearchResultProduct {
    productCode: string;
    title: string;
    description: string;
    productUrl: string;
    images: ViatorImage[];
    pricing: ViatorPricingSummary;
    reviews: { combinedAverageRating: number; totalReviews: number };
    duration?: { fixedDurationInMinutes?: number; variableDurationFromMinutes?: number; variableDurationToMinutes?: number };
    destinations: { ref: string; primary: boolean }[];
    tags: number[];
}

export interface ViatorSearchResponse {
    products?: {
        results: ViatorSearchResultProduct[];
        totalCount: number;
    };
    destinations?: {
        results: ViatorDestination[];
        totalCount: number;
    };
}

// ─── Availability (Schedules) ─────────────────────────────────────────────────

export interface ViatorAvailabilitySchedule {
    productCode: string;
    bookableItems: ViatorBookableItem[];
    currency: string;
    summary: {
        fromPrice: number;
    };
}

export interface ViatorBookableItem {
    productOptionCode: string;
    seasonalPricingOverride?: string;
    availability: ViatorAvailabilitySlot[];
}

export interface ViatorAvailabilitySlot {
    startTime?: string; // HH:MM
    allDay?: boolean;
    vacancies?: number;
    available: boolean;
}

export interface ViatorAvailabilityCheckRequest {
    productCode: string;
    productOptionCode?: string;
    currency: string;
    travelDate: string;
    paxMix: ViatorPaxMixItem[];
    startTime?: string;
}

export interface ViatorPaxMixItem {
    ageBand: ViatorAgeBand;
    numberOfTravelers: number;
}

export interface ViatorAvailabilityCheckResponse {
    productCode: string;
    productOptionCode?: string;
    currency: string;
    travelDate: string;
    startTime?: string;
    unavailableReason?: 'TRAVELER_MISMATCH' | 'BLOCKED' | 'SOLD_OUT';
    lineItems: ViatorLineItem[];
    totalPrice: {
        recommendedRetailPrice: number;
        partnerNetPrice: number;
        bookingFee: number;
        currencyCode: string;
    };
    paxMix: ViatorPaxMixItem[];
    bookingQuestions?: string[];
}

export interface ViatorLineItem {
    ageBand: ViatorAgeBand;
    numberOfTravelers: number;
    subtotalPrice: {
        recommendedRetailPrice: number;
        partnerNetPrice: number;
        bookingFee: number;
        currencyCode: string;
    };
}

// ─── Booking Hold ─────────────────────────────────────────────────────────────

export interface ViatorBookingHoldRequest {
    productCode: string;
    productOptionCode?: string;
    startTime?: string;
    travelDate: string;
    paxMix: ViatorPaxMixItem[];
    currency: string;
}

export interface ViatorBookingHoldResponse {
    cartRef: string;
    bookingRef?: string;
    expires: string;
    lineItems: ViatorLineItem[];
    totalPrice: {
        recommendedRetailPrice: number;
        partnerNetPrice: number;
        bookingFee: number;
        currencyCode: string;
    };
}

// ─── Booking Confirm ──────────────────────────────────────────────────────────

export interface ViatorTravelerAnswer {
    questionId: string;
    answer: string;
    travelerNum?: number;
}

export interface ViatorBookingRequest {
    productCode: string;
    productOptionCode?: string;
    startTime?: string;
    travelDate: string;
    paxMix: ViatorPaxMixItem[];
    currency: string;
    bookerInfo: {
        firstName: string;
        lastName: string;
        email: string;
        phone?: string;
    };
    bookingAnswers?: ViatorTravelerAnswer[];
    partnerBookingRef?: string;
    cartRef?: string;
    languageGuideCode?: string;
    pickupPointRef?: string;
}

export interface ViatorBookingConfirmation {
    bookingRef: string;
    partnerBookingRef?: string;
    productCode: string;
    productTitle?: string;
    productOptionCode?: string;
    bookingStatus: 'CONFIRMED' | 'PENDING' | 'CANCELLED' | 'EXPIRED' | 'REJECTED';
    createdAt: string;
    travelDate: string;
    startTime?: string;
    paxMix: ViatorPaxMixItem[];
    currency: string;
    totalPrice: {
        recommendedRetailPrice: number;
        partnerNetPrice: number;
        bookingFee: number;
        currencyCode: string;
    };
    voucherInfo?: {
        barcode?: string;
        entries?: {
            description: string;
            value: string;
        }[];
    };
    confirmationType: 'INSTANT' | 'MANUAL';
    cancellationPolicy?: ViatorCancellationPolicy;
    supplier?: { name: string; supplierId: string };
}

export interface ViatorBookingResponse {
    bookings: ViatorBookingConfirmation[];
    errors?: ViatorError[];
}

// ─── Booking Status ───────────────────────────────────────────────────────────

export interface ViatorBookingStatusResponse {
    bookingRef: string;
    partnerBookingRef?: string;
    bookingStatus: 'CONFIRMED' | 'PENDING' | 'CANCELLED' | 'EXPIRED' | 'REJECTED';
    productCode: string;
    travelDate: string;
    createdAt: string;
    cancelledAt?: string;
    totalPrice: {
        recommendedRetailPrice: number;
        partnerNetPrice: number;
        currencyCode: string;
    };
    voucherInfo?: {
        barcode?: string;
    };
}

// ─── Cancellation ─────────────────────────────────────────────────────────────

export interface ViatorCancellationReason {
    cancellationReasonCode: string;
    cancellationReasonText: string;
}

export interface ViatorCancellationRequest {
    bookingRef: string;
    reasonCode: string;
    cancelItems?: { itemRef: string }[];
}

export interface ViatorCancellationResponse {
    bookingRef: string;
    status: 'CANCELLED' | 'REJECTED';
    refundDetails?: {
        refundAmount: number;
        currencyCode: string;
        refundPercentage: number;
    };
}

// ─── Recommendations ──────────────────────────────────────────────────────────

export interface ViatorRecommendationsRequest {
    productCodes: string[];
    currency?: string;
    excludeProductCodes?: string[];
}

export interface ViatorRecommendationsResponse {
    products: ViatorSearchResultProduct[];
}
