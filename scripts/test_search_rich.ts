
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

    const hotelId = 1060; // Kempinski

    console.log(`Searching for hotel ${hotelId} to get images...`);

    const resultViews = [1, 3, 7, 15, 31, 63, 127, 255, 511, 1023];
    const modes = [0, 1];

    for (const rv of resultViews) {
        for (const m of modes) {
            console.log(`--- Testing ResultView: ${rv}, Mode: ${m} ---`);
            const request = {
                PageSize: 5,
                RowIndexFrom: 0,
                DateFrom: "2026-06-01T00:00:00",
                DateTo: "2026-06-08T00:00:00",
                CityKeys: { int: [68] }, // Sunny Beach
                Pax: 2,
                Ages: { int: [] },
                ResultView: rv,
                Mode: m
            };

            try {
                const result = await makeSoapRequest<any>('SearchHotelServices', {
                    guid: auth.data,
                    request: request
                });

                const stringified = JSON.stringify(result);
                if (stringified.includes('http') && !stringified.includes('megatec.ru') && !stringified.includes('schemas.xmlsoap.org')) {
                    console.log(`SUCCESS: Found URL with ResultView ${rv}, Mode ${m}!`);
                    const fs = await import('fs');
                    fs.writeFileSync(`success_rv${rv}_m${m}.json`, stringified);
                    return; // Stop on first success
                } else {
                    console.log(`No images with ResultView ${rv}, Mode ${m}.`);
                }
            } catch (e: any) {
                console.error(`Failed with RV ${rv}, M ${m}: ${e.message}`);
            }

            // Tiny delay between attempts to not trigger rate limit too fast
            await new Promise(r => setTimeout(r, 1000));
        }
    }
}

test();
