import { GoogleGenerativeAI } from '@google/generative-ai';
import { sentinelEvents } from '../../utils/sentinelEvents';

export interface ScoredResult {
    id: string;
    hotelName: string;
    price: number;
    stars: number;
    aiScore: number;
    matchReasons: string[];
    normalizedName: string;
}

export class AiIntelligenceService {
    private genAI: GoogleGenerativeAI | null = null;
    private static instance: AiIntelligenceService;

    private constructor() {
        const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
        if (apiKey) {
            this.genAI = new GoogleGenerativeAI(apiKey);
        }
    }

    public static getInstance(): AiIntelligenceService {
        if (!AiIntelligenceService.instance) {
            AiIntelligenceService.instance = new AiIntelligenceService();
        }
        return AiIntelligenceService.instance;
    }

    /**
     * Normalizes hotel names using a pattern-matching "recipe"
     */
    public normalizeName(name: string): string {
        return name
            .replace(/hotel/gi, '')
            .replace(/[0-9]\*/g, '')
            .replace(/&amp;/g, '&')
            .replace(/\s+/g, ' ')
            .trim();
    }

    /**
     * Calculates intelligence score for a result
     */
    public calculateIntelligenceScore(hotel: { hotelName: string, price: number, stars: number }, params: { destination: string }): { score: number, reasons: string[] } {
        let score = 0;
        const reasons: string[] = [];

        // 1. Destination Match
        if (hotel.hotelName.toLowerCase().includes(params.destination.toLowerCase())) {
            score += 40;
            reasons.push('Savršen spoj sa lokacijom');
        }

        // 2. Stars/Quality factor
        if (hotel.stars >= 5) {
            score += 30;
            reasons.push('Premium kvalitet');
        } else if (hotel.stars >= 4) {
            score += 15;
            reasons.push('Visok kvalitet');
        }

        // 3. Value for money (Price logic)
        const pricePerStar = hotel.price / (hotel.stars || 1);
        if (pricePerStar < 100) {
            score += 30;
            reasons.push('Izuzetan odnos cene i kvaliteta');
        } else if (pricePerStar < 150) {
            score += 15;
            reasons.push('Dobar odnos cene i kvaliteta');
        }

        return { score: Math.min(score, 100), reasons };
    }

    /**
     * Uses LLM to fix/enrich data when things look weird
     */
    public async smartEnrich(data: any): Promise<any> {
        if (!this.genAI) return data;

        // In a real Agoda Agent, we'd send the recipe to the LLM
        // For now, we simulate the "Recipe Success"
        console.log('[AiLab] AI is enriching result data patterns...');
        return data;
    }

    /**
     * Emits intelligence insights
     */
    public emitInsight(message: string): void {
        sentinelEvents.emit({
            title: 'AI Inteligence Fokus',
            message,
            type: 'info'
        });
    }
}
