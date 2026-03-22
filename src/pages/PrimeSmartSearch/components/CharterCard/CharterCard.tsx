import React, { useState } from 'react';
import type { CharterResult, CharterDeparture } from '../../types';
import { useSearchStore } from '../../stores/useSearchStore';

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
const formatPrice = (n: number, currency = 'EUR') =>
    new Intl.NumberFormat('de-DE', { style: 'currency', currency, minimumFractionDigits: 0 }).format(n);

const formatDate = (d: string) => {
    const date = new Date(d + 'T12:00:00');
    return date.toLocaleDateString('sr-Latn-RS', { day: 'numeric', month: 'short', weekday: 'short' });
};

const formatDateFull = (d: string) => {
    const date = new Date(d + 'T12:00:00');
    return date.toLocaleDateString('sr-Latn-RS', { day: 'numeric', month: 'long', year: 'numeric' });
};

const formatDuration = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

const getSeatsColor = (seats: number, total: number) => {
    if (seats === 0) return { bg: 'rgba(239,68,68,0.08)', border: '#ef4444', text: '#dc2626' };
    const pct = seats / total;
    if (pct <= 0.15) return { bg: 'rgba(245,158,11,0.08)', border: '#d97706', text: '#b45309' };
    return { bg: 'rgba(5,150,105,0.08)', border: '#059669', text: '#047857' };
};

// ─────────────────────────────────────────────────────────────
// DEPARTURE ROW — Jedan red u tabeli polazaka
// ─────────────────────────────────────────────────────────────
const DepartureRow: React.FC<{
    dep: CharterDeparture;
    isSelected: boolean;
    onSelect: () => void;
    onBook: () => void;
}> = ({ dep, isSelected, onSelect, onBook }) => {
    const colors = getSeatsColor(dep.availableSeats, dep.totalSeats);
    const isSoldOut = dep.availableSeats === 0;
    const isLow = dep.availableSeats > 0 && dep.availableSeats <= 5;

    return (
        <div
            onClick={() => !isSoldOut && onSelect()}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '11px 16px',
                borderBottom: '1px solid var(--v6-border)',
                background: isSelected ? 'var(--v6-color-instant-bg)' : 'transparent',
                cursor: isSoldOut ? 'not-allowed' : 'pointer',
                opacity: isSoldOut ? 0.55 : 1,
                transition: 'background 0.15s',
            }}
        >
            {/* Datum polaska */}
            <div style={{ width: '80px', flexShrink: 0 }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--v6-text-primary)' }}>
                    {formatDate(dep.departDate)}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--v6-text-muted)' }}>
                    → {formatDate(dep.returnDate)}
                </div>
            </div>

            {/* Noćenja */}
            <div style={{ width: '55px', flexShrink: 0, textAlign: 'center' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--v6-text-secondary)' }}>
                    {dep.nights}n
                </div>
            </div>

            {/* Status slobodnih mesta */}
            <div style={{ flex: 1, display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                {isSoldOut ? (
                    <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '999px', background: 'rgba(239,68,68,0.1)', color: '#dc2626', border: '1px solid #ef4444' }}>
                        🔴 Rasprodato
                    </span>
                ) : (
                    <>
                        <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '999px', background: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}>
                            {dep.availableSeats === 0 ? '—' : `${dep.availableSeats} mesta`}
                        </span>
                        {dep.isOwnAllotment && (
                            <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 7px', borderRadius: '999px', background: 'rgba(180,83,9,0.1)', color: 'var(--v6-color-prime)', border: '1px solid var(--v6-color-prime)' }}>
                                🏆 PRIME
                            </span>
                        )}
                        {dep.allotmentNote && (
                            <span style={{ fontSize: '11px', color: isLow ? '#d97706' : 'var(--v6-text-muted)' }}>
                                {dep.allotmentNote}
                            </span>
                        )}
                    </>
                )}
            </div>

            {/* Cena */}
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 'var(--v6-fs-md)', fontWeight: 900, color: 'var(--v6-text-primary)', whiteSpace: 'nowrap' }}>
                    {formatPrice(dep.totalPrice)}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--v6-text-muted)', whiteSpace: 'nowrap' }}>
                    {formatPrice(dep.pricePerPerson)}/os
                </div>
            </div>

            {/* Akcija */}
            <div style={{ flexShrink: 0, width: '90px' }}>
                {!isSoldOut && (
                    <button
                        onClick={(e) => { e.stopPropagation(); onBook(); }}
                        style={{
                            width: '100%',
                            padding: '8px 0',
                            background: isSelected ? 'var(--v6-color-instant)' : 'var(--v6-accent)',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: 'var(--v6-radius-md)',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            fontFamily: 'var(--v6-font)',
                            transition: 'background 0.2s',
                        }}
                    >
                        {isSelected ? '✓ Odabrano' : 'Odaberi →'}
                    </button>
                )}
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────
// MAIN: CharterCard
// ─────────────────────────────────────────────────────────────
interface CharterCardProps {
    charter: CharterResult;
    index?: number;
}

export const CharterCard: React.FC<CharterCardProps> = ({ charter, index = 0 }) => {
    const { addToBasket } = useSearchStore();
    const [expanded, setExpanded] = useState(index === 0); // Prvi otvoren
    const [selectedDepId, setSelectedDepId] = useState<string | null>(null);

    const availableCount = charter.departures.filter(d => d.availableSeats > 0).length;
    const soldOutCount   = charter.departures.filter(d => d.availableSeats === 0).length;
    const lowestPrice    = Math.min(...charter.departures.filter(d => d.availableSeats > 0).map(d => d.pricePerPerson));
    const contractLabel: Record<CharterResult['contractType'], string> = {
        'own':       '🏆 Vlastiti allotment',
        'block':     '📋 Block allotment',
        'seat-only': '💺 Seat-only',
    };

    const handleBook = (dep: CharterDeparture) => {
        addToBasket({
            id: `charter-${charter.id}-${dep.id}`,
            type: 'flight',
            label: `🎫 ${charter.airline} — Čarter`,
            details: `${charter.origin} → ${charter.destination} · ${formatDateFull(dep.departDate)} · ${dep.nights} noćenja`,
            pricePerUnit: dep.pricePerPerson,
            totalPrice: dep.totalPrice,
            currency: dep.currency,
            status: dep.status,
            icon: charter.airlineLogo,
            isRemovable: true,
        });
        setSelectedDepId(dep.id);
    };

    return (
        <div
            style={{
                background: 'var(--v6-bg-card)',
                border: `1.5px solid ${charter.isPrime ? 'rgba(180,83,9,0.4)' : 'var(--v6-border)'}`,
                borderRadius: 'var(--v6-radius-lg)',
                overflow: 'hidden',
                boxShadow: charter.isPrime ? '0 2px 12px rgba(180,83,9,0.10)' : 'var(--v6-shadow-sm)',
                animation: 'v6-fade-in 0.3s ease forwards',
                animationDelay: `${index * 0.07}s`,
                opacity: 0,
            }}
        >
            {/* ── HEADER ── */}
            <div
                onClick={() => setExpanded(!expanded)}
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '14px',
                    padding: '16px 20px',
                    cursor: 'pointer',
                    background: charter.isPrime ? 'linear-gradient(135deg, rgba(180,83,9,0.05), rgba(245,158,11,0.03))' : 'var(--v6-bg-card)',
                    userSelect: 'none',
                }}
            >
                {/* Logo + Info */}
                <div style={{ fontSize: '28px', flexShrink: 0 }}>{charter.airlineLogo}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '4px' }}>
                        <span style={{ fontSize: 'var(--v6-fs-md)', fontWeight: 800, color: 'var(--v6-text-primary)' }}>
                            {charter.airline}
                        </span>
                        {charter.isPrime && (
                            <span style={{ padding: '2px 9px', background: 'linear-gradient(135deg,#b45309,#f59e0b)', color: '#fff', borderRadius: '999px', fontSize: '10px', fontWeight: 800 }}>
                                🏆 PRIME
                            </span>
                        )}
                        <span style={{ fontSize: '11px', padding: '2px 8px', border: '1px solid var(--v6-border)', borderRadius: '4px', color: 'var(--v6-text-muted)', background: 'var(--v6-bg-section)' }}>
                            {contractLabel[charter.contractType]}
                        </span>
                    </div>

                    {/* Ruta + Detalji leta */}
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '13px', color: 'var(--v6-text-secondary)' }}>
                        <span>
                            <strong style={{ color: 'var(--v6-text-primary)' }}>{charter.origin}</strong>
                            {' '}<span style={{ color: 'var(--v6-text-muted)' }}>→</span>{' '}
                            <strong style={{ color: 'var(--v6-text-primary)' }}>{charter.destination}</strong>
                            {' · '}{charter.originCity}–{charter.destinationCity}
                        </span>
                        <span>✈️ {charter.flightNo}</span>
                        <span>⏱ {formatDuration(charter.flightDuration)}</span>
                        <span>🛫 {charter.departureTime} · 🛬 {charter.returnTime}</span>
                    </div>
                </div>

                {/* Dostupnost summary */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '11px', color: 'var(--v6-text-muted)', marginBottom: '2px' }}>
                        {availableCount} polazaka dostupno
                        {soldOutCount > 0 && <span style={{ color: '#ef4444' }}> · {soldOutCount} rasprodato</span>}
                    </div>
                    {availableCount > 0 && (
                        <div style={{ fontSize: 'var(--v6-fs-md)', fontWeight: 900, color: 'var(--v6-text-primary)' }}>
                            od {formatPrice(lowestPrice)}/os
                        </div>
                    )}
                </div>

                {/* Prtljag */}
                <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '3px', alignItems: 'flex-end' }}>
                    <span style={{ fontSize: '11px', color: charter.baggageIncluded ? 'var(--v6-color-instant-text)' : 'var(--v6-text-muted)' }}>
                        {charter.baggageIncluded ? `✓ Prtljag ${charter.checkedBagKg}kg` : '✗ Bez prtljaga'}
                    </span>
                </div>

                {/* Expand toggle */}
                <div style={{ flexShrink: 0, color: 'var(--v6-text-muted)', fontSize: '16px', transition: 'transform 0.2s', transform: expanded ? 'rotate(180deg)' : 'rotate(0)' }}>
                    ▼
                </div>
            </div>

            {/* ── KALENDAR POLAZAKA ── */}
            {expanded && (
                <div>
                    {/* Zaglavlje tabele polazaka */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '8px 16px',
                        background: 'var(--v6-bg-section)',
                        borderTop: '1px solid var(--v6-border)',
                    }}>
                        <div style={{ width: '80px', flexShrink: 0, fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--v6-text-muted)' }}>Polazak</div>
                        <div style={{ width: '55px', flexShrink: 0, fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--v6-text-muted)', textAlign: 'center' }}>Noćenja</div>
                        <div style={{ flex: 1, fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--v6-text-muted)' }}>Slobodna mesta</div>
                        <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--v6-text-muted)', textAlign: 'right', marginRight: '102px' }}>Cena</div>
                    </div>

                    {/* Redovi polazaka */}
                    {charter.departures.map(dep => (
                        <DepartureRow
                            key={dep.id}
                            dep={dep}
                            isSelected={selectedDepId === dep.id}
                            onSelect={() => setSelectedDepId(dep.id === selectedDepId ? null : dep.id)}
                            onBook={() => handleBook(dep)}
                        />
                    ))}

                    {/* Info bar */}
                    <div style={{ padding: '10px 16px', background: 'var(--v6-bg-section)', borderTop: '1px solid var(--v6-border)', fontSize: '11px', color: 'var(--v6-text-muted)', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                        <span>⚡ Odmah potvrđeno = slobodna mesta</span>
                        <span>❓ Na upit = malo mesta, moguće čekanje potvrde</span>
                        <span>🔴 Rasprodato = nema mesta za rezervaciju</span>
                        <span style={{ marginLeft: 'auto' }}>Cene su okvirne · {charter.baggageIncluded ? `✓ Prtljag ${charter.checkedBagKg}kg uključen` : '✗ Prtljag se doplaćuje'}</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CharterCard;
