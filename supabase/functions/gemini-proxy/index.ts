// supabase/functions/gemini-proxy/index.ts
// Deploy with: supabase functions deploy gemini-proxy

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface GeminiRequest {
    prompt: string;
    model?: string;
    maxTokens?: number;
    temperature?: number;
    context?: string;
}

serve(async (req: Request) => {
    // Handle CORS preflight
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        // Verify API key is configured
        if (!GEMINI_API_KEY) {
            return new Response(
                JSON.stringify({ error: "Gemini API key not configured on server" }),
                { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Get request body
        const body: GeminiRequest = await req.json();
        const { prompt, model = "gemini-1.5-flash", maxTokens = 2048, temperature = 0.7, context } = body;

        if (!prompt) {
            return new Response(
                JSON.stringify({ error: "Prompt is required" }),
                { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        // Prepare the full prompt with context if provided
        const fullPrompt = context
            ? `Context: ${context}\n\nUser: ${prompt}`
            : prompt;

        // Call Gemini API
        const geminiResponse = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [{ text: fullPrompt }],
                        },
                    ],
                    generationConfig: {
                        maxOutputTokens: maxTokens,
                        temperature: temperature,
                    },
                }),
            }
        );

        if (!geminiResponse.ok) {
            const errorData = await geminiResponse.text();
            console.error("Gemini API error:", errorData);
            return new Response(
                JSON.stringify({ error: "Gemini API error", details: errorData }),
                { status: geminiResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const data = await geminiResponse.json();

        // Extract the response text
        const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

        return new Response(
            JSON.stringify({
                success: true,
                response: responseText,
                model: model,
                usage: data.usageMetadata,
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

    } catch (error) {
        console.error("Function error:", error);
        return new Response(
            JSON.stringify({ error: "Internal server error", message: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
