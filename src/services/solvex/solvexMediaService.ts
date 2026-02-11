import { supabase } from '../../supabaseClient';

export interface SolvexApiHotel {
    id: string;
    il_id: string;
    il_hotelname: string;
    description: string;
    image?: {
        url: string;
    };
    images?: Array<{
        url: string;
    }>;
    notes?: Array<{
        title: string;
        descripion: string;
    }>;
}

/**
 * Syncs hotel media (images and descriptions) from Solvex external JSON API
 * to our Supabase properties table.
 */
export async function syncSolvexMedia() {
    console.log('[Solvex Media Sync] Starting sync from external API...');

    try {
        // Fetch data from Solvex JSON API
        // We use a high limit as suggested by Solvex support
        const response = await fetch('https://b2b.solvex.bg/en/api/?limit=1000000');

        if (!response.ok) {
            throw new Error(`Failed to fetch Solvex API: ${response.statusText}`);
        }

        const hotels: SolvexApiHotel[] = await response.json();
        console.log(`[Solvex Media Sync] Received ${hotels.length} hotels from API.`);

        let processedCount = 0;
        let errorCount = 0;

        // Process in batches to avoid overwhelming Supabase or memory
        const batchSize = 50;
        for (let i = 0; i < hotels.length; i += batchSize) {
            const batch = hotels.slice(i, i + batchSize);

            const upsertData = batch.map(hotel => {
                // Map Solvex data to our property schema
                const solvexKey = hotel.il_id || hotel.id;

                // Extract images
                const images: string[] = [];
                if (hotel.image?.url) images.push(hotel.image.url);
                if (hotel.images) {
                    hotel.images.forEach(img => {
                        if (img.url && !images.includes(img.url)) {
                            images.push(img.url);
                        }
                    });
                }

                // Process notes into amenities or additional content
                const amenities = hotel.notes?.filter(n =>
                    n.title.toLowerCase().includes('facilities') ||
                    n.title.toLowerCase().includes('sport') ||
                    n.title.toLowerCase().includes('children')
                ).map(n => n.descripion) || [];

                return {
                    id: `solvex_${solvexKey}`,
                    provider: 'solvex',
                    name: hotel.il_hotelname || '',
                    images: images,
                    content: {
                        description: hotel.description,
                        notes: hotel.notes
                    },
                    propertyAmenities: amenities,
                    last_sync: new Date().toISOString()
                };
            });

            const { error } = await supabase
                .from('properties')
                .upsert(upsertData, { onConflict: 'id' });

            if (error) {
                console.error(`[Solvex Media Sync] Error upserting batch starting at ${i}:`, error);
                errorCount += batch.length;
            } else {
                processedCount += batch.length;
            }

            // Log progress
            if (processedCount % 500 === 0) {
                console.log(`[Solvex Media Sync] Progress: ${processedCount}/${hotels.length} hotels processed.`);
            }
        }

        console.log(`[Solvex Media Sync] Completed. Processed: ${processedCount}, Errors: ${errorCount}`);
        return { success: true, processed: processedCount, errors: errorCount };

    } catch (error) {
        console.error('[Solvex Media Sync] Global sync error:', error);
        return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
}

/**
 * Enrichment function to use during search results processing
 */
export async function getEnrichedSolvexHotels(hotelKeys: string[]) {
    if (hotelKeys.length === 0) return {};

    const { data, error } = await supabase
        .from('properties')
        .select('id, images, content, propertyAmenities')
        .in('id', hotelKeys.map(key => `solvex_${key}`));

    if (error) {
        console.error('[Solvex Media Sync] Enrichment failed:', error);
        return {};
    }

    const map: Record<string, any> = {};
    (data as any[])?.forEach((item: any) => {
        const originalKey = item.id.replace('solvex_', '');
        map[originalKey] = item;
    });

    return map;
}
