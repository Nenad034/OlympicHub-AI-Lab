import React, { useState, useEffect, useRef } from 'react';
import {
    X, Minus, Maximize2, FileText, ChevronDown, List,
    Bold, Italic, Link, Grid, Type, Globe, Search, Plus, Save, Trash2, Copy, Scissors, Clipboard,
    Download, Share2, Mail, MessageSquare, Send, Phone, MessageCircle, FileDown, FileSpreadsheet, FileCode, Printer, Image as ImageIcon, Paperclip, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useThemeStore, useMailStore, useAppStore, useOmniChannelStore } from '../../stores';
import { useNotificationCenter } from '../../hooks/useNotificationCenter';

interface Block {
    id: string;
    content: string;
    color: string;
}

interface Tab {
    id: string;
    title: string;
    content: string;
    mode: 'document' | 'blocks';
    blocks: Block[];
}

interface ModernNotepadProps {
    onClose: () => void;
}

const PASTEL_COLORS = [
    { name: 'Peach', color: '#FFB7B2' },
    { name: 'Orange', color: '#FFDAC1' },
    { name: 'Limon', color: '#E2F0CB' },
    { name: 'Mint', color: '#B5EAD7' },
    { name: 'Sky', color: '#C7CEEA' },
    { name: 'Lila', color: '#F3E5F5' },
    { name: 'White', color: '#ffffff' }
];

export const ModernNotepad: React.FC<ModernNotepadProps> = ({ onClose }) => {
    const { theme } = useThemeStore();
    const { setDraftToCompose } = useMailStore();
    const { setChatOpen, setChatContext } = useAppStore();
    const { sendMessage } = useOmniChannelStore();
    const { notify } = useNotificationCenter();
    const navigate = useNavigate();
    const isDark = theme === 'navy';

    // State Management
    const [tabs, setTabs] = useState<Tab[]>(() => {
        const saved = localStorage.getItem('prime-notepad-tabs');
        if (saved) {
            try { 
                const parsed = JSON.parse(saved);
                return parsed.map((t: any) => ({
                    ...t,
                    mode: t.mode || 'document',
                    blocks: t.blocks || []
                }));
            } catch { }
        }
        return [{ id: '1', title: 'Untitled.txt', content: '', mode: 'document', blocks: [] }];
    });
    const [activeTabId, setActiveTabId] = useState('1');
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeMenu, setActiveMenu] = useState<string | null>(null);
    const [formatMenuOpen, setFormatMenuOpen] = useState(false);
    const [pageSize, setPageSize] = useState<'continuous' | 'a4' | 'letter'>('continuous');
    const [isMoving, setIsMoving] = useState(false);

    // Window Management (Drag)
    const [pos, setPos] = useState({ x: 100, y: 100 });
    const [size, setSize] = useState({ width: 850, height: 650 });
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

    const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Persistence with debounce to avoid lag
    useEffect(() => {
        if (saveTimeout.current) clearTimeout(saveTimeout.current);
        saveTimeout.current = setTimeout(() => {
            localStorage.setItem('prime-notepad-tabs', JSON.stringify(tabs));
        }, 1000);
        return () => { if (saveTimeout.current) clearTimeout(saveTimeout.current); };
    }, [tabs]);

    // Sync content when switching tabs
    useEffect(() => {
        if (activeTab.mode === 'document' && editorRef.current) {
            editorRef.current.innerHTML = activeTab.content;
        }
    }, [activeTabId, activeTab.mode]);

    const handleContentUpdate = () => {
        if (activeTab.mode === 'document' && editorRef.current) {
            const newContent = editorRef.current.innerHTML;
            // Debounce state update to prevent typing lag
            if (saveTimeout.current) clearTimeout(saveTimeout.current);
            saveTimeout.current = setTimeout(() => {
                setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, content: newContent } : t));
            }, 500);
        }
    };

    // Tab Actions
    const addTab = () => {
        const newId = Date.now().toString();
        const newTab: Tab = { id: newId, title: `Untitled-${tabs.length + 1}.txt`, content: '', mode: 'document', blocks: [] };
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

    const blockRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

    // Blocks Actions
    const addBlock = () => {
        const newBlock = { id: Date.now().toString(), content: '', color: '#ffffff' };
        setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, blocks: [...t.blocks, newBlock] } : t));
    };

    const updateBlock = (blockId: string, content: string) => {
        setTabs(prev => prev.map(t => t.id === activeTabId ? {
            ...t,
            blocks: t.blocks.map(b => b.id === blockId ? { ...b, content } : b)
        } : t));
    };

    const clearBlock = (blockId: string) => {
        if (confirm('Da li ste sigurni da želite da obrišete sav sadržaj ovog bloka?')) {
            updateBlock(blockId, '');
        }
    };

    const blockContentRefs = useRef<{ [key: string]: string }>({});

    const colorBlock = (blockId: string, color: string) => {
        setTabs(prev => prev.map(t => t.id === activeTabId ? {
            ...t,
            blocks: t.blocks.map(b => b.id === blockId ? { ...b, color } : b)
        } : t));
    };

    const removeBlock = (blockId: string) => {
        setTabs(prev => prev.map(t => t.id === activeTabId ? {
            ...t,
            blocks: t.blocks.filter(b => b.id !== blockId)
        } : t));
    };

    const switchMode = (mode: 'document' | 'blocks') => {
        setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, mode } : t));
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

    const exportAs = (format: 'word' | 'excel' | 'pdf' | 'html' | 'google-docs' | 'google-sheets') => {
        let content = '';
        let htmlContent = '';
        
        if (activeTab.mode === 'document') {
            content = activeTab.content.replace(/<[^>]+>/g, '');
            htmlContent = activeTab.content;
        } else {
            content = activeTab.blocks.map(b => b.content).join('\n\n');
            htmlContent = `
                <div style="font-family: sans-serif; padding: 40px;">
                    ${activeTab.blocks.map(b => `
                        <div style="background-color: ${b.color}; padding: 25px; border-radius: 12px; margin-bottom: 25px; border: 1px solid #ddd; color: #333;">
                            <div style="white-space: pre-wrap;">${b.content}</div>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        const fileName = activeTab.title.split('.')[0] || 'Note';

        if (format === 'html') {
            const blob = new Blob([htmlContent], { type: 'text/html' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `${fileName}.html`;
            link.click();
        } else if (format === 'word') {
            const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'></head><body>";
            const footer = "</body></html>";
            const source = header + htmlContent + footer;
            const blob = new Blob(['\ufeff', source], { type: 'application/msword' });
            const url = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(source);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${fileName}.doc`;
            link.click();
        } else if (format === 'excel') {
            const template = `<html><head><meta charset="utf-8"></head><body><table><tr><td>${content.replace(/\n/g, '</td></tr><tr><td>')}</td></tr></table></body></html>`;
            const blob = new Blob([template], { type: 'application/vnd.ms-excel' });
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `${fileName}.xls`;
            link.click();
        } else if (format === 'pdf') {
            const printWindow = window.open('', '_blank');
            if (printWindow) {
                printWindow.document.write(`<html><head><title>${fileName}</title></head><body>${htmlContent}</body></html>`);
                printWindow.document.close();
                printWindow.print();
            }
        } else if (format === 'google-docs' || format === 'google-sheets') {
            // Google Docs/Sheets usually requires upload, but we can offer the compatible file
            notify('system', 'info', 'Google Integration', `Pripremljen i preuzet kompatibilan fajl za Google ${format === 'google-docs' ? 'Docs' : 'Sheets'}. Možete ga prevući u svoj Google Disk.`);
            format === 'google-docs' ? exportAs('word') : exportAs('excel');
        }
        
        setActiveMenu(null);
    };

    const insertMedia = (type: 'image' | 'file') => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = type === 'image' ? 'image/*' : '*/*';
        input.onchange = (e: any) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (re) => {
                    const result = re.target?.result as string;
                    if (type === 'image') {
                        if (activeTab.mode === 'document') {
                            exec('insertHTML', `<img src="${result}" style="max-width: 100%; border-radius: 8px; margin: 10px 0;" />`);
                        } else {
                            const blockId = prompt('U koji blok ubaciti sliku? (1, 2, 3...)', '1');
                            if (blockId) {
                                const index = parseInt(blockId) - 1;
                                if (activeTab.blocks[index]) {
                                    const imgHtml = `<img src="${result}" style="max-width: 100%; border-radius: 8px; margin: 10px 0;" />`;
                                    const currentContent = activeTab.blocks[index].content;
                                    updateBlock(activeTab.blocks[index].id, currentContent + imgHtml);
                                }
                            }
                        }
                    } else {
                        const link = `<a href="${result}" download="${file.name}" style="color: var(--accent); text-decoration: underline;">Dokument: ${file.name}</a>`;
                        exec('insertHTML', link);
                    }
                };
                reader.readAsDataURL(file);
            }
        };
        input.click();
        setActiveMenu(null);
    };

    const saveToFile = () => {
        let textContent = '';
        if (activeTab.mode === 'document') {
            textContent = activeTab.content.replace(/<br>/g, '\n').replace(/<[^>]+>/g, '');
        } else {
            // Clean text for file export
            textContent = activeTab.blocks.map((b, i) => `--- BLOCK ${i+1} ---\n${b.content}`).join('\n\n');
        }

        const element = document.createElement('a');
        const file = new Blob([textContent], { type: 'text/plain' });
        element.href = URL.createObjectURL(file);
        element.download = activeTab.title.endsWith('.txt') ? activeTab.title : `${activeTab.title}.txt`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    };

    const shareContent = (platform: 'email' | 'whatsapp' | 'viber' | 'telegram' | 'chat') => {
        let text = '';
        let htmlBody = '';

        if (activeTab.mode === 'document') {
            text = activeTab.content.replace(/<br>/g, '\n').replace(/<[^>]+>/g, '');
            htmlBody = activeTab.content;
        } else {
            // Styled HTML for Prime Mail - Ensuring images are handled correctly
            htmlBody = `
                <div style="font-family: sans-serif; padding: 20px; background: #f8fafc;">
                    ${activeTab.blocks.map(block => `
                        <div style="background-color: ${block.color}; padding: 30px; border-radius: 16px; margin-bottom: 25px; border: 1px solid rgba(0,0,0,0.08); color: #334155; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
                            <div style="font-size: 15px; line-height: 1.6;">${block.content}</div>
                        </div>
                    `).join('')}
                </div>`;
            
            // Clean text for messenger channels
            text = activeTab.blocks.map(b => {
                const temp = document.createElement('div');
                temp.innerHTML = b.content;
                return temp.innerText;
            }).join('\n---\n');
        }
        
        if (platform === 'email') {
            setDraftToCompose({ 
                subject: activeTab.title, 
                body: htmlBody 
            });
            notify('mail', 'info', 'Prime Mail Integracija', 'Beleška sa obojenim blokovima je prebačena u editor.');
            navigate('/mail');
            onClose();
            return;
        }

        if (platform === 'chat') {
            setChatContext({
                type: 'general',
                initialMessage: `**SHARE PROLOGUE:** Prosljeđujem vam belešku: "${activeTab.title}"\n\n${text}`,
                requestedPersona: 'specialist'
            });
            setChatOpen(true);
            notify('system', 'success', 'Internal Share', 'Beleška je prosleđena Prime AI Asistentu.');
            onClose();
            return;
        }

        // OmniChannel integration for messages
        notify('system', 'success', `Prime OmniChannel - ${platform.toUpperCase()}`, `Prosleđivanje beleške kroz interni kanal na ${platform}...`);
        
        // Track in store
        sendMessage(platform as any, 'System Route', `Note: ${activeTab.title}\n\n${text}`);

        const encodedText = encodeURIComponent(text);
        const urls = {
            whatsapp: `https://wa.me/?text=${encodedText}`,
            viber: `viber://forward?text=${encodedText}`,
            telegram: `https://t.me/share/url?url=&text=${encodedText}`
        };

        // Open in new window as fallback/gateway
        setTimeout(() => {
            const url = urls[platform as keyof (typeof urls)];
            if (url) window.open(url, '_blank');
        }, 800);
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
        setIsMoving(true);
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
        const stop = () => { 
            isDragging.current = false; 
            setIsMoving(false);
        };
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
                    cursor: 'pointer', transition: '0.1s',
                    color: '#cccccc'
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
                position: 'fixed', left: pos.x, top: pos.y, 
                width: size.width, height: size.height,
                minWidth: '400px', minHeight: '300px', 
                background: isDark ? '#1e1e1e' : '#ffffff', 
                borderRadius: '10px',
                boxShadow: isDark ? '0 30px 60px rgba(0,0,0,0.8)' : '0 15px 40px rgba(0,0,0,0.15)', 
                border: isDark ? '1px solid #444' : '1px solid #e2e8f0',
                display: 'flex', flexDirection: 'column', zIndex: 99999, 
                overflow: 'hidden',
                color: isDark ? '#cccccc' : '#334155', 
                resize: 'both'
            }}
        >
            {/* Top Bar / Title Bar */}
            <div onMouseDown={handleDragStart} style={{
                height: '42px', 
                background: isDark ? '#2d2d2d' : '#f8fafc', 
                display: 'flex', alignItems: 'center',
                padding: '0 12px', justifyContent: 'space-between', 
                borderBottom: isDark ? '1px solid #111' : '1px solid #e2e8f0',
                cursor: 'grab', flexShrink: 0, userSelect: 'none', borderRadius: '10px 10px 0 0'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', height: '100%', overflowX: 'auto', scrollbarWidth: 'none' }}>
                    {tabs.map(tab => (
                        <div key={tab.id} onClick={() => setActiveTabId(tab.id)} style={{
                            background: activeTabId === tab.id ? (isDark ? '#1e1e1e' : '#ffffff') : 'transparent',
                            padding: '0 12px', height: '34px', display: 'flex', alignItems: 'center', gap: '8px',
                            borderRadius: '6px 6px 0 0', marginTop: '8px', cursor: 'pointer',
                            border: activeTabId === tab.id ? (isDark ? '1px solid #333' : '1px solid #e2e8f0') : '1px solid transparent', 
                            borderBottom: 'none',
                            fontSize: '12px', minWidth: '140px', maxWidth: '220px'
                        }} className="tab-item">
                            <FileText size={14} color={activeTabId === tab.id ? "var(--accent)" : "#858585"} />
                            {activeTabId === tab.id ? (
                                <input 
                                    value={tab.title}
                                    onChange={(e) => {
                                        const newTitle = e.target.value;
                                        setTabs(prev => prev.map(t => t.id === tab.id ? { ...t, title: newTitle } : t));
                                    }}
                                    onClick={(e) => e.stopPropagation()}
                                    style={{ 
                                        background: 'transparent', border: 'none', 
                                        color: isDark ? '#fff' : 'var(--accent)', 
                                        fontSize: '12px', width: '100%', outline: 'none',
                                        fontWeight: '700'
                                    }}
                                />
                            ) : (
                                <span style={{ flex: 1, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{tab.title}</span>
                            )}
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
                fontSize: '12px', 
                borderBottom: isDark ? '1px solid #333' : '1px solid #e2e8f0', 
                background: isDark ? '#1e1e1e' : '#ffffff', 
                flexShrink: 0
            }}>
                {[
                    { label: 'File', items: [
                        { label: 'New Tab', action: addTab, icon: Plus }, 
                        { label: 'Export to Word', action: () => exportAs('word'), icon: FileText },
                        { label: 'Export to Excel', action: () => exportAs('excel'), icon: FileSpreadsheet },
                        { label: 'Export to PDF', action: () => exportAs('pdf'), icon: Printer },
                        { label: 'Export to HTML', action: () => exportAs('html'), icon: FileCode },
                        { label: 'Google Docs', action: () => exportAs('google-docs'), icon: Globe },
                        { label: 'Google Sheets', action: () => exportAs('google-sheets'), icon: FileSpreadsheet },
                        { label: 'Download (.txt)', action: saveToFile, icon: Download },
                        { label: 'Save (Sync)', action: () => alert('Sincronizovano!'), icon: Save },
                        { label: 'Close All', action: onClose, icon: Trash2 }
                    ] },
                    { label: 'Edit', items: [
                        { label: 'Find', opacity: 1, action: () => setSearchOpen(true), icon: Search }, 
                        { label: 'Insert Image', action: () => insertMedia('image'), icon: ImageIcon },
                        { label: 'Insert File', action: () => insertMedia('file'), icon: Paperclip },
                        { label: 'Copy', action: () => exec('copy'), icon: Copy }, 
                        { label: 'Paste', action: () => exec('paste'), icon: Clipboard }, 
                        { label: 'Cut', action: () => exec('cut'), icon: Scissors }
                    ] },
                    { label: 'Share', items: [
                        { label: 'Prime Mail', action: () => shareContent('email'), icon: Mail },
                        { label: 'AI Chat', action: () => shareContent('chat'), icon: MessageCircle },
                        { label: 'WhatsApp', action: () => shareContent('whatsapp'), icon: MessageSquare },
                        { label: 'Viber', action: () => shareContent('viber'), icon: Phone },
                        { label: 'Telegram', action: () => shareContent('telegram'), icon: Send }
                    ] },
                    { label: 'View', items: [
                        { label: 'Classic Document', action: () => { switchMode('document'); setActiveMenu(null); }, icon: FileText },
                        { label: 'Blocks Layout', action: () => { switchMode('blocks'); setActiveMenu(null); }, icon: Grid },
                        { label: 'Continuous', action: () => { setPageSize('continuous'); setActiveMenu(null); }, icon: Type },
                        { label: 'A4 Format', action: () => { setPageSize('a4'); setActiveMenu(null); }, icon: Grid },
                        { label: 'Letter Format', action: () => { setPageSize('letter'); setActiveMenu(null); }, icon: FileText },
                        { label: 'Full Screen', action: () => { setActiveMenu(null); }, icon: Maximize2 }
                    ] },
                    { label: 'Help', items: [{ label: 'Documentation', action: () => window.open('https://google.com') }, { label: 'Check for Updates', action: () => { } }] }
                ].map(menu => (
                    <div key={menu.label} style={{ position: 'relative' }}>
                        <div
                            onMouseEnter={() => activeMenu && setActiveMenu(menu.label)}
                            onClick={() => setActiveMenu(activeMenu === menu.label ? null : menu.label)}
                            className="top-menu-item"
                            style={{
                                padding: '4px 10px', cursor: 'pointer', borderRadius: '4px',
                                background: activeMenu === menu.label ? '#3e3e42' : 'transparent',
                                color: activeMenu === menu.label ? '#ffffff' : (isDark ? '#cccccc' : '#334155'),
                                transition: 'all 0.2s'
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
                borderBottom: isDark ? '1px solid #333' : '1px solid #e2e8f0', 
                background: isDark ? '#1e1e1e' : '#ffffff', 
                flexShrink: 0
            }}>
                {/* Header Dropdown */}
                <div style={{ position: 'relative' }}>
                    <button
                        onMouseDown={(e) => { e.preventDefault(); setFormatMenuOpen(!formatMenuOpen); }}
                        style={{
                            background: 'transparent', border: 'none', 
                            color: isDark ? '#ccc' : '#64748b',
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
                <div style={{ width: '1px', height: '20px', background: isDark ? '#333' : '#e2e8f0' }} />
                <button onMouseDown={(e) => { e.preventDefault(); exec('bold'); }} style={{ background: 'transparent', border: 'none', color: isDark ? '#ccc' : '#64748b', cursor: 'pointer', padding: '6px' }}><Bold size={18} /></button>
                <button onMouseDown={(e) => { e.preventDefault(); exec('italic'); }} style={{ background: 'transparent', border: 'none', color: isDark ? '#ccc' : '#64748b', cursor: 'pointer', padding: '6px' }}><Italic size={18} /></button>
                <button onMouseDown={(e) => { e.preventDefault(); exec('insertUnorderedList'); }} style={{ background: 'transparent', border: 'none', color: isDark ? '#ccc' : '#64748b', cursor: 'pointer', padding: '6px' }}><List size={18} /></button>
                <div style={{ width: '1px', height: '20px', background: isDark ? '#333' : '#e2e8f0' }} />
                <button onMouseDown={(e) => { e.preventDefault(); insertTable(); }} style={{ background: 'transparent', border: 'none', color: isDark ? '#ccc' : '#64748b', cursor: 'pointer', padding: '6px' }} title="Insert Table"><Grid size={18} /></button>
                <button onMouseDown={(e) => { e.preventDefault(); const url = prompt('URL:'); if (url) exec('createLink', url); }} style={{ background: 'transparent', border: 'none', color: isDark ? '#ccc' : '#64748b', cursor: 'pointer', padding: '6px' }}><Link size={18} /></button>
                <div style={{ flex: 1 }} />

                {searchOpen && (
                    <motion.div initial={{ width: 0 }} animate={{ width: '200px' }} style={{ background: isDark ? '#333' : '#f1f5f9', borderRadius: '4px', display: 'flex', alignItems: 'center', padding: '0 8px' }}>
                        <Search size={14} opacity={0.5} color={isDark ? '#ccc' : '#64748b'} />
                        <input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} onKeyDown={handleSearch} autoFocus placeholder="Find..." style={{ background: 'transparent', border: 'none', color: isDark ? '#fff' : '#000', fontSize: '12px', outline: 'none', padding: '6px' }} />
                        <X size={14} cursor="pointer" onClick={() => setSearchOpen(false)} color={isDark ? '#ccc' : '#64748b'} />
                    </motion.div>
                )}

                <button onClick={() => setSearchOpen(!searchOpen)} style={{ background: 'transparent', border: 'none', color: isDark ? '#ccc' : '#64748b', cursor: 'pointer', padding: '6px' }}><Search size={18} /></button>
                <div style={{ width: '1px', height: '20px', background: isDark ? '#333' : '#e2e8f0', margin: '0 8px' }} />
                <button onClick={saveToFile} style={{ background: 'transparent', border: 'none', color: 'var(--accent)', cursor: 'pointer', padding: '6px' }} title="Download as .txt"><Download size={18} /></button>
                <button onClick={() => shareContent('email')} style={{ background: 'transparent', border: 'none', color: isDark ? '#ccc' : '#64748b', cursor: 'pointer', padding: '6px' }} title="Send via Email"><Mail size={18} /></button>
                <button onClick={() => shareContent('whatsapp')} style={{ background: 'transparent', border: 'none', color: isDark ? '#ccc' : '#64748b', cursor: 'pointer', padding: '6px' }} title="Share on WhatsApp"><MessageSquare size={18} /></button>
            </div>

            {/* Editor Area */}
            <div style={{ 
                flex: 1, 
                background: isDark ? (pageSize === 'continuous' ? '#1e1e1e' : '#121212') : (pageSize === 'continuous' ? '#ffffff' : '#f1f5f9'), 
                position: 'relative', 
                overflow: 'auto',
                display: 'flex',
                flexDirection: 'column',
                alignItems: pageSize === 'continuous' ? 'stretch' : 'center',
                padding: pageSize === 'continuous' ? '0' : '30px 0'
            }}>
                {activeTab.mode === 'document' ? (
                    <div
                        ref={editorRef}
                        contentEditable
                        onInput={handleContentUpdate}
                        onBlur={handleContentUpdate}
                        suppressContentEditableWarning
                        style={{
                            padding: pageSize === 'continuous' ? '40px' : '60px', 
                            outline: 'none', 
                            color: isDark ? '#cccccc' : '#334155', 
                            fontSize: '15px', 
                            lineHeight: '1.7',
                            fontFamily: 'Consolas, "Courier New", monospace', 
                            minHeight: pageSize === 'continuous' ? '100%' : (pageSize === 'a4' ? '1122px' : '1056px'),
                            width: pageSize === 'continuous' ? '100%' : (pageSize === 'a4' ? '794px' : '816px'),
                            background: isDark ? '#1e1e1e' : '#ffffff',
                            boxShadow: pageSize === 'continuous' ? 'none' : (isDark ? '0 10px 30px rgba(0,0,0,0.5)' : '0 5px 15px rgba(0,0,0,0.05)'),
                            border: pageSize === 'continuous' ? 'none' : (isDark ? '1px solid #333' : '1px solid #e2e8f0'),
                            margin: '0 auto',
                            transition: '0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                        }}
                    />
                ) : (
                    <div style={{ padding: '40px', width: '100%', maxWidth: '900px', margin: '0 auto' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {activeTab.blocks.map(block => (
                                <motion.div
                                    key={block.id}
                                    layout={!isMoving}
                                    style={{
                                        background: block.color,
                                        borderRadius: '8px',
                                        padding: '20px',
                                        border: isDark ? '1px solid #444' : '1px solid #e2e8f0',
                                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                                        position: 'relative',
                                        color: '#333' // Better contrast on pastels
                                    }}
                                >
                                    <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'center' }}>
                                        {PASTEL_COLORS.map(c => (
                                            <div
                                                key={c.color}
                                                onClick={() => colorBlock(block.id, c.color)}
                                                style={{
                                                    width: '16px', height: '16px', borderRadius: '50%', background: c.color,
                                                    cursor: 'pointer', border: '1px solid rgba(0,0,0,0.1)',
                                                    boxShadow: block.color === c.color ? '0 0 0 2px var(--accent)' : 'none'
                                                }}
                                            />
                                        ))}
                                        <div style={{ flex: 1 }} />
                                        <div title="Očisti blok" style={{ display: 'flex', alignItems: 'center' }}>
                                            <RefreshCw size={14} cursor="pointer" onClick={() => clearBlock(block.id)} style={{ opacity: 0.5, marginRight: '10px' }} />
                                        </div>
                                        <Trash2 size={16} cursor="pointer" onClick={() => removeBlock(block.id)} style={{ opacity: 0.5 }} />
                                    </div>
                                    <div style={{ position: 'relative' }}>
                                        <div
                                            contentEditable
                                            suppressContentEditableWarning
                                            onInput={(e) => {
                                                const newContent = e.currentTarget.innerHTML;
                                                updateBlock(block.id, newContent);
                                            }}
                                            dangerouslySetInnerHTML={{ __html: block.content }}
                                            style={{
                                                width: '100%',
                                                minHeight: '100px',
                                                background: 'transparent',
                                                border: 'none',
                                                outline: 'none',
                                                fontSize: '15px',
                                                fontFamily: 'inherit',
                                                color: 'inherit',
                                                cursor: 'text'
                                            }}
                                        />
                                    </div>
                                </motion.div>
                            ))}
                            <button
                                onClick={addBlock}
                                style={{
                                    padding: '15px',
                                    borderRadius: '8px',
                                    border: '2px dashed #94a3b8',
                                    background: 'transparent',
                                    color: '#94a3b8',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '10px',
                                    fontWeight: 'bold'
                                }}
                            >
                                <Plus size={20} /> Add New Block
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Status Bar */}
            <div style={{
                height: '28px', background: isDark ? '#1e1e1e' : '#f8fafc', display: 'flex', alignItems: 'center',
                padding: '0 15px', fontSize: '11px', gap: '20px', 
                borderTop: isDark ? '1px solid #333' : '1px solid #e2e8f0',
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
                .menu-item-hover:hover { background: #094771; color: #ffffff !important; }
                .top-menu-item:hover { background: ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}; }
                table td { min-width: 50px; border: 1px solid #444; padding: 5px; }
            `}</style>
        </motion.div>,
        document.body
    );
};
