import { supabase } from '../supabaseClient';

export interface EmailConfig {
    id?: string;
    account_id: string;
    smtp_host: string;
    smtp_port: number;
    smtp_user: string;
    smtp_password: string;
    imap_host: string;
    imap_port: number;
    imap_user: string;
    imap_password: string;
    use_ssl: boolean;
    created_at?: string;
    updated_at?: string;
}

export interface SendEmailParams {
    from: string;
    to: string | string[];
    cc?: string | string[];
    bcc?: string | string[];
    subject: string;
    body: string;
    html?: string;
    attachments?: Array<{
        filename: string;
        content: string; // base64
        contentType: string;
    }>;
    accountId: string;
}

export interface EmailMessage {
    id: string;
    messageId: string;
    from: string;
    to: string[];
    cc?: string[];
    subject: string;
    body: string;
    html?: string;
    date: string;
    isRead: boolean;
    hasAttachments: boolean;
    accountId: string;
    folder: 'inbox' | 'sent' | 'drafts' | 'trash' | 'archive';
}

/**
 * Send email via Supabase Edge Function
 */
export async function sendEmail(params: SendEmailParams): Promise<{ success: boolean; error?: string; messageId?: string }> {
    try {
        // Get email configuration for the account
        const { data: config, error: configError } = await supabase
            .from('email_configs')
            .select('*')
            .eq('account_id', params.accountId)
            .single();

        if (configError || !config) {
            return {
                success: false,
                error: 'Email configuration not found. Please configure your email account first.'
            };
        }

        // Call Supabase Edge Function to send email
        const { data, error } = await supabase.functions.invoke('send-email', {
            body: {
                config: {
                    smtp_host: config.smtp_host,
                    smtp_port: config.smtp_port,
                    smtp_user: config.smtp_user,
                    smtp_password: config.smtp_password,
                    use_ssl: config.use_ssl
                },
                email: {
                    from: params.from,
                    to: Array.isArray(params.to) ? params.to : [params.to],
                    cc: params.cc ? (Array.isArray(params.cc) ? params.cc : [params.cc]) : [],
                    bcc: params.bcc ? (Array.isArray(params.bcc) ? params.bcc : [params.bcc]) : [],
                    subject: params.subject,
                    text: params.body,
                    html: params.html || params.body.replace(/\n/g, '<br>'),
                    attachments: params.attachments || []
                }
            }
        });

        if (error) {
            console.error('Error sending email:', error);
            return {
                success: false,
                error: error.message || 'Failed to send email'
            };
        }

        // Store sent email in database
        const { error: storeError } = await supabase
            .from('emails')
            .insert({
                account_id: params.accountId,
                message_id: data.messageId,
                sender: params.from,
                recipient: Array.isArray(params.to) ? params.to.join(', ') : params.to,
                subject: params.subject,
                body: params.body,
                html: params.html,
                folder: 'sent',
                is_read: true,
                sent_at: new Date().toISOString()
            });

        if (storeError) {
            console.error('Error storing sent email:', storeError);
        }

        return {
            success: true,
            messageId: data.messageId
        };
    } catch (error: any) {
        console.error('Unexpected error sending email:', error);
        return {
            success: false,
            error: error.message || 'Unexpected error occurred'
        };
    }
}

/**
 * Fetch emails from IMAP server via Supabase Edge Function
 */
export async function fetchEmails(accountId: string, folder: string = 'INBOX', limit: number = 50): Promise<{ success: boolean; emails?: EmailMessage[]; error?: string }> {
    try {
        // Get email configuration
        const { data: config, error: configError } = await supabase
            .from('email_configs')
            .select('*')
            .eq('account_id', accountId)
            .single();

        if (configError || !config) {
            return {
                success: false,
                error: 'Email configuration not found'
            };
        }

        // Call Edge Function to fetch emails
        const { data, error } = await supabase.functions.invoke('fetch-emails', {
            body: {
                config: {
                    imap_host: config.imap_host,
                    imap_port: config.imap_port,
                    imap_user: config.imap_user,
                    imap_password: config.imap_password,
                    use_ssl: config.use_ssl
                },
                folder,
                limit
            }
        });

        if (error) {
            console.error('Error fetching emails:', error);
            return {
                success: false,
                error: error.message || 'Failed to fetch emails'
            };
        }

        // Store fetched emails in database
        if (data.emails && data.emails.length > 0) {
            const emailsToStore = data.emails.map((email: any) => ({
                account_id: accountId,
                message_id: email.messageId,
                sender: email.from,
                recipient: email.to.join(', '),
                subject: email.subject,
                body: email.text || email.html,
                html: email.html,
                folder: 'inbox',
                is_read: email.flags?.includes('\\Seen') || false,
                received_at: email.date,
                has_attachments: email.attachments && email.attachments.length > 0
            }));

            const { error: storeError } = await supabase
                .from('emails')
                .upsert(emailsToStore, {
                    onConflict: 'message_id',
                    ignoreDuplicates: false
                });

            if (storeError) {
                console.error('Error storing fetched emails:', storeError);
            }
        }

        return {
            success: true,
            emails: data.emails
        };
    } catch (error: any) {
        console.error('Unexpected error fetching emails:', error);
        return {
            success: false,
            error: error.message || 'Unexpected error occurred'
        };
    }
}

/**
 * Save email configuration
 */
export async function saveEmailConfig(config: EmailConfig): Promise<{ success: boolean; error?: string }> {
    try {
        const { error } = await supabase
            .from('email_configs')
            .upsert({
                account_id: config.account_id,
                smtp_host: config.smtp_host,
                smtp_port: config.smtp_port,
                smtp_user: config.smtp_user,
                smtp_password: config.smtp_password,
                imap_host: config.imap_host,
                imap_port: config.imap_port,
                imap_user: config.imap_user,
                imap_password: config.imap_password,
                use_ssl: config.use_ssl,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'account_id'
            });

        if (error) {
            console.error('Error saving email config:', error);
            return {
                success: false,
                error: error.message
            };
        }

        return { success: true };
    } catch (error: any) {
        console.error('Unexpected error saving email config:', error);
        return {
            success: false,
            error: error.message || 'Unexpected error occurred'
        };
    }
}

/**
 * Get email configuration
 */
export async function getEmailConfig(accountId: string): Promise<{ success: boolean; config?: EmailConfig; error?: string }> {
    try {
        const { data, error } = await supabase
            .from('email_configs')
            .select('*')
            .eq('account_id', accountId)
            .single();

        if (error) {
            return {
                success: false,
                error: error.message
            };
        }

        return {
            success: true,
            config: data
        };
    } catch (error: any) {
        return {
            success: false,
            error: error.message || 'Unexpected error occurred'
        };
    }
}

/**
 * Test email connection
 */
export async function testEmailConnection(config: Partial<EmailConfig>): Promise<{ success: boolean; error?: string }> {
    try {
        const { data, error } = await supabase.functions.invoke('test-email-connection', {
            body: {
                smtp: {
                    host: config.smtp_host,
                    port: config.smtp_port,
                    user: config.smtp_user,
                    password: config.smtp_password,
                    use_ssl: config.use_ssl
                },
                imap: {
                    host: config.imap_host,
                    port: config.imap_port,
                    user: config.imap_user,
                    password: config.imap_password,
                    use_ssl: config.use_ssl
                }
            }
        });

        if (error) {
            return {
                success: false,
                error: error.message || 'Connection test failed'
            };
        }

        return {
            success: data.success,
            error: data.error
        };
    } catch (error: any) {
        return {
            success: false,
            error: error.message || 'Unexpected error occurred'
        };
    }
}
