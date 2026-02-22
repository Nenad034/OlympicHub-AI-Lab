import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const SOLVEX_API_URL = Deno.env.get("SOLVEX_API_URL") || "https://iservice.solvex.bg/IntegrationService.asmx";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, soapaction",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        let bodyText = await req.text();
        const soapAction = req.headers.get("soapaction");

        if (!soapAction) {
            return new Response(
                JSON.stringify({ error: "SOAPAction header is required" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Operation Fortress: Inject credentials dynamically for Connect request
        if (soapAction.includes("Connect")) {
            const login = Deno.env.get("SOLVEX_LOGIN");
            const password = Deno.env.get("SOLVEX_PASSWORD");

            if (login && password) {
                bodyText = bodyText
                    .replace(/<login>.*?<\/login>/i, `<login>${login}</login>`)
                    .replace(/<password>.*?<\/password>/i, `<password>${password}</password>`);
            } else {
                console.warn("SOLVEX_LOGIN or SOLVEX_PASSWORD not found in environment, connection might fail if credentials are required.");
            }
        }

        // Obfuscate our origin before sending to Solvex
        const fetchHeaders: Record<string, string> = {
            "Content-Type": "text/xml; charset=utf-8",
            "SOAPAction": soapAction,
            // Add a friendly User-Agent to avoid scraping blocks
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.5",
            // Solvex might expect connection to be keep-alive
            "Connection": "keep-alive"
        };


        const solvexResponse = await fetch(SOLVEX_API_URL, {
            method: "POST",
            headers: fetchHeaders,
            body: bodyText
        });

        const xmlText = await solvexResponse.text();

        return new Response(xmlText, {
            status: solvexResponse.status,
            headers: {
                ...corsHeaders,
                "Content-Type": "text/xml; charset=utf-8"
            }
        });

    } catch (error: any) {
        console.error("Solvex proxy error:", error);
        return new Response(
            JSON.stringify({ error: "Internal server error", message: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
