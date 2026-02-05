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
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
        // @ts-ignore
        return import.meta.env[key];
    }
    // @ts-ignore
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
        // @ts-ignore
        return process.env[key];
    }
    return fallback;
};

const SOLVEX_BASE_URL = getEnvVar('VITE_SOLVEX_API_URL', 'https://evaluation.solvex.bg/iservice/integrationservice.asmx');

/**
 * Helper to convert full URL to proxy path in the browser to bypass CORS
 */
function getTargetUrl(url: string): string {
    // If we're in a browser and in development mode, use the Vite proxy
    // @ts-ignore
    if (typeof window !== 'undefined' && (import.meta.env?.DEV || window.location.hostname === 'localhost')) {
        if (url.includes('evaluation.solvex.bg') || url.includes('iservice.solvex.bg')) {
            // We want to keep the PATH of the URL but replace the domain with /api/solvex
            // The proxy rewrite rule in vite.config.ts will stripp /api/solvex and forward the rest
            // So if url is https://iservice.solvex.bg/IntegrationService.asmx
            // We want /api/solvex/IntegrationService.asmx

            const urlObj = new URL(url);
            return `/api/solvex${urlObj.pathname}`;
        }
    }
    return url;
}

const SOLVEX_API_URL = getTargetUrl(SOLVEX_BASE_URL);


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
    params: Record<string, any>
): Promise<T> {
    const soapEnvelope = buildSoapEnvelope(method, params);

    console.log(`[Solvex SOAP] Calling method: ${method}`);
    console.log('[Solvex SOAP] Request:', soapEnvelope);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort('Timeout'), 30000); // 30 seconds timeout per request

    try {
        const response = await fetch(SOLVEX_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/xml; charset=utf-8',
                'SOAPAction': `"${method.startsWith('http') ? method : `http://www.megatec.ru/${method}`}"`
            },
            body: soapEnvelope,
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        const xmlText = await response.text();

        if (!response.ok) {
            console.error('[Solvex SOAP] Error Body:', xmlText);

            if (response.status === 403) {
                throw new Error(`Solvex API Forbidden (403). Moguće je da su kredencijali ispravni, ali IP adresa nije na beloj listi ili nemate pristup ovom metodu.`);
            }
            if (response.status === 401) {
                throw new Error(`Solvex Auth Unauthorized (401). Molimo proverite VITE_SOLVEX_LOGIN i PASSWORD.`);
            }

            // Return BOTH request and response for debugging
            throw new Error(`Solvex API Error (${response.status}): ${response.statusText}\n\n--- REQUEST ---\n${soapEnvelope}\n\n--- RESPONSE ---\n${xmlText}`);
        }

        console.log('[Solvex SOAP] Response:', xmlText);
        const result = parseSoapResponse<T>(xmlText);
        return result;
    } catch (error) {
        clearTimeout(timeoutId);
        console.error(`[Solvex SOAP] Error in ${method}:`, error);
        console.error('[Solvex SOAP] Failed Request Payload:', soapEnvelope);

        // RETHROW without formatting if it already has details
        if (error instanceof Error && error.message.includes('--- REQUEST ---')) {
            throw error;
        }
        if (error instanceof Error && (error.name === 'AbortError' || error.message.toLowerCase().includes('aborted'))) {
            throw new Error('Solvex sistem nije odgovorio na vreme (Timeout). Molimo pokušajte ponovo ili suzite kriterijume pretrage.');
        }

        // If it's already a clean error, rethrow it
        if (error instanceof Error && !error.message.includes('--- REQUEST ---')) {
            throw error;
        }

        throw new Error(`Konekcija sa Solvex sistemom nije uspela (${error instanceof Error ? error.message : 'Network Error'}). Proverite internet konekciju ili VPN.`);
    }
}

/**
 * Format date for Solvex API (YYYY-MM-DDTHH:mm:ss)
 */
export function formatSolvexDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
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
}): Record<string, any> {
    // STRICT ORDER REQUIRED BY WSDL s:sequence for SearchHotelServiceRequest
    const request: any = {
        'PageSize': 500,
        'RowIndexFrom': 0,
        'DateFrom': formatSolvexDate(params.dateFrom),
        'DateTo': formatSolvexDate(params.dateTo)
    };

    // Dynamically add keys only if present to ensure NO TAG is generated for empty lists

    if (params.cityId) {
        request['CityKeys'] = { 'int': [params.cityId] };
    }

    if (params.hotelId) {
        const ids = Array.isArray(params.hotelId) ? params.hotelId : [params.hotelId];
        request['HotelKeys'] = { 'int': ids };
    }

    if (params.childrenAges && params.childrenAges.length > 0) {
        request['Ages'] = { 'int': params.childrenAges };
    }

    // Critical fix: Tariffs must be included to get results (0 = Default, 1993 = Standard)
    request['Tariffs'] = { 'int': params.tariffs || [0, 1993] };

    request['Pax'] = params.adults + (params.children || 0);
    request['Mode'] = 0;
    request['ResultView'] = 1; // 1 = sorting by daily price with grouping by hotels
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
