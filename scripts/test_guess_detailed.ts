
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

    console.log("Testing GetDetailedHotels (Guessing)...");
    try {
        const result = await makeSoapRequest<any>('GetDetailedHotels', {
            countryKey: 4,
            regionKey: -1,
            cityKey: 4 // Bansko
        });
        console.log("Result:", JSON.stringify(result, null, 2));
    } catch (e) {
        console.error("Guessed GetDetailedHotels failed:", e);
    }
}

test();
