import { SEARCH_ORCHESTRATOR_CONFIG } from './config';
import { UnifiedResult, ProviderId, ProviderPriority } from './types';

class SearchOrchestratorEngine {
    private config = SEARCH_ORCHESTRATOR_CONFIG;

    /**
     * Merges results from multiple providers into a single unified list
     * and applies priority-based sorting and weight adjustment.
     */
    public async processResults(allResults: UnifiedResult[]): Promise<UnifiedResult[]> {
        console.log(`[SearchOrchestrator] Processing ${allResults.length} raw results...`);

        // Apply weights and flags based on provider configuration
        const weightedResults = allResults.map(result => {
            const providerConf = this.config.priorities.find(p => p.id === result.provider);
            
            // Default weighting if not found
            let weight = providerConf ? providerConf.weight : 0;
            
            // Adjust weight based on region/tags
            if (providerConf?.tags?.includes(result.location.country.toLowerCase())) {
                weight += 20; // 20% boost for favored regions
            }

            return {
                ...result,
                priority: weight,
                isPrime: result.provider === 'manual' || (providerConf?.weight || 0) >= 80
            };
        });

        // Deduplication (If same hotel is found in multiple providers)
        const dedupedResults = this.deduplicate(weightedResults);

        // Final Sort: Priority DESC, then Price ASC
        return dedupedResults.sort((a, b) => {
            if (b.priority !== a.priority) {
                return b.priority - a.priority;
            }
            return a.price - b.price;
        }).slice(0, this.config.maxResults);
    }

    /**
     * Merges multiple results for the same hotel (based on hotel ID or name + location)
     * and displays the best offer while indicating it's available from multiple sources.
     */
    private deduplicate(results: UnifiedResult[]): UnifiedResult[] {
        const uniqueResults = new Map<string, UnifiedResult>();

        results.forEach(result => {
            const key = `${result.name.trim().toLowerCase()}_${result.location.city.trim().toLowerCase()}`;
            
            if (uniqueResults.has(key)) {
                const existing = uniqueResults.get(key)!;
                
                // If the new result has higher priority or lower price with same priority, it replaces
                if (result.priority > existing.priority || (result.priority === existing.priority && result.price < existing.price)) {
                    uniqueResults.set(key, result);
                }
            } else {
                uniqueResults.set(key, result);
            }
        });

        return Array.from(uniqueResults.values());
    }

    /**
     * Adjusts the configuration at runtime if needed (e.g., dynamic weight boost)
     */
    public setProviderWeight(id: ProviderId, newWeight: number) {
        const provider = this.config.priorities.find(p => p.id === id);
        if (provider) {
            provider.weight = newWeight;
            console.log(`[SearchOrchestrator] Provider ${id} weight updated to ${newWeight}.`);
        }
    }
}

export const orchestratorEngine = new SearchOrchestratorEngine();
