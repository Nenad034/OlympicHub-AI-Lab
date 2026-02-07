/**
 * AI Usage Service
 * Centralized tracking for token usage and API calls
 */

import { quotaNotificationService } from './quotaNotificationService';

export interface UsageData {
    dailyUsed: number;
    weeklyUsed: number;
    monthlyUsed: number;
    totalCalls: number;
    avgPerRequest: number;
    lastReset: string;
}

class AIUsageService {
    private readonly providerKeys = {
        'gemini': 'ai_quota_gemini',
        'openai': 'ai_quota_openai',
        'claude': 'ai_quota_claude'
    };

    private readonly limits = {
        'gemini': 1000000,
        'openai': 500000,
        'claude': 750000
    };

    /**
     * Record token usage for a provider
     */
    recordUsage(provider: 'gemini' | 'openai' | 'claude', tokens: number) {
        const key = this.providerKeys[provider];
        const saved = localStorage.getItem(key);

        let data: UsageData = saved ? JSON.parse(saved) : {
            dailyUsed: 0,
            weeklyUsed: 0,
            monthlyUsed: 0,
            totalCalls: 0,
            avgPerRequest: 0,
            lastReset: new Date().toISOString()
        };

        // Check for daily reset
        const lastReset = new Date(data.lastReset);
        const now = new Date();
        if (lastReset.toDateString() !== now.toDateString()) {
            data.dailyUsed = 0;
            data.lastReset = now.toISOString();
        }

        // Update stats
        data.dailyUsed += tokens;
        data.weeklyUsed += tokens;
        data.monthlyUsed += tokens;
        data.totalCalls += 1;
        data.avgPerRequest = Math.round(data.dailyUsed / data.totalCalls);

        localStorage.setItem(key, JSON.stringify(data));
        console.log(`📊 [USAGE] Recorded ${tokens} tokens for ${provider}. Daily: ${data.dailyUsed}`);

        // Check for alerts
        quotaNotificationService.checkAndAlert(provider, data.dailyUsed, this.limits[provider]);
    }

    /**
     * Get current usage for a provider
     */
    getUsage(provider: 'gemini' | 'openai' | 'claude'): UsageData {
        const key = this.providerKeys[provider];
        const saved = localStorage.getItem(key);
        return saved ? JSON.parse(saved) : {
            dailyUsed: 0,
            weeklyUsed: 0,
            monthlyUsed: 0,
            totalCalls: 0,
            avgPerRequest: 0,
            lastReset: new Date().toISOString()
        };
    }
}

export const aiUsageService = new AIUsageService();
export default aiUsageService;
