import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://yqqztdlkrxrwuvpolmin.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxcXp0ZGxrcnhyd3V2cG9sbWluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3NjIzNDEsImV4cCI6MjA4OTMzODM0MX0.AIlvGgth3AsHqsFZBNhRJKAN3qrqokTg5Q9W4mu25f4';

if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
  console.warn('❌ Supabase configuration missing in .env. Using dummy configuration to prevent crash.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Helper to log search events or store results in the background
 */
export const logSearchRequest = async (criteria: any) => {
  try {
    const { error } = await supabase
      .from('search_logs')
      .insert([
        { 
          criteria, 
          created_at: new Date().toISOString() 
        }
      ]);
    
    if (error) throw error;
  } catch (err) {
    console.error('Supabase Logging Error:', err);
  }
};
