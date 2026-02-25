/**
 * MTS Globe API - Test Page
 * 
 * Uses APITestTemplate for consistent design across all API test pages.
 */

import React, { useState } from 'react';
import { APITestTemplate, type APITestSection } from '../components/APITestTemplate';
import * as MtsGlobeService from '../integrations/mtsglobe/api/mtsGlobeService';

export const MtsGlobeTest: React.FC = () => {
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
            value: import.meta.env.VITE_MTS_GLOBE_URL || 'https://api.mtsglobe.com/xml/ota',
            type: 'text' as const,
        },
        {
            label: 'Agency Code',
            value: import.meta.env.VITE_MTS_GLOBE_AGENCY_CODE || 'DEMO-123',
            type: 'text' as const,
        },
        {
            label: 'Username',
            value: import.meta.env.VITE_MTS_GLOBE_USERNAME ? '********' : 'Not Set',
            type: 'text' as const,
        },
    ];

    // Test sections
    const sections: APITestSection[] = [
        {
            id: 'availability',
            title: 'Inventory & Search',
            icon: '🔍',
            tests: [
                {
                    id: 'search',
                    label: 'Hotel Availability',
                    description: 'Search hotels using OTA_HotelAvailRQ',
                    onClick: () => runTest('Hotel Search', async () => {
                        const params = {
                            checkIn: '2026-06-15',
                            checkOut: '2026-06-22',
                            adults: 2,
                            destinationCode: 'PMI' // Palma de Mallorca as default demo data
                        };
                        const response = await MtsGlobeService.searchHotels(params as any);
                        if (response.success) {
                            return {
                                success: true,
                                message: response.data?.length === 0 ? 'Simulation Mode: Empty results (Need live credentials)' : 'Results found',
                                count: response.data?.length || 0,
                                data: response.data
                            };
                        }
                        throw new Error(response.error || 'Search failed');
                    }),
                },
            ],
        },
        {
            id: 'booking',
            title: 'Booking & Operations',
            icon: '📝',
            tests: [
                {
                    id: 'book',
                    label: 'Test Booking',
                    description: 'Simulate booking via OTA_HotelResRQ',
                    onClick: () => runTest('Test Booking', async () => {
                        const response = await MtsGlobeService.bookHotel({
                            hotelCode: 'H001',
                            checkIn: '2026-06-15',
                            checkOut: '2026-06-22'
                        });
                        return response.data;
                    }),
                },
            ],
        },
        {
            id: 'cancellation',
            title: 'Management',
            icon: '❌',
            tests: [
                {
                    id: 'cancel',
                    label: 'Test Cancel',
                    description: 'Simulate cancellation via OTA_CancelRQ',
                    onClick: () => runTest('Test Cancellation', async () => {
                        const response = await MtsGlobeService.cancelBooking('MTS-DEMO-999');
                        return response.data;
                    }),
                },
            ],
        },
    ];

    return (
        <APITestTemplate
            apiName="MTS Globe / Axisdata Test Suite"
            provider="MTS Globe Group"
            protocol="OTA XML"
            authType="XML Header Authentication"
            accentColor="#00bcd4"
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

export default MtsGlobeTest;
