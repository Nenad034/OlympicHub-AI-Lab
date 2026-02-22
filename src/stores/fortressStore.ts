import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AttackLog {
    id: string;
    timestamp: string;
    attackType: 'sql_injection' | 'xss' | 'brute_force' | 'ddos' | 'csrf' | 'unauthorized_access' | 'data_breach_attempt' | 'malware' | 'phishing' | 'other';
    severity: 'low' | 'medium' | 'high' | 'critical';
    sourceIP: string;
    targetEndpoint: string;
    description: string;
    blocked: boolean;
    actionTaken: string;
    userAgent?: string;
    payload?: string;
}

export interface ThreatIntelligence {
    knownMaliciousIPs: string[];
    suspiciousPatterns: string[];
    blockedUserAgents: string[];
    rateLimit: {
        maxRequestsPerMinute: number;
        maxFailedLogins: number;
    };
}

export interface SecurityMetrics {
    totalAttacksBlocked: number;
    attacksLast24h: number;
    criticalThreats: number;
    systemHealth: 'excellent' | 'good' | 'warning' | 'critical';
    uptime: number;
    lastScan: string;
}

interface FortressState {
    attackLogs: AttackLog[];
    threatIntel: ThreatIntelligence;
    metrics: SecurityMetrics;
    isMonitoring: boolean;
    alerts: string[];

    // Actions
    addAttackLog: (log: Omit<AttackLog, 'id' | 'timestamp'>) => void;
    addAlert: (message: string) => void;
    clearAlerts: () => void;
    updateMetrics: (metrics: Partial<SecurityMetrics>) => void;
    blockIP: (ip: string) => void;
    unblockIP: (ip: string) => void;
    startMonitoring: () => void;
    stopMonitoring: () => void;
}

const defaultThreatIntel: ThreatIntelligence = {
    knownMaliciousIPs: [],
    suspiciousPatterns: [
        'SELECT.*FROM',
        'DROP TABLE',
        '<script>',
        'javascript:',
        '../../../',
        'eval(',
        'exec(',
    ],
    blockedUserAgents: [
        'sqlmap',
        'nikto',
        'nmap',
        'masscan',
    ],
    rateLimit: {
        maxRequestsPerMinute: 100,
        maxFailedLogins: 5,
    },
};

const defaultMetrics: SecurityMetrics = {
    totalAttacksBlocked: 0,
    attacksLast24h: 0,
    criticalThreats: 0,
    systemHealth: 'excellent',
    uptime: 100,
    lastScan: new Date().toISOString(),
};

export const useFortressStore = create<FortressState>()(
    persist(
        (set, get) => ({
            attackLogs: [],
            threatIntel: defaultThreatIntel,
            metrics: defaultMetrics,
            isMonitoring: true,
            alerts: [],

            addAttackLog: (log) => {
                const newLog: AttackLog = {
                    ...log,
                    id: `attack_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    timestamp: new Date().toISOString(),
                };

                set((state) => {
                    const newLogs = [newLog, ...state.attackLogs].slice(0, 1000); // Keep last 1000 logs

                    // Update metrics
                    const criticalCount = newLogs.filter(l => l.severity === 'critical').length;
                    const last24h = newLogs.filter(l => {
                        const logTime = new Date(l.timestamp).getTime();
                        const now = Date.now();
                        return (now - logTime) < 24 * 60 * 60 * 1000;
                    }).length;

                    return {
                        attackLogs: newLogs,
                        metrics: {
                            ...state.metrics,
                            totalAttacksBlocked: state.metrics.totalAttacksBlocked + (log.blocked ? 1 : 0),
                            attacksLast24h: last24h,
                            criticalThreats: criticalCount,
                            systemHealth: criticalCount > 10 ? 'critical' : criticalCount > 5 ? 'warning' : last24h > 50 ? 'good' : 'excellent',
                            lastScan: new Date().toISOString(),
                        },
                    };
                });

                // Add alert for high severity attacks
                if (log.severity === 'critical' || log.severity === 'high') {
                    get().addAlert(`🚨 ${log.severity.toUpperCase()} THREAT: ${log.attackType} from ${log.sourceIP}`);
                }
            },

            addAlert: (message) => {
                set((state) => ({
                    alerts: [message, ...state.alerts].slice(0, 50), // Keep last 50 alerts
                }));
            },

            clearAlerts: () => set({ alerts: [] }),

            updateMetrics: (metrics) => {
                set((state) => ({
                    metrics: { ...state.metrics, ...metrics },
                }));
            },

            blockIP: (ip) => {
                set((state) => ({
                    threatIntel: {
                        ...state.threatIntel,
                        knownMaliciousIPs: [...state.threatIntel.knownMaliciousIPs, ip],
                    },
                }));
                get().addAlert(`🛡️ IP Address blocked: ${ip}`);
            },

            unblockIP: (ip) => {
                set((state) => ({
                    threatIntel: {
                        ...state.threatIntel,
                        knownMaliciousIPs: state.threatIntel.knownMaliciousIPs.filter(i => i !== ip),
                    },
                }));
                get().addAlert(`✅ IP Address unblocked: ${ip}`);
            },

            startMonitoring: () => {
                set({ isMonitoring: true });
                get().addAlert('🟢 Fortress monitoring STARTED - 24/7 protection active');
            },

            stopMonitoring: () => {
                set({ isMonitoring: false });
                get().addAlert('🔴 Fortress monitoring STOPPED - System vulnerable!');
            },
        }),
        {
            name: 'olympic-fortress-storage',
        }
    )
);
