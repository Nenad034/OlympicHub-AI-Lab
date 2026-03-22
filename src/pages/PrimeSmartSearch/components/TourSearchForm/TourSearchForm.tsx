import React, { useState } from 'react';
import { useSearchStore } from '../../stores/useSearchStore';
import { MOCK_TOUR_RESULTS, TOUR_CATEGORIES, POPULAR_TOUR_DESTINATIONS } from '../../data/mockTours';
import type { TourResult, TourCategory } from '../../types';

const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: 'var(--v6-text-muted)', marginBottom: '6px' }}>
        {children}
    </label>
);

const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px',
    border: '1.5px solid var(--v6-border)',
    borderRadius: 'var(--v6-radius-md)',
    background: 'var(--v6-bg-main)', color: 'var(--v6-text-primary)',
    fontSize: 'var(--v6-fs-sm)', fontFamily: 'var(--v6-font)',
    outline: 'none', boxSizing: 'border-box' as const,
};

const selectStyle: React.CSSProperties = {
    ...inputStyle, cursor: 'pointer', appearance: 'none' as const,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', paddingRight: '36px',
};

export const TourSearchForm: React.FC = () => {
    const { setTourResults, setIsSearching } = useSearchStore();

    const [destination, setDestination] = useState('');
    const [month,       setMonth]       = useState('any');
    const [category,    setCategory]    = useState<TourCategory | 'all'>('all');
    const [adults,      setAdults]      = useState(2);
    const [children,    setChildren]    = useState(0);
    const [loading,     setLoading]     = useState(false);

    const generateMonths = () => {
        const months = [{ value: 'any', label: 'Bilo kada' }];
        const d = new Date();
        for (let i = 0; i < 6; i++) {
            const m = d.getMonth() + 1;
            const y = d.getFullYear();
            const val = `${y}-${m.toString().padStart(2, '0')}`;
            const lbl = new Intl.DateTimeFormat('sr-Latn', { month: 'long', year: 'numeric' }).format(d);
            months.push({ value: val, label: lbl.charAt(0).toUpperCase() + lbl.slice(1) });
            d.setMonth(m);
        }
        return months;
    };
    const MONTHS = generateMonths();

    const handleSearch = () => {
        setLoading(true);
        setIsSearching(true);
        setTimeout(() => {
            let results: TourResult[] = [...MOCK_TOUR_RESULTS];
            // Filter kategorije ako nije 'all'
            if (category !== 'all') {
                results = results.filter(r => r.category === category);
            }
            results.sort((a, b) => b.reviewCount! - a.reviewCount!);
            setTourResults(results);
            setLoading(false);
        }, 1200);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Popular destinations */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--v6-text-muted)' }}>Ideje:</span>
                {POPULAR_TOUR_DESTINATIONS.map(d => (
                    <button key={d} type="button" onClick={() => setDestination(d)}
                        style={{
                            padding: '4px 10px', fontSize: '12px', fontWeight: 600,
                            borderRadius: '999px', cursor: 'pointer',
                            border: `1px solid ${destination === d ? 'var(--v6-accent)' : 'var(--v6-border)'}`,
                            background: destination === d ? 'rgba(99,102,241,0.08)' : 'var(--v6-bg-section)',
                            color: 'var(--v6-text-secondary)', fontFamily: 'var(--v6-font)'
                        }}
                    >
                        {d}
                    </button>
                ))}
            </div>

            {/* Destinacija + Mesec + Kategorija */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                <div>
                    <Label>🌍 Destinacija / Regija</Label>
                    <input type="text" value={destination} onChange={e => setDestination(e.target.value)}
                        placeholder="Gde biste želeli da idete?" style={inputStyle} />
                </div>
                <div>
                    <Label>📅 Mesec polaska</Label>
                    <select value={month} onChange={e => setMonth(e.target.value)} style={selectStyle}>
                        {MONTHS.map(m => (
                            <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <Label>🚌 Tip putovanja</Label>
                    <select value={category} onChange={e => setCategory(e.target.value as any)} style={selectStyle}>
                        {TOUR_CATEGORIES.map(c => (
                            <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Putnici + Dugme */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div style={{ flex: 1, minWidth: '220px' }}>
                    <Label>👥 Putnici</Label>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center', padding: '10px 14px', border: '1.5px solid var(--v6-border)', borderRadius: 'var(--v6-radius-md)', background: 'var(--v6-bg-main)' }}>
                        {[
                            { label: 'Odrasli', value: adults, min: 1, set: setAdults },
                            { label: 'Deca (2-12)', value: children, min: 0, set: setChildren },
                        ].map(p => (
                            <div key={p.label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '12px', color: 'var(--v6-text-muted)', whiteSpace: 'nowrap' }}>{p.label}</span>
                                <button type="button" onClick={() => p.set(Math.max(p.min, p.value - 1))}
                                    style={{ width: '26px', height: '26px', borderRadius: '50%', border: '1px solid var(--v6-border)', background: 'var(--v6-bg-section)', fontWeight: 700, cursor: 'pointer', color: 'var(--v6-text-primary)' }}>−</button>
                                <span style={{ fontWeight: 800, minWidth: '16px', textAlign: 'center' }}>{p.value}</span>
                                <button type="button" onClick={() => p.set(p.value + 1)}
                                    style={{ width: '26px', height: '26px', borderRadius: '50%', border: '1px solid var(--v6-border)', background: 'var(--v6-bg-section)', fontWeight: 700, cursor: 'pointer', color: 'var(--v6-text-primary)' }}>+</button>
                            </div>
                        ))}
                    </div>
                </div>

                <button type="button" onClick={handleSearch} disabled={loading}
                    style={{
                        padding: '11px 32px',
                        background: loading ? 'var(--v6-border)' : 'var(--v6-accent)',
                        color: loading ? 'var(--v6-text-muted)' : 'var(--v6-accent-text)',
                        border: 'none', borderRadius: 'var(--v6-radius-md)',
                        fontSize: 'var(--v6-fs-sm)', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                        transition: 'background 0.2s', fontFamily: 'var(--v6-font)'
                    }}>
                    {loading ? '⏳ Traženje...' : '🔍 Istraži putovanja'}
                </button>
            </div>
        </div>
    );
};
