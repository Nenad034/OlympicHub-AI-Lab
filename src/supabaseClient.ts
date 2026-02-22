import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase Client Initialization
 * 
 * Rules:
 * - Credentials from .env ONLY
 * - Separation of concerns: Handles DB connection/mocking
 * - Type-safe implementation (avoiding 'any' where possible)
 */

type EnvKey = 'VITE_SUPABASE_URL' | 'VITE_SUPABASE_ANON_KEY';

const getEnv = (key: EnvKey): string => {
    // @ts-ignore - Vite specific
    if (typeof import.meta !== 'undefined' && import.meta.env?.[key]) return import.meta.env[key];
    if (typeof process !== 'undefined' && process.env?.[key]) return process.env[key] as string;
    return '';
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY');

// Interface for our mock/real client to ensure some type safety
interface SupabaseClientInterface {
    from: (table: string) => any; // Supabase dynamic table types are complex, but we can structure the builder
    auth: any;
    functions: any;
}

const isConfigured = supabaseUrl &&
    supabaseAnonKey &&
    !supabaseUrl.includes('your_') &&
    !supabaseAnonKey.includes('your_');

/**
 * Creates a mock builder to prevent the app from crashing in demo mode
 * while still providing helpful error messages.
 */
const createMockBuilder = (table: string, method: string) => {
    const mockError = {
        data: null,
        error: { message: `🚀 Connection required for '${method}' on '${table}'. Check .env file.` }
    };

    const builder: any = {
        select: () => builder,
        eq: () => builder,
        neq: () => builder,
        gt: () => builder,
        gte: () => builder,
        lt: () => builder,
        lte: () => builder,
        ilike: () => builder,
        order: () => builder,
        limit: () => builder,
        in: () => builder,
        upsert: () => builder,
        insert: () => builder,
        update: () => builder,
        delete: () => builder,
        single: () => Promise.resolve(mockError),
        maybeSingle: () => Promise.resolve({ data: null, error: null }),
        then: (resolve: (val: any) => void) => {
            return Promise.resolve({ data: [], error: mockError.error }).then(resolve);
        }
    };
    return builder;
};

// Singleton instance
let supabaseInstance: SupabaseClient | SupabaseClientInterface;

if (isConfigured) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
} else {
    console.warn("⚠️ Supabase credentials missing. Running in MOCK mode.");
    supabaseInstance = {
        from: (table: string) => createMockBuilder(table, 'operation'),
        auth: {
            getSession: () => Promise.resolve({ data: { session: null }, error: null }),
            getUser: () => Promise.resolve({ data: { user: null }, error: null }),
            signOut: () => Promise.resolve({ error: null }),
            onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } } })
        },
        functions: {
            invoke: (name: string) => Promise.resolve({ data: null, error: { message: `Edge Function ${name} requires Supabase config` } })
        }
    };
}

export const supabase = supabaseInstance;
