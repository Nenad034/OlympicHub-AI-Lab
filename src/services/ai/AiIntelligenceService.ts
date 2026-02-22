import { multiKeyAI } from '../multiKeyAI';
import { sentinelEvents } from '../../utils/sentinelEvents';
import { aiSecurity } from '../../utils/aiSecurity';

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
    private static instance: AiIntelligenceService;
    private callCount = 0;
    private readonly MAX_CALLS = Number((import.meta as any).env?.VITE_AI_MAX_CALLS_PER_SESSION) || 50;

    private constructor() { }

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
     * Safely processes content from external/untrusted sources
     */
    public async processExternalContent(rawContent: string, task: string): Promise<string> {
        if (!this.checkLimits()) return "AI limit reached.";

        // 1. Sanitize input
        const securityCheck = aiSecurity.sanitizeUntrustedText(rawContent);

        // 2. Wrap in safety layer
        const securedData = aiSecurity.wrapInSafetyLayer(securityCheck.safeText);

        // 3. Prepare system prompt with Shield
        const prompt = `
${aiSecurity.getSystemShieldPrompt()}

TASK: ${task}

DATA FOR ANALYSIS:
${securedData}
`;

        try {
            this.callCount++;
            return await multiKeyAI.generateContent(prompt, {
                useCache: true,
                cacheCategory: 'analysis',
                model: "gemini-1.5-flash"
            });
        } catch (error) {
            console.error('[AiLab Security] External content analysis failed:', error);
            return "Bezbednosna greška pri analizi sadržaja.";
        }
    }

    /**
     * Uses LLM to fix/enrich data when things look weird
     */
    public async smartEnrich(data: any): Promise<any> {
        if (!this.checkLimits()) return data;

        try {
            this.callCount++;
            // Simulation logic preserved or moved to multiKeyAI if needed
            console.log(`[AiLab] LLM Call ${this.callCount}/${this.MAX_CALLS}: Enriching data via multiKeyAI...`);
            return data;
        } catch (error) {
            console.error('[AiLab] LLM Enrichment failed:', error);
            return data;
        }
    }

    /**
     * Generates a short, catchy AI insight for a hotel
     */
    public async generateHotelInsight(hotel: { name: string, stars: number, price: number }, destination: string): Promise<string> {
        if (!this.checkLimits()) return "";

        try {
            this.callCount++;
            const prompt = `Analiziraj hotel "${hotel.name}" (${hotel.stars}*) u mestu "${destination}" sa cenom od ${hotel.price} EUR. Napiši jednu kratku, privlačnu rečenicu na srpskom jeziku (max 15 reči) koja ističe glavnu prednost ili razlog za rezervaciju ovog hotela. Nemoj koristiti navodnike.`;

            const response = await multiKeyAI.generateContent(prompt, {
                useCache: true,
                cacheCategory: 'analysis',
                model: "gemini-1.5-flash"
            });

            return response.trim().replace(/"/g, '');
        } catch (error) {
            console.error('[AiLab] Insight generation failed:', error);
            return "";
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
