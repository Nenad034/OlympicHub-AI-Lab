/**
 * Utility to proxy image URLs through the application backend to avoid CORS issues.
 * This is particularly useful for Solvex images which might be blocked by browser CORS policies
 * when fetching directly from their server.
 */

export const getProxiedImageUrl = (url: string | undefined | null): string => {
    if (!url) return 'https://placehold.co/800x600/e2e8f0/64748b?text=No+Image';

    // Check if it's a Solvex URL
    if (url.toLowerCase().includes('solvex')) {
        const isB2B = url.toLowerCase().includes('b2b.solvex.bg');
        const proxyPrefix = isB2B ? '/api/solvex-b2b' : '/api/solvex';

        // 1. Remove the protocol and domain to get the path
        let path = url.replace(/^https?:\/\/[^/]+/, '');

        // 2. Ensure path starts with /
        if (!path.startsWith('/')) path = '/' + path;

        // 3. Return the local proxy URL
        return `${proxyPrefix}${path}`;
    }

    return url;
};
