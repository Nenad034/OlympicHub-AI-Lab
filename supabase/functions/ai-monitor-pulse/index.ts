import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * AI Monitor Pulse Check - Cron Job
 * Pokreće se svakih 5 minuta
 * Proverava zdravlje TCT API-ja
 */
serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        console.log('🔍 AI Monitor Pulse Check started...')

        // Get TCT credentials from environment
        const TCT_USERNAME = Deno.env.get('TCT_USERNAME')
        const TCT_PASSWORD = Deno.env.get('TCT_PASSWORD')
        const TCT_API_SOURCE = Deno.env.get('TCT_API_SOURCE') || 'B2B'

        if (!TCT_USERNAME || !TCT_PASSWORD) {
            throw new Error('TCT credentials not configured')
        }

        const startTime = Date.now()

        // Test TCT API - Nationalities endpoint (lightweight)
        const tctResponse = await fetch('https://imc-dev.tct.travel/v1/nbc/nationalities', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${btoa(`${TCT_USERNAME}:${TCT_PASSWORD}`)}`,
                'API-SOURCE': TCT_API_SOURCE,
            },
            signal: AbortSignal.timeout(10000) // 10s timeout
        })

        const latency = Date.now() - startTime

        const result = {
            status: tctResponse.ok ? (latency > 2000 ? 'degraded' : 'healthy') : 'down',
            latency,
            timestamp: new Date().toISOString(),
            statusCode: tctResponse.status,
            statusText: tctResponse.statusText
        }

        console.log(`✅ Pulse check: ${result.status} (${result.latency}ms)`)

        // Ako je latency visok, loguj upozorenje
        if (latency > 2000) {
            console.warn(`⚠️ High latency detected: ${latency}ms`)
        }

        // Ako API ne radi, loguj grešku
        if (!tctResponse.ok) {
            console.error(`❌ API down: ${tctResponse.status} ${tctResponse.statusText}`)
        }

        return new Response(
            JSON.stringify(result),
            {
                status: 200,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
        )
    } catch (error) {
        console.error('❌ Pulse check error:', error)

        const result = {
            status: 'down',
            latency: 0,
            timestamp: new Date().toISOString(),
            error: error.message
        }

        return new Response(
            JSON.stringify(result),
            {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
        )
    }
})
