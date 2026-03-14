import { supabase } from '../supabaseClient';

export interface PimMessage {
  id: string;
  content: string;
  timestamp: string;
  role: 'Customer' | 'Agent';
}

export interface PimCommunication {
  id: string;
  source: string; // 'Email', 'Viber', 'WhatsApp', 'Telegram', 'Facebook', 'Instagram', 'LinkedIn', 'TikTok', 'X', 'SMS'
  sender_name: string;
  sender_id: string;
  last_message: string;
  timestamp: string;
  sentiment: 'Positive' | 'Neutral' | 'Negative' | 'Urgent';
  intent: 'Booking' | 'Inquiry' | 'Complaint' | 'Support' | 'Gratitude';
  status: 'Unread' | 'Analyzed' | 'Actioned';
  tags: string[];
  assigned_to: string;
  history: PimMessage[];
}

export const pimService = {
  /**
   * Fetches aggregated feed from emails and chat hub
   */
  async getAggregatedFeed(): Promise<PimCommunication[]> {
    const allCommunications: PimCommunication[] = [];

    // 1. Fetch from Chat Hub (Messengers & Social)
    const { data: chatThreads, error: chatError } = await supabase
      .from('pim_chat_threads')
      .select(`
        *,
        pim_chat_messages (
          id,
          content,
          sender_type,
          created_at
        )
      `)
      .order('last_message_at', { ascending: false });

    if (!chatError && chatThreads) {
      chatThreads.forEach(thread => {
        allCommunications.push({
          id: thread.id,
          source: thread.platform,
          sender_name: thread.sender_display_name,
          sender_id: thread.external_sender_id,
          last_message: thread.last_message_preview || '',
          timestamp: thread.last_message_at,
          sentiment: thread.current_sentiment as any,
          intent: 'Inquiry', // Default or AI detected
          status: thread.status === 'open' ? 'Unread' : 'Actioned',
          tags: thread.tags || [],
          assigned_to: thread.assigned_staff_id || 'Unassigned',
          history: thread.pim_chat_messages.map((msg: any) => ({
            id: msg.id,
            content: msg.content,
            role: msg.sender_type === 'client' ? 'Customer' : 'Agent',
            timestamp: msg.created_at
          }))
        });
      });
    }

    // 2. Fetch from Emails (Existing track)
    const { data: emails, error: emailError } = await supabase
      .from('emails')
      .select('*')
      .order('received_at', { ascending: false })
      .limit(50);

    if (!emailError && emails) {
      emails.forEach(email => {
        allCommunications.push({
          id: email.id,
          source: 'Email',
          sender_name: email.sender || email.sender_email,
          sender_id: email.sender_email,
          last_message: email.subject,
          timestamp: email.received_at || email.created_at,
          sentiment: (email.status === 'urgent' ? 'Urgent' : 'Neutral') as any,
          intent: 'Inquiry',
          status: email.is_read ? 'Actioned' : 'Unread',
          tags: [],
          assigned_to: email.assigned_to || 'Unassigned',
          history: [
            { id: email.id, role: 'Customer', content: email.body || email.preview || '', timestamp: email.received_at || email.created_at }
          ]
        });
      });
    }

    return allCommunications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }
};
