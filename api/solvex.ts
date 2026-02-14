/**
 * Serverless Proxy for Solvex API to bypass Vercel Handshake Errors
 */
export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // Capture the 'path' from the query parameters set in vercel.json rewrite
    // Source: /api/solvex/(.*)  -> Destination: /api/solvex?path=$1
    const { path: queryPath = '' } = req.query;
    let actualPath = Array.isArray(queryPath) ? queryPath[0] : queryPath;

    // Manual extraction if rewrite didn't pass it cleanly
    if (!actualPath && req.url) {
        const urlMatch = req.url.split('/api/solvex/')[1];
        if (urlMatch) actualPath = urlMatch.split('?')[0];
    }

    // Clean leading/trailing slashes and make sure it has the right filename
    actualPath = actualPath.replace(/^\/+|\/+$/g, '');

    // Get the base URL from environment variables, defaulting to production
    const baseUrl = process.env.VITE_SOLVEX_API_URL || 'https://iservice.solvex.bg/IntegrationService.asmx';
    const urlObj = new URL(baseUrl);
    const targetBase = `${urlObj.protocol}//${urlObj.host}`;

    // Safety check: The Solvex production API usually lives at the root or IntegrationService.asmx
    const targetUrl = `${targetBase}/${actualPath}`;

    console.log(`[Proxy] Incoming URL: ${req.url}`);
    console.log(`[Proxy] Actual Path: ${actualPath}`);
    console.log(`[Proxy] Target URL: ${targetUrl}`);

    try {
        // Collect raw body
        let body = req.body;

        // Vercel might have pre-parsed it if it looked like JSON
        if (body && typeof body === 'object' && !Buffer.isBuffer(body)) {
            body = JSON.stringify(body);
        }

        const response = await fetch(targetUrl, {
            method: 'POST',
            headers: {
                'Content-Type': req.headers['content-type'] || 'text/xml; charset=utf-8',
                'SOAPAction': req.headers['soapaction'] || '',
            },
            body: body,
        });

        const data = await response.text();

        console.log(`[Proxy] Target responded with: ${response.status}`);

        // Pass through headers
        res.setHeader('Content-Type', response.headers.get('Content-Type') || 'text/xml; charset=utf-8');
        res.status(response.status).send(data);
    } catch (error: any) {
        console.error('[Proxy Error]', error);
        res.status(500).json({
            error: 'Proxy Error',
            message: error.message,
            targetUrl: targetUrl
        });
    }
}
