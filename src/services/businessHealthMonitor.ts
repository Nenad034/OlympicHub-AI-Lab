/**
 * Business Health Monitor
 * Prati poslovne metrike i detektuje anomalije
 */

export interface BusinessMetrics {
    searches: number;
    bookings: number;
    revenue: number;
    users: number;
    timestamp: string;
}

export interface BusinessAlert {
    id: string;
    type: 'NO_SEARCHES' | 'NO_BOOKINGS' | 'LOW_CONVERSION' | 'REVENUE_DROP' | 'UI_ISSUE';
    severity: 'warning' | 'critical';
    message: string;
    metrics: BusinessMetrics;
    diagnosis: string;
    recommendation: string;
    timestamp: string;
}

export class BusinessHealthMonitor {
    private metricsHistory: BusinessMetrics[] = [];
    private lastSearchTime: number = Date.now();
    private lastBookingTime: number = Date.now();
    private checkInterval?: number;

    constructor() {
        // Auto-start monitoring
        this.start();
    }

    /**
     * Pokreće business monitoring
     */
    start() {
        console.log('💼 Business Health Monitor started');

        // Proveri svakih 30 minuta
        this.checkInterval = window.setInterval(() => {
            this.performBusinessCheck();
        }, 30 * 60 * 1000);

        // Odmah pokreni prvi check
        this.performBusinessCheck();
    }

    /**
     * Zaustavlja monitoring
     */
    stop() {
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = undefined;
        }
        console.log('💼 Business Health Monitor stopped');
    }

    /**
     * Beleži pretragu
     */
    recordSearch() {
        this.lastSearchTime = Date.now();
        console.log('🔍 Search recorded');
    }

    /**
     * Beleži rezervaciju
     */
    recordBooking(revenue: number = 0) {
        this.lastBookingTime = Date.now();
        console.log('📝 Booking recorded:', revenue);
    }

    /**
     * Vrši business health check
     */
    private async performBusinessCheck() {
        console.log('💼 Performing business health check...');

        const now = Date.now();
        const twoHoursAgo = now - 2 * 60 * 60 * 1000;

        // Proveri da li je bilo pretraga u poslednja 2 sata
        if (this.lastSearchTime < twoHoursAgo) {
            await this.investigateNoSearches();
        }

        // Proveri da li je bilo rezervacija u poslednja 4 sata
        const fourHoursAgo = now - 4 * 60 * 60 * 1000;
        if (this.lastBookingTime < fourHoursAgo) {
            await this.investigateNoBookings();
        }

        // Proveri conversion rate
        await this.checkConversionRate();
    }

    /**
     * Istražuje zašto nema pretraga
     */
    private async investigateNoSearches() {
        console.warn('⚠️ No searches in last 2 hours - investigating...');

        // Proveri API zdravlje
        const apiHealth = await this.checkAPIHealth();

        if (apiHealth === 'healthy') {
            // API radi, problem je verovatno u UI-ju
            this.sendBusinessAlert({
                id: `no-searches-${Date.now()}`,
                type: 'UI_ISSUE',
                severity: 'critical',
                message: 'No searches in last 2 hours despite healthy API',
                metrics: this.getCurrentMetrics(),
                diagnosis: 'API is healthy but users are not searching. Possible UI/UX issue.',
                recommendation: 'Check:\n1. Search form visibility\n2. JavaScript errors in console\n3. Mobile responsiveness\n4. Page load time\n5. Marketing campaigns',
                timestamp: new Date().toISOString()
            });
        } else {
            // API ne radi
            this.sendBusinessAlert({
                id: `no-searches-api-${Date.now()}`,
                type: 'NO_SEARCHES',
                severity: 'critical',
                message: 'No searches in last 2 hours - API is down',
                metrics: this.getCurrentMetrics(),
                diagnosis: 'API is not healthy. Users cannot search.',
                recommendation: 'Fix API issues first. Check AI Watchdog alerts.',
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Istražuje zašto nema rezervacija
     */
    private async investigateNoBookings() {
        console.warn('⚠️ No bookings in last 4 hours - investigating...');

        const metrics = this.getCurrentMetrics();

        // Ako ima pretraga ali nema rezervacija - conversion problem
        if (metrics.searches > 0) {
            this.sendBusinessAlert({
                id: `low-conversion-${Date.now()}`,
                type: 'LOW_CONVERSION',
                severity: 'warning',
                message: 'Users are searching but not booking',
                metrics,
                diagnosis: 'Conversion rate is 0%. Users find results but don\'t book.',
                recommendation: 'Check:\n1. Pricing competitiveness\n2. Payment gateway\n3. Booking form UX\n4. Trust signals (reviews, SSL)\n5. Availability of offers',
                timestamp: new Date().toISOString()
            });
        } else {
            // Nema ni pretraga ni rezervacija
            this.sendBusinessAlert({
                id: `no-activity-${Date.now()}`,
                type: 'NO_BOOKINGS',
                severity: 'critical',
                message: 'No searches AND no bookings in last 4 hours',
                metrics,
                diagnosis: 'Complete lack of user activity. Critical issue.',
                recommendation: 'URGENT: Check website accessibility, SEO, marketing campaigns, and server status.',
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Proverava conversion rate
     */
    private async checkConversionRate() {
        const metrics = this.getCurrentMetrics();

        if (metrics.searches === 0) {
            return; // Nema podataka
        }

        const conversionRate = (metrics.bookings / metrics.searches) * 100;

        // Normalan conversion rate je 2-5%
        if (conversionRate < 1 && metrics.searches > 50) {
            this.sendBusinessAlert({
                id: `low-conversion-rate-${Date.now()}`,
                type: 'LOW_CONVERSION',
                severity: 'warning',
                message: `Low conversion rate: ${conversionRate.toFixed(2)}%`,
                metrics,
                diagnosis: `Conversion rate is ${conversionRate.toFixed(2)}%, which is below industry average (2-5%).`,
                recommendation: 'Analyze user journey, improve UX, check pricing, and optimize checkout process.',
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Proverava API zdravlje
     */
    private async checkAPIHealth(): Promise<'healthy' | 'degraded' | 'down'> {
        try {
            // Pozovi AI Monitor za status
            const { aiMonitor } = await import('./aiMonitor');
            const health = aiMonitor.getHealthStats();

            if (!health) {
                return 'down';
            }

            return health.lastCheck?.status || 'down';
        } catch (error) {
            console.error('Failed to check API health:', error);
            return 'down';
        }
    }

    /**
     * Vraća trenutne metrike
     */
    private getCurrentMetrics(): BusinessMetrics {
        // TODO: Implementirati pravo čitanje iz baze
        // Za sada vraćamo mock podatke
        return {
            searches: 0,
            bookings: 0,
            revenue: 0,
            users: 0,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Šalje business alert
     */
    private async sendBusinessAlert(alert: BusinessAlert) {
        console.error('💼 BUSINESS ALERT:', alert);

        // Loguj u tctApiLogger
        try {
            const { tctApiLogger } = await import('./tctApiLogger');
            tctApiLogger.logEvent({
                type: 'BUSINESS_ALERT',
                alert,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            console.error('Failed to log business alert:', error);
        }

        // Pošalji Telegram notifikaciju
        try {
            const { hitlManager } = await import('./hitlManager');
            await hitlManager['sendTelegramMessage']?.(
                `💼 *Business Alert*\n\n` +
                `*Type:* ${alert.type}\n` +
                `*Severity:* ${alert.severity}\n` +
                `*Message:* ${alert.message}\n\n` +
                `*Diagnosis:* ${alert.diagnosis}\n\n` +
                `*Recommendation:*\n${alert.recommendation}`
            );
        } catch (error) {
            console.error('Failed to send Telegram alert:', error);
        }

        // Pošalji email (TODO: implementirati)
        // await sendEmail({
        //   to: 'admin@example.com',
        //   subject: `Business Alert: ${alert.type}`,
        //   body: JSON.stringify(alert, null, 2)
        // });
    }

    /**
     * Vraća business statistiku
     */
    getStats() {
        const now = Date.now();
        const timeSinceLastSearch = now - this.lastSearchTime;
        const timeSinceLastBooking = now - this.lastBookingTime;

        return {
            lastSearch: {
                timestamp: new Date(this.lastSearchTime).toISOString(),
                minutesAgo: Math.round(timeSinceLastSearch / 60000)
            },
            lastBooking: {
                timestamp: new Date(this.lastBookingTime).toISOString(),
                minutesAgo: Math.round(timeSinceLastBooking / 60000)
            },
            metrics: this.getCurrentMetrics(),
            alerts: {
                noSearches: timeSinceLastSearch > 2 * 60 * 60 * 1000,
                noBookings: timeSinceLastBooking > 4 * 60 * 60 * 1000
            }
        };
    }

    /**
     * Resetuje brojače
     */
    reset() {
        this.lastSearchTime = Date.now();
        this.lastBookingTime = Date.now();
        this.metricsHistory = [];
        console.log('💼 Business Health Monitor reset');
    }
}

// Singleton instance
export const businessHealthMonitor = new BusinessHealthMonitor();

export default businessHealthMonitor;
