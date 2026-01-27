import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Navigation,
    ArrowLeft,
    Plus,
    Plane,
    Bus,
    Ship,
    Train,
    Trash2,
    Search
} from 'lucide-react';
import { transportProviderManager } from '../../services/providers/TransportProviderManager';
import { type TransportSegment } from '../../services/providers/TransportProviderInterface';

interface TransportProps {
    onBack: () => void;
}

const Transport: React.FC<TransportProps> = ({ onBack }) => {
    const [segments, setSegments] = useState<TransportSegment[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeType, setActiveType] = useState<string>('All');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const loadTransport = async () => {
            setIsLoading(true);
            const data = await transportProviderManager.getAllSegments();
            setSegments(data);
            setIsLoading(false);
        };
        loadTransport();
    }, []);

    const saveTransport = async (updated: TransportSegment[]) => {
        setSegments(updated);
        // In this implementation, we assume we're saving to local
        // A more advanced one would find which provider the segment belongs to
    };

    const addSegment = async () => {
        const newSeg: TransportSegment = {
            id: Math.random().toString(36).substr(2, 9),
            providerName: 'Local',
            type: 'Flight',
            fromCity: '',
            toCity: '',
            basePrice: 0,
            currency: 'EUR',
            availableSeats: 0,
            status: 'draft'
        };
        await transportProviderManager.saveSegment(newSeg);
        setSegments([...segments, newSeg]);
    };

    const deleteSegment = async (id: string) => {
        await transportProviderManager.deleteSegment(id);
        setSegments(segments.filter(s => s.id !== id));
    };

    const updateSegment = async (updatedSeg: TransportSegment) => {
        await transportProviderManager.saveSegment(updatedSeg);
        setSegments(segments.map(s => s.id === updatedSeg.id ? updatedSeg : s));
    };

    const filteredSegments = segments.filter(s => {
        const matchesType = activeType === 'All' || s.type === activeType;
        const matchesSearch = s.fromCity.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.toCity.toLowerCase().includes(searchQuery.toLowerCase()) ||
            s.carrierName?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesType && matchesSearch;
    });

    return (
        <div className="module-container fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button onClick={onBack} className="btn-icon circle">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h2 className="title-gradient">Upravljanje Prevozom</h2>
                        <p className="subtitle">Avio, bus, brod i vozne linije</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                        <input
                            type="text"
                            placeholder="Pretraži rute..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="search-input"
                            style={{ paddingLeft: '40px', width: '250px' }}
                        />
                    </div>
                    <button className="btn-primary" onClick={addSegment}>
                        <Plus size={18} /> Dodaj Liniju
                    </button>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', marginBottom: '32px' }}>
                {['All', 'Flight', 'Bus', 'Ship', 'Train'].map(type => (
                    <button
                        key={type}
                        onClick={() => setActiveType(type)}
                        className={`nav-btn ${activeType === type ? 'active' : ''}`}
                    >
                        {type === 'Flight' && <Plane size={16} />}
                        {type === 'Bus' && <Bus size={16} />}
                        {type === 'Ship' && <Ship size={16} />}
                        {type === 'Train' && <Train size={16} />}
                        {type === 'All' && <Navigation size={16} />}
                        {type === 'All' ? 'Svi tipovi' : type}
                    </button>
                ))}
            </div>

            <div className="dashboard-grid">
                <AnimatePresence>
                    {filteredSegments.map((seg) => (
                        <motion.div
                            key={seg.id}
                            layout
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="app-card"
                            style={{ padding: '24px' }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                                <div style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '12px',
                                    background: 'var(--accent-glow)',
                                    color: 'var(--accent)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    {seg.type === 'Flight' && <Plane size={24} />}
                                    {seg.type === 'Bus' && <Bus size={24} />}
                                    {seg.type === 'Ship' && <Ship size={24} />}
                                    {seg.type === 'Train' && <Train size={24} />}
                                </div>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button className="btn-icon" onClick={() => deleteSegment(seg.id)} style={{ color: '#ef4444' }}>
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Polazak</label>
                                    <input
                                        type="text"
                                        value={seg.fromCity}
                                        onChange={e => {
                                            const next = segments.map(s => s.id === seg.id ? { ...s, fromCity: e.target.value } : s);
                                            saveTransport(next);
                                        }}
                                        className="matrix-input"
                                        placeholder="Grad polaska"
                                    />
                                </div>
                                <Navigation size={16} style={{ marginTop: '20px', color: 'var(--accent)' }} />
                                <div style={{ flex: 1 }}>
                                    <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Odredište</label>
                                    <input
                                        type="text"
                                        value={seg.toCity}
                                        onChange={e => {
                                            const next = segments.map(s => s.id === seg.id ? { ...s, toCity: e.target.value } : s);
                                            saveTransport(next);
                                        }}
                                        className="matrix-input"
                                        placeholder="Grad dolaska"
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div>
                                    <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Cena (€)</label>
                                    <input
                                        type="number"
                                        value={seg.basePrice}
                                        onChange={e => {
                                            const next = segments.map(s => s.id === seg.id ? { ...s, basePrice: parseFloat(e.target.value) || 0 } : s);
                                            saveTransport(next);
                                        }}
                                        className="matrix-input"
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Mesta</label>
                                    <input
                                        type="number"
                                        value={seg.availableSeats}
                                        onChange={e => {
                                            const next = segments.map(s => s.id === seg.id ? { ...s, availableSeats: parseInt(e.target.value) || 0 } : s);
                                            saveTransport(next);
                                        }}
                                        className="matrix-input"
                                    />
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {filteredSegments.length === 0 && !isLoading && (
                    <div className="module-card add-new" onClick={addSegment}>
                        <Plus className="add-icon" size={32} />
                        <span className="add-text">Dodaj prvu liniju prevoza</span>
                    </div>
                )}
            </div>

            <style>{`
                .title-gradient {
                    font-size: 24px;
                    font-weight: 700;
                    background: linear-gradient(135deg, #fff 0%, #9198a1 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }
                .subtitle {
                    color: var(--text-secondary);
                    font-size: 14px;
                    margin-top: 4px;
                }
                .circle {
                    border-radius: 50% !important;
                }
            `}</style>
        </div>
    );
};

export default Transport;
