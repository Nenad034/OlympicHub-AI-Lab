import { OrchestratorConfig } from './types';

export const SEARCH_ORCHESTRATOR_CONFIG: OrchestratorConfig = {
    priorities: [
        {
            id: 'manual',
            weight: 100, // Top priority: Direct contracts
            enabled: true,
            tags: ['all']
        },
        {
            id: 'charter',
            weight: 90, // Nearly top: Your own flights and allotments
            enabled: true,
            tags: ['all']
        },
        {
            id: 'solvex',
            weight: 80, // Favorized API: Higher weight for specific regions
            enabled: true,
            tags: ['bulgaria', 'greece', 'turkey']
        },
        {
            id: 'amadeus',
            weight: 50, // Standard API
            enabled: true,
            tags: ['worldwide']
        },
        {
            id: 'skyscanner',
            weight: 30, // Low-cost aggregator
            enabled: true,
            tags: ['flights-only']
        },
        {
            id: 'webbeds',
            weight: 40, // Standard bed-bank
            enabled: false, // Currently disabled
            tags: ['worldwide']
        }
    ],
    maxResults: 50,
    preferredCurrency: 'EUR'
};
