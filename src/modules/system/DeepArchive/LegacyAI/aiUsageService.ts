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
        'gemini-embedding': 'ai_quota_gemini_embed',
        'openai': 'ai_quota_openai',
        'claude': 'ai_quota_claude'
    };

    private readonly limits = {
        'gemini': 1000000,
        'gemini-embedding': 1000, // 1000 requests per day for free tier
        'openai': 500000,
        'claude': 750000
    };

    /**
     * Record token usage for a provider
     */
    recordUsage(provider: 'gemini' | 'gemini-embedding' | 'openai' | 'claude', tokens: number) {
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
        if (provider === 'gemini-embedding') {
            data.dailyUsed += 1; // Track requests
            data.weeklyUsed += 1;
            data.monthlyUsed += 1;
        } else {
            data.dailyUsed += tokens; // Track tokens
            data.weeklyUsed += tokens;
            data.monthlyUsed += tokens;
        }
        
        data.totalCalls += 1;
        // For embeddings, avgPerRequest becomes average characters
        data.avgPerRequest = Math.round((provider === 'gemini-embedding' ? tokens * 4 : data.dailyUsed) / data.totalCalls);

        localStorage.setItem(key, JSON.stringify(data));
        console.group(`📊 [AI USAGE] ${provider.toUpperCase()}`);
        console.log(`Tokens: ${tokens}`);
        console.log(`Daily Total: ${data.dailyUsed}`);
        console.log(`Weekly Total: ${data.weeklyUsed}`);
        console.groupEnd();

        // Check for alerts
        quotaNotificationService.checkAndAlert(provider, data.dailyUsed, this.limits[provider]);
    }

    /**
     * Check if a provider is within quota before execution
     */
    isWithinQuota(provider: 'gemini' | 'gemini-embedding' | 'openai' | 'claude'): boolean {
        const usage = this.getUsage(provider);
        const limit = this.limits[provider];
        return usage.dailyUsed < limit;
    }

    /**
     * Throws an error if over quota
     */
    checkQuotaBeforeExecution(provider: 'gemini' | 'gemini-embedding' | 'openai' | 'claude') {
        if (!this.isWithinQuota(provider)) {
            const error = new Error(`Dnevni limit za AI (${provider}) je dostignut. Molim pokušajte sutra.`);
            (error as any).status = 403;
            (error as any).isQuotaExceeded = true;
            throw error;
        }
    }

    /**
     * Get current usage for a provider
     */
    getUsage(provider: 'gemini' | 'gemini-embedding' | 'openai' | 'claude'): UsageData {
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
