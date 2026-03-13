import { multiKeyAI } from '../multiKeyAI';
import { pricingService } from '../pricing/pricingService';

export interface PricingCommand {
    action: 'INCREASE' | 'DECREASE' | 'SET' | 'UNKNOWN';
    target: 'NET_PRICE' | 'GROSS_PRICE' | 'MARGIN';
    value: number;
    unit: 'PERCENT' | 'FIXED';
    hotel?: string | null;
    roomType?: string | null;
    dateFrom?: string | null; // YYYY-MM-DD
    dateTo?: string | null;   // YYYY-MM-DD
}

export class RevenueOptimizationAgent {
    /**
     * Parses a natural language command into a structured PricingCommand.
     * Optimized for token usage with concise system prompt and caching.
     */
    static async parseCommand(userMessage: string): Promise<PricingCommand> {
        const systemPrompt = `Analyze pricing command. Return JSON.
Action: INCREASE, DECREASE, SET, UNKNOWN.
Target: NET_PRICE, GROSS_PRICE, MARGIN.
Value: num. Unit: PERCENT, FIXED.
Hotel/Room: str/null. Dates: YYYY-MM-DD/null.
Infer: "July" -> 2026-07-01 to 2026-07-31. Current year: 2026.
Default: Target=NET_PRICE, Unit=PERCENT.
Return ONLY JSON: {"action":"...","target":"...","value":0,"unit":"...","hotel":"...","roomType":"...","dateFrom":"...","dateTo":"..."}`;

        try {
            const response = await multiKeyAI.generateContent(`${systemPrompt}\n\nUser: ${userMessage}`, {
                useCache: true,
                cacheCategory: 'prices',
                temperature: 0.1,
                maxOutputTokens: 200
            });

            const jsonStr = response.replace(/```json|```/g, '').trim();
            const parsed = JSON.parse(jsonStr);
            
            // Normalize fields if AI used old underscores
            return {
                action: parsed.action || 'UNKNOWN',
                target: parsed.target || 'NET_PRICE',
                value: parsed.value || 0,
                unit: parsed.unit || (parsed.unit === 'AMOUNT' ? 'FIXED' : 'PERCENT'),
                hotel: parsed.hotel || parsed.hotel_name || null,
                roomType: parsed.roomType || parsed.room_type || null,
                dateFrom: parsed.dateFrom || parsed.date_from || null,
                dateTo: parsed.dateTo || parsed.date_to || null
            };
        } catch (error) {
            console.error('[PricingAgent] Parsing failed:', error);
            return { action: 'UNKNOWN', target: 'NET_PRICE', value: 0, unit: 'PERCENT' };
        }
    }

    /**
     * Executes the parsed command directly on the Supabase database.
     */
    static async executeUpdate(command: PricingCommand): Promise<{ success: boolean; modifiedCount: number; profitImpact: string }> {
        console.log('[PricingAgent] Executing DB Update:', command);
        
        // Use the pricingService to find and update items
        const pricelists = await pricingService.getPricelists();
        let affectedPeriods: any[] = [];
        
        for (const pl of pricelists) {
            const periods = pl.price_periods || [];
            const matches = periods.filter((p: any) => {
                const hotelMatch = !command.hotel || pl.title.toLowerCase().includes(command.hotel.toLowerCase());
                const roomMatch = !command.roomType || p.room_type_name.toLowerCase().includes(command.roomType.toLowerCase());
                
                let dateMatch = true;
                if (command.dateFrom && p.date_to < command.dateFrom) dateMatch = false;
                if (command.dateTo && p.date_from > command.dateTo) dateMatch = false;

                return hotelMatch && roomMatch && dateMatch;
            });
            affectedPeriods = [...affectedPeriods, ...matches];
        }

        if (affectedPeriods.length === 0) {
            return { success: false, modifiedCount: 0, profitImpact: 'Nema pronađenih stavki za ove kriterijume.' };
        }

        // Perform updates (relying on DB triggers for consistency)
        for (const p of affectedPeriods) {
            let newVal = p.net_price;
            const targetField = command.target === 'MARGIN' ? 'margin_percent' : 'net_price';
            const currentVal = targetField === 'margin_percent' ? p.margin_percent : p.net_price;

            if (command.action === 'INCREASE') {
                newVal = command.unit === 'PERCENT' ? currentVal * (1 + command.value / 100) : currentVal + command.value;
            } else if (command.action === 'DECREASE') {
                newVal = command.unit === 'PERCENT' ? currentVal * (1 - command.value / 100) : currentVal - command.value;
            } else if (command.action === 'SET') {
                newVal = command.value;
            }

            await pricingService.updatePricePeriod(p.id, { 
                [targetField]: newVal
            });
        }

        return { 
            success: true, 
            modifiedCount: affectedPeriods.length, 
            profitImpact: `Uspešno ažurirano ${affectedPeriods.length} stavki. Baza je automatski preračunala Bruto i Zaradu.` 
        };
    }
}
