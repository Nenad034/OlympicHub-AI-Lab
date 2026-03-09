import { supabase } from '../supabaseClient';

export interface WebEnquiry {
    id: string;
    source: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    subject: string;
    message: string;
    status: 'pending' | 'replied' | 'processing' | 'closed' | 'ignored';
    assignedTo?: string;
    respondedAt?: string;
    createdAt: string;
    updatedAt: string;
}

/**
 * Get unanswered web enquiries
 */
export async function getUnansweredWebEnquiries(): Promise<WebEnquiry[]> {
    try {
        const { data, error } = await supabase
            .from('web_enquiries')
            .select('*')
            .eq('status', 'pending')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return (data || []).map(d => ({
            id: d.id,
            source: d.source,
            customerName: d.customer_name,
            customerEmail: d.customer_email,
            customerPhone: d.customer_phone,
            subject: d.subject,
            message: d.message,
            status: d.status,
            assignedTo: d.assigned_to,
            respondedAt: d.responded_at,
            createdAt: d.created_at,
            updatedAt: d.updated_at
        }));
    } catch (error) {
        console.error('Error fetching web enquiries:', error);
        return [];
    }
}

/**
 * Update web enquiry status
 */
export async function updateWebEnquiryStatus(id: string, status: WebEnquiry['status']): Promise<{ success: boolean; error?: string }> {
    try {
        const { error } = await supabase
            .from('web_enquiries')
            .update({
                status,
                responded_at: status === 'replied' ? new Date().toISOString() : undefined,
                updated_at: new Date().toISOString()
            })
            .eq('id', id);

        if (error) throw error;
        return { success: true };
    } catch (error: any) {
        console.error('Error updating web enquiry:', error);
        return { success: false, error: error.message };
    }
}
