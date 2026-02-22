import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WebhookPayload {
    record: any;
    type: 'INSERT' | 'UPDATE' | 'DELETE';
    table: string;
}

/**
 * Automates VCC generation logic for new reservations.
 * 
 * Rules:
 * - Error handling in every block
 * - Type-safe recording of intentions
 * - Manual approval required (vcc_approval_status = 'pending')
 */
serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

        if (!supabaseUrl || !serviceRoleKey) {
            throw new Error("Missing Supabase environment variables");
        }

        const supabaseClient = createClient(supabaseUrl, serviceRoleKey);
        const { record, type, table }: WebhookPayload = await req.json();

        if (type !== 'INSERT' || table !== 'reservations') {
            return new Response(JSON.stringify({ message: "Ignore non-insert event" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            });
        }

        const { supplier, check_in: checkIn, cis_code: cisCode } = record;

        if (!supplier) {
            return new Response(JSON.stringify({ error: "No supplier found in reservation" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 400,
            });
        }

        // 1. Fetch VCC settings for this supplier
        const { data: vccSettings, error: settingsError } = await supabaseClient
            .from('supplier_vcc_settings')
            .select('*')
            .eq('supplier_id', supplier.toLowerCase())
            .single();

        if (settingsError || !vccSettings) {
            return new Response(JSON.stringify({ message: "No VCC automation found" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            });
        }

        if (!vccSettings.auto_generate) {
            return new Response(JSON.stringify({ message: "Auto-generate disabled" }), {
                headers: { ...corsHeaders, "Content-Type": "application/json" },
                status: 200,
            });
        }

        // 2. Fetch Obligation (Retry logic for async creation)
        let obligation = null;
        for (let i = 0; i < 5; i++) {
            const { data } = await supabaseClient
                .from('supplier_obligations')
                .select('*')
                .eq('cis_code', cisCode)
                .single();
            if (data) {
                obligation = data;
                break;
            }
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        if (!obligation) throw new Error(`Obligation not found for CIS: ${cisCode}`);

        // 3. Calculation Logic
        const checkInDate = new Date(checkIn);
        const activationDate = new Date(checkInDate);
        activationDate.setDate(checkInDate.getDate() + (vccSettings.activation_delay || 0));

        const baseAmount = Number(obligation.net_amount);
        const bufferMultiplier = 1 + (Number(vccSettings.max_limit_buffer_percent || 0) / 100);
        const finalLimit = baseAmount * bufferMultiplier;

        // 4. Update Obligation with Pending status
        const { error: updateError } = await supabaseClient
            .from('supplier_obligations')
            .update({
                notes: `[VCC-Queue] Planned for ${activationDate.toLocaleDateString()}. Limit: ${finalLimit.toFixed(2)} ${vccSettings.currency_code}. Awaiting ADMIN Approval.`,
                status: 'processing',
                vcc_approval_status: 'pending'
            })
            .eq('id', obligation.id);

        if (updateError) throw updateError;

        return new Response(JSON.stringify({ success: true, status: 'pending_approval' }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 200,
        });

    } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : "Internal Server Error";
        console.error("[VCC-Automation]", msg);
        return new Response(JSON.stringify({ error: msg }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
        });
    }
});
