/**
 * Human-in-the-Loop (HITL) Module
 * Telegram Bot za potvrdu kritičnih akcija
 */

export interface HITLAction {
    id: string;
    type: 'MAINTENANCE_MODE' | 'TOKEN_REFRESH' | 'API_DISABLE';
    endpoint: string;
    reason: string;
    timestamp: string;
    autoExecuteIn?: number; // ms - automatski izvrši ako nema odgovora
    status: 'pending' | 'approved' | 'rejected' | 'auto-executed';
}

export class HITLManager {
    private pendingActions: Map<string, HITLAction> = new Map();
    private telegramBotToken?: string;
    private telegramChatId?: string;

    constructor(config?: { botToken?: string; chatId?: string }) {
        this.telegramBotToken = config?.botToken || import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
        this.telegramChatId = config?.chatId || import.meta.env.VITE_TELEGRAM_CHAT_ID;
    }

    /**
     * Zahteva ljudsku potvrdu za kritičnu akciju
     */
    async requestApproval(
        type: HITLAction['type'],
        endpoint: string,
        reason: string,
        autoExecuteIn: number = 5 * 60 * 1000 // 5 minuta default
    ): Promise<boolean> {
        const action: HITLAction = {
            id: `hitl-${Date.now()}`,
            type,
            endpoint,
            reason,
            timestamp: new Date().toISOString(),
            autoExecuteIn,
            status: 'pending'
        };

        this.pendingActions.set(action.id, action);

        // Pošalji Telegram notifikaciju
        await this.sendTelegramAlert(action);

        // Čekaj na odgovor ili auto-execute
        return new Promise((resolve) => {
            const checkInterval = setInterval(() => {
                const currentAction = this.pendingActions.get(action.id);

                if (!currentAction) {
                    clearInterval(checkInterval);
                    resolve(false);
                    return;
                }

                // Proveri da li je odobren/odbijen
                if (currentAction.status === 'approved') {
                    clearInterval(checkInterval);
                    this.pendingActions.delete(action.id);
                    resolve(true);
                } else if (currentAction.status === 'rejected') {
                    clearInterval(checkInterval);
                    this.pendingActions.delete(action.id);
                    resolve(false);
                }

                // Auto-execute ako je prošlo vreme
                const elapsed = Date.now() - new Date(currentAction.timestamp).getTime();
                if (elapsed >= autoExecuteIn) {
                    currentAction.status = 'auto-executed';
                    this.pendingActions.delete(action.id);
                    clearInterval(checkInterval);

                    console.log(`⏱️ Auto-executing ${type} for ${endpoint} (no response)`);
                    this.sendTelegramMessage(
                        `⏱️ Auto-executed: ${type} for ${endpoint}\n\nReason: No response within ${autoExecuteIn / 1000}s`
                    );

                    resolve(true);
                }
            }, 1000); // Proveri svake sekunde
        });
    }

    /**
     * Šalje Telegram alert sa dugmadima za potvrdu
     */
    private async sendTelegramAlert(action: HITLAction) {
        if (!this.telegramBotToken || !this.telegramChatId) {
            console.warn('⚠️ Telegram not configured, skipping HITL alert');
            return;
        }

        const message = this.formatAlertMessage(action);
        const keyboard = this.createInlineKeyboard(action.id);

        try {
            const response = await fetch(
                `https://api.telegram.org/bot${this.telegramBotToken}/sendMessage`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: this.telegramChatId,
                        text: message,
                        parse_mode: 'Markdown',
                        reply_markup: keyboard
                    })
                }
            );

            if (!response.ok) {
                throw new Error(`Telegram API error: ${response.status}`);
            }

            console.log('✅ Telegram alert sent successfully');
        } catch (error) {
            console.error('❌ Failed to send Telegram alert:', error);
        }
    }

    /**
     * Formatira poruku za Telegram
     */
    private formatAlertMessage(action: HITLAction): string {
        const emoji = {
            MAINTENANCE_MODE: '🚧',
            TOKEN_REFRESH: '🔄',
            API_DISABLE: '🔴'
        };

        return `
${emoji[action.type]} *AI Watchdog - Human Approval Required*

*Action:* ${action.type.replace(/_/g, ' ')}
*Endpoint:* \`${action.endpoint}\`
*Reason:* ${action.reason}
*Time:* ${new Date(action.timestamp).toLocaleString()}

⏱️ *Auto-execute in:* ${action.autoExecuteIn! / 1000}s if no response

Please choose an action:
    `.trim();
    }

    /**
     * Kreira inline keyboard sa dugmadima
     */
    private createInlineKeyboard(actionId: string) {
        return {
            inline_keyboard: [
                [
                    {
                        text: '✅ Approve',
                        callback_data: `approve:${actionId}`
                    },
                    {
                        text: '❌ Reject',
                        callback_data: `reject:${actionId}`
                    }
                ],
                [
                    {
                        text: '⏸️ Postpone (5 min)',
                        callback_data: `postpone:${actionId}`
                    }
                ]
            ]
        };
    }

    /**
     * Rukuje Telegram callback-om (poziva se iz webhook-a)
     */
    handleTelegramCallback(callbackData: string) {
        const [action, actionId] = callbackData.split(':');
        const pendingAction = this.pendingActions.get(actionId);

        if (!pendingAction) {
            console.warn(`⚠️ Action ${actionId} not found`);
            return { success: false, message: 'Action not found or already processed' };
        }

        switch (action) {
            case 'approve':
                pendingAction.status = 'approved';
                this.sendTelegramMessage(`✅ Approved: ${pendingAction.type} for ${pendingAction.endpoint}`);
                return { success: true, message: 'Action approved' };

            case 'reject':
                pendingAction.status = 'rejected';
                this.sendTelegramMessage(`❌ Rejected: ${pendingAction.type} for ${pendingAction.endpoint}`);
                return { success: true, message: 'Action rejected' };

            case 'postpone':
                // Produžava vreme za još 5 minuta
                pendingAction.autoExecuteIn = (pendingAction.autoExecuteIn || 0) + 5 * 60 * 1000;
                this.sendTelegramMessage(`⏸️ Postponed: ${pendingAction.type} for ${pendingAction.endpoint} (+5 min)`);
                return { success: true, message: 'Action postponed for 5 minutes' };

            default:
                return { success: false, message: 'Unknown action' };
        }
    }

    /**
     * Šalje običnu Telegram poruku
     */
    private async sendTelegramMessage(text: string) {
        if (!this.telegramBotToken || !this.telegramChatId) {
            return;
        }

        try {
            await fetch(
                `https://api.telegram.org/bot${this.telegramBotToken}/sendMessage`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: this.telegramChatId,
                        text
                    })
                }
            );
        } catch (error) {
            console.error('❌ Failed to send Telegram message:', error);
        }
    }

    /**
     * Vraća sve pending akcije
     */
    getPendingActions(): HITLAction[] {
        return Array.from(this.pendingActions.values());
    }

    /**
     * Otkazuje pending akciju
     */
    cancelAction(actionId: string) {
        const action = this.pendingActions.get(actionId);
        if (action) {
            action.status = 'rejected';
            this.pendingActions.delete(actionId);
            return true;
        }
        return false;
    }
}

// Singleton instance
export const hitlManager = new HITLManager();

export default hitlManager;
