import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SmtpConfig {
    host: string;
    port: number;
    user: string;
    password: string;
    use_ssl: boolean;
}

interface ImapConfig {
    host: string;
    port: number;
    user: string;
    password: string;
    use_ssl: boolean;
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { smtp, imap }: { smtp: SmtpConfig; imap: ImapConfig } = await req.json();

        const results = {
            smtp: { success: false, error: '' },
            imap: { success: false, error: '' },
        };

        // Test SMTP connection
        if (smtp) {
            try {
                const smtpClient = new SMTPClient({
                    connection: {
                        hostname: smtp.host,
                        port: smtp.port,
                        tls: smtp.use_ssl,
                        auth: {
                            username: smtp.user,
                            password: smtp.password,
                        },
                    },
                });

                // Just connect and disconnect to test
                // Don't send actual email
                await smtpClient.close();

                results.smtp.success = true;
            } catch (error) {
                results.smtp.error = error.message || 'SMTP connection failed';
                console.error('SMTP test error:', error);
            }
        }

        // Test IMAP connection
        if (imap) {
            try {
                // For IMAP, we'll do a basic TCP connection test
                // since we don't have a stable IMAP library in Deno yet

                const conn = await Deno.connect({
                    hostname: imap.host,
                    port: imap.port,
                });

                // If connection succeeds, close it
                conn.close();

                results.imap.success = true;
            } catch (error) {
                results.imap.error = error.message || 'IMAP connection failed';
                console.error('IMAP test error:', error);
            }
        }

        // Overall success if both tests passed
        const overallSuccess = results.smtp.success && results.imap.success;

        return new Response(
            JSON.stringify({
                success: overallSuccess,
                smtp: results.smtp,
                imap: results.imap,
                message: overallSuccess
                    ? 'Both SMTP and IMAP connections successful'
                    : 'One or more connection tests failed',
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: overallSuccess ? 200 : 400,
            }
        );
    } catch (error) {
        console.error('Error testing connection:', error);

        return new Response(
            JSON.stringify({
                success: false,
                error: error.message || 'Failed to test connection',
                details: error.toString(),
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 500,
            }
        );
    }
});
