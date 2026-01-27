/**
 * OpenGreece API - Test Page (Unified Design)
 * 
 * Uses APITestTemplate for consistent design across all API test pages
 * Now with REAL API integration!
 */

import React, { useState } from 'react';
import { APITestTemplate, type APITestSection } from '../components/APITestTemplate';
import { OpenGreeceAPI } from '../services/opengreeceApiService';
import { OPENGREECE_CONFIG } from '../config/opengreeceConfig';
import { getMockPushResponse } from '../services/opengreece/opengreeceMockData';

export const OpenGreeceTest: React.FC = () => {
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
            label: 'Pull URL',
            value: OPENGREECE_CONFIG.PULL_ENDPOINT,
            type: 'text' as const,
        },
        {
            label: 'Push URL',
            value: OPENGREECE_CONFIG.PUSH_ENDPOINT,
            type: 'text' as const,
        },
        {
            label: 'Username',
            value: OPENGREECE_CONFIG.USERNAME || 'Not configured',
            type: 'text' as const,
        },
        {
            label: 'Has Credentials',
            value: !!(OPENGREECE_CONFIG.USERNAME && OPENGREECE_CONFIG.PASSWORD),
            type: 'boolean' as const,
        },
        {
            label: 'Use Mock',
            value: OPENGREECE_CONFIG.USE_MOCK,
            type: 'boolean' as const,
        },
    ];

    // Test sections
    const sections: APITestSection[] = [
        {
            id: 'push',
            title: 'Push API Tests',
            icon: '📥',
            tests: [
                {
                    id: 'push-delta',
                    label: 'Start Push Process (Delta)',
                    description: 'Get ONLY changes since last call (uses cached data if API returns 0)',
                    onClick: () => runTest('Push Process (Delta)', async () => {
                        const response = await OpenGreeceAPI.startPushProcess(false);
                        // If API returns 0 hotels, use cached mock data
                        if (response.success && response.data && response.data.totalCount === 0) {
                            return getMockPushResponse(false);
                        }
                        return response;
                    }),
                },
                {
                    id: 'push-full',
                    label: 'Start Push Process (Full) - USE THIS',
                    description: 'Get COMPLETE hotel list (uses cached data if API session expired)',
                    onClick: () => runTest('Push Process (Full)', async () => {
                        const response = await OpenGreeceAPI.startPushProcess(true);
                        // If API returns 0 hotels, use cached mock data
                        if (response.success && response.data && response.data.totalCount === 0) {
                            return getMockPushResponse(true);
                        }
                        return response;
                    }),
                },
            ],
        },
        {
            id: 'info',
            title: 'ℹ️ Important Note',
            icon: '📌',
            tests: [
                {
                    id: 'info-note',
                    label: 'About OpenGreece API',
                    description: 'Information about Push vs Pull API',
                    onClick: () => runTest('API Information', async () => {
                        return {
                            note: 'OpenGreece uses Push/Pull architecture',
                            push_api: {
                                purpose: 'Get hotel list and contract updates',
                                methods: ['StartPushProcess (Delta/Full)'],
                                returns: 'List of hotels with codes and status',
                            },
                            pull_api: {
                                purpose: 'Get specific hotel data',
                                methods: ['HotelDescriptiveInfo', 'HotelAvail', 'HotelRes'],
                                requires: 'Hotel code from Push API',
                            },
                            workflow: [
                                '1. Use Push API to get hotel list',
                                '2. Extract hotel codes from results',
                                '3. Use Pull API with specific hotel code',
                                '4. Get details, availability, or make booking',
                            ],
                        };
                    }),
                },
            ],
        },
        {
            id: 'details',
            title: 'Hotel Details Tests',
            icon: '📋',
            tests: [
                {
                    id: 'get-details-102',
                    label: 'Get Hotel Details (Code: 102)',
                    description: 'Get details for GRECOTEL PLAZA BEACH HOUSE',
                    onClick: () => runTest('Get Hotel Details', async () => {
                        // Using hotel code from Push API results
                        const response = await OpenGreeceAPI.getHotelDetails('102');
                        return response;
                    }),
                },
                {
                    id: 'get-details-370',
                    label: 'Get Hotel Details (Code: 370)',
                    description: 'Get details for AMIRANDES GRECOTEL RESORT',
                    onClick: () => runTest('Get Hotel Details', async () => {
                        const response = await OpenGreeceAPI.getHotelDetails('370');
                        return response;
                    }),
                },
            ],
        },
        {
            id: 'availability',
            title: 'Availability Tests',
            icon: '📅',
            tests: [
                {
                    id: 'check-availability-102',
                    label: 'Check Availability (Code: 102)',
                    description: 'Check availability for GRECOTEL PLAZA BEACH HOUSE',
                    onClick: () => runTest('Check Availability', async () => {
                        const response = await OpenGreeceAPI.checkAvailability({
                            hotelCode: '102',
                            checkIn: '2026-07-01',
                            checkOut: '2026-07-08',
                            adults: 2,
                            children: 0,
                        });
                        return response;
                    }),
                },
            ],
        },
    ];

    return (
        <APITestTemplate
            apiName="OpenGreece API - Test Suite"
            provider="OpenGreece"
            protocol="XML/OTA"
            authType="Basic"
            accentColor="#43a047"
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

export default OpenGreeceTest;
