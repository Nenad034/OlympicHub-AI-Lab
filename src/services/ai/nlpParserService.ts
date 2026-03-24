import multiKeyAI from '../multiKeyAI';

export interface ParsedSearchIntent {
    destinations: string[];
    checkIn: string | null;      // YYYY-MM-DD
    checkOut: string | null;     // YYYY-MM-DD
    dateRange?: { start: string, end: string }; // Optional overall period
    durationNights?: number;      // e.g. 7
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
3. dateRange: If the user specifies a range (e.g. "between July 15 and 29") but also a duration ("7 nights"), put the period in "dateRange" { start, end } and calculate checkIn for the MIDPOINT of that period for the requested duration.
4. durationNights: Extract explicitly requested duration (e.g., "7 nocenja" -> 7).
5. pax: Array of room objects. If the user asks for "5 persons" or similar high occupancy, check "needsClarification".
6. needsClarification: 
   - Set to "pax_split" if total persons >= 5 and the user hasn't specified if they want one or multiple units.
   - Set to null otherwise.
7. stars/board: Array of codes (3,4,5 / RO,BB,HB,FB,AI,UAI).
8. remainingQuery: Leftover details.

User Query: "${query}"

Return ONLY valid JSON.
Example Response for "7 nocenja u periodu 15-29.07 za 5 osoba":
{
  "destinations": [],
  "checkIn": "2026-07-22",
  "checkOut": "2026-07-29",
  "dateRange": { "start": "2026-07-15", "end": "2026-07-29" },
  "durationNights": 7,
  "pax": [{ "adults": 5, "children": 0, "childrenAges": [] }],
  "needsClarification": "pax_split",
  "remainingQuery": ""
}
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
        console.log(`✅ [NLP Parse] Result:`, parsed);
        
        return {
            destinations: parsed.destinations || [],
            checkIn: parsed.checkIn || null,
            checkOut: parsed.checkOut || null,
            dateRange: parsed.dateRange || null,
            durationNights: parsed.durationNights || (parsed.checkIn && parsed.checkOut ? Math.round((new Date(parsed.checkOut).getTime() - new Date(parsed.checkIn).getTime()) / (1000 * 60 * 60 * 24)) : null),
            pax: parsed.pax || [{ adults: 2, children: 0, childrenAges: [] }],
            stars: parsed.stars || [],
            board: parsed.board || [],
            remainingQuery: parsed.remainingQuery || '',
            needsClarification: parsed.needsClarification || null,
        };
    } catch (err) {
        console.error(`❌ [NLP Parse] Error parsing intent:`, err);
        // Fallback
        return {
            destinations: [],
            checkIn: null,
            checkOut: null,
            pax: [{ adults: 2, children: 0, childrenAges: [] }],
            remainingQuery: query
        };
    }
};
