
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
);

async function listAllTables() {
    console.log('Listing Tables from information_schema...');
    // We can query the information_schema to see all table names
    const { data, error } = await supabase.rpc('get_tables'); // Hopefully this RPC exists

    if (error) {
        console.log('RPC get_tables failed. Trying generic query...');
        // Fallback: common table names to check
        const names = ['ski_resorts', 'resorts', 'mountains', 'ski_centers'];
        for (const name of names) {
            const { count, error: countErr } = await supabase
                .from(name)
                .select('*', { count: 'exact', head: true });
            if (!countErr) {
                console.log(`Table found: ${name} with ${count} rows.`);
            } else {
                console.log(`Table '${name}' error: ${countErr.message}`);
            }
        }
    } else {
        console.log('Tables:', data);
    }
}

listAllTables();
