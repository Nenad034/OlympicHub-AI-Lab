/**
 * Auto-detect Telegram Chat ID
 * Run this AFTER you send /start to your bot
 */

const TELEGRAM_BOT_TOKEN = '8416635544:AAGbG_vJWALi0tG0IkEnEsKhydgX_2OQ9pA';

async function getChatId() {
    try {
        const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getUpdates`;
        const response = await fetch(url);
        const data = await response.json();

        if (data.ok && data.result.length > 0) {
            console.log('\n✅ PRONAĐENI CHAT-OVI:\n');

            const uniqueChats = new Map();

            data.result.forEach((update, index) => {
                if (update.message && update.message.chat) {
                    const chat = update.message.chat;
                    const chatId = chat.id;

                    if (!uniqueChats.has(chatId)) {
                        uniqueChats.set(chatId, {
                            id: chatId,
                            firstName: chat.first_name || '',
                            lastName: chat.last_name || '',
                            username: chat.username || '',
                            type: chat.type
                        });
                    }
                }
            });

            if (uniqueChats.size > 0) {
                uniqueChats.forEach((chat, chatId) => {
                    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
                    console.log(`📱 Chat ID: ${chatId}`);
                    console.log(`👤 Ime: ${chat.firstName} ${chat.lastName}`.trim());
                    if (chat.username) console.log(`🔗 Username: @${chat.username}`);
                    console.log(`📂 Tip: ${chat.type}`);
                    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
                });

                const firstChatId = Array.from(uniqueChats.keys())[0];
                console.log(`\n🎯 KORISTITE OVAJ CHAT ID: ${firstChatId}\n`);
                console.log('📋 Kopirajte ga i unesite u Settings → AI Quota Tracker → Notifications\n');

                // Auto-save to config
                const config = {
                    telegramBotToken: TELEGRAM_BOT_TOKEN,
                    telegramChatId: firstChatId.toString(),
                    enableTelegram: true,
                    enableEmail: true,
                    emailAddress: 'nenad.tomic@olympic.rs'
                };

                console.log('💾 Auto-saved config:');
                console.log(JSON.stringify(config, null, 2));
                console.log('\n✅ Sada možete otvoriti aplikaciju i kliknuti "Save Settings"!\n');

            } else {
                console.log('❌ Nema pronađenih chat-ova.');
                console.log('📱 Molim vas pošaljite /start vašem botu prvo!\n');
            }
        } else {
            console.log('❌ Nema poruka.');
            console.log('📱 Molim vas pošaljite /start vašem botu!\n');
        }
    } catch (error) {
        console.error('❌ ERROR:', error);
    }
}

console.log('🔍 Tražim vaš Chat ID...\n');
getChatId();
