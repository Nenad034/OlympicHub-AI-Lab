
const fs = require('fs');
const path = require('path');

// Manually load .env
try {
    const envPath = path.resolve(__dirname, '../.env');
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach((line: string) => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            const key = match[1].trim();
            const value = match[2].trim().replace(/^["']|["']$/g, ''); // simple unquote
            process.env[key] = value;
        }
    });
    console.log('[Script] Loaded .env');
} catch (e) {
    console.warn('[Script] Could not find or read .env');
}

import solvexBookingService from '../src/services/solvex/solvexBookingService';

async function run() {
    console.log('--- REFRESHING SOLVEX RESERVATIONS ---');
    console.log('Fetching modified reservations for the last 7 days...');

    const today = new Date();
    const lastWeek = new Date();
    lastWeek.setDate(today.getDate() - 14); // Extended range just in case

    // We need to use valid Date strings or objects
    // The service handles Date objects.

    const result = await solvexBookingService.getReservationsFrom(lastWeek, today);

    if (result.success && result.data) {
        console.log(`Found ${result.data.length} updates.`);

        // Find our target
        const target = result.data.find((r: any) => r['@_Code'] === '2315791' || r['@_Code'] === 2315791);

        if (target) {
            console.log('\n!!! FOUND TARGET RESERVATION !!!');
            console.log('Code:', target['@_Code']);
            console.log('Key:', target['@_Key']);

            // Try access other properties just in case
            console.log('Full Object:', JSON.stringify(target, null, 2));

            console.log('\nStatus update: Validated code 2315791 exists on Solvex side as Key ' + target['@_Key']);
        } else {
            console.log('Target reservation 2315791 not found in recent updates.');
        }

    } else {
        console.error('Failed to fetch list:', result.error);
    }
}

run();
