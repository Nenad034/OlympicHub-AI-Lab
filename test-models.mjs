
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY || process.env.VITE_GEMINI_KEY_1);

async function listModels() {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent("Hi");
    console.log("Gemini-pro works:", result.response.text());
  } catch (e) {
    console.error("Gemini-pro failed:", e.message);
  }
}

listModels();
