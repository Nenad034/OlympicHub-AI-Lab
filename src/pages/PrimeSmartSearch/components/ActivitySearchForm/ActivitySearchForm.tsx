import React, { useState } from 'react';
import { useSearchStore } from '../../stores/useSearchStore';
import { SearchModeSelector } from '../SearchModeSelector';
import { AIAssistantField } from '../AIAssistantField';
import { MOCK_ACTIVITY_RESULTS, ACTIVITY_CATEGORIES, POPULAR_ACTIVITY_LOCATIONS } from '../../data/mockActivities';
import type { ActivityResult, ActivityCategory } from '../../types';

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

export const ActivitySearchForm: React.FC = () => {
    const { setActivityResults, setIsSearching, searchMode } = useSearchStore();

    const [location, setLocation] = useState('');
    const [date, setDate] = useState(() => {
        const d = new Date(); d.setDate(d.getDate() + 2);
        return d.toISOString().split('T')[0];
    });
    const [category, setCategory] = useState<ActivityCategory | 'all'>('all');
    const [pax, setPax] = useState(2);
    const [loading, setLoading] = useState(false);

    const handleSearch = () => {
        setLoading(true);
        setIsSearching(true);
        setTimeout(() => {
            let results: ActivityResult[] = [...MOCK_ACTIVITY_RESULTS];
            // Filter by category
            if (category !== 'all') {
                results = results.filter(r => r.category === category);
            }
            results.sort((a, b) => b.reviewCount! - a.reviewCount!);
            setActivityResults(results);
            setLoading(false);
        }, 800);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* 1. SELECTION MODES */}
            <SearchModeSelector />

            {/* 2. AI ASSISTANT FIELD */}
            {(searchMode === 'semantic' || searchMode === 'hybrid') && <AIAssistantField />}

            {/* 3. ACTIVITY FORM (Hidden in pure Semantic) */}
            {searchMode !== 'semantic' && (
                <>

            {/* Popular destinations for activities */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--v6-text-muted)' }}>Popularno:</span>
                {POPULAR_ACTIVITY_LOCATIONS.map(loc => (
                    <button key={loc} type="button" onClick={() => setLocation(loc)}
                        style={{
                            padding: '4px 10px', fontSize: '12px', fontWeight: 600,
                            borderRadius: '999px', cursor: 'pointer',
                            border: `1px solid ${location === loc ? 'var(--v6-accent)' : 'var(--v6-border)'}`,
                            background: location === loc ? 'rgba(99,102,241,0.08)' : 'var(--v6-bg-section)',
                            color: 'var(--v6-text-secondary)', fontFamily: 'var(--v6-font)'
                        }}
                    >
                        {loc}
                    </button>
                ))}
            </div>

            {/* Lokacija + Datum + Kategorija */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                <div>
                    <Label>📍 Grad ili Atrakcija</Label>
                    <input type="text" value={location} onChange={e => setLocation(e.target.value)}
                        placeholder="npr. Kotor, Skadarsko, Budva..." style={inputStyle} />
                </div>
                <div>
                    <Label>📅 Koji dan?</Label>
                    <input type="date" value={date} onChange={e => setDate(e.target.value)}
                        min={new Date().toISOString().split('T')[0]} style={inputStyle} />
                </div>
                <div>
                    <Label>🎟️ Tip aktivnosti</Label>
                    <select value={category} onChange={e => setCategory(e.target.value as any)} style={selectStyle}>
                        {ACTIVITY_CATEGORIES.map(c => (
                            <option key={c.value} value={c.value}>{c.emoji} {c.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Broj osoba + Submit */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <div style={{ flex: 1, minWidth: '160px' }}>
                    <Label>👥 Broj osoba</Label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', border: '1.5px solid var(--v6-border)', borderRadius: 'var(--v6-radius-md)', background: 'var(--v6-bg-main)' }}>
                        <button type="button" onClick={() => setPax(Math.max(1, pax - 1))}
                            style={{ width: '26px', height: '26px', borderRadius: '50%', border: '1px solid var(--v6-border)', background: 'var(--v6-bg-section)', fontWeight: 700, cursor: 'pointer', color: 'var(--v6-text-primary)' }}>−</button>
                        <span style={{ fontWeight: 800, flex: 1, textAlign: 'center' }}>{pax} {pax === 1 ? 'osoba' : 'osobe'}</span>
                        <button type="button" onClick={() => setPax(pax + 1)}
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
                    {loading ? '⏳ Učitavam...' : '🎟️ Pronađi aktivnosti'}
                </button>
            </div>
            </>
            )}
        </div>
    );
};
