
import os

filepath = r'd:\PrimeToClick-Refaktorisano\src\modules\pricing\PricingIntelligence.tsx'

with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

# Fix the missing parenthesis from the previous patch
if "onConfirm={() => setShowAiMapper(false)} \n                            />" in content:
    # Need to find the end of the AI tab visual block to close the conditional
    # Searching for the chat input container which is usually at the bottom of the tab
    target = '<div style={{ display: \'flex\', gap: \'12px\' }}><input'
    if target in content and ") : (" in content:
        content = content.replace(target, ') : null}\n                                    ' + target)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("PricingIntelligence.tsx syntax fixed.")
