import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const geminiKey = process.env.VITE_GEMINI_API_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const genAI = new GoogleGenerativeAI(geminiKey);

async function getEmbedding(text: string): Promise<number[]> {
    const model = genAI.getGenerativeModel({ model: "embedding-001" });
    const result = await model.embedContent(text);
    return result.embedding.values;
}

async function seedEmbeddings() {
  console.log('🚀 Starting Smart Semantic Embedding Seeding...');
  console.log(`🔗 Target: ${supabaseUrl}`);
  
  // 1. Fetch hotels that don't have embeddings yet
  const { data: hotels, error } = await supabase
    .from('properties')
    .select('id, name, propertyType, starRating, address, content')
    .is('embedding', null)
    .limit(50); 

  if (error) {
    console.error('❌ Error fetching hotels:', error.message);
    return;
  }

  if (!hotels || hotels.length === 0) {
    console.log('✅ All hotels in this batch already have embeddings or none found.');
    return;
  }

  console.log(`📦 Processing batch of ${hotels.length} hotels.`);

  for (let i = 0; i < hotels.length; i++) {
    const hotel = hotels[i];
    
    const city = hotel.address?.city || '';
    const country = hotel.address?.country || '';
    const description = hotel.content?.description || '';
    const stars = hotel.starRating ? `${hotel.starRating} stars` : '';
    
    const text = `Hotel: ${hotel.name}. Type: ${hotel.propertyType || 'Accommodation'}. Rating: ${stars}. Location: ${city}, ${country}. Description: ${description}`.trim();

    try {
      process.stdout.write(`⏳ [${i+1}/${hotels.length}] Embedding: ${hotel.name}... `);
      
      let vector = await getEmbedding(text);
      
      // Matryoshka slicing to 768 dimensions for DB compatibility
      if (vector.length > 768) {
          vector = vector.slice(0, 768);
      }
      
      const { error: updateError } = await supabase
        .from('properties')
        .update({ embedding: vector })
        .eq('id', hotel.id);

      if (updateError) throw updateError;
      console.log('✅ Done');
      
      await new Promise(r => setTimeout(r, 500));
      
    } catch (err: any) {
      console.log(`❌ Error: ${err.message}`);
    }
  }

  console.log('⭐ Batch complete!');
}

seedEmbeddings();
