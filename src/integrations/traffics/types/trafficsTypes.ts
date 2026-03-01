// ============================================================
// TRAFFICS IBE — Feeds API v3 — TypeScript Types
// Docs: https://docs.traffics.de/feeds/v3
//       https://ibe-dokumentation.traffics.de
// Base URL: https://ibe.traffics.de/api/v3/rest/feeds
// Auth: Query param ?licence=<16-digit-license>
// ============================================================

// ─── Autentifikacija ────────────────────────────────────────────────────────────

export interface TrafficsCredentials {
    /** 16-cifrani Traffics broj licence */
    licenceNumber: string;
    /** Okruženje — sandbox ima isti BaseURL, ali se koristi test licence */
    environment: 'sandbox' | 'production';
}

// ─── Opšte ─────────────────────────────────────────────────────────────────────

export type TrafficsProductType = 'pauschal' | 'hotelonly';
export type TrafficsSortBy = 'price' | 'category' | 'quality' | 'distance';
export type TrafficsCurrency = 'EUR' | 'USD' | 'GBP' | 'CHF' | 'SEK';
export type TrafficsLanguage = 'de' | 'en' | 'fr' | 'it' | 'es' | 'pl' | 'ru' | 'sr';

// ─── Hotel Search Params ─────────────────────────────────────────────────────

export interface TrafficsHotelSearchParams {
    /** 16-cifrani broj licence (obavezan) */
    licence: string;
    /**
     * Tip produkta:
     * - 'pauschal' — paket aranžman (avion + hotel + transfer)
     * - 'hotelonly' — samo hotel
     * Default: 'pauschal'
     */
    productType?: TrafficsProductType;
    /**
     * Datum pretrage u CSV formatu: fromDate,toDate,duration
     * Primer: "01032026,15032026,7"
     * ALI može i samo fromDate kao broj dana od danas (npr. "10")
     */
    searchDate?: string;
    /** Alternativno — datum polaska: dd.MM.yyyy ili yyyyMMdd */
    fromDate?: string;
    /** Datum povratka: dd.MM.yyyy ili yyyyMMdd */
    toDate?: string;
    /** Trajanje boravka u danima */
    duration?: number;
    /** Broj odraslih (1—8). Default: 2 */
    adults?: number;
    /** Uzrasti dece u CSV formatu: npr. "3,7,12" */
    children?: string;
    /** Region ID (Traffics interni) */
    regionId?: string;
    /** GIATA hotel ID */
    giataId?: string;
    /** Minimalna kategorija (broj zvezdica) */
    category?: number;
    /** Minimalna cena */
    minPrice?: number;
    /** Maksimalna cena */
    maxPrice?: number;
    /** Valuta (default: EUR) */
    currency?: TrafficsCurrency;
    /** Sortiranje */
    sortBy?: TrafficsSortBy;
    /** Stranica (od 0) */
    page?: number;
    /** Broj rezultata po stranici (default: 10) */
    pageSize?: number;
    /** Jezik opisa (default: de) */
    language?: TrafficsLanguage;

    // ─── Parametri za paket (productType=pauschal) ───────────────────
    /**
     * Lista polaznih aerodroma (IATA kodovi, CSV)
     * Primer: "BEG,VIE,MUC"
     * Relevantno samo za productType=pauschal
     */
    departureAirportList?: string;
    /**
     * Lista dolaznih aerodroma (IATA kodovi, CSV)
     * Primer: "PMI,TFS,ZTH"
     */
    arrivalAirportList?: string;
    /** Minimalno vreme polaska (format: HHmm, npr. "0600") */
    minDepartureTime?: string;
    /** Maksimalno vreme polaska (format: HHmm, npr. "2200") */
    maxDepartureTime?: string;
    /** Minimalno vreme povratnog leta (format: HHmm) */
    minReturnTime?: string;
    /** Maksimalno vreme povratnog leta (format: HHmm) */
    maxReturnTime?: string;
    /** Da li paket uključuje transfer (default: false) */
    withTransfer?: boolean;
}

// ─── Let (Flight & Segment) — koristi se u paket aranžmanima ─────────────────

/**
 * Jedan segment leta (jedna direktna ruta bez presedanja)
 * Odgovara Swagger shemi: Segment
 */
export interface TrafficsFlightSegment {
    /** IATA kod polaznog aerodroma */
    departureAirport: string;
    /** Naziv polaznog aerodroma */
    departureAirportName?: string;
    /** IATA kod dolaznog aerodroma */
    arrivalAirport: string;
    /** Naziv dolaznog aerodroma */
    arrivalAirportName?: string;
    /** Datum i vreme polaska (ISO 8601) */
    departureDateTime: string;
    /** Datum i vreme dolaska (ISO 8601) */
    arrivalDateTime: string;
    /** IATA kod avio-kompanije (npr. "LH", "RY", "W6") */
    airlineCode: string;
    /** Naziv avio-kompanije */
    airlineName?: string;
    /** Broj leta (npr. "FR1234") */
    flightNumber?: string;
    /** Trajanje leta u minutima */
    durationMinutes?: number;
    /** Klasa leta */
    cabinClass?: 'economy' | 'premium_economy' | 'business' | 'first';
    /** Da li je direktni let (bez presedanja) */
    isDirect?: boolean;
}

/**
 * Kompletan let (može imati više segmenata pri presedanju)
 * Odgovara Swagger shemi: Flight (koji sadrži listu Segment objekata)
 */
export interface TrafficsFlight {
    /** Tip leta: outbound (odlazak) ili return (povratak) */
    direction: 'outbound' | 'return';
    /** Lista segmenata leta */
    segments: TrafficsFlightSegment[];
    /** Ukupno trajanje putovanja u minutima */
    totalDurationMinutes?: number;
    /** Broj presedanja (0 = direktni let) */
    stops?: number;
    /** Cena leta po osobi (u sklopu paketa) */
    pricePerPerson?: number;
    /** Uključen prtljag (kg) */
    includedBaggageKg?: number;
    /** Ručni prtljag (kg) */
    handBaggageKg?: number;
}

// ─── Transfer ────────────────────────────────────────────────────────────────

export type TrafficsTransferType =
    | 'SHARED_SHUTTLE'    // deljeni minibus
    | 'PRIVATE_TRANSFER'  // privatni transfer
    | 'TAXI'              // taxi
    | 'RENTAL_CAR';       // rent-a-car

export interface TrafficsTransfer {
    type: TrafficsTransferType;
    name?: string;
    /** Cena transfera ukupno (round-trip) */
    price?: number;
    pricePerPerson?: number;
    /** Trajanje transfera (minuti) */
    durationMinutes?: number;
    /** Da li je uključen u cenu paketa */
    included?: boolean;
    description?: string;
}

// ─── Board Types ─────────────────────────────────────────────────────────────

export type TrafficsBoardType =
    | 'RO'   // Room Only
    | 'BB'   // Bed & Breakfast
    | 'HB'   // Half Board — polupansion
    | 'FB'   // Full Board — puni pansion
    | 'AI'   // All Inclusive
    | 'UAI'; // Ultra All Inclusive

export interface TrafficsBoardTypeInfo {
    code: TrafficsBoardType;
    name: string;
}

// ─── Tour Operator (Dobavljač / Agencija) ──────────────────────────────────

/**
 * Tur-operator (dobavljač / agencija) koji prodaje paket aranžman.
 * U Traffics Feeds API odgovara polju `tourOperator` unutar HotelOffer.
 *
 * Primeri operatora u Traffics mreži:
 * TUI, Dertour, Neckermann, Thomas Cook, Aldi Travel, FTI, alltours,
 * Rewe Reisen, Ltur, ITS Coop Travel, Jahn Reisen, Berge & Meer...
 */
export interface TrafficsTourOperator {
    /** Interni kod operatora (npr. "TUI", "DER", "NCK") */
    code: string;
    /** Pun naziv operatora */
    name: string;
    /** Boja brenda (hex) — za prikaz loga */
    brandColor?: string;
    /** URL zvaničnog sajta operatora */
    websiteUrl?: string;
    /** Kratak opis */
    description?: string;
}

// ─── Inclusive / Sadržaji paketa ────────────────────────────────────────────

export interface TrafficsInclusive {
    name: string;
    type?: string;
    description?: string;
}

// ─── HotelOffer — kompletna ponuda (hotel + opciono: let + transfer) ─────────

/**
 * Kompletna ponuda iz Traffics Feeds API
 *
 * - productType=hotelonly: flight i transferList su undefined/prazni
 * - productType=pauschal: sadrži bestPriceFlight i/ili transferList
 *
 * Odgovara Swagger shemi: HotelOffer
 */
export interface TrafficsHotelOffer {
    code: string;
    personPrice?: number;
    totalPrice?: number;
    currency?: string;
    travelDate?: {
        departureDate: string;
        returnDate: string;
        nights: number;
    };
    hotel?: {
        code: string;
        name: string;
        category: number;
        giataId?: string;
        location?: TrafficsHotelLocation;
    };
    roomType?: {
        code: string;
        name: string;
        description?: string;
    };
    boardType?: TrafficsBoardTypeInfo;
    inclusiveList?: TrafficsInclusive[];
    /** Lista transfera (deo paketa) */
    transferList?: TrafficsTransfer[];
    locatedList?: { name: string; type?: string }[];
    facilityList?: { name: string; category?: string }[];
    /**
     * Najjeftiniji let koji odgovara ovoj ponudi
     * Samo za productType=pauschal
     */
    bestPriceFlight?: TrafficsFlight;
    outboundFlight?: TrafficsFlight;
    returnFlight?: TrafficsFlight;
}

// ─── Airport ─────────────────────────────────────────────────────────────────

export interface TrafficsAirport {
    code: string;
    name?: string;
    city?: string;
    country?: string;
}

export interface TrafficsGiataInfo {
    id: string;
    name?: string;
}

export interface TrafficsHotelLocation {
    latitude?: number;
    longitude?: number;
    address?: string;
    city?: string;
    country?: string;
    countryCode?: string;
}

// ─── Hotel List Item (prošireno za pakete) ────────────────────────────────────

export interface TrafficsHotelListItem {
    code: string;
    name: string;
    category: number;
    location?: TrafficsHotelLocation;
    region?: {
        id: string;
        name: string;
    };
    bestPricePerPerson?: number;
    totalPrice?: number;
    currency?: string;
    airportList?: TrafficsAirport[];
    giata?: TrafficsGiataInfo;
    imageUrl?: string;
    description?: string;
    bookable?: boolean;
    departureDate?: string;
    returnDate?: string;
    nights?: number;
    boardType?: TrafficsBoardTypeInfo;

    // ─── Paket polja (prisutna za productType=pauschal) ──────────────
    /** Tip ponude — hotelonly ili pauschal */
    offerType?: TrafficsProductType;
    /**
     * Najjeftiniji let u sklopu paket ponude
     * Sadrži segmente, polazni/dolazni aerodrom, vreme polaska, aviokompaniju
     */
    bestPriceFlight?: TrafficsFlight;
    /**
     * Lista transfera u sklopu paketa (ako je withTransfer=true)
     */
    transferList?: TrafficsTransfer[];
    /**
     * Ukupna cena paketa (avion + hotel + transfer)
     */
    packageTotalPrice?: number;
    /**
     * Doplata za let po osobi (razlika između paketa i hotelonly)
     */
    flightSurchargePerPerson?: number;
    /**
     * Tur-operator koji nudi ovaj paket.
     * Prikazuje se kao badge/logo na kartici: TUI, Dertour, Neckermann...
     * U realnom API odgovoru ovo je polje `tourOperator` unutar HotelOffer.
     */
    tourOperator?: TrafficsTourOperator;
}

export interface TrafficsHotelSearchResponse {
    totalResultCount: number;
    page?: number;
    pageSize?: number;
    hotelList: TrafficsHotelListItem[];
}

// ─── Top Hotels (per region) ─────────────────────────────────────────────────

export interface TrafficsTopHotelsParams {
    licence: string;
    productType?: TrafficsProductType;
    regionId: string;
    fromDate?: string;
    toDate?: string;
    duration?: number;
    adults?: number;
    children?: string;
    category?: number;
    language?: TrafficsLanguage;
    /** Polazni aerodrom (za paket pretrage) */
    departureAirport?: string;
}

export interface TrafficsTopHotelsResponse {
    totalResultCount: number;
    hotelList: TrafficsHotelListItem[];
}

// ─── Hotel Static Content ─────────────────────────────────────────────────────

export interface TrafficsHotelImage {
    url: string;
    title?: string;
    category?: string;
    width?: number;
    height?: number;
}

export interface TrafficsHotelFacility {
    id: string;
    name: string;
    category?: string;
}

export interface TrafficsHotelRoom {
    code: string;
    name: string;
    description?: string;
    maxOccupancy?: number;
    images?: TrafficsHotelImage[];
}

export interface TrafficsHotelContent {
    giataId: string;
    name: string;
    category: number;
    description?: string;
    descriptionLong?: string;
    location?: TrafficsHotelLocation;
    images?: TrafficsHotelImage[];
    facilities?: TrafficsHotelFacility[];
    rooms?: TrafficsHotelRoom[];
    checkIn?: string;
    checkOut?: string;
    websiteUrl?: string;
    phone?: string;
    email?: string;
    coordinates?: {
        lat: number;
        lng: number;
    };
    chainCode?: string;
    chainName?: string;
}

// ─── IBE Deep Links ───────────────────────────────────────────────────────────

export interface TrafficsDeeplinkParams {
    /**
     * Tip putovanja:
     * - 'pauschalreise' — paket (avion + hotel)
     * - 'hotel' — samo hotel
     * - 'flug' — povratni let
     * - 'oneway' — let u jednom smeru
     */
    travelType: 'pauschalreise' | 'hotel' | 'flug' | 'oneway';
    view: 'regionen' | 'hotels' | 'hotel';
    ibeBaseUrl: string;
    regionList?: string;
    destinationName?: string;
    minCategory?: number;
    searchDate?: string;
    adults?: number;
    children?: string;
    sortBy?: TrafficsSortBy;
    /** Polazni aerodrom (za paket deep linkove, IATA kod) */
    departureAirport?: string;
}

// ─── Service Config ────────────────────────────────────────────────────────────

export interface TrafficsServiceConfig {
    credentials: TrafficsCredentials;
    apiBaseUrl?: string;
    ibeBaseUrl?: string;
    defaultLanguage?: TrafficsLanguage;
    defaultCurrency?: TrafficsCurrency;
}

// ─── Package Summary (helper za UI) ──────────────────────────────────────────

export interface TrafficsPackageSummary {
    offerType: TrafficsProductType;
    hotel: {
        name: string;
        category: number;
        location: string;
        boardType?: string;
        nights: number;
    };
    flight?: {
        departureAirport: string;
        arrivalAirport: string;
        departureDateTime: string;
        returnDateTime?: string;
        airline: string;
        stops: number;
        isDirect: boolean;
    };
    transfer?: {
        included: boolean;
        type?: string;
    };
    pricing: {
        pricePerPerson: number;
        totalPrice: number;
        currency: string;
        flightIncluded: boolean;
        transferIncluded: boolean;
    };
}
