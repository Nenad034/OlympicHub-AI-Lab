import { multiKeyAI } from "../src/services/multiKeyAI";

const testEmbedding = async () => {
    console.log("🧪 TESTING GEMINI EMBEDDING...");
    
    const text = "Hotel Grand Hyatt Dubai, luksuzni smeštaj sa bazenom i pogledom na grad.";
    
    try {
        console.log(`📡 Sending text for embedding: "${text}"`);
        const startTime = Date.now();
        const vector = await multiKeyAI.embedContent(text);
        const duration = Date.now() - startTime;
        
        console.log("✅ SUCCESS!");
        console.log(`⏱️ Duration: ${duration}ms`);
        console.log(`📊 Vector dimensions: ${vector.length}`);
        console.log("🔢 First 5 values:", vector.slice(0, 5));
        
        if (vector.length === 768) {
            console.log("🌟 Correct dimensions for text-embedding-004!");
        } else {
            console.warn(`⚠️ Unexpected dimensions: ${vector.length}`);
        }
        
    } catch (error: any) {
        console.error("❌ EMBEDDING TEST FAILED!");
        console.error("Error message:", error.message);
    }
};

testEmbedding();
