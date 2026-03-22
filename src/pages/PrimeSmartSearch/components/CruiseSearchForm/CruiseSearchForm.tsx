import React, { useState } from 'react';
import { useSearchStore } from '../../stores/useSearchStore';
import { MOCK_CRUISE_RESULTS, CRUISE_REGIONS, POPULAR_CRUISE_PORTS } from '../../data/mockCruises';
import type { CruiseRegion } from '../../types';

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

// Generišemo options za "Narednih X meseci"
const generateMonthOptions = () => {
    const opts = [];
    const now = new Date();
    for (let i = 0; i < 9; i++) {
        const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
        const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const lbl = d.toLocaleString('sr-RS', { month: 'long', year: 'numeric' });
        opts.push({ value: val, label: lbl.charAt(0).toUpperCase() + lbl.slice(1) });
    }
    return opts;
};

export const CruiseSearchForm: React.FC = () => {
    const { setCruiseResults, setIsSearching } = useSearchStore();

    const [region, setRegion] = useState<CruiseRegion | 'all'>('all');
    const [port, setPort] = useState('');
    const [month, setMonth] = useState(generateMonthOptions()[0].value);
    const [pax, setPax] = useState(2);
    const [loading, setLoading] = useState(false);

    const monthOptions = generateMonthOptions();

    const handleSearch = () => {
        setLoading(true);
        setIsSearching(true);
        setTimeout(() => {
            let results = [...MOCK_CRUISE_RESULTS];
            
            // Basic region filter logic za demo svrhe
            if (region !== 'all') {
                const searchRegionNormalized = CRUISE_REGIONS.find(r => r.value === region)?.label.toLowerCase() || '';
                results = results.filter(r => r.regionName.toLowerCase().includes(searchRegionNormalized));
            }
            
            setCruiseResults(results);
            setLoading(false);
        }, 1100);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Popularne Luke */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--v6-text-muted)' }}>Popularne luke polaska:</span>
                {POPULAR_CRUISE_PORTS.map(p => (
                    <button key={p} type="button" onClick={() => setPort(p)}
                        style={{
                            padding: '4px 10px', fontSize: '12px', fontWeight: 600,
                            borderRadius: '999px', cursor: 'pointer',
                            border: `1px solid ${port === p ? 'var(--v6-accent)' : 'var(--v6-border)'}`,
                            background: port === p ? 'rgba(99,102,241,0.08)' : 'var(--v6-bg-section)',
                            color: 'var(--v6-text-secondary)', fontFamily: 'var(--v6-font)'
                        }}
                    >
                        {p}
                    </button>
                ))}
            </div>

            {/* Region / Luka / Mesec */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                <div>
                    <Label>🌍 Regija Plovidbe</Label>
                    <select value={region} onChange={e => setRegion(e.target.value as any)} style={selectStyle}>
                        {CRUISE_REGIONS.map(r => (
                            <option key={r.value} value={r.value}>{r.emoji} {r.label}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <Label>⚓ Luka Polaska (Opciono)</Label>
                    <input type="text" value={port} onChange={e => setPort(e.target.value)}
                        placeholder="npr. Đenova, Atina..." style={inputStyle} />
                </div>
                <div>
                    <Label>📅 Mesec Putovanja</Label>
                    <select value={month} onChange={e => setMonth(e.target.value)} style={selectStyle}>
                        <option value="any">Bilo koji datum</option>
                        {monthOptions.map(m => (
                            <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Broj osoba + Submit */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div style={{ flex: 1, minWidth: '160px' }}>
                    <Label>👥 Broj putnika po kabini</Label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', border: '1.5px solid var(--v6-border)', borderRadius: 'var(--v6-radius-md)', background: 'var(--v6-bg-main)' }}>
                        <button type="button" onClick={() => setPax(Math.max(1, pax - 1))}
                            style={{ width: '26px', height: '26px', borderRadius: '50%', border: '1px solid var(--v6-border)', background: 'var(--v6-bg-section)', fontWeight: 700, cursor: 'pointer', color: 'var(--v6-text-primary)' }}>−</button>
                        <span style={{ fontWeight: 800, flex: 1, textAlign: 'center' }}>{pax} {pax === 1 ? 'putnik' : 'putnika'}</span>
                        <button type="button" onClick={() => setPax(Math.min(pax + 1, 4))}
                            style={{ width: '26px', height: '26px', borderRadius: '50%', border: '1px solid var(--v6-border)', background: 'var(--v6-bg-section)', fontWeight: 700, cursor: 'pointer', color: 'var(--v6-text-primary)' }}>+</button>
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
                    {loading ? '🚢 Tražim brodove...' : '🚢 Pretraži Krstarenja'}
                </button>
            </div>
        </div>
    );
};
