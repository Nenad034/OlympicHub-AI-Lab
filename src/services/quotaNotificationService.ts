/**
 * AI Quota Notification Service
 * Sends alerts via Telegram and Email when quota thresholds are reached
 */

interface QuotaAlert {
    provider: 'gemini' | 'openai' | 'claude';
    percentage: number;
    used: number;
    limit: number;
    severity: 'info' | 'warning' | 'critical';
}

interface NotificationConfig {
    telegramBotToken?: string;
    telegramChatId?: string;
    emailAddress?: string;
    enableTelegram: boolean;
    enableEmail: boolean;
}

class AIQuotaNotificationService {
    private config: NotificationConfig;
    private lastAlertTime: Map<string, number> = new Map();
    private alertCooldown = 30 * 60 * 1000; // 30 minutes

    constructor() {
        // Load config from localStorage
        const savedConfig = localStorage.getItem('notification_config');
        this.config = savedConfig ? JSON.parse(savedConfig) : {
            emailAddress: 'nenad.tomic@olympic.rs',
            enableTelegram: false,
            enableEmail: true
        };
    }

    /**
     * Update notification configuration
     */
    updateConfig(config: Partial<NotificationConfig>) {
        this.config = { ...this.config, ...config };
        localStorage.setItem('notification_config', JSON.stringify(this.config));
    }

    /**
     * Check if alert should be sent (cooldown logic)
     */
    private shouldSendAlert(alertKey: string): boolean {
        const lastTime = this.lastAlertTime.get(alertKey) || 0;
        const now = Date.now();

        if (now - lastTime < this.alertCooldown) {
            console.log(`⏳ [QUOTA ALERT] Cooldown active for ${alertKey}`);
            return false;
        }

        this.lastAlertTime.set(alertKey, now);
        return true;
    }

    /**
     * Send Telegram notification
     */
    private async sendTelegram(message: string): Promise<boolean> {
        if (!this.config.enableTelegram || !this.config.telegramBotToken || !this.config.telegramChatId) {
            console.log('📱 [TELEGRAM] Not configured, skipping');
            return false;
        }

        try {
            const url = `https://api.telegram.org/bot${this.config.telegramBotToken}/sendMessage`;
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: this.config.telegramChatId,
                    text: message,
                    parse_mode: 'Markdown'
                })
            });

            if (response.ok) {
                console.log('✅ [TELEGRAM] Notification sent successfully');
                return true;
            } else {
                console.error('❌ [TELEGRAM] Failed to send:', await response.text());
                return false;
            }
        } catch (error) {
            console.error('❌ [TELEGRAM] Error:', error);
            return false;
        }
    }

    /**
     * Send Email notification (via Supabase Edge Function)
     */
    private async sendEmail(subject: string, body: string): Promise<boolean> {
        if (!this.config.enableEmail || !this.config.emailAddress) {
            console.log('📧 [EMAIL] Not configured, skipping');
            return false;
        }

        try {
            // TODO: Implement Supabase Edge Function for email
            // For now, just log
            console.log('📧 [EMAIL] Would send to:', this.config.emailAddress);
            console.log('Subject:', subject);
            console.log('Body:', body);
            return true;
        } catch (error) {
            console.error('❌ [EMAIL] Error:', error);
            return false;
        }
    }

    /**
     * Format quota alert message
     */
    private formatAlertMessage(alert: QuotaAlert): string {
        const emoji = alert.severity === 'critical' ? '🚨' : alert.severity === 'warning' ? '⚠️' : 'ℹ️';
        const providerName = alert.provider === 'gemini' ? 'Google Gemini' : alert.provider === 'openai' ? 'OpenAI' : 'Claude';

        return `${emoji} *AI Quota Alert*\n\n` +
            `*Provider:* ${providerName}\n` +
            `*Usage:* ${alert.percentage.toFixed(1)}% (${this.formatNumber(alert.used)} / ${this.formatNumber(alert.limit)})\n` +
            `*Status:* ${alert.severity.toUpperCase()}\n\n` +
            `_ClickToTravel Hub AI Monitor_`;
    }

    /**
     * Format number (K, M)
     */
    private formatNumber(num: number): string {
        if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return num.toString();
    }

    /**
     * Check quota and send alerts if needed
     */
    async checkAndAlert(provider: 'gemini' | 'openai' | 'claude', used: number, limit: number) {
        const percentage = (used / limit) * 100;

        // Determine severity
        let severity: 'info' | 'warning' | 'critical' = 'info';
        if (percentage >= 90) severity = 'critical';
        else if (percentage >= 50) severity = 'warning';
        else return; // No alert needed

        const alertKey = `${provider}-${severity}`;

        if (!this.shouldSendAlert(alertKey)) {
            return;
        }

        const alert: QuotaAlert = { provider, percentage, used, limit, severity };
        const message = this.formatAlertMessage(alert);

        console.log(`🔔 [QUOTA ALERT] Sending ${severity} alert for ${provider}`);

        // Send to both channels
        await Promise.all([
            this.sendTelegram(message),
            this.sendEmail(
                `AI Quota Alert: ${provider} at ${percentage.toFixed(1)}%`,
                message.replace(/\*/g, '').replace(/_/g, '')
            )
        ]);
    }

    /**
     * Send daily report
     */
    async sendDailyReport(quotaData: any[]) {
        const message = this.formatDailyReport(quotaData);

        console.log('📊 [DAILY REPORT] Sending...');

        await Promise.all([
            this.sendTelegram(message),
            this.sendEmail('Daily AI Quota Report', message.replace(/\*/g, '').replace(/_/g, ''))
        ]);
    }

    /**
     * Format daily report
     */
    private formatDailyReport(quotaData: any[]): string {
        let report = '📊 *Daily AI Quota Report*\n\n';

        quotaData.forEach(data => {
            const percentage = (data.dailyUsed / data.dailyLimit) * 100;
            const emoji = percentage >= 80 ? '🚨' : percentage >= 50 ? '⚠️' : '✅';

            report += `${emoji} *${data.provider}*\n`;
            report += `   Usage: ${this.formatNumber(data.dailyUsed)} / ${this.formatNumber(data.dailyLimit)} (${percentage.toFixed(1)}%)\n`;
            report += `   Avg/request: ~${data.avgPerRequest} tokens\n\n`;
        });

        report += `_Generated: ${new Date().toLocaleString('sr-RS')}_`;

        return report;
    }

    /**
     * Export quota data to CSV
     */
    exportToCSV(quotaData: any[]): string {
        const headers = ['Provider', 'Daily Used', 'Daily Limit', 'Percentage', 'Weekly Used', 'Monthly Used', 'Avg Per Request'];
        const rows = quotaData.map(data => [
            data.provider,
            data.dailyUsed,
            data.dailyLimit,
            `${((data.dailyUsed / data.dailyLimit) * 100).toFixed(2)}%`,
            data.weeklyUsed,
            data.monthlyUsed,
            data.avgPerRequest
        ]);

        const csv = [headers, ...rows].map(row => row.join(',')).join('\n');

        // Download CSV
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ai-quota-report-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);

        console.log('📥 [EXPORT] CSV downloaded');
        return csv;
    }
}

// Singleton instance
export const quotaNotificationService = new AIQuotaNotificationService();

export default quotaNotificationService;
