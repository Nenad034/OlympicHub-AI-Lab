import React, { useState } from 'react';
import { useSearchStore } from '../../stores/useSearchStore';
import { SearchModeSelector } from '../SearchModeSelector';
import { AIAssistantField } from '../AIAssistantField';
import type { FlightSearchParams } from '../../types';

// ─────────────────────────────────────────────────────────────
// Popularni aerodromi — brzi odabir
// ─────────────────────────────────────────────────────────────
const AIRPORTS: { code: string; city: string; name: string; country: string }[] = [
    { code: 'BEG', city: 'Beograd',      name: 'Nikola Tesla',           country: 'RS' },
    { code: 'INI', city: 'Niš',          name: 'Constantin cel Mare',    country: 'RS' },
    { code: 'TIV', city: 'Tivat',        name: 'Tivat Airport',          country: 'ME' },
    { code: 'DBV', city: 'Dubrovnik',    name: 'Čilipi Airport',         country: 'HR' },
    { code: 'SPU', city: 'Split',        name: 'Resnik Airport',         country: 'HR' },
    { code: 'ZAG', city: 'Zagreb',       name: 'Franjo Tuđman',          country: 'HR' },
    { code: 'LJU', city: 'Ljubljana',    name: 'Brnik Airport',          country: 'SI' },
    { code: 'SKP', city: 'Skoplje',      name: 'Aleksandar Veliki',      country: 'MK' },
    { code: 'VIE', city: 'Beč',          name: 'Vienna Intl',            country: 'AT' },
    { code: 'MUC', city: 'Minhen',       name: 'Franz Josef Strauss',    country: 'DE' },
    { code: 'FRA', city: 'Frankfurt',    name: 'Frankfurt Main',         country: 'DE' },
    { code: 'CDG', city: 'Pariz',        name: 'Charles de Gaulle',      country: 'FR' },
    { code: 'LHR', city: 'London',       name: 'Heathrow',               country: 'GB' },
    { code: 'AMS', city: 'Amsterdam',    name: 'Schiphol',               country: 'NL' },
    { code: 'IST', city: 'Istanbul',     name: 'Atatürk / Sabiha',       country: 'TR' },
    { code: 'ATH', city: 'Atina',        name: 'Eleftherios Venizelos',  country: 'GR' },
    { code: 'DXB', city: 'Dubai',        name: 'Dubai Intl',             country: 'AE' },
    { code: 'FCO', city: 'Rim',          name: 'Fiumicino',              country: 'IT' },
    { code: 'BCN', city: 'Barselona',    name: 'El Prat',                country: 'ES' },
    { code: 'MAD', city: 'Madrid',       name: 'Barajas',                country: 'ES' },
];

const CABIN_CLASSES = [
    { value: 'economy',  label: 'Ekonomska klasa' },
    { value: 'premium',  label: 'Premium ekonomska' },
    { value: 'business', label: 'Biznis klasa' },
    { value: 'first',    label: 'Prva klasa' },
];

// ─────────────────────────────────────────────────────────────
// Reusable: Airport Selector sa search autocomplete
// ─────────────────────────────────────────────────────────────
interface AirportSelectorProps {
    id: string;
    label: string;
    value: string;
    onChange: (code: string, city: string) => void;
    placeholder?: string;
}

const AirportSelector: React.FC<AirportSelectorProps> = ({ id, label, value, onChange, placeholder }) => {
    const [query, setQuery] = useState(value);
    const [open, setOpen] = useState(false);
    const [focused, setFocused] = useState(false);

    const filtered = query.length >= 2
        ? AIRPORTS.filter(a =>
            a.city.toLowerCase().includes(query.toLowerCase()) ||
            a.code.toLowerCase().includes(query.toLowerCase()) ||
            a.name.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 6)
        : AIRPORTS.slice(0, 6);

    const handleSelect = (airport: typeof AIRPORTS[0]) => {
        setQuery(`${airport.city} (${airport.code})`);
        onChange(airport.code, airport.city);
        setOpen(false);
    };

    return (
        <div style={{ position: 'relative' as const, flex: 1 }}>
            <label
                htmlFor={id}
                style={{
                    display: 'block',
                    fontSize: '11px',
                    fontWeight: 700,
                    textTransform: 'uppercase' as const,
                    letterSpacing: '0.08em',
                    color: 'var(--v6-text-muted)',
                    marginBottom: '6px',
                }}
            >
                {label}
            </label>
            <input
                id={id}
                type="text"
                value={query}
                placeholder={placeholder ?? 'Grad ili IATA kod...'}
                autoComplete="off"
                onChange={e => { setQuery(e.target.value); setOpen(true); }}
                onFocus={() => { setFocused(true); setOpen(true); }}
                onBlur={() => { setFocused(false); setTimeout(() => setOpen(false), 200); }}
                style={{
                    width: '100%',
                    padding: '11px 14px',
                    border: `1.5px solid ${focused ? 'var(--v6-accent)' : 'var(--v6-border)'}`,
                    borderRadius: 'var(--v6-radius-md)',
                    background: 'var(--v6-bg-main)',
                    color: 'var(--v6-text-primary)',
                    fontSize: 'var(--v6-fs-sm)',
                    fontFamily: 'var(--v6-font)',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    boxSizing: 'border-box' as const,
                }}
                aria-autocomplete="list"
                aria-expanded={open}
                aria-controls={`${id}-list`}
            />
            {/* Dropdown */}
            {open && (
                <div
                    id={`${id}-list`}
                    role="listbox"
                    style={{
                        position: 'absolute' as const,
                        top: '100%',
                        left: 0,
                        right: 0,
                        zIndex: 600,
                        background: 'var(--v6-bg-card)',
                        border: '1.5px solid var(--v6-border)',
                        borderRadius: 'var(--v6-radius-md)',
                        boxShadow: 'var(--v6-shadow-md)',
                        overflow: 'hidden',
                        marginTop: '4px',
                    }}
                >
                    {filtered.map(a => (
                        <div
                            key={a.code}
                            role="option"
                            aria-selected={false}
                            onMouseDown={() => handleSelect(a)}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '9px 14px',
                                cursor: 'pointer',
                                borderBottom: '1px solid var(--v6-border)',
                                transition: 'background 0.1s',
                            }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'var(--v6-bg-section)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                            <span style={{
                                padding: '2px 6px',
                                background: 'var(--v6-bg-section)',
                                borderRadius: '4px',
                                fontFamily: 'monospace',
                                fontWeight: 800,
                                fontSize: '13px',
                                color: 'var(--v6-accent)',
                                flexShrink: 0,
                            }}>{a.code}</span>
                            <div>
                                <div style={{ fontSize: 'var(--v6-fs-xs)', fontWeight: 700, color: 'var(--v6-text-primary)' }}>
                                    {a.city}
                                </div>
                                <div style={{ fontSize: '11px', color: 'var(--v6-text-muted)' }}>
                                    {a.name} · {a.country}
                                </div>
                            </div>
                        </div>
                    ))}
                    {filtered.length === 0 && (
                        <div style={{ padding: '12px 14px', fontSize: '13px', color: 'var(--v6-text-muted)' }}>
                            Nema rezultata za "{query}"
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// ─────────────────────────────────────────────────────────────
// MAIN COMPONENT: FlightSearchForm
// ─────────────────────────────────────────────────────────────
export const FlightSearchForm: React.FC = () => {
    const { 
        addAlert, 
        setFlightSearchParams, 
        setIsSearching, 
        setResults, 
        setSearchPerformed,
        searchMode,
        semanticQuery 
    } = useSearchStore();

    const [tripType, setTripType] = useState<'roundtrip' | 'oneway' | 'multicity'>('roundtrip');
    const [origin, setOrigin] = useState({ code: '', city: '' });
    const [destination, setDestination] = useState({ code: '', city: '' });
    const [departDate, setDepartDate] = useState('');
    const [returnDate, setReturnDate] = useState('');
    const [adults, setAdults] = useState(1);
    const [children, setChildren] = useState(0);
    const [infants, setInfants] = useState(0);
    const [cabinClass, setCabinClass] = useState<'economy' | 'premium' | 'business' | 'first'>('economy');
    const [directOnly, setDirectOnly] = useState(false);

    const totalPax = adults + children + infants;

    const swap = () => {
        const tmp = { ...origin };
        setOrigin({ ...destination });
        setDestination({ ...tmp });
    };

    const validate = (): boolean => {
        if (!origin.code) {
            addAlert({ id: 'fl-orig', message: 'Izaberite polazni aerodrom.', severity: 'warning' });
            return false;
        }
        if (!destination.code) {
            addAlert({ id: 'fl-dest', message: 'Izaberite odredišni aerodrom.', severity: 'warning' });
            return false;
        }
        if (origin.code === destination.code) {
            addAlert({ id: 'fl-same', message: 'Polazak i odredište ne smeju biti isti aerodrom.', severity: 'warning' });
            return false;
        }
        if (!departDate) {
            addAlert({ id: 'fl-date', message: 'Izaberite datum polaska.', severity: 'warning' });
            return false;
        }
        if (tripType === 'roundtrip' && !returnDate) {
            addAlert({ id: 'fl-ret', message: 'Izaberite datum povratka za povratni let.', severity: 'warning' });
            return false;
        }
        if (tripType === 'roundtrip' && returnDate <= departDate) {
            addAlert({ id: 'fl-retord', message: 'Datum povratka mora biti posle datuma polaska.', severity: 'warning' });
            return false;
        }
        return true;
    };

    const handleSearch = () => {
        if (!validate()) return;

        const params: FlightSearchParams = {
            tripType,
            origin: origin.code,
            originCity: origin.city,
            destination: destination.code,
            destinationCity: destination.city,
            departDate,
            returnDate: tripType === 'roundtrip' ? returnDate : undefined,
            adults,
            children,
            infants,
            cabinClass,
            directOnly,
        };

        setFlightSearchParams(params);
        setIsSearching(true);
        // Mock delay — Faza Orchestrator zameniće ovo pravim API pozivima
        setTimeout(() => {
            setResults([]);
            setIsSearching(false);
            setSearchPerformed(true);
        }, 1800);
    };

    // Minimalni datumi
    const today = new Date().toISOString().split('T')[0];

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column' as const,
            gap: '16px',
        }}>
            {/* 1. SELECTION MODES */}
            <SearchModeSelector />

            {/* 2. AI ASSISTANT FIELD */}
            {(searchMode === 'semantic' || searchMode === 'hybrid') && <AIAssistantField />}

            {/* 3. FLIGHT FORM (Hidden in pure Semantic) */}
            {searchMode !== 'semantic' && (
                <>
            {/* ── Tip leta ──────────────────────────────── */}
            <div style={{ display: 'flex', gap: '6px' }}>
                {([
                    { value: 'roundtrip', label: '↔ Povratni' },
                    { value: 'oneway',    label: '→ U jednom pravcu' },
                    { value: 'multicity', label: '⊕ Više destinacija' },
                ] as const).map(opt => (
                    <button
                        key={opt.value}
                        onClick={() => setTripType(opt.value)}
                        style={{
                            padding: '6px 14px',
                            border: `1.5px solid ${tripType === opt.value ? 'var(--v6-accent)' : 'var(--v6-border)'}`,
                            borderRadius: 'var(--v6-radius-sm)',
                            background: tripType === opt.value ? 'var(--v6-accent)' : 'transparent',
                            color: tripType === opt.value ? 'var(--v6-accent-text)' : 'var(--v6-text-muted)',
                            fontSize: '13px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontFamily: 'var(--v6-font)',
                            transition: 'all 0.18s',
                        }}
                        aria-pressed={tripType === opt.value}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>

            {/* ── Origine / Destinacija ─────────────────── */}
            <div style={{
                display: 'flex',
                alignItems: 'flex-end',
                gap: '8px',
                flexWrap: 'wrap' as const,
            }}>
                <AirportSelector
                    id="v6-fl-origin"
                    label="Polazak"
                    value={origin.code ? `${origin.city} (${origin.code})` : ''}
                    onChange={(code, city) => setOrigin({ code, city })}
                    placeholder="Npr. Beograd (BEG)"
                />

                {/* Swap dugme */}
                <button
                    onClick={swap}
                    aria-label="Zameni polazak i odredište"
                    title="Zameni pravac"
                    style={{
                        padding: '11px 10px',
                        border: '1.5px solid var(--v6-border)',
                        borderRadius: 'var(--v6-radius-md)',
                        background: 'var(--v6-bg-section)',
                        cursor: 'pointer',
                        fontSize: '18px',
                        color: 'var(--v6-text-muted)',
                        flexShrink: 0,
                        transition: 'color 0.15s, transform 0.2s',
                        marginBottom: '0px',
                    }}
                    onMouseEnter={e => {
                        (e.currentTarget as HTMLButtonElement).style.transform = 'rotate(180deg)';
                        (e.currentTarget as HTMLButtonElement).style.color = 'var(--v6-accent)';
                    }}
                    onMouseLeave={e => {
                        (e.currentTarget as HTMLButtonElement).style.transform = 'rotate(0)';
                        (e.currentTarget as HTMLButtonElement).style.color = 'var(--v6-text-muted)';
                    }}
                >
                    ⇄
                </button>

                <AirportSelector
                    id="v6-fl-dest"
                    label="Odredište"
                    value={destination.code ? `${destination.city} (${destination.code})` : ''}
                    onChange={(code, city) => setDestination({ code, city })}
                    placeholder="Npr. Tivat (TIV)"
                />
            </div>

            {/* ── Datumi ───────────────────────────────── */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' as const }}>
                <div style={{ flex: 1, minWidth: '160px' }}>
                    <label
                        htmlFor="v6-fl-depart"
                        style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: 'var(--v6-text-muted)', marginBottom: '6px' }}
                    >
                        📅 Datum polaska
                    </label>
                    <input
                        id="v6-fl-depart"
                        type="date"
                        min={today}
                        value={departDate}
                        onChange={e => setDepartDate(e.target.value)}
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
                            boxSizing: 'border-box' as const,
                        }}
                    />
                </div>

                {tripType === 'roundtrip' && (
                    <div style={{ flex: 1, minWidth: '160px' }}>
                        <label
                            htmlFor="v6-fl-return"
                            style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: 'var(--v6-text-muted)', marginBottom: '6px' }}
                        >
                            📅 Datum povratka
                        </label>
                        <input
                            id="v6-fl-return"
                            type="date"
                            min={departDate || today}
                            value={returnDate}
                            onChange={e => setReturnDate(e.target.value)}
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
                                boxSizing: 'border-box' as const,
                            }}
                        />
                    </div>
                )}
            </div>

            {/* ── Putnici + Klasa ──────────────────────── */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' as const, alignItems: 'flex-end' }}>
                {/* Putnici brojači */}
                <div style={{
                    display: 'flex',
                    gap: '16px',
                    padding: '12px 16px',
                    border: '1.5px solid var(--v6-border)',
                    borderRadius: 'var(--v6-radius-md)',
                    background: 'var(--v6-bg-main)',
                    flexWrap: 'wrap' as const,
                    flex: 1,
                }}>
                    {([
                        { label: 'Odrasli',  sublabel: '12+', value: adults,   min: 1, set: setAdults },
                        { label: 'Deca',     sublabel: '2–11', value: children, min: 0, set: setChildren },
                        { label: 'Bebe',     sublabel: '0–2',  value: infants,  min: 0, set: setInfants },
                    ] as const).map(pax => (
                        <div key={pax.label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div>
                                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--v6-text-primary)' }}>{pax.label}</div>
                                <div style={{ fontSize: '11px', color: 'var(--v6-text-muted)' }}>{pax.sublabel}</div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <button
                                    onClick={() => pax.set(Math.max(pax.min, pax.value - 1))}
                                    disabled={pax.value <= pax.min}
                                    style={{
                                        width: '28px', height: '28px', borderRadius: '50%',
                                        border: '1.5px solid var(--v6-border)',
                                        background: 'var(--v6-bg-section)', cursor: 'pointer',
                                        fontSize: '16px', fontWeight: 700, color: 'var(--v6-text-primary)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        opacity: pax.value <= pax.min ? 0.35 : 1,
                                    }}
                                    aria-label={`Smanji ${pax.label}`}
                                >−</button>
                                <span style={{ minWidth: '20px', textAlign: 'center' as const, fontWeight: 700, fontSize: 'var(--v6-fs-sm)', color: 'var(--v6-text-primary)' }}>
                                    {pax.value}
                                </span>
                                <button
                                    onClick={() => pax.set(pax.value + 1)}
                                    disabled={totalPax >= 9}
                                    style={{
                                        width: '28px', height: '28px', borderRadius: '50%',
                                        border: '1.5px solid var(--v6-border)',
                                        background: 'var(--v6-bg-section)', cursor: 'pointer',
                                        fontSize: '16px', fontWeight: 700, color: 'var(--v6-text-primary)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        opacity: totalPax >= 9 ? 0.35 : 1,
                                    }}
                                    aria-label={`Povećaj ${pax.label}`}
                                >+</button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Klasa */}
                <div style={{ flexShrink: 0, minWidth: '200px' }}>
                    <label
                        htmlFor="v6-fl-cabin"
                        style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: 'var(--v6-text-muted)', marginBottom: '6px' }}
                    >
                        💺 Klasa putovanja
                    </label>
                    <select
                        id="v6-fl-cabin"
                        value={cabinClass}
                        onChange={e => setCabinClass(e.target.value as typeof cabinClass)}
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
                        }}
                    >
                        {CABIN_CLASSES.map(c => (
                            <option key={c.value} value={c.value}>{c.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* ── Opcije + Search dugme ─────────────────── */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' as const }}>
                <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: 'var(--v6-text-secondary)',
                }}>
                    <input
                        type="checkbox"
                        checked={directOnly}
                        onChange={e => setDirectOnly(e.target.checked)}
                        style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--v6-accent)' }}
                        id="v6-fl-direct"
                    />
                    Samo direktni letovi
                </label>

                <div style={{ flex: 1 }} />

                <div style={{ fontSize: '12px', color: 'var(--v6-text-muted)' }}>
                    {totalPax} {totalPax === 1 ? 'putnik' : totalPax < 5 ? 'putnika' : 'putnika'} ·
                    {' '}{CABIN_CLASSES.find(c => c.value === cabinClass)?.label}
                </div>

                <button
                    onClick={handleSearch}
                    id="v6-fl-search-btn"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '12px 28px',
                        background: 'var(--v6-accent)',
                        color: 'var(--v6-accent-text)',
                        border: 'none',
                        borderRadius: 'var(--v6-radius-md)',
                        fontSize: 'var(--v6-fs-md)',
                        fontWeight: 700,
                        cursor: 'pointer',
                        fontFamily: 'var(--v6-font)',
                        transition: 'opacity 0.15s',
                    }}
                >
                    ✈️ Pretraži letove
                </button>
            </div>
            </>
            )}
        </div>
    );
};

export default FlightSearchForm;
