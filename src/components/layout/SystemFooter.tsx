import React, { useState, useEffect, useMemo } from 'react';
import {
    ChevronLeft,
    ChevronRight,
    Cloud,
    Calculator,
    RefreshCcw,
    ArrowLeftRight,
    StickyNote,
    Clock,
    Globe,
    X,
    Search,
    Sun,
    CloudRain,
    Thermometer,
    Wind,
    Save,
    Plus,
    Trash2,
    FileText,
    Pin,
    Clock as ClockIcon,
    MapPin,
    Settings2,
    Edit3,
    ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useThemeStore } from '../../stores';
import { useNotesStore } from '../../stores/notesStore';
import { currencyManager } from '../../utils/currencyManager';
import { ModernNotepad } from './ModernNotepad';
import DailyWisdom from '../DailyWisdom';

interface AgentNote {
    id: string;
    title: string;
    content: string;
    updatedAt: string;
}

interface CityTime {
    name: string;
    timezone: string;
    icon?: string;
}

const DEFAULT_CITIES: CityTime[] = [
    { name: 'Belgrade', timezone: 'Europe/Belgrade' },
    { name: 'London', timezone: 'Europe/London' },
    { name: 'New York', timezone: 'America/New_York' },
    { name: 'Tokyo', timezone: 'Asia/Tokyo' },
    { name: 'Dubai', timezone: 'Asia/Dubai' },
];

const TimeDisplay: React.FC<{ timezone: string }> = ({ timezone }) => {
    const [time, setTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const timeString = useMemo(() => {
        return new Intl.DateTimeFormat('sr-RS', {
            timeZone: timezone,
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        }).format(time);
    }, [time, timezone]);

    return <span>{timeString}</span>;
};

const ToolPanel: React.FC<{
    title: string;
    icon: React.ReactNode;
    onClose: () => void;
    children: React.ReactNode;
    isDark: boolean;
}> = ({ title, icon, onClose, children, isDark }) => (
    <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.95 }}
        style={{
            position: 'absolute',
            bottom: '50px',
            right: '20px',
            width: '320px',
            background: isDark ? '#1a1a2e' : '#fff',
            borderRadius: '20px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
            border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
            zIndex: 10000,
            overflow: 'hidden'
        }}
    >
        <div style={{
            padding: '16px 20px',
            borderBottom: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--accent)', fontWeight: '800', fontSize: '13px' }}>
                {icon}
                <span style={{ textTransform: 'uppercase', letterSpacing: '1px' }}>{title}</span>
            </div>
            <button
                onClick={onClose}
                style={{ background: 'transparent', border: 'none', color: isDark ? '#94a3b8' : '#64748b', cursor: 'pointer', padding: '4px' }}
            >
                <X size={16} />
            </button>
        </div>
        <div style={{ padding: '20px' }}>
            {children}
        </div>
    </motion.div>
);

// Helper Tools (Placeholders for logic)
const WeatherTool: React.FC<{ isDark: boolean; cities: string[] }> = ({ isDark, cities }) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {cities.map(c => (
            <div key={c} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                <span>{c}</span>
                <span>24°C <Sun size={14} style={{ verticalAlign: 'middle' }} /></span>
            </div>
        ))}
    </div>
);

const CalculatorTool: React.FC<{ isDark: boolean }> = ({ isDark }) => {
    const [expr, setExpr] = useState('');
    const [res, setRes] = useState('0');
    const [mode, setMode] = useState<'sequential' | 'scientific'>('sequential');
    
    const calculate = (val: string = expr) => {
        if (!val.trim()) {
            setRes('0');
            return;
        }
        try {
            let processed = val.replace(/,/g, '.');
            processed = processed.replace(/(\d+(?:\.\d+)?)%/g, '($1/100)');
            
            if (mode === 'scientific') {
                // eslint-disable-next-line no-eval
                const result = eval(processed.replace(/[^-+*/0-9.()]/g, ''));
                setRes(Number.isInteger(result) ? String(result) : result.toFixed(2).replace(/\.?0+$/, ''));
            } else {
                // SEQUENTIAL LOGIC (Left-to-Right)
                // Tokenize expression
                const tokens = processed.match(/(\d+(?:\.\d+)?|[+\-*/])/g);
                if (!tokens) return;

                let currentResult = parseFloat(tokens[0]);
                for (let i = 1; i < tokens.length; i += 2) {
                    const operator = tokens[i];
                    const nextValue = parseFloat(tokens[i + 1]);
                    
                    if (isNaN(nextValue)) break;

                    switch (operator) {
                        case '+': currentResult += nextValue; break;
                        case '-': currentResult -= nextValue; break;
                        case '*': currentResult *= nextValue; break;
                        case '/': currentResult /= nextValue; break;
                    }
                }
                setRes(Number.isInteger(currentResult) ? String(currentResult) : currentResult.toFixed(2).replace(/\.?0+$/, ''));
            }
        } catch {
            setRes('Error');
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            calculate();
        }, 300);
        return () => clearTimeout(timer);
    }, [expr, mode]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', background: 'rgba(0,0,0,0.1)', borderRadius: '8px', padding: '2px' }}>
                <button 
                    onClick={() => setMode('sequential')}
                    style={{ flex: 1, padding: '4px', border: 'none', background: mode === 'sequential' ? 'var(--accent)' : 'transparent', color: mode === 'sequential' ? 'white' : 'inherit', borderRadius: '6px', fontSize: '10px', cursor: 'pointer', fontWeight: '800' }}
                >
                    BIZNIS (Redosled)
                </button>
                <button 
                    onClick={() => setMode('scientific')}
                    style={{ flex: 1, padding: '4px', border: 'none', background: mode === 'scientific' ? 'var(--accent)' : 'transparent', color: mode === 'scientific' ? 'white' : 'inherit', borderRadius: '6px', fontSize: '10px', cursor: 'pointer', fontWeight: '800' }}
                >
                    MATEMATIČKI
                </button>
            </div>
            <div style={{ position: 'relative' }}>
                <input 
                    value={expr} 
                    onChange={e => setExpr(e.target.value)}
                    placeholder="200/2*3-10+56/8"
                    autoFocus
                    style={{ 
                        width: '100%', 
                        background: isDark ? 'rgba(0,0,0,0.2)' : '#f1f5f9', 
                        border: '1px solid var(--border)', 
                        borderRadius: '12px', 
                        padding: '12px', 
                        fontSize: '14px',
                        color: 'inherit',
                        outline: 'none'
                    }}
                />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 4px' }}>
                <span style={{ fontSize: '22px', fontWeight: '900', color: 'var(--accent)' }}>= {res}</span>
                <button onClick={() => calculate()} style={{ padding: '8px 16px', background: 'var(--accent)', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: '800' }}>Izračunaj</button>
            </div>
        </div>
    );
};

const CurrencyTool: React.FC<{ isDark: boolean }> = ({ isDark }) => {
    const [amount, setAmount] = useState('100');
    const [from, setFrom] = useState('EUR');
    const [to, setTo] = useState('RSD');
    
    const result = useMemo(() => {
        const amt = parseFloat(amount) || 0;
        return currencyManager.convert(amt, from, to).toFixed(2);
    }, [amount, from, to]);

    const currentRate = currencyManager.getAgencyRate('EUR').toFixed(2);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ fontSize: '10px', opacity: 0.6, textAlign: 'center' }}>
                Trenutni kurs: 1 EUR = {currentRate} RSD
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <input 
                    type="number" 
                    value={amount} 
                    onChange={e => setAmount(e.target.value)}
                    style={{ flex: 1, background: isDark ? 'rgba(0,0,0,0.2)' : '#f1f5f9', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px', color: 'inherit' }}
                />
                <select value={from} onChange={e => setFrom(e.target.value)} style={{ background: isDark ? 'rgba(0,0,0,0.2)' : '#f1f5f9', border: '1px solid var(--border)', borderRadius: '8px', padding: '6px', color: 'inherit' }}>
                    <option>EUR</option>
                    <option>USD</option>
                    <option>RSD</option>
                </select>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
                <ArrowLeftRight size={14} style={{ opacity: 0.5 }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(59,130,246,0.1)', padding: '12px', borderRadius: '10px' }}>
                <span style={{ fontWeight: '800', fontSize: '16px', color: 'var(--accent)' }}>{result}</span>
                <select value={to} onChange={e => setTo(e.target.value)} style={{ background: 'transparent', border: 'none', fontWeight: '900', color: 'inherit', textAlign: 'right' }}>
                    <option>RSD</option>
                    <option>EUR</option>
                    <option>USD</option>
                </select>
            </div>
        </div>
    );
};

const UnitsTool: React.FC<{ isDark: boolean }> = ({ isDark }) => {
    const [val, setVal] = useState('1');
    const [type, setType] = useState('ft-m');
    
    const res = useMemo(() => {
        const n = parseFloat(val) || 0;
        if (type === 'ft-m') return (n * 0.3048).toFixed(2) + ' m';
        if (type === 'm-ft') return (n / 0.3048).toFixed(2) + ' ft';
        if (type === 'f-c') return ((n - 32) * 5/9).toFixed(1) + ' °C';
        return n;
    }, [val, type]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <select value={type} onChange={e => setType(e.target.value)} style={{ width: '100%', background: isDark ? 'rgba(0,0,0,0.2)' : '#f1f5f9', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px', color: 'inherit' }}>
                <option value="ft-m">Feet (ft) → Meters (m)</option>
                <option value="m-ft">Meters (m) → Feet (ft)</option>
                <option value="f-c">Fahrenheit (°F) → Celsius (°C)</option>
            </select>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <input 
                    type="number" 
                    value={val} 
                    onChange={e => setVal(e.target.value)}
                    style={{ flex: 1, background: isDark ? 'rgba(0,0,0,0.2)' : '#f1f5f9', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px', color: 'inherit' }}
                />
                <span style={{ fontWeight: 900, fontSize: '14px', color: 'var(--accent)' }}>= {res}</span>
            </div>
        </div>
    );
};
const NotesTool: React.FC<{ isDark: boolean }> = ({ isDark }) => {
    const { pinnedNoteIds, pinNote, unpinNote } = useNotesStore();
    const [notes, setNotes] = useState<AgentNote[]>([]);

    useEffect(() => {
        const saved = localStorage.getItem('prime-agent-notes');
        if (saved) {
            try {
                setNotes(JSON.parse(saved));
            } catch {
                setNotes([]);
            }
        }
    }, []);

    const createNote = () => {
        const newNote: AgentNote = {
            id: Date.now().toString(),
            title: 'Nova beleška',
            content: '',
            updatedAt: new Date().toISOString()
        };
        const updated = [newNote, ...notes];
        setNotes(updated);
        localStorage.setItem('prime-agent-notes', JSON.stringify(updated));
        // Auto-pin the new note
        pinNote(newNote.id);
    };

    const deleteNote = (id: string) => {
        const updated = notes.filter(n => n.id !== id);
        setNotes(updated);
        localStorage.setItem('prime-agent-notes', JSON.stringify(updated));
        unpinNote(id);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <button
                onClick={createNote}
                style={{
                    width: '100%',
                    padding: '12px',
                    background: 'var(--accent)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontWeight: '800',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px var(--accent-glow)'
                }}
            >
                <Plus size={16} /> Nova Beleška
            </button>

            <div style={{
                maxHeight: '240px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
                paddingRight: '4px'
            }}>
                {notes.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px', opacity: 0.4, fontSize: '12px' }}>
                        Nema sačuvanih beleški
                    </div>
                ) : (
                    notes.map(note => {
                        const isPinned = pinnedNoteIds.some(p => p.id === note.id);
                        return (
                            <div
                                key={note.id}
                                style={{
                                    padding: '10px 14px',
                                    background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
                                    borderRadius: '10px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    border: '1px solid rgba(255,255,255,0.05)'
                                }}
                            >
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, minWidth: 0 }}>
                                    <input 
                                        value={note.title}
                                        onChange={(e) => {
                                            const newTitle = e.target.value;
                                            const updated = notes.map(n => n.id === note.id ? { ...n, title: newTitle, updatedAt: new Date().toISOString() } : n);
                                            setNotes(updated);
                                            localStorage.setItem('prime-agent-notes', JSON.stringify(updated));
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                        style={{ background: 'transparent', border: 'none', color: 'inherit', fontWeight: '700', fontSize: '12px', width: '100%', outline: 'none' }}
                                        placeholder="Naslov beleške..."
                                    />
                                    <textarea 
                                        value={note.content}
                                        onChange={(e) => {
                                            const newContent = e.target.value;
                                            const updated = notes.map(n => n.id === note.id ? { ...n, content: newContent, updatedAt: new Date().toISOString() } : n);
                                            setNotes(updated);
                                            localStorage.setItem('prime-agent-notes', JSON.stringify(updated));
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                        style={{ 
                                            background: 'rgba(0,0,0,0.1)', border: 'none', color: 'inherit', 
                                            fontSize: '11px', width: '100%', outline: 'none', 
                                            resize: 'none', borderRadius: '4px', padding: '4px',
                                            minHeight: '40px'
                                        }}
                                        placeholder="Sadržaj..."
                                    />
                                </div>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                    <button
                                        onClick={() => isPinned ? unpinNote(note.id) : pinNote(note.id)}
                                        style={{
                                            background: isPinned ? 'var(--accent)' : 'transparent',
                                            border: isPinned ? 'none' : '1px solid rgba(255,255,255,0.1)',
                                            color: isPinned ? 'white' : 'inherit',
                                            padding: '6px',
                                            borderRadius: '6px',
                                            cursor: 'pointer'
                                        }}
                                        title={isPinned ? "Unpin" : "Pin to screen"}
                                    >
                                        <Pin size={12} fill={isPinned ? "currentColor" : "none"} />
                                    </button>
                                    <button
                                        onClick={() => deleteNote(note.id)}
                                        style={{
                                            background: 'transparent',
                                            border: '1px solid rgba(239, 68, 68, 0.2)',
                                            color: '#ef4444',
                                            padding: '6px',
                                            borderRadius: '6px',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};


export const SystemFooter: React.FC = () => {
    const { theme } = useThemeStore();
    const isDark = theme === 'navy';
    const [activeTool, setActiveTool] = useState<string | null>(null);
    const [isClockExpanded, setIsClockExpanded] = useState(false);
    const [cities] = useState<CityTime[]>(DEFAULT_CITIES);
    const [weatherCities] = useState<string[]>(['Belgrade', 'London', 'Dubai']);

    const utilityIcons = [
        { id: 'weather', icon: <Cloud size={16} />, label: 'Weather', color: '#800020' },
        { id: 'calc', icon: <Calculator size={16} />, label: 'Calculator', color: '#800020' },
        { id: 'currency', icon: <RefreshCcw size={16} />, label: 'Currency', color: '#800020' },
        { id: 'units', icon: <ArrowLeftRight size={16} />, label: 'Convert', color: '#800020' },
        { id: 'notes', icon: <StickyNote size={14} />, label: 'Sticky Notes', color: '#800020' },
        { id: 'notepad', icon: <Edit3 size={16} />, label: 'Expert Notepad', color: '#800020' }

    ];

    return (
        <footer style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            height: '54px',
            background: isDark ? 'rgba(10, 10, 18, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            borderTop: isDark ? '2px solid rgba(59, 130, 246, 0.2)' : '2px solid rgba(59, 130, 246, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 20px',
            zIndex: 9999,
            fontSize: '11px',
            color: isDark ? '#94a3b8' : '#64748b',
            boxShadow: '0 -4px 30px rgba(0,0,0,0.15)',
            userSelect: 'none'
        }}>
            {/* Left Side: Brand & World Clock Accordion */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flex: 1 }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontWeight: '900',
                    color: 'var(--accent)',
                    letterSpacing: '1px',
                    fontSize: '11px'
                }}>
                    <Globe size={13} />
                    <span>PRIME CLICK</span>
                </div>

                <div style={{ position: 'relative' }}>
                    <AnimatePresence>
                        {isClockExpanded && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                style={{
                                    position: 'absolute',
                                    bottom: '45px',
                                    left: '0',
                                    width: '240px',
                                    background: isDark ? '#1a1a2e' : '#fff',
                                    borderRadius: '16px',
                                    padding: '12px',
                                    boxShadow: '0 15px 40px rgba(0,0,0,0.4)',
                                    border: isDark ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.1)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '8px',
                                    zIndex: 10001
                                }}
                            >
                                <div style={{ fontSize: '10px', fontWeight: '800', opacity: 0.5, marginBottom: '4px', textTransform: 'uppercase', padding: '0 8px' }}>World Clocks</div>
                                {cities.map((city) => (
                                    <div key={city.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderRadius: '10px', background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }}>
                                        <span style={{ fontWeight: '700' }}>{city.name}</span>
                                        <span style={{ fontFamily: 'monospace', fontWeight: '900', color: 'var(--accent)', fontSize: '12px' }}>
                                            <TimeDisplay timezone={city.timezone} />
                                        </span>
                                    </div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <motion.div
                        whileHover={{ backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
                        onClick={() => setIsClockExpanded(!isClockExpanded)}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            cursor: 'pointer',
                            padding: '4px 12px',
                            borderRadius: '8px',
                            transition: 'background 0.2s'
                        }}
                    >
                        <ClockIcon size={14} color="var(--accent)" />
                        <span style={{ fontWeight: '700', textTransform: 'uppercase' }}>{cities[0].name}:</span>
                        <span style={{ fontWeight: '900', color: isDark ? '#fff' : '#1e293b', fontFamily: 'monospace', fontSize: '12px' }}>
                            <TimeDisplay timezone={cities[0].timezone} />
                        </span>
                        <motion.div animate={{ rotate: isClockExpanded ? 180 : 0 }}>
                            <ChevronDown size={12} style={{ opacity: 0.5 }} />
                        </motion.div>
                    </motion.div>
                </div>
            </div>

            {/* Middle: Daily Wisdom */}
            <div style={{ flex: 2, display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden' }}>
                <DailyWisdom />
            </div>

            {/* Right Side: Utilities */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, justifyContent: 'flex-end' }}>
                {utilityIcons.map((util) => (
                    <motion.button
                        key={util.id}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setActiveTool(activeTool === util.id ? null : util.id)}
                        style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '8px',
                            border: 'none',
                            background: activeTool === util.id ? (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)') : 'transparent',
                            color: activeTool === util.id ? util.color : (isDark ? '#94a3b8' : '#64748b'),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer'
                        }}
                    >
                        {util.icon}
                    </motion.button>
                ))}

                <div style={{ height: '16px', width: '1px', background: 'rgba(255,255,255,0.1)', margin: '0 8px' }} />
                <div style={{ fontSize: '9px', fontWeight: '800', opacity: 0.5 }}>V1.4.2-STABLE</div>
            </div>

            <AnimatePresence>
                {activeTool === 'weather' && (
                    <ToolPanel isDark={isDark} title="World Weather" icon={<Cloud size={16} />} onClose={() => setActiveTool(null)}>
                        <WeatherTool isDark={isDark} cities={weatherCities} />
                    </ToolPanel>
                )}
                {activeTool === 'calc' && (
                    <ToolPanel isDark={isDark} title="Smart Calculator" icon={<Calculator size={16} />} onClose={() => setActiveTool(null)}>
                        <CalculatorTool isDark={isDark} />
                    </ToolPanel>
                )}
                {activeTool === 'currency' && (
                    <ToolPanel isDark={isDark} title="Currency Converter" icon={<RefreshCcw size={16} />} onClose={() => setActiveTool(null)}>
                        <CurrencyTool isDark={isDark} />
                    </ToolPanel>
                )}
                {activeTool === 'units' && (
                    <ToolPanel isDark={isDark} title="Unit Converter" icon={<ArrowLeftRight size={16} />} onClose={() => setActiveTool(null)}>
                        <UnitsTool isDark={isDark} />
                    </ToolPanel>
                )}
                {activeTool === 'notes' && (
                    <ToolPanel isDark={isDark} title="Sticky Notes" icon={<StickyNote size={16} />} onClose={() => setActiveTool(null)}>
                        <NotesTool isDark={isDark} />
                    </ToolPanel>
                )}

                {activeTool === 'notepad' && (
                    <ModernNotepad onClose={() => setActiveTool(null)} />
                )}
            </AnimatePresence>
        </footer>
    );
};

export default SystemFooter;
