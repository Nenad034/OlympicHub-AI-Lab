import { multiKeyAI } from './multiKeyAI';
import { supabase } from '../supabaseClient';
import type { SmartSearchResult } from './smartSearchService';

export interface SemanticSearchParams {
    query: string;
    threshold?: number;
    limit?: number;
}

class SemanticSearchService {
    /**
     * Finds hotels using semantic similarity search
     */
    async searchHotels(params: SemanticSearchParams): Promise<SmartSearchResult[]> {
        console.log(`🧠 [SEMANTIC SEARCH] Query: "${params.query}"`);
        
        try {
            // 1. Convert text query to vector
            const vector = await multiKeyAI.embedContent(params.query);
            
            // 2. Call Supabase RPC function
            const { data, error } = await supabase.rpc('match_hotels', {
                query_embedding: vector,
                match_threshold: params.threshold || 0.4,
                match_count: params.limit || 20
            });

            if (error) throw error;

            console.log(`✅ [SEMANTIC SEARCH] Found ${data?.length || 0} matches`);

            // 3. Map to SmartSearchResult format
            return (data || []).map((h: any) => ({
                provider: 'AI-Internal',
                type: 'hotel',
                id: h.id,
                name: h.name,
                location: `${h.address?.city || ''}, ${h.address?.country || ''}`.trim(),
                stars: h.star_rating,
                price: 0, 
                currency: 'EUR',
                similarity: h.similarity,
                originalData: h,
                // Add description from content if available
                description: h.content?.description
            }));

        } catch (error: any) {
            console.error('❌ [SEMANTIC SEARCH] Failed:', error.message);
            throw error;
        }
    }

    /**
     * Hybrid Search - Combines semantic search with live provider data
     * This is the "Holy Grail" of AI Travel Search
     */
    async performHybridSearch(query: string, liveParams: any): Promise<SmartSearchResult[]> {
        // First, get the best matching hotels semantically
        const matches = await this.searchHotels({ query, limit: 10 });
        
        if (matches.length === 0) return [];

        // Now, we could filter a live search by these specific hotel names/IDs
        return matches;
    }
}

export const semanticSearchService = new SemanticSearchService();
export default semanticSearchService;
