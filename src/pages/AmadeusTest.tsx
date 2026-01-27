/**
 * Amadeus API - Test Page (Unified Design)
 * 
 * Uses APITestTemplate for consistent design across all API test pages
 */

import React, { useState } from 'react';
import { APITestTemplate, APITestSection } from '../components/APITestTemplate';

// Mock Amadeus API functions
const amadeusApi = {
    testConnection: async () => {
        await new Promise(resolve => setTimeout(resolve, 1500));
        return {
            status: 'connected',
            message: 'Connection successful! Amadeus API is reachable.',
            timestamp: new Date().toISOString(),
        };
    },

    searchFlights: async () => {
        await new Promise(resolve => setTimeout(resolve, 2500));
        return {
            route: 'BEG → ATH',
            count: 12,
            cheapest: { price: 89, currency: 'EUR', airline: 'Wizz Air' },
            fastest: { duration: '1h 45m', airline: 'Aegean' },
        };
    },

    multiCitySearch: async () => {
        await new Promise(resolve => setTimeout(resolve, 3000));
        return {
            combinations: 8,
            best: {
                route: 'BEG → ATH → HER → BEG',
                price: 245,
                currency: 'EUR',
            },
        };
    },

    getFareRules: async () => {
        await new Promise(resolve => setTimeout(resolve, 2000));
        return {
            baggage: '1x23kg',
            changes: 'Fee: €50',
            cancellation: 'Non-refundable',
        };
    },
};

export const AmadeusTest: React.FC = () => {
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
            value: 'https://api.amadeus.com',
            type: 'text' as const,
        },
        {
            label: 'Environment',
            value: 'Test',
            type: 'text' as const,
        },
        {
            label: 'Status',
            value: false,
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
                    description: 'Test Amadeus API connectivity',
                    onClick: () => runTest('Test Connection', () => amadeusApi.testConnection()),
                },
            ],
        },
        {
            id: 'search',
            title: 'Flight Search Tests',
            icon: '✈️',
            tests: [
                {
                    id: 'flight-search',
                    label: 'Test Flight Search (BEG → ATH)',
                    description: 'Search flights Belgrade to Athens',
                    onClick: () => runTest('Flight Search', () => amadeusApi.searchFlights()),
                },
                {
                    id: 'multi-city',
                    label: 'Test Multi-City',
                    description: 'Search multi-city itinerary',
                    onClick: () => runTest('Multi-City Search', () => amadeusApi.multiCitySearch()),
                },
            ],
        },
        {
            id: 'fare',
            title: 'Fare Tests',
            icon: '💰',
            tests: [
                {
                    id: 'fare-rules',
                    label: 'Test Fare Rules',
                    description: 'Fetch fare rules and conditions',
                    onClick: () => runTest('Fare Rules', () => amadeusApi.getFareRules()),
                },
            ],
        },
    ];

    return (
        <APITestTemplate
            apiName="Amadeus Flights - Test Suite"
            provider="Amadeus GDS"
            protocol="REST/JSON"
            authType="API Key"
            accentColor="#667eea"
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

export default AmadeusTest;
