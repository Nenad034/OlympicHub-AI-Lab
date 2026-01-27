/**
 * ORS API - Test Page (Unified Design)
 * 
 * Uses APITestTemplate for consistent design across all API test pages
 */

import React, { useState } from 'react';
import { APITestTemplate, type APITestSection } from '../components/APITestTemplate';
import { orsSearchService } from '../services/ors/orsSearchService';
import { orsDictionaryService } from '../services/ors/orsDictionaryService';
import { orsAuthService } from '../services/ors/orsAuthService';
import { orsBookingService } from '../services/ors/orsBookingService';
import type { OrsSearchParams } from '../services/ors/orsSearchService';

export const OrsTest: React.FC = () => {
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    // Search parameters
    const [searchParams] = useState<OrsSearchParams>({
        dateFrom: '2026-07-01',
        dateTo: '2026-07-08',
        adults: 2,
        children: 0,
        childrenAges: [],
        cityName: 'Porec',
        language: 'en',
    });

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
            value: 'https://api.ors.si/crs/v2',
            type: 'text' as const,
        },
        {
            label: 'API Key',
            value: orsAuthService.isConfigured() ? 'Configured ✓' : 'Not configured',
            type: 'text' as const,
        },
        {
            label: 'Rate Limit',
            value: `${orsAuthService.getRateLimitStatus().remaining}/${orsAuthService.getRateLimitStatus().total} requests`,
            type: 'text' as const,
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
                    id: 'test-auth',
                    label: 'Test Auth Status',
                    description: 'Check API key configuration and rate limits',
                    onClick: () => runTest('Authentication', async () => {
                        const isConfigured = orsAuthService.isConfigured();
                        const rateLimitStatus = orsAuthService.getRateLimitStatus();
                        return {
                            isConfigured,
                            rateLimitStatus,
                            message: isConfigured
                                ? '✅ API Key is configured'
                                : '❌ API Key not configured',
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
                    id: 'get-languages',
                    label: 'Get Languages',
                    description: 'Fetch available languages',
                    onClick: () => runTest('Languages', () => orsDictionaryService.getLanguages()),
                },
                {
                    id: 'get-regions',
                    label: 'Get Regions',
                    description: 'Fetch available regions',
                    onClick: () => runTest('Regions', async () => {
                        const regions = await orsDictionaryService.getRegions();
                        return {
                            count: Object.keys(regions).length,
                            sample: Object.entries(regions).slice(0, 5).map(([id, region]) => ({
                                id,
                                name: region.Translations.en,
                                group: region.RegionGroup,
                            })),
                        };
                    }),
                },
                {
                    id: 'get-locations',
                    label: 'Get Locations (Page 1)',
                    description: 'Fetch locations',
                    onClick: () => runTest('Locations', async () => {
                        const locations = await orsDictionaryService.getLocations(1);
                        return {
                            page: locations.Page,
                            total: locations.Count,
                            sample: Object.entries(locations.Results).slice(0, 5).map(([id, loc]) => ({
                                id,
                                name: loc.Translations.en,
                                region: loc.RegionName?.en,
                            })),
                        };
                    }),
                },
                {
                    id: 'search-location',
                    label: 'Search Location (Porec)',
                    description: 'Search for specific location',
                    onClick: () => runTest('Search Location', async () => {
                        const query = searchParams.cityName || 'Porec';
                        const results = await orsDictionaryService.searchLocation(query, searchParams.language);
                        return {
                            query,
                            count: results.length,
                            results: results.slice(0, 10),
                        };
                    }),
                },
                {
                    id: 'service-codes',
                    label: 'Get Service Codes',
                    description: 'Fetch meal plans and services',
                    onClick: () => runTest('Service Codes', async () => {
                        const codes = await orsDictionaryService.getServiceCodes();
                        return {
                            count: Object.keys(codes).length,
                            sample: Object.entries(codes).slice(0, 10).map(([code, translations]) => ({
                                code,
                                name: translations.en,
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
                    id: 'search-regions',
                    label: 'Search Regions',
                    description: 'Search available regions',
                    onClick: () => runTest('Search Regions', () => orsSearchService.searchRegions(searchParams)),
                },
                {
                    id: 'search-products',
                    label: 'Search Products',
                    description: 'Search products in Porec',
                    onClick: () => runTest('Search Products', async () => {
                        const locations = await orsDictionaryService.searchLocation(
                            searchParams.cityName || 'Porec',
                            searchParams.language
                        );
                        if (locations.length === 0) throw new Error('No location found');
                        return await orsSearchService.searchProducts({
                            ...searchParams,
                            locationId: (locations[0] as any).id,
                        });
                    }),
                },
                {
                    id: 'search-dates',
                    label: 'Search Dates (Full Search)',
                    description: 'Full date-based search',
                    onClick: () => runTest('Search Dates', async () => {
                        const locations = await orsDictionaryService.searchLocation(
                            searchParams.cityName || 'Porec',
                            searchParams.language
                        );
                        if (locations.length === 0) throw new Error('No location found');
                        return await orsSearchService.searchDates({
                            ...searchParams,
                            locationId: (locations[0] as any).id,
                        });
                    }),
                },
                {
                    id: 'full-search',
                    label: 'Full Hotel Search',
                    description: 'Complete hotel search workflow',
                    onClick: () => runTest('Full Hotel Search', () => orsSearchService.searchHotels(searchParams)),
                },
            ],
        },
        {
            id: 'booking',
            title: 'Booking Tests',
            icon: '📝',
            tests: [
                {
                    id: 'create-passenger',
                    label: 'Create Passenger',
                    description: 'Test passenger creation',
                    onClick: () => runTest('Create Passenger', async () => {
                        return orsBookingService.createPassenger({
                            type: 'D',
                            firstName: 'Marko',
                            lastName: 'Marković',
                            birthDate: '1990-01-01',
                        });
                    }),
                },
                {
                    id: 'create-customer',
                    label: 'Create Customer',
                    description: 'Test customer creation',
                    onClick: () => runTest('Create Customer', async () => {
                        return orsBookingService.createCustomer({
                            firstName: 'Marko',
                            lastName: 'Marković',
                            email: 'marko@example.com',
                            phone: '+381641234567',
                            address: 'Bulevar Kralja Aleksandra 1',
                            city: 'Beograd',
                            zipCode: '11000',
                            country: 'RS',
                        });
                    }),
                },
                {
                    id: 'validate-booking',
                    label: 'Test Validation',
                    description: 'Validate booking request',
                    onClick: () => runTest('Booking Validation', async () => {
                        const request = {
                            passengers: [
                                orsBookingService.createPassenger({
                                    type: 'D',
                                    firstName: 'Marko',
                                    lastName: 'Marković',
                                    birthDate: '1990-01-01',
                                }),
                            ],
                            customer: orsBookingService.createCustomer({
                                firstName: 'Marko',
                                lastName: 'Marković',
                                email: 'marko@example.com',
                                phone: '+381641234567',
                                city: 'Beograd',
                                country: 'RS',
                            }),
                        };
                        return orsBookingService.validateBookingRequest(request);
                    }),
                },
                {
                    id: 'test-booking',
                    label: 'Test Booking (Register)',
                    description: 'Test booking registration',
                    onClick: () => runTest('Test Booking Registration', async () => {
                        const request = {
                            passengers: [
                                orsBookingService.createPassenger({
                                    type: 'D',
                                    firstName: 'Marko',
                                    lastName: 'Marković',
                                    birthDate: '1990-01-01',
                                }),
                            ],
                            customer: orsBookingService.createCustomer({
                                firstName: 'Marko',
                                lastName: 'Marković',
                                email: 'marko@example.com',
                                phone: '+381641234567',
                                city: 'Beograd',
                                country: 'RS',
                            }),
                        };
                        const validation = orsBookingService.validateBookingRequest(request);
                        if (!validation.valid) {
                            throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
                        }
                        return {
                            message: '✅ Booking request is valid!',
                            note: 'Real booking requires valid tourOperator and hashCode from search results',
                            request,
                            validation,
                        };
                    }),
                },
            ],
        },
    ];

    return (
        <APITestTemplate
            apiName="ORS API - Test Suite"
            provider="ORS (Online Reservation System)"
            protocol="REST/JSON"
            authType="API Key"
            accentColor="#9c27b0"
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

export default OrsTest;
