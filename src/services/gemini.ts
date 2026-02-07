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

import { multiKeyAI } from './multiKeyAI';

// Check if we're using the edge function or direct API
const USE_EDGE_FUNCTION = import.meta.env.PROD || import.meta.env.VITE_USE_EDGE_FUNCTION === 'true';

interface GeminiOptions {
    model?: 'gemini-1.5-flash' | 'gemini-1.5-pro' | 'gemini-1.0-pro' | string;
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
 * Automatically routes through multiKeyAI for tracking and failover
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

    const fullPrompt = context ? `Context: ${context}\n\nUser: ${prompt}` : prompt;

    try {
        const responseText = await multiKeyAI.generateContent(fullPrompt, {
            useCache: true,
            cacheCategory: 'default',
            model: model,
            temperature: temperature,
            maxOutputTokens: maxTokens
        });

        return {
            success: true,
            response: responseText,
            model: model
        };
    } catch (err: any) {
        console.error('Gemini Service Error:', err);
        return {
            success: false,
            response: '',
            error: err.message || 'Gemini processing failed'
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

export default {
    ask: askGemini,
    chat: chatWithGemini,
};
