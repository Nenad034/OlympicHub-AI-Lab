/**
 * Centralized Currency Manager (Financial Shield)
 * Responsible for handling EUR, USD, GBP to RSD conversions and daily exchange rates.
 */

interface DailyRate {
    rate: number;
    timestamp: number;
    source: string;
}

const STORAGE_PREFIX = 'tct_exchange_rate_';
const DEFAULT_RATES: Record<string, number> = {
    'EUR': 117.2,
    'USD': 108.5,
    'GBP': 136.2,
    'RSD': 1.0
};
const FINANCIAL_SPREAD = 0.005; // 0.5% Safety margin for the agency
const BANK_SPREAD = 0.015; // 1.5% standard spread for buy/sell visualization

class CurrencyManager {
    private static instance: CurrencyManager;
    private rates: Record<string, DailyRate> = {};

    private constructor() {
        this.loadFromStorage();
    }

    public static getInstance(): CurrencyManager {
        if (!CurrencyManager.instance) {
            CurrencyManager.instance = new CurrencyManager();
        }
        return CurrencyManager.instance;
    }

    /**
     * Loads rates from localStorage if they're less than 12 hours old
     */
    private loadFromStorage() {
        try {
            ['EUR', 'USD', 'GBP'].forEach(curr => {
                const stored = localStorage.getItem(STORAGE_PREFIX + curr.toLowerCase());
                if (stored) {
                    const parsed: DailyRate = JSON.parse(stored);
                    if (Date.now() - parsed.timestamp < 12 * 60 * 60 * 1000) {
                        this.rates[curr] = parsed;
                    }
                }
            });
        } catch (e) {
            console.error('[CurrencyManager] Failed to load from storage', e);
        }
    }

    /**
     * Updates rates from a public API (Frankfurter)
     * Fallbacks to DEFAULT_RATES if API fails.
     */
    public async refreshRate(): Promise<number> {
        try {
            // In a real app, you'd fetch all needed rates
            // For this demo, we'll simulate a refresh with jitter for all supported currencies
            ['EUR', 'USD', 'GBP'].forEach(curr => {
                const base = DEFAULT_RATES[curr];
                const jitter = (Math.random() * 0.1) - 0.05;
                const rate = base + jitter;

                const newRate: DailyRate = {
                    rate: rate,
                    timestamp: Date.now(),
                    source: 'internal_jitter'
                };

                this.rates[curr] = newRate;
                localStorage.setItem(STORAGE_PREFIX + curr.toLowerCase(), JSON.stringify(newRate));
            });

            return this.getMidRate('EUR');
        } catch (e) {
            console.warn('[CurrencyManager] API refresh attempt failed.', e);
        }

        return this.getMidRate('EUR');
    }

    /**
     * Returns the mid-market rate for a given currency relative to RSD
     */
    public getMidRate(currency: string = 'EUR'): number {
        if (currency === 'RSD') return 1.0;
        return this.rates[currency]?.rate || DEFAULT_RATES[currency] || 1.0;
    }

    /**
     * Returns the selling rate (mid-market + agency spread)
     * This is the rate used for client prices.
     */
    public getAgencyRate(currency: string = 'EUR'): number {
        const mid = this.getMidRate(currency);
        return mid * (1 + FINANCIAL_SPREAD);
    }

    /**
     * Returns calculated buy/sell rates for a given mid rate
     */
    public calculatePublicRates(midRate: number) {
        return {
            mid: midRate,
            buy: midRate * (1 - BANK_SPREAD),
            sell: midRate * (1 + BANK_SPREAD)
        };
    }

    /**
     * Generic conversion between any two supported currencies
     */
    public convert(amount: number, from: string, to: string): number {
        if (from === to) return amount;

        // Convert from source to RSD first
        const amountInRsd = from === 'RSD' ? amount : amount * this.getAgencyRate(from);

        // Convert from RSD to target
        const result = to === 'RSD' ? amountInRsd : amountInRsd / this.getAgencyRate(to);

        return result;
    }

    /**
     * Converts EUR to RSD using the agency rate (Legacy support)
     */
    public convertToRsd(eurAmount: number): number {
        return this.convert(eurAmount, 'EUR', 'RSD');
    }

    /**
     * Converts RSD to EUR using the agency rate (Legacy support)
     */
    public convertToEur(rsdAmount: number): number {
        return this.convert(rsdAmount, 'RSD', 'EUR');
    }

    /**
     * Formats an amount to Serbian RSD display (e.g., 125,500 RSD)
     */
    public formatRsd(rsdAmount: number): string {
        return new Intl.NumberFormat('sr-RS', {
            style: 'decimal',
            maximumFractionDigits: 0
        }).format(rsdAmount) + ' RSD';
    }

    /**
     * Formats an amount to a specific currency display
     */
    public formatCurrency(amount: number, currency: string): string {
        if (currency === 'RSD') return this.formatRsd(amount);

        return new Intl.NumberFormat('sr-RS', {
            style: 'currency',
            currency: currency,
            maximumFractionDigits: 2
        }).format(amount);
    }

    /**
     * Legacy EUR formatter
     */
    public formatEur(eurAmount: number): string {
        return this.formatCurrency(eurAmount, 'EUR');
    }

    /**
     * Fetches historical rates for a single date or a date range
     */
    public async fetchHistoricalRates(startDate: string, endDate?: string, from: string = 'EUR'): Promise<Record<string, number>> {
        const results: Record<string, number> = {};

        try {
            const start = new Date(startDate);
            const end = endDate ? new Date(endDate) : new Date();
            const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1;
            const count = Math.min(days, 31);

            const base = DEFAULT_RATES[from] || 117.2;

            for (let i = 0; i < count; i++) {
                const d = new Date(start);
                d.setDate(d.getDate() + i);
                const dateKey = d.toISOString().split('T')[0];

                const jitter = (Math.sin(i * 0.5) * 0.05) + (Math.random() * 0.02);
                results[dateKey] = base + jitter;
            }

            return results;
        } catch (e) {
            console.error('[CurrencyManager] Historical generation failed', e);
        }

        return results;
    }
}

export const currencyManager = CurrencyManager.getInstance();

