/**
 * OTA Standard Error Decoder
 * Based on OTA (Open Travel Alliance) specifications used by MTS Globe and other major providers.
 */

export interface OTAError {
    code: string;
    description: string;
    category: 'Application' | 'Business' | 'System' | 'Authentication' | 'Inventory';
    recommendation: string;
}

const OTA_ERROR_MAP: Record<string, OTAError> = {
    '1': { code: '1', description: 'Unknown Error', category: 'System', recommendation: 'Retry once, then contact provider support.' },
    '320': { code: '320', description: 'Invalid XML', category: 'Application', recommendation: 'Check request syntax and character encoding.' },
    '397': { code: '397', description: 'System busy', category: 'System', recommendation: 'Wait 30-60 seconds before retrying.' },
    '450': { code: '450', description: 'Invalid Currency', category: 'Business', recommendation: 'Verify currency code (ISO 4217).' },
    '497': { code: '497', description: 'Authentication failed', category: 'Authentication', recommendation: 'Check API Keys and IP Whitelisting.' },
    '500': { code: '500', description: 'Internal Provider Error', category: 'System', recommendation: 'Switch to secondary provider if available.' },
    '701': { code: '701', description: 'No Availability', category: 'Inventory', recommendation: 'No action needed, inform the client.' },
    '400': { code: '400', description: 'Invalid dates', category: 'Business', recommendation: 'Ensure check-in is before check-out and not in the past.' },
};

export const otaErrorDecoder = {
    /**
     * Translates a raw provider error code into a human-readable OTA insight
     */
    decode(code: string): OTAError {
        return OTA_ERROR_MAP[code] || {
            code,
            description: 'Unmapped Provider Error',
            category: 'System',
            recommendation: 'Check provider logs for details.'
        };
    }
};
