import { useFortressStore } from '../stores/fortressStore';

/**
 * Security Defense Service
 * 24/7 Protection against cyber attacks
 */

export class SecurityDefenseService {
    private static instance: SecurityDefenseService;
    private requestCounts: Map<string, { count: number; timestamp: number }> = new Map();
    private failedLogins: Map<string, number> = new Map();

    private constructor() {
        this.startMonitoring();
    }

    public static getInstance(): SecurityDefenseService {
        if (!SecurityDefenseService.instance) {
            SecurityDefenseService.instance = new SecurityDefenseService();
        }
        return SecurityDefenseService.instance;
    }

    /**
     * Start 24/7 monitoring
     */
    private startMonitoring() {
        console.log('🛡️ Fortress Defense System ONLINE - 24/7 Protection Active');

        // Clean up old request counts every minute
        setInterval(() => {
            const now = Date.now();
            for (const [ip, data] of this.requestCounts.entries()) {
                if (now - data.timestamp > 60000) {
                    this.requestCounts.delete(ip);
                }
            }
        }, 60000);
    }

    /**
     * Validate incoming request
     */
    public validateRequest(req: {
        ip: string;
        endpoint: string;
        method: string;
        headers: Record<string, string>;
        body?: any;
        query?: any;
    }): { allowed: boolean; reason?: string } {
        const { addAttackLog, threatIntel } = useFortressStore.getState();

        // 1. Check if IP is blocked
        if (threatIntel.knownMaliciousIPs.includes(req.ip)) {
            addAttackLog({
                attackType: 'unauthorized_access',
                severity: 'high',
                sourceIP: req.ip,
                targetEndpoint: req.endpoint,
                description: 'Request from blocked IP address',
                blocked: true,
                actionTaken: 'Request rejected - IP is blacklisted',
                userAgent: req.headers['user-agent'],
            });
            return { allowed: false, reason: 'IP address is blocked' };
        }

        // 2. Check User-Agent for known attack tools
        const userAgent = req.headers['user-agent']?.toLowerCase() || '';
        for (const blockedAgent of threatIntel.blockedUserAgents) {
            if (userAgent.includes(blockedAgent.toLowerCase())) {
                addAttackLog({
                    attackType: 'malware',
                    severity: 'critical',
                    sourceIP: req.ip,
                    targetEndpoint: req.endpoint,
                    description: `Malicious user agent detected: ${blockedAgent}`,
                    blocked: true,
                    actionTaken: 'Request blocked - Known attack tool detected',
                    userAgent: req.headers['user-agent'],
                });
                return { allowed: false, reason: 'Malicious user agent detected' };
            }
        }

        // 3. Rate limiting
        const rateCheck = this.checkRateLimit(req.ip);
        if (!rateCheck.allowed) {
            addAttackLog({
                attackType: 'ddos',
                severity: 'high',
                sourceIP: req.ip,
                targetEndpoint: req.endpoint,
                description: `Rate limit exceeded: ${rateCheck.count} requests/minute`,
                blocked: true,
                actionTaken: 'Request throttled - Rate limit exceeded',
            });
            return { allowed: false, reason: 'Rate limit exceeded' };
        }

        // 4. SQL Injection detection
        const sqlCheck = this.detectSQLInjection(req);
        if (sqlCheck.detected) {
            addAttackLog({
                attackType: 'sql_injection',
                severity: 'critical',
                sourceIP: req.ip,
                targetEndpoint: req.endpoint,
                description: 'SQL Injection attempt detected',
                blocked: true,
                actionTaken: 'Request blocked - SQL Injection pattern found',
                payload: sqlCheck.payload,
            });
            return { allowed: false, reason: 'SQL Injection detected' };
        }

        // 5. XSS detection
        const xssCheck = this.detectXSS(req);
        if (xssCheck.detected) {
            addAttackLog({
                attackType: 'xss',
                severity: 'high',
                sourceIP: req.ip,
                targetEndpoint: req.endpoint,
                description: 'Cross-Site Scripting (XSS) attempt detected',
                blocked: true,
                actionTaken: 'Request blocked - XSS pattern found',
                payload: xssCheck.payload,
            });
            return { allowed: false, reason: 'XSS attack detected' };
        }

        // 6. Path traversal detection
        if (this.detectPathTraversal(req.endpoint)) {
            addAttackLog({
                attackType: 'unauthorized_access',
                severity: 'high',
                sourceIP: req.ip,
                targetEndpoint: req.endpoint,
                description: 'Path traversal attempt detected',
                blocked: true,
                actionTaken: 'Request blocked - Path traversal pattern found',
            });
            return { allowed: false, reason: 'Path traversal detected' };
        }

        return { allowed: true };
    }

    /**
     * Check rate limiting
     */
    private checkRateLimit(ip: string): { allowed: boolean; count: number } {
        const now = Date.now();
        const data = this.requestCounts.get(ip);
        const { threatIntel } = useFortressStore.getState();

        if (!data || now - data.timestamp > 60000) {
            this.requestCounts.set(ip, { count: 1, timestamp: now });
            return { allowed: true, count: 1 };
        }

        data.count++;
        if (data.count > threatIntel.rateLimit.maxRequestsPerMinute) {
            return { allowed: false, count: data.count };
        }

        return { allowed: true, count: data.count };
    }

    /**
     * Detect SQL Injection attempts
     */
    private detectSQLInjection(req: any): { detected: boolean; payload?: string } {
        const { threatIntel } = useFortressStore.getState();
        const sqlPatterns = [
            /(\bSELECT\b.*\bFROM\b)/i,
            /(\bINSERT\b.*\bINTO\b)/i,
            /(\bUPDATE\b.*\bSET\b)/i,
            /(\bDELETE\b.*\bFROM\b)/i,
            /(\bDROP\b.*\bTABLE\b)/i,
            /(\bUNION\b.*\bSELECT\b)/i,
            /(;.*--)/,
            /('.*OR.*'.*=.*')/i,
        ];

        const checkString = (str: string): boolean => {
            return sqlPatterns.some(pattern => pattern.test(str));
        };

        // Check query parameters
        if (req.query) {
            for (const [key, value] of Object.entries(req.query)) {
                if (typeof value === 'string' && checkString(value)) {
                    return { detected: true, payload: `${key}=${value}` };
                }
            }
        }

        // Check body
        if (req.body) {
            const bodyStr = JSON.stringify(req.body);
            if (checkString(bodyStr)) {
                return { detected: true, payload: bodyStr.substring(0, 200) };
            }
        }

        return { detected: false };
    }

    /**
     * Detect XSS attempts
     */
    private detectXSS(req: any): { detected: boolean; payload?: string } {
        const xssPatterns = [
            /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
            /javascript:/gi,
            /on\w+\s*=/gi,
            /<iframe/gi,
            /<object/gi,
            /<embed/gi,
        ];

        const checkString = (str: string): boolean => {
            return xssPatterns.some(pattern => pattern.test(str));
        };

        // Check all string values
        const checkObject = (obj: any): { detected: boolean; payload?: string } => {
            for (const [key, value] of Object.entries(obj)) {
                if (typeof value === 'string' && checkString(value)) {
                    return { detected: true, payload: `${key}=${value}` };
                }
                if (typeof value === 'object' && value !== null) {
                    const result = checkObject(value);
                    if (result.detected) return result;
                }
            }
            return { detected: false };
        };

        if (req.body) {
            return checkObject(req.body);
        }

        if (req.query) {
            return checkObject(req.query);
        }

        return { detected: false };
    }

    /**
     * Detect path traversal attempts
     */
    private detectPathTraversal(path: string): boolean {
        const traversalPatterns = [
            /\.\.\//,
            /\.\.\\/,
            /%2e%2e%2f/i,
            /%2e%2e\\/i,
        ];

        return traversalPatterns.some(pattern => pattern.test(path));
    }

    /**
     * Track failed login attempt
     */
    public trackFailedLogin(ip: string, username: string): { blocked: boolean } {
        const { addAttackLog, blockIP, threatIntel } = useFortressStore.getState();

        const count = (this.failedLogins.get(ip) || 0) + 1;
        this.failedLogins.set(ip, count);

        if (count >= threatIntel.rateLimit.maxFailedLogins) {
            addAttackLog({
                attackType: 'brute_force',
                severity: 'critical',
                sourceIP: ip,
                targetEndpoint: '/auth/login',
                description: `Brute force attack detected: ${count} failed login attempts for user ${username}`,
                blocked: true,
                actionTaken: 'IP address blocked after multiple failed login attempts',
            });

            blockIP(ip);
            return { blocked: true };
        }

        addAttackLog({
            attackType: 'brute_force',
            severity: 'medium',
            sourceIP: ip,
            targetEndpoint: '/auth/login',
            description: `Failed login attempt ${count}/${threatIntel.rateLimit.maxFailedLogins} for user ${username}`,
            blocked: false,
            actionTaken: 'Monitoring for brute force attack',
        });

        return { blocked: false };
    }

    /**
     * Clear failed login attempts (after successful login)
     */
    public clearFailedLogins(ip: string) {
        this.failedLogins.delete(ip);
    }

    /**
     * Get security recommendations
     */
    public getSecurityRecommendations(): string[] {
        const { attackLogs, metrics } = useFortressStore.getState();
        const recommendations: string[] = [];

        // Analyze recent attacks
        const recentAttacks = attackLogs.slice(0, 100);
        const attackTypes = new Map<string, number>();

        recentAttacks.forEach(log => {
            attackTypes.set(log.attackType, (attackTypes.get(log.attackType) || 0) + 1);
        });

        // Generate recommendations based on attack patterns
        if ((attackTypes.get('sql_injection') || 0) > 5) {
            recommendations.push('⚠️ Visok broj SQL Injection napada. Preporuka: Implementirati prepared statements i input validation.');
        }

        if ((attackTypes.get('xss') || 0) > 5) {
            recommendations.push('⚠️ Visok broj XSS napada. Preporuka: Implementirati Content Security Policy (CSP) i output encoding.');
        }

        if ((attackTypes.get('brute_force') || 0) > 3) {
            recommendations.push('⚠️ Brute force napadi detektovani. Preporuka: Implementirati CAPTCHA i two-factor authentication.');
        }

        if ((attackTypes.get('ddos') || 0) > 10) {
            recommendations.push('🚨 DDoS napad u toku! Preporuka: Aktivirati CDN zaštitu i rate limiting na firewall nivou.');
        }

        if (metrics.systemHealth === 'critical') {
            recommendations.push('🚨 KRITIČNO: Sistem je pod teškim napadom! Preporuka: Aktivirati emergency mode i kontaktirati security tim.');
        }

        if (recommendations.length === 0) {
            recommendations.push('✅ Sistem je siguran. Nema detektovanih pretnji.');
        }

        return recommendations;
    }
}

// Export singleton instance
export const securityDefense = SecurityDefenseService.getInstance();
