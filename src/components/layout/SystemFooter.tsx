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
    Globe
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useThemeStore } from '../../stores';
import { useNotesStore } from '../../stores/notesStore';
import { currencyManager } from '../../utils/currencyManager';
import {
    X, Search, Sun, CloudRain, Thermometer, Wind, Save, Plus, Trash2,
    ChevronLeft as BackIcon, FileText, Pin, Clock as ClockIcon, MapPin,
    Settings2, Edit3
} from 'lucide-react';
import { ModernNotepad } from './ModernNotepad';

interface CityTime {
    name: string;
    timezone: string;
    icon?: string;
}

const DEFAULT_CITIES: CityTime[] = [
    { name: 'New York', timezone: 'America/New_York' },
    { name: 'Tokyo', timezone: 'Asia/Tokyo' },
    { name: 'Beijing', timezone: 'Asia/Shanghai' },
    { name: 'Sydney', timezone: 'Australia/Sydney' },
    { name: 'Dubai', timezone: 'Asia/Dubai' },
];

const AVAILABLE_ZONES = [
    { name: 'Belgrade', tz: 'Europe/Belgrade' },
    { name: 'London', tz: 'Europe/London' },
    { name: 'Paris', tz: 'Europe/Paris' },
    { name: 'Moscow', tz: 'Europe/Moscow' },
    { name: 'New York', tz: 'America/New_York' },
    { name: 'Los Angeles', tz: 'America/Los_Angeles' },
    { name: 'Tokyo', tz: 'Asia/Tokyo' },
    { name: 'Dubai', tz: 'Asia/Dubai' },
    { name: 'Singapore', tz: 'Asia/Singapore' },
    { name: 'Hong Kong', tz: 'Asia/Hong_Kong' },
    { name: 'Sydney', tz: 'Australia/Sydney' },
    { name: 'Rio', tz: 'America/Sao_Paulo' },
    { name: 'Johannesburg', tz: 'Africa/Johannesburg' },
    { name: 'Delhi', tz: 'Asia/Kolkata' },
    { name: 'Cairo', tz: 'Africa/Cairo' },
    { name: 'Buenos Aires', tz: 'America/Argentina/Buenos_Aires' },
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

// --- TOOL COMPONENTS ---

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

const WeatherTool: React.FC<{ isDark: boolean; cities: string[] }> = ({ isDark, cities }) => {
    const [weatherData, setWeatherData] = useState<any[]>([]);

    useEffect(() => {
        // Simulate fetching for user-selected cities
        const data = cities.map(city => ({
            city,
            temp: Math.floor(Math.random() * (35 - 10) + 10),
            cond: ['Sunny', 'Partial Cloud', 'Windy', 'Rainy'][Math.floor(Math.random() * 4)],
            icon: [<Sun size={20} color="#f59e0b" />, <Cloud size={20} color="#3b82f6" />, <Wind size={20} color="#8b5cf6" />, <CloudRain size={20} color="#94a3b8" />][Math.floor(Math.random() * 4)]
        }));
        setWeatherData(data);
    }, [cities]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {weatherData.map(d => (
                <div key={d.city} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '12px', borderRadius: '12px', background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {d.icon}
                        <div>
                            <div style={{ fontWeight: '700', fontSize: '13px', color: isDark ? '#fff' : '#1e293b' }}>{d.city}</div>
                            <div style={{ fontSize: '11px', opacity: 0.6 }}>{d.cond}</div>
                        </div>
                    </div>
                    <div style={{ fontWeight: '900', fontSize: '18px', color: 'var(--accent)' }}>{d.temp}°</div>
                </div>
            ))}
            {cities.length === 0 && <div style={{ opacity: 0.5, textAlign: 'center', padding: '20px' }}>No cities tracked. Add some in settings.</div>}
        </div>
    );
};

const WeatherSettingsTool: React.FC<{
    isDark: boolean;
    cities: string[];
    onAdd: (c: string) => void;
    onRemove: (name: string) => void;
}> = ({ isDark, cities, onAdd, onRemove }) => {
    const [newCity, setNewCity] = useState('');
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ fontWeight: '700', fontSize: '12px', opacity: 0.6, textTransform: 'uppercase' }}>Tracked Cities</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {cities.map(c => (
                    <div key={c} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: 'var(--accent-glow)', borderRadius: '100px', color: 'var(--accent)', fontWeight: '700' }}>
                        {c}
                        <button onClick={() => onRemove(c)} style={{ background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer' }}><X size={12} /></button>
                    </div>
                ))}
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
                <input
                    value={newCity}
                    onChange={e => setNewCity(e.target.value)}
                    placeholder="City name..."
                    style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid var(--border)', background: 'transparent', color: isDark ? '#fff' : '#000' }}
                />
                <button
                    onClick={() => { if (newCity) { onAdd(newCity); setNewCity(''); } }}
                    style={{ padding: '10px', borderRadius: '10px', background: 'var(--accent)', color: '#fff', border: 'none', fontWeight: '700' }}
                >
                    ADD
                </button>
            </div>
        </div>
    );
};

const CalculatorTool: React.FC<{ isDark: boolean }> = ({ isDark }) => {
    const [display, setDisplay] = useState('0');
    const buttons = ['7', '8', '9', '/', '4', '5', '6', '*', '1', '2', '3', '-', '0', '.', 'C', '=', '+'];
    const handleBtn = (b: string) => {
        if (b === 'C') setDisplay('0');
        else if (b === '=') {
            try { setDisplay(eval(display).toString()); } catch { setDisplay('Error'); }
        } else {
            setDisplay(prev => prev === '0' ? b : prev + b);
        }
    };
    return (
        <div>
            <div style={{
                background: isDark ? '#000' : '#f1f5f9', padding: '15px', borderRadius: '12px',
                textAlign: 'right', fontSize: '24px', fontWeight: '700', marginBottom: '15px',
                fontFamily: 'monospace', color: isDark ? 'var(--accent)' : '#1e293b'
            }}>{display}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                {buttons.map(b => (
                    <button key={b} onClick={() => handleBtn(b)} style={{
                        padding: '12px', borderRadius: '8px', border: 'none',
                        background: b === '=' ? 'var(--accent)' : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'),
                        color: b === '=' ? '#fff' : (isDark ? '#fff' : '#1e293b'),
                        fontWeight: '700', cursor: 'pointer'
                    }}>{b}</button>
                ))}
            </div>
        </div>
    );
};

const CurrencyTool: React.FC<{ isDark: boolean }> = ({ isDark }) => {
    const [amt, setAmt] = useState(100);
    const [from, setFrom] = useState('EUR');
    const [to, setTo] = useState('RSD');
    const result = currencyManager.convert(amt, from, to);
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
                <input type="number" value={amt} onChange={e => setAmt(Number(e.target.value))} style={{
                    flex: 1, padding: '12px', borderRadius: '10px', border: '1px solid var(--border)',
                    background: 'transparent', color: isDark ? '#fff' : '#1e293b', outline: 'none'
                }} />
                <select value={from} onChange={e => setFrom(e.target.value)} style={{
                    padding: '10px', borderRadius: '10px', border: '1px solid var(--border)',
                    background: isDark ? '#1a1a2e' : '#fff', color: isDark ? '#fff' : '#1e293b'
                }}>
                    <option>EUR</option><option>USD</option><option>GBP</option><option>RSD</option>
                </select>
            </div>
            <div style={{ textAlign: 'center', opacity: 0.5 }}><ArrowLeftRight size={16} /></div>
            <div style={{
                padding: '15px', borderRadius: '12px', background: 'var(--accent-glow)',
                border: '1.5px dashed var(--accent)', textAlign: 'center'
            }}>
                <div style={{ fontSize: '11px', fontWeight: '800', textTransform: 'uppercase', marginBottom: '4px' }}>Result in {to}</div>
                <div style={{ fontSize: '20px', fontWeight: '900', color: 'var(--accent)' }}>
                    {currencyManager.formatCurrency(result, to)}
                </div>
            </div>
            <select value={to} onChange={e => setTo(e.target.value)} style={{
                padding: '10px', borderRadius: '10px', border: '1px solid var(--border)',
                background: isDark ? '#1a1a2e' : '#fff', color: isDark ? '#fff' : '#1e293b'
            }}>
                <option>RSD</option><option>EUR</option><option>USD</option><option>GBP</option>
            </select>
        </div>
    );
};

interface AgentNote {
    id: string;
    title: string;
    content: string;
    updatedAt: string;
}

const NotesTool: React.FC<{ isDark: boolean }> = ({ isDark }) => {
    const { pinNote, pinnedNoteIds, unpinNote } = useNotesStore();
    const [notes, setNotes] = useState<AgentNote[]>(() => {
        const saved = localStorage.getItem('prime-agent-notes');
        if (saved) {
            try { return JSON.parse(saved); } catch { return []; }
        }
        return [{ id: '1', title: 'Welcome Note', content: 'Support notes...', updatedAt: new Date().toISOString() }];
    });

    const [editingNoteId, setEditingNoteId] = useState<string | null>(null);

    useEffect(() => {
        localStorage.setItem('prime-agent-notes', JSON.stringify(notes));
    }, [notes]);

    const activeNote = notes.find(n => n.id === editingNoteId);

    const isPinned = (id: string) => pinnedNoteIds.some(pn => pn.id === id);

    const createNote = () => {
        const newNote: AgentNote = {
            id: Date.now().toString(),
            title: 'New Note',
            content: '',
            updatedAt: new Date().toISOString()
        };
        setNotes([newNote, ...notes]);
        setEditingNoteId(newNote.id);
    };

    const deleteNote = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setNotes(notes.filter(n => n.id !== id));
        if (editingNoteId === id) setEditingNoteId(null);
        unpinNote(id);
    };

    const updateNote = (id: string, updates: Partial<AgentNote>) => {
        setNotes(notes.map(n => n.id === id ? { ...n, ...updates, updatedAt: new Date().toISOString() } : n));
    };

    if (editingNoteId && activeNote) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <button onClick={() => setEditingNoteId(null)} style={{ background: 'transparent', border: 'none', color: 'var(--accent)', cursor: 'pointer' }}>
                        <BackIcon size={18} />
                    </button>
                    <input
                        value={activeNote.title}
                        onChange={e => updateNote(activeNote.id, { title: e.target.value })}
                        style={{
                            flex: 1, background: 'transparent', border: 'none', borderBottom: '1px solid var(--border)',
                            color: isDark ? '#fff' : '#1e293b', fontWeight: '800', fontSize: '14px', outline: 'none', padding: '4px'
                        }}
                    />
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            isPinned(activeNote.id) ? unpinNote(activeNote.id) : pinNote(activeNote.id);
                        }}
                        style={{
                            background: 'transparent',
                            border: 'none',
                            color: isPinned(activeNote.id) ? 'var(--accent)' : 'inherit',
                            cursor: 'pointer',
                            padding: '8px',
                            display: 'flex',
                            alignItems: 'center'
                        }}
                    >
                        <Pin size={18} fill={isPinned(activeNote.id) ? "var(--accent)" : "none"} />
                    </button>
                </div>
                <textarea
                    value={activeNote.content}
                    onChange={e => updateNote(activeNote.id, { content: e.target.value })}
                    placeholder="Start typing..."
                    style={{
                        width: '100%', height: '220px', background: 'transparent',
                        border: '1px solid var(--border)', borderRadius: '12px',
                        padding: '12px', color: isDark ? '#fff' : '#1e293b',
                        fontSize: '13px', outline: 'none', resize: 'none', lineHeight: '1.6'
                    }}
                />
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button onClick={createNote} style={{
                width: '100%', padding: '10px', borderRadius: '12px', border: '1.5px dashed var(--accent)',
                background: 'var(--accent-glow)', color: 'var(--accent)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: '800', fontSize: '12px'
            }}>
                <Plus size={16} /> NEW NOTE
            </button>

            <div style={{ maxHeight: '250px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {notes.map(note => (
                    <div
                        key={note.id}
                        onClick={() => setEditingNoteId(note.id)}
                        style={{
                            padding: '12px', borderRadius: '12px', background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
                            cursor: 'pointer', border: '1px solid transparent', transition: '0.2s', position: 'relative'
                        }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                        onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <FileText size={16} color="var(--accent)" />
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: '700', fontSize: '13px', color: isDark ? '#fff' : '#1e293b' }}>{note.title || 'Untitled'}</div>
                                <div style={{ fontSize: '11px', opacity: 0.5 }}>{new Date(note.updatedAt).toLocaleDateString()}</div>
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    onClick={(e) => { e.stopPropagation(); isPinned(note.id) ? unpinNote(note.id) : pinNote(note.id); }}
                                    style={{ background: 'transparent', border: 'none', color: isPinned(note.id) ? 'var(--accent)' : 'inherit', opacity: isPinned(note.id) ? 1 : 0.3, cursor: 'pointer' }}
                                >
                                    <Pin size={14} />
                                </button>
                                <button onClick={(e) => deleteNote(e, note.id)} style={{
                                    background: 'transparent', border: 'none', color: '#ef4444', opacity: 0.5, cursor: 'pointer', padding: '4px'
                                }}>
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const ClockSettingsTool: React.FC<{
    isDark: boolean;
    cities: CityTime[];
    onAdd: (c: CityTime) => void;
    onRemove: (name: string) => void;
}> = ({ isDark, cities, onAdd, onRemove }) => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <div style={{ fontWeight: '700', fontSize: '12px', opacity: 0.6, textTransform: 'uppercase' }}>Current Clocks</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {cities.map(c => (
                    <div key={c.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'rgba(0,0,0,0.05)', borderRadius: '8px' }}>
                        <span style={{ fontWeight: '700', color: isDark ? '#fff' : '#111' }}>{c.name}</span>
                        <button onClick={() => onRemove(c.name)} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={14} /></button>
                    </div>
                ))}
            </div>

            <div style={{ height: '1px', background: 'var(--border)', margin: '10px 0' }} />
            <div style={{ fontWeight: '700', fontSize: '12px', opacity: 0.6, textTransform: 'uppercase' }}>Add World Clock</div>
            <div style={{ maxHeight: '150px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {AVAILABLE_ZONES.filter(z => !cities.some(c => c.name === z.name)).map(z => (
                    <button
                        key={z.tz}
                        onClick={() => onAdd({ name: z.name, timezone: z.tz })}
                        style={{ textAlign: 'left', padding: '10px', background: 'transparent', border: 'none', color: isDark ? '#ccc' : '#444', cursor: 'pointer', borderRadius: '8px' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--accent-glow)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                    >
                        {z.name} ({z.tz})
                    </button>
                ))}
            </div>
        </div>
    );
};

const UnitsTool: React.FC<{ isDark: boolean }> = ({ isDark }) => {
    const [val, setVal] = useState(1);
    const [type, setType] = useState('km_mi');
    const convert = () => {
        if (type === 'km_mi') return (val * 0.621371).toFixed(2) + ' Mi';
        if (type === 'mi_km') return (val * 1.60934).toFixed(2) + ' Km';
        if (type === 'c_f') return ((val * 9 / 5) + 32).toFixed(1) + ' °F';
        if (type === 'f_c') return ((val - 32) * 5 / 9).toFixed(1) + ' °C';
        return val;
    };
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <select value={type} onChange={e => setType(e.target.value)} style={{
                padding: '12px', borderRadius: '10px', border: '1px solid var(--border)',
                background: isDark ? '#1a1a2e' : '#fff', color: isDark ? '#fff' : '#1e293b'
            }}>
                <option value="km_mi">Kilometers to Miles</option>
                <option value="mi_km">Miles to Kilometers</option>
                <option value="c_f">Celsius to Fahrenheit</option>
                <option value="f_c">Fahrenheit to Celsius</option>
            </select>
            <input type="number" value={val} onChange={e => setVal(Number(e.target.value))} style={{
                padding: '12px', borderRadius: '10px', border: '1px solid var(--border)',
                background: 'transparent', color: isDark ? '#fff' : '#1e293b'
            }} />
            <div style={{
                padding: '15px', borderRadius: '12px', background: isDark ? 'rgba(255,255,255,0.05)' : '#f8fafc',
                textAlign: 'center', fontSize: '24px', fontWeight: '900', color: 'var(--accent)'
            }}>
                {convert()}
            </div>
        </div>
    );
};

const SystemFooter: React.FC = () => {
    const { theme } = useThemeStore();
    const isDark = theme === 'navy';
    const [startIndex, setStartIndex] = useState(0);
    const visibleCount = 5;

    const [cities, setCities] = useState<CityTime[]>(() => {
        const saved = localStorage.getItem('prime-agent-clocks');
        if (saved) {
            try { return JSON.parse(saved); } catch { return DEFAULT_CITIES; }
        }
        return DEFAULT_CITIES;
    });

    const [weatherCities, setWeatherCities] = useState<string[]>(() => {
        const saved = localStorage.getItem('prime-weather-cities');
        return saved ? JSON.parse(saved) : ['Dubai', 'London', 'New York'];
    });

    useEffect(() => {
        localStorage.setItem('prime-weather-clocks', JSON.stringify(cities));
        localStorage.setItem('prime-weather-cities', JSON.stringify(weatherCities));
    }, [cities, weatherCities]);

    const nextCities = () => {
        setStartIndex((prev) => (prev + 1) % cities.length);
    };

    const prevCities = () => {
        setStartIndex((prev) => (prev - 1 + cities.length) % cities.length);
    };

    const visibleCities = useMemo(() => {
        const result = [];
        for (let i = 0; i < Math.min(visibleCount, cities.length); i++) {
            result.push(cities[(startIndex + i) % cities.length]);
        }
        return result;
    }, [startIndex, cities]);

    const [activeTool, setActiveTool] = useState<string | null>(null);

    const utilityIcons = [
        { id: 'clocks', icon: <ClockIcon size={14} />, label: 'Clock Settings', color: 'var(--accent)' },
        { id: 'weather-settings', icon: <MapPin size={14} />, label: 'Weather Settings', color: '#3b82f6' },
        { id: 'weather', icon: <Cloud size={14} />, label: 'Weather', color: '#3b82f6' },
        { id: 'calc', icon: <Calculator size={14} />, label: 'Calculator', color: '#10b981' },
        { id: 'currency', icon: <RefreshCcw size={14} />, label: 'Currency', color: '#f59e0b' },
        { id: 'units', icon: <ArrowLeftRight size={14} />, label: 'Units', color: '#8b5cf6' },
        { id: 'notes', icon: <StickyNote size={14} />, label: 'Notes', color: '#ec4899' },
        { id: 'notepad', icon: <Edit3 size={14} />, label: 'Notepad Editor', color: '#6366f1' }
    ];

    return (
        <footer className="system-footer" style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            height: '40px',
            background: isDark ? 'rgba(7, 11, 20, 0.93)' : 'rgba(255, 255, 255, 0.93)',
            backdropFilter: 'blur(12px)',
            borderTop: isDark ? '1px solid rgba(255,255,255,0.06)' : '1px solid rgba(0,0,0,0.06)',
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
            {/* Left Side: Brand & World Clock */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '30px', flex: 1 }}>
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

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button onClick={prevCities} style={{
                        background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer',
                        padding: '4px', display: 'flex', alignItems: 'center', opacity: 0.5
                    }}>
                        <ChevronLeft size={16} />
                    </button>

                    <div style={{ display: 'flex', gap: '20px', minWidth: '480px' }}>
                        <AnimatePresence mode="popLayout">
                            {visibleCities.map((city) => (
                                <motion.div
                                    key={city.name}
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    transition={{ duration: 0.3 }}
                                    style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}
                                >
                                    <span style={{ fontWeight: '700', textTransform: 'uppercase', fontSize: '9px', opacity: 0.7 }}>{city.name}:</span>
                                    <span style={{ fontWeight: '900', color: isDark ? '#fff' : '#1e293b', fontFamily: 'monospace', fontSize: '11px' }}>
                                        <TimeDisplay timezone={city.timezone} />
                                    </span>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>

                    <button onClick={nextCities} style={{
                        background: 'transparent', border: 'none', color: 'inherit', cursor: 'pointer',
                        padding: '4px', display: 'flex', alignItems: 'center', opacity: 0.5
                    }}>
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>

            {/* ACTIVE TOOL PANEL */}
            <AnimatePresence>
                {activeTool === 'clocks' && (
                    <ToolPanel isDark={isDark} title="Clock Settings" icon={<Settings2 size={16} />} onClose={() => setActiveTool(null)}>
                        <ClockSettingsTool
                            isDark={isDark}
                            cities={cities}
                            onAdd={(c) => setCities([...cities, c])}
                            onRemove={(name) => setCities(cities.filter(c => c.name !== name))}
                        />
                    </ToolPanel>
                )}
                {activeTool === 'weather' && (
                    <ToolPanel isDark={isDark} title="World Weather" icon={<Cloud size={16} />} onClose={() => setActiveTool(null)}>
                        <WeatherTool isDark={isDark} cities={weatherCities} />
                    </ToolPanel>
                )}
                {activeTool === 'weather-settings' && (
                    <ToolPanel isDark={isDark} title="Weather Config" icon={<MapPin size={16} />} onClose={() => setActiveTool(null)}>
                        <WeatherSettingsTool
                            isDark={isDark}
                            cities={weatherCities}
                            onAdd={(c) => setWeatherCities([...weatherCities, c])}
                            onRemove={(c) => setWeatherCities(weatherCities.filter(x => x !== c))}
                        />
                    </ToolPanel>
                )}
                {activeTool === 'calc' && (
                    <ToolPanel isDark={isDark} title="Smart Calculator" icon={<Calculator size={16} />} onClose={() => setActiveTool(null)}>
                        <CalculatorTool isDark={isDark} />
                    </ToolPanel>
                )}
                {activeTool === 'currency' && (
                    <ToolPanel isDark={isDark} title="Currency Shield" icon={<RefreshCcw size={16} />} onClose={() => setActiveTool(null)}>
                        <CurrencyTool isDark={isDark} />
                    </ToolPanel>
                )}
                {activeTool === 'units' && (
                    <ToolPanel isDark={isDark} title="Unit Converter" icon={<ArrowLeftRight size={16} />} onClose={() => setActiveTool(null)}>
                        <UnitsTool isDark={isDark} />
                    </ToolPanel>
                )}
                {activeTool === 'notes' && (
                    <ToolPanel isDark={isDark} title="Agent Scratchpad" icon={<StickyNote size={16} />} onClose={() => setActiveTool(null)}>
                        <NotesTool isDark={isDark} />
                    </ToolPanel>
                )}
                {activeTool === 'notepad' && (
                    <ModernNotepad onClose={() => setActiveTool(null)} />
                )}
            </AnimatePresence>

            {/* Right Side: Utilities */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {utilityIcons.map((util, idx) => (
                    <motion.button
                        key={idx}
                        whileHover={{ scale: 1.1, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
                        whileTap={{ scale: 0.9 }}
                        title={util.label}
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
                            cursor: 'pointer',
                            transition: 'color 0.2s, background 0.2s'
                        }}
                        onMouseEnter={(e) => {
                            if (activeTool !== util.id) e.currentTarget.style.color = util.color;
                        }}
                        onMouseLeave={(e) => {
                            if (activeTool !== util.id) e.currentTarget.style.color = isDark ? '#94a3b8' : '#64748b';
                        }}
                    >
                        {util.icon}
                    </motion.button>
                ))}

                <div style={{
                    height: '16px',
                    width: '1px',
                    background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                    margin: '0 8px'
                }} />

                <div style={{ fontSize: '9px', fontWeight: '800', opacity: 0.5 }}>
                    V1.4.2-STABLE
                </div>
            </div>
        </footer>
    );
};

export default SystemFooter;
