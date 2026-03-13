import type { BaseRate, RuleEntry, DateRange } from './types';

export interface OccupancyRequirement {
    adults: number;
    children: number;
    childAges: number[];
}

export interface PricingResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    totalNet: number;
    totalGross: number;
    breakdown: string[];
}

/**
 * Advanced Pricing Engine for Olympic Hub
 * Handles complex logic for Vespera, MontenegroStars, Portoroz and others.
 */
export class PricingEngine {
    
    /**
     * Validiranje uzrasta dece spram tipa sobe (Specifično za Vespera logiku)
     * Primer: Standard soba ne prima decu stariju od 5 godina.
     */
    static validateOccupancy(roomType: string, req: OccupancyRequirement): { isValid: boolean; message?: string } {
        // VESPERA LOGIKA
        if (roomType.toLowerCase().includes('standard') && !roomType.toLowerCase().includes('plus')) {
            const hasOlderChild = req.childAges.some(age => age > 2);
            if (hasOlderChild || req.adults + req.children > 2) {
                return {
                    isValid: false,
                    message: "Vespera Standard sobe su isključivo 2+0 (ili 2+infant do 2 god). Za vaše putnike (2+1) obavezno izaberite Standard Plus ili Family sobu."
                };
            }
        }
        
        // DIONYSOS LOGIKA (Cyprus)
        if (roomType.toLowerCase().includes('dionysos') || roomType.toLowerCase().includes('cyprus')) {
            if (req.children > 2) {
                return {
                    isValid: false,
                    message: "Dionysos sobe podržavaju maksimalno dvoje dece. Za više od dvoje dece, molimo izaberite Connected Rooms."
                };
            }
        }

        // SOLVEX LOGIKA (Bulgaria)
        if (roomType.toLowerCase().includes('blue pearl') || roomType.toLowerCase().includes('solvex')) {
            if (req.adults > 3 && !roomType.toLowerCase().includes('apartment')) {
                return {
                    isValid: false,
                    message: "Solvex Standard sobe podržavaju maksimalno 3 odrasle osobe. Za 4 osobe potreban je Apartman."
                };
            }
        }
        
        // STANDARD VALIDACIJA KAPACITETA
        if (roomType.toLowerCase().includes('standard') && req.adults + req.children > 3 && !roomType.toLowerCase().includes('plus')) {
            return { isValid: false, message: "Standard soba prima maksimalno 3 osobe." };
        }

        return { isValid: true };

        return { isValid: true };
    }

    /**
     * Primena Stay Pay logike (Specifično za Montenegro Stars)
     * Primer: 7=6 (Gost plati 6 noći, ostaje 7)
     */
    static applyStayPay(nights: number, stayPayRule: string | null): number {
        if (!stayPayRule) return nights;
        
        // npr. "7=6", "14=12"
        const [stay, pay] = stayPayRule.split('=').map(Number);
        if (nights >= stay) {
            const multi = Math.floor(nights / stay);
            const remainder = nights % stay;
            return (multi * pay) + remainder;
        }
        return nights;
    }

    /**
     * Primena Short Stay doplate (Specifično za Vesperu)
     * Ako je boravak kraći od granice, cena se uvećava.
     */
    static calculateShortStaySurcharge(basePrice: number, nights: number, rules: any): number {
        if (nights < 2) {
            return basePrice * 1.20; // +20% doplata
        }
        return basePrice;
    }

    /**
     * Primena popusta (Cumulative vs Additive)
     * Implementira logiku izbora kumulativnog ili sabirnog obračuna
     */
    static applyDiscounts(basePrice: number, discounts: number[], strategy: 'cumulative' | 'additive' = 'cumulative'): number {
        if (strategy === 'cumulative') {
            return discounts.reduce((price, discount) => price * (1 - discount / 100), basePrice);
        } else {
            const totalDiscount = discounts.reduce((sum, d) => sum + d, 0);
            return basePrice * (1 - totalDiscount / 100);
        }
    }

    /**
     * Specifična EBD (Early Booking) logika za Dionysos
     */
    static calculateDionysosEBD(price: number, daysBefore: number): number {
        if (daysBefore >= 90) return price * 0.80; // -20%
        if (daysBefore >= 60) return price * 0.85; // -15%
        if (daysBefore >= 30) return price * 0.90; // -10%
        return price;
    }
}
