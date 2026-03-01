/**
 * GIATA Multicodes & Drive API Types
 */

// --- Multicodes API ---

export interface GiataMulticodesRequest {
    providerCodes: {
        provider: string; // e.g., 'solvex', 'mtsglobe', 'travelgate'
        code: string;     // e.g., '12345'
    }[];
}

export interface GiataMulticodesResponse {
    hotels: {
        giataId: number;
        providerCodes: {
            provider: string;
            code: string;
        }[];
    }[];
    errors?: any[];
}

export interface GiataMatchResult {
    giataId: number;
    name: string;
    destination: string;
    country: string;
    confidence: number; // 0-100%
}

// --- Drive API (Content) ---

export interface GiataDriveRequest {
    giataId: number;
    language?: string; // e.g., 'en', 'sr'
}

export interface GiataImage {
    url: string;
    heroImage: boolean;
    category?: string;
}

export interface GiataTextContent {
    language: string;
    description: string;
    amenities: string[];
}

export interface GiataDriveResponse {
    giataId: number;
    name: string;
    category: number; // Star rating (1-5)
    address: {
        street: string;
        city: string;
        zip: string;
        country: string;
        coordinates: {
            lat: number;
            lng: number;
        };
    };
    images: GiataImage[];
    texts: GiataTextContent[];
}
