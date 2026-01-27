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
    private callCount = 0;
    private readonly MAX_CALLS = Number((import.meta as any).env?.VITE_AI_MAX_CALLS_PER_SESSION) || 50;

    private constructor() {
        const apiKey = (import.meta as any).env?.VITE_GEMINI_API_KEY;
        if (apiKey) {
            this.genAI = new GoogleGenerativeAI(apiKey);
            console.log('✨ AI Intelligence Service initialized with API Key');
        }
    }

    public static getInstance(): AiIntelligenceService {
        if (!AiIntelligenceService.instance) {
            AiIntelligenceService.instance = new AiIntelligenceService();
        }
        return AiIntelligenceService.instance;
    }

    /**
     * Checks if we are within usage limits
     */
    private checkLimits(): boolean {
        if (this.callCount >= this.MAX_CALLS) {
            console.warn('[AiLab] AI Usage limit reached for this session.');
            this.emitInsight('AI limit za ovu sesiju je dostignut radi štednje resursa.');
            return false;
        }
        return true;
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
        if (!this.genAI || !this.checkLimits()) return data;

        try {
            this.callCount++;
            const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

            // Simulation of AI pattern enrichment
            console.log(`[AiLab] LLM Call ${this.callCount}/${this.MAX_CALLS}: Enriching data...`);
            return data;
        } catch (error) {
            console.error('[AiLab] LLM Enrichment failed:', error);
            return data;
        }
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
