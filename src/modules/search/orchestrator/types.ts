export type ProviderId = 'manual' | 'charter' | 'solvex' | 'amadeus' | 'skyscanner' | 'webbeds';

export interface ProviderPriority {
    id: ProviderId;
    weight: number; // Higher is better (e.g., 100 for manual, 50 for favored API, 10 for others)
    enabled: boolean;
    tags?: string[]; // e.g., ['bulgaria', 'greece'] to increase weight for these regions
}

export interface ProviderRef {
    id: ProviderId;
    hotelKey: string;  // The raw key/ID from this specific provider
    price: number;     // Price from this specific provider
}

export interface UnifiedResult {
    id: string;
    hotelId?: string;
    provider: ProviderId;
    name: string;
    price: number;
    currency: string;
    priority: number; // The weight assigned by the engine
    isPrime: boolean; // Manual or specifically favored
    images: string[];
    description: string;
    stars: number;
    location: {
        city: string;
        country: string;
    };
    category?: string;
    amenities?: string[];
    
    // Failover Logic (Critical for silent booking recovery)
    primaryProvider: ProviderRef;    // The provider shown to the user
    failoverProvider?: ProviderRef;  // Silent backup if primary fails at booking time
}

export interface OrchestratorConfig {
    priorities: ProviderPriority[];
    maxResults: number;
    preferredCurrency: string;
}
