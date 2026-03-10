import React, { useState, useEffect, useRef } from 'react';
import {
    X, Minus, Maximize2, FileText, ChevronDown, List,
    Bold, Italic, Link, Grid, Type, Globe, Search, Plus, Save, Trash2, Copy, Scissors, Clipboard
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';

interface Tab {
    id: string;
    title: string;
    content: string;
}

interface ModernNotepadProps {
    onClose: () => void;
}

export const ModernNotepad: React.FC<ModernNotepadProps> = ({ onClose }) => {
    // State Management
    const [tabs, setTabs] = useState<Tab[]>(() => {
        const saved = localStorage.getItem('prime-notepad-tabs');
        if (saved) {
            try { return JSON.parse(saved); } catch { }
        }
        return [{ id: '1', title: 'Untitled.txt', content: '' }];
    });
    const [activeTabId, setActiveTabId] = useState('1');
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    const [formatMenuOpen, setFormatMenuOpen] = useState(false);

    // Window Management (Drag)
    const [pos, setPos] = useState({ x: 100, y: 100 });
    const isDragging = useRef(false);
    const startMouse = useRef({ x: 0, y: 0 });
    const startPos = useRef({ x: 0, y: 0 });

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setPos({ x: (window.innerWidth / 2) - 425, y: 100 });
        }
    }, []);

    const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];
    const editorRef = useRef<HTMLDivElement>(null);

    // Persistence
    useEffect(() => {
        localStorage.setItem('prime-notepad-tabs', JSON.stringify(tabs));
    }, [tabs]);

    // Sync content when switching tabs
    useEffect(() => {
        if (editorRef.current) {
            editorRef.current.innerHTML = activeTab.content;
        }
    }, [activeTabId]);

    const handleContentUpdate = () => {
        if (editorRef.current) {
            const newContent = editorRef.current.innerHTML;
            setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, content: newContent } : t));
        }
    };

    // Tab Actions
    const addTab = () => {
        const newId = Date.now().toString();
        const newTab = { id: newId, title: `Untitled-${tabs.length + 1}.txt`, content: '' };
        setTabs([...tabs, newTab]);
        setActiveTabId(newId);
    };

    const closeTab = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (tabs.length === 1) {
            onClose();
            return;
        }
        const newTabs = tabs.filter(t => t.id !== id);
        setTabs(newTabs);
        if (activeTabId === id) {
            setActiveTabId(newTabs[0].id);
        }
    };

    const renameTab = (id: string) => {
        const newName = prompt('Enter new filename:', activeTab.title);
        if (newName) {
            setTabs(prev => prev.map(t => t.id === id ? { ...t, title: newName.endsWith('.txt') ? newName : newName + '.txt' } : t));
        }
    };

    // Editor Commands
    const exec = (command: string, value?: string) => {
        document.execCommand(command, false, value);
        handleContentUpdate();
        if (editorRef.current) editorRef.current.focus();
    };

    const insertTable = () => {
        const rows = prompt('Rows:', '3');
        const cols = prompt('Columns:', '3');
        if (rows && cols) {
            let tableHtml = '<table style="border-collapse: collapse; width: 100%; border: 1px solid #444; margin: 10px 0;">';
            for (let i = 0; i < parseInt(rows); i++) {
                tableHtml += '<tr>';
                for (let j = 0; j < parseInt(cols); j++) {
                    tableHtml += '<td style="border: 1px solid #444; padding: 8px; min-width: 50px;">&nbsp;</td>';
                }
                tableHtml += '</tr>';
            }
            tableHtml += '</table><p>&nbsp;</p>';
            exec('insertHTML', tableHtml);
        }
    };

    const handleSearch = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            const range = (window as any).find(searchTerm);
            if (!range) alert('Not found');
        }
    };

    // Drag Logic
    const handleDragStart = (e: React.MouseEvent) => {
        if ((e.target as HTMLElement).closest('button')) return;
        if ((e.target as HTMLElement).closest('.tab-item')) return;
        isDragging.current = true;
        startMouse.current = { x: e.clientX, y: e.clientY };
        startPos.current = { x: pos.x, y: pos.y };
        e.preventDefault();
    };

    useEffect(() => {
        const move = (e: MouseEvent) => {
            if (!isDragging.current) return;
            setPos({
                x: startPos.current.x + (e.clientX - startMouse.current.x),
                y: startPos.current.y + (e.clientY - startMouse.current.y)
            });
        };
        const stop = () => { isDragging.current = false; };
        window.addEventListener('mousemove', move);
        window.addEventListener('mouseup', stop);
        return () => {
            window.removeEventListener('mousemove', move);
            window.removeEventListener('mouseup', stop);
        };
    }, []);

    // Menu Components
    const Dropdown: React.FC<{ items: { label: string; action: () => void; icon?: any }[] }> = ({ items }) => (
        <div style={{
            position: 'absolute', top: '100%', left: 0, background: '#252526',
            border: '1px solid #454545', borderRadius: '4px', zIndex: 100, minWidth: '160px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)', padding: '4px 0'
        }}>
            {items.map((item, i) => (
                <div key={i} onClick={() => { item.action(); setActiveMenu(null); }} style={{
                    padding: '6px 16px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '10px',
                    cursor: 'pointer', transition: '0.1s'
                }} className="menu-item-hover">
                    {item.icon && <item.icon size={14} />}
                    {item.label}
                </div>
            ))}
        </div>
    );

    if (typeof window === 'undefined') return null;

    return createPortal(
        <motion.div
            key="modern-notepad-window"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            style={{
                position: 'fixed', left: pos.x, top: pos.y, width: '850px', height: '650px',
                minWidth: '400px', minHeight: '300px', background: '#1e1e1e', borderRadius: '10px',
                boxShadow: '0 30px 60px rgba(0,0,0,0.8)', border: '1px solid #444',
                display: 'flex', flexDirection: 'column', zIndex: 99999, overflow: 'visible',
                color: '#cccccc', resize: 'both'
            }}
        >
            {/* Top Bar / Title Bar */}
            <div onMouseDown={handleDragStart} style={{
                height: '42px', background: '#2d2d2d', display: 'flex', alignItems: 'center',
                padding: '0 12px', justifyContent: 'space-between', borderBottom: '1px solid #111',
                cursor: 'grab', flexShrink: 0, userSelect: 'none', borderRadius: '10px 10px 0 0'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', height: '100%', overflowX: 'auto', scrollbarWidth: 'none' }}>
                    {tabs.map(tab => (
                        <div key={tab.id} onClick={() => setActiveTabId(tab.id)} onDoubleClick={() => renameTab(tab.id)} style={{
                            background: activeTabId === tab.id ? '#1e1e1e' : 'transparent',
                            padding: '0 16px', height: '34px', display: 'flex', alignItems: 'center', gap: '8px',
                            borderRadius: '6px 6px 0 0', marginTop: '8px', cursor: 'pointer',
                            border: activeTabId === tab.id ? '1px solid #333' : '1px solid transparent', borderBottom: 'none',
                            fontSize: '12px', minWidth: '120px', maxWidth: '200px'
                        }} className="tab-item">
                            <FileText size={14} color={activeTabId === tab.id ? "var(--accent)" : "#858585"} />
                            <span style={{ flex: 1, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{tab.title}</span>
                            <X size={12} onClick={(e) => closeTab(tab.id, e)} style={{ marginLeft: '4px', opacity: 0.5 }} />
                        </div>
                    ))}
                    <button onClick={addTab} style={{ background: 'transparent', border: 'none', color: '#888', padding: '8px', cursor: 'pointer' }}><Plus size={16} /></button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '22px', marginLeft: '20px' }}>
                    <Minus size={18} strokeWidth={1.5} style={{ cursor: 'pointer', opacity: 0.6 }} />
                    <Maximize2 size={16} strokeWidth={1.5} style={{ cursor: 'pointer', opacity: 0.6 }} />
                    <X size={20} strokeWidth={1.5} onClick={onClose} style={{ cursor: 'pointer', color: '#ff5f56' }} />
                </div>
            </div>

            {/* Menu Bar with Real Dropdowns */}
            <div style={{
                height: '32px', display: 'flex', alignItems: 'center', padding: '0 15px', gap: '2px',
                fontSize: '12px', borderBottom: '1px solid #333', background: '#1e1e1e', flexShrink: 0
            }}>
                {[
                    { label: 'File', items: [{ label: 'New Tab', action: addTab, icon: Plus }, { label: 'Save (Local)', action: () => alert('Saved!'), icon: Save }, { label: 'Close All', action: onClose, icon: Trash2 }] },
                    { label: 'Edit', items: [{ label: 'Find', action: () => setSearchOpen(true), icon: Search }, { label: 'Copy', action: () => exec('copy'), icon: Copy }, { label: 'Paste', action: () => exec('paste'), icon: Clipboard }, { label: 'Cut', action: () => exec('cut'), icon: Scissors }] },
                    { label: 'View', items: [{ label: 'Full Screen', action: () => { }, icon: Maximize2 }, { label: 'Reset Zoom', action: () => { }, icon: Type }] },
                    { label: 'Terminal', items: [{ label: 'New Terminal', action: () => alert('Terminal opening...') }] },
                    { label: 'Help', items: [{ label: 'Documentation', action: () => window.open('https://google.com') }, { label: 'Check for Updates', action: () => { } }] }
                ].map(menu => (
                    <div key={menu.label} style={{ position: 'relative' }}>
                        <div
                            onMouseEnter={() => activeMenu && setActiveMenu(menu.label)}
                            onClick={() => setActiveMenu(activeMenu === menu.label ? null : menu.label)}
                            style={{
                                padding: '4px 10px', cursor: 'pointer', borderRadius: '4px',
                                background: activeMenu === menu.label ? '#3e3e42' : 'transparent'
                            }}>
                            {menu.label}
                        </div>
                        {activeMenu === menu.label && <Dropdown items={menu.items} />}
                    </div>
                ))}
            </div>

            {/* Toolbar - Functional */}
            <div style={{
                height: '46px', display: 'flex', alignItems: 'center', padding: '0 15px', gap: '4px',
                borderBottom: '1px solid #333', background: '#1e1e1e', flexShrink: 0
            }}>
                {/* Header Dropdown */}
                <div style={{ position: 'relative' }}>
                    <button
                        onMouseDown={(e) => { e.preventDefault(); setFormatMenuOpen(!formatMenuOpen); }}
                        style={{
                            background: 'transparent', border: 'none', color: '#ccc',
                            display: 'flex', alignItems: 'center', cursor: 'pointer', padding: '6px',
                            gap: '4px'
                        }}>
                        <span style={{ fontSize: '14px', fontWeight: 'bold' }}>Header</span>
                        <ChevronDown size={14} />
                    </button>
                    {formatMenuOpen && (
                        <div style={{
                            position: 'absolute', top: '100%', left: 0, background: '#252526',
                            border: '1px solid #454545', borderRadius: '4px', zIndex: 100, minWidth: '80px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.5)', padding: '4px 0'
                        }}>
                            {['H1', 'H2', 'H3', 'H4'].map(h => (
                                <div
                                    key={h}
                                    onMouseDown={(e) => { e.preventDefault(); exec('formatBlock', h); setFormatMenuOpen(false); }}
                                    style={{ padding: '6px 16px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}
                                    className="menu-item-hover"
                                >
                                    {h}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <div style={{ width: '1px', height: '20px', background: '#333' }} />
                <button onMouseDown={(e) => { e.preventDefault(); exec('bold'); }} style={{ background: 'transparent', border: 'none', color: '#ccc', cursor: 'pointer', padding: '6px' }}><Bold size={18} /></button>
                <button onMouseDown={(e) => { e.preventDefault(); exec('italic'); }} style={{ background: 'transparent', border: 'none', color: '#ccc', cursor: 'pointer', padding: '6px' }}><Italic size={18} /></button>
                <button onMouseDown={(e) => { e.preventDefault(); exec('insertUnorderedList'); }} style={{ background: 'transparent', border: 'none', color: '#ccc', cursor: 'pointer', padding: '6px' }}><List size={18} /></button>
                <div style={{ width: '1px', height: '20px', background: '#333' }} />
                <button onMouseDown={(e) => { e.preventDefault(); insertTable(); }} style={{ background: 'transparent', border: 'none', color: '#ccc', cursor: 'pointer', padding: '6px' }} title="Insert Table"><Grid size={18} /></button>
                <button onMouseDown={(e) => { e.preventDefault(); const url = prompt('URL:'); if (url) exec('createLink', url); }} style={{ background: 'transparent', border: 'none', color: '#ccc', cursor: 'pointer', padding: '6px' }}><Link size={18} /></button>
                <div style={{ flex: 1 }} />

                {searchOpen && (
                    <motion.div initial={{ width: 0 }} animate={{ width: '200px' }} style={{ background: '#333', borderRadius: '4px', display: 'flex', alignItems: 'center', padding: '0 8px' }}>
                        <Search size={14} opacity={0.5} />
                        <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} onKeyDown={handleSearch} autoFocus placeholder="Find..." style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: '12px', outline: 'none', padding: '6px' }} />
                        <X size={14} cursor="pointer" onClick={() => setSearchOpen(false)} />
                    </motion.div>
                )}

                <button onClick={() => setSearchOpen(!searchOpen)} style={{ background: 'transparent', border: 'none', color: '#ccc', cursor: 'pointer', padding: '6px' }}><Search size={18} /></button>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'linear-gradient(45deg, #f09433, #dc2743)', cursor: 'pointer' }} />
            </div>

            {/* Editor Area */}
            <div style={{ flex: 1, background: '#1e1e1e', position: 'relative', overflow: 'hidden' }}>
                <div
                    ref={editorRef}
                    contentEditable
                    onInput={handleContentUpdate}
                    onBlur={handleContentUpdate}
                    suppressContentEditableWarning
                    style={{
                        padding: '40px', outline: 'none', color: '#cccccc', fontSize: '15px', lineHeight: '1.7',
                        fontFamily: 'Consolas, "Courier New", monospace', minHeight: '100%', overflowY: 'auto'
                    }}
                />
            </div>

            {/* Status Bar */}
            <div style={{
                height: '28px', background: '#1e1e1e', display: 'flex', alignItems: 'center',
                padding: '0 15px', fontSize: '11px', gap: '20px', borderTop: '1px solid #333',
                color: '#666', flexShrink: 0, userSelect: 'none'
            }}>
                <span>Ln 1, Col 1</span>
                <span>{activeTab.content.replace(/<[^>]+>/g, '').length} characters</span>
                <div style={{ flex: 1 }} />
                <span>UTF-8</span>
                <span>Windows (CRLF)</span>
                <span>Powered by PrimeClick</span>
            </div>
            <style>{`
                .menu-item-hover:hover { background: #094771; }
                table td { min-width: 50px; border: 1px solid #444; padding: 5px; }
            `}</style>
        </motion.div>,
        document.body
    );
};
