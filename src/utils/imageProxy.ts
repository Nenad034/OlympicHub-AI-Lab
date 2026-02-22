/**
 * Utility to resolve hotel image URLs.
 * 
 * b2b.solvex.bg images have Access-Control-Allow-Origin: *  so they can be loaded
 * directly by the browser from any origin. Using a proxy adds overhead and fails for
 * filenames that contain special characters (Cyrillic, parentheses, dots in names, etc.).
 * 
 * For the SOAP API (iservice.solvex.bg) we still need to go through /api/solvex proxy
 * because that endpoint does NOT have permissive CORS headers.
 */

const B2B_BASE = 'https://b2b.solvex.bg';
const PLACEHOLDER = 'https://placehold.co/800x600/e2e8f0/64748b?text=No+Image';
const PLACEHOLDER_UNAVAILABLE = 'https://placehold.co/800x600/e2e8f0/64748b?text=Image+Unavailable';

export const getProxiedImageUrl = (url: string | undefined | null): string => {
    if (!url) return PLACEHOLDER;

    // Prevent bare filenames (no slash) from causing 404s on dev server
    if (!url.startsWith('http') && !url.includes('/')) {
        return PLACEHOLDER_UNAVAILABLE;
    }

    // Already absolute URL
    if (url.startsWith('http://') || url.startsWith('https://')) {
        // If it points to iservice.solvex.bg (SOAP API), route through proxy
        if (url.includes('iservice.solvex.bg')) {
            const path = url.replace(/^https?:\/\/[^/]+/, '');
            return `/api/solvex${path.startsWith('/') ? path : '/' + path}`;
        }
        // For b2b.solvex.bg, other CDN URLs, or anything else – use directly (CORS is open)
        return url;
    }

    // Relative path starting with /web/ or /files/ → this came from b2b.solvex.bg
    if (url.startsWith('/web/') || url.startsWith('/files/')) {
        return `${B2B_BASE}${url}`;
    }

    // Relative path starting with /api/solvex-b2b (already proxied, but we can un-proxy it)
    if (url.startsWith('/api/solvex-b2b')) {
        const path = url.replace('/api/solvex-b2b', '');
        return `${B2B_BASE}${path}`;
    }

    // Anything else: return as-is
    return url;
};
