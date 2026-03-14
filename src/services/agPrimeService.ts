import { supabase } from '../supabaseClient';

export interface AgPrimeSession {
  id: string;
  user_id: string;
  session_token: string;
  entry_module: string;
  is_active: boolean;
  created_at: string;
}

export interface AgPrimeLog {
  id: string;
  session_id: string;
  user_prompt: string;
  ai_response: string;
  detected_intent: string;
  created_at: string;
}

export const agPrimeService = {
  /**
   * Starts a new AI session or resumes an existing one
   */
  async startSession(moduleName: string): Promise<string> {
    const sessionToken = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const { data, error } = await supabase
      .from('ag_prime_sessions')
      .insert({
        session_token: sessionToken,
        entry_module: moduleName,
        is_active: true
      })
      .select('id')
      .single();

    if (error) {
      console.error('Error starting AG Prime session:', error);
      return '';
    }
    return data.id;
  },

  /**
   * Logs an interaction and triggers "learning"
   */
  async logInteraction(sessionId: string, prompt: string, response: string, intent: string = 'Inquiry') {
    const { error } = await supabase
      .from('ag_prime_interaction_logs')
      .insert({
        session_id: sessionId,
        user_prompt: prompt,
        ai_response: response,
        detected_intent: intent
      });

    if (error) console.error('Error logging interaction:', error);

    // Simple pattern matching for "learning" - in a real app, this would be done by the AI model
    if (prompt.toLowerCase().includes('preferiram') || prompt.toLowerCase().includes('uvek prikaži')) {
      await this.saveKnowledge('User_Preference', prompt, sessionId);
    }
  },

  /**
   * Saves a learned fact to the Knowledge Base
   */
  async saveKnowledge(type: string, data: any, logId?: string) {
    const { error } = await supabase
      .from('ag_prime_knowledge_base')
      .insert({
        knowledge_type: type,
        topic: 'User Insight',
        content_data: { raw: data },
        confidence_rating: 0.9,
        source_log_id: logId
      });

    if (error) console.error('Error saving knowledge:', error);
  },

  /**
   * Retrieves last chat logs to maintain context
   */
  async getRecentLogs(limit: number = 20): Promise<AgPrimeLog[]> {
    const { data, error } = await supabase
      .from('ag_prime_interaction_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching logs:', error);
      return [];
    }
    return data.reverse();
  },

  /**
   * Gets all learned knowledge to personalize the UI/AI
   */
  async getLearnedKnowledge() {
    const { data, error } = await supabase
      .from('ag_prime_knowledge_base')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return [];
    return data;
  }
};
