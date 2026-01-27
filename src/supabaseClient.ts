import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Safe client creation to prevent crash if env vars are missing
let client: any;

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('your_') || supabaseAnonKey.includes('your_')) {
    console.warn("⚠️ OlympicHub: Supabase Cloud credentials missing. App running in OFFLINE/DEMO mode.");
    // Soft mock implementation to prevent crash while informing developer
    const mockError = (method: string) => ({
        data: null,
        error: { message: `🚀 OlympicHub: Supabase Cloud connection required for '${method}'. Create .env file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.` }
    });

    client = {
        from: (table: string) => ({
            select: () => ({
                limit: () => ({
                    single: () => Promise.resolve(mockError(`select from ${table}`))
                }),
                order: () => Promise.resolve({ data: [], error: mockError(`select from ${table}`).error }),
                eq: () => Promise.resolve({ data: [], error: mockError(`select from ${table}`).error })
            }),
            upsert: () => ({
                select: () => ({
                    single: () => Promise.resolve(mockError(`upsert to ${table}`))
                })
            }),
            insert: () => ({
                select: () => ({
                    single: () => Promise.resolve(mockError(`insert to ${table}`))
                })
            }),
            update: () => Promise.resolve(mockError(`update ${table}`)),
            delete: () => Promise.resolve(mockError(`delete from ${table}`))
        }),
        auth: {
            getSession: () => Promise.resolve({ data: { session: null }, error: null }),
            refreshSession: () => Promise.resolve({ data: { session: null, user: null }, error: null }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } })
        },
        functions: {
            invoke: (name: string) => Promise.resolve(mockError(`Edge Function: ${name}`))
        }
    };
} else {
    client = createClient(supabaseUrl, supabaseAnonKey);
}

export const supabase = client;
