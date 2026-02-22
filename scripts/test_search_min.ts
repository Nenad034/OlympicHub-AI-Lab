
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

    console.log(`Testing SearchHotelServicesMinHotel for ${id}...`);
    const result = await makeSoapRequest<any>('SearchHotelServicesMinHotel', {
        guid: auth.data,
        hotelKey: id,
        checkIn: new Date().toISOString().split('T')[0],
        duration: 7,
        adults: 2
    });

    console.log("Result:", JSON.stringify(result).substring(0, 1000));
}

test();
