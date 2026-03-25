/**
 * AI Usage Tracking & Quota Service
 * Monitors token consumption and handles budget alerts
 */

import { quotaNotificationService } from './quotaNotificationService';

class AiUsageService {
    private readonly storageKey = 'ai_usage_metrics';
    private readonly defaultQuota = 500000; // 500K tokens / day by default

    constructor() {
        this.initializeMetrics();
    }

    private initializeMetrics() {
        if (!localStorage.getItem(this.storageKey)) {
            const initialMetrics = {
                lastReset: new Date().toISOString(),
                dailyUsed: 0,
                dailyLimit: this.defaultQuota, // Tokens / day
                totalHistorical: 0,
                providerMetrics: {
                    gemini: { dailyUsed: 0, limit: 300000 },
                    'gemini-embedding': { dailyUsed: 0, limit: 200000 }
                }
            };
            localStorage.setItem(this.storageKey, JSON.stringify(initialMetrics));
        }
        this.checkDayReset();
    }

    private checkDayReset() {
        const metrics = this.getMetrics();
        const lastDate = new Date(metrics.lastReset).toLocaleDateString();
        const nowDate = new Date().toLocaleDateString();

        if (lastDate !== nowDate) {
            console.log('🌅 [AI USAGE] New day detected! Resetting daily quotas.');
            metrics.lastReset = new Date().toISOString();
            metrics.dailyUsed = 0;
            // Also reset individuals
            Object.keys(metrics.providerMetrics).forEach(p => {
                metrics.providerMetrics[p].dailyUsed = 0;
            });
            this.saveMetrics(metrics);
        }
    }

    recordUsage(provider: string, tokens: number) {
        this.checkDayReset();
        const metrics = this.getMetrics();
        
        metrics.dailyUsed += tokens;
        metrics.totalHistorical += tokens;
        
        if (metrics.providerMetrics[provider]) {
            metrics.providerMetrics[provider].dailyUsed += tokens;
        } else {
            metrics.providerMetrics[provider] = { dailyUsed: tokens, limit: 100000 };
        }
        
        this.saveMetrics(metrics);
        
        const providerData = metrics.providerMetrics[provider];
        if (providerData) {
            quotaNotificationService.checkAndAlert(
                provider as any, 
                providerData.dailyUsed, 
                providerData.limit
            );
        }
    }

    checkQuotaBeforeExecution(provider: string): void {
        const metrics = this.getMetrics();
        const prov = metrics.providerMetrics[provider];
        
        if (prov && prov.dailyUsed >= prov.limit) {
            console.error(`🛑 [AI USAGE] CRITICAL: Daily limit reached for ${provider}! Blocked.`);
            throw new Error(`AI Usage daily limit reached for ${provider}`);
        }
    }

    private getMetrics() {
        return JSON.parse(localStorage.getItem(this.storageKey) || '{}');
    }

    private saveMetrics(metrics: any) {
        localStorage.setItem(this.storageKey, JSON.stringify(metrics));
    }

    getReport() {
        return this.getMetrics();
    }
}

export const aiUsageService = new AiUsageService();
export default aiUsageService;
