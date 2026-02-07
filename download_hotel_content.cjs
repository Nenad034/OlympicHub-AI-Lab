#!/usr/bin/env node

/**
 * SOLVEX HOTEL CONTENT DOWNLOADER
 * Preuzima slike i opise sa Solvex API i ažurira properties tabelu u Supabase
 * 
 * Usage: node download_hotel_content.cjs
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load .env files with proper precedence: .env.server > .env.server.local > .env
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.server' });
require('dotenv').config({ path: '.env.server.local' });
require('dotenv').config({ path: '.env.local' });

// ============================================================================
// CONFIGURATION
// ============================================================================

const SOLVEX_API_URL = 'https://iservice.solvex.bg/IntegrationService.asmx';
const SOLVEX_LOGIN = process.env.VITE_SOLVEX_LOGIN || 'sol611s';
const SOLVEX_PASSWORD = process.env.VITE_SOLVEX_PASSWORD || 'AqC384lF';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Missing Supabase credentials in .env');
    console.error('Required: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const BATCH_SIZE = 50;
const RATE_LIMIT_MS = 300;
const MAX_RETRIES = 3;
const REQUEST_TIMEOUT = 30000;

// ============================================================================
// LOGGING
// ============================================================================

function log(type, msg) {
    const time = new Date().toISOString().slice(11, 19);
    const symbols = {
        INFO: '🔵',
        SUCCESS: '✅',
        ERROR: '❌',
        WARN: '⚠️',
        DEBUG: '⚪',
        BATCH: '📦',
        DATA: '📊'
    };
    console.log(`${symbols[type] || '•'} [${time}] ${msg}`);
}

function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

// ============================================================================
// SOLVEX API
// ============================================================================

async function soapRequest(method, params, retryCount = 0) {
    let bodyContent;
    
    // Special handling for SearchHotelServices with complex request XML
    if (method === 'SearchHotelServices' && params.request) {
        bodyContent = `
    <${method} xmlns="http://www.megatec.ru/">
      <guid>${params.guid}</guid>
      <request>${params.request}</request>
    </${method}>`;
    } else {
        bodyContent = `
    <${method} xmlns="http://www.megatec.ru/">
      ${Object.entries(params).map(([k, v]) => `<${k}>${v}</${k}>`).join('\n')}
    </${method}>`;
    }
    
    const envelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>${bodyContent}
  </soap:Body>
</soap:Envelope>`;

    try {
        const response = await Promise.race([
            fetch(SOLVEX_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/xml; charset=utf-8',
                    'SOAPAction': `http://www.megatec.ru/${method}`
                },
                body: envelope
            }),
            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), REQUEST_TIMEOUT))
        ]);

        const text = await response.text();
        if (response.status === 200) {
            return { success: true, data: text };
        } else {
            throw new Error(`HTTP ${response.status}`);
        }
    } catch (error) {
        if (retryCount < MAX_RETRIES) {
            log('WARN', `${method} failed (${retryCount + 1}/${MAX_RETRIES}): ${error.message}`);
            await sleep(1000 * (retryCount + 1));
            return soapRequest(method, params, retryCount + 1);
        }
        return { success: false, error: error.message };
    }
}

function parseXMLValue(xml, tagName) {
    const regex = new RegExp(`<${tagName}>(.*?)</${tagName}>`, 's');
    const match = xml.match(regex);
    return match ? match[1] : null;
}

function extractImages(xmlResponse) {
    const images = [];
    const imageRegex = /<Image[^>]*>(.*?)<\/Image>/gs;
    let match;
    while ((match = imageRegex.exec(xmlResponse)) !== null) {
        const imageXml = match[1];
        const url = parseXMLValue(imageXml, 'ImageUrl') || parseXMLValue(imageXml, 'Url');
        const title = parseXMLValue(imageXml, 'ImageName') || 'Hotel Image';
        if (url) images.push({ url: url.trim(), title: title.trim(), order: images.length });
    }
    return images;
}

function extractDescription(xmlResponse) {
    let desc = parseXMLValue(xmlResponse, 'Description') ||
               parseXMLValue(xmlResponse, 'DescriptionText') ||
               parseXMLValue(xmlResponse, 'HotelDescription');
    if (desc && desc.includes('&lt;')) {
        desc = desc.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&');
    }
    return desc ? desc.trim() : null;
}

// ============================================================================
// FUNCTIONS
// ============================================================================

async function connectToSolvex() {
    log('INFO', 'Konekcija sa Solvex...');
    const response = await soapRequest('Connect', { login: SOLVEX_LOGIN, password: SOLVEX_PASSWORD });
    if (!response.success) throw new Error(`Connection failed: ${response.error}`);
    const guid = parseXMLValue(response.data, 'ConnectResult');
    if (!guid) throw new Error('GUID not found');
    log('SUCCESS', `GUID: ${guid.substring(0, 8)}...`);
    return guid;
}

async function downloadHotelContent(guid, hotelId) {
    try {
        // Try different approaches to get hotel data
        
        // Approach 1: Use SearchHotelServices with ResultView=2 (no availability, just info)
        const today = new Date();
        const checkIn = new Date(today);
        checkIn.setDate(checkIn.getDate() + 30);
        const checkOut = new Date(checkIn);
        checkOut.setDate(checkOut.getDate() + 7);
        
        const dateFrom = checkIn.toISOString().split('T')[0] + 'T00:00:00';
        const dateTo = checkOut.toISOString().split('T')[0] + 'T00:00:00';

        // Request with ResultView=2 for hotel info only (no room availability)
        const requestXml = `
        <PageSize>1</PageSize>
        <RowIndexFrom>0</RowIndexFrom>
        <DateFrom>${dateFrom}</DateFrom>
        <DateTo>${dateTo}</DateTo>
        <Pax>2</Pax>
        <Mode>0</Mode>
        <ResultView>2</ResultView>
        <HotelKeys><int>${hotelId}</int></HotelKeys>`;

        const searchParams = {
            guid: guid,
            request: requestXml
        };

        await sleep(RATE_LIMIT_MS);
        const response = await soapRequest('SearchHotelServices', searchParams);
        
        if (!response.success) {
            return { hotelId, success: false, error: response.error };
        }

        // Extract images and description from SearchHotelServices response
        const images = extractImages(response.data);
        const description = extractDescription(response.data);

        // Even if empty, mark as processed
        return {
            hotelId,
            description,
            images,
            success: true // Mark as success even with no data
        };
    } catch (error) {
        log('ERROR', `Hotel ${hotelId}: ${error.message}`);
        return { hotelId, success: false, error: error.message };
    }
}

async function updateSupabase(supabaseId, content) {
    try {
        const updateData = { updated_at: new Date().toISOString() };
        
        if (content.description) {
            updateData.content = { description: content.description };
        }
        if (content.images && content.images.length > 0) {
            updateData.images = content.images;
        }

        const { error } = await supabase
            .from('properties')
            .update(updateData)
            .eq('id', supabaseId);

        if (error) {
            log('ERROR', `Supabase update for ${supabaseId}: ${error.message}`);
            return false;
        }
        return true;
    } catch (error) {
        log('ERROR', `Upload ${supabaseId}: ${error.message}`);
        return false;
    }
}

async function getHotelsFromSupabase() {
    log('INFO', 'Učitavanje hotela iz Supabase...');
    try {
        const { data, error } = await supabase
            .from('properties')
            .select('id, name')
            .eq('isActive', true)
            .limit(5000);

        if (error) throw error;
        log('SUCCESS', `Učitano ${data.length} hotela`);
        return data;
    } catch (error) {
        log('ERROR', `Failed to load hotels: ${error.message}`);
        return [];
    }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
    log('INFO', '╔════════════════════════════════════════════╗');
    log('INFO', '║ SOLVEX HOTEL CONTENT DOWNLOADER            ║');
    log('INFO', '╚════════════════════════════════════════════╝\n');

    try {
        // Connect to Solvex
        const guid = await connectToSolvex();

        // Get hotels from Supabase
        const hotels = await getHotelsFromSupabase();
        if (hotels.length === 0) {
            log('ERROR', 'Nema hotela u bazi!');
            return;
        }

        // Process in batches
        const totalBatches = Math.ceil(hotels.length / BATCH_SIZE);
        let totalSuccess = 0;
        let totalFail = 0;

        for (let i = 0; i < hotels.length; i += BATCH_SIZE) {
            const batchNum = Math.floor(i / BATCH_SIZE) + 1;
            const batch = hotels.slice(i, i + BATCH_SIZE);

            log('BATCH', `─`.repeat(40));
            log('BATCH', `Batch ${batchNum}/${totalBatches} (${batch.length} hotela)`);

            for (let j = 0; j < batch.length; j++) {
                const hotel = batch[j];
                const hotelId = hotel.id.replace('solvex_', '');
                const progress = `[${batchNum}-${j + 1}/${batch.length}]`;

                try {
                    log('DEBUG', `${progress} ${hotel.name} (${hotelId})`);

                    const content = await downloadHotelContent(guid, hotelId);
                    if (content.success) {
                        const uploaded = await updateSupabase(hotel.id, content);
                        if (uploaded) {
                            log('SUCCESS', `${progress} ✅ (${content.images?.length || 0} slika)`);
                            totalSuccess++;
                        } else {
                            log('WARN', `${progress} ⚠️ Nema sadržaja`);
                            totalFail++;
                        }
                    } else {
                        log('WARN', `${progress} ⚠️ Greška`);
                        totalFail++;
                    }
                } catch (error) {
                    log('ERROR', `${progress} ${error.message}`);
                    totalFail++;
                }
            }

            // Wait between batches
            if (batchNum < totalBatches) {
                log('INFO', 'Čekanje 5 sekundi...');
                await sleep(5000);
            }
        }

        // Summary
        log('INFO', '\n╔════════════════════════════════════════════╗');
        log('SUCCESS', `✅ Ukupno: ${totalSuccess} uspešno`);
        log('WARN', `❌ Neuspešno: ${totalFail}`);
        log('INFO', '╚════════════════════════════════════════════╝');

        const summary = {
            timestamp: new Date().toISOString(),
            totalHotels: hotels.length,
            successfulUploads: totalSuccess,
            failedUploads: totalFail
        };
        fs.writeFileSync('download_summary.json', JSON.stringify(summary, null, 2));
        log('SUCCESS', 'Rezime: download_summary.json');

    } catch (error) {
        log('ERROR', `Fatal: ${error.message}`);
        console.error(error);
        process.exit(1);
    }
}

main();
