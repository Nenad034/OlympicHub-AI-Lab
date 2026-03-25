import { useAuthStore } from '../stores/authStore';

interface RateLimitConfig {
    maxRequestsPerMinute: number;
    maxRequestsPerDay: number;
    retryDelay: number;
    maxRetries: number;
}

interface TierConfigs {
    b2c: RateLimitConfig;
    b2b: RateLimitConfig;
}

interface QueuedRequest {
    id: string;
    execute: () => Promise<any>;
    resolve: (value: any) => void;
    reject: (error: any) => void;
    timestamp: number;
    retries: number;
}

class AIRateLimiter {
    private tiers: TierConfigs = {
        b2c: {
            maxRequestsPerMinute: 10,
            maxRequestsPerDay: 50,
            retryDelay: 3000,
            maxRetries: 2
        },
        b2b: {
            maxRequestsPerMinute: 30,
            maxRequestsPerDay: 500,
            retryDelay: 1500,
            maxRetries: 3
        }
    };

    private getConfig(): RateLimitConfig {
        const userLevel = useAuthStore.getState().userLevel;
        return userLevel >= 3 ? this.tiers.b2b : this.tiers.b2c;
    }

    private queue: QueuedRequest[] = [];
    private processing = false;
    private requestTimestamps: number[] = [];
    private dailyRequestCount = 0;
    private lastResetDate = new Date().toDateString();

    constructor() {
        this.loadDailyCount();
        this.startQueueProcessor();
    }

    /**
     * Load daily request count from localStorage
     */
    private loadDailyCount() {
        const saved = localStorage.getItem('ai_rate_limiter_daily');
        if (saved) {
            const data = JSON.parse(saved);
            const savedDate = new Date(data.date).toDateString();
            const today = new Date().toDateString();

            if (savedDate === today) {
                this.dailyRequestCount = data.count;
            } else {
                // New day, reset counter
                this.dailyRequestCount = 0;
                this.saveDailyCount();
            }
        }
    }

    /**
     * Save daily request count to localStorage
     */
    private saveDailyCount() {
        localStorage.setItem('ai_rate_limiter_daily', JSON.stringify({
            date: new Date().toISOString(),
            count: this.dailyRequestCount
        }));
    }

    /**
     * Check if we can make a request now
     */
    private canMakeRequest(): boolean {
        const now = Date.now();
        const oneMinuteAgo = now - 60000;

        // Clean old timestamps
        this.requestTimestamps = this.requestTimestamps.filter(ts => ts > oneMinuteAgo);

        // Check per-minute limit
        if (this.requestTimestamps.length >= this.getConfig().maxRequestsPerMinute) {
            console.log('⏱️ [RATE LIMITER] Per-minute limit reached, waiting...');
            return false;
        }

        // Check daily limit
        if (this.dailyRequestCount >= this.getConfig().maxRequestsPerDay) {
            console.log('🚫 [RATE LIMITER] Daily limit reached!');
            return false;
        }

        return true;
    }

    /**
     * Record a successful request
     */
    private recordRequest() {
        const now = Date.now();
        this.requestTimestamps.push(now);
        this.dailyRequestCount++;
        this.saveDailyCount();
    }

    /**
     * Get current usage stats
     */
    getUsageStats() {
        const now = Date.now();
        const oneMinuteAgo = now - 60000;
        const requestsLastMinute = this.requestTimestamps.filter(ts => ts > oneMinuteAgo).length;

        return {
            requestsPerMinute: requestsLastMinute,
            requestsToday: this.dailyRequestCount,
            remainingToday: this.getConfig().maxRequestsPerDay - this.dailyRequestCount,
            percentageUsed: (this.dailyRequestCount / this.getConfig().maxRequestsPerDay) * 100,
            canMakeRequest: this.canMakeRequest()
        };
    }

    /**
     * Queue a request
     */
    async queueRequest<T>(execute: () => Promise<T>): Promise<T> {
        // STRICT BURST LIMIT CHECK
        const now = Date.now();
        const oneMinuteAgo = now - 60000;
        const recentRequests = this.requestTimestamps.filter(ts => ts > oneMinuteAgo).length;

        // If user is spamming (e.g. > max per minute), throw immediately
        if (recentRequests >= this.getConfig().maxRequestsPerMinute) {
            const error = new Error('Too many AI requests. Please try again in 60 seconds.');
            (error as any).status = 429;
            (error as any).isRateLimit = true;
            throw error;
        }

        return new Promise((resolve, reject) => {
            const request: QueuedRequest = {
                id: Math.random().toString(36).substr(2, 9),
                execute,
                resolve,
                reject,
                timestamp: Date.now(),
                retries: 0
            };
            
            this.queue.push(request);
            console.log(`📥 [RATE LIMITER] Request queued (${this.queue.length} in queue)`);

            if (!this.processing) {
                this.processQueue();
            }
        });
    }

    /**
     * Process the request queue
     */
    private async processQueue() {
        if (this.processing || this.queue.length === 0) {
            return;
        }

        this.processing = true;

        while (this.queue.length > 0) {
            if (!this.canMakeRequest()) {
                // Wait before checking again
                await this.sleep(5000);
                continue;
            }

            const request = this.queue.shift()!;

            try {
                console.log(`🚀 [RATE LIMITER] Executing request ${request.id}`);
                const result = await request.execute();
                this.recordRequest();
                request.resolve(result);
                console.log(`✅ [RATE LIMITER] Request ${request.id} completed`);
            } catch (error: any) {
                console.error(`❌ [RATE LIMITER] Request ${request.id} failed:`, error.message);

                // Check if it's a rate limit error
                if (this.isRateLimitError(error) && request.retries < this.getConfig().maxRetries) {
                    request.retries++;
                    const delay = this.getConfig().retryDelay * Math.pow(2, request.retries - 1);
                    console.log(`🔄 [RATE LIMITER] Retrying ${request.id} in ${delay}ms (attempt ${request.retries}/${this.getConfig().maxRetries})`);

                    await this.sleep(delay);
                    this.queue.unshift(request); // Put back at front of queue
                } else {
                    request.reject(error);
                }
            }

            // Small delay between requests
            await this.sleep(100);
        }

        this.processing = false;
    }

    /**
     * Check if error is a rate limit error
     */
    private isRateLimitError(error: any): boolean {
        const message = error.message?.toLowerCase() || '';
        return message.includes('rate limit') ||
            message.includes('quota') ||
            message.includes('too many requests') ||
            error.status === 429;
    }

    /**
     * Sleep helper
     */
    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Start queue processor (runs every 5 seconds)
     */
    private startQueueProcessor() {
        setInterval(() => {
            if (!this.processing && this.queue.length > 0) {
                this.processQueue();
            }
        }, 5000);
    }

    /**
     * Reset daily counter (call at midnight)
     */
    resetDailyCounter() {
        this.dailyRequestCount = 0;
        this.saveDailyCount();
        console.log('🔄 [RATE LIMITER] Daily counter reset');
    }
}

// Singleton instance
export const aiRateLimiter = new AIRateLimiter();

export default aiRateLimiter;
