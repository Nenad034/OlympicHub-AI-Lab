/**
 * FX Service - Foreign Exchange Rates Management
 * Fetches real-time rates from NBS (National Bank of Serbia) via public API
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
     * Fetches current exchange rates from NBS
     */
    async getCurrentRates(): Promise<ExchangeRate[]> {
        try {
            // Using public API for NBS middle exchange list
            const response = await fetch('https://api.kurs.rs/v1/current');

            if (!response.ok) {
                throw new Error('Failed to fetch NBS rates');
            }

            const data = await response.json();

            // Map common NBS currencies
            // Note: The structure of api.kurs.rs usually includes "result" then currency codes
            const rates = data.result || {};

            return [
                {
                    base: 'EUR',
                    target: 'RSD',
                    rate: parseFloat(rates.eur?.sre || '117.2'),
                    trend: rates.eur?.trend === 'up' ? 'up' : rates.eur?.trend === 'down' ? 'down' : 'stable',
                    changePercent: parseFloat(rates.eur?.pct || '0')
                },
                {
                    base: 'EUR',
                    target: 'USD',
                    rate: parseFloat(rates.usd?.sre || '1.08') / parseFloat(rates.eur?.sre || '117.2'),
                    trend: 'stable',
                    changePercent: 0
                },
                {
                    base: 'EUR',
                    target: 'BGN',
                    rate: 1.95, // Usually fixed or stable
                    trend: 'stable',
                    changePercent: 0
                }
            ];
        } catch (error) {
            console.warn('[FX Service] NBS Fetch failed, using fallback rates:', error);
            // Fallback to stable rates if API is down
            return [
                { base: 'EUR', target: 'USD', rate: 1.08, trend: 'stable', changePercent: 0 },
                { base: 'EUR', target: 'RSD', rate: 117.2025, trend: 'stable', changePercent: 0 },
                { base: 'EUR', target: 'BGN', rate: 1.9558, trend: 'stable', changePercent: 0 },
            ];
        }
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
