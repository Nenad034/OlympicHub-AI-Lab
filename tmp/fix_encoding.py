
import sys

file_path = r'd:\PrimeToClick-Refaktorisano\src\pages\PrimeSmartSearch\PrimeSmartSearch.tsx'

with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
    lines = f.readlines()

refined_lines = []
for line in lines:
    if 'MAIN COMPONENT' in line:
        # Check if the previous line was also the header, if so skip it (we will add clean borders)
        if refined_lines and refined_lines[-1].strip().startswith('//') and ('Ã' in refined_lines[-1] or '─' in refined_lines[-1]):
             refined_lines.pop()
        
        refined_lines.append('// ─────────────────────────────────────────────────────────────\n')
        refined_lines.append('// MAIN COMPONENT\n')
        refined_lines.append('// ─────────────────────────────────────────────────────────────\n')
        continue
    
    if line.strip().startswith('//') and ('Ã¢' in line or 'â─' in line):
        continue # Skip mangled horizontal lines
        
    refined_lines.append(line)

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(refined_lines)

print("Fixed.")
