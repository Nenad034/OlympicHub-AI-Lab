/**
 * Activity Tracking Service
 * Centralized service for tracking all user and system activities
 */

export type ActivityType =
    | 'login' | 'logout'
    | 'search' | 'view'
    | 'create' | 'update' | 'delete'
    | 'import' | 'export'
    | 'email' | 'document'
    | 'ai_chat' | 'api_call'
    | 'system' | 'error';

export type ActivityModule =
    | 'auth'
    | 'reservation'
    | 'production'
    | 'ai_chat'
    | 'email'
    | 'document'
    | 'mars'
    | 'isplate'
    | 'settings'
    | 'system';

export type ActivityStatus = 'success' | 'error' | 'warning' | 'info';

export interface ActivityLog {
    id: string;
    timestamp: string;
    userId?: string;
    userName?: string;
    activityType: ActivityType;
    module: ActivityModule;
    action: string;
    details?: any;
    ipAddress?: string;
    userAgent?: string;
    durationMs?: number;
    status: ActivityStatus;
}

export interface DailyStats {
    date: string;
    totalActivities: number;
    activeUsers: number;
    reservations: {
        total: number;
        byStatus: {
            active: { count: number; people: number; revenue: number };
            reserved: { count: number; people: number; revenue: number };
            cancelled: { count: number; people: number; revenue: number };
            completed: { count: number; people: number; revenue: number };
            pending: { count: number; people: number; revenue: number };
        };
    };
    aiUsage: {
        requests: number;
        tokens: number;
        cost: number;
    };
    apiCalls: {
        total: number;
        byProvider: Record<string, number>;
    };
    errors: number;
    warnings: number;
}

class ActivityTrackerService {
    private readonly STORAGE_KEY = 'activity_logs';
    private readonly DAILY_STATS_KEY = 'daily_stats';
    private readonly MAX_LOGS = 1000; // Keep last 1000 activities in memory

    /**
     * Log an activity
     */
    logActivity(activity: Omit<ActivityLog, 'id' | 'timestamp'>): void {
        const log: ActivityLog = {
            id: this.generateId(),
            timestamp: new Date().toISOString(),
            ...activity
        };

        // Get existing logs
        const logs = this.getLogs();

        // Add new log at the beginning
        logs.unshift(log);

        // Keep only last MAX_LOGS
        if (logs.length > this.MAX_LOGS) {
            logs.splice(this.MAX_LOGS);
        }

        // Save to localStorage
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(logs));

        // Update daily stats
        this.updateDailyStats(log);

        // Log to console in development
        if (import.meta.env.DEV) {
            console.log(`📝 [ACTIVITY] ${log.module}.${log.activityType}: ${log.action}`, log);
        }
    }

    /**
     * Get all logs
     */
    getLogs(limit?: number): ActivityLog[] {
        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            const logs = stored ? JSON.parse(stored) : [];
            return limit ? logs.slice(0, limit) : logs;
        } catch (error) {
            console.error('Error loading activity logs:', error);
            return [];
        }
    }

    /**
     * Get logs for today
     */
    getTodayLogs(): ActivityLog[] {
        const today = new Date().toDateString();
        return this.getLogs().filter(log =>
            new Date(log.timestamp).toDateString() === today
        );
    }

    /**
     * Get logs by module
     */
    getLogsByModule(module: ActivityModule, limit?: number): ActivityLog[] {
        const logs = this.getLogs().filter(log => log.module === module);
        return limit ? logs.slice(0, limit) : logs;
    }

    /**
     * Get logs by user
     */
    getLogsByUser(userId: string, limit?: number): ActivityLog[] {
        const logs = this.getLogs().filter(log => log.userId === userId);
        return limit ? logs.slice(0, limit) : logs;
    }

    /**
     * Get logs by date range
     */
    getLogsByDateRange(startDate: Date, endDate: Date): ActivityLog[] {
        return this.getLogs().filter(log => {
            const logDate = new Date(log.timestamp);
            return logDate >= startDate && logDate <= endDate;
        });
    }

    /**
     * Get daily statistics
     */
    getDailyStats(date?: string): DailyStats | null {
        const targetDate = date || new Date().toISOString().split('T')[0];
        try {
            const stored = localStorage.getItem(this.DAILY_STATS_KEY);
            const allStats = stored ? JSON.parse(stored) : {};
            return allStats[targetDate] || this.createEmptyStats(targetDate);
        } catch (error) {
            console.error('Error loading daily stats:', error);
            return this.createEmptyStats(targetDate);
        }
    }

    /**
     * Update daily statistics
     */
    private updateDailyStats(log: ActivityLog): void {
        const date = new Date(log.timestamp).toISOString().split('T')[0];
        const stats = this.getDailyStats(date) || this.createEmptyStats(date);

        // Update total activities
        stats.totalActivities++;

        // Track unique users
        if (log.userId) {
            // This is simplified - in production, you'd track unique users properly
            stats.activeUsers = new Set(
                this.getTodayLogs()
                    .filter(l => l.userId)
                    .map(l => l.userId)
            ).size;
        }

        // Track errors and warnings
        if (log.status === 'error') stats.errors++;
        if (log.status === 'warning') stats.warnings++;

        // Track AI usage
        if (log.module === 'ai_chat' && log.details?.tokens) {
            stats.aiUsage.requests++;
            stats.aiUsage.tokens += log.details.tokens;
            stats.aiUsage.cost += (log.details.tokens / 1000000) * 0.075; // Approximate cost
        }

        // Track API calls
        if (log.activityType === 'api_call' && log.details?.provider) {
            stats.apiCalls.total++;
            const provider = log.details.provider;
            stats.apiCalls.byProvider[provider] = (stats.apiCalls.byProvider[provider] || 0) + 1;
        }

        // Save updated stats
        this.saveDailyStats(date, stats);
    }

    /**
     * Update reservation statistics
     */
    updateReservationStats(
        status: 'active' | 'reserved' | 'cancelled' | 'completed' | 'pending',
        people: number,
        revenue: number
    ): void {
        const date = new Date().toISOString().split('T')[0];
        const stats = this.getDailyStats(date) || this.createEmptyStats(date);

        stats.reservations.total++;
        stats.reservations.byStatus[status].count++;
        stats.reservations.byStatus[status].people += people;
        stats.reservations.byStatus[status].revenue += revenue;

        this.saveDailyStats(date, stats);
    }

    /**
     * Save daily stats
     */
    private saveDailyStats(date: string, stats: DailyStats): void {
        try {
            const stored = localStorage.getItem(this.DAILY_STATS_KEY);
            const allStats = stored ? JSON.parse(stored) : {};
            allStats[date] = stats;
            localStorage.setItem(this.DAILY_STATS_KEY, JSON.stringify(allStats));
        } catch (error) {
            console.error('Error saving daily stats:', error);
        }
    }

    /**
     * Create empty stats object
     */
    private createEmptyStats(date: string): DailyStats {
        return {
            date,
            totalActivities: 0,
            activeUsers: 0,
            reservations: {
                total: 0,
                byStatus: {
                    active: { count: 0, people: 0, revenue: 0 },
                    reserved: { count: 0, people: 0, revenue: 0 },
                    cancelled: { count: 0, people: 0, revenue: 0 },
                    completed: { count: 0, people: 0, revenue: 0 },
                    pending: { count: 0, people: 0, revenue: 0 }
                }
            },
            aiUsage: {
                requests: 0,
                tokens: 0,
                cost: 0
            },
            apiCalls: {
                total: 0,
                byProvider: {}
            },
            errors: 0,
            warnings: 0
        };
    }

    /**
     * Generate unique ID
     */
    private generateId(): string {
        return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Clear old logs (keep last 30 days)
     */
    clearOldLogs(): void {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const logs = this.getLogs().filter(log =>
            new Date(log.timestamp) > thirtyDaysAgo
        );

        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(logs));
        console.log(`🗑️ Cleared old activity logs. Kept ${logs.length} recent logs.`);
    }

    /**
     * Export logs to CSV
     */
    exportToCSV(startDate?: Date, endDate?: Date): string {
        const logs = startDate && endDate
            ? this.getLogsByDateRange(startDate, endDate)
            : this.getLogs();

        const headers = ['Timestamp', 'User', 'Module', 'Type', 'Action', 'Status', 'Details'];
        const rows = logs.map(log => [
            log.timestamp,
            log.userName || log.userId || 'System',
            log.module,
            log.activityType,
            log.action,
            log.status,
            JSON.stringify(log.details || {})
        ]);

        const csv = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        return csv;
    }

    /**
     * Get activity statistics
     */
    getStatistics(days: number = 7): {
        totalActivities: number;
        activitiesByType: Record<ActivityType, number>;
        activitiesByModule: Record<ActivityModule, number>;
        activitiesByStatus: Record<ActivityStatus, number>;
        topUsers: Array<{ userId: string; userName: string; count: number }>;
    } {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - days);

        const logs = this.getLogs().filter(log =>
            new Date(log.timestamp) > cutoffDate
        );

        const stats = {
            totalActivities: logs.length,
            activitiesByType: {} as Record<ActivityType, number>,
            activitiesByModule: {} as Record<ActivityModule, number>,
            activitiesByStatus: {} as Record<ActivityStatus, number>,
            topUsers: [] as Array<{ userId: string; userName: string; count: number }>
        };

        // Count by type, module, and status
        logs.forEach(log => {
            stats.activitiesByType[log.activityType] = (stats.activitiesByType[log.activityType] || 0) + 1;
            stats.activitiesByModule[log.module] = (stats.activitiesByModule[log.module] || 0) + 1;
            stats.activitiesByStatus[log.status] = (stats.activitiesByStatus[log.status] || 0) + 1;
        });

        // Count by user
        const userCounts = new Map<string, { userName: string; count: number }>();
        logs.forEach(log => {
            if (log.userId) {
                const existing = userCounts.get(log.userId);
                if (existing) {
                    existing.count++;
                } else {
                    userCounts.set(log.userId, { userName: log.userName || 'Unknown', count: 1 });
                }
            }
        });

        // Get top 10 users
        stats.topUsers = Array.from(userCounts.entries())
            .map(([userId, data]) => ({ userId, ...data }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        return stats;
    }
}

// Singleton instance
export const activityTracker = new ActivityTrackerService();
export default activityTracker;
