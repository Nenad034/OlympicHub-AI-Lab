import { GoogleGenerativeAI } from '@google/generative-ai';
import * as dotenv from 'dotenv';
dotenv.config();

const geminiKey = process.env.VITE_GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(geminiKey);

async function list() {
    try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${geminiKey}`;
        const res = await fetch(url);
        const data = await res.json();
        console.log(JSON.stringify(data, null, 2));
    } catch (e) {
        console.error(e);
    }
}

list();
