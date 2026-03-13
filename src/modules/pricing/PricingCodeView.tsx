import React, { useState, useEffect, useRef } from 'react';
import { 
    Play, 
    Save, 
    Download,
    Sun,
    Moon,
    FolderOpen,
    Loader2,
    Database,
    Send,
    Terminal as TerminalIcon,
    X,
    Files,
    Search,
    Settings,
    Activity,
    ChevronRight,
    Search as SearchIcon,
    Zap,
    Layout
} from 'lucide-react';

interface ProductState {
    name: string;
    service: string;
    type: string;
    prefix: string;
    view: string;
}

interface PricePeriod {
    id: string;
    dateFrom: string;
    dateTo: string;
    netPrice: number;
    brutoPrice?: number;
    provisionPercent?: number;
    minStay?: number;
    basis?: string;
}

interface Supplement {
    id: string;
    name: string;
    type: string;
    value: number;
    dateFrom: string;
    dateTo: string;
}

interface TerminalLog {
    type: 'info' | 'success' | 'warning' | 'error' | 'ai';
    text: string;
    timestamp?: string;
}

interface PricingCodeViewProps {
    pricelistTitle: string;
    pricelistId: string | null;
    productState: ProductState;
    pricePeriods: PricePeriod[];
    supplements: Supplement[];
    validationIssues: string[];
    saveSuccess: boolean;
    isSaving: boolean;
    isDarkMode: boolean;
    onTitleChange: (title: string) => void;
    onDarkModeToggle: () => void;
    onLoadPricelist: () => void;
    onExportJSON: () => void;
    onSaveDraft: () => void;
    onActivate: () => void;
    onProductChange: (product: ProductState) => void;
    onPeriodsChange: (periods: PricePeriod[]) => void;
    onSupplementsChange: (supplements: Supplement[]) => void;
}

const INITIAL_AI_LOGS: TerminalLog[] = [
    { type: 'ai', text: 'Analiziran odnos neto i bruto cena za sezonu 2026.', timestamp: '21:12:01' },
    { type: 'success', text: 'Svi kontrastni parametri su optimizovani za bolju vidljivost.', timestamp: '21:12:05' },
    { type: 'info', text: 'Sistem spreman za pricing komande u realnom vremenu.', timestamp: '21:12:10' }
];

export const PricingCodeView: React.FC<PricingCodeViewProps> = ({ 
    pricelistTitle,
    pricelistId,
    productState,
    pricePeriods,
    supplements,
    validationIssues,
    saveSuccess,
    isSaving,
    isDarkMode,
    onTitleChange,
    onDarkModeToggle,
    onLoadPricelist,
    onExportJSON,
    onSaveDraft,
    onActivate,
    onProductChange,
    onPeriodsChange,
    onSupplementsChange
}) => {
    // Layout State
    const [leftSidebarTab, setLeftSidebarTab] = useState<'explorer' | 'search'>('explorer');
    const [activeEditorTab, setActiveEditorTab] = useState<'config' | 'data' | 'schema'>('config');
    const [rightSidebarWidth, setRightSidebarWidth] = useState(380);
    const [leftSidebarWidth, setLeftSidebarWidth] = useState(260);
    const [isResizingRight, setIsResizingRight] = useState(false);
    const [isResizingLeft, setIsResizingLeft] = useState(false);
    const [terminalVisible, setTerminalVisible] = useState(true);
    
    // Feature State
    const [terminalLogs, setTerminalLogs] = useState<TerminalLog[]>(INITIAL_AI_LOGS);
    const [aiInput, setAiInput] = useState('');
    const [aiMessages, setAiMessages] = useState<Array<{role: 'user' | 'assistant', content: string}>>([
        { role: 'assistant', content: 'Spreman sam za rad. Mogu analizirati cene, optimizovati profitnu marginu ili ispraviti greške u validaciji.' }
    ]);
    const [isThinking, setIsThinking] = useState(false);
    const [isBuilding, setIsBuilding] = useState(false);
    const [jsonValue, setJsonValue] = useState(JSON.stringify(pricePeriods, null, 4));

    const terminalRef = useRef<HTMLDivElement>(null);

    // Resizing Logic
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (isResizingRight) {
                const newWidth = window.innerWidth - e.clientX;
                if (newWidth > 280 && newWidth < 600) setRightSidebarWidth(newWidth);
            }
            if (isResizingLeft) {
                const newWidth = e.clientX - 52; 
                if (newWidth > 180 && newWidth < 450) setLeftSidebarWidth(newWidth);
            }
        };
        const handleMouseUp = () => {
            setIsResizingRight(false);
            setIsResizingLeft(false);
        };
        if (isResizingRight || isResizingLeft) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizingRight, isResizingLeft]);

    // Scroll terminal
    useEffect(() => {
        if (terminalRef.current) {
            terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
        }
    }, [terminalLogs]);

    // Lock Body Scroll when active
    useEffect(() => {
        const originalOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = originalOverflow;
        };
    }, []);

    const handleAiCommand = () => {
        if (!aiInput.trim()) return;
        const input = aiInput.trim();
        setAiMessages((prev: any[]) => [...prev, { role: 'user', content: input }]);
        setAiInput('');
        setIsThinking(true);
        setTimeout(() => {
            const time = new Date().toLocaleTimeString('sr-RS', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            setAiMessages((prev: any[]) => [...prev, { role: 'assistant', content: `Obrađujem zahtev: "${input}". Analiza profitabilnosti je u toku.` }]);
            setTerminalLogs((prev: TerminalLog[]) => [...prev, { type: 'ai', text: `AI: Primena optimizacije - ${input}`, timestamp: time }]);
            setIsThinking(false);
        }, 1200);
    };

    const theme = {
        bg: isDarkMode ? '#0d1117' : '#ffffff',
        activityBar: isDarkMode ? '#090c10' : '#f6f8fa',
        sidebar: isDarkMode ? '#0d1117' : '#f8f9fa',
        editor: isDarkMode ? '#0d1117' : '#ffffff',
        header: isDarkMode ? '#161b22' : '#ffffff',
        border: isDarkMode ? '#30363d' : '#d0d7de',
        text: isDarkMode ? '#c9d1d9' : '#1f2328',
        textMuted: isDarkMode ? '#8b949e' : '#656d76',
        cyan: isDarkMode ? '#58a6ff' : '#0969da',
        accent: '#238636'
    };

    const renderFileTree = () => (
        <div style={{ padding: '12px 0' }}>
            <div style={{ padding: '0 16px 8px 16px', fontSize: '11px', fontWeight: 800, color: theme.textMuted, opacity: 0.8 }}>CORE SOURCE</div>
            {[
                { name: 'pricelist.config.ts', icon: '📄', id: 'config' },
                { name: 'periods.data.json', icon: '📦', id: 'data' },
                { name: 'rules.schema.ts', icon: '⚙️', id: 'schema' }
            ].map(file => (
                <div 
                    key={file.id}
                    onClick={() => setActiveEditorTab(file.id as any)}
                    style={{
                        padding: '8px 24px', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px',
                        color: activeEditorTab === file.id ? (isDarkMode ? '#fff' : '#0969da') : theme.text,
                        background: activeEditorTab === file.id ? (isDarkMode ? 'rgba(88, 166, 255, 0.1)' : 'rgba(9, 105, 218, 0.1)') : 'transparent',
                        borderLeft: activeEditorTab === file.id ? `2px solid ${theme.cyan}` : '2px solid transparent'
                    }}
                >
                    <span>{file.icon}</span>
                    <span style={{ fontWeight: activeEditorTab === file.id ? 600 : 400 }}>{file.name}</span>
                </div>
            ))}
        </div>
    );

    return (
        <div style={{ 
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            display: 'flex', 
            flexDirection: 'column', 
            background: theme.bg, 
            color: theme.text,
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
            zIndex: 9999999,
            overflow: 'hidden',
            boxSizing: 'border-box',
            margin: 0,
            padding: 0
        }}>
            {/* 1. GLOBAL HEADER - Height and Spacing Fixed */}
            <div style={{ 
                height: '64px', background: theme.header, borderBottom: `1px solid ${theme.border}`,
                display: 'flex', alignItems: 'center', padding: '0 24px', gap: '16px', zIndex: 100,
                boxShadow: isDarkMode ? 'none' : '0 1px 3px rgba(0,0,0,0.05)'
            }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ff5f56', border: '1px solid rgba(0,0,0,0.1)' }} />
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#ffbd2e', border: '1px solid rgba(0,0,0,0.1)' }} />
                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: '#27c93f', border: '1px solid rgba(0,0,0,0.1)' }} />
                </div>
                
                <div style={{ display: 'flex', gap: '10px', flex: 1, marginLeft: '20px' }}>
                    {[
                        { label: 'Učitaj', icon: <FolderOpen size={16} />, onClick: onLoadPricelist },
                        { label: 'Export', icon: <Download size={16} />, onClick: onExportJSON },
                        { label: 'Sačuvaj', icon: isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />, onClick: onSaveDraft }
                    ].map((btn, i) => (
                        <button 
                            key={i} 
                            onClick={(e) => { 
                                e.stopPropagation(); 
                                if (btn.onClick) btn.onClick();
                            }} 
                            className="header-btn"
                            style={{
                                background: isDarkMode ? '#21262d' : '#ffffff', border: `1px solid ${theme.border}`, borderRadius: '6px',
                                padding: '8px 16px', color: theme.cyan, fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer',
                                transition: 'all 0.1s'
                            }}
                        >
                            {btn.icon} {btn.label}
                        </button>
                    ))}
                    
                    <button style={{
                        background: isDarkMode ? 'rgba(35, 134, 54, 0.15)' : 'rgba(46, 160, 67, 0.08)',
                        border: `2px solid ${isDarkMode ? '#2ea043' : '#1a7f37'}`, borderRadius: '6px',
                        padding: '8px 24px', color: isDarkMode ? '#3fb950' : '#1a7f37', fontSize: '13px', fontWeight: 800,
                        display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', textTransform: 'uppercase'
                    }}>
                        <Play size={16} fill="currentColor" /> Pokreni Simulaciju
                    </button>
                </div>

                <div style={{ width: '1px', height: '32px', background: theme.border, margin: '0 8px' }} />

                <button onClick={onActivate} style={{
                    background: '#da3633', color: '#fff', border: 'none', borderRadius: '6px',
                    padding: '10px 32px', fontSize: '14px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '10px',
                    cursor: 'pointer', boxShadow: '0 4px 15px rgba(218, 54, 51, 0.45)', textTransform: 'uppercase', letterSpacing: '1px'
                }}>
                    <X size={18} strokeWidth={3} /> ZATVORI
                </button>
            </div>

            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                <div style={{ width: '52px', background: theme.activityBar, borderRight: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px 0', gap: '28px' }}>
                    <Files size={26} style={{ cursor: 'pointer', color: leftSidebarTab === 'explorer' ? theme.cyan : theme.textMuted }} onClick={() => setLeftSidebarTab('explorer')} />
                    <Search size={26} style={{ cursor: 'pointer', color: leftSidebarTab === 'search' ? theme.cyan : theme.textMuted }} onClick={() => setLeftSidebarTab('search')} />
                    <div style={{ flex: 1 }} />
                    <button onClick={onDarkModeToggle} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: theme.textMuted, marginBottom: '12px' }}>
                        {isDarkMode ? <Sun size={22} /> : <Moon size={22} />}
                    </button>
                    <Settings size={24} style={{ color: theme.textMuted, cursor: 'pointer', marginBottom: '16px' }} />
                </div>

                <div style={{ width: leftSidebarWidth, background: theme.sidebar, borderRight: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column', position: 'relative' }}>
                    <div style={{ height: '40px', padding: '0 16px', fontSize: '11px', fontWeight: 800, color: theme.textMuted, display: 'flex', alignItems: 'center', textTransform: 'uppercase', borderBottom: `1px solid ${theme.border}` }}>
                        {leftSidebarTab === 'explorer' ? 'Explorer' : 'Search'}
                    </div>
                    {leftSidebarTab === 'explorer' ? renderFileTree() : (
                        <div style={{ padding: '16px' }}>
                            <div style={{ position: 'relative' }}>
                                <input placeholder="Traži..." style={{ width: '100%', background: isDarkMode ? '#0d1117' : '#fff', border: `1px solid ${theme.border}`, borderRadius: '4px', padding: '8px 12px', paddingRight: '34px', color: theme.text, outline: 'none', fontSize: '13px' }} />
                                <SearchIcon size={14} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: theme.textMuted }} />
                            </div>
                        </div>
                    )}
                    <div onMouseDown={() => setIsResizingLeft(true)} style={{ position: 'absolute', right: -2, top: 0, width: '4px', height: '100%', cursor: 'col-resize', zIndex: 10, background: isResizingLeft ? theme.cyan : 'transparent' }} />
                </div>

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: theme.editor }}>
                    <div style={{ 
                        height: '40px', padding: '0 20px', fontSize: '12px', color: theme.textMuted, display: 'flex', alignItems: 'center', gap: '8px',
                        background: isDarkMode ? 'rgba(0,0,0,0.2)' : '#f6f8fa', borderBottom: `1px solid ${theme.border}`, position: 'relative'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                            <div style={{ background: theme.cyan, color: '#fff', padding: '1px 6px', borderRadius: '3px', fontWeight: 900, fontSize: '10px' }}>DEV</div>
                            <span>src</span> <ChevronRight size={12} /> <span>modules</span> <ChevronRight size={12} /> <span style={{ color: theme.text, fontWeight: 700 }}>{activeEditorTab}.ts</span>
                        </div>
                        
                        {/* PRICING INFO FIELDS - Same line as tabs/breadcrumbs */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{ display: 'flex', gap: '4px', alignItems: 'center', background: isDarkMode ? '#161b22' : '#ffffff', border: `1px solid ${theme.border}`, padding: '2px 8px', borderRadius: '4px' }}>
                                <span style={{ fontWeight: 800, fontSize: '10px', opacity: 0.6 }}>HOTEL:</span> 
                                <span style={{ color: theme.cyan, fontWeight: 700 }}>{productState.name}</span>
                            </div>
                            <div style={{ display: 'flex', gap: '4px', alignItems: 'center', background: isDarkMode ? '#161b22' : '#ffffff', border: `1px solid ${theme.border}`, padding: '2px 8px', borderRadius: '4px' }}>
                                <span style={{ fontWeight: 800, fontSize: '10px', opacity: 0.6 }}>PRICELIST:</span> 
                                <span style={{ color: theme.text, fontWeight: 700 }}>{pricelistTitle}</span>
                            </div>
                            <div style={{ display: 'flex', gap: '4px', alignItems: 'center', background: isDarkMode ? '#161b22' : '#ffffff', border: `1px solid ${theme.border}`, padding: '2px 8px', borderRadius: '4px' }}>
                                <span style={{ fontWeight: 800, fontSize: '10px', opacity: 0.6 }}>ID:</span> 
                                <span style={{ color: theme.accent, fontWeight: 900, fontFamily: 'monospace' }}>{pricelistId || 'N/A'}</span>
                            </div>
                        </div>
                    </div>

                    <div style={{ flex: 1, overflow: 'auto', display: 'flex', position: 'relative', background: theme.bg }}>
                        <div style={{ width: '56px', padding: '20px 0', textAlign: 'right', fontSize: '12px', color: theme.textMuted, borderRight: `1px solid ${theme.border}`, background: isDarkMode ? '#0d1117' : '#f6f8fa', opacity: 0.6 }}>
                            {Array.from({ length: 100 }).map((_, i) => (
                                <div key={i} style={{ padding: '0 14px' }}>{i + 1}</div>
                            ))}
                        </div>
                        <div style={{ flex: 1, padding: '20px', fontFamily: '"JetBrains Mono", monospace', fontSize: '14px', lineHeight: 1.8 }}>
                            <div style={{ color: theme.text, marginTop: '16px' }}>
                                <span style={{ color: '#ff7b72' }}>export const </span><span style={{ color: '#d2a8ff' }}>hotel </span>= <span style={{ color: '#a5d6ff' }}>"{productState.name}"</span>;
                            </div>
                            <div style={{ color: theme.text }}>
                                <span style={{ color: '#ff7b72' }}>export const </span><span style={{ color: '#d2a8ff' }}>roomType </span>= <span style={{ color: '#a5d6ff' }}>"{productState.type}"</span>;
                            </div>
                            <div style={{ color: theme.text }}>
                                <span style={{ color: '#ff7b72' }}>export const </span><span style={{ color: '#d2a8ff' }}>service </span>= <span style={{ color: '#a5d6ff' }}>"{productState.service}"</span>;
                            </div>
                            
                            <div style={{ color: '#8b949e', marginTop: '24px', fontStyle: 'italic' }}>// DEFINISANI PERIODI I CENE</div>
                            <div style={{ color: theme.text, marginTop: '8px' }}>
                                <span style={{ color: '#ff7b72' }}>const </span><span style={{ color: '#d2a8ff' }}>pricePeriods </span>= [
                                {pricePeriods.map((p, i) => (
                                    <div key={i} style={{ paddingLeft: '20px' }}>
                                        {'{'} <span style={{ color: '#79c0ff' }}>from</span>: <span style={{ color: '#a5d6ff' }}>"{p.dateFrom}"</span>, <span style={{ color: '#79c0ff' }}>to</span>: <span style={{ color: '#a5d6ff' }}>"{p.dateTo}"</span>, <span style={{ color: '#79c0ff' }}>neto</span>: <span style={{ color: '#ff7b72' }}>{p.netPrice}</span>, <span style={{ color: '#79c0ff' }}>bruto</span>: <span style={{ color: '#ff7b72' }}>{p.brutoPrice}</span> {'}'}{i < pricePeriods.length - 1 ? ',' : ''}
                                    </div>
                                ))}
                                ];
                            </div>

                            <div style={{ color: '#8b949e', marginTop: '24px', fontStyle: 'italic' }}>// AKTIVNE DOPLATE</div>
                            <div style={{ color: theme.text, marginTop: '8px' }}>
                                <span style={{ color: '#ff7b72' }}>const </span><span style={{ color: '#d2a8ff' }}>supplements </span>= {'['}
                                {supplements.map((s, i) => (
                                    <div key={i} style={{ paddingLeft: '20px' }}>
                                        <span style={{ color: '#a5d6ff' }}>"{s.name}"</span>{i < supplements.length - 1 ? ',' : ''}
                                    </div>
                                ))}
                                {']'};
                            </div>
                        </div>
                    </div>

                    {terminalVisible && (
                        <div style={{ height: '240px', background: isDarkMode ? '#010409' : '#ffffff', borderTop: `2px solid ${theme.border}`, display: 'flex', flexDirection: 'column' }}>
                            <div style={{ padding: '10px 24px', background: isDarkMode ? '#161b22' : '#f6f8fa', borderBottom: `1px solid ${theme.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ fontSize: '12px', fontWeight: 800, color: theme.text, display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <TerminalIcon size={14} style={{ color: theme.cyan }} /> OUTPUT CONSOLE
                                </div>
                                <X size={16} style={{ cursor: 'pointer', color: theme.textMuted }} onClick={() => setTerminalVisible(false)} />
                            </div>
                            <div ref={terminalRef} style={{ flex: 1, overflowY: 'auto', padding: '15px 24px', fontFamily: 'monospace', fontSize: '12px', color: theme.text }}>
                                {terminalLogs.map((log: TerminalLog, i: number) => (
                                    <div key={i} style={{ marginBottom: '6px' }}>
                                        <span style={{ color: theme.textMuted, marginRight: '12px' }}>[{log.timestamp}]</span>
                                        <span style={{ color: log.type === 'ai' ? theme.cyan : theme.text }}>{log.text}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div style={{ width: rightSidebarWidth, background: theme.sidebar, borderLeft: `1px solid ${theme.border}`, display: 'flex', flexDirection: 'column', position: 'relative' }}>
                    <div style={{ height: '40px', padding: '0 20px', borderBottom: `1px solid ${theme.border}`, background: isDarkMode ? 'rgba(88, 166, 255, 0.05)' : '#f6f8fa', display: 'flex', alignItems: 'center' }}>
                        <div style={{ fontSize: '11px', color: theme.textMuted, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>AI Pricing Agent</div>
                    </div>

                    <div style={{ padding: '24px', borderBottom: `1px solid ${theme.border}` }}>
                        <div style={{ fontSize: '11px', color: theme.textMuted, fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px' }}>Current Objective</div>
                        <div style={{ fontSize: '20px', fontWeight: 900, color: theme.cyan }}>Refine Dev Mode UI</div>
                        <div style={{ marginTop: '16px', padding: '12px', background: isDarkMode ? '#161b22' : '#ffffff', border: `1px solid ${theme.border}`, borderRadius: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '14px', fontWeight: 700 }}>
                                <Zap size={16} fill="#d29922" color="#d29922" /> Optimizing Interface...
                            </div>
                        </div>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {aiMessages.map((msg: {role: string, content: string}, i: number) => (
                            <div key={i} style={{ 
                                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                background: msg.role === 'user' ? theme.cyan : 'transparent',
                                color: msg.role === 'user' ? '#fff' : theme.text,
                                border: msg.role === 'assistant' ? `1px solid ${theme.border}` : 'none',
                                padding: '14px 18px', borderRadius: '12px', fontSize: '14px', maxWidth: '100%', boxShadow: msg.role === 'user' ? '0 4px 12px rgba(9, 105, 218, 0.4)' : 'none'
                            }}>
                                <div style={{ fontSize: '10px', fontWeight: 900, marginBottom: '6px', textTransform: 'uppercase', opacity: 0.7 }}>
                                    {msg.role === 'user' ? 'USER AGENT' : 'SYSTEM AI'}
                                </div>
                                {msg.content}
                            </div>
                        ))}
                    </div>

                    {/* Chat Input Area - HIGH VISIBILITY FIXED */}
                    <div style={{ 
                        padding: '24px', 
                        background: isDarkMode ? theme.header : '#ffffff', 
                        borderTop: `1px solid ${theme.border}`,
                        boxShadow: '0 -4px 20px rgba(0,0,0,0.05)'
                    }}>
                        <div style={{ 
                            position: 'relative',
                            background: isDarkMode ? '#0d1117' : '#ffffff',
                            border: `2px solid ${isDarkMode ? theme.border : theme.cyan}`,
                            borderRadius: '12px',
                            padding: '4px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }}>
                            <textarea 
                                value={aiInput}
                                onChange={(e) => setAiInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleAiCommand())}
                                placeholder="Unesite pricing komandu..."
                                rows={2}
                                style={{
                                    width: '100%', background: 'transparent', border: 'none', padding: '12px 48px 12px 14px',
                                    color: theme.text, fontSize: '14px', outline: 'none', resize: 'none'
                                }}
                            />
                            <button onClick={handleAiCommand} style={{
                                position: 'absolute', right: '12px', bottom: '12px', borderRadius: '8px',
                                width: '36px', height: '36px', background: theme.cyan, color: '#fff', border: 'none', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <Send size={20} />
                            </button>
                        </div>
                    </div>
                    
                    <div onMouseDown={() => setIsResizingRight(true)} style={{ position: 'absolute', left: -2, top: 0, width: '4px', height: '100%', cursor: 'col-resize', zIndex: 10, background: isResizingRight ? theme.cyan : 'transparent' }} />
                </div>
            </div>

            <div style={{ height: '26px', background: theme.activityBar, borderTop: `1px solid ${theme.border}`, display: 'flex', alignItems: 'center', padding: '0 20px', fontSize: '11px', color: theme.textMuted, gap: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: theme.accent, fontWeight: 900 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: theme.accent }} /> ENGINE ONLINE
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Database size={13} strokeWidth={3} /> {pricelistId}</div>
                <div style={{ flex: 1 }} />
                <div style={{ display: 'flex', gap: '20px', fontWeight: 700 }}><span>UTF-8</span> <span style={{ color: theme.cyan }}>TypeScript v5.2</span></div>
            </div>
            
            <style dangerouslySetInnerHTML={{ __html: `
                * { box-sizing: border-box; }
                .animate-spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                textarea::placeholder { color: ${isDarkMode ? '#484f58' : '#8c959f'}; opacity: 0.6; }
                @keyframes bounce { 
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-3px); }
                }
                .animate-bounce { animation: bounce 0.6s infinite; }
                .animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: .3; }
                }
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
                .header-btn:hover { border-color: ${theme.cyan} !important; background: ${isDarkMode ? '#30363d' : '#f6f8fa'} !important; }
                .header-btn:active { transform: scale(0.95); }
            `}} />
        </div>
    );
};
