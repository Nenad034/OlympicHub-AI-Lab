
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

    console.log(`Testing GetHotelDescription for ${id}...`);
    const desc = await makeSoapRequest<any>('GetHotelDescription', { guid: auth.data, hotelCode: id });
    console.log("Description Result:", JSON.stringify(desc).substring(0, 500));

    console.log(`Testing GetHotelImages for ${id}...`);
    const imgs = await makeSoapRequest<any>('GetHotelImages', { guid: auth.data, hotelCode: id });
    console.log("Images Result:", JSON.stringify(imgs).substring(0, 500));
}

test();
