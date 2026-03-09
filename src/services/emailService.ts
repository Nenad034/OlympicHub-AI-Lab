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
    senderEmail?: string;
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
    status: 'pending' | 'replied' | 'processing' | 'archived' | 'ignored';
    respondedAt?: string;
}

export interface EmailLock {
    emailId: string;
    userId: string;
    userName: string;
    lockedAt: string;
    expiresAt: string;
}

export interface EmailComment {
    id: string;
    emailId: string;
    userId: string;
    userName: string;
    commentText: string;
    createdAt: string;
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

/**
 * Update email status (e.g., mark as replied)
 */
export async function updateEmailStatus(emailId: string, status: EmailMessage['status'], respondedAt?: string): Promise<{ success: boolean; error?: string }> {
    try {
        const updateData: any = { status, updated_at: new Date().toISOString() };
        if (respondedAt) updateData.responded_at = respondedAt;

        const { error } = await supabase
            .from('emails')
            .update(updateData)
            .eq('id', emailId);

        if (error) throw error;
        return { success: true };
    } catch (error: any) {
        console.error('Error updating email status:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Lock an email for editing (Collision Prevention)
 */
export async function lockEmail(emailId: string, userId: string, userName: string): Promise<{ success: boolean; lock?: EmailLock; error?: string }> {
    try {
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 10);

        const { data, error } = await supabase
            .from('email_locks')
            .upsert({
                email_id: emailId,
                user_id: userId,
                user_name: userName,
                locked_at: new Date().toISOString(),
                expires_at: expiresAt.toISOString()
            }, { onConflict: 'email_id' })
            .select()
            .single();

        if (error) throw error;
        return {
            success: true,
            lock: {
                emailId: data.email_id,
                userId: data.user_id,
                userName: data.user_name,
                lockedAt: data.locked_at,
                expiresAt: data.expires_at
            }
        };
    } catch (error: any) {
        console.error('Error locking email:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Unlock an email
 */
export async function unlockEmail(emailId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const { error } = await supabase
            .from('email_locks')
            .delete()
            .eq('email_id', emailId);

        if (error) throw error;
        return { success: true };
    } catch (error: any) {
        console.error('Error unlocking email:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get active locks for a set of emails
 */
export async function getEmailLocks(emailIds: string[]): Promise<EmailLock[]> {
    try {
        const { data, error } = await supabase
            .from('email_locks')
            .select('*')
            .in('email_id', emailIds)
            .gt('expires_at', new Date().toISOString());

        if (error) throw error;
        return (data || []).map((d: any) => ({
            emailId: d.email_id,
            userId: d.user_id,
            userName: d.user_name,
            lockedAt: d.locked_at,
            expiresAt: d.expires_at
        }));
    } catch (error) {
        console.error('Error fetching email locks:', error);
        return [];
    }
}

/**
 * Add internal comment to an email
 */
export async function addEmailComment(emailId: string, userId: string, userName: string, text: string): Promise<{ success: boolean; comment?: EmailComment; error?: string }> {
    try {
        const { data, error } = await supabase
            .from('email_internal_comments')
            .insert({
                email_id: emailId,
                user_id: userId,
                user_name: userName,
                comment_text: text
            })
            .select()
            .single();

        if (error) throw error;
        return {
            success: true,
            comment: {
                id: data.id,
                emailId: data.email_id,
                userId: data.user_id,
                userName: data.user_name,
                commentText: data.comment_text,
                createdAt: data.created_at
            }
        };
    } catch (error: any) {
        console.error('Error adding email comment:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get internal comments for an email
 */
export async function getEmailComments(emailId: string): Promise<EmailComment[]> {
    try {
        const { data, error } = await supabase
            .from('email_internal_comments')
            .select('*')
            .eq('email_id', emailId)
            .order('created_at', { ascending: true });

        if (error) throw error;
        return (data || []).map((d: any) => ({
            id: d.id,
            emailId: d.email_id,
            userId: d.user_id,
            userName: d.user_name,
            commentText: d.comment_text,
            createdAt: d.created_at
        }));
    } catch (error) {
        console.error('Error fetching email comments:', error);
        return [];
    }
}

/**
 * Get count of unanswered communications per account
 */
export async function getUnansweredStats(): Promise<{ accountId: string; count: number; overdue: boolean }[]> {
    try {
        // This would ideally be a complex query or RPC
        const { data, error } = await supabase
            .from('emails')
            .select('account_id, received_at')
            .eq('folder', 'inbox')
            .eq('status', 'pending');

        if (error) throw error;

        const statsMap: Record<string, { count: number; overdue: boolean }> = {};
        const twoHoursAgo = new Date();
        twoHoursAgo.setHours(twoHoursAgo.getHours() - 2);

        (data || []).forEach((email: any) => {
            const accId = email.account_id;
            if (!statsMap[accId]) statsMap[accId] = { count: 0, overdue: false };
            statsMap[accId].count++;

            if (new Date(email.received_at) < twoHoursAgo) {
                statsMap[accId].overdue = true;
            }
        });

        return Object.entries(statsMap).map(([accountId, stats]) => ({
            accountId,
            ...stats
        }));
    } catch (error) {
        console.error('Error fetching unanswered stats:', error);
        return [];
    }
}

/**
 * Trigger automatic archiving on the server
 */
export async function runAutoArchiving(days: number = 30): Promise<{ success: boolean; count?: number; error?: string }> {
    try {
        const { data, error } = await supabase.rpc('automatic_email_archiving', { days_limit: days });
        if (error) throw error;
        return { success: true, count: data };
    } catch (error: any) {
        console.error('Error in auto-archiving:', error);
        return { success: false, error: error.message };
    }
}
