
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

    console.log("Fetching cities for Bulgaria...");
    const result = await makeSoapRequest<any>('GetCities', { guid: auth.data, countryKey: 4, regionKey: -1 });
    const cities = result.GetCitiesResult?.City || [];
    console.log(`Found ${cities.length} cities.`);
    if (cities.length > 0) {
        console.log("Cities:", cities.slice(0, 10).map((c: any) => `${c.Name} (${c.ID})`));
    }
}

test();
