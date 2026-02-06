
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

        // Fetch hotels
        const { data: properties, error } = await supabase
            .from('properties')
            .select('*')
            .like('id', 'solvex_%');

        if (error) {
            console.error("Error fetching properties:", error);
            return;
        }

        if (!properties || properties.length === 0) {
            console.log("No Solvex hotels found in database.");
            return;
        }

        console.log(`Found ${properties.length} Solvex hotels to check.`);

        let updatedCount = 0;
        let errorCount = 0;

        for (let i = 0; i < properties.length; i++) {
            const prop = properties[i];
            const solvexIdStr = prop.id.replace('solvex_', '');
            const solvexId = parseInt(solvexIdStr);

            if (isNaN(solvexId)) {
                console.log(`[${i + 1}/${properties.length}] Skipping invalid ID: ${prop.id}`);
                continue;
            }

            console.log(`[${i + 1}/${properties.length}] Enriching ${prop.id}...`);

            const result = await getHotelFullContent(solvexId);

            if (result.success && result.data) {
                const { images, description } = result.data;
                console.log(`   [DATA] Found ${images.length} images, Desc length: ${description?.length || 0}`);

                if (images.length === 0 && (!description || description.length < 50)) {
                    console.log(`   [SKIP] No rich content for ${solvexId}.`);
                    continue;
                }

                // Prepare Update
                const existingContent = prop.content || [];
                const updatedContent = [...existingContent];

                if (updatedContent.length === 0) {
                    updatedContent.push({
                        languageCode: 'sr',
                        officialName: prop.name || prop.id,
                        displayName: prop.name || prop.id,
                        shortDescription: (description || "").substring(0, 250),
                        longDescription: description || ""
                    });
                } else {
                    updatedContent[0].longDescription = description || updatedContent[0].longDescription;
                    if (!updatedContent[0].shortDescription) {
                        updatedContent[0].shortDescription = (description || "").substring(0, 250);
                    }
                }

                const newImages = images.map((url, idx) => ({
                    url: url,
                    altText: updatedContent[0]?.officialName || "Hotel Image",
                    category: 'Exterior' as any,
                    sortOrder: idx
                }));

                const { error: updateError } = await supabase
                    .from('properties')
                    .update({
                        content: updatedContent,
                        images: newImages.length > 0 ? newImages : prop.images,
                        updatedAt: new Date().toISOString()
                    })
                    .eq('id', prop.id);

                if (updateError) {
                    console.error(`   [ERROR] Update failed for ${prop.id}:`, updateError);
                    errorCount++;
                } else {
                    console.log(`   [SUCCESS] Updated ${prop.id} with ${images.length} images.`);
                    updatedCount++;
                }
            } else {
                console.error(`   [ERROR] API failed for ${solvexId}:`, result.error);
                errorCount++;
            }

            // Small delay
            await new Promise(r => setTimeout(r, 300));
        }

        console.log("\n=== ENRICHMENT COMPLETE ===");
        console.log(`Total checked: ${properties.length}`);
        console.log(`Successfully updated: ${updatedCount}`);
        console.log(`Errors: ${errorCount}`);
    } catch (e: any) {
        console.error("CRITICAL ERROR IN SCRIPT:", e);
    }
}

enrichSolvexHotels();
