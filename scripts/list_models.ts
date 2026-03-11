async function list() {
  const key = "AIzaSyB-CiOvVFh5529ynyOLRGbPR8V4OeSwnkI";
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
  
  try {
    const res = await fetch(url);
    const data = await res.json();
    if (data.models) {
      const embedModels = data.models.filter(m => m.supportedGenerationMethods.includes("embedContent"));
      console.log("Supported Embedding Models:");
      embedModels.forEach(m => console.log(`- ${m.name}`));
    } else {
      console.log("No models found:", JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error("Fetch Error:", err);
  }
}

list();
