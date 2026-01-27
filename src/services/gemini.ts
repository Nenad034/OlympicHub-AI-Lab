/**
 * Gemini AI Service
 * 
 * This service provides a secure way to interact with Gemini AI.
 * In production, it routes requests through a Supabase Edge Function
 * to keep the API key secure on the server.
 * 
 * In development/offline mode, it falls back to direct API calls
 * using the VITE_GEMINI_API_KEY environment variable (not recommended for production).
 */

import { supabase } from '../supabaseClient';

// Check if we're using the edge function or direct API
const USE_EDGE_FUNCTION = import.meta.env.PROD || import.meta.env.VITE_USE_EDGE_FUNCTION === 'true';

// Fallback API key for development only
const FALLBACK_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

interface GeminiOptions {
    model?: 'gemini-1.5-flash' | 'gemini-1.5-pro' | 'gemini-1.0-pro';
    maxTokens?: number;
    temperature?: number;
    context?: string;
}

interface GeminiResponse {
    success: boolean;
    response: string;
    error?: string;
    model?: string;
}

/**
 * Send a prompt to Gemini AI
 * Automatically uses Edge Function in production for security
 */
export async function askGemini(
    prompt: string,
    options: GeminiOptions = {}
): Promise<GeminiResponse> {
    const {
        model = 'gemini-1.5-flash',
        maxTokens = 2048,
        temperature = 0.7,
        context,
    } = options;

    // Use Edge Function in production
    if (USE_EDGE_FUNCTION) {
        return callEdgeFunction(prompt, { model, maxTokens, temperature, context });
    }

    // Development fallback - direct API call
    // ⚠️ WARNING: Only use this in development!
    if (!FALLBACK_API_KEY) {
        return {
            success: false,
            response: '',
            error: 'Gemini API key not configured. Set VITE_GEMINI_API_KEY in .env',
        };
    }

    return callDirectAPI(prompt, { model, maxTokens, temperature, context });
}

/**
 * Call Gemini through Supabase Edge Function (SECURE)
 */
async function callEdgeFunction(
    prompt: string,
    options: GeminiOptions
): Promise<GeminiResponse> {
    try {
        const { data, error } = await supabase.functions.invoke('gemini-proxy', {
            body: {
                prompt,
                model: options.model,
                maxTokens: options.maxTokens,
                temperature: options.temperature,
                context: options.context,
            },
        });

        if (error) {
            console.error('Edge function error:', error);
            return {
                success: false,
                response: '',
                error: error.message || 'Edge function error',
            };
        }

        return {
            success: true,
            response: data.response,
            model: data.model,
        };
    } catch (err) {
        console.error('Error calling edge function:', err);
        return {
            success: false,
            response: '',
            error: err instanceof Error ? err.message : 'Unknown error',
        };
    }
}

/**
 * Direct API call (DEVELOPMENT ONLY)
 * ⚠️ WARNING: This exposes the API key in the browser!
 */
async function callDirectAPI(
    prompt: string,
    options: GeminiOptions
): Promise<GeminiResponse> {
    if (!FALLBACK_API_KEY) {
        return {
            success: false,
            response: '',
            error: 'API key not configured',
        };
    }

    try {
        const fullPrompt = options.context
            ? `Context: ${options.context}\n\nUser: ${prompt}`
            : prompt;

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${options.model}:generateContent?key=${FALLBACK_API_KEY}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [{ text: fullPrompt }],
                        },
                    ],
                    generationConfig: {
                        maxOutputTokens: options.maxTokens,
                        temperature: options.temperature,
                    },
                }),
            }
        );

        if (!response.ok) {
            const errorData = await response.text();
            console.error('Gemini API error:', errorData);
            return {
                success: false,
                response: '',
                error: `Gemini API error: ${response.status}`,
            };
        }

        const data = await response.json();
        const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

        return {
            success: true,
            response: responseText,
            model: options.model,
        };
    } catch (err) {
        console.error('Direct API error:', err);
        return {
            success: false,
            response: '',
            error: err instanceof Error ? err.message : 'Unknown error',
        };
    }
}

/**
 * Chat with Gemini using context and message history
 */
export async function chatWithGemini(
    messages: { role: 'user' | 'assistant'; content: string }[],
    options: Omit<GeminiOptions, 'context'> = {}
): Promise<GeminiResponse> {
    // Convert message history to context
    const context = messages
        .slice(0, -1) // Exclude the last message (current prompt)
        .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
        .join('\n');

    // Get the last user message as the prompt
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== 'user') {
        return {
            success: false,
            response: '',
            error: 'Last message must be from user',
        };
    }

    return askGemini(lastMessage.content, {
        ...options,
        context: context || undefined,
    });
}

/**
 * Analyze an image with Gemini Vision
 * Note: Requires gemini-1.5-pro or gemini-1.5-flash model
 */
export async function analyzeImage(
    imageBase64: string,
    prompt: string = 'Describe this image in detail.',
    options: Omit<GeminiOptions, 'context'> = {}
): Promise<GeminiResponse> {
    // For now, this only works with direct API
    // Edge function support for images coming soon
    if (!FALLBACK_API_KEY) {
        return {
            success: false,
            response: '',
            error: 'Image analysis requires API key configuration',
        };
    }

    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${options.model || 'gemini-1.5-flash'}:generateContent?key=${FALLBACK_API_KEY}`,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                { text: prompt },
                                {
                                    inline_data: {
                                        mime_type: 'image/jpeg',
                                        data: imageBase64,
                                    },
                                },
                            ],
                        },
                    ],
                    generationConfig: {
                        maxOutputTokens: options.maxTokens || 2048,
                        temperature: options.temperature || 0.7,
                    },
                }),
            }
        );

        if (!response.ok) {
            return {
                success: false,
                response: '',
                error: `Vision API error: ${response.status}`,
            };
        }

        const data = await response.json();
        const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

        return {
            success: true,
            response: responseText,
            model: options.model || 'gemini-1.5-flash',
        };
    } catch (err) {
        return {
            success: false,
            response: '',
            error: err instanceof Error ? err.message : 'Unknown error',
        };
    }
}

export default {
    ask: askGemini,
    chat: chatWithGemini,
    analyzeImage,
};
