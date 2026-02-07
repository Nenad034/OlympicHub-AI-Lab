
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function test() {
    const { getCities, getHotels } = await import('../src/services/solvex/solvexDictionaryService');
    console.log("Fetching cities for Bulgaria (country 4)...");
    const cities = await getCities(4);
    console.log(`Found ${cities.length} cities.`);
    const bansko = cities.find(c => c.Name === 'Bansko');
    if (bansko) {
        console.log(`Bansko found! ID: ${bansko.ID}`);
        const hotels = await getHotels(4, -1, bansko.ID);
        console.log(`Found ${hotels.length} hotels in Bansko.`);
        const kempinski = hotels.find(h => h.ID === 1060);
        if (kempinski) {
            console.log("Kempinski Data:", JSON.stringify(kempinski, null, 2));
        }
    }
}

test();
