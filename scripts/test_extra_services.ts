
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
    const id = 1060;

    console.log(`Testing GetExtraServices for ${id}...`);
    try {
        const result = await makeSoapRequest<any>('GetExtraServices', {
            guid: auth.data,
            request: {
                ServiceClassKey: 1, // Hotel
                CountryKey: 4, // Bulgaria
                CityKey: 4, // Bansko
                HotelKey: id,
                TypeKey: 0
            }
        });

        console.log("Result:", JSON.stringify(result, null, 2));
    } catch (e) {
        console.error("GetExtraServices failed:", e);
    }
}

test();
