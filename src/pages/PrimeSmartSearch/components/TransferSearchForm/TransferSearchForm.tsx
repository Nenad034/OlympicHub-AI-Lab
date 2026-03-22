import React, { useState } from 'react';
import { useSearchStore } from '../../stores/useSearchStore';
import { SearchModeSelector } from '../SearchModeSelector';
import { AIAssistantField } from '../AIAssistantField';
import { MOCK_TRANSFER_RESULTS, TRANSFER_LOCATIONS, POPULAR_TRANSFER_ROUTES } from '../../data/mockTransfers';
import type { TransferResult } from '../../types';

// ─────────────────────────────────────────────────────────────
// SHARED KOMPONENTE
// ─────────────────────────────────────────────────────────────
const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: 'var(--v6-text-muted)', marginBottom: '6px' }}>
        {children}
    </label>
);

const selectStyle: React.CSSProperties = {
    width: '100%',
    padding: '11px 14px',
    border: '1.5px solid var(--v6-border)',
    borderRadius: 'var(--v6-radius-md)',
    background: 'var(--v6-bg-main)',
    color: 'var(--v6-text-primary)',
    fontSize: 'var(--v6-fs-sm)',
    fontFamily: 'var(--v6-font)',
    outline: 'none',
    cursor: 'pointer',
    appearance: 'none' as const,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 12px center',
    paddingRight: '36px',
    boxSizing: 'border-box' as const,
};

const inputStyle: React.CSSProperties = {
    width: '100%', padding: '11px 14px',
    border: '1.5px solid var(--v6-border)',
    borderRadius: 'var(--v6-radius-md)',
    background: 'var(--v6-bg-main)', color: 'var(--v6-text-primary)',
    fontSize: 'var(--v6-fs-sm)', fontFamily: 'var(--v6-font)',
    outline: 'none', boxSizing: 'border-box' as const,
};

// ─────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────
export const TransferSearchForm: React.FC = () => {
    const { setTransferResults, setIsSearching, searchMode } = useSearchStore();

    // State
    const [pickup,      setPickup]      = useState('TIV');
    const [dropoff,     setDropoff]     = useState('BDV');
    const [direction,   setDirection]   = useState<'one-way' | 'round-trip'>('one-way');
    const [depDate,     setDepDate]     = useState('2026-07-05');
    const [depTime,     setDepTime]     = useState('14:00');
    const [retDate,     setRetDate]     = useState('2026-07-12');
    const [retTime,     setRetTime]     = useState('11:00');
    const [adults,      setAdults]      = useState(2);
    const [children,    setChildren]    = useState(0);
    const [infants,     setInfants]     = useState(0);
    const [flightNo,    setFlightNo]    = useState('');
    const [loading,     setLoading]     = useState(false);

    const totalPax   = adults + children + infants;
    const sameRoute  = pickup === dropoff;

    // ── Swap ──────────────────────────────────────────────
    const handleSwap = () => {
        setPickup(dropoff);
        setDropoff(pickup);
    };

    // ── Brza ruta iz popular chips ─────────────────────────
    const applyQuickRoute = (from: string, to: string) => {
        setPickup(from);
        setDropoff(to);
    };

    // ── Pretraga ───────────────────────────────────────────
    const handleSearch = () => {
        if (sameRoute) return;

        setLoading(true);
        setIsSearching(true);

        setTimeout(() => {
            let results: TransferResult[] = [...MOCK_TRANSFER_RESULTS];

            // Filtriraj po kapacitetu (mora da stane totalPax)
            results = results.filter(r => r.vehicle.seats >= totalPax);

            // Sortuj: PRIME prvo, zatim priority
            results.sort((a, b) => {
                if (a.isPrime && !b.isPrime) return -1;
                if (!a.isPrime && b.isPrime) return 1;
                return b.priority - a.priority;
            });

            setTransferResults(results);
            setLoading(false);
        }, 1100);
    };

    const paxLabel = `${adults} odr.${children > 0 ? ` + ${children} dece` : ''}${infants > 0 ? ` + ${infants} beba` : ''}`;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* 1. SELECTION MODES */}
            <SearchModeSelector />

            {/* 2. AI ASSISTANT FIELD */}
            {(searchMode === 'semantic' || searchMode === 'hybrid') && <AIAssistantField />}

            {/* 3. TRANSFER FORM (Hidden in pure Semantic) */}
            {searchMode !== 'semantic' && (
                <>
            {/* Red 1: Tip transfera (one-way / round-trip) */}
            <div style={{ display: 'flex', gap: '8px' }}>
                {(['one-way', 'round-trip'] as const).map(d => (
                    <button key={d} type="button" onClick={() => setDirection(d)}
                        style={{
                            padding: '7px 18px', borderRadius: '999px', fontFamily: 'var(--v6-font)',
                            border: `1.5px solid ${direction === d ? 'var(--v6-accent)' : 'var(--v6-border)'}`,
                            background: direction === d ? 'var(--v6-accent)' : 'var(--v6-bg-main)',
                            color: direction === d ? 'var(--v6-accent-text)' : 'var(--v6-text-secondary)',
                            fontSize: '13px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
                        }}>
                        {d === 'one-way' ? '→ U jednom pravcu' : '⇄ Povratni transfer'}
                    </button>
                ))}
            </div>

            {/* Brze rute */}
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11px', color: 'var(--v6-text-muted)', alignSelf: 'center', fontWeight: 600 }}>Brze rute:</span>
                {POPULAR_TRANSFER_ROUTES.map((r, i) => (
                    <button key={i} type="button" onClick={() => applyQuickRoute(r.from, r.to)}
                        style={{
                            padding: '4px 12px', fontSize: '12px', fontWeight: 600, borderRadius: '999px',
                            border: `1px solid ${pickup === r.from && dropoff === r.to ? 'var(--v6-accent)' : 'var(--v6-border)'}`,
                            background: pickup === r.from && dropoff === r.to ? 'rgba(99,102,241,0.08)' : 'var(--v6-bg-section)',
                            color: 'var(--v6-text-secondary)', cursor: 'pointer', fontFamily: 'var(--v6-font)',
                        }}>
                        {r.fromLabel.split(' ').slice(-1)} → {r.toLabel}
                    </button>
                ))}
            </div>

            {/* Red 2: Polazak + Swap + Odredište */}
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                    <Label>📍 Polazna tačka</Label>
                    <select value={pickup} onChange={e => setPickup(e.target.value)} style={selectStyle}>
                        {TRANSFER_LOCATIONS.map(l => (
                            <option key={l.code} value={l.code}>{l.label}</option>
                        ))}
                    </select>
                </div>

                {/* Swap dugme */}
                <button type="button" onClick={handleSwap}
                    style={{ width: '40px', height: '40px', borderRadius: '50%', border: '1.5px solid var(--v6-border)', background: 'var(--v6-bg-main)', color: 'var(--v6-accent)', fontSize: '18px', cursor: 'pointer', flexShrink: 0 }}>
                    ⇄
                </button>

                <div style={{ flex: 1, minWidth: '200px' }}>
                    <Label>🏁 Odredišna tačka</Label>
                    <select value={dropoff} onChange={e => setDropoff(e.target.value)}
                        style={{ ...selectStyle, borderColor: sameRoute ? '#ef4444' : 'var(--v6-border)' }}>
                        {TRANSFER_LOCATIONS.map(l => (
                            <option key={l.code} value={l.code}>{l.label}</option>
                        ))}
                    </select>
                    {sameRoute && <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '3px' }}>Polazak i odredište moraju biti različiti</div>}
                </div>
            </div>

            {/* Red 3: Datumi + Vreme + Broj leta */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
                <div>
                    <Label>📅 Datum polaska</Label>
                    <input type="date" value={depDate} onChange={e => setDepDate(e.target.value)} style={inputStyle} />
                </div>
                <div>
                    <Label>⏰ Vreme polaska (let sleti u...)</Label>
                    <input type="time" value={depTime} onChange={e => setDepTime(e.target.value)} style={inputStyle} />
                </div>
                {direction === 'round-trip' && (
                    <>
                        <div>
                            <Label>📅 Datum povratka</Label>
                            <input type="date" value={retDate} min={depDate} onChange={e => setRetDate(e.target.value)} style={inputStyle} />
                        </div>
                        <div>
                            <Label>⏰ Vreme povratka (let polazi u...)</Label>
                            <input type="time" value={retTime} onChange={e => setRetTime(e.target.value)} style={inputStyle} />
                        </div>
                    </>
                )}
                <div>
                    <Label>✈️ Broj leta (opciono)</Label>
                    <input type="text" value={flightNo} onChange={e => setFlightNo(e.target.value.toUpperCase())}
                        placeholder="npr. JU 480"
                        style={inputStyle} />
                </div>
            </div>

            {/* Red 4: Putnici + Pretraži */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                {/* Inline pax counteri */}
                <div style={{ flex: 1, minWidth: '260px' }}>
                    <Label>👥 Putnici</Label>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center', padding: '10px 14px', border: '1.5px solid var(--v6-border)', borderRadius: 'var(--v6-radius-md)', background: 'var(--v6-bg-main)', flexWrap: 'wrap' }}>
                        {[
                            { label: 'Odrasli', value: adults, min: 1, set: setAdults },
                            { label: 'Deca', value: children, min: 0, set: setChildren },
                            { label: 'Bebe', value: infants, min: 0, set: setInfants },
                        ].map(p => (
                            <div key={p.label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '12px', color: 'var(--v6-text-muted)', whiteSpace: 'nowrap' }}>{p.label}</span>
                                <button type="button" onClick={() => p.set(Math.max(p.min, p.value - 1))}
                                    style={{ width: '26px', height: '26px', borderRadius: '50%', border: '1px solid var(--v6-border)', background: 'var(--v6-bg-section)', fontSize: '14px', cursor: 'pointer', fontWeight: 700, color: 'var(--v6-text-primary)' }}>−</button>
                                <span style={{ fontWeight: 800, color: 'var(--v6-text-primary)', minWidth: '16px', textAlign: 'center' }}>{p.value}</span>
                                <button type="button" onClick={() => p.set(p.value + 1)}
                                    style={{ width: '26px', height: '26px', borderRadius: '50%', border: '1px solid var(--v6-border)', background: 'var(--v6-bg-section)', fontSize: '14px', cursor: 'pointer', fontWeight: 700, color: 'var(--v6-text-primary)' }}>+</button>
                            </div>
                        ))}
                        <div style={{ fontSize: '11px', color: 'var(--v6-text-muted)', marginLeft: 'auto' }}>
                            Ukupno: <strong style={{ color: 'var(--v6-text-primary)' }}>{totalPax} os.</strong>
                        </div>
                    </div>
                </div>

                {/* Pretraži */}
                <button type="button" onClick={handleSearch} disabled={loading || sameRoute} id="v6-transfer-search-btn"
                    style={{
                        padding: '11px 28px',
                        background: loading || sameRoute ? 'var(--v6-border)' : 'var(--v6-accent)',
                        color: loading || sameRoute ? 'var(--v6-text-muted)' : 'var(--v6-accent-text)',
                        border: 'none', borderRadius: 'var(--v6-radius-md)',
                        fontSize: 'var(--v6-fs-sm)', fontWeight: 700,
                        cursor: loading || sameRoute ? 'not-allowed' : 'pointer',
                        fontFamily: 'var(--v6-font)', whiteSpace: 'nowrap', transition: 'background 0.2s',
                    }}>
                    {loading ? '⏳ Tražim...' : '🔍 Pretraži transfere'}
                </button>
            </div>

            {/* Info tip */}
            {flightNo && (
                <div style={{ padding: '8px 14px', background: 'rgba(5,150,105,0.06)', border: '1px solid rgba(5,150,105,0.2)', borderRadius: 'var(--v6-radius-md)', fontSize: '12px', color: 'var(--v6-color-instant-text)' }}>
                    ✓ Vozač će pratiti let <strong>{flightNo}</strong> i sačekati ako kasni — bez dodatnih troškova.
                </div>
            )}
            </>
            )}
        </div>
    );
};

export default TransferSearchForm;
