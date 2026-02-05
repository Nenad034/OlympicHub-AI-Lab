/**
 * Utility to proxy image URLs through the application backend to avoid CORS issues.
 * This is particularly useful for Solvex images which might be blocked by browser CORS policies
 * when fetching directly from their server.
 */

export const getProxiedImageUrl = (url: string | undefined | null): string => {
    if (!url) return 'https://placehold.co/800x600/e2e8f0/64748b?text=No+Image';

    // Check if it's a Solvex URL
    if (url.toLowerCase().includes('solvex')) {
        // Rewrite rule in vercel.json / vite.config.ts:
        // /api/solvex/(.*) -> https://evaluation.solvex.bg/$1

        // 1. Remove the protocol and domain to get the path
        let path = url.replace(/^https?:\/\/[^/]+/, '');

        // 2. Ensure path starts with /
        if (!path.startsWith('/')) path = '/' + path;

        // 3. Return the local proxy URL
        return `/api/solvex${path}`;
    }

    return url;
};
