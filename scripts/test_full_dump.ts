
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

    console.log(`Aggressively testing GetRoomDescriptions for ${id}...`);
    const result = await makeSoapRequest<any>('GetRoomDescriptions', { guid: auth.data, hotelKey: id });
    console.log("Full Result Stringified:", JSON.stringify(result));
}

test();
