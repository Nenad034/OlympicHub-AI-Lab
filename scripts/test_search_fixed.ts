
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

    console.log(`Testing Corrected SearchHotelServices for ${id}...`);

    // Dates must be in the future for a search to work usually
    const dateFrom = new Date();
    dateFrom.setDate(dateFrom.getDate() + 30); // 30 days from now
    const dateTo = new Date(dateFrom);
    dateTo.setDate(dateTo.getDate() + 7);

    try {
        const result = await makeSoapRequest<any>('SearchHotelServices', {
            guid: auth.data,
            request: {
                PageSize: 10,
                RowIndexFrom: 0,
                DateFrom: dateFrom.toISOString(),
                DateTo: dateTo.toISOString(),
                HotelKeys: [id], // The SOAP client might wrap this or we might need { int: [id] }
                Pax: 2,
                ResultView: 1,
                Mode: 0
            }
        });

        console.log("Full Result:", JSON.stringify(result, null, 2));
    } catch (e) {
        console.error("Search failed:", e);

        console.log("Retrying with { int: [id] } wrapper...");
        try {
            const result = await makeSoapRequest<any>('SearchHotelServices', {
                guid: auth.data,
                request: {
                    PageSize: 10,
                    RowIndexFrom: 0,
                    DateFrom: dateFrom.toISOString(),
                    DateTo: dateTo.toISOString(),
                    HotelKeys: { int: [id] },
                    Pax: 2,
                    ResultView: 1,
                    Mode: 0
                }
            });
            console.log("Full Result (wrapped):", JSON.stringify(result, null, 2));
        } catch (e2) {
            console.error("Search failed again:", e2);
        }
    }
}

test();
