/**
 * Filos (One Tourismo) API - Test Page
 */

import React, { useState } from 'react';
import { APITestTemplate, type APITestSection } from '../components/APITestTemplate';
import { filosApiService, FILOS_CREDENTIALS } from '../services/filos/api/filosApiService';

export const FilosTest: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [hotelId, setHotelId] = useState('1');

    const runTest = async (testName: string, testFn: () => Promise<any>) => {
        setLoading(true);
        setError(null);
        setResult(null);

        try {
            console.log(`\n========== ${testName} ==========`);
            const response = await testFn();
            if (response.success) {
                setResult(response.data);
                console.log('Success:', response.data);
            } else {
                throw new Error(response.error?.message || response.error || 'API call failed');
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setError(errorMessage);
            console.error('Error:', errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const configItems = [
        {
            label: 'Endpoint',
            value: 'https://api-v2.onetourismo.com',
            type: 'text' as const,
        },
        {
            label: 'Test Hotel ID',
            value: (
                <input
                    type="text"
                    value={hotelId}
                    onChange={e => setHotelId(e.target.value)}
                    style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid var(--border)', padding: '2px 8px', borderRadius: '4px', color: '#fff', width: '60px' }}
                />
            ) as any,
            type: 'text' as const,
        },
        {
            label: 'Status',
            value: 'Evaluation',
            type: 'text' as const,
        }
    ];

    const sections: APITestSection[] = [
        {
            id: 'static-data',
            title: 'Static Data',
            icon: '📊',
            tests: [
                {
                    id: 'get-destinations',
                    label: 'Get Destinations',
                    description: 'Download all destination codes',
                    onClick: () => runTest('Get Destinations', () => filosApiService.getDestinations()),
                },
                {
                    id: 'get-hotels',
                    label: 'Get Hotels List',
                    description: 'Download all hotel codes',
                    onClick: () => runTest('Get Hotels', () => filosApiService.getHotels()),
                }
            ],
        },
        {
            id: 'availability',
            title: 'Availability Tests',
            icon: '🔍',
            tests: [
                {
                    id: 'get-availability',
                    label: 'Generic Availability',
                    description: 'Search hotels for standard dates',
                    onClick: () => runTest('Get Availability', () => filosApiService.getAvailability({
                        start_date: '2026-06-01',
                        end_date: '2026-06-08',
                        nationality: 'RS',
                        rooms: [{ adults: 2, children: 0 }],
                        hotelCodes: [hotelId]
                    })),
                }
            ],
        },
        {
            id: 'hotel-info',
            title: 'Hotel Info Tests',
            icon: '🏨',
            tests: [
                {
                    id: 'get-hotel-info',
                    label: 'Get Hotel Details',
                    description: 'Fetch detailed info for specified ID',
                    onClick: () => runTest('Get Hotel Info', () => filosApiService.getHotelInfo(hotelId)),
                }
            ],
        }
    ];

    return (
        <APITestTemplate
            apiName="Filos (One Tourismo) API"
            provider="Filos Travel / One Tourismo"
            protocol="JSON API v2"
            authType="Credentials"
            accentColor="#0277bd"
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

export default FilosTest;
