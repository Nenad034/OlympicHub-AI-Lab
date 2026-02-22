const apiKey = "AIzaSyB6au4kyI_Y-e4T6NrKdzgmR7Jaz9lPEho";

const testModel = async (model: string) => {
    console.log(`Testing model: ${model}`);
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: "Hi" }] }]
            })
        });
        const data = await response.json();
        if (response.ok) {
            console.log(`Success with ${model}:`, data.candidates[0].content.parts[0].text);
        } else {
            console.error(`Failed with ${model}:`, data.error?.message || response.statusText);
        }
    } catch (e: any) {
        console.error(`Error with ${model}:`, e.message);
    }
};

const run = async () => {
    await testModel("gemini-1.5-flash");
    await testModel("gemini-1.5-pro");
    await testModel("gemini-pro");
};

run();
