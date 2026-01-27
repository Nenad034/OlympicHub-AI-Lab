// Open Greece API Configuration
// Environment variables for Open Greece API

export const OPENGREECE_CONFIG = {
    // API Endpoints
    PULL_ENDPOINT: 'https://online.open-greece.com/nsCallWebServices/handlerequest.aspx',
    PUSH_ENDPOINT: 'https://online.open-greece.com/nsCallWebService_Push/handlerequest.aspx',

    // Authentication
    USERNAME: import.meta.env.VITE_OPENGREECE_USERNAME,
    PASSWORD: import.meta.env.VITE_OPENGREECE_PASSWORD,

    // FTP (for future use)
    FTP_HOST: 'ftp.open-greece.com',
    FTP_PORT: 21,
    FTP_USERNAME: import.meta.env.VITE_OPENGREECE_FTP_USERNAME,
    FTP_PASSWORD: import.meta.env.VITE_OPENGREECE_FTP_PASSWORD,

    // OTA Standard
    OTA_NAMESPACE: 'http://www.opentravel.org/OTA/2003/05',
    OTA_VERSION: '1.0',

    // Settings
    USE_MOCK: import.meta.env.VITE_OPENGREECE_USE_MOCK === 'true',
    TIMEOUT: 30000, // 30 seconds
};

// Helper to create Basic Auth header
export function getBasicAuthHeader(): string {
    const credentials = `${OPENGREECE_CONFIG.USERNAME}:${OPENGREECE_CONFIG.PASSWORD}`;
    return `Basic ${btoa(credentials)}`;
}

// Helper to generate timestamp
export function getOTATimestamp(): string {
    return new Date().toISOString().slice(0, 19); // YYYY-MM-DDTHH:mm:ss
}

// Helper to generate unique EchoToken
export function generateEchoToken(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Validate credentials on module load
if (!OPENGREECE_CONFIG.USERNAME || !OPENGREECE_CONFIG.PASSWORD) {
    console.error(
        '[OpenGreece Config] CRITICAL: OpenGreece credentials not configured!\n' +
        'Please set VITE_OPENGREECE_USERNAME and VITE_OPENGREECE_PASSWORD in your .env file.\n' +
        'See .env.example for template.'
    );
}

if (!OPENGREECE_CONFIG.FTP_USERNAME || !OPENGREECE_CONFIG.FTP_PASSWORD) {
    console.warn(
        '[OpenGreece Config] WARNING: OpenGreece FTP credentials not configured.\n' +
        'FTP functionality will not be available until credentials are set in .env file.'
    );
}

