
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function test() {
    const { getHotelFullContent } = await import('../src/services/solvex/solvexDictionaryService');
    const ids = [1060, 5676];
    for (const id of ids) {
        console.log(`Checking Hotel ${id}...`);
        const res = await getHotelFullContent(id);
        // console.log("Keys:", Object.keys(res.data || {}));
        if (res.success) {
            console.log(`  -> Images: ${res.data.images.length}, Desc Length: ${res.data.description.length}`);
            if (res.data.description.length > 0) console.log(`  -> Desc Snippet: ${res.data.description.substring(0, 50)}...`);
            if (res.data.images.length > 0) console.log(`  -> First Image: ${res.data.images[0]}`);
        } else {
            console.log(`  -> ERROR: ${res.error}`);
        }
    }
}

test();
