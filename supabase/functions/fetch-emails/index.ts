import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ImapConfig {
    imap_host: string;
    imap_port: number;
    imap_user: string;
    imap_password: string;
    use_ssl: boolean;
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { config, folder, limit }: {
            config: ImapConfig;
            folder?: string;
            limit?: number
        } = await req.json();

        // Validate input
        if (!config) {
            throw new Error('Missing IMAP config');
        }

        const folderName = folder || 'INBOX';
        const maxEmails = limit || 50;

        // Note: Deno doesn't have a stable IMAP library yet
        // For production, you would need to:
        // 1. Use a Node.js-based IMAP library via npm: specifier
        // 2. Or implement IMAP protocol manually
        // 3. Or use a third-party email API (like Gmail API, Outlook Graph API)

        // For now, we'll return a mock response with instructions
        console.log('IMAP fetch requested:', {
            host: config.imap_host,
            port: config.imap_port,
            user: config.imap_user,
            folder: folderName,
            limit: maxEmails,
        });

        // TEMPORARY: Return mock data
        // In production, replace this with actual IMAP implementation
        const mockEmails = [
            {
                messageId: `mock-${Date.now()}-1`,
                from: 'example@sender.com',
                to: [config.imap_user],
                subject: 'Test Email from IMAP',
                text: 'This is a test email fetched from IMAP server.',
                html: '<p>This is a test email fetched from IMAP server.</p>',
                date: new Date().toISOString(),
                flags: [],
                attachments: [],
            },
        ];

        return new Response(
            JSON.stringify({
                success: true,
                emails: mockEmails,
                message: 'IMAP fetch completed (mock data)',
                note: 'Replace this with actual IMAP implementation using imap-simple or node-imap',
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            }
        );

        // PRODUCTION IMPLEMENTATION EXAMPLE (commented out):
        /*
        // Using node-imap via npm: specifier
        import Imap from 'npm:imap@0.8.19';
        import { simpleParser } from 'npm:mailparser@3.6.5';
        
        const imap = new Imap({
          user: config.imap_user,
          password: config.imap_password,
          host: config.imap_host,
          port: config.imap_port,
          tls: config.use_ssl,
          tlsOptions: { rejectUnauthorized: false }
        });
    
        const emails: any[] = [];
    
        await new Promise((resolve, reject) => {
          imap.once('ready', () => {
            imap.openBox(folderName, true, (err, box) => {
              if (err) return reject(err);
    
              const fetch = imap.seq.fetch(`1:${maxEmails}`, {
                bodies: '',
                struct: true
              });
    
              fetch.on('message', (msg, seqno) => {
                msg.on('body', (stream) => {
                  simpleParser(stream, (err, parsed) => {
                    if (!err) {
                      emails.push({
                        messageId: parsed.messageId,
                        from: parsed.from?.text,
                        to: parsed.to?.text,
                        subject: parsed.subject,
                        text: parsed.text,
                        html: parsed.html,
                        date: parsed.date,
                        attachments: parsed.attachments?.map(a => ({
                          filename: a.filename,
                          contentType: a.contentType,
                          size: a.size
                        }))
                      });
                    }
                  });
                });
              });
    
              fetch.once('end', () => {
                imap.end();
              });
            });
          });
    
          imap.once('error', reject);
          imap.once('end', resolve);
          imap.connect();
        });
    
        return new Response(
          JSON.stringify({
            success: true,
            emails: emails.reverse(), // Most recent first
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
        */

    } catch (error) {
        console.error('Error fetching emails:', error);

        return new Response(
            JSON.stringify({
                success: false,
                error: error.message || 'Failed to fetch emails',
                details: error.toString(),
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 500,
            }
        );
    }
});
