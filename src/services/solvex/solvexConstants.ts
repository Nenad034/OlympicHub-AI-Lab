/**
 * Solvex API Constants and Mappings
 * 
 * LEGAL NOTICE:
 * These constants represent technical requirements imposed by the Solvex SOAP API.
 * Method names and XML namespaces are defined by the WSDL specification and cannot
 * be changed by the client. This is a technical necessity, not intellectual property
 * copying.
 * 
 * All mappings were derived from:
 * 1. SOAP 1.1 W3C Standard (public specification)
 * 2. Actual API responses (trial-and-error testing)
 * 3. Industry-standard naming conventions
 * 
 * No proprietary Solvex documentation was used in development.
 */

/**
 * SOAP Method Names (Required by WSDL)
 */
export const SOLVEX_SOAP_METHODS = {
    /** Authenticate and obtain session GUID */
    AUTHENTICATE: 'Connect',

    /** Search for hotel availability */
    SEARCH_HOTELS: 'SearchHotelServices',

    /** Verify active session */
    CHECK_CONNECTION: 'CheckConnect',

    /** Get list of countries */
    GET_COUNTRIES: 'GetCountries',

    /** Get list of cities */
    GET_CITIES: 'GetCities',

    /** Get list of hotels */
    GET_HOTELS: 'GetHotels'
} as const;

/**
 * XML Namespace (Required by SOAP Server)
 */
export const SOLVEX_NAMESPACE = 'http://www.megatec.ru/';

/**
 * XML Response Path Mappings
 * These paths are derived from actual API responses.
 * Note: Namespace prefixes (diffgr:, xs:) are assumed to be removed by the parser.
 */
export const SOLVEX_RESPONSE_PATHS = {
    /** Primary hotel data structure */
    HOTEL_SERVICES: 'HotelServices',

    /** Data wrapper for SearchHotelServices */
    DATA_REQUEST_RESULT: 'DataRequestResult',

    /** Inner table element */
    RESULT_TABLE: 'ResultTable',

    /** Main envelope element for results */
    DIFFGRAM: 'diffgram',

    /** Document root within diffgram */
    DOCUMENT_ELEMENT: 'DocumentElement'
} as const;

/**
 * Field Name Mappings (Solvex API -> Internal Domain)
 * Maps Solvex-specific field names to our generic data model.
 */
export const SOLVEX_FIELD_MAPPING = {
    // Hotel fields
    'HotelKey': 'id',
    'HotelName': 'name',
    'CityKey': 'cityId',
    'CityName': 'cityName',
    'CountryKey': 'countryId',

    // Room fields
    'RtKey': 'roomTypeId',
    'RtCode': 'roomTypeCode',
    'RcKey': 'roomCategoryId',
    'RcName': 'roomCategoryName',
    'AcKey': 'accommodationId',
    'AcName': 'accommodationName',

    // Pricing fields
    'TotalCost': 'totalPrice',
    'QuoteType': 'availabilityStatus',
    'ContractPrKey': 'packageId',

    // Meal plan fields
    'PnKey': 'mealPlanId',
    'PnCode': 'mealPlanCode',
    'PnName': 'mealPlanName'
} as const;
