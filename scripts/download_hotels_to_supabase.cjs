#!/usr/bin/env node

const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuration
const SOLVEX_API_URL = 'https://iservice.solvex.bg/IntegrationService.asmx';
const SOLVEX_LOGIN = process.env.VITE_SOLVEX_LOGIN || 'sol611s';
const SOLVEX_PASSWORD = process.env.VITE_SOLVEX_PASSWORD || 'AqC384lF';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('❌ Missing SUPABASE credentials in .env');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const BATCH_SIZE = 50;
const RATE_LIMIT_MS = 300;
const MAX_RETRIES = 3;
const REQUEST_TIMEOUT = 30000;

// ============================================================================
// LOGGING & UTILITIES
// ============================================================================

const Colors = {
    Reset: '\x1b[0m',
    Green: '\x1b[32m',
    Red: '\x1b[31m',
    Yellow: '\x1b[33m',
    Blue: '\x1b[34m',
    Magenta: '\x1b[35m',
    Cyan: '\x1b[36m',
    Gray: '\x1b[90m'
};

function log(level, message) {
    const timestamp = new Date().toISOString().slice(11, 19);
    const color = {
        INFO: Colors.Blue,
        SUCCESS: Colors.Green,
        ERROR: Colors.Red,
        WARN: Colors.Yellow,
        DEBUG: Colors.Gray,
        BATCH: Colors.Magenta,
        DATA: Colors.Cyan
    }[level] || Colors.Reset;
    
    console.log(`${color}[${timestamp}] ${level.padEnd(6)}${Colors.Reset} - ${message}`);
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function formatSolvexDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}T00:00:00`;
}

// ============================================================================
// SOLVEX API FUNCTIONS
// ============================================================================

async function soapRequest(method, params, retryCount = 0) {
    const envelope = `<?xml version="1.0" encoding="utf-8"?>
<soap:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">
  <soap:Body>
    <${method} xmlns="http://www.megatec.ru/">
      ${Object.entries(params)
          .map(([k, v]) => `<${k}>${v}</${k}>`)
          .join('\n')}
    </${method}>
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
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Request timeout')), REQUEST_TIMEOUT)
            )
        ]);

        const text = await response.text();
        
        if (response.status === 200) {
            return { success: true, data: text };
        } else {
            throw new Error(`HTTP ${response.status}`);
        }
    } catch (error) {
        if (retryCount < MAX_RETRIES) {
            log('WARN', `${method} failed (attempt ${retryCount + 1}/${MAX_RETRIES}): ${error.message}`);
            await sleep(1000 * (retryCount + 1)); // Exponential backoff
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
        const title = parseXMLValue(imageXml, 'ImageName') || parseXMLValue(imageXml, 'Title') || 'Hotel Image';
        const order = parseXMLValue(imageXml, 'Order') || images.length;
        
        if (url) {
            images.push({ url: url.trim(), title: title.trim(), order: parseInt(order) || images.length });
        }
    }
    
    return images;
}

function extractDescription(xmlResponse) {
    let desc = parseXMLValue(xmlResponse, 'Description');
    if (!desc) desc = parseXMLValue(xmlResponse, 'DescriptionText');
    if (!desc) desc = parseXMLValue(xmlResponse, 'HotelDescription');
    
    if (desc && desc.includes('&lt;')) {
        desc = desc.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&amp;/g, '&');
    }
    
    return desc ? desc.trim() : null;
}

// ============================================================================
// MAIN FUNCTIONS
// ============================================================================

async function connectToSolvex() {
    log('INFO', 'Konekcija sa Solvex API-jem...');
    
    const response = await soapRequest('Connect', {
        login: SOLVEX_LOGIN,
        password: SOLVEX_PASSWORD
    });
    
    if (!response.success) {
        throw new Error(`Solvex connection failed: ${response.error}`);
    }
    
    const guid = parseXMLValue(response.data, 'ConnectResult');
    if (!guid) {
        throw new Error('GUID not found in response');
    }
    
    log('SUCCESS', `✅ Konekcija uspešna! GUID: ${guid.substring(0, 8)}...`);
    return guid;
}

async function getHotelDescription(guid, hotelId) {
    await sleep(RATE_LIMIT_MS);
    
    const response = await soapRequest('GetHotelDescription', {
        guid: guid,
        hotelCode: hotelId
    });
    
    if (!response.success) {
        return null;
    }
    
    if (response.data.includes('Exception') || response.data.includes('Error')) {
        return null;
    }
    
    const description = extractDescription(response.data);
    return description && description.length > 20 ? description : null;
}

async function getHotelImages(guid, hotelId) {
    await sleep(RATE_LIMIT_MS);
    
    const response = await soapRequest('GetHotelImages', {
        guid: guid,
        hotelCode: hotelId
    });
    
    if (!response.success) {
        return [];
    }
    
    if (response.data.includes('Exception') || response.data.includes('Error')) {
        return [];
    }
    
    return extractImages(response.data);
}

async function downloadHotelContent(guid, hotelId, hotelName) {
    try {
        const description = await getHotelDescription(guid, hotelId);
        const images = await getHotelImages(guid, hotelId);
        
        return {
            hotelId,
            hotelName,
            description,
            images,
            success: description !== null || images.length > 0,
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        log('ERROR', `Error downloading content for hotel ${hotelId}: ${error.message}`);
        return {
            hotelId,
            hotelName,
            success: false,
            error: error.message
        };
    }
}

async function uploadHotelContentToSupabase(hotelContent) {
    try {
        // Prepare data for Supabase
        const updateData = {
            content: {
                description: hotelContent.description || ''
            },
            images: hotelContent.images || [],
            updated_at: hotelContent.timestamp
        };
        
        // Update in Supabase
        const { error } = await supabase
            .from('hotels')
            .update(updateData)
            .eq('id', `solvex_${hotelContent.hotelId}`);
        
        if (error) {
            throw new Error(`Supabase update error: ${error.message}`);
        }
        
        return true;
    } catch (error) {
        log('ERROR', `Failed to upload hotel ${hotelContent.hotelId}: ${error.message}`);
        return false;
    }
}

async function loadHotelIds() {
    log('INFO', 'Učitavanje hotel IDs iz solvex_hotels.json...');
    
    try {
        const hotelData = JSON.parse(fs.readFileSync('solvex_hotels.json', 'utf-8'));
        const hotelIds = hotelData.map(h => ({
            id: h.id.replace('solvex_', ''),
            name: h.name
        }));
        
        log('SUCCESS', `✅ Učitano ${hotelIds.length} hotela`);
        return hotelIds;
    } catch (error) {
        throw new Error(`Failed to load hotel data: ${error.message}`);
    }
}

async function processHotelBatch(guid, batch, batchNumber, totalBatches) {
    log('BATCH', `─────────────────────────────────────────────────────`);
    log('BATCH', `Batch ${batchNumber}/${totalBatches} - ${batch.length} hotela`);
    log('BATCH', `─────────────────────────────────────────────────────`);
    
    const results = [];
    let successCount = 0;
    let failCount = 0;
    
    for (let i = 0; i < batch.length; i++) {
        const hotel = batch[i];
        const progress = `[${batchNumber}-${i + 1}/${batch.length}]`;
        
        try {
            log('DEBUG', `${progress} Preuzimanje: ${hotel.name} (ID: ${hotel.id})...`);
            
            const content = await downloadHotelContent(guid, hotel.id, hotel.name);
            
            if (content.success) {
                log('SUCCESS', `${progress} ✅ Sadržaj preuzet (${content.images?.length || 0} slika)`);
                successCount++;
            } else {
                log('WARN', `${progress} ⚠️  Nema sadržaja`);
                failCount++;
            }
            
            results.push(content);
        } catch (error) {
            log('ERROR', `${progress} ❌ Error: ${error.message}`);
            failCount++;
            results.push({ hotelId: hotel.id, hotelName: hotel.name, success: false, error: error.message });
        }
    }
    
    // Upload batch to Supabase
    log('INFO', `Slanje ${successCount} hotela u Supabase...`);
    let uploadCount = 0;
    
    for (const result of results) {
        if (result.success) {
            const uploaded = await uploadHotelContentToSupabase(result);
            if (uploaded) uploadCount++;
        }
    }
    
    log('SUCCESS', `Batch rezultat: ${uploadCount} uspešno učitano, ${failCount} neuspešno`);
    
    return { results, uploadCount, failCount };
}

async function main() {
    log('INFO', '╔════════════════════════════════════════════════════════════╗');
    log('INFO', '║ SOLVEX HOTEL CONTENT DOWNLOADER & SUPABASE UPLOADER        ║');
    log('INFO', '║ Preuzimanje sadržaja za 2000+ hotela                       ║');
    log('INFO', '╚════════════════════════════════════════════════════════════╝\n');
    
    try {
        // Step 1: Connect to Solvex
        const guid = await connectToSolvex();
        
        // Step 2: Load hotel IDs
        const hotelIds = await loadHotelIds();
        
        // Step 3: Process in batches
        const totalBatches = Math.ceil(hotelIds.length / BATCH_SIZE);
        let totalSuccessful = 0;
        let totalFailed = 0;
        let totalUploaded = 0;
        
        for (let i = 0; i < hotelIds.length; i += BATCH_SIZE) {
            const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
            const batch = hotelIds.slice(i, i + BATCH_SIZE);
            
            const batchResult = await processHotelBatch(guid, batch, batchNumber, totalBatches);
            
            totalSuccessful += batchResult.uploadCount;
            totalFailed += batchResult.failCount;
            totalUploaded += batchResult.uploadCount;
            
            // Wait between batches
            if (batchNumber < totalBatches) {
                log('INFO', `Čekanje 5 sekundi pre nego što se nastavi sa sledećim batch-om...`);
                await sleep(5000);
            }
        }
        
        // Final summary
        log('INFO', '\n╔════════════════════════════════════════════════════════════╗');
        log('INFO', '║ ZAVRŠENO!                                                  ║');
        log('INFO', '╚════════════════════════════════════════════════════════════╝');
        log('SUCCESS', `✅ Ukupno učitano: ${totalUploaded}/${hotelIds.length} hotela`);
        log('INFO', `Uspešno: ${totalSuccessful}`);
        log('WARN', `Neuspešno: ${totalFailed}`);
        
        // Save summary
        const summary = {
            timestamp: new Date().toISOString(),
            totalHotels: hotelIds.length,
            processedBatches: totalBatches,
            successfulUploads: totalUploaded,
            failedUploads: totalFailed,
            batchSize: BATCH_SIZE,
            rateLimitMs: RATE_LIMIT_MS
        };
        
        fs.writeFileSync('hotel_download_summary.json', JSON.stringify(summary, null, 2));
        log('SUCCESS', `Rezime sačuvan u: hotel_download_summary.json`);
        
    } catch (error) {
        log('ERROR', `Fatal error: ${error.message}`);
        console.error(error);
        process.exit(1);
    }
}

// Run
main().catch(error => {
    log('ERROR', `Uncaught error: ${error.message}`);
    console.error(error);
    process.exit(1);
});

module.exports = { main, downloadHotelContent, processHotelBatch };
