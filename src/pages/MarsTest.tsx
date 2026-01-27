/**
 * Mars API V1 - Test Page (Unified Design)
 * 
 * Uses APITestTemplate for consistent design across all API test pages
 */

import React, { useState } from 'react';
import { APITestTemplate, type APITestSection } from '../components/APITestTemplate';
import { marsAuthService } from '../services/mars/marsAuthService';
import { marsContentService } from '../services/mars/marsContentService';
import { marsPriceCalculator } from '../services/mars/marsPriceCalculator';
import { MARS_CONFIG } from '../services/mars/marsConstants';

export const MarsTest: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const runTest = async (testName: string, testFn: () => Promise<any>) => {
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            console.log(`\n========== ${testName} ==========`);
            const data = await testFn();
            setResult(data);
            console.log('Success:', data);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setError(errorMessage);
            console.error('Error:', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Configuration items
    const configItems = [
        {
            label: 'Base URL',
            value: MARS_CONFIG.BASE_URL,
            type: 'text' as const,
        },
        {
            label: 'Mock URL',
            value: MARS_CONFIG.MOCK_URL,
            type: 'text' as const,
        },
        {
            label: 'Use Mock',
            value: MARS_CONFIG.USE_MOCK,
            type: 'boolean' as const,
        },
        {
            label: 'Has Credentials',
            value: !!(MARS_CONFIG.USERNAME && MARS_CONFIG.PASSWORD),
            type: 'boolean' as const,
        },
    ];

    // Test sections
    const sections: APITestSection[] = [
        {
            id: 'auth',
            title: 'Authentication Tests',
            icon: '🔐',
            tests: [
                {
                    id: 'auth-status',
                    label: 'Get Auth Status',
                    description: 'Check authentication configuration',
                    onClick: () => runTest('Auth Status', async () => marsAuthService.getAuthStatus()),
                },
                {
                    id: 'test-connection',
                    label: 'Test Connection',
                    description: 'Test API connectivity',
                    onClick: () => runTest('Test Connection', () => marsAuthService.testConnection()),
                },
            ],
        },
        {
            id: 'content',
            title: 'Content Tests',
            icon: '📋',
            tests: [
                {
                    id: 'get-index',
                    label: 'Get Index (All IDs)',
                    description: 'Fetch all accommodation IDs',
                    onClick: () => runTest('Get Index', async () => {
                        const index = await marsContentService.getIndex();
                        return {
                            count: index.length,
                            sample: index.slice(0, 5),
                            all: index,
                        };
                    }),
                },
                {
                    id: 'get-details',
                    label: 'Get Details (First Accommodation)',
                    description: 'Fetch details for first accommodation',
                    onClick: () => runTest('Get Details', async () => {
                        const index = await marsContentService.getIndex();
                        if (index.length === 0) {
                            throw new Error('No accommodations found in index');
                        }
                        const firstId = index[0].object.id;
                        const details = await marsContentService.getDetails(firstId);
                        return { id: firstId, details };
                    }),
                },
                {
                    id: 'get-all',
                    label: 'Get All Accommodations',
                    description: 'Fetch all accommodations with details',
                    onClick: () => runTest('Get All Accommodations', async () => {
                        const accommodations = await marsContentService.getAllAccommodations();
                        return {
                            count: accommodations.length,
                            sample: accommodations.slice(0, 3).map((acc) => ({
                                id: acc.id,
                                name: acc.name,
                                place: acc.location.place,
                                unitsCount: acc.units.length,
                            })),
                        };
                    }),
                },
            ],
        },
        {
            id: 'search',
            title: 'Search Tests',
            icon: '🔍',
            tests: [
                {
                    id: 'search-place',
                    label: 'Search by Place (Pula)',
                    description: 'Search accommodations in Pula',
                    onClick: () => runTest('Search by Place', async () => {
                        const results = await marsContentService.searchByPlace('Pula');
                        return {
                            query: 'Pula',
                            count: results.length,
                            results: results.slice(0, 3),
                        };
                    }),
                },
                {
                    id: 'search-name',
                    label: 'Search by Name (API)',
                    description: 'Search accommodations by name',
                    onClick: () => runTest('Search by Name', async () => {
                        const results = await marsContentService.searchByName('API');
                        return {
                            query: 'API',
                            count: results.length,
                            results: results.slice(0, 3),
                        };
                    }),
                },
            ],
        },
        {
            id: 'pricing',
            title: 'Price Calculation Tests',
            icon: '💰',
            tests: [
                {
                    id: 'calculate-price',
                    label: 'Calculate Price (Sample Unit)',
                    description: 'Test price calculator with sample data',
                    onClick: () => runTest('Calculate Price', async () => {
                        const index = await marsContentService.getIndex();
                        if (index.length === 0) {
                            throw new Error('No accommodations found');
                        }
                        const accommodation = await marsContentService.getDetails(index[0].object.id);
                        if (!accommodation.units || accommodation.units.length === 0) {
                            throw new Error('No units found in accommodation');
                        }
                        const unit = accommodation.units[0];
                        const params = {
                            unitId: unit.id,
                            checkIn: '2026-07-01',
                            checkOut: '2026-07-08',
                            adults: 2,
                            children: 1,
                            childrenAges: [8],
                        };
                        const calculation = marsPriceCalculator.calculatePrice(
                            unit,
                            accommodation.commonItems,
                            params
                        );
                        return {
                            accommodation: accommodation.name,
                            unit: unit.name,
                            params,
                            calculation,
                        };
                    }),
                },
            ],
        },
        {
            id: 'cache',
            title: 'Cache Tests',
            icon: '💾',
            tests: [
                {
                    id: 'cache-stats',
                    label: 'Get Cache Stats',
                    description: 'View cache statistics',
                    onClick: () => runTest('Cache Stats', () => Promise.resolve(marsContentService.getCacheStats())),
                },
                {
                    id: 'clear-cache',
                    label: 'Clear Cache',
                    description: 'Clear all cached data',
                    onClick: () => runTest('Clear Cache', () => {
                        marsContentService.clearCache();
                        return Promise.resolve({ message: 'Cache cleared successfully' });
                    }),
                },
            ],
        },
    ];

    return (
        <APITestTemplate
            apiName="Mars API V1 - Test Suite"
            provider="Neolab"
            protocol="REST/JSON"
            authType="Basic"
            accentColor="#dc2626"
            configItems={configItems}
            sections={sections}
            loading={loading}
            result={result}
            error={error}
            onClearResults={() => {
                setResult(null);
                setError(null);
            }}
        />
    );
};

export default MarsTest;
