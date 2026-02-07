
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function test() {
    const { connect } = await import('../src/services/solvex/solvexAuthService');
    const { makeSoapRequest } = await import('../src/utils/solvexSoapClient');
    const auth = await connect();

    // Country 4 (Bulgaria), City 4 (Bansko)? Let's try.
    // If it fails, we try other keys.
    const result = await makeSoapRequest<any>('GetHotels', { countryKey: 4, regionKey: -1, cityKey: 4 });
    const hotels = result.GetHotelsResult?.Hotel || [];
    console.log(`Found ${hotels.length} hotels in Bansko.`);
    if (hotels.length > 0) {
        console.log("First Hotel Raw:", JSON.stringify(hotels[0], null, 2));
    }
}

test();
