import React, { useState } from 'react';
import { useSearchStore } from '../../stores/useSearchStore';
import { MOCK_CAR_RESULTS } from '../../data/mockCars';
import type { CarVehicle } from '../../types';

// ─────────────────────────────────────────────────────────────
// LOKACIJE
// ─────────────────────────────────────────────────────────────
const CAR_LOCATIONS = [
    { code: 'BEG', label: '✈️ Aerodrom Beograd – Nikola Tesla' },
    { code: 'INI', label: '✈️ Aerodrom Niš – Constantine The Great' },
    { code: 'TIV', label: '✈️ Aerodrom Tivat' },
    { code: 'DBV', label: '✈️ Aerodrom Dubrovnik' },
    { code: 'BEG-CTR', label: '🏙️ Beograd Centar – Terazije' },
    { code: 'TIV-CTR', label: '🏙️ Tivat Centar' },
    { code: 'HOTEL', label: '🏨 Isporuka na hotel' },
];

// ─────────────────────────────────────────────────────────────
// SHARED KPMPONENTI
// ─────────────────────────────────────────────────────────────
const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: '0.08em', color: 'var(--v6-text-muted)', marginBottom: '6px' }}>
        {children}
    </label>
);

const inputStyle: React.CSSProperties = {
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
};

const selectStyle: React.CSSProperties = {
    ...inputStyle,
    cursor: 'pointer',
    appearance: 'none' as const,
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 12px center',
    paddingRight: '36px',
};

// ─────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────
export const CarSearchForm: React.FC = () => {
    const { setCarResults, setIsSearching } = useSearchStore();

    // Forma state
    const today = new Date().toISOString().split('T')[0];
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const [pickupLoc,   setPickupLoc]   = useState('BEG');
    const [dropoffLoc,  setDropoffLoc]  = useState('BEG');
    const [sameDropoff, setSameDropoff] = useState(true);
    const [pickupDate,  setPickupDate]  = useState('2026-07-05');
    const [pickupTime,  setPickupTime]  = useState('10:00');
    const [dropoffDate, setDropoffDate] = useState('2026-07-12');
    const [dropoffTime, setDropoffTime] = useState('10:00');
    const [driverAge,   setDriverAge]   = useState(30);
    const [loading,     setLoading]     = useState(false);

    // Kalkuliši broj dana najma
    const calcDays = () => {
        const d1 = new Date(pickupDate);
        const d2 = new Date(dropoffDate);
        const diff = Math.ceil((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
        return diff > 0 ? diff : 1;
    };

    const days = calcDays();

    const handleSearch = () => {
        if (new Date(dropoffDate) <= new Date(pickupDate)) return;

        setLoading(true);
        setIsSearching(true);

        setTimeout(() => {
            // Filtriraj prema minDriverAge
            let results: CarVehicle[] = MOCK_CAR_RESULTS.filter(c => c.minDriverAge <= driverAge);

            // Kalkuliši totalPrice za stvarni broj dana
            results = results.map(c => ({
                ...c,
                totalPrice: Math.round(c.pricePerDay * days),
                // Ispravi lokacije prema selekciji
                pickupLocationName: CAR_LOCATIONS.find(l => l.code === pickupLoc)?.label.replace(/^[^ ]+ /, '') ?? c.pickupLocationName,
                dropoffLocationName: sameDropoff
                    ? (CAR_LOCATIONS.find(l => l.code === pickupLoc)?.label.replace(/^[^ ]+ /, '') ?? c.dropoffLocationName)
                    : (CAR_LOCATIONS.find(l => l.code === dropoffLoc)?.label.replace(/^[^ ]+ /, '') ?? c.dropoffLocationName),
            }));

            // Sortuj: PRIME prvo, zatim po priority
            results.sort((a, b) => {
                if (a.isPrime && !b.isPrime) return -1;
                if (!a.isPrime && b.isPrime) return 1;
                return b.priority - a.priority;
            });

            setCarResults(results);
            setLoading(false);
        }, 1300);
    };

    const dateError = dropoffDate && pickupDate && new Date(dropoffDate) <= new Date(pickupDate);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Red 1: Pickup Lokacija + Dropoff */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                {/* Pickup Lokacija */}
                <div>
                    <Label>📍 Preuzimanje vozila</Label>
                    <select value={pickupLoc} onChange={e => setPickupLoc(e.target.value)} style={selectStyle}>
                        {CAR_LOCATIONS.map(l => (
                            <option key={l.code} value={l.code}>{l.label}</option>
                        ))}
                    </select>
                </div>

                {/* Dropoff Lokacija (samo ako nije ista) */}
                <div>
                    <Label>🏁 Vraćanje vozila</Label>
                    {sameDropoff ? (
                        <div style={{ ...inputStyle, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
                             onClick={() => setSameDropoff(false)}>
                            <span style={{ color: 'var(--v6-text-muted)' }}>Ista lokacija</span>
                            <span style={{ fontSize: '12px', color: 'var(--v6-accent)', fontWeight: 600 }}>Promeni</span>
                        </div>
                    ) : (
                        <select value={dropoffLoc} onChange={e => setDropoffLoc(e.target.value)} style={selectStyle}>
                            {CAR_LOCATIONS.map(l => (
                                <option key={l.code} value={l.code}>{l.label}</option>
                            ))}
                        </select>
                    )}
                    {!sameDropoff && (
                        <button type="button" onClick={() => setSameDropoff(true)}
                            style={{ marginTop: '4px', background: 'none', border: 'none', fontSize: '11px', color: 'var(--v6-text-muted)', cursor: 'pointer', fontFamily: 'var(--v6-font)' }}>
                            ↩ Vrati na istu lokaciju
                        </button>
                    )}
                </div>
            </div>

            {/* Red 2: Datumi + Vreme */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
                {/* Pickup datum */}
                <div>
                    <Label>📅 Datum preuzimanja</Label>
                    <input type="date" value={pickupDate} min={today}
                        onChange={e => setPickupDate(e.target.value)}
                        style={inputStyle} />
                </div>

                {/* Pickup vreme */}
                <div>
                    <Label>⏰ Vreme preuzimanja</Label>
                    <input type="time" value={pickupTime}
                        onChange={e => setPickupTime(e.target.value)}
                        style={inputStyle} />
                </div>

                {/* Dropoff datum */}
                <div>
                    <Label>📅 Datum vraćanja</Label>
                    <input type="date" value={dropoffDate} min={pickupDate}
                        onChange={e => setDropoffDate(e.target.value)}
                        style={{ ...inputStyle, borderColor: dateError ? '#ef4444' : 'var(--v6-border)' }} />
                    {dateError && <div style={{ fontSize: '11px', color: '#ef4444', marginTop: '3px' }}>Datum vraćanja mora biti posle preuzimanja</div>}
                </div>

                {/* Dropoff vreme */}
                <div>
                    <Label>⏰ Vreme vraćanja</Label>
                    <input type="time" value={dropoffTime}
                        onChange={e => setDropoffTime(e.target.value)}
                        style={inputStyle} />
                </div>
            </div>

            {/* Red 3: Vozačka dob + Info + Button */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                {/* Vozačka dob */}
                <div style={{ minWidth: '160px' }}>
                    <Label>🪪 Dob vozača (god.)</Label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button type="button" onClick={() => setDriverAge(Math.max(18, driverAge - 1))}
                            style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1.5px solid var(--v6-border)', background: 'var(--v6-bg-main)', color: 'var(--v6-text-primary)', fontSize: '18px', cursor: 'pointer', fontWeight: 700 }}>−</button>
                        <span style={{ minWidth: '36px', textAlign: 'center', fontSize: 'var(--v6-fs-md)', fontWeight: 800, color: 'var(--v6-text-primary)' }}>{driverAge}</span>
                        <button type="button" onClick={() => setDriverAge(Math.min(99, driverAge + 1))}
                            style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1.5px solid var(--v6-border)', background: 'var(--v6-bg-main)', color: 'var(--v6-text-primary)', fontSize: '18px', cursor: 'pointer', fontWeight: 700 }}>+</button>
                        {driverAge < 25 && (
                            <span style={{ fontSize: '11px', color: '#d97706', fontWeight: 600 }}>⚠️ Primeniće se doplata za mlađe vozače</span>
                        )}
                    </div>
                </div>

                {/* Broj dana info */}
                {!dateError && (
                    <div style={{ padding: '8px 14px', background: 'var(--v6-bg-section)', borderRadius: 'var(--v6-radius-md)', border: '1px solid var(--v6-border)', fontSize: 'var(--v6-fs-xs)', color: 'var(--v6-text-muted)' }}>
                        <strong style={{ color: 'var(--v6-text-primary)', fontSize: 'var(--v6-fs-sm)' }}>{days} dana</strong> najma
                    </div>
                )}

                {/* Pretraži */}
                <div style={{ marginLeft: 'auto' }}>
                    <button
                        type="button"
                        onClick={handleSearch}
                        disabled={loading || !!dateError}
                        id="v6-car-search-btn"
                        style={{
                            padding: '11px 28px',
                            background: loading || dateError ? 'var(--v6-border)' : 'var(--v6-accent)',
                            color: loading || dateError ? 'var(--v6-text-muted)' : 'var(--v6-accent-text)',
                            border: 'none',
                            borderRadius: 'var(--v6-radius-md)',
                            fontSize: 'var(--v6-fs-sm)',
                            fontWeight: 700,
                            cursor: loading || dateError ? 'not-allowed' : 'pointer',
                            fontFamily: 'var(--v6-font)',
                            whiteSpace: 'nowrap',
                            transition: 'background 0.2s',
                        }}
                    >
                        {loading ? '⏳ Pretražujem...' : '🔍 Pretraži vozila'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CarSearchForm;
