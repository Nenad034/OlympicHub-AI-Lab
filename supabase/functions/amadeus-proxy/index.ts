import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const AMADEUS_API_KEY = Deno.env.get("AMADEUS_API_KEY") || "";
const AMADEUS_API_SECRET = Deno.env.get("AMADEUS_API_SECRET") || "";
const AMADEUS_BASE_URL = Deno.env.get("AMADEUS_BASE_URL") || "https://test.api.amadeus.com";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

// Simple in-memory token cache for the Edge Function
let cachedToken: string | null = null;
let tokenExpiresAt: number = 0;

async function getAuthToken(): Promise<string> {
    if (cachedToken && Date.now() < tokenExpiresAt) {
        return cachedToken;
    }

    const body = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: AMADEUS_API_KEY,
        client_secret: AMADEUS_API_SECRET
    });

    const response = await fetch(`${AMADEUS_BASE_URL}/v1/security/oauth2/token`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: body.toString()
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Amadeus auth failed: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    cachedToken = data.access_token;
    tokenExpiresAt = Date.now() + (data.expires_in - 300) * 1000;

    return cachedToken!;
}

serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        if (!AMADEUS_API_KEY || !AMADEUS_API_SECRET) {
            throw new Error("Amadeus credentials not configured on backend");
        }

        const url = new URL(req.url);

        // Example: The frontend requests /functions/v1/amadeus-proxy/v2/shopping/flight-offers?origin=...
        // We will extract everything after /amadeus-proxy/ and forward it.
        const pathMatch = url.pathname.match(/\/amadeus-proxy\/(.*)/);
        const targetPath = pathMatch ? pathMatch[1] : '';

        if (!targetPath) {
            return new Response(
                JSON.stringify({ error: "Missing target path. Format should be /amadeus-proxy/v2/...", message: "Bad Request" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const amadeusUrl = `${AMADEUS_BASE_URL}/${targetPath}${url.search}`;
        const token = await getAuthToken();

        const headers = new Headers();
        headers.set("Authorization", `Bearer ${token}`);
        headers.set("Accept", "application/json");

        if (req.method === "POST" || req.method === "PUT" || req.method === "PATCH") {
            const contentType = req.headers.get("Content-Type");
            if (contentType) headers.set("Content-Type", contentType);
        }

        const body = (req.method !== "GET" && req.method !== "HEAD") ? await req.text() : undefined;

        const amadeusResponse = await fetch(amadeusUrl, {
            method: req.method,
            headers,
            body
        });

        const responseText = await amadeusResponse.text();

        return new Response(responseText, {
            status: amadeusResponse.status,
            headers: {
                ...corsHeaders,
                "Content-Type": "application/json"
            }
        });

    } catch (error: any) {
        console.error("Amadeus proxy error:", error);
        return new Response(
            JSON.stringify({ error: "Internal server error", message: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
