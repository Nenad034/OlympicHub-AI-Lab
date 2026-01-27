/**
 * Mars API V1 - Price Calculator Service
 * 
 * Handles complex price calculations with base rates, supplements, discounts, and taxes
 */

import type {
    MarsUnit,
    MarsPricelist,
    MarsPricelistItem,
    MarsCommonItems,
    MarsPriceCalculationParams,
    MarsPriceCalculationResult,
    MarsPriceBreakdown,
} from '../../types/mars.types';

export class MarsPriceCalculator {
    /**
     * Calculate total price for a unit stay
     */
    calculatePrice(
        unit: MarsUnit,
        commonItems: MarsCommonItems,
        params: MarsPriceCalculationParams
    ): MarsPriceCalculationResult {
        console.log('[Mars Price] Calculating price for unit:', unit.name);
        console.log('[Mars Price] Params:', params);

        const checkIn = new Date(params.checkIn);
        const checkOut = new Date(params.checkOut);
        const nights = this.calculateNights(checkIn, checkOut);
        const totalGuests = params.adults + (params.children || 0);

        console.log(`[Mars Price] Nights: ${nights}, Guests: ${totalGuests}`);

        // Calculate base price
        const basePrice = this.calculateBasePrice(
            unit.pricelist.baseRate,
            checkIn,
            checkOut,
            nights,
            params
        );

        console.log(`[Mars Price] Base price: ${basePrice}`);

        // Calculate supplements (unit + common)
        const unitSupplements = this.calculateSupplements(
            unit.pricelist.supplement,
            checkIn,
            checkOut,
            nights,
            params
        );

        const commonSupplements = this.calculateSupplements(
            commonItems.supplement,
            checkIn,
            checkOut,
            nights,
            params
        );

        const supplements = [...unitSupplements, ...commonSupplements];
        const supplementsTotal = supplements.reduce((sum, s) => sum + s.amount, 0);

        console.log(`[Mars Price] Supplements: ${supplementsTotal}`, supplements);

        // Calculate discounts (unit + common)
        const unitDiscounts = this.calculateDiscounts(
            unit.pricelist.discount,
            basePrice + supplementsTotal,
            checkIn,
            checkOut,
            nights,
            params
        );

        const commonDiscounts = this.calculateDiscounts(
            commonItems.discount,
            basePrice + supplementsTotal,
            checkIn,
            checkOut,
            nights,
            params
        );

        const discounts = [...unitDiscounts, ...commonDiscounts];
        const discountsTotal = discounts.reduce((sum, d) => sum + d.amount, 0);

        console.log(`[Mars Price] Discounts: ${discountsTotal}`, discounts);

        // Calculate tourist tax (unit + common)
        const unitTax = this.calculateTouristTax(
            unit.pricelist.touristTax,
            checkIn,
            checkOut,
            nights,
            params
        );

        const commonTax = this.calculateTouristTax(
            commonItems.touristTax,
            checkIn,
            checkOut,
            nights,
            params
        );

        const touristTax = unitTax + commonTax;

        console.log(`[Mars Price] Tourist tax: ${touristTax}`);

        // Calculate total
        const totalPrice = basePrice + supplementsTotal - discountsTotal + touristTax;

        // Create breakdown
        const breakdown: string[] = [
            `Base price: €${basePrice.toFixed(2)} (${nights} nights)`,
        ];

        if (supplements.length > 0) {
            breakdown.push(`Supplements: €${supplementsTotal.toFixed(2)}`);
            supplements.forEach((s) => {
                breakdown.push(`  - ${s.title}: €${s.amount.toFixed(2)}`);
            });
        }

        if (discounts.length > 0) {
            breakdown.push(`Discounts: -€${discountsTotal.toFixed(2)}`);
            discounts.forEach((d) => {
                breakdown.push(`  - ${d.title}: -€${d.amount.toFixed(2)}`);
            });
        }

        if (touristTax > 0) {
            breakdown.push(`Tourist tax: €${touristTax.toFixed(2)}`);
        }

        breakdown.push(`Total: €${totalPrice.toFixed(2)}`);

        return {
            basePrice,
            supplements,
            discounts,
            touristTax,
            totalPrice,
            currency: 'EUR',
            breakdown,
        };
    }

    /**
     * Calculate base price
     */
    private calculateBasePrice(
        baseRates: MarsPricelistItem[],
        checkIn: Date,
        checkOut: Date,
        nights: number,
        params: MarsPriceCalculationParams
    ): number {
        let totalPrice = 0;

        // Find applicable base rates for each night
        for (let i = 0; i < nights; i++) {
            const currentDate = new Date(checkIn);
            currentDate.setDate(currentDate.getDate() + i);

            const rate = this.findApplicableRate(baseRates, currentDate, params);

            if (rate && rate.price) {
                const dailyPrice = this.calculateDailyPrice(rate, params);
                totalPrice += dailyPrice;
            }
        }

        return totalPrice;
    }

    /**
     * Calculate supplements
     */
    private calculateSupplements(
        supplements: MarsPricelistItem[],
        checkIn: Date,
        checkOut: Date,
        nights: number,
        params: MarsPriceCalculationParams
    ): MarsPriceBreakdown[] {
        const results: MarsPriceBreakdown[] = [];

        for (const supplement of supplements) {
            if (this.isApplicable(supplement, checkIn, params)) {
                const amount = this.calculateItemAmount(supplement, nights, params);
                if (amount > 0) {
                    results.push({
                        title: supplement.title || supplement.type || 'Supplement',
                        amount,
                        type: supplement.type || 'supplement',
                    });
                }
            }
        }

        return results;
    }

    /**
     * Calculate discounts
     */
    private calculateDiscounts(
        discounts: MarsPricelistItem[],
        baseAmount: number,
        checkIn: Date,
        checkOut: Date,
        nights: number,
        params: MarsPriceCalculationParams
    ): MarsPriceBreakdown[] {
        const results: MarsPriceBreakdown[] = [];

        for (const discount of discounts) {
            if (this.isApplicable(discount, checkIn, params)) {
                let amount = 0;

                if (discount.percent) {
                    // Percentage discount
                    amount = (baseAmount * discount.percent) / 100;
                } else if (discount.price) {
                    // Fixed amount discount
                    amount = this.calculateItemAmount(discount, nights, params);
                }

                if (amount > 0) {
                    results.push({
                        title: discount.title || discount.type || 'Discount',
                        amount,
                        type: discount.type || 'discount',
                    });
                }
            }
        }

        return results;
    }

    /**
     * Calculate tourist tax
     */
    private calculateTouristTax(
        taxes: MarsPricelistItem[],
        checkIn: Date,
        checkOut: Date,
        nights: number,
        params: MarsPriceCalculationParams
    ): number {
        let totalTax = 0;

        for (const tax of taxes) {
            if (this.isApplicable(tax, checkIn, params)) {
                const amount = this.calculateItemAmount(tax, nights, params);
                totalTax += amount;
            }
        }

        return totalTax;
    }

    /**
     * Find applicable rate for a specific date
     */
    private findApplicableRate(
        rates: MarsPricelistItem[],
        date: Date,
        params: MarsPriceCalculationParams
    ): MarsPricelistItem | null {
        for (const rate of rates) {
            const dateFrom = new Date(rate.dateFrom);
            const dateTo = new Date(rate.dateTo);

            if (date >= dateFrom && date <= dateTo) {
                // Check additional constraints
                if (this.isApplicable(rate, date, params)) {
                    return rate;
                }
            }
        }

        return null;
    }

    /**
     * Check if a pricelist item is applicable
     */
    private isApplicable(
        item: MarsPricelistItem,
        date: Date,
        params: MarsPriceCalculationParams
    ): boolean {
        // Check date range
        const dateFrom = new Date(item.dateFrom);
        const dateTo = new Date(item.dateTo);
        if (date < dateFrom || date > dateTo) {
            return false;
        }

        // Check min/max adults
        if (item.minAdult && params.adults < item.minAdult) return false;
        if (item.maxAdult && params.adults > item.maxAdult) return false;

        // Check min children
        if (item.minChild && (params.children || 0) < item.minChild) return false;

        // Check min/max stay
        const checkIn = new Date(params.checkIn);
        const checkOut = new Date(params.checkOut);
        const nights = this.calculateNights(checkIn, checkOut);

        if (item.minStay && nights < item.minStay) return false;
        if (item.maxStay && nights > item.maxStay) return false;

        return true;
    }

    /**
     * Calculate daily price based on payment type
     */
    private calculateDailyPrice(
        rate: MarsPricelistItem,
        params: MarsPriceCalculationParams
    ): number {
        if (!rate.price) return 0;

        const totalGuests = params.adults + (params.children || 0);

        switch (rate.paymentType) {
            case 'perPersonPerDay':
                return rate.price * totalGuests;
            case 'perPerson':
                return rate.price * totalGuests;
            case 'perDay':
            case 'Once':
            default:
                return rate.price;
        }
    }

    /**
     * Calculate item amount based on payment type
     */
    private calculateItemAmount(
        item: MarsPricelistItem,
        nights: number,
        params: MarsPriceCalculationParams
    ): number {
        if (!item.price) return 0;

        const totalGuests = params.adults + (params.children || 0);

        switch (item.paymentType) {
            case 'perPersonPerDay':
                return item.price * totalGuests * nights;
            case 'perPerson':
                return item.price * totalGuests;
            case 'perDay':
                return item.price * nights;
            case 'Once':
                return item.price;
            case 'perUnitPerWeek':
                const weeks = Math.ceil(nights / 7);
                return item.price * weeks;
            default:
                return item.price;
        }
    }

    /**
     * Calculate number of nights
     */
    private calculateNights(checkIn: Date, checkOut: Date): number {
        const diff = checkOut.getTime() - checkIn.getTime();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    }
}

// Singleton instance
export const marsPriceCalculator = new MarsPriceCalculator();
