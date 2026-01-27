import { GoogleGenerativeAI } from "@google/generative-ai";

const testConnection = async () => {
    const apiKey = "AIzaSyB6au4kyI_Y-e4T6NrKdzgmR7Jaz9lPEho";
    const genAI = new GoogleGenerativeAI(apiKey);

    console.log("Testing Gemini connection...");

    try {
        // Try flash
        console.log("Attempting to reach gemini-1.5-flash...");
        const flashModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const flashResult = await flashModel.generateContent("Hi");
        console.log("Flash response:", flashResult.response.text());
    } catch (e: any) {
        console.error("Flash failed:", e.message);
    }

    try {
        // Try pro
        console.log("Attempting to reach gemini-1.5-pro...");
        const proModel = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
        const proResult = await proModel.generateContent("Hi");
        console.log("Pro response:", proResult.response.text());
    } catch (e: any) {
        console.error("Pro failed:", e.message);
    }
};

testConnection();
