import { GoogleGenerativeAI } from "@google/generative-ai";

const listModels = async () => {
    const apiKey = "AIzaSyB6au4kyI_Y-e4T6NrKdzgmR7Jaz9lPEho";

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const data = await response.json();
        if (data.models) {
            console.log("AVAILABLE MODELS (v1beta):");
            data.models.forEach((m: any) => console.log(` - ${m.name}`));
        } else {
            console.log("No models returned for v1beta:", data);
        }
    } catch (e: any) {
        console.error("v1beta error:", e.message);
    }

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`);
        const data = await response.json();
        if (data.models) {
            console.log("AVAILABLE MODELS (v1):");
            data.models.forEach((m: any) => console.log(` - ${m.name}`));
        } else {
            console.log("No models returned for v1:", data);
        }
    } catch (e: any) {
        console.error("v1 error:", e.message);
    }
};

listModels();
