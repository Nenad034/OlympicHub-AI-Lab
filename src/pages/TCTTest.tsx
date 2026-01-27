/**
 * TCT API - Test Page (Unified Design)
 * 
 * Uses APITestTemplate for consistent design across all API test pages
 */

import React, { useState } from 'react';
import { APITestTemplate, type APITestSection } from '../components/APITestTemplate';

// Mock TCT API functions (replace with real implementation)
const tctApi = {
    testConnection: async () => {
        await new Promise(resolve => setTimeout(resolve, 1500));
        return {
            status: 'connected',
            message: 'Connection successful! TCT API is reachable.',
            timestamp: new Date().toISOString(),
        };
    },

    searchHotels: async (destination: string) => {
        await new Promise(resolve => setTimeout(resolve, 2500));
        return {
            destination,
            count: 234,
            cheapest: { price: 45, currency: 'USD' },
            luxury: { name: 'Burj Al Arab', price: 1200, currency: 'USD' },
        };
    },

    testMultiCurrency: async () => {
        await new Promise(resolve => setTimeout(resolve, 2000));
        return {
            rates: {
                'USD_EUR': 0.92,
                'USD_RSD': 110.50,
                'EUR_RSD': 120.15,
            },
            message: 'Currency conversion working',
        };
    },

    globalSearch: async () => {
        await new Promise(resolve => setTimeout(resolve, 3000));
        return {
            countries: 47,
            topDestinations: [
                { country: 'Thailand', hotels: 1234 },
                { country: 'Spain', hotels: 987 },
                { country: 'Greece', hotels: 765 },
            ],
        };
    },
};

export const TCTTest: React.FC = () => {
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
            label: 'API URL',
            value: 'https://imc-dev.tct.travel/api/v1',
            type: 'text' as const,
        },
        {
            label: 'Auth Method',
            value: 'Basic Auth (Embedded)',
            type: 'text' as const,
        },
        {
            label: 'Status',
            value: true,
            type: 'boolean' as const,
        },
    ];

    // Test sections
    const sections: APITestSection[] = [
        {
            id: 'connection',
            title: 'Connection Tests',
            icon: '🔌',
            tests: [
                {
                    id: 'test-connection',
                    label: 'Test Connection',
                    description: 'Test TCT API connectivity',
                    onClick: () => runTest('Test Connection', () => tctApi.testConnection()),
                },
            ],
        },
        {
            id: 'search',
            title: 'Search Tests',
            icon: '🔍',
            tests: [
                {
                    id: 'hotel-search',
                    label: 'Test Hotel Search (Dubai)',
                    description: 'Search hotels in Dubai',
                    onClick: () => runTest('Hotel Search', () => tctApi.searchHotels('Dubai')),
                },
                {
                    id: 'global-search',
                    label: 'Test Global Search',
                    description: 'Search worldwide destinations',
                    onClick: () => runTest('Global Search', () => tctApi.globalSearch()),
                },
            ],
        },
        {
            id: 'currency',
            title: 'Currency Tests',
            icon: '💱',
            tests: [
                {
                    id: 'multi-currency',
                    label: 'Test Multi-Currency',
                    description: 'Test currency conversion',
                    onClick: () => runTest('Multi-Currency', () => tctApi.testMultiCurrency()),
                },
            ],
        },
    ];

    return (
        <APITestTemplate
            apiName="TCT API - Test Suite"
            provider="TCT (Travel Compositor)"
            protocol="REST/JSON"
            authType="Basic"
            accentColor="#fb8c00"
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

export default TCTTest;
