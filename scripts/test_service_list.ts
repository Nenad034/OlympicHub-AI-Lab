
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

    console.log("Fetching Service List...");
    const result = await makeSoapRequest<any>('GetServiceList', { guid: auth.data });
    const hotels = result.NewDataSet?.Hotel || [];
    console.log(`Found ${hotels.length} hotels in Service List.`);
    const k = hotels.find((h: any) => h.ID === id);
    if (k) {
        console.log("Kempinski in Service List:", JSON.stringify(k, null, 2));
    } else {
        console.log("Kempinski not found in Service List.");
    }
}

test();
