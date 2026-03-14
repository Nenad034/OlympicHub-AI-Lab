
import os

filepath = r'd:\PrimeToClick-Refaktorisano\src\modules\pricing\PricingIntelligence.tsx'

with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

# Add import
import_line = "import { RevenueOptimizationAgent } from '../../services/ai/RevenueOptimizationAgent';"
if import_line not in content:
    content = import_line + "\n" + content

# Update handleSendMessage
# I need to find where handleSendMessage is defined and what it does.
# From previous context, it seems to clear input.

old_handle = """    const handleSendMessage = () => {
        if (!input.trim()) return;
        setMessages(prev => [...prev, { role: 'user', content: input }]);
        setInput('');
    };"""

new_handle = """    const handleSendMessage = async () => {
        if (!input.trim()) return;
        const userMsg = input;
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setInput('');
        
        setMessages(prev => [...prev, { role: 'ai', content: 'Analiziram vašu komandu i pripremam optimizaciju cena...' }]);
        
        try {
            const command = await RevenueOptimizationAgent.parseCommand(userMsg);
            
            if (command.action === 'UNKNOWN') {
                setMessages(prev => [...prev, { role: 'ai', content: 'Izvinite, nisam prepoznao akciju. Možete li precizirati (npr. "uvecaj", "smanji" ili "postavi")?' }]);
                return;
            }

            // Simulate applying logic to current "addedItems" or "pricePeriods"
            // For now, let's just show what it FOUND.
            const summary = `Prepoznao sam akciju: **${command.action}**\\n` +
                            `Hotel: **${command.hotel || 'Nije precizirano'}**\\n` +
                            `Soba: **${command.room_type || 'Sve'}**\\n` +
                            `Vrednost: **${command.value}${command.unit === 'PERCENT' ? '%' : '€'}**\\n` +
                            `Period: **${command.date_from || 'Svi'}** do **${command.date_to || 'Svi'}**`;
            
            setMessages(prev => [
                ...prev.filter(m => m.content !== 'Analiziram vašu komandu i pripremam optimizaciju cena...'),
                { role: 'ai', content: summary + "\\n\\nDa li želite da primenim ove izmene na trenutni cenovnik?" }
            ]);
            
        } catch (error) {
            setMessages(prev => [
                ...prev.filter(m => m.content !== 'Analiziram vašu komandu i pripremam optimizaciju cena...'),
                { role: 'ai', content: 'Došlo je do greške prilikom analize komande.' }
            ]);
        }
    };"""

# Use a safer way to replace if the exact text doesn't match due to formatting
if "const handleSendMessage" in content:
    # Try to find the function body
    start_idx = content.find("const handleSendMessage")
    end_idx = content.find("};", start_idx) + 2
    content = content[:start_idx] + new_handle + content[end_idx:]

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("PricingIntelligence.tsx updated with AI optimization agent.")
