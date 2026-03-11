import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';

dotenv.config();
dotenv.config({ path: '.env.server' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || ''; 
const geminiKey = process.env.VITE_GEMINI_KEY || process.env.GEMINI_API_KEY || ''; 

if (!supabaseUrl || !supabaseKey || !geminiKey) {
  console.error('❌ Missing credentials! Need SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (or ANON), and VITE_GEMINI_KEY');
  process.exit(1);
}

if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.log('🔑 Using SERVICE_ROLE key (Bypassing RLS)');
} else {
    console.log('⚠️ Using ANON key (RLS might block updates)');
}

const supabase = createClient(supabaseUrl, supabaseKey);
const genAI = new GoogleGenerativeAI(geminiKey);
const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });

async function seedEmbeddings() {
  console.log('🚀 Starting Semantic Embedding Seeding...');
  
  // 1. Fetch hotels that don't have embeddings yet
  const { data: hotels, error } = await supabase
    .from('properties')
    .select('id, name, propertyType, starRating, address, content')
    .is('embedding', null);

  if (error) {
    console.error('❌ Error fetching hotels:', error.message);
    return;
  }

  if (!hotels || hotels.length === 0) {
    console.log('✅ All hotels already have embeddings. Nothing to do!');
    return;
  }

  console.log(`📦 Found ${hotels.length} hotels needing embeddings.`);

  for (let i = 0; i < hotels.length; i++) {
    const hotel = hotels[i];
    
    // Construct rich text description for embedding
    const city = hotel.address?.city || '';
    const country = hotel.address?.country || '';
    const description = hotel.content?.description || '';
    const stars = hotel.starRating ? `${hotel.starRating} stars` : '';
    
    const text = `Hotel: ${hotel.name}. 
Type: ${hotel.propertyType || 'Accommodation'}. 
Rating: ${stars}.
Location: ${city}, ${country}. 
Description: ${description}`.trim();

    try {
      process.stdout.write(`⏳ [${i+1}/${hotels.length}] Embedding: ${hotel.name}... `);
      
      const result = await model.embedContent(text);
      let vector = result.embedding.values;
      
      // Matryoshka slicing to 768 dimensions for DB compatibility
      if (vector.length > 768) {
          vector = vector.slice(0, 768);
      }
      
      const { error: updateError, count: updatedCount } = await supabase
        .from('properties')
        .update({ embedding: vector }, { count: 'exact' })
        .eq('id', hotel.id);

      if (updateError) throw updateError;
      
      if (updatedCount === 0) {
          console.log('⚠️ Warning: Row not found or not updated!');
      } else {
          console.log('✅ Done');
      }
      
      // Delay to respect rate limits (Gemini free tier has RPM limits)
      await new Promise(r => setTimeout(r, 1000));
      
    } catch (err: any) {
      const errMsg = err.message || '';
      console.log(`❌ Error: ${errMsg}`);
      
      if (errMsg.includes('429')) {
        if (errMsg.toLowerCase().includes('quota') && (errMsg.toLowerCase().includes('day') || errMsg.toLowerCase().includes('limit: 1000'))) {
          console.error('\n🛑 DNEVNI LIMIT DOSTIGNUT (1000/dan)!');
          console.error('Besplatni Gemini nalog dozvoljava maksimalno 1000 embedding upita dnevno.');
          console.error('Skripta će se sada zaustaviti. Molimo pokrenite je ponovo sutra da nastavite preostalih 980+ hotela.');
          process.exit(0); 
        }
        
        console.log('⏸️ Privremeni limit (RPM). Čekam 10s pre novog pokušaja...');
        await new Promise(r => setTimeout(r, 10000));
        i--; // Retry this one
      }
    }
  }

  console.log('⭐ Seeding process complete!');
}

seedEmbeddings();
