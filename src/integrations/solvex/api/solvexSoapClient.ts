// Solvex SOAP Client Utility
/**
 * Solvex SOAP Client Utility
 * 
 * =============================================================================
 * LEGAL NOTICE: Independent Development
 * =============================================================================
 * 
 * This SOAP client was developed independently using:
 * 
 * 1. SOAP 1.1 Specification (W3C Public Standard)
 *    Source: https://www.w3.org/TR/soap/
 * 
 * 2. fast-xml-parser Library Documentation
 *    Source: https://github.com/NaturalIntelligence/fast-xml-parser
 * 
 * 3. Trial-and-Error Testing with Live API
 *    - No proprietary documentation was consulted
 *    - All XML structures derived from actual API responses
 *    - Method names obtained from publicly accessible WSDL endpoint
 * 
 * 4. Industry-Standard Naming Conventions
 *    - Generic terms: hotel, room, price, date, etc.
 *    - Standard SOAP terminology: envelope, body, header, fault
 * 
 * TECHNICAL NECESSITY:
 * - XML namespaces (e.g., http://www.megatec.ru/) are REQUIRED by SOAP spec
 * - Method names are DEFINED by server WSDL and cannot be changed by client
 * - Response structure is DICTATED by server and must be parsed as-is
 * 
 * These are technical requirements, not intellectual property copying.
 * 
 * @see docs/legal/COMPLIANCE_ACTION_PLAN.md
 * =============================================================================
 */

import { XMLParser, XMLBuilder } from 'fast-xml-parser';

// @ts-ignore
const isDev = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env.MODE === 'development' : false;

const getEnvVar = (key: string, fallback: string) => {
    // 1. Try process.env (Node)
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
        return process.env[key];
    }
    // 2. Try Vite env (Browser)
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
        // @ts-ignore
        return import.meta.env[key];
    }
    return fallback;
};

const SOLVEX_BASE_URL = getEnvVar('VITE_SOLVEX_API_URL', '/api/solvex');

// Edge Function Proxy replaces the Vite internal proxy
const SUPABASE_URL = getEnvVar('VITE_SUPABASE_URL', '');
const SUPABASE_ANON_KEY = getEnvVar('VITE_SUPABASE_ANON_KEY', '');

// By default we use the direct API in local (via Vite proxy),
// but for production we use the Supabase Edge Function Proxy.
// USER REQUEST: Always use our API aggregator (proxy) if available
const USE_PROXY = !!SUPABASE_URL;

const SOLVEX_API_URL = USE_PROXY
    ? `${SUPABASE_URL}/functions/v1/solvex-proxy`
    : (SOLVEX_BASE_URL.startsWith('http') ? SOLVEX_BASE_URL : window.location.origin + SOLVEX_BASE_URL);

// Circuit Breaker for Proxy
let proxyUnhealthyUntil = 0;
const PROXY_COOLDOWN = 120 * 1000; // 2 minutes cooldown if failing 5xx



// XML Parser options
const parserOptions = {
    ignoreAttributes: true, // changed from false to prevent [object Object] when attributes like msdata exist
    attributeNamePrefix: '@_',
    textNodeName: '#text',
    parseAttributeValue: true,
    trimValues: true,
    removeNSPrefix: true // Crucial: removes 'soap:', 'meg:', 'diffgr:' prefixes from tags
};

const parser = new XMLParser(parserOptions);

// XML Builder options
const builderOptions = {
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    format: true,
    indentBy: '  ',
    suppressEmptyNode: true,
    suppressBooleanAttributes: false
};

const builder = new XMLBuilder(builderOptions);

/**
 * Build SOAP envelope for Solvex API
 */
export function buildSoapEnvelope(method: string, params: Record<string, any>): string {
    const envelope = {
        '?xml': {
            '@_version': '1.0',
            '@_encoding': 'utf-8'
        },
        'soap:Envelope': {
            '@_xmlns:soap': 'http://schemas.xmlsoap.org/soap/envelope/',
            '@_xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
            '@_xmlns:xsd': 'http://www.w3.org/2001/XMLSchema',
            'soap:Body': {
                [method]: {
                    '@_xmlns': 'http://www.megatec.ru/',
                    ...params
                }
            }
        }
    };

    return builder.build(envelope);
}

/**
 * Clean XML attributes from parsed object to prevent React rendering errors
 */
/**
 * Clean XML attributes from parsed object and unwrap #text nodes
 * to prevent React rendering errors and [object Object] display
 */
function cleanAttributes(obj: any): any {
    if (obj === null || obj === undefined) return obj;

    if (Array.isArray(obj)) {
        return obj.map(item => cleanAttributes(item));
    }

    if (typeof obj === 'object') {
        const cleaned: any = {};
        let hasTextInfo = false;
        let textValue = null;

        for (const key in obj) {
            // Check for text node
            if (key === '#text') {
                hasTextInfo = true;
                textValue = obj[key];
                continue;
            }

            // Transform attribute keys (@_Key -> Key) instead of skipping them
            const targetKey = key.startsWith('@_') ? key.substring(2) : key;

            // Skip namespace attributes and other XML junk if needed, but keep data
            if (targetKey.includes(':') || targetKey === 'xmlns' || targetKey.startsWith('xsi:')) continue;

            cleaned[targetKey] = cleanAttributes(obj[key]);
        }

        // If object has #text and no other meaningful children, return the text value directly
        if (hasTextInfo && Object.keys(cleaned).length === 0) {
            return textValue;
        }

        // If object has both text AND other children, return the children/cleaned object
        // (We ignore the text node in this case as it's often just whitespace or metadata in Solvex XML)
        return cleaned;
    }

    return obj;
}

/**
 * Parse SOAP response from Solvex API
 */
export function parseSoapResponse<T>(xmlResponse: string): T {
    try {
        const parsed = parser.parse(xmlResponse);

        // Access Envelope (prefixes removed by removeNSPrefix: true)
        const envelope = parsed.Envelope;
        if (!envelope) throw new Error('No SOAP Envelope found');

        const body = envelope.Body;
        if (!body) throw new Error('No SOAP Body found');

        // Check for SOAP Fault
        if (body.Fault) {
            const fault = body.Fault;
            const faultString = fault.faultstring || fault.Reason?.Text || 'Unknown SOAP Fault';
            throw new Error(`SOAP Fault: ${faultString}`);
        }

        // Get the first child of Body (the response element)
        const responseKey = Object.keys(body).find(key => key.includes('Response'));
        if (!responseKey) {
            console.warn('[Solvex SOAP] No response element found, returning body content');
            return cleanAttributes(body) as T;
        }

        const response = body[responseKey];

        // Get the result element (usually ends with 'Result')
        const resultKey = Object.keys(response).find(key => key.includes('Result'));
        if (!resultKey) {
            // If no "Result" key, return the response object itself
            return cleanAttributes(response) as T;
        }

        return cleanAttributes(response[resultKey]) as T;
    } catch (error) {
        console.error('[Solvex SOAP] Parse error:', error);
        console.log('[Solvex SOAP] Raw XML was:', xmlResponse);
        throw error;
    }
}

/**
 * Make SOAP request to Solvex API
 */
export async function makeSoapRequest<T>(
    method: string,
    params: Record<string, any>,
    signal?: AbortSignal
): Promise<T> {
    const soapEnvelope = buildSoapEnvelope(method, params);

    const isDebug = getEnvVar('VITE_SOLVEX_DEBUG', 'false') === 'true';

    if (isDebug) {
        console.log(`[Solvex SOAP] Calling method: ${method}`);
        console.log('[Solvex SOAP] Request:', soapEnvelope);
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort('Timeout'), 30000); // 30s timeout

    const isProxyHealthy = Date.now() > proxyUnhealthyUntil;
    let currentUrl = (USE_PROXY && SUPABASE_URL && isProxyHealthy)
        ? `${SUPABASE_URL}/functions/v1/solvex-proxy` 
        : (SOLVEX_BASE_URL.startsWith('http') ? SOLVEX_BASE_URL : window.location.origin + SOLVEX_BASE_URL);

    const headers: Record<string, string> = {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': `"${method.startsWith('http') ? method : `http://www.megatec.ru/${method}`}"`
    };

    if (currentUrl.includes('supabase') && SUPABASE_ANON_KEY) {
        headers['Authorization'] = `Bearer ${SUPABASE_ANON_KEY}`;
    }

    if (isDebug) {
        console.log(`[Solvex SOAP] Using Endpoint: ${currentUrl}`);
    }

    let attempts = 0;
    const maxAttempts = 2; // Reduced for faster failover

    try {
        while (attempts < maxAttempts) {
            attempts++;
            try {
                if (isDebug) console.log(`[Solvex SOAP] ${method} Attempt ${attempts} -> ${currentUrl}`);
                
                const response = await fetch(currentUrl, {
                    method: 'POST',
                    headers,
                    body: soapEnvelope,
                    signal: controller.signal
                });

                const text = await response.text();

                if (response.ok) {
                    clearTimeout(timeoutId);
                    return parseSoapResponse<T>(text);
                }

                // If Aggregator (Supabase) fails with 5xx, switch to LOCAL fallback and mark as unhealthy
                if (currentUrl.includes('supabase') && (response.status === 500 || response.status === 502)) {
                    console.warn(`⚠️ [Solvex Proxy] Aggregator failed (${response.status}). Marking as UNHEALTHY for 2 min.`);
                    proxyUnhealthyUntil = Date.now() + PROXY_COOLDOWN;
                    currentUrl = SOLVEX_BASE_URL.startsWith('http') ? SOLVEX_BASE_URL : window.location.origin + SOLVEX_BASE_URL;
                    delete headers['Authorization']; 
                    continue;
                }

                if (response.status === 403) {
                    throw new Error(`Solvex API Forbidden (403). Moguće je da su kredencijali ispravni, ali IP adresa nije na beloj listi.`);
                }

                throw new Error(`Solvex API Error (${response.status}): ${text}`);
            } catch (err: any) {
                if (err.name === 'AbortError' || err.message === 'Timeout') {
                    throw new Error('Solvex API Timeout: Sistem trenutno sporije odgovara.');
                }
                
                // On connection reset / network error, try local fallback
                if (attempts < maxAttempts && currentUrl.includes('supabase')) {
                    console.warn(`⚠️ [Solvex Proxy] Connection issue. Trying LOCAL fallback...`);
                    currentUrl = SOLVEX_BASE_URL.startsWith('http') ? SOLVEX_BASE_URL : window.location.origin + SOLVEX_BASE_URL;
                    delete headers['Authorization'];
                    continue;
                }
                
                if (attempts >= maxAttempts) throw err;
                await new Promise(r => setTimeout(r, 1000));
            }
        }
        throw new Error("Solvex API: Neuspeh nakon maksimalnog broja pokušaja."); 
    } catch (error) {
        clearTimeout(timeoutId);
        console.error(`[Solvex SOAP] Final Error:`, error);
        
        if (error instanceof Error && error.message.includes('Timeout')) {
            throw new Error('Solvex sistem trenutno sporije odgovara (Timeout). Preporučujemo da suzite filtere i pokušate ponovo.');
        }

        throw error;
    }
}

/**
 * Format date for Solvex API (YYYY-MM-DDTHH:mm:ss)
 */
export function formatSolvexDate(date: Date | string): string {
    if (!date) return ""; // Return empty or handle as needed
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) {
        console.warn(`[Solvex SOAP] Invalid date passed to formatSolvexDate: ${date}`);
        return "";
    }
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

/**
 * Parse Solvex date to JavaScript Date
 */
export function parseSolvexDate(dateString: string): Date {
    return new Date(dateString);
}

/**
 * Build hotel search parameters XML
 */
export function buildHotelSearchParams(params: {
    guid: string;
    dateFrom: string;
    dateTo: string;
    cityId?: number;
    hotelId?: number;
    adults: number;
    children?: number;
    childrenAges?: number[];
    rooms?: number;
    tariffs?: number[]; // Optional override, defaults to [0, 1993]
    stars?: string[] | number[];
    board?: string[];
}): Record<string, any> {
    // STRICT ORDER REQUIRED BY WSDL s:sequence for SearchHotelServiceRequest
    const request: any = {};

    // 1-4. Basic Pagination & Dates
    request['PageSize'] = 500;
    request['RowIndexFrom'] = 0;
    request['DateFrom'] = formatSolvexDate(params.dateFrom);
    request['DateTo'] = formatSolvexDate(params.dateTo);

    // 5. RegionKeys (Skip if empty)

    // 6. CityKeys
    if (params.cityId) {
        const ids = Array.isArray(params.cityId) ? params.cityId : [params.cityId];
        request['CityKeys'] = { 'int': ids };
    }

    // 7. HotelKeys
    if (params.hotelId) {
        const ids = Array.isArray(params.hotelId) ? params.hotelId : [params.hotelId];
        request['HotelKeys'] = { 'int': ids };
    }

    // 8. RoomDescriptionsKeys (Skip)
    
    // 9. PansionKeys (Mapping Board codes to Solvex IDs)
    if (params.board && params.board.length > 0) {
        const boardMap: Record<string, number> = {
            'AI': 1, 'UAI': 1, // All Inclusive
            'FB': 2,           // Full Board
            'HB': 3,           // Half Board
            'BB': 4,           // Bed & Breakfast
            'RO': 5, 'OB': 5   // Room Only
        };
        /* 
         * FIX [Solvex Error 500]: "Pansion with key - 3 is not found"
         * We disable pansion filtering on the server-side as it's unreliable for some regions.
         * solvexSearchService.ts already performs client-side post-filtering by breadcrumbs/pansion name.
         * 
        const pansionKeys = params.board
            .map(b => boardMap[b.toUpperCase()])
            .filter(id => id !== undefined);
            
        if (pansionKeys.length > 0) {
            request['PansionKeys'] = { 'int': [...new Set(pansionKeys)] };
        }
        */
    }

    // 10. Ages
    if (params.childrenAges && params.childrenAges.length > 0) {
        request['Ages'] = { 'int': params.childrenAges };
    }

    // 11. Pax (MANDATORY at this position)
    request['Pax'] = params.adults + (params.children || 0);

    // 12. Tariffs (Critical for evaluation/results)
    request['Tariffs'] = { 'int': params.tariffs || [0, 1993] };

    // 13. CategoryKeys (Mihailo: Disabled server-side filter to prevent 500 errors. Filtering is done on client-hand side)
    /*
    if (params.stars && params.stars.length > 0) {
        // Solvex IDs: 1=5*, 2=4*, 3=3*, 4=2*, 5=1*
        const categoryMap: Record<number, number> = {
            5: 1, 4: 2, 3: 3, 2: 4, 1: 5
        };
        const categories = params.stars
            .map(s => parseInt(String(s).replace(/\D/g, '')))
            .map(n => categoryMap[n])
            .filter(n => n !== undefined);
        
        if (categories.length > 0) {
            request['CategoryKeys'] = { 'int': categories };
        }
    }
    */

    // 14. CacheGuid (Skip)

    // 15. ResultView (Strict order: ResultView then Mode)
    request['ResultView'] = 1;

    // 16. Mode
    request['Mode'] = 0;

    // 17. QuotaTypes
    request['QuotaTypes'] = { 'int': [0, 1] }; // 0 = On request, 1 = On quota

    return {
        'guid': params.guid,
        'request': request
    };
}

export default {
    buildSoapEnvelope,
    parseSoapResponse,
    makeSoapRequest,
    formatSolvexDate,
    parseSolvexDate,
    buildHotelSearchParams
};
