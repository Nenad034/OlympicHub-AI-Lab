/**
 * Sentinel Event Bus
 * 
 * Simple event system to trigger Sentinel alerts and notifications from anywhere.
 */

import { sendTelegramMessage } from './telegram';
import { supabase } from '../supabaseClient';

type AlertType = 'critical' | 'warning' | 'info';

interface SentinelAlert {
    title: string;
    message: string;
    type: AlertType;
    timestamp: Date;
    sendTelegram?: boolean;
    provider?: string;
    metadata?: any;
}

type AlertCallback = (alert: SentinelAlert) => void;

class SentinelEventBus {
    private listeners: AlertCallback[] = [];

    /**
     * Subscribe to Sentinel alerts
     */
    subscribe(callback: AlertCallback) {
        this.listeners.push(callback);
        return () => {
            this.listeners = this.listeners.filter(l => l !== callback);
        };
    }

    /**
     * Emit a new alert
     */
    async emit(alert: Omit<SentinelAlert, 'timestamp'>) {
        const fullAlert: SentinelAlert = {
            ...alert,
            timestamp: new Date()
        };

        // 1. Notify UI listeners (Popups)
        this.listeners.forEach(callback => callback(fullAlert));

        // 2. Notify Telegram if requested or if critical
        if (alert.sendTelegram || alert.type === 'critical') {
            const telegramMsg = `<b>${fullAlert.title}</b>\n${fullAlert.message}`;
            await sendTelegramMessage(telegramMsg);
        }

        // 3. Persist to Supabase
        try {
            await supabase.from('sentinel_events').insert([{
                title: fullAlert.title,
                message: fullAlert.message,
                type: fullAlert.type,
                provider: fullAlert.provider || null,
                metadata: fullAlert.metadata || {},
                created_at: fullAlert.timestamp.toISOString()
            }]);
        } catch (error) {
            console.error('Failed to log sentinel event to cloud:', error);
        }
    }
}

export const sentinelEvents = new SentinelEventBus();
export default sentinelEvents;
