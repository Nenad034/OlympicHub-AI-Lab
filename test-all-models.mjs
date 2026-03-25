
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
dotenv.config();

const key = process.env.VITE_GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(key);

async function testAll() {
    const models = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-pro", "gemini-1.0-pro"];
    
    for (const m of models) {
        try {
            console.log(`Testing ${m}...`);
            const model = genAI.getGenerativeModel({ model: m });
            const result = await model.generateContent("Say 'OK' if you work.");
            console.log(`✅ ${m} works:`, result.response.text());
            break;
        } catch (e) {
            console.log(`❌ ${m} failed:`, e.message);
        }
    }
}

testAll();
