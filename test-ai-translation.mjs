
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Supabase Init
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://fzupyhunlucpjaaxksoi.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Gemini Init
const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY || process.env.VITE_GEMINI_KEY_1);
// Try standard model name for 1.5 Flash
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

async function runTranslationTest() {
    console.log('🚀 AI TRANSLATION SPEED TEST (Solvex Context)\n');

    // 1. Get a real long description from DB
    const { data: hotel } = await supabase
        .from('properties')
        .select('name, content')
        .eq('id', 'solvex_4187') // Diana 2*
        .single();

    if (!hotel || !hotel.content?.description) {
        console.error('❌ Could not find description in DB.');
        return;
    }

    const rawDescription = hotel.content.description;
    console.log(`📌 Source: ${hotel.name}`);
    console.log(`📌 Raw Length: ${rawDescription.length} characters`);
    console.log('--------------------------------------------------');

    const start = Date.now();

    try {
        const prompt = `
            Ti si iskusni turistički agent Olympic Travel-a. 
            Pročitaj sledeći opis hotela i uradi dve stvari:
            1. Kratak prodajni rezime na SRPSKOM (max 25 reči).
            2. 3 ključna "bullet point-a" (prednosti) na SRPSKOM.

            OPIS HOTELA:
            ${rawDescription}
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        const duration = Date.now() - start;

        console.log('✅ AI RESPONSE (SR):');
        console.log(text);
        console.log('--------------------------------------------------');
        console.log(`⏱️ TIME TAKEN: ${duration}ms (${(duration / 1000).toFixed(2)}s)`);
        
        if (duration < 1000) {
            console.log('🏆 BRZINA: "Sub-second" (Ekstremno brzo!)');
        } else if (duration < 2000) {
            console.log('⚡ BRZINA: "Fast" (Dovoljno za pretragu uživo)');
        }

    } catch (error) {
        console.error('❌ Error during AI call:', error);
    }
}

runTranslationTest();
