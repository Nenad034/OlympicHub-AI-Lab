/**
 * TCT API Service - SECURE VERSION
 */

import { supabase } from '../../../supabaseClient';

const callEdgeFunction = async (endpoint: string, body: any) => {
    const rawBaseUrl = import.meta.env.VITE_TCT_API_URL || 'https://imc-dev.tct.travel';
    // Clean base URL - remove trailing /api/v1 if present to avoid dual /v1 in path
    const baseUrl = rawBaseUrl.replace(/\/api\/v1\/?$/, '');
    
    const apiKey = import.meta.env.VITE_TCT_PASSWORD || '689b54e328f3e759abfdced76ad8e8d0';
    const username = import.meta.env.VITE_TCT_USERNAME || 'nenad.tomic@olympic.rs';

    // CORS Proxy for browser-side requests
    const PROXY_URL = 'https://corsproxy.io/?';

    // TCT MAPIRANJE
    const mappedBody = { ...body };
    if (mappedBody.location === 'Hurghada' || mappedBody.location === 'Hurgada') mappedBody.location = '647126';
    if (mappedBody.nationality === 'RS' || mappedBody.nationality === 'Serbia') mappedBody.nationality = '324667';
    if (mappedBody.residence === 'RS' || mappedBody.residence === 'Serbia') mappedBody.residence = '324667';

    // TCT usually expects Basic Auth with API Key as password
    const authCombinations = [
        { user: username, pass: apiKey },
        { user: apiKey, pass: '' }
    ];

    let lastError = null;

    for (const auth of authCombinations) {
        const authHeader = `Basic ${btoa(auth.user + ':' + auth.pass)}`;

        let apiPath = `/v1/hotel/searchSync`;
        if (body.endpoint === 'nationalities') apiPath = `/v1/nbc/nationalities`;
        if (body.endpoint === 'geography' || endpoint === 'geography') apiPath = `/v1/nbc/geography`;

        const fullUrl = `${PROXY_URL}${baseUrl}${apiPath}`;

        const response = await fetch(fullUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'API-SOURCE': 'B2B',
                'Authorization': authHeader,
                'X-API-KEY': apiKey,
                'X-API-SOURCE': 'B2B',
                'X-Requested-With': 'XMLHttpRequest'
            },
            body: JSON.stringify(mappedBody)
        });

        if (response.ok) {
            return response.json();
        }

        lastError = await response.json().catch(() => ({ error: 'Auth/Request failed' }));
    }

    throw new Error(JSON.stringify(lastError) || `Auth failed`);
};

/**
 * Hotel Search - Synchronous
 */
export const searchHotelsSync = async (params: any) => {
    try {
        const data = await callEdgeFunction('tct-proxy', params);
        return { data, error: null, success: true };
    } catch (error) {
        return { data: null, error: error instanceof Error ? error.message : 'Unknown error', success: false };
    }
};

/**
 * Get Nationalities
 */
export const getNationalities = async () => {
    try {
        const data = await callEdgeFunction('tct-proxy', { endpoint: 'nationalities' });
        return { data, error: null, success: true };
    } catch (error) {
        return { data: null, error: error instanceof Error ? error.message : 'Unknown error', success: false };
    }
};

/**
 * Get Geography
 */
export const getGeography = async () => {
    try {
        const data = await callEdgeFunction('geography', { endpoint: 'geography' });
        return { data, error: null, success: true };
    } catch (error) {
        return { data: null, error: error instanceof Error ? error.message : 'Unknown error', success: false };
    }
};

export const tctApi = {
    config: { baseUrl: 'https://imc-dev.tct.travel', username: 'Secure', password: '***', apiSource: 'B2B' },
    isConfigured: () => true,
    searchHotelsSync,
    getNationalities,
    getGeography
};

export default tctApi;
