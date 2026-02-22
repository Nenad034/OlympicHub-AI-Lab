
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function test() {
    const { getDetailedHotels } = await import('../src/services/solvex/solvexDictionaryService');
    const id = 6139;

    console.log(`Getting Detailed (Search-based) content for ${id}...`);
    const results = await getDetailedHotels([id]);

    console.log("Results count:", results.length);
    if (results.length > 0) {
        console.log("First Result Hotel data:", JSON.stringify(results[0].hotel, null, 2));
    } else {
        console.log("No availability for the chosen dates, so no detailed data returned.");
    }
}

test();
