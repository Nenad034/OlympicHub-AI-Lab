/**
 * AISmartRouter.ts
 * Logic designed to minimize token consumption and prioritize local code execution.
 */

interface CacheEntry {
  response: string;
  timestamp: number;
}

class AISmartRouter {
  private cache: Map<string, CacheEntry> = new Map();
  private CACHE_DURATION = 1000 * 60 * 60; // 1 hour

  // Local Intent Map (No tokens used for these)
  private localKnowledge: Record<string, string> = {
    'termini': 'Svi letovi za Crnu Goru kreću svakog radnog dana u 10:00 i 18:00.',
    'dokumenti': 'Za putovanje u Crnu Goru državljanima Srbije dovoljna je važeća lična karta.',
    'osiguranje': 'Prime Putno Osiguranje pokriva sve troškove do 30.000€. Možemo ga dodati u vaš dosije za samo 1.5€ po danu.',
    'kontakt': 'Naša podrška je dostupna 24/7 na broj +381 11 123 456.',
  };

  async processQuery(query: string): Promise<string> {
    const q = query.toLowerCase().trim();

    // 1. Check Local Knowledge Base (Cost: 0 tokens)
    for (const [key, value] of Object.entries(this.localKnowledge)) {
      if (q.includes(key)) {
        console.log('[SmartRouter] Resolved by Local Knowledge');
        return value;
      }
    }

    // 2. Check Cache (Cost: 0 tokens)
    const cached = this.getCache(q);
    if (cached) {
      console.log('[SmartRouter] Resolved by Cache');
      return cached;
    }

    // 3. Simple Keyword Routing (Cost: 0 tokens)
    if (q.includes('hotel') && q.includes('budv')) {
      return 'U Budvi preporučujem Hotel Splendid za porodice ili Maestral za ljubitelje kazina i mira.';
    }

    // 4. Fallback to AI (Cost: Tokens consumed)
    // In a real app, this is where we call OpenAI/Google Gemini
    console.log('[SmartRouter] Routing to real AI (Mocked)');
    const aiResponse = await this.mockAIResponse(q);
    
    // Save to cache for future requests
    this.setCache(q, aiResponse);
    return aiResponse;
  }

  private setCache(key: string, value: string) {
    this.cache.set(key, { response: value, timestamp: Date.now() });
    // Also save to SessionStorage for persistence across reloads
    try {
      sessionStorage.setItem(`smart_ai_cache_${key}`, JSON.stringify({ response: value, timestamp: Date.now() }));
    } catch(e) {}
  }

  private getCache(key: string): string | null {
    // Check memory
    const entry = this.cache.get(key);
    if (entry && (Date.now() - entry.timestamp < this.CACHE_DURATION)) {
      return entry.response;
    }

    // Check persistence
    try {
      const stored = sessionStorage.getItem(`smart_ai_cache_${key}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Date.now() - parsed.timestamp < this.CACHE_DURATION) {
          return parsed.response;
        }
      }
    } catch(e) {}

    return null;
  }

  private async mockAIResponse(q: string): Promise<string> {
    // This simulates an expensive AI call with specific prompt constraints
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(`[AI] Na osnovu vašeg upita "${q}", predlažem da pogledate Aman Sveti Stefan jer trenutno nudi najbolji odnos cene i luksuza za vaš period.`);
      }, 800);
    });
  }
  async getRoomOptions(hotelId: string) {
    // Simulated DB call for complex room/board matrix
    const stdBase = hotelId === '1' ? 850 : 350;
    const suitesBase = hotelId === '1' ? 1200 : 600;

    const createBoards = (basePrice: number) => [
      { type: 'ND', label: 'Noćenje sa doručkom', price: basePrice },
      { type: 'PP', label: 'Polupansion (HB)', price: basePrice + 45 },
      { type: 'AI', label: 'All Inclusive', price: basePrice + 120 },
    ];

    return [
      { 
        id: 'r1', 
        name: 'Standard Double Room', 
        description: 'Udobna soba sa pogledom na planinu ili park.',
        boards: createBoards(stdBase)
      },
      { 
        id: 'r2', 
        name: 'Deluxe Sea View', 
        description: 'Direktan pogled na more, terasa i moderniji enterijer.',
        boards: createBoards(stdBase + 150)
      },
      { 
        id: 'r3', 
        name: 'Presidential Suite', 
        description: 'Vrhunski luksuz, dve prostorije i privatni jacuzzi.',
        boards: createBoards(suitesBase)
      }
    ];
  }
}

export const smartRouter = new AISmartRouter();
