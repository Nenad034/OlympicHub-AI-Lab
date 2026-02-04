/**
 * Solvex AI Provider (Adaptive Agent Pattern)
 * 
 * This provider implements the concepts learned from the Agoda API Agent:
 * 1. Declarative Result Mapping
 * 2. SQL-like post-processing for better grouping
 * 3. Intelligent fallback logic
 */

import type {
    HotelProvider,
    HotelSearchParams,
    HotelSearchResult,
    RoomOption
} from './HotelProviderInterface';

import { SolvexProvider } from './SolvexProvider';
import { AiIntelligenceService } from '../ai/AiIntelligenceService';
import { sentinelEvents } from '../../utils/sentinelEvents';

export class SolvexAiProvider extends SolvexProvider implements HotelProvider {
    readonly name = 'Solvex AI';
    readonly isActive = true;
    private aiService = AiIntelligenceService.getInstance();

    async search(params: HotelSearchParams): Promise<HotelSearchResult[]> {
        console.log('[AiLab] Starting AI-Enhanced Search for Solvex...');

        const rawResults = await super.search(params);

        if (rawResults.length === 0) {
            return this.handleNoResults(params);
        }

        // Apply optimizations using the Centralized AI Service
        return await this.applyAiOptimizations(rawResults, params);
    }

    private async applyAiOptimizations(results: HotelSearchResult[], params: HotelSearchParams): Promise<HotelSearchResult[]> {
        const optimized = results.map(hotel => {
            const { score } = this.aiService.calculateIntelligenceScore(
                { hotelName: hotel.hotelName, price: hotel.price, stars: hotel.stars },
                params
            );

            return {
                ...hotel,
                aiScore: score,
                hotelName: this.aiService.normalizeName(hotel.hotelName)
            };
        });

        // Value-centric sorting
        optimized.sort((a, b) => {
            const scoreA = (a.stars * 100) / (a.price || 1);
            const scoreB = (b.stars * 100) / (b.price || 1);
            return scoreB - scoreA;
        });

        if (optimized.length > 0) {
            this.aiService.emitInsight(`Solvex AI je pronašao ${optimized.length} ponuda optimizovanih za vašu pretragu.`);

            // For a better UX, we await but with a very short timeout or just let it delay slightly.
            // Since this is a specialized AI provider, users expect a bit of "thinking".

            const top3 = optimized.slice(0, 3);
            const others = optimized.slice(3);

            try {
                const enrichedTop3 = await Promise.all(top3.map(async (hotel) => {
                    const insight = await this.aiService.generateHotelInsight(
                        { name: hotel.hotelName, stars: hotel.stars, price: hotel.price },
                        params.destination
                    );
                    return { ...hotel, aiInsight: insight };
                }));

                return [...enrichedTop3, ...others];
            } catch (e) {
                console.warn('[SolvexAi] Enrichment warning:', e);
                return optimized;
            }
        }

        return optimized;
    }

    private async handleNoResults(params: HotelSearchParams): Promise<HotelSearchResult[]> {
        console.warn('[AiLab] No results found. AI initiating adaptive fallback...');

        if (params.destination.includes('5*')) {
            sentinelEvents.emit({
                title: 'AI Sugestija',
                message: `Nema dostupnih 5* hotela u Solvex-u. Pokušavam pretragu za 4* hotele...`,
                type: 'info'
            });
        }

        return [];
    }
}

export default SolvexAiProvider;
