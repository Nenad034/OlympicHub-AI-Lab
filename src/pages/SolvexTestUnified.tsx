/**
 * Solvex API - Test Page (Unified Design)
 * 
 * Uses APITestTemplate for consistent design across all API test pages
 */

import React, { useState } from 'react';
import { APITestTemplate, type APITestSection } from '../components/APITestTemplate';
import * as SolvexAuth from '../services/solvex/solvexAuthService';
import * as SolvexDict from '../services/solvex/solvexDictionaryService';
import * as SolvexSearch from '../services/solvex/solvexSearchService';

export const SolvexTest: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [authToken, setAuthToken] = useState<string | null>(null);

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
            label: 'API URL',
            value: '/api/solvex/iservice/integrationservice.asmx',
            type: 'text' as const,
        },
        {
            label: 'Environment',
            value: 'Evaluation',
            type: 'text' as const,
        },
        {
            label: 'Auth Token',
            value: authToken ? true : false,
            type: 'boolean' as const,
        },
    ];

    // Test sections
    const sections: APITestSection[] = [
        {
            id: 'auth',
            title: 'Authentication',
            icon: '🔐',
            tests: [
                {
                    id: 'connect',
                    label: 'Connect',
                    description: 'Get authentication token',
                    onClick: () => runTest('Connect', async () => {
                        const response = await SolvexAuth.connect();
                        if (response.success && response.data) {
                            setAuthToken(response.data);
                            return {
                                success: true,
                                token: response.data.substring(0, 20) + '...',
                                message: 'Token obtained successfully',
                            };
                        }
                        throw new Error(response.error || 'Failed to connect');
                    }),
                },
                {
                    id: 'refresh',
                    label: 'Refresh Token',
                    description: 'Refresh authentication token',
                    onClick: () => runTest('Refresh Token', async () => {
                        const response = await SolvexAuth.refreshToken();
                        if (response.success && response.data) {
                            setAuthToken(response.data);
                            return {
                                success: true,
                                token: response.data.substring(0, 20) + '...',
                                message: 'Token refreshed successfully',
                            };
                        }
                        throw new Error(response.error || 'Refresh failed');
                    }),
                },
                {
                    id: 'disconnect',
                    label: 'Disconnect',
                    description: 'Clear authentication token',
                    onClick: () => runTest('Disconnect', async () => {
                        SolvexAuth.clearToken();
                        setAuthToken(null);
                        return {
                            success: true,
                            message: 'Token cleared',
                        };
                    }),
                },
            ],
        },
        {
            id: 'dictionary',
            title: 'Dictionary Tests',
            icon: '📚',
            tests: [
                {
                    id: 'get-cities',
                    label: 'Get Cities (Bulgaria)',
                    description: 'Fetch cities for Bulgaria',
                    onClick: () => runTest('Get Cities', async () => {
                        const response = await SolvexDict.getCities(4);
                        if (response.success && response.data) {
                            const bansko = response.data.find((c: any) => c.name.toLowerCase().includes('bansko'));
                            const sunny = response.data.find((c: any) => c.name.toLowerCase().includes('sunny'));
                            return {
                                count: response.data.length,
                                bansko: bansko?.id,
                                sunnyBeach: sunny?.id,
                                sample: response.data.slice(0, 5),
                            };
                        }
                        throw new Error(response.error || 'Fetch failed');
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
                    id: 'search-hotels',
                    label: 'Test Search (Bansko)',
                    description: 'Search hotels in Bansko',
                    onClick: () => runTest('Search Hotels', async () => {
                        const response = await SolvexSearch.searchHotels({
                            dateFrom: '2026-02-15',
                            dateTo: '2026-02-22',
                            adults: 2,
                            cityId: 9,
                        });
                        if (response.success && response.data) {
                            return {
                                count: response.data.length,
                                firstHotel: response.data[0]?.hotel?.name || 'N/A',
                                sample: response.data.slice(0, 3),
                            };
                        }
                        throw new Error(response.error || 'Search failed');
                    }),
                },
            ],
        },
    ];

    return (
        <APITestTemplate
            apiName="Solvex API - Test Suite"
            provider="B&A e-Travel SA (Master-Interlook)"
            protocol="SOAP/XML"
            authType="Token"
            accentColor="#e91e63"
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

export default SolvexTest;
