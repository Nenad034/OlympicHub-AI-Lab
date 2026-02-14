/**
 * Serverless Proxy for Solvex API to bypass Vercel Handshake Errors
 */
export default async function handler(req: any, res: any) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    // Capture the 'path' from the query parameters set in vercel.json rewrite
    const { path: queryPath = '' } = req.query;
    const targetPath = Array.isArray(queryPath) ? queryPath[0] : queryPath;

    // Fallback: If path is empty, try to get it from the URL manually
    let actualPath = targetPath;
    if (!actualPath && req.url) {
        // e.g., /api/solvex/iservice/integrationservice.asmx -> iservice/integrationservice.asmx
        const urlMatch = req.url.match(/\/api\/solvex\/(.*?)(\?|$)/);
        if (urlMatch) actualPath = urlMatch[1];
    }

    const targetUrl = `https://iservice.solvex.bg/${actualPath}`;

    console.log(`[Proxy] Incoming URL: ${req.url}`);
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
