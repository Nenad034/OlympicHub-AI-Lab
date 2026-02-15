/**
 * FX Service - Foreign Exchange Rates Management
 */

export interface ExchangeRate {
    base: string;
    target: string;
    rate: number;
    trend: 'up' | 'down' | 'stable';
    changePercent: number;
}

export const fxService = {
    /**
     * Simulates fetching current exchange rates
     */
    async getCurrentRates(): Promise<ExchangeRate[]> {
        // Mock rates for EUR as base
        return [
            { base: 'EUR', target: 'USD', rate: 1.08, trend: 'down', changePercent: -0.2 },
            { base: 'EUR', target: 'RSD', rate: 117.2, trend: 'stable', changePercent: 0.05 },
            { base: 'EUR', target: 'BGN', rate: 1.95, trend: 'stable', changePercent: 0 },
            { base: 'EUR', target: 'GBP', rate: 0.85, trend: 'up', changePercent: 0.15 },
        ];
    },

    /**
     * Calculates gain/loss based on booking rate vs current rate
     */
    calculateExposure(amount: number, bookingRate: number, currentRate: number): { exposure: number; isRisk: boolean } {
        const valueAtBooking = amount / bookingRate;
        const valueNow = amount / currentRate;
        const diff = valueNow - valueAtBooking;

        return {
            exposure: diff,
            isRisk: diff > 0 // If we need more base currency to pay the same target amount, it's a risk
        };
    }
};
