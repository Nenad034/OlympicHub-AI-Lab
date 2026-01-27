import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EmailConfig {
    smtp_host: string;
    smtp_port: number;
    smtp_user: string;
    smtp_password: string;
    use_ssl: boolean;
}

interface EmailData {
    from: string;
    to: string[];
    cc?: string[];
    bcc?: string[];
    subject: string;
    text: string;
    html?: string;
    attachments?: Array<{
        filename: string;
        content: string;
        contentType: string;
    }>;
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { config, email }: { config: EmailConfig; email: EmailData } = await req.json();

        // Validate input
        if (!config || !email) {
            throw new Error('Missing config or email data');
        }

        if (!email.from || !email.to || email.to.length === 0) {
            throw new Error('Missing required email fields (from, to)');
        }

        // Create SMTP client
        const client = new SMTPClient({
            connection: {
                hostname: config.smtp_host,
                port: config.smtp_port,
                tls: config.use_ssl,
                auth: {
                    username: config.smtp_user,
                    password: config.smtp_password,
                },
            },
        });

        // Prepare email content
        const emailContent: any = {
            from: email.from,
            to: email.to,
            subject: email.subject,
            content: email.html || email.text,
            html: email.html,
        };

        // Add CC and BCC if provided
        if (email.cc && email.cc.length > 0) {
            emailContent.cc = email.cc;
        }

        if (email.bcc && email.bcc.length > 0) {
            emailContent.bcc = email.bcc;
        }

        // Add attachments if provided
        if (email.attachments && email.attachments.length > 0) {
            emailContent.attachments = email.attachments.map(att => ({
                filename: att.filename,
                content: att.content,
                contentType: att.contentType,
                encoding: 'base64',
            }));
        }

        // Send email
        await client.send(emailContent);
        await client.close();

        // Generate message ID
        const messageId = `${Date.now()}.${Math.random().toString(36).substring(7)}@olympichub`;

        return new Response(
            JSON.stringify({
                success: true,
                messageId,
                message: 'Email sent successfully',
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        );
    } catch (error) {
        console.error('Error sending email:', error);

        return new Response(
            JSON.stringify({
                success: false,
                error: error.message || 'Failed to send email',
                details: error.toString(),
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 500,
            }
        );
    }
});
