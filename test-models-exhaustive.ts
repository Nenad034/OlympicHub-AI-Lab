const apiKey = "AIzaSyB6au4kyI_Y-e4T6NrKdzgmR7Jaz9lPEho";

const testModel = async (model: string) => {
    console.log(`Testing model: ${model}`);
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: "Hi" }] }]
            })
        });
        const data = await response.json();
        if (response.ok) {
            console.log(`✅ Success with ${model}`);
            return true;
        } else {
            console.log(`❌ Failed with ${model}: ${data.error?.message || response.statusText}`);
            return false;
        }
    } catch (e: any) {
        console.log(`❌ Error with ${model}: ${e.message}`);
        return false;
    }
};

const run = async () => {
    const models = [
        "gemini-1.0-pro",
        "gemini-pro",
        "gemini-1.5-flash",
        "gemini-1.5-pro",
        "text-bison-001"
    ];
    for (const m of models) {
        if (await testModel(m)) break;
    }
};

run();
