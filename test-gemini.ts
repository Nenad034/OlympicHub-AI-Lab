import { GoogleGenerativeAI } from "@google/generative-ai";

const testConnection = async () => {
    const apiKey = "AIzaSyB6au4kyI_Y-e4T6NrKdzgmR7Jaz9lPEho";
    const genAI = new GoogleGenerativeAI(apiKey);

    console.log("Testing Gemini connection...");

    try {
        console.log("Attempting to reach gemini-pro...");
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent("Hi");
        console.log("Response:", result.response.text());
    } catch (e: any) {
        console.error("Call failed:", e.message);
    }
};

testConnection();
