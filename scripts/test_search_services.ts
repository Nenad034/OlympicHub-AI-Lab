
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

    console.log(`Testing SearchHotelServices for ${id}...`);
    // Note: SearchHotelServices expects a complex request object
    const result = await makeSoapRequest<any>('SearchHotelServices', {
        guid: auth.data,
        cityKey: -1,
        hotelKeys: { int: [id] }, // Some APIs want this wrapper for arrays
        checkIn: new Date().toISOString().split('T')[0],
        duration: 7,
        adults: 2
    });

    console.log("Result Keys:", Object.keys(result));
    const stringified = JSON.stringify(result);
    console.log("Contains HotelImage?", stringified.includes("HotelImage"));
    console.log("Contains Description?", stringified.includes("Description"));

    const urls = stringified.match(/https?:\/\/[^\s\"\'<>]+/gi);
    console.log("Found URLs:", (urls || []).slice(0, 5));
}

test();
