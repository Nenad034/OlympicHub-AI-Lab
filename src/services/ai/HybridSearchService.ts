import { performSmartSearch } from '../smartSearchService';
import { semanticSearchService } from '../semanticSearchService';
import { multiKeyAI } from '../multiKeyAI';
import type { HotelSearchResult } from '../../pages/PrimeSmartSearch/types';

export class HybridSearchEngine {
    private static instance: HybridSearchEngine;
    
    constructor() {}
    
    public static getInstance() {
        if (!HybridSearchEngine.instance) {
            HybridSearchEngine.instance = new HybridSearchEngine();
        }
        return HybridSearchEngine.instance;
    }

    /**
     * Fast Vector Search (Supabase Only)
     * Can be triggered early as it doesn't need check-in/out dates
     */
    async getVectorMatches(query: string) {
        console.log(`🧠 [HYBRID ENGINE] Pre-fetching semantic matches for: "${query}"`);
        return await semanticSearchService.searchHotels({ query, threshold: 0.35, limit: 12 });
    }

    /**
     * Modern entry point for parallel-optimized search
     */
    async executeHybridSearch(query: string, params: any) {
        const [liveResults, semanticMatches] = await Promise.all([
            performSmartSearch({ ...params, searchType: 'hotel' }),
            this.getVectorMatches(query)
        ]);
        return await this.executeFusedSearch(semanticMatches, params, query, liveResults);
    }

    /**
     * Logic for fusing results with optional live data injection
     */
    async executeFusedSearch(semanticMatches: any[], params: any, query: string, liveResultsInput?: any[]) {
        const liveResults = liveResultsInput || await performSmartSearch({ 
            ...params, 
            searchType: 'hotel',
            onPartialResults: params.onPartialResults // PASS THROUGH
        });
        
        console.log(`📡 [HYBRID ENGINE] Results: Live(${liveResults.length}), Semantic(${semanticMatches.length})`);

        // STEP 1: AGENTIC FUSION & RE-RANKING
        const fusedResults = this.fuseResults(liveResults, semanticMatches);
        
        // STEP 2: AI ANALYSIS & ENRICHMENT (Optimized: only top 3 for speed)
        const topResults = fusedResults.slice(0, 3); 
        const enrichedResults = await this.enrichTopResults(topResults, query);
        
        return [...enrichedResults, ...fusedResults.slice(3)];
    }

    /**
     * Combines Vector results with Live Provider results
     */
    private fuseResults(live: any[], semantic: any[]) {
        const merged = new Map<string, any>();
        
        // 1. Add all live results as base
        live.forEach(hotel => {
            merged.set(hotel.name.toLowerCase(), {
                ...hotel,
                aiScore: 50, // Base score
                matchReason: 'Pronađeno putem agregatora'
            });
        });

        // 2. Score boost from Semantic matches
        semantic.forEach(match => {
            const key = match.name.toLowerCase();
            if (merged.has(key)) {
                // Perfect hit: semantically relevant AND has price/availability
                const existing = merged.get(key);
                merged.set(key, {
                    ...existing,
                    aiScore: 98, // Ultra priority
                    matchReason: 'Odlično odgovara vašim željama'
                });
            }
            // Logic for adding non-live semantic matches was removed to avoid mock data injection
        });

        // 3. Sort by AI Score
        return Array.from(merged.values()).sort((a, b) => b.aiScore - a.aiScore);
    }

    /**
     * Uses Gemini to generate "Why this hotel?" insights in Serbian
     */
    private async enrichTopResults(results: any[], originalQuery: string) {
        if (results.length === 0) return results;

        try {
            const hotelList = results.map((h, i) => `${i+1}. ${h.name}`).join('\n');
            const prompt = `
                Kao AI agent Olympic Travel-a, za svaki od ovih hotela objasni u JEDNOJ rečenici na srpskom jeziku 
                zašto je odličan izbor za upit: "${originalQuery}". 
                
                Hoteli:
                ${hotelList}

                Vrati odgovor striktno kao JSON niz stringova.
                Maksimalno 10 reči po rečenici. Što kraće i jasnije.
            `;
            
            const rawResponse = await multiKeyAI.generateContent(prompt, { 
                useCache: true, 
                cacheCategory: 'analysis' 
            });

            // Extract JSON from response (handling potential markdown formatting)
            const jsonStr = rawResponse.replace(/```json/g, '').replace(/```/g, '').trim();
            const insights: string[] = JSON.parse(jsonStr);

            return results.map((hotel, index) => ({
                ...hotel,
                aiInsight: insights[index] || 'Odličan izbor prema vašim kriterijumima.'
            }));

        } catch (e) {
            console.warn('[HYBRID ENGINE] Enrichment skipped:', e);
            return results.map(hotel => ({
                ...hotel,
                aiInsight: hotel.matchReason || 'Preporučen hotel u ovoj destinaciji.'
            }));
        }
    }
}

export const hybridSearchEngine = HybridSearchEngine.getInstance();
