import { createClient } from '@supabase/supabase-js';

const getEnv = (key: string) => {
    if (typeof import.meta !== 'undefined' && import.meta.env?.[key]) return import.meta.env[key];
    if (typeof process !== 'undefined' && process.env?.[key]) return process.env[key];
    return '';
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY');

// Safe client creation to prevent crash if env vars are missing
let client: any;

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('your_') || supabaseAnonKey.includes('your_')) {
    console.warn("⚠️ OlympicHub: Supabase Cloud credentials missing. App running in OFFLINE/DEMO mode.");
    // Soft mock implementation to prevent crash while informing developer
    const mockError = (method: string) => ({
        data: null,
        error: { message: `🚀 OlympicHub: Supabase Cloud connection required for '${method}'. Create .env file with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.` }
    });

    // Chainable mock builder to prevent "is not a function" errors
    const createMockBuilder = (table: string, method: string) => {
        const builder: any = {
            // These methods return the builder itself to allow chaining
            select: () => builder,
            eq: () => builder,
            neq: () => builder,
            gt: () => builder,
            gte: () => builder,
            lt: () => builder,
            lte: () => builder,
            ilike: () => builder,
            like: () => builder,
            order: () => builder,
            limit: () => builder,
            not: () => builder,
            or: () => builder,
            in: () => builder,
            contains: () => builder,
            upsert: () => builder,
            insert: () => builder,
            update: () => builder,
            delete: () => builder,
            range: () => builder,

            // These methods terminal the chain and return a Promise
            single: () => Promise.resolve(mockError(`${method} from ${table}`)),
            maybeSingle: () => Promise.resolve({ data: null, error: null }),
            then: (resolve: any, reject: any) => {
                // Allows 'await builder' to work
                return Promise.resolve({ data: [], error: mockError(`${method} from ${table}`).error }).then(resolve, reject);
            }
        };
        return builder;
    };

    client = {
        from: (table: string) => createMockBuilder(table, 'operation'),
        auth: {
            getSession: () => Promise.resolve({ data: { session: null }, error: null }),
            getUser: () => Promise.resolve({ data: { user: null }, error: null }),
            signOut: () => Promise.resolve({ error: null }),
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
