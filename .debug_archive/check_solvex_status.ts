
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Manually load .env for Node environment BEFORE other imports
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
try {
    const envPath = path.resolve(__dirname, '.env');
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        envContent.split('\n').forEach((line) => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                const value = match[2].trim().replace(/^["']|["']$/g, '');
                process.env[key] = value;
            }
        });
        console.log('[Script] Loaded .env');
    }
} catch (e) {
    console.warn('[Script] Could not find or read .env');
}

import { connect } from './src/services/solvex/solvexAuthService';
import { makeSoapRequest } from './src/utils/solvexSoapClient';
import { SOLVEX_SOAP_METHODS } from './src/services/solvex/solvexConstants';

async function checkStatus() {
    console.log('--- SOLVEX STATUS CHECK ---');
    console.log('Reservation Code: 2315791');
    console.log('Known Key: 706496');

    try {
        const auth = await connect();
        if (!auth.success || !auth.data) {
            console.error('Auth failed:', auth.error);
            return;
        }
        const guid = auth.data;
        console.log('Auth successful, GUID obtained.');

        // Method 1: GetReservation by dgKey (706496)
        console.log('\n--- FETCHING BY KEY 706496 ---');
        const resByKey = await makeSoapRequest<any>(SOLVEX_SOAP_METHODS.GET_RESERVATION, {
            guid: guid,
            dgKey: '706496'
        });

        console.log('Response ID:', resByKey?.ID);
        console.log('Response Number/Name:', resByKey?.Name || resByKey?.Number);
        console.log('Response Status:', resByKey?.Status);
        console.log('Response Details (Cleaned):', JSON.stringify(resByKey, null, 2));

        // Method 2: GetReservationsFrom to find metadata if needed
        console.log('\n--- FETCHING RECENT UPDATES ---');
        const dateFrom = new Date();
        dateFrom.setDate(dateFrom.getDate() - 30);
        const dateTo = new Date();

        const soapParams = {
            guid: guid,
            dateFrom: dateFrom.toISOString().split('T')[0] + 'T00:00:00',
            dateTo: dateTo.toISOString().split('T')[0] + 'T23:59:59'
        };

        const listRes = await makeSoapRequest<any>('GetReservationsFrom', soapParams);
        if (listRes && listRes.Data && listRes.Data.ReservationKeyCode) {
            const list = Array.isArray(listRes.Data.ReservationKeyCode)
                ? listRes.Data.ReservationKeyCode
                : [listRes.Data.ReservationKeyCode];

            const target = list.find((r: any) =>
                String(r['@_Code']) === '2315791' || String(r['@_Key']) === '706496'
            );

            if (target) {
                console.log('Found in list:', JSON.stringify(target, null, 2));
            } else {
                console.log('Not found in recent list (30 days).');
            }
        }

    } catch (error) {
        console.error('Error during status check:', error);
    }
}

checkStatus();
