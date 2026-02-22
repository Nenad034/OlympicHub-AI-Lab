import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Telegram Webhook Handler
 * Rukuje callback-ovima sa Telegram dugmadi
 */
serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const body = await req.json()
        console.log('📱 Telegram webhook received:', body)

        // Proveri da li je callback query
        if (body.callback_query) {
            const callbackData = body.callback_query.data
            const chatId = body.callback_query.message.chat.id
            const messageId = body.callback_query.message.message_id

            console.log('🔘 Callback data:', callbackData)

            // Parse callback data (format: "action:actionId")
            const [action, actionId] = callbackData.split(':')

            // TODO: Ovde bi trebalo pozvati HITL Manager
            // Za sada samo logujemo i odgovaramo

            let responseText = ''
            switch (action) {
                case 'approve':
                    responseText = '✅ Action approved'
                    break
                case 'reject':
                    responseText = '❌ Action rejected'
                    break
                case 'postpone':
                    responseText = '⏸️ Action postponed for 5 minutes'
                    break
                default:
                    responseText = '❓ Unknown action'
            }

            // Odgovori na callback query
            const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN')
            if (botToken) {
                await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        callback_query_id: body.callback_query.id,
                        text: responseText
                    })
                })

                // Ažuriraj poruku
                await fetch(`https://api.telegram.org/bot${botToken}/editMessageText`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        chat_id: chatId,
                        message_id: messageId,
                        text: `${body.callback_query.message.text}\n\n✅ *Status:* ${responseText}`,
                        parse_mode: 'Markdown'
                    })
                })
            }

            console.log('✅ Callback handled:', responseText)
        }

        return new Response(
            JSON.stringify({ ok: true }),
            {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
        )
    } catch (error) {
        console.error('❌ Webhook error:', error)

        return new Response(
            JSON.stringify({ error: error.message }),
            {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
        )
    }
})
