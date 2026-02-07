import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft,
    Brain,
    Sparkles,
    Upload,
    Save,
    RefreshCw,
    X,
    Check,
    ChevronRight,
    TrendingUp,
    Plus,
    Zap,
    Calendar,
    Settings,
    Shield,
    Info,
    Layout,
    Database,
    Table as TableIcon
} from 'lucide-react';
import { loadFromCloud, saveToCloud } from '../utils/storageUtils';
import { useConfig } from '../context/ConfigContext';
import { multiKeyAI } from '../services/multiKeyAI';

// --- Types ---
interface PriceOption {
    id: string;
    period: string;
    roomType: string;
    mealPlan: string;
    price: number;
    currency: string;
    occupancy: string;
    status: 'current' | 'suggested' | 'pending';
    source?: string;
}

interface OccupancyRule {
    id: string;
    roomTypeId: string;
    adlCount: number;
    chd1Count: number;
    chd2Count: number;
    chd3Count: number;
    infantCount: number;
    allowChildSharingBed: boolean;
    discountType: 'percent' | 'fixed';
    chd1Discount: number;
    chd2Discount: number;
    chd3Discount: number;
    infantPrice: number;
    // New: Adult Extra Bed Discounts (3rd, 4th, 5th adult)
    adl3Discount: number;
    adl4Discount: number;
    adl5Discount: number;
    isActive: boolean;
    label: string;
}

interface AIAdjustment {
    id: string;
    targetId: string;
    originalValue: number;
    newValue: number;
    reason: string;
    confidence: number;
}

const HotelPrices: React.FC = () => {
    const { hotelSlug } = useParams<{ hotelSlug: string }>();
    const navigate = useNavigate();
    const { config } = useConfig();

    const [hotel, setHotel] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [prices, setPrices] = useState<PriceOption[]>([]);
    const [occupancyRules, setOccupancyRules] = useState<OccupancyRule[]>([]);
    const [ageSettings, setAgeSettings] = useState({
        infantMax: 2,
        chd1Max: 7,
        chd2Max: 12,
        chd3Max: 15
    });
    const [pendingAdjustments, setPendingAdjustments] = useState<AIAdjustment[]>([]);
    const [isAILoading, setIsAILoading] = useState(false);
    const [aiStatus, setAiStatus] = useState<'idle' | 'analyzing' | 'suggesting'>('idle');
    const [chatInput, setChatInput] = useState('');
    const [chatHistory, setChatHistory] = useState<{ role: 'user' | 'ai', text: string }[]>([]);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Initial Load
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const { success, data } = await loadFromCloud('properties');
            let hotels = [];
            if (success && data) hotels = data;
            else {
                const saved = localStorage.getItem('olympic_hub_hotels');
                if (saved) hotels = JSON.parse(saved);
            }

            const found = hotels.find((h: any) => {
                const slug = h.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
                return slug === hotelSlug || h.id.toString() === hotelSlug;
            });

            if (found) {
                setHotel(found);
                // Mock initial prices if none exist
                const initialPrices: PriceOption[] = [
                    { id: 'p1', period: '01.06 - 30.06', roomType: 'Standard Room', mealPlan: 'HB', price: 85, currency: 'EUR', occupancy: '2 ADL', status: 'current' },
                    { id: 'p2', period: '01.07 - 31.08', roomType: 'Standard Room', mealPlan: 'HB', price: 110, currency: 'EUR', occupancy: '2 ADL', status: 'current' },
                    { id: 'p3', period: '01.09 - 30.09', roomType: 'Standard Room', mealPlan: 'HB', price: 90, currency: 'EUR', occupancy: '2 ADL', status: 'current' },
                    { id: 'p4', period: '01.06 - 30.06', roomType: 'Family Suite', mealPlan: 'HB', price: 140, currency: 'EUR', occupancy: '2 ADL + 2 CHD', status: 'current' },
                ];
                setPrices(initialPrices);
            }
            setLoading(false);
        };
        fetchData();
    }, [hotelSlug]);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsAILoading(true);
        setAiStatus('analyzing');

        // Simulate AI analysis of file
        setTimeout(() => {
            const newAdjustments: AIAdjustment[] = [
                {
                    id: 'adj1',
                    targetId: 'p2',
                    originalValue: 110,
                    newValue: 125,
                    reason: 'Tržišna analiza pokazuje povećanu potražnju za Jul/Avg period. Konkurentski hoteli su podigli cene za 15%.',
                    confidence: 0.94
                },
                {
                    id: 'adj2',
                    targetId: 'p3',
                    originalValue: 90,
                    newValue: 95,
                    reason: 'Rana rezervacija za septembar je iznad proseka. Preporučuje se blagi porast.',
                    confidence: 0.88
                }
            ];
            setPendingAdjustments(newAdjustments);
            setAiStatus('suggesting');
            setIsAILoading(false);

            setChatHistory(prev => [...prev, {
                role: 'ai',
                text: `Analizirao sam vaš fajl "${file.name}". Detektovao sam mogućnosti za optimizaciju cena na osnovu trenutnih trendova na tržištu. Pogledajte predložene izmene u desnom panelu.`
            }]);
        }, 2500);
    };

    const approveAdjustment = async (adj: AIAdjustment) => {
        const updatedPrices = prices.map(p => p.id === adj.targetId ? { ...p, price: adj.newValue } : p);
        setPrices(updatedPrices);
        setPendingAdjustments(prev => prev.filter(a => a.id !== adj.id));
        if (pendingAdjustments.length === 1) setAiStatus('idle');

        // Persist change
        await saveToCloud('property_prices', updatedPrices);
    };

    const rejectAdjustment = (adjId: string) => {
        setPendingAdjustments(prev => prev.filter(a => a.id !== adjId));
        if (pendingAdjustments.length === 1) setAiStatus('idle');
    };

    const handleChatSubmit = async () => {
        if (!chatInput.trim()) return;

        const userText = chatInput.toLowerCase();
        setChatHistory(prev => [...prev, { role: 'user', text: chatInput }]);
        setChatInput('');
        setIsAILoading(true);

        // Simulation for "Generiši pravila" command
        if (userText.includes('generiši') || userText.includes('pravila')) {
            setTimeout(() => {
                const isRoom4 = userText.includes('1/4') || userText.includes('četvorokrevetn');

                // Extract discounts
                const chd1 = userText.includes('70') ? 70 : 100;
                const chd2 = userText.includes('50') ? 50 : 80;
                const chd3 = userText.includes('20') ? 20 : 50;

                // Adult extra bed discount simulation
                const adlDisc = userText.includes('3. odrast') ? 30 : 20;

                const generated: OccupancyRule[] = [];

                // Generate basic combinations (1-3 for standard, 1-5 for family)
                const maxAdl = isRoom4 ? 5 : 3;

                for (let adl = 1; adl <= maxAdl; adl++) {
                    generated.push({
                        id: `rule-${Date.now()}-${adl}`,
                        roomTypeId: isRoom4 ? '1/4' : '1/2+1',
                        adlCount: adl,
                        chd1Count: 0,
                        chd2Count: 0,
                        chd3Count: 0,
                        infantCount: 1,
                        allowChildSharingBed: true,
                        discountType: 'percent',
                        chd1Discount: chd1,
                        chd2Discount: chd2,
                        chd3Discount: chd3,
                        infantPrice: 0,
                        adl3Discount: adl >= 3 ? adlDisc : 0,
                        adl4Discount: adl >= 4 ? adlDisc : 0,
                        adl5Discount: adl >= 5 ? adlDisc : 0,
                        isActive: true,
                        label: `${adl} ADL + Pravila za decu`
                    });
                }

                setOccupancyRules(prev => [...prev, ...generated]);
                setChatHistory(prev => [...prev, {
                    role: 'ai',
                    text: `Izgenerisao sam ${generated.length} pravila sa popustima: CHD(70/50/20%) i popustom za 3./4./5. odraslu osobu od ${adlDisc}%.`
                }]);
                setIsAILoading(false);
            }, 1500);
            return;
        }

        // Standard multiKeyAI logic
        try {
            const prompt = `Ti si Price AI Assistant za Olympic Hub ERP. Upravljaš cenama za hotel ${hotel.name}. 
            Korisnik kaže: "${chatInput}"
            Trenutne cene: ${JSON.stringify(prices)}
            Pravila zauzetosti: ${JSON.stringify(occupancyRules)}
            Odgovori profesionalno na srpskom jeziku i predloži konkretne akcije ako je potrebno.`;

            const responseText = await multiKeyAI.generateContent(prompt, {
                useCache: true,
                cacheCategory: 'prices',
                model: "gemini-2.0-flash"
            });

            setChatHistory(prev => [...prev, { role: 'ai', text: responseText }]);
        } catch (e) {
            console.error('AI Error:', e);
            setChatHistory(prev => [...prev, { role: 'ai', text: "Greška u AI modulu. Proverite sistemski log." }]);
        } finally {
            setIsAILoading(false);
        }
    };

    if (loading) return <div className="loading-container">Učitavanje...</div>;

    return (
        <div className="module-container fade-in" style={{
            background: 'radial-gradient(circle at 100% 0%, rgba(59, 130, 246, 0.05) 0%, transparent 50%)',
            minHeight: 'calc(100vh - 80px)',
            padding: '20px',
            display: 'grid',
            gridTemplateColumns: '1fr 400px',
            gap: '24px',
            overflow: 'hidden'
        }}>
            {/* Left Content Area */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', overflowY: 'auto', paddingRight: '12px' }}>

                {/* Header - Glass Effect */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingBottom: '24px',
                    borderBottom: '1px solid rgba(255,255,255,0.05)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => navigate(`/production/hotels/${hotelSlug}`)}
                            className="btn-icon circle"
                            style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}
                        >
                            <ArrowLeft size={20} />
                        </motion.button>
                        <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                <h1 style={{ fontSize: '32px', fontWeight: '900', margin: 0, background: 'linear-gradient(to bottom, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.02em' }}>
                                    Yield Intelligence
                                </h1>
                                <div style={{ background: 'var(--gradient-blue)', color: '#fff', padding: '4px 10px', borderRadius: '100px', fontSize: '10px', fontWeight: 800 }}>LIVE ANALYTICS</div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                                <Database size={14} /> <span>{hotel ? hotel.name : 'Učitavanje...'}</span>
                                <ChevronRight size={12} /> <span style={{ color: 'var(--accent)' }}>Cenovnici i Pravila</span>
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                        <button className="btn-glass" onClick={() => fileInputRef.current?.click()} style={{ borderRadius: '12px' }}>
                            <Upload size={18} /> Uvezi Podatke
                        </button>
                        <input type="file" ref={fileInputRef} onChange={handleFileUpload} style={{ display: 'none' }} accept=".pdf,.doc,.docx,.xls,.xlsx,.json" />
                        <button className="btn-primary-action" style={{ background: 'var(--gradient-blue)', borderRadius: '12px', padding: '0 24px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Save size={18} /> Sačuvaj Strategiju
                        </button>
                    </div>
                </div>

                {/* AI Status Dashboard - Orchestrator Theme */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '24px'
                }}>
                    <motion.div
                        whileHover={{ y: -5, scale: 1.02 }}
                        style={{
                            background: 'rgba(30, 41, 59, 0.4)',
                            backdropFilter: 'blur(12px)',
                            border: '1px solid rgba(59, 130, 246, 0.2)',
                            borderRadius: '24px',
                            padding: '24px',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: 'var(--gradient-blue)' }}></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Yield Performance</span>
                            <Zap size={18} color="#3b82f6" fill="#3b82f644" />
                        </div>
                        <div style={{ fontSize: '28px', fontWeight: '900', color: '#fff', letterSpacing: '-0.02em' }}>94.2%</div>
                        <div style={{ fontSize: '12px', color: '#10b981', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                            <TrendingUp size={14} /> +2.4% vs 2025
                        </div>
                    </motion.div>

                    <motion.div
                        whileHover={{ y: -5, scale: 1.02 }}
                        style={{
                            background: 'rgba(30, 41, 59, 0.4)',
                            backdropFilter: 'blur(12px)',
                            border: '1px solid rgba(16, 185, 129, 0.2)',
                            borderRadius: '24px',
                            padding: '24px',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: 'var(--gradient-green)' }}></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>REVPAR Forecast</span>
                            <TrendingUp size={18} color="#10b981" />
                        </div>
                        <div style={{ fontSize: '28px', fontWeight: '900', color: '#fff', letterSpacing: '-0.02em' }}>€ 118.50</div>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '8px', fontWeight: 600 }}>Projected Target Q3</div>
                    </motion.div>

                    <motion.div
                        whileHover={{ y: -5, scale: 1.02 }}
                        style={{
                            background: 'rgba(30, 41, 59, 0.4)',
                            backdropFilter: 'blur(12px)',
                            border: '1px solid rgba(139, 92, 246, 0.2)',
                            borderRadius: '24px',
                            padding: '24px',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: 'var(--gradient-purple)' }}></div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                            <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>AI Intelligence</span>
                            <Brain size={18} color="#8b5cf6" fill="#8b5cf644" />
                        </div>
                        <div style={{ fontSize: '28px', fontWeight: '900', color: '#fff', letterSpacing: '-0.02em' }}>{pendingAdjustments.length} <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>Pending</span></div>
                        <div style={{ fontSize: '12px', color: '#a78bfa', marginTop: '8px', fontWeight: 600 }}>Smart Optimizations</div>
                    </motion.div>
                </div>

                {/* Primary Price Table - Glass Card */}
                <div style={{
                    background: 'rgba(30, 41, 59, 0.4)',
                    backdropFilter: 'blur(12px)',
                    borderRadius: '24px',
                    border: '1px solid rgba(255,255,255,0.05)',
                    overflow: 'hidden'
                }}>
                    <div style={{ padding: '24px 32px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <TableIcon size={20} color="var(--accent)" />
                            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#fff' }}>Glavna Matrica Cena</h3>
                        </div>
                        <button className="btn-glass" style={{ padding: '8px 16px', fontSize: '12px', borderRadius: '10px' }}>
                            <Plus size={14} /> New Entry
                        </button>
                    </div>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                    <th style={{ padding: '20px 32px', fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>VREMENSKI OKVIR</th>
                                    <th style={{ padding: '20px 32px', fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>JEDINICA / TIP</th>
                                    <th style={{ padding: '20px 32px', fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em' }}>USLUGA</th>
                                    <th style={{ padding: '20px 32px', fontSize: '11px', color: 'var(--text-secondary)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>VREDNOST</th>
                                </tr>
                            </thead>
                            <tbody>
                                {prices.map(p => {
                                    const adj = pendingAdjustments.find(a => a.targetId === p.id);
                                    return (
                                        <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s', background: adj ? 'rgba(59, 130, 246, 0.03)' : 'transparent' }}>
                                            <td style={{ padding: '20px 32px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
                                                        <Calendar size={16} />
                                                    </div>
                                                    <span style={{ fontWeight: '700', fontSize: '14px' }}>{p.period}</span>
                                                </div>
                                            </td>
                                            <td style={{ padding: '20px 32px' }}>
                                                <div style={{ fontSize: '14px', fontWeight: '600' }}>{p.roomType}</div>
                                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>{p.occupancy}</div>
                                            </td>
                                            <td style={{ padding: '20px 32px' }}>
                                                <span style={{ padding: '6px 12px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', borderRadius: '8px', fontSize: '11px', fontWeight: '800', border: '1px solid rgba(59, 130, 246, 0.2)' }}>{p.mealPlan}</span>
                                            </td>
                                            <td style={{ padding: '20px 32px', textAlign: 'right' }}>
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                                    <span style={{ color: adj ? 'var(--text-secondary)' : '#fff', textDecoration: adj ? 'line-through' : 'none', fontSize: adj ? '12px' : '16px', fontWeight: '800' }}>
                                                        {p.price} {p.currency}
                                                    </span>
                                                    {adj && (
                                                        <motion.span
                                                            initial={{ x: 10, opacity: 0 }}
                                                            animate={{ x: 0, opacity: 1 }}
                                                            style={{ color: '#10b981', fontWeight: '900', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '4px' }}
                                                        >
                                                            {adj.newValue} {p.currency} <Sparkles size={14} />
                                                        </motion.span>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* --- Rules Console Section --- */}
                {occupancyRules.length > 0 && (
                    <div style={{
                        background: 'rgba(30, 41, 59, 0.4)',
                        backdropFilter: 'blur(12px)',
                        borderRadius: '32px',
                        border: '1px solid rgba(139, 92, 246, 0.2)',
                        padding: '40px',
                        marginTop: '12px',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: 'var(--gradient-purple)' }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(139, 92, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a78bfa' }}>
                                    <Zap size={20} />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#fff' }}>Konzola Saglasnosti</h3>
                                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>Yield & Occupancy Rules Engine</div>
                                </div>
                            </div>

                            {/* Flexibilne Godine UI - Yield Settings */}
                            <div style={{
                                display: 'flex',
                                gap: '20px',
                                padding: '16px 24px',
                                background: 'rgba(30, 41, 59, 0.6)',
                                backdropFilter: 'blur(10px)',
                                borderRadius: '20px',
                                border: '1px solid rgba(59, 130, 246, 0.2)',
                                alignItems: 'center',
                                boxShadow: 'inset 0 0 20px rgba(0,0,0,0.2)'
                            }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '4px' }}>
                                    <Settings size={14} color="var(--accent)" />
                                    <span style={{ fontSize: '11px', fontWeight: '900', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Yield Definitions:</span>
                                </div>
                                {['infantMax', 'chd1Max', 'chd2Max', 'chd3Max'].map(key => (
                                    <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8' }}>{key.replace('Max', '').toUpperCase()}</span>
                                        <div style={{ position: 'relative' }}>
                                            <input
                                                type="number"
                                                value={(ageSettings as any)[key]}
                                                onChange={e => setAgeSettings({ ...ageSettings, [key]: parseInt(e.target.value) })}
                                                style={{
                                                    width: '44px',
                                                    background: 'rgba(255,255,255,0.05)',
                                                    border: '1px solid rgba(255,255,255,0.1)',
                                                    color: '#fff',
                                                    borderRadius: '10px',
                                                    textAlign: 'center',
                                                    fontSize: '13px',
                                                    fontWeight: 800,
                                                    padding: '6px 0',
                                                    outline: 'none',
                                                    transition: 'all 0.2s'
                                                }}
                                                className="age-input"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div style={{ overflowX: 'auto', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                                <thead>
                                    <tr style={{ textAlign: 'left', background: 'rgba(0,0,0,0.2)', color: 'var(--text-secondary)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                        <th style={{ padding: '16px' }}>STAT</th>
                                        <th style={{ padding: '16px' }}>STRUKTURA</th>
                                        <th style={{ padding: '16px' }}>CHD % (1/2/3)</th>
                                        <th style={{ padding: '16px' }}>3./4./5. ADL %</th>
                                        <th style={{ padding: '16px' }}>OPCIJE</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {occupancyRules.map((rule, idx) => (
                                        <tr key={rule.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', background: rule.isActive ? 'transparent' : 'rgba(239, 68, 68, 0.02)' }}>
                                            <td style={{ padding: '16px' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={rule.isActive}
                                                    onChange={e => {
                                                        const updated = [...occupancyRules];
                                                        updated[idx].isActive = e.target.checked;
                                                        setOccupancyRules(updated);
                                                    }}
                                                    style={{ width: '18px', height: '18px', accentColor: 'var(--accent)' }}
                                                />
                                            </td>
                                            <td style={{ padding: '16px' }}>
                                                <div style={{ fontWeight: '800', color: '#fff' }}>{rule.adlCount} Odraslih</div>
                                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Rule ID: {rule.id.slice(-6)}</div>
                                            </td>
                                            <td style={{ padding: '16px' }}>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    {[1, 2, 3].map(n => (
                                                        <input
                                                            key={n}
                                                            type="number"
                                                            value={(rule as any)[`chd${n}Discount`]}
                                                            onChange={e => {
                                                                const updated = [...occupancyRules];
                                                                (updated[idx] as any)[`chd${n}Discount`] = parseInt(e.target.value);
                                                                setOccupancyRules(updated);
                                                            }}
                                                            style={{ width: '45px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px', padding: '4px', textAlign: 'center', fontSize: '12px', fontWeight: 700 }}
                                                        />
                                                    ))}
                                                </div>
                                            </td>
                                            <td style={{ padding: '16px' }}>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    {[3, 4, 5].map(n => (
                                                        <input
                                                            key={n}
                                                            type="number"
                                                            value={(rule as any)[`adl${n}Discount`] || 0}
                                                            onChange={e => {
                                                                const updated = [...occupancyRules];
                                                                (updated[idx] as any)[`adl${n}Discount`] = parseInt(e.target.value);
                                                                setOccupancyRules(updated);
                                                            }}
                                                            style={{ width: '45px', background: 'rgba(16, 185, 129, 0.05)', border: '1px solid rgba(16, 185, 129, 0.2)', color: '#10b981', borderRadius: '6px', padding: '4px', textAlign: 'center', fontSize: '12px', fontWeight: 800 }}
                                                            title={`${n}. odrasla osoba popust`}
                                                        />
                                                    ))}
                                                </div>
                                            </td>
                                            <td style={{ padding: '16px' }}>
                                                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                                    <input
                                                        type="checkbox"
                                                        checked={rule.allowChildSharingBed}
                                                        onChange={e => {
                                                            const updated = [...occupancyRules];
                                                            updated[idx].allowChildSharingBed = e.target.checked;
                                                            setOccupancyRules(updated);
                                                        }}
                                                        style={{ width: '16px', height: '16px', accentColor: '#3b82f6' }}
                                                    />
                                                    <span style={{ fontSize: '11px', fontWeight: 700, color: rule.allowChildSharingBed ? '#3b82f6' : 'var(--text-secondary)' }}>
                                                        {rule.allowChildSharingBed ? 'DELI LEŽAJ' : 'BEZ DELJENJA'}
                                                    </span>
                                                </label>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* Right Assistant Sidebar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* AI Processing Card */}
                <div style={{
                    background: 'rgba(30, 41, 59, 0.6)',
                    backdropFilter: 'blur(20px)',
                    borderRadius: '24px',
                    border: '1px solid rgba(139, 92, 246, 0.2)',
                    padding: '32px',
                    position: 'relative',
                    overflow: 'hidden',
                    boxShadow: '0 20px 40px rgba(0,0,0,0.3)'
                }}>
                    <div style={{ position: 'absolute', top: 0, right: 0, padding: '20px', opacity: 0.1 }}>
                        <Sparkles size={80} color="var(--accent)" />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
                        <div style={{
                            width: '52px', height: '52px', borderRadius: '16px',
                            background: 'var(--gradient-purple)', display: 'flex',
                            alignItems: 'center', justifyContent: 'center', color: '#fff',
                            boxShadow: '0 8px 16px rgba(139, 92, 246, 0.4)'
                        }}>
                            <Brain size={28} />
                        </div>
                        <div>
                            <div style={{ fontWeight: '900', fontSize: '18px', color: '#fff' }}>YIELD CO-PILOT</div>
                            <div style={{ fontSize: '11px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700 }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981', animation: 'pulse 2s infinite' }} />
                                {aiStatus !== 'idle' ? `ANALYZING: ${aiStatus.toUpperCase()}` : 'MARKET MONITOR ACTIVE'}
                            </div>
                        </div>
                    </div>

                    <AnimatePresence>
                        {pendingAdjustments.length > 0 ? (
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}>
                                <div style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>Optimization Queue ({pendingAdjustments.length})</div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    {pendingAdjustments.map(adj => (
                                        <div key={adj.id} style={{ padding: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '20px', border: '1px solid rgba(139, 92, 246, 0.1)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                <div style={{ fontSize: '13px', fontWeight: '800', color: '#fff' }}>{adj.originalValue} € → {adj.newValue} €</div>
                                                <div style={{ fontSize: '11px', fontWeight: '800', color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '2px 8px', borderRadius: '4px' }}>{Math.round(adj.confidence * 100)}% Conf.</div>
                                            </div>
                                            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 16px 0', lineHeight: '1.5' }}>{adj.reason}</p>
                                            <div style={{ display: 'flex', gap: '10px' }}>
                                                <button onClick={() => approveAdjustment(adj)} style={{ flex: 1, background: 'var(--gradient-blue)', border: 'none', borderRadius: '10px', color: '#fff', height: '36px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '12px', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' }}>
                                                    <Check size={14} style={{ marginRight: '6px' }} /> APPLY
                                                </button>
                                                <button onClick={() => rejectAdjustment(adj.id)} style={{ padding: '0 12px', background: 'rgba(239, 68, 68, 0.1)', border: 'none', borderRadius: '10px', color: '#ef4444', height: '36px', cursor: 'pointer' }}>
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '32px 20px', color: 'var(--text-secondary)' }}>
                                <motion.div animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }} style={{ display: 'inline-block', marginBottom: '16px' }}>
                                    <Sparkles size={32} color="var(--accent)" style={{ opacity: 0.4 }} />
                                </motion.div>
                                <p style={{ fontSize: '13px', fontWeight: 600 }}>Cenovnik je potpuno optimizovan.</p>
                                <div style={{ fontSize: '11px', opacity: 0.6 }}>Nema novih preporuka za ovaj period.</div>
                            </div>
                        )}
                    </AnimatePresence>
                </div>

                {/* AI Chat Logic Interface */}
                <div style={{
                    flex: 1,
                    background: 'rgba(30, 41, 59, 0.4)',
                    backdropFilter: 'blur(12px)',
                    borderRadius: '24px',
                    border: '1px solid rgba(255,255,255,0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    maxHeight: '400px'
                }}>
                    <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '13px', fontWeight: '800', color: '#fff', display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.02)' }}>
                        <Layout size={16} color="var(--accent)" /> Reasoning Console
                    </div>

                    <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        {chatHistory.length === 0 && (
                            <div style={{ color: 'var(--text-secondary)', fontSize: '12px', textAlign: 'center', marginTop: '40px', padding: '0 20px', lineHeight: '1.6' }}>
                                <Info size={24} style={{ display: 'block', margin: '0 auto 12px', opacity: 0.3 }} />
                                Koristite NLP komande za yield strategiju. Primer: "Set 30% discount for 3rd adult" ili "Analyze competitor prices".
                            </div>
                        )}
                        {chatHistory.map((msg, i) => (
                            <div key={i} style={{
                                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                                maxWidth: '85%',
                                padding: '12px 16px',
                                borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                                fontSize: '13px',
                                background: msg.role === 'user' ? 'var(--gradient-blue)' : 'rgba(255,255,255,0.05)',
                                color: '#fff',
                                border: msg.role === 'user' ? 'none' : '1px solid rgba(255,255,255,0.1)',
                                boxShadow: msg.role === 'user' ? '0 4px 12px rgba(59, 130, 246, 0.2)' : 'none'
                            }}>
                                {msg.text}
                            </div>
                        ))}
                        {isAILoading && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>
                                <RefreshCw size={14} className="spin" /> SYNTHESIZING RESPONSE...
                            </div>
                        )}
                    </div>

                    <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.05)', background: 'rgba(0,0,0,0.2)' }}>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <input
                                type="text"
                                value={chatInput}
                                onChange={e => setChatInput(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleChatSubmit()}
                                placeholder="Unesite yield komandu..."
                                style={{
                                    flex: 1,
                                    background: 'rgba(255,255,255,0.03)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    borderRadius: '12px',
                                    padding: '12px 16px',
                                    color: '#fff',
                                    fontSize: '13px',
                                    outline: 'none',
                                    fontWeight: 500
                                }}
                            />
                            <button
                                onClick={handleChatSubmit}
                                style={{
                                    width: '44px', height: '44px', borderRadius: '12px', border: 'none',
                                    background: 'var(--accent)', color: '#fff', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)'
                                }}>
                                <ChevronRight size={22} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .loading-container { display: flex; align-items: center; justify-content: center; height: 100vh; color: #fff; font-size: 20px; font-weight: 800; background: #0f172a; }
                .spin { animation: spin 2s linear infinite; }
                .age-input:focus { border-color: var(--accent) !important; background: rgba(59, 130, 246, 0.1) !important; box-shadow: 0 0 10px rgba(59, 130, 246, 0.3); }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @keyframes pulse { 0% { opacity: 0.4; scale: 0.9; } 50% { opacity: 1; scale: 1.1; } 100% { opacity: 0.4; scale: 0.9; } }
            `}</style>
        </div>
    );
};

export default HotelPrices;
