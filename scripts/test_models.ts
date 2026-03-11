import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';

dotenv.config();

const geminiKey = process.env.VITE_GEMINI_KEY || process.env.GEMINI_API_KEY || '';

if (!geminiKey) {
  console.error('❌ Missing Gemini API Key');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(geminiKey);

async function listModels() {
  try {
    const models = ["text-embedding-004", "embedding-001"];
    
    for (const modelName of models) {
      // Test v1beta (default)
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.embedContent("test");
        if (result && result.embedding) {
          console.log(`✅ Model "${modelName}" (v1beta) works!`);
        }
      } catch (err: any) {
        console.log(`❌ Model "${modelName}" (v1beta) failed: ${err?.message || 'Unknown error'}`);
      }

      // Test v1 (explicitly in getGenerativeModel)
      try {
        const model = genAI.getGenerativeModel({ model: modelName }, { apiVersion: 'v1' } as any);
        const result = await model.embedContent("test");
        if (result && result.embedding) {
          console.log(`✅ Model "${modelName}" (v1) works!`);
        }
      } catch (err: any) {
        console.log(`❌ Model "${modelName}" (v1) failed: ${err?.message || 'Unknown error'}`);
      }
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

listModels();
