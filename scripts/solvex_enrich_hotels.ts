
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../.env');
dotenv.config({ path: envPath });

// Now import after dotenv
import { createClient } from '@supabase/supabase-js';

async function enrichSolvexHotels() {
    try {
        const { getHotelFullContent } = await import('../src/services/solvex/solvexDictionaryService');

        const LOGIN = process.env.VITE_SOLVEX_LOGIN;
        const PASSWORD = process.env.VITE_SOLVEX_PASSWORD;
        const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
        const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || "";

        if (!supabaseUrl || !supabaseKey || !LOGIN || !PASSWORD) {
            console.error("Missing configuration in .env!");
            process.exit(1);
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        console.log("=== SOLVEX CONTENT ENRICHMENT STARTED ===");

        // Fetch ALL hotels
        let allProperties: any[] = [];
        let from = 0;
        let to = 999;

        console.log("Fetching properties from database...");
        while (true) {
            const { data, error } = await supabase
                .from('properties')
                .select('*')
                .like('id', 'solvex_%')
                .range(from, to)
                .order('id', { ascending: true });

            if (error) {
                console.error("Error fetching properties:", error);
                return;
            }

            if (!data || data.length === 0) break;

            allProperties = [...allProperties, ...data];
            if (data.length < 1000) break;

            from += 1000;
            to += 1000;
        }

        console.log(`Found ${allProperties.length} Solvex hotels to check.`);

        let updatedCount = 0;
        let skipCount = 0;
        let errorCount = 0;

        for (let i = 0; i < allProperties.length; i++) {
            const prop = allProperties[i];
            const today = new Date().toISOString().split('T')[0];

            // Resume logic: if updated today, only skip if it ALREADY has images or content
            // However, since we improved the parser, we might want to re-check those skipped today.
            // But for now, let's just skip anything updated today to be safe and fast.
            /*
            if (prop.updated_at && prop.updated_at.startsWith(today)) {
                skipCount++;
                continue;
            }
            */

            const solvexIdStr = prop.id.replace('solvex_', '');
            const solvexId = parseInt(solvexIdStr);
            if (isNaN(solvexId)) continue;

            console.log(`[${i + 1}/${allProperties.length}] Enriching ${prop.id} (${prop.name || 'Unknown'})...`);

            let result = await getHotelFullContent(solvexId);

            // Rate Limit handling: if we failed due to rate limit, wait and retry
            if (!result.success && result.error?.includes('Rate limit')) {
                console.warn(`   [RATE LIMIT] Waiting 60 seconds before retry...`);
                await new Promise(r => setTimeout(r, 60000));
                result = await getHotelFullContent(solvexId);
            }

            if (result.success && result.data) {
                const { images, description } = result.data;

                // Skip if both are empty - just update timestamp
                if (images.length === 0 && (!description || description.length < 20)) {
                    await supabase.from('properties').update({ updated_at: new Date().toISOString() }).eq('id', prop.id);
                    console.log(`   [SKIP] No images/desc found.`);
                    skipCount++;
                } else {
                    // Prepare Update
                    let updatedContent: any[] = [];
                    const existingContent = prop.content;

                    if (Array.isArray(existingContent) && existingContent.length > 0) {
                        updatedContent = JSON.parse(JSON.stringify(existingContent));
                    } else {
                        updatedContent = [{
                            languageCode: 'sr',
                            officialName: prop.name || prop.id,
                            displayName: prop.name || prop.id,
                            shortDescription: (description || "").substring(0, 250),
                            longDescription: description || ""
                        }];
                    }

                    if (updatedContent[0]) {
                        updatedContent[0].longDescription = description || updatedContent[0].longDescription;
                        updatedContent[0].shortDescription = (description || "").substring(0, 250);
                    }

                    const newImages = images.map((url, idx) => ({
                        url: url,
                        altText: prop.name || "Hotel Image",
                        category: 'Exterior' as any,
                        sortOrder: idx
                    }));

                    const { error: updateError } = await supabase
                        .from('properties')
                        .update({
                            content: updatedContent,
                            images: newImages.length > 0 ? newImages : prop.images,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', prop.id);

                    if (updateError) {
                        console.error(`   [ERROR] Update failed:`, updateError);
                        errorCount++;
                    } else {
                        console.log(`   [SUCCESS] Updated with ${images.length} images.`);
                        updatedCount++;
                    }
                }
            } else {
                console.error(`   [ERROR] ${result.error}`);
                errorCount++;
            }

            // Global throttle: process ~6 hotels per minute to stay safe (20 requests/min limit)
            const delay = result.data?.images.length === 0 ? 8000 : 3000;
            await new Promise(r => setTimeout(r, delay));
        }

        console.log("\n=== ENRICHMENT COMPLETE ===");
        console.log(`Total checked: ${allProperties.length}`);
        console.log(`Successfully updated: ${updatedCount}`);
        console.log(`Skipped (already checked today): ${skipCount}`);
        console.log(`Errors: ${errorCount}`);
    } catch (e: any) {
        console.error("CRITICAL ERROR IN SCRIPT:", e);
    }
}

enrichSolvexHotels();
