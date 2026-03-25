import multiKeyAI from '../multiKeyAI';

export interface ParsedSearchIntent {
    destinations: string[];
    checkIn: string | null;      // YYYY-MM-DD
    checkOut: string | null;     // YYYY-MM-DD
    dateRange?: { start: string, end: string }; // Optional overall period
    durationNights?: number;      // e.g. 7
    searchMode: 'classic' | 'range'; // NEW: decides if calendar shows
    pax: Array<{ adults: number, children: number, childrenAges: number[] }>;
    stars?: string[];
    board?: string[];
    remainingQuery: string;
    needsClarification?: 'pax_split' | 'dates' | null;
}

const aiService = multiKeyAI;

export const parseSearchIntent = async (query: string): Promise<ParsedSearchIntent> => {
    try {
        console.log(`🧠 [NLP Parse] Analyzing query: "${query}"`);
        
    const systemPrompt = `
You are a precision-focused travel agent assistant. Your goal is to parse natural language queries into strict JSON.
Current date: ${new Date().toISOString().split('T')[0]}.

CRITICAL INSTRUCTIONS:
1. STAR RATING (STARS):
   - User says "4 zvezdice", "hotel 4*", "kategorija 4" -> ALWAYS set stars: ["4"].
   - NEVER return multiple star ratings unless the user specifies a range (e.g. "4 ili 5 zvezdica").
   - If they say "hotel 4*", return ONLY ["4"]. Do NOT include ["3"] or ["5"].
2. MEAL PLANS (BOARD):
   - Mapping: "polupansion" -> "HB", "doručak" -> "BB", "all inclusive", "sve uključeno" -> "AI", "pun pansion" -> "FB", "noćenje" -> "RO".
3. DESTINATIONS:
   - Extract city names (e.g. "Sunčev Breg", "Bansko").
4. DATES:
   - Format: YYYY-MM-DD. Handle "10-20.08.2026" as checkIn: 2026-08-10, checkOut: 2026-08-20.
5. PAX:
   - "2 odrasle" -> [{ adults: 2, children: 0, childrenAges: [] }].

User Query: "${query}"

Return ONLY valid JSON with fields: destinations (array), checkIn (string), checkOut (string), dateRange (object/null), durationNights (number), stars (array of strings), board (array of strings), pax (array), searchMode (string), needsClarification (string/null).
`;

        const response = await aiService.generateContent(systemPrompt, {
            useCache: true,
            cacheCategory: 'analysis',
            temperature: 0.1
        });

        // Clean up markdown block if the model returned it despite instructions
        let rawJson = response;
        if (rawJson.startsWith('```json')) {
            rawJson = rawJson.replace(/```json\n?/, '').replace(/\n?```/, '');
        } else if (rawJson.startsWith('```')) {
            rawJson = rawJson.replace(/```\n?/, '').replace(/\n?```/, '');
        }

        const parsed = JSON.parse(rawJson);
        console.log(`✅ [NLP Parse] Raw:`, JSON.stringify(parsed, null, 2));
        
        // Normalize dateRange (ensure it's an object or null)
        let normalizedRange = null;
        if (parsed.dateRange && typeof parsed.dateRange === 'object') {
            normalizedRange = parsed.dateRange;
        } else if (parsed.dateRange === true && parsed.checkIn && parsed.checkOut) {
            normalizedRange = { start: parsed.checkIn, end: parsed.checkOut };
        }

        const checkIn = parsed.checkIn || null;
        const checkOut = parsed.checkOut || null;
        
        let duration = parsed.durationNights;
        if (!duration && checkIn && checkOut) {
            duration = Math.round((new Date(checkOut).getTime() - new Date(checkIn).getTime()) / (1000 * 60 * 60 * 24));
        }

        const normalized: ParsedSearchIntent = {
            destinations: parsed.destinations || [],
            checkIn,
            checkOut,
            dateRange: normalizedRange,
            durationNights: duration || null,
            searchMode: parsed.searchMode || (normalizedRange ? 'range' : 'classic'),
            pax: parsed.pax || [{ adults: 2, children: 0, childrenAges: [] }],
            stars: parsed.stars || [],
            board: parsed.board || [],
            remainingQuery: parsed.remainingQuery || '',
            needsClarification: parsed.needsClarification || null,
        };

        console.log(`✅ [NLP Parse] Normalized:`, JSON.stringify(normalized, null, 2));
        return normalized;
    } catch (err) {
        console.error(`❌ [NLP Parse] Error parsing intent:`, err);
        // Fallback
        return {
            destinations: [],
            checkIn: null,
            checkOut: null,
            searchMode: 'classic',
            pax: [{ adults: 2, children: 0, childrenAges: [] }],
            remainingQuery: query
        };
    }
};
