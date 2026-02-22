
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

    console.log("Fetching countries...");
    const result = await makeSoapRequest<any>('GetCountries', { guid: auth.data });
    const countries = result.GetCountriesResult?.Country || [];
    console.log("Countries:", countries.map((c: any) => `${c.Name} (${c.ID})`));
}

test();
