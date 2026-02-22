/**
 * Sentinel Telegram Integration
 * 
 * =============================================================================
 * LEGAL NOTICE: Antigravity Security Protocol - Monitoring Component
 * =============================================================================
 */

const BOT_TOKEN = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
const CHAT_ID = import.meta.env.VITE_TELEGRAM_CHAT_ID;

/**
 * Send a message to Telegram
 * 
 * @param message The message to send
 */
export async function sendTelegramMessage(message: string): Promise<boolean> {
    if (!BOT_TOKEN || !CHAT_ID || BOT_TOKEN.includes('your_') || CHAT_ID.includes('your_')) {
        console.warn('[Sentinel] Telegram notification skipped: Credentials not configured.');
        return false;
    }

    try {
        const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                chat_id: CHAT_ID,
                text: `🚨 [Sentinel Alert]\n\n${message}\n\n🕒 ${new Date().toLocaleString()}`,
                parse_mode: 'HTML'
            }),
        });

        if (!response.ok) {
            throw new Error(`Telegram API returned ${response.status}`);
        }

        return true;
    } catch (error) {
        console.error('[Sentinel] Failed to send Telegram message:', error);
        return false;
    }
}
