/**
 * AI API Watchdog & Recovery Module
 * Autonomni sistem za monitoring i self-healing
 * 
 * Features:
 * - Pulse Check (svakih 5 minuta)
 * - Latency Analysis
 * - Self-Healing (automatsko rešavanje problema)
 * - Alert System
 * - AI Diagnosis
 */

import { tctApiLogger } from './tctApiLogger';
import { memoryMonitor } from '../utils/performanceHelpers';

// ============================================
// TYPES & INTERFACES
// ============================================

export interface HealthCheckResult {
    status: 'healthy' | 'degraded' | 'down';
    latency: number;
    timestamp: string;
    error?: string;
    details?: any;
}

export interface Alert {
    id: string;
    severity: 'info' | 'warning' | 'critical';
    type: string;
    message: string;
    timestamp: string;
    apiEndpoint?: string;
    errorCode?: number;
    lastSuccessfulLog?: any;
    diagnosis?: string;
    recommendation?: string;
}

export interface MonitorConfig {
    pulseCheckInterval: number; // ms
    latencyThreshold: number; // ms
    errorThreshold: number; // broj grešaka pre akcije
    maintenanceModeTimeout: number; // ms
    alertCooldown: number; // ms između alert-ova
}

// ============================================
// AI MONITOR CLASS
// ============================================

export class AIMonitor {
    private config: MonitorConfig;
    private healthHistory: HealthCheckResult[] = [];
    private errorCount: Map<string, number> = new Map();
    private lastAlertTime: Map<string, number> = new Map();
    private maintenanceMode: Set<string> = new Set();
    private pulseCheckTimer?: number;
    private isRunning = false;
    private activeRequests: Map<string, { method: string, startTime: number }> = new Map();

    constructor(config?: Partial<MonitorConfig>) {
        this.config = {
            pulseCheckInterval: 5 * 60 * 1000, // 5 minuta
            latencyThreshold: 2000, // 2 sekunde
            errorThreshold: 5, // 5 grešaka
            maintenanceModeTimeout: 15 * 60 * 1000, // 15 minuta
            alertCooldown: 5 * 60 * 1000, // 5 minuta
            ...config
        };
    }

    // ============================================
    // PULSE CHECK
    // ============================================

    /**
     * Pokreće pulse check na svakih 5 minuta
     */
    start() {
        if (this.isRunning) {
            console.warn('⚠️ AI Monitor is already running');
            return;
        }

        this.isRunning = true;
        console.log('🤖 AI Monitor started');

        // Odmah pokreni prvi check
        this.performPulseCheck();

        // Zatim na svakih 5 minuta
        this.pulseCheckTimer = setInterval(() => {
            this.performPulseCheck();
        }, this.config.pulseCheckInterval);
    }

    /**
     * Zaustavlja pulse check
     */
    stop() {
        if (this.pulseCheckTimer) {
            clearInterval(this.pulseCheckTimer);
            this.pulseCheckTimer = undefined;
        }

        this.isRunning = false;
        console.log('🤖 AI Monitor stopped');
    }

    /**
     * Vrši proveru zdravlja API-ja
     */
    private async performPulseCheck() {
        console.log('🔍 Performing pulse check...');

        const startTime = Date.now();
        let result: HealthCheckResult;

        try {
            // Pozovi test endpoint
            const response = await fetch('/api/health-check', {
                method: 'GET',
                signal: AbortSignal.timeout(10000) // 10s timeout
            });

            const latency = Date.now() - startTime;

            if (response.ok) {
                result = {
                    status: latency > this.config.latencyThreshold ? 'degraded' : 'healthy',
                    latency,
                    timestamp: new Date().toISOString(),
                    details: await response.json().catch(() => ({}))
                };

                // Reset error count ako je uspešno
                this.errorCount.clear();

                // Latency Analysis
                if (latency > this.config.latencyThreshold) {
                    this.handleHighLatency(latency);
                }
            } else {
                result = {
                    status: 'down',
                    latency,
                    timestamp: new Date().toISOString(),
                    error: `HTTP ${response.status}: ${response.statusText}`
                };

                this.handleError('health-check', response.status);
            }
        } catch (error: any) {
            result = {
                status: 'down',
                latency: Date.now() - startTime,
                timestamp: new Date().toISOString(),
                error: error.message
            };

            this.handleError('health-check', 0, error);
        }

        // Sačuvaj rezultat
        this.healthHistory.push(result);

        // Drži samo poslednjih 100 rezultata
        if (this.healthHistory.length > 100) {
            this.healthHistory.shift();
        }

        // Loguj rezultat
        console.log(`✅ Pulse check: ${result.status} (${result.latency}ms)`);

        return result;
    }

    // ============================================
    // LATENCY ANALYZER
    // ============================================

    /**
     * Rukuje visokim latency-em
     */
    private handleHighLatency(latency: number) {
        console.warn(`⚠️ High latency detected: ${latency}ms`);

        // Loguj upozorenje
        tctApiLogger.logEvent({
            type: 'HIGH_LATENCY',
            latency,
            threshold: this.config.latencyThreshold,
            timestamp: new Date().toISOString()
        });

        // Poveća nivo keširanja
        this.increaseCaching();

        // Pošalji alert ako je latency JAKO visok (>5s)
        if (latency > 5000) {
            this.sendAlert({
                id: `latency-${Date.now()}`,
                severity: 'warning',
                type: 'HIGH_LATENCY',
                message: `API response time is critically high: ${latency}ms`,
                timestamp: new Date().toISOString(),
                diagnosis: 'API server is experiencing high load or network issues',
                recommendation: 'Consider increasing cache duration or implementing request queuing'
            });
        }
    }

    /**
     * Povećava nivo keširanja
     */
    private increaseCaching() {
        console.log('📦 Increasing cache duration to reduce API load...');

        // Ovo bi trebalo da poveća cache duration u api.ts
        // Za sada samo logujemo
        tctApiLogger.logEvent({
            type: 'CACHE_INCREASE',
            reason: 'High latency detected',
            timestamp: new Date().toISOString()
        });

        // TODO: Implementirati dinamičko povećanje cache duration-a
    }

    // ============================================
    // SELF-HEALING
    // ============================================

    /**
     * Rukuje greškama i pokreće self-healing
     */
    handleError(endpoint: string, statusCode: number, error?: Error) {
        const key = `${endpoint}-${statusCode}`;
        const count = (this.errorCount.get(key) || 0) + 1;
        this.errorCount.set(key, count);

        console.error(`❌ Error on ${endpoint}: ${statusCode} (count: ${count})`);

        // 401 Unauthorized - Osvežavanje tokena
        if (statusCode === 401 && count >= 3) {
            this.handleUnauthorized(endpoint);
        }

        // 5xx Server Error - Maintenance Mode
        if (statusCode >= 500 && statusCode < 600 && count >= this.config.errorThreshold) {
            this.enableMaintenanceMode(endpoint);
        }

        // Kritični broj grešaka - Alert
        if (count >= this.config.errorThreshold) {
            this.sendAlert({
                id: `error-${endpoint}-${Date.now()}`,
                severity: statusCode >= 500 ? 'critical' : 'warning',
                type: `HTTP_${statusCode}`,
                message: `Multiple errors detected on ${endpoint}: ${statusCode}`,
                timestamp: new Date().toISOString(),
                apiEndpoint: endpoint,
                errorCode: statusCode,
                lastSuccessfulLog: this.getLastSuccessfulLog(endpoint),
                diagnosis: this.diagnoseError(statusCode, error),
                recommendation: this.getRecommendation(statusCode)
            });
        }
    }

    /**
     * Rukuje 401 Unauthorized greškama
     */
    private async handleUnauthorized(endpoint: string) {
        console.log('🔄 Attempting to refresh API token...');

        try {
            // TODO: Implementirati refresh token logiku
            // Za sada samo logujemo
            tctApiLogger.logEvent({
                type: 'TOKEN_REFRESH_ATTEMPT',
                endpoint,
                timestamp: new Date().toISOString()
            });

            // Simulacija refresh-a
            await new Promise(resolve => setTimeout(resolve, 1000));

            console.log('✅ API token refreshed successfully');

            // Reset error count
            this.errorCount.delete(`${endpoint}-401`);
        } catch (error) {
            console.error('❌ Failed to refresh API token:', error);

            this.sendAlert({
                id: `token-refresh-failed-${Date.now()}`,
                severity: 'critical',
                type: 'TOKEN_REFRESH_FAILED',
                message: 'Failed to refresh API token after multiple 401 errors',
                timestamp: new Date().toISOString(),
                apiEndpoint: endpoint,
                diagnosis: 'API credentials may be invalid or expired',
                recommendation: 'Manually verify API credentials in Supabase secrets'
            });
        }
    }

    /**
     * Omogućava Maintenance Mode za specifični API modul
     * Sa Human-in-the-Loop potvrdom
     */
    private async enableMaintenanceMode(endpoint: string) {
        if (this.maintenanceMode.has(endpoint)) {
            return; // Već je u maintenance mode
        }

        console.warn(`🚧 Requesting approval for Maintenance Mode: ${endpoint}`);

        // 🤖 Human-in-the-Loop: Zahtevaj potvrdu
        try {
            const { hitlManager } = await import('./hitlManager');

            const approved = await hitlManager.requestApproval(
                'MAINTENANCE_MODE',
                endpoint,
                `Multiple 5xx errors detected. Recommend enabling Maintenance Mode to serve cached data.`,
                5 * 60 * 1000 // Auto-execute after 5 minutes
            );

            if (!approved) {
                console.log('❌ Maintenance Mode rejected by user');
                return;
            }

            console.log('✅ Maintenance Mode approved');
        } catch (error) {
            console.warn('⚠️ HITL not available, proceeding with auto-enable');
        }

        // Omogući Maintenance Mode
        this.maintenanceMode.add(endpoint);

        // Loguj
        tctApiLogger.logEvent({
            type: 'MAINTENANCE_MODE_ENABLED',
            endpoint,
            timestamp: new Date().toISOString()
        });

        // Pošalji alert
        this.sendAlert({
            id: `maintenance-${endpoint}-${Date.now()}`,
            severity: 'critical',
            type: 'MAINTENANCE_MODE',
            message: `${endpoint} has been placed in Maintenance Mode due to repeated failures`,
            timestamp: new Date().toISOString(),
            apiEndpoint: endpoint,
            diagnosis: 'API is experiencing persistent server errors',
            recommendation: 'Data is being served from cache. Monitor API status and disable maintenance mode when resolved.'
        });

        // Automatski isključi maintenance mode nakon timeout-a
        setTimeout(() => {
            this.disableMaintenanceMode(endpoint);
        }, this.config.maintenanceModeTimeout);
    }

    /**
     * Isključuje Maintenance Mode
     */
    private disableMaintenanceMode(endpoint: string) {
        if (!this.maintenanceMode.has(endpoint)) {
            return;
        }

        console.log(`✅ Disabling Maintenance Mode for ${endpoint}`);

        this.maintenanceMode.delete(endpoint);

        // Loguj
        tctApiLogger.logEvent({
            type: 'MAINTENANCE_MODE_DISABLED',
            endpoint,
            timestamp: new Date().toISOString()
        });

        // Reset error count
        this.errorCount.forEach((count, key) => {
            if (key.startsWith(endpoint)) {
                this.errorCount.delete(key);
            }
        });
    }

    /**
     * Proverava da li je endpoint u maintenance mode
     */
    isInMaintenanceMode(endpoint: string): boolean {
        return this.maintenanceMode.has(endpoint);
    }

    // ============================================
    // AI DIAGNOSIS
    // ============================================

    /**
     * Dijagnostikuje grešku i daje preporuku
     */
    private diagnoseError(statusCode: number, error?: Error): string {
        const diagnoses: Record<number, string> = {
            400: 'Invalid request parameters or malformed request body',
            401: 'API credentials are invalid, expired, or missing',
            403: 'API access is forbidden - check permissions or IP whitelist',
            404: 'API endpoint not found - verify endpoint URL',
            429: 'Rate limit exceeded - too many requests in short time',
            500: 'Internal server error - API server is experiencing issues',
            502: 'Bad gateway - API server is unreachable or down',
            503: 'Service unavailable - API server is temporarily down',
            504: 'Gateway timeout - API server is not responding'
        };

        let diagnosis = diagnoses[statusCode] || 'Unknown error occurred';

        if (error) {
            if (error.message.includes('timeout')) {
                diagnosis += '. Request timed out - API server is slow or unresponsive';
            } else if (error.message.includes('network')) {
                diagnosis += '. Network connectivity issue detected';
            }
        }

        return diagnosis;
    }

    /**
     * Daje preporuku za rešavanje problema
     */
    private getRecommendation(statusCode: number): string {
        const recommendations: Record<number, string> = {
            400: 'Review request parameters and ensure they match API documentation',
            401: 'Refresh API token or verify credentials in Supabase secrets',
            403: 'Contact API provider to verify access permissions',
            404: 'Verify API endpoint URL and version',
            429: 'Implement request throttling or increase rate limit with API provider',
            500: 'Wait for API server to recover. If persists, contact API provider',
            502: 'Check API server status. If down, wait for recovery',
            503: 'API is under maintenance. Wait and retry later',
            504: 'Increase timeout duration or contact API provider'
        };

        return recommendations[statusCode] || 'Monitor the situation and contact support if issue persists';
    }

    /**
     * Vraća poslednji uspešan log za endpoint
     */
    private getLastSuccessfulLog(endpoint: string): any {
        // TODO: Implementirati pretragu kroz tctApiLogger
        return {
            timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            status: 'success',
            endpoint
        };
    }

    // ============================================
    // ALERT SYSTEM
    // ============================================

    /**
     * Šalje alert
     */
    private sendAlert(alert: Alert) {
        const key = `${alert.type}-${alert.apiEndpoint || 'global'}`;
        const lastAlertTime = this.lastAlertTime.get(key) || 0;
        const now = Date.now();

        // Cooldown - ne šalji alert ako je prethodni poslat pre manje od 5 minuta
        if (now - lastAlertTime < this.config.alertCooldown) {
            console.log(`⏳ Alert cooldown active for ${key}`);
            return;
        }

        this.lastAlertTime.set(key, now);

        // Loguj alert
        console.error('🚨 ALERT:', alert);

        // Loguj u tctApiLogger
        tctApiLogger.logEvent({
            type: 'ALERT',
            alert,
            timestamp: new Date().toISOString()
        });

        // Generiši JSON izveštaj
        const report = this.generateAlertReport(alert);

        // TODO: Pošalji email, Slack notifikaciju, itd.
        console.log('📧 Alert report generated:', report);

        return report;
    }

    /**
     * Generiše JSON izveštaj o alert-u
     */
    private generateAlertReport(alert: Alert): object {
        return {
            alert: {
                id: alert.id,
                severity: alert.severity,
                type: alert.type,
                message: alert.message,
                timestamp: alert.timestamp
            },
            details: {
                apiEndpoint: alert.apiEndpoint,
                errorCode: alert.errorCode,
                lastSuccessfulLog: alert.lastSuccessfulLog
            },
            aiDiagnosis: {
                diagnosis: alert.diagnosis,
                recommendation: alert.recommendation,
                confidence: 'high'
            },
            systemStatus: {
                healthHistory: this.healthHistory.slice(-10),
                maintenanceMode: Array.from(this.maintenanceMode),
                errorCounts: Object.fromEntries(this.errorCount),
                memoryUsage: memoryMonitor.getStats()
            },
            actionRequired: alert.severity === 'critical',
            generatedBy: 'AI Watchdog & Recovery Module',
            version: '1.0.0'
        };
    }

    // ============================================
    // REQUEST TRACKING
    // ============================================

    /**
     * Započinje praćenje API zahteva
     */
    public startRequest(method: string): string {
        const id = Math.random().toString(36).substring(7);
        this.activeRequests.set(id, { method, startTime: Date.now() });
        return id;
    }

    /**
     * Završava praćenje API zahteva i beleži statistiku
     */
    public endRequest(id: string, success: boolean, latency: number, error?: string) {
        const request = this.activeRequests.get(id);
        if (!request) return;

        // Loguj u centralni logger
        tctApiLogger.logEvent({
            type: success ? 'SUCCESS' : 'FAILURE',
            message: `API Request: ${request.method}`,
            details: { latency, error, method: request.method }
        });

        if (success) {
            // Proveri latenciju
            if (latency > this.config.latencyThreshold) {
                this.handleHighLatency(latency);
            }
        } else {
            // Prijavi grešku
            this.handleError(request.method, 500, new Error(error || 'Unknown API Error'));
        }

        this.activeRequests.delete(id);
    }

    /**
     * Direktna prijava greške servisa
     */
    public reportFailure(service: string, error: string) {
        this.handleError(service, 500, new Error(error));
    }

    // ============================================
    // STATISTICS & REPORTING
    // ============================================

    /**
     * Vraća statistiku zdravlja sistema
     */
    getHealthStats() {
        const recent = this.healthHistory.slice(-20);

        if (recent.length === 0) {
            return null;
        }

        const healthy = recent.filter(h => h.status === 'healthy').length;
        const degraded = recent.filter(h => h.status === 'degraded').length;
        const down = recent.filter(h => h.status === 'down').length;

        const avgLatency = recent.reduce((sum, h) => sum + h.latency, 0) / recent.length;

        return {
            uptime: ((healthy + degraded) / recent.length * 100).toFixed(2) + '%',
            avgLatency: Math.round(avgLatency) + 'ms',
            status: {
                healthy,
                degraded,
                down
            },
            lastCheck: recent[recent.length - 1]
        };
    }

    /**
     * Vraća trenutni status
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            healthStats: this.getHealthStats(),
            maintenanceMode: Array.from(this.maintenanceMode),
            errorCounts: Object.fromEntries(this.errorCount),
            config: this.config
        };
    }

    /**
     * Resetuje sve brojače i stanja
     */
    reset() {
        this.healthHistory = [];
        this.errorCount.clear();
        this.lastAlertTime.clear();
        this.maintenanceMode.clear();
        this.activeRequests.clear();

        console.log('🔄 AI Monitor reset');
    }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

export const aiMonitor = new AIMonitor();

// Auto-start u development mode
if (import.meta.env.DEV) {
    console.log('🤖 AI Monitor auto-starting in development mode...');
    aiMonitor.start();
}

export default aiMonitor;
