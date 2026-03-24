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
You are a travel agent assistant parsing natural language queries into strict JSON.
Today's date is: ${new Date().toISOString().split('T')[0]}.
Your job is to extract search parameters from the user's query and map them exactly to this schema.

Instructions:
1. destinations: Array of detected city/country/hotel names.
2. checkIn / checkOut: Specific dates in YYYY-MM-DD format. 
3. dateRange: If the user specifies a range (e.g. "between July 15 and 29") but also a duration ("7 nights").
4. durationNights: Extract explicitly requested duration (e.g., "7 nocenja" -> 7).
5. stars: Array of strings representing requested star counts (e.g. "4 zvezdice" -> ["4"]).
6. board: Array of codes for requested meal plans. 
   Mappings: "polupansion" -> "HB", "doručak" -> "BB", "all inclusive" -> "AI", "pun pansion" -> "FB", "noćenje" -> "RO".
7. searchMode: 
   - "range" ONLY if the user explicitly asks for a flexible period or a window larger than the stay (e.g. "između 10 i 20. jula za 7 noći", "bilo kada u avgustu na 10 dana").
   - "classic" if they give specific arrival and departure dates (e.g. "od 10. do 20. jula", "u periodu 10-20.08.2026").
8. pax: Array of room objects.
9. If no destination is mentioned but it is a search query, set destinations to ["Bulgaria"] as a default.
10. needsClarification: "pax_split" if total persons >= 5 without room details.

User Query: "${query}"

Return ONLY valid JSON.
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
