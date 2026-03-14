
import os

filepath = r'd:\PrimeToClick-Refaktorisano\src\modules\pricing\PricingIntelligence.tsx'

with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

# Add import
if "import PricingSimulator" not in content:
    content = content.replace("import ManualPricelistCreator", "import PricingSimulator from './PricingSimulator';\nimport ManualPricelistCreator")

# Add Tab state
content = content.replace("'manual' | 'product' | 'periods' | 'rules' | 'ai'", "'manual' | 'product' | 'periods' | 'rules' | 'ai' | 'simulation'")

# Add Tab Button
if "simulation" not in content and "setActiveTab(tab" in content:
    # This is tricky because the button line is garbled in my view.
    # I'll try to find a safe place to insert a button.
    # Let's try to find the list of tabs: ['manual', 'product', 'periods', 'rules', 'ai']
    content = content.replace("['manual', 'product', 'periods', 'rules', 'ai']", "['manual', 'product', 'periods', 'rules', 'ai', 'simulation']")

# Add Tab Content
if "{activeTab === 'simulation' && <PricingSimulator />}" not in content:
    insertion_point = "{activeTab === 'ai' && ("
    content = content.replace(insertion_point, f"{{activeTab === 'simulation' && <PricingSimulator />}}\n                        {insertion_point}")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("PricingIntelligence.tsx patched successfully.")
