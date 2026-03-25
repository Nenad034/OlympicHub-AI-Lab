
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

// Configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL;
// Use SERVICE_ROLE_KEY for background tasks to bypass RLS
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; 
const geminiKey = process.env.VITE_GEMINI_API_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);
const genAI = new GoogleGenerativeAI(geminiKey);
// Use the correct embedding model name from the API list
const embeddingModel = genAI.getGenerativeModel({ model: "models/gemini-embedding-001" });

async function populateEmbeddings() {
    console.log('🧠 Starting Hotel Embedding Synchronization (DIRECT KEY)...');

    // 1. Fetch hotels with missing embeddings for specific regions
    const { data: hotels, error } = await supabase
        .from('properties')
        .select('id, name, content, address, "starRating"')
        .is('embedding', null)
        .or('address->>country.ilike.%Grcka%,address->>country.ilike.%Greece%,address->>country.ilike.%Bugarska%,address->>country.ilike.%Bulgaria%,address->>country.ilike.%Kipar%,address->>country.ilike.%Cyprus%')
        .limit(300); // Process in batches

    if (error) {
        console.error('❌ Error fetching properties:', error);
        return;
    }

    if (!hotels || hotels.length === 0) {
        console.log('✅ No hotels with missing embeddings found.');
        return;
    }

    console.log(`🔍 Found ${hotels.length} hotels to process.`);

    for (const hotel of hotels) {
        try {
            console.log(`Processing: ${hotel.name}...`);
            
            // Construct semantic context
            const city = hotel.address?.city || '';
            const country = hotel.address?.country || '';
            const desc = hotel.content?.description || '';
            const stars = hotel.starRating ? `${hotel.starRating} zvezdice` : '';
            
            const contextText = `Hotel: ${hotel.name}. Zvezdice: ${stars}. Lokacija: ${city}, ${country}. Opis: ${desc}`.substring(0, 3000);

            // Generate Embedding
            const result = await embeddingModel.embedContent(contextText);
            const vector = result.embedding.values;

            // pgvector column is vector(768) - ensure exact dimension
            const finalVector = vector.length > 768 ? vector.slice(0, 768) : vector;

            // Update DB
            const { error: updateError } = await supabase
                .from('properties')
                .update({ embedding: finalVector })
                .eq('id', hotel.id);

            if (updateError) throw updateError;
            
            console.log(`✅ ${hotel.name} updated with vector.`);
            
            // Short delay
            await new Promise(r => setTimeout(r, 600));

        } catch (e) {
            console.error(`❌ Failed to process ${hotel.name}:`, e.message);
        }
    }

    console.log('\n✨ Batch processing complete.');
}

populateEmbeddings();
