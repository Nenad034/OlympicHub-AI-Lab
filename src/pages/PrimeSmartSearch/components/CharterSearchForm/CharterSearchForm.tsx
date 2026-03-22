import React, { useState } from 'react';
import { useSearchStore } from '../../stores/useSearchStore';
import { SearchModeSelector } from '../SearchModeSelector';
import { AIAssistantField } from '../AIAssistantField';
import { MOCK_CHARTER_RESULTS } from '../../data/mockCharters';

// ─────────────────────────────────────────────────────────────
// AIRPORTS — Prečišćen izbor polaznih mesta
// ─────────────────────────────────────────────────────────────
const CHARTER_ORIGINS = [
    { code: 'BEG', city: 'Beograd', name: 'Nikola Tesla International' },
    { code: 'INI', city: 'Niš',     name: 'Niš Constantine The Great' },
];

const CHARTER_DESTINATIONS = [
    { code: 'TIV', city: 'Tivat',      country: '🇲🇪', label: 'Tivat (Crna Gora)' },
    { code: 'DBV', city: 'Dubrovnik',  country: '🇭🇷', label: 'Dubrovnik (Hrvatska)' },
    { code: 'SPU', city: 'Split',      country: '🇭🇷', label: 'Split (Hrvatska)' },
    { code: 'ATH', city: 'Atina',     country: '🇬🇷', label: 'Atina (Grčka)' },
    { code: 'HER', city: 'Heraklion', country: '🇬🇷', label: 'Heraklion, Krit (Grčka)' },
    { code: 'RHO', city: 'Rodos',     country: '🇬🇷', label: 'Rodos (Grčka)' },
    { code: 'TFS', city: 'Tenerife',  country: '🇪🇸', label: 'Tenerife (Španija)' },
    { code: 'AYT', city: 'Antalija',  country: '🇹🇷', label: 'Antalija (Turska)' },
];

const MONTHS = [
    { value: '2026-06', label: 'Jun 2026' },
    { value: '2026-07', label: 'Jul 2026' },
    { value: '2026-08', label: 'Avgust 2026' },
    { value: '2026-09', label: 'Septembar 2026' },
];

const NIGHTS_OPTIONS = [
    { value: '0', label: 'Sve dužine' },
    { value: '7',  label: '7 noćenja' },
    { value: '10', label: '10 noćenja' },
    { value: '14', label: '14 noćenja' },
];

// ─────────────────────────────────────────────────────────────
// INPUT LABEL
// ─────────────────────────────────────────────────────────────
const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <label style={{
        display: 'block',
        fontSize: '11px',
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        color: 'var(--v6-text-muted)',
        marginBottom: '6px',
    }}>
        {children}
    </label>
);

// ─────────────────────────────────────────────────────────────
// SELECT STILIZOVANI
// ─────────────────────────────────────────────────────────────
const StyledSelect: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) => (
    <select
        {...props}
        style={{
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
            appearance: 'none',
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 12px center',
            paddingRight: '36px',
            ...props.style,
        }}
    />
);

// ─────────────────────────────────────────────────────────────
// PAX COUNTER
// ─────────────────────────────────────────────────────────────
const PaxCounter: React.FC<{
    label: string; sub: string;
    value: number; min: number; max: number;
    onChange: (v: number) => void;
}> = ({ label, sub, value, min, max, onChange }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0' }}>
        <div>
            <div style={{ fontSize: 'var(--v6-fs-sm)', fontWeight: 600, color: 'var(--v6-text-primary)' }}>{label}</div>
            <div style={{ fontSize: '11px', color: 'var(--v6-text-muted)' }}>{sub}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button type="button" onClick={() => onChange(value - 1)} disabled={value <= min}
                style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1.5px solid var(--v6-border)', background: 'var(--v6-bg-main)', color: 'var(--v6-text-primary)', fontSize: '18px', cursor: value <= min ? 'not-allowed' : 'pointer', opacity: value <= min ? 0.4 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>−</button>
            <span style={{ minWidth: '24px', textAlign: 'center', fontWeight: 700, fontSize: 'var(--v6-fs-md)', color: 'var(--v6-text-primary)' }}>{value}</span>
            <button type="button" onClick={() => onChange(value + 1)} disabled={value >= max}
                style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1.5px solid var(--v6-border)', background: 'var(--v6-bg-main)', color: 'var(--v6-text-primary)', fontSize: '18px', cursor: value >= max ? 'not-allowed' : 'pointer', opacity: value >= max ? 0.4 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>+</button>
        </div>
    </div>
);

// ─────────────────────────────────────────────────────────────
// MAIN: CharterSearchForm
// ─────────────────────────────────────────────────────────────
export const CharterSearchForm: React.FC = () => {
    const { setCharterResults, setIsSearching, searchMode } = useSearchStore();

    // Forma state (lokalni — ne puni store dok ne klikne Pretraži)
    const [origin, setOrigin]       = useState('BEG');
    const [dest, setDest]           = useState('TIV');
    const [month, setMonth]         = useState('2026-07');
    const [nights, setNights]       = useState('0');
    const [adults, setAdults]       = useState(2);
    const [children, setChildren]   = useState(0);
    const [infants, setInfants]     = useState(0);
    const [primeOnly, setPrimeOnly] = useState(false);
    const [loading, setLoading]     = useState(false);
    const [showPax, setShowPax]     = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    const paxLabel = `${adults} odr.${children > 0 ? ` + ${children} dece` : ''}${infants > 0 ? ` + ${infants} beba` : ''}`;
    const totalPax = adults + children;
    const originObj = CHARTER_ORIGINS.find(o => o.code === origin);
    const destObj   = CHARTER_DESTINATIONS.find(d => d.code === dest);
    const sameRoute = origin === dest;

    const handleSearch = () => {
        if (sameRoute) {
            setFormError('Polazak i odredište moraju biti različiti.');
            return;
        }
        setFormError(null);

        setLoading(true);
        setIsSearching(true);

        setTimeout(() => {
            // Filtriraj mock rezultate prema ruti i opcijama
            let results = MOCK_CHARTER_RESULTS.filter(ch =>
                ch.origin === origin && ch.destination === dest
            );

            // Fallback: ako nema tačnu rutu, prikaži sve
            if (results.length === 0) results = MOCK_CHARTER_RESULTS;

            // Prime filter
            if (primeOnly) results = results.filter(ch => ch.isPrime);

            // Nights filter
            if (nights !== '0') {
                results = results.map(ch => ({
                    ...ch,
                    departures: ch.departures.filter(d => d.nights === parseInt(nights)),
                })).filter(ch => ch.departures.length > 0);
            }

            // Mesec filter
            results = results.map(ch => ({
                ...ch,
                departures: ch.departures.filter(d => d.departDate.startsWith(month)),
            })).filter(ch => ch.departures.length > 0);

            // Prekalkuliši ukupnu cenu za sve putnike
            results = results.map(ch => ({
                ...ch,
                departures: ch.departures.map(d => ({
                    ...d,
                    totalPrice: d.pricePerPerson * (adults + children * 0.7),
                })),
            }));

            setCharterResults(results);
            setLoading(false);
        }, 1400);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* 1. SELECTION MODES */}
            <SearchModeSelector />

            {/* 2. AI ASSISTANT FIELD */}
            {(searchMode === 'semantic' || searchMode === 'hybrid') && <AIAssistantField />}

            {/* 3. CHARTER FORM (Hidden in pure Semantic) */}
            {searchMode !== 'semantic' && (
                <>
            {/* Red 1: Polazak → Odredište → Mesec */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                {/* Polazak */}
                <div>
                    <Label>🛫 Polazak</Label>
                    <StyledSelect value={origin} onChange={e => setOrigin(e.target.value)}>
                        {CHARTER_ORIGINS.map(o => (
                            <option key={o.code} value={o.code}>{o.code} — {o.city}</option>
                        ))}
                    </StyledSelect>
                    {originObj && <div style={{ fontSize: '11px', color: 'var(--v6-text-muted)', marginTop: '3px', paddingLeft: '4px' }}>{originObj.name}</div>}
                </div>

                {/* Odredište */}
                <div>
                    <Label>🛬 Odredište</Label>
                    <StyledSelect value={dest} onChange={e => setDest(e.target.value)}
                        style={{ borderColor: sameRoute ? '#ef4444' : 'var(--v6-border)' }}>
                        {CHARTER_DESTINATIONS.map(d => (
                            <option key={d.code} value={d.code}>{d.country} {d.label}</option>
                        ))}
                    </StyledSelect>
                    {sameRoute && <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '3px' }}>Polazak i odredište moraju biti različiti</div>}
                </div>

                {/* Mesec */}
                <div>
                    <Label>📅 Mesec polaska</Label>
                    <StyledSelect value={month} onChange={e => setMonth(e.target.value)}>
                        {MONTHS.map(m => (
                            <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                    </StyledSelect>
                </div>

                {/* Noćenja */}
                <div>
                    <Label>🌙 Broj noćenja</Label>
                    <StyledSelect value={nights} onChange={e => setNights(e.target.value)}>
                        {NIGHTS_OPTIONS.map(n => (
                            <option key={n.value} value={n.value}>{n.label}</option>
                        ))}
                    </StyledSelect>
                </div>
            </div>

            {/* Red 2: Putnici + Opcije + Dugme */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
                {/* Putnici dropdown */}
                <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
                    <Label>👥 Putnici</Label>
                    <button
                        type="button"
                        onClick={() => setShowPax(!showPax)}
                        style={{
                            width: '100%',
                            padding: '11px 14px',
                            border: `1.5px solid ${showPax ? 'var(--v6-accent)' : 'var(--v6-border)'}`,
                            borderRadius: 'var(--v6-radius-md)',
                            background: 'var(--v6-bg-main)',
                            color: 'var(--v6-text-primary)',
                            fontSize: 'var(--v6-fs-sm)',
                            fontFamily: 'var(--v6-font)',
                            cursor: 'pointer',
                            textAlign: 'left',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                        }}
                    >
                        <span>{paxLabel}</span>
                        <span style={{ color: 'var(--v6-text-muted)', fontSize: '13px' }}>{showPax ? '▲' : '▼'}</span>
                    </button>

                    {showPax && (
                        <div style={{
                            position: 'absolute',
                            top: 'calc(100% + 4px)',
                            left: 0,
                            right: 0,
                            background: 'var(--v6-bg-card)',
                            border: '1.5px solid var(--v6-border)',
                            borderRadius: 'var(--v6-radius-lg)',
                            padding: '12px 16px',
                            zIndex: 200,
                            boxShadow: 'var(--v6-shadow-lg)',
                        }}>
                            <PaxCounter label="Odrasli" sub="12+ godina" value={adults} min={1} max={9} onChange={v => setAdults(v)} />
                            <div style={{ height: '1px', background: 'var(--v6-border)', margin: '4px 0' }} />
                            <PaxCounter label="Deca" sub="2–11 godina" value={children} min={0} max={8} onChange={v => setChildren(v)} />
                            <div style={{ height: '1px', background: 'var(--v6-border)', margin: '4px 0' }} />
                            <PaxCounter label="Bebe" sub="0–2 godine" value={infants} min={0} max={adults} onChange={v => setInfants(v)} />
                            <button type="button" onClick={() => setShowPax(false)}
                                style={{ marginTop: '10px', width: '100%', padding: '9px', background: 'var(--v6-accent)', color: 'var(--v6-accent-text)', border: 'none', borderRadius: 'var(--v6-radius-md)', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--v6-font)' }}>
                                Potvrdi
                            </button>
                        </div>
                    )}
                </div>

                {/* Prime Only toggle */}
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                    <Label>&nbsp;</Label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '11px 16px', border: `1.5px solid ${primeOnly ? 'var(--v6-color-prime)' : 'var(--v6-border)'}`, borderRadius: 'var(--v6-radius-md)', cursor: 'pointer', background: primeOnly ? 'rgba(180,83,9,0.06)' : 'var(--v6-bg-main)', whiteSpace: 'nowrap' }}>
                        <input type="checkbox" checked={primeOnly} onChange={e => setPrimeOnly(e.target.checked)} style={{ accentColor: 'var(--v6-color-prime)', width: '15px', height: '15px' }} />
                        <span style={{ fontSize: 'var(--v6-fs-sm)', fontWeight: 600, color: primeOnly ? 'var(--v6-color-prime)' : 'var(--v6-text-secondary)' }}>🏆 Samo PRIME allotment</span>
                    </label>
                </div>

                {/* Pretraži */}
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                    <Label>&nbsp;</Label>
                    <button
                        type="button"
                        onClick={handleSearch}
                        disabled={loading || sameRoute}
                        id="v6-charter-search-btn"
                        style={{
                            padding: '11px 28px',
                            background: loading || sameRoute ? 'var(--v6-border)' : 'var(--v6-accent)',
                            color: loading || sameRoute ? 'var(--v6-text-muted)' : 'var(--v6-accent-text)',
                            border: 'none',
                            borderRadius: 'var(--v6-radius-md)',
                            fontSize: 'var(--v6-fs-sm)',
                            fontWeight: 700,
                            cursor: loading || sameRoute ? 'not-allowed' : 'pointer',
                            fontFamily: 'var(--v6-font)',
                            whiteSpace: 'nowrap',
                            transition: 'background 0.2s',
                        }}
                    >
                        {loading ? '⏳ Pretražujem...' : '🔍 Pretraži čartere'}
                    </button>
                </div>
            </div>
            </>
            )}
        </div>
    );
};

export default CharterSearchForm;
