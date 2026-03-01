// ============================================================
//  EXPEDIA GROUP — RAPID API — TypeScript Types
//  Pokriva: Properties (Shopping + Booking), Content, Itineraries
//  Docs: https://developers.expediagroup.com/rapid
//  Auth: EAN APIKey=...,Signature=SHA512(key+secret+timestamp),timestamp=...
// ============================================================

// ─── Kredencijali ────────────────────────────────────────────────────────────

export interface ExpediaCredentials {
    apiKey: string;
    apiSecret: string;
    environment: 'test' | 'production';
}

// ─── Zajednički tipovi ────────────────────────────────────────────────────────

export interface ExpediaApiError {
    type: string;
    message: string;
    errors?: Array<{
        type: string;
        message: string;
        fields?: Array<{
            name: string;
            type: string;
            value: string;
        }>;
    }>;
}

export interface ExpediaLink {
    method: string;
    href: string;
}

export interface ExpediaStatusLinks {
    [key: string]: ExpediaLink;
}

// ─── SHOPPING API — Pretraga dostupnih soba ───────────────────────────────────

export interface PropertyAvailabilityRequest {
    checkin: string;           // YYYY-MM-DD
    checkout: string;          // YYYY-MM-DD
    currency: string;          // 'EUR', 'USD', itd.
    language: string;          // 'en-US', 'sr-SP', itd.
    country_code: string;      // ISO 3166 (npr. 'RS', 'DE')
    occupancy: string[];       // format: "numAdults-numChildren-ageOfChild1,ageOfChild2" npr. ["2-1-8"]
    property_id?: string[];    // Lista Expedia property ID-jeva
    sales_channel?: 'website' | 'agent_tool' | 'mobile_app';
    sales_environment?: 'hotel_only' | 'hotel_package' | 'loyalty';
    sort_type?: 'preferred';
    amenity_category?: string[];
    rate_plan_type?: 'merchant' | 'agency';
    include?: string[];        // npr. ['tax_breakdown', 'all_inclusive']
    filter?: string;
}

export interface BedGroup {
    id: string;
    description: string;
    configuration: Array<{
        type: string;
        size: string;
        quantity: number;
    }>;
    links: {
        price_check: ExpediaLink;
    };
}

export interface RoomRate {
    id: string;
    status: 'available' | 'partially_available' | 'sold_out';
    available_rooms: number;
    refundable: boolean;
    deposit_required: boolean;
    fenced_deal: boolean;
    member_deal_available: boolean;
    sale_scenario: {
        package: boolean;
        member: boolean;
        corporate: boolean;
        distribution: boolean;
    };
    merchant_of_record: 'expedia' | 'property';
    amenities: {
        [amenityCode: string]: {
            id: string;
            name: string;
        };
    };
    links: {
        payment_options: ExpediaLink;
        price_check: ExpediaLink;
    };
    bed_groups: {
        [bedGroupId: string]: BedGroup;
    };
    cancel_penalties: Array<{
        start?: string;
        end?: string;
        nights_charged?: number;
        amount?: string;
        currency?: string;
        percent?: string;
    }>;
    nonrefundable_date_ranges?: Array<{
        start: string;
        end: string;
    }>;
    occupancy_pricing: {
        [occupancy: string]: {
            nightly: Array<Array<{
                type: 'base_rate' | 'tax_and_service_fee' | 'extra_person_fee' | 'property_fee' | 'sales_tax' | 'adjustment';
                value: string;
            }>>;
            stay: Array<{
                type: string;
                value: string;
            }>;
            totals: {
                inclusive: {
                    billable_currency: { value: string; currency: string };
                    request_currency: { value: string; currency: string };
                };
                exclusive: {
                    billable_currency: { value: string; currency: string };
                    request_currency: { value: string; currency: string };
                };
                inclusive_strikethrough?: {
                    billable_currency: { value: string; currency: string };
                    request_currency: { value: string; currency: string };
                };
                strikethrough?: {
                    billable_currency: { value: string; currency: string };
                    request_currency: { value: string; currency: string };
                };
                marketing_fee?: {
                    billable_currency: { value: string; currency: string };
                    request_currency: { value: string; currency: string };
                };
                gross_profit?: {
                    billable_currency: { value: string; currency: string };
                    request_currency: { value: string; currency: string };
                };
            };
        };
    };
}

export interface PropertyRoom {
    id: string;
    room_name: string;
    rates: RoomRate[];
}

export interface PropertyAvailabilityResult {
    property_id: string;
    rooms: PropertyRoom[];
    links: ExpediaStatusLinks;
    status: 'available' | 'partially_available' | 'sold_out';
}

// ─── CONTENT API — Statički podaci o nekretninama ─────────────────────────────

export interface PropertyContentRequest {
    property_id?: string[];
    language: string;          // 'en-US', 'sr-SP' itd.
    supply_source?: 'vrbo';
    business_model?: 'expedia_collect' | 'property_collect';
    include?: string[];        // 'all', 'amenities', 'images', 'rooms', itd.
}

export interface PropertyImage {
    caption: string;
    hero_image: boolean;
    category: number;
    links: {
        [size: string]: {
            method: string;
            href: string;
        };
    };
}

export interface PropertyAddress {
    line_1: string;
    line_2?: string;
    city: string;
    state_province_code?: string;
    state_province_name?: string;
    postal_code?: string;
    country_code: string;
    obfuscation_required: boolean;
    localized?: {
        links: {
            [locale: string]: ExpediaLink;
        };
    };
}

export interface PropertyAmenity {
    id: string;
    name: string;
    categories?: string[];
}

export interface PropertyRoomContent {
    id: string;
    name: string;
    descriptions?: {
        overview?: { attributes: { paragraph?: string[] } };
    };
    amenities?: { [amenityId: string]: PropertyAmenity };
    images?: PropertyImage[];
    bed_groups?: {
        [bedGroupId: string]: {
            id: string;
            description: string;
            configuration: Array<{
                type: string;
                size: string;
                quantity: number;
            }>;
        };
    };
    area?: {
        square_feet?: number;
        square_meters?: number;
    };
    views?: string[];
    occupancy?: {
        max_allowed: { total: number; adults: number; children: number };
        age_categories?: { [categoryCode: string]: { name: string; minimum_age?: number } };
    };
}

export interface PropertyContentResult {
    property_id: string;
    name: string;
    address: PropertyAddress;
    ratings?: {
        property?: { rating: string; type: string };
        guest?: { count: number; overall: string; cleanliness: string; service: string; comfort: string; condition: string; location: string; neighborhood: string; quality: string; value: string; amenities: string; recommendation_percent: string };
    };
    location?: {
        coordinates?: { latitude: number; longitude: number };
    };
    phone?: string;
    fax?: string;
    category?: { id: string; name: string };
    business_model?: {
        expedia_collect: boolean;
        property_collect: boolean;
    };
    checkin?: {
        begin_time?: string;
        end_time?: string;
        instructions?: string;
        special_instructions?: string;
        min_age?: number;
    };
    checkout?: {
        time?: string;
    };
    fees?: {
        mandatory?: string;
        optional?: string;
    };
    policies?: {
        know_before_you_go?: string;
    };
    attributes?: {
        general?: { [id: string]: { id: string; name: string } };
        pets?: { [id: string]: { id: string; name: string } };
    };
    amenities?: { [id: string]: PropertyAmenity };
    images?: PropertyImage[];
    onsite_payments?: {
        currency?: string;
        types?: { [type: string]: { id: string; name: string } };
    };
    rooms?: { [roomId: string]: PropertyRoomContent };
    rates?: {
        [rateId: string]: { id: string; amenities: { [amenityId: string]: PropertyAmenity } };
    };
    dates?: {
        added?: string;
        updated?: string;
    };
    descriptions?: {
        amenities?: string;
        dining?: string;
        renovations?: string;
        national_ratings?: string;
        business_amenities?: string;
        rooms?: string;
        attractions?: string;
        location?: string;
        headline?: string;
        general?: string;
    };
    statistics?: {
        [statId: string]: { id: string; name: string; value: string };
    };
    airports?: {
        preferred?: { iata_airport_code: string };
    };
    themes?: { [id: string]: { id: string; name: string } };
    all_inclusive?: {
        all_rate_plans: boolean;
        some_rate_plans: boolean;
        details: string;
    };
    tax_id?: string;
    chain?: { id: string; name: string };
    brand?: { id: string; name: string };
    spoken_languages?: { [code: string]: { id: string; name: string } };
    multi_unit?: boolean;
    payment_registration_recommended?: boolean;
    vacation_rental_details?: {
        registry_number?: string;
        private_host?: boolean;
        property_manager?: { name: string; links?: { image?: ExpediaLink } };
        rental_agreement?: { links?: { rental_agreement?: ExpediaLink } };
        house_rules?: string[];
        amenities?: { [id: string]: PropertyAmenity };
        unit_configurations?: Array<{ unit: string; floor?: number; bedrooms?: number; bathrooms?: number }>;
    };
    supply_source?: string;
}

// ─── PRICE CHECK — Provera cene przed rezervacijom ───────────────────────────

export interface PriceCheckRequest {
    token: string;             // Token iz bed_group price_check linka
    customer_ip?: string;
    customer_session_id?: string;
}

export interface PriceCheckResponse {
    status: 'matched' | 'price_changed' | 'sold_out';
    links?: {
        book?: ExpediaLink;
    };
    occupancy_pricing?: {
        [occupancy: string]: {
            totals: {
                inclusive: {
                    billable_currency: { value: string; currency: string };
                    request_currency: { value: string; currency: string };
                };
                exclusive: {
                    billable_currency: { value: string; currency: string };
                    request_currency: { value: string; currency: string };
                };
            };
        };
    };
    cancel_penalties?: Array<{
        start?: string;
        end?: string;
        nights_charged?: number;
        amount?: string;
        currency?: string;
        percent?: string;
    }>;
    card_on_file_limit?: { value: string; currency: string };
    refund_with_holding_amount?: { value: string; currency: string };
}

// ─── BOOKING API — Kreiranje rezervacije ──────────────────────────────────────

export interface PaymentCard {
    card_type: 'VI' | 'CA' | 'AX' | 'DS' | 'JC' | 'UP' | 'TP';  // Visa, Mastercard, Amex itd.
    card_number: string;
    expiration_month: string;   // MM
    expiration_year: string;    // YYYY
    security_code: string;
    one_time_use_card?: boolean;
}

export interface BillingContact {
    given_name: string;
    family_name: string;
    email: string;
    phone: string;
    address: {
        line_1: string;
        line_2?: string;
        city: string;
        state_province_code?: string;
        postal_code?: string;
        country_code: string;
    };
}

export interface BookingRequest {
    affiliate_reference_id: string;     // Vaša interna referenca (do 28 znakova)
    hold?: boolean;                     // Ako true, samo rezerviše bez naplate
    email: string;
    phone?: {
        country_code: string;
        number: string;
        extension?: string;
    };
    rooms: Array<{
        given_name: string;
        family_name: string;
        smoking?: boolean;
        special_request?: string;
        loyalty_id?: string;
    }>;
    payments?: Array<{
        type: 'affiliate_collect';
        billing_contact: BillingContact;
        card: PaymentCard;
        enrollment?: {
            reward_program_account_number?: string;
        };
    }>;
    affiliate_metadata?: string;        // Opcionalni slobodni tekst
    tax_registration_number?: string;
    traveler_handling_instructions?: string;
}

export interface BookingResponse {
    itinerary_id: string;
    reservation_id?: string;
    status: 'pending' | 'booked' | 'cancelled';
    links?: {
        retrieve?: ExpediaLink;
        cancel?: ExpediaLink;
        change_room?: ExpediaLink;
        payment_sessions?: ExpediaLink;
    };
}

// ─── ITINERARY MANAGEMENT — Upravljanje rezervacijom ─────────────────────────

export interface ItineraryRoom {
    id: string;
    confirmation_id?: {
        expedia?: string;
        property?: string;
    };
    bed_group_id?: string;
    checkin: string;
    checkout: string;
    number_of_adults: number;
    child_ages: number[];
    given_name: string;
    family_name: string;
    status: {
        current: 'pending' | 'booked' | 'cancelled' | 'failed';
        pending?: 'commit' | 'cancel';
    };
    special_request?: string;
    smoking?: boolean;
    loyalty_id?: string;
    rate?: {
        id: string;
        amenities?: { [id: string]: PropertyAmenity };
        links?: { payment_options?: ExpediaLink };
    };
    links?: {
        cancel?: ExpediaLink;
    };
}

export interface ItineraryRetrieveResponse {
    itinerary_id: string;
    property_id: string;
    links?: ExpediaStatusLinks;
    rooms: ItineraryRoom[];
    billing_contact?: BillingContact;
    adjustment?: {
        total_adjustment_amount: number;
        currency: string;
    };
    creation_date_time?: string;
    affiliate_reference_id?: string;
    email?: string;
}

// ─── GEOLOCATION — Regioni i lokacije ────────────────────────────────────────

export interface RegionSearchRequest {
    query: string;                          // Ime regiona za pretragu
    language: string;
    include?: 'details' | 'property_ids';
    type?: 'continent' | 'country' | 'province' | 'city' | 'airport' | 'metro_station' | 'point_of_interest' | 'neighborhood' | 'high_level_region' | 'multi_city_vicinity' | 'shopping' | 'train_station';
    limit?: number;
    customer_session_id?: string;
}

export interface RegionResult {
    id: string;
    type: string;
    name: string;
    name_full: string;
    country_code: string;
    country_subdiv_code?: string;
    center?: {
        lat: number;
        lng: number;
    };
    bounding_polygon?: {
        coordinates: number[][][];
    };
    ancestors?: Array<{
        type: string;
        id: string;
        name: string;
        country_code?: string;
        country_subdiv_code?: string;
    }>;
    descendants?: {
        [type: string]: string[];
    };
    property_ids?: string[];
    property_ids_expanded?: string[];
}
