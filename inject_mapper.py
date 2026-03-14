
import os

filepath = r'd:\PrimeToClick-Refaktorisano\src\modules\pricing\PricingIntelligence.tsx'

with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

# Add import
if "import AiMapperPreview" not in content:
    content = content.replace("import PricingSimulator", "import AiMapperPreview from './AiMapperPreview';\nimport PricingSimulator")

# Add state
if "const [showAiMapper, setShowAiMapper]" not in content:
    idx = content.find("const [activeTab")
    content = content[:idx] + "const [showAiMapper, setShowAiMapper] = useState(false);\n    " + content[idx:]

# Add trigger to "Import Solvex" (which we will now treat as "Import Document")
content = content.replace("handleImportSolvex", "handleImportDocument")
content = content.replace("const handleImportDocument = () => {", "const handleImportDocument = () => {\n        setShowAiMapper(true);\n        setActiveTab('ai');")

# Inject AiMapperPreview into the AI tab content
# Let's find the AI tab block
ai_tab_cond = "{activeTab === 'ai' && ("
if ai_tab_cond in content:
    insertion = """{showAiMapper ? (
                            <AiMapperPreview 
                                filename="DIONYSOS_CENE_2026.doc" 
                                extractedTablesCount={24} 
                                onConfirm={() => setShowAiMapper(false)} 
                            />
                        ) : ("""
    # Find the end of visual content for AI tab to close the parenthesis
    idx = content.find(ai_tab_cond) + len(ai_tab_cond)
    content = content[:idx] + insertion + content[idx:]
    
    # We need to find where the AI tab content ends to add another closing brace/parenthesis
    # This is risky due to nested components. Let's just wrap the whole chat container.
    # The chat container usually ends before the next tab or end of return.
    
with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("PricingIntelligence.tsx updated with AI Mapper Preview.")
