/**
 * Test Telegram Bot Connection
 * This script sends a test message to verify the bot is working
 */

const TELEGRAM_BOT_TOKEN = '8416635544:AAGbG_vJWALi0tG0IkEnEsKhydgX_2OQ9pA';
const TELEGRAM_CHAT_ID = '8216428808';

async function testTelegramBot() {
    const message = `🤖 *Olympic Hub AI Monitor*\n\n` +
        `✅ Bot successfully connected!\n\n` +
        `You will now receive:\n` +
        `• ⚠️ Quota warnings (50%, 80%, 90%)\n` +
        `• 📊 Daily usage reports\n` +
        `• 🚨 Critical alerts\n\n` +
        `_Test sent at: ${new Date().toLocaleString('sr-RS')}_`;

    try {
        const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: message,
                parse_mode: 'Markdown'
            })
        });

        const data = await response.json();

        if (data.ok) {
            console.log('✅ SUCCESS! Telegram bot is working!');
            console.log('📱 Message sent to chat:', TELEGRAM_CHAT_ID);
            console.log('📨 Message ID:', data.result.message_id);
            return true;
        } else {
            console.error('❌ FAILED:', data.description);
            return false;
        }
    } catch (error) {
        console.error('❌ ERROR:', error);
        return false;
    }
}

// Run test
testTelegramBot();
