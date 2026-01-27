import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // 1. Verify user authentication
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            return new Response(
                JSON.stringify({ error: 'No authorization header' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // 2. Create Supabase client and verify token
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            {
                global: {
                    headers: { Authorization: authHeader },
                },
            }
        )

        const {
            data: { user },
            error: userError,
        } = await supabaseClient.auth.getUser()

        if (userError || !user) {
            return new Response(
                JSON.stringify({ error: 'Invalid token' }),
                { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // 3. Get TCT credentials from environment (SERVER-SIDE ONLY!)
        const TCT_USERNAME = Deno.env.get('TCT_USERNAME')
        const TCT_PASSWORD = Deno.env.get('TCT_PASSWORD')
        const TCT_API_SOURCE = Deno.env.get('TCT_API_SOURCE') || 'B2B'

        if (!TCT_USERNAME || !TCT_PASSWORD) {
            return new Response(
                JSON.stringify({ error: 'TCT credentials not configured' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // 4. Parse request body
        const requestBody = await req.json()

        // 5. Call TCT API with server-side credentials
        const tctResponse = await fetch('https://imc-dev.tct.travel/v1/hotel/searchSync', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${btoa(`${TCT_USERNAME}:${TCT_PASSWORD}`)}`,
                'API-SOURCE': TCT_API_SOURCE,
            },
            body: JSON.stringify(requestBody),
        })

        const tctData = await tctResponse.json()

        // 6. Log the request (optional)
        console.log({
            timestamp: new Date().toISOString(),
            user_id: user.id,
            endpoint: 'hotel/searchSync',
            status: tctResponse.status,
        })

        // 7. Return response to client
        return new Response(
            JSON.stringify(tctData),
            {
                status: tctResponse.status,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
        )
    } catch (error) {
        console.error('Error:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
