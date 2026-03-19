import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
    Sparkles, 
    X, 
    Maximize2, 
    Minimize2, 
    Search, 
    Settings, 
    Shield, 
    AlertTriangle,
    Zap,
    Send,
    GripVertical
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * =============================================================================
 * INVENTORY AI AGENT - ZERO TOKEN ENGINE
 * =============================================================================
 * 
 * Ovaj agent koristi "Local Intelligence" (regex + keyword mapping) 
 * kako bi izvršavao komande BEZ slanja upita eksternom AI-u (save tokens).
 * 
 * Funkcionalnosti:
 * 1. Ručno pomeranje (Dragging)
 * 2. Promena veličine (Resizing) u svim pravcima
 * 3. Prepoznavanje komandi: "stop", "allotman", "hotel name", "destination"
 */

interface InventoryAIAgentProps {
    onAction: (action: string, params: any) => void;
    data?: any;
}

export const InventoryAIAgent: React.FC<InventoryAIAgentProps> = ({ onAction, data }) => {
    // Window State
    const [isOpen, setIsOpen] = useState(false);
    const [position, setPosition] = useState({ x: window.innerWidth - 450, y: window.innerHeight - 600 });
    const [size, setSize] = useState({ width: 380, height: 500 });
    const [query, setQuery] = useState('');
    const [messages, setMessages] = useState<Array<{ role: 'ai' | 'user'; text: string; action?: any }>>([
        { role: 'ai', text: 'Zdravo! Ja sam vaš Inventory AI kopilot. Kako mogu da pomognem sa allotmanima?' }
    ]);

    // Resizing State
    const [isResizing, setIsResizing] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    
    // Refs
    const agentRef = useRef<HTMLDivElement>(null);
    const dragOffset = useRef({ x: 0, y: 0 });

    // Handle Dragging
    const handleMouseDown = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('.agent-header')) {
            setIsDragging(true);
            dragOffset.current = {
                x: e.clientX - position.x,
                y: e.clientY - position.y
            };
        }
    };

    // Handle Resize Inits
    const initResize = (dir: string) => (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        setIsResizing(dir);
    };

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (isDragging) {
            setPosition({
                x: e.clientX - dragOffset.current.x,
                y: e.clientY - dragOffset.current.y
            });
        }

        if (isResizing) {
            const minW = 300;
            const minH = 300;
            
            if (isResizing.includes('right')) {
                setSize(prev => ({ ...prev, width: Math.max(minW, e.clientX - position.x) }));
            }
            if (isResizing.includes('bottom')) {
                setSize(prev => ({ ...prev, height: Math.max(minH, e.clientY - position.y) }));
            }
            if (isResizing.includes('left')) {
                const deltaX = position.x - e.clientX;
                if (size.width + deltaX > minW) {
                    setPosition(prev => ({ ...prev, x: e.clientX }));
                    setSize(prev => ({ ...prev, width: prev.width + deltaX }));
                }
            }
            if (isResizing.includes('top')) {
                const deltaY = position.y - e.clientY;
                if (size.height + deltaY > minH) {
                    setPosition(prev => ({ ...prev, y: e.clientY }));
                    setSize(prev => ({ ...prev, height: prev.height + deltaY }));
                }
            }
        }
    }, [isDragging, isResizing, position, size]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
        setIsResizing(null);
    }, []);

    useEffect(() => {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [handleMouseMove, handleMouseUp]);

    /**
     * LOCAL INTELLIGENCE ENGINE (Zero Tokens)
     */
    const processCommand = (input: string) => {
        const text = input.toLowerCase();
        setMessages(prev => [...prev, { role: 'user', text: input }]);

        // Logic check (Pre-defined matches)
        
        // --- DATE PARSING LOGIC (STAY PERIOD) ---
        const monthsMap: Record<string, number> = {
            'janu': 0, 'febru': 1, 'mart': 2, 'april': 3, 'maj': 4, 'jun': 5,
            'jul': 6, 'avgust': 7, 'septem': 8, 'oktob': 9, 'novem': 10, 'decem': 11
        };

        let dateFound = false;

        // Pattern 1: Month keyword (e.g., "za jun", "u avgustu")
        for (const [monthKey, monthIdx] of Object.entries(monthsMap)) {
            if (text.includes(monthKey)) {
                const year = 2026; // Default to 2026 as per mockup
                const startDate = new Date(year, monthIdx, 1);
                const endDate = new Date(year, monthIdx + 1, 0);
                
                onAction('FILTER_DATE_RANGE', { 
                    from: startDate.toISOString().split('T')[0], 
                    to: endDate.toISOString().split('T')[0] 
                });
                
                setMessages(prev => [...prev, { 
                    role: 'ai', 
                    text: `Jasno. Postavljam period boravka za ceo ${monthKey.charAt(0).toUpperCase() + monthKey.slice(1)} ${year}.` 
                }]);
                dateFound = true;
                break;
            }
        }

        // Pattern 2: "od [day]. [month]" (e.g., "od 15. avgusta")
        if (!dateFound && (text.includes('od ') || text.includes('posle '))) {
            const match = text.match(/(\d{1,2})[\.\s]+([a-zčćšđž]{3,})/i);
            if (match) {
                const day = parseInt(match[1]);
                const monthName = match[2].substring(0, 4).toLowerCase();
                
                for (const [monthKey, monthIdx] of Object.entries(monthsMap)) {
                    if (monthName.startsWith(monthKey)) {
                        const from = new Date(2026, monthIdx, day).toISOString().split('T')[0];
                        const to = '2026-08-31'; // Default until end of season
                        onAction('FILTER_DATE_RANGE', { from, to });
                        setMessages(prev => [...prev, { role: 'ai', text: `U redu. Filtriram prodaju počevši od ${day}. ${monthKey}...` }]);
                        dateFound = true;
                        break;
                    }
                }
            }
        }

        if (dateFound) {
            setQuery('');
            return;
        }

        // Standard command checks
        if (text.includes('stop') || text.includes('zatvori')) {
            const hotelName = text.replace(/stop|zatvori|prodaju|za/g, '').trim();
            onAction('FILTER_STOP', { hotel: hotelName });
            setMessages(prev => [...prev, { 
                role: 'ai', 
                text: `Razumem. Filtriram hotele za "Stop Sale" akciju. Vidim da želite da zatvorite prodaju za: ${hotelName || 'kritične objekte'}.` 
            }]);
        } 
        else if (text.includes('slobodn') || text.includes('free') || text.includes('kapacitet')) {
            onAction('FILTER_FREE', {});
            setMessages(prev => [...prev, { role: 'ai', text: 'Prikazujem slobodne kapacitete za odabrani period.' }]);
        }
        else if (text.includes('osvez') || text.includes('refresh') || text.includes('reset')) {
            onAction('RESET_FILTERS', {});
            setMessages(prev => [...prev, { role: 'ai', text: 'Resetovao sam sve filtere na početno stanje.' }]);
        }
        else {
            setMessages(prev => [...prev, { 
                role: 'ai', 
                text: 'Prepoznao sam vaš upit. Lokalni motor pretražuje inventar za vas...',
                action: () => onAction('SEARCH', { query: input })
            }]);
            onAction('SEARCH', { query: input });
        }
        
        setQuery('');
    };

    return (
        <>
            {/* Toggle Button */}
            {!isOpen && (
                <button className="agent-trigger" onClick={() => setIsOpen(true)}>
                    <Sparkles size={20} />
                    <span>AI Co-Pilot</span>
                </button>
            )}

            <AnimatePresence>
                {isOpen && (
                    <div 
                        ref={agentRef}
                        className="agent-window neon-border"
                        style={{
                            left: position.x,
                            top: position.y,
                            width: size.width,
                            height: size.height
                        }}
                    >
                        {/* Resize Handles */}
                        <div className="resizer top" onMouseDown={initResize('top')}></div>
                        <div className="resizer bottom" onMouseDown={initResize('bottom')}></div>
                        <div className="resizer left" onMouseDown={initResize('left')}></div>
                        <div className="resizer right" onMouseDown={initResize('right')}></div>
                        <div className="resizer top-left" onMouseDown={initResize('top-left')}></div>
                        <div className="resizer top-right" onMouseDown={initResize('top-right')}></div>
                        <div className="resizer bottom-left" onMouseDown={initResize('bottom-left')}></div>
                        <div className="resizer bottom-right" onMouseDown={initResize('bottom-right')}></div>

                        {/* Header (Drag area) */}
                        <div className="agent-header" onMouseDown={handleMouseDown}>
                            <div className="header-info">
                                <Zap size={16} className="zap-icon" />
                                <span>Inventory Specialist (v5)</span>
                            </div>
                            <div className="header-actions">
                                <button onClick={() => setPosition({ x: 20, y: 20 })} title="Snap to corner"><Maximize2 size={14}/></button>
                                <button onClick={() => setIsOpen(false)}><X size={16}/></button>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="agent-content">
                            {messages.map((m, i) => (
                                <div key={i} className={`msg-bubble ${m.role}`}>
                                    {m.text}
                                </div>
                            ))}
                        </div>

                        {/* Input Area */}
                        <div className="agent-input-container">
                            <input 
                                type="text" 
                                placeholder="Pitaj me (npr: 'Set stop Jul Grcka')..." 
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && processCommand(query)}
                            />
                            <button onClick={() => processCommand(query)}><Send size={18}/></button>
                        </div>

                        {/* Drag Indicator */}
                        <div className="drag-handle-visual">
                             <GripVertical size={12} />
                        </div>
                    </div>
                )}
            </AnimatePresence>

            <style>{`
                .agent-trigger {
                    position: fixed;
                    right: 30px;
                    bottom: 30px;
                    background: linear-gradient(135deg, #10b981, #059669);
                    color: white;
                    border: none;
                    padding: 12px 20px;
                    border-radius: 30px;
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    box-shadow: 0 10px 30px rgba(16, 185, 129, 0.3);
                    cursor: pointer;
                    z-index: 1000;
                    font-weight: 600;
                }

                .agent-window {
                    position: fixed;
                    background: rgba(15, 23, 42, 0.95);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 16px;
                    display: flex;
                    flex-direction: column;
                    overflow: visible;
                    box-shadow: 0 20px 50px rgba(0,0,0,0.5);
                    z-index: 1001;
                }

                .neon-border {
                    box-shadow: 0 0 1px rgba(16, 185, 129, 0.5),
                                0 0 5px rgba(16, 185, 129, 0.3);
                }

                .agent-header {
                    padding: 12px 16px;
                    background: rgba(255,255,255,0.03);
                    border-bottom: 1px solid rgba(255,255,255,0.05);
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    cursor: grab;
                    user-select: none;
                }
                .agent-header:active { cursor: grabbing; }

                .header-info { display: flex; align-items: center; gap: 8px; font-weight: 500; font-size: 13px; color: #10b981; }
                .zap-icon { color: #f59e0b; }

                .agent-content {
                    flex: 1;
                    overflow-y: auto;
                    padding: 16px;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                }

                .msg-bubble { 
                    max-width: 85%; 
                    padding: 10px 14px; 
                    border-radius: 12px; 
                    font-size: 13px; 
                    line-height: 1.5; 
                }
                .msg-bubble.ai { background: rgba(255,255,255,0.05); color: #e2e8f0; align-self: flex-start; border-bottom-left-radius: 2px; }
                .msg-bubble.user { background: #10b981; color: white; align-self: flex-end; border-bottom-right-radius: 2px; }

                .agent-input-container {
                    padding: 16px;
                    display: flex;
                    gap: 10px;
                    border-top: 1px solid rgba(255,255,255,0.05);
                }

                .agent-input-container input {
                    flex: 1;
                    background: rgba(0,0,0,0.2);
                    border: 1px solid rgba(255,255,255,0.1);
                    border-radius: 8px;
                    padding: 8px 12px;
                    color: white;
                    font-size: 13px;
                }

                .agent-input-container button {
                    background: #10b981;
                    color: white;
                    border: none;
                    width: 38px;
                    height: 38px;
                    border-radius: 8px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                }

                /* Resizers */
                .resizer { position: absolute; }
                .resizer.top { top: -5px; height: 10px; left: 10px; right: 10px; cursor: ns-resize; }
                .resizer.bottom { bottom: -5px; height: 10px; left: 10px; right: 10px; cursor: ns-resize; }
                .resizer.left { left: -5px; width: 10px; top: 10px; bottom: 10px; cursor: ew-resize; }
                .resizer.right { right: -5px; width: 10px; top: 10px; bottom: 10px; cursor: ew-resize; }
                
                .resizer.top-left { top: -5px; left: -5px; width: 15px; height: 15px; cursor: nwse-resize; }
                .resizer.top-right { top: -5px; right: -5px; width: 15px; height: 15px; cursor: nesw-resize; }
                .resizer.bottom-left { bottom: -5px; left: -5px; width: 15px; height: 15px; cursor: nesw-resize; }
                .resizer.bottom-right { bottom: -5px; right: -5px; width: 15px; height: 15px; cursor: nwse-resize; }

                .drag-handle-visual {
                    position: absolute;
                    left: 2px;
                    top: 15px;
                    color: rgba(255,255,255,0.2);
                }
            `}</style>
        </>
    );
};
