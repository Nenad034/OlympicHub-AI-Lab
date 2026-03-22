import React, { useState } from 'react';
import type { TransferResult } from '../../types';
import { useSearchStore } from '../../stores/useSearchStore';

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
const formatPrice = (n: number, currency = 'EUR') =>
    new Intl.NumberFormat('de-DE', { style: 'currency', currency, minimumFractionDigits: 0 }).format(n);

const formatDuration = (min: number) => {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return h > 0 ? (m > 0 ? `${h}h ${m}min` : `${h}h`) : `${m}min`;
};

const starColor = '#f59e0b';

const statusStyle: Record<string, { bg: string; border: string; text: string; label: string }> = {
    instant:      { bg: 'rgba(5,150,105,0.08)',   border: '#059669', text: '#047857', label: '⚡ Odmah potvrđeno' },
    'on-request': { bg: 'rgba(245,158,11,0.08)',  border: '#d97706', text: '#b45309', label: '❓ Na upit' },
    'sold-out':   { bg: 'rgba(239,68,68,0.08)',   border: '#ef4444', text: '#dc2626', label: '🔴 Nije dostupno' },
};

// Ikona uključene usluge
const Feature: React.FC<{ ok: boolean; label: string }> = ({ ok, label }) => (
    ok ? (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '12px', color: 'var(--v6-color-instant-text)', padding: '2px 9px', borderRadius: '999px', background: 'rgba(5,150,105,0.07)', border: '1px solid rgba(5,150,105,0.2)' }}>
            ✓ {label}
        </span>
    ) : null
);

// ─────────────────────────────────────────────────────────────
// STAR RATING
// ─────────────────────────────────────────────────────────────
const StarRating: React.FC<{ rating: number; count?: number }> = ({ rating, count }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        {'★★★★★'.split('').map((s, i) => (
            <span key={i} style={{ fontSize: '13px', color: i < Math.round(rating) ? starColor : '#d1d5db' }}>{s}</span>
        ))}
        <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--v6-text-primary)', marginLeft: '2px' }}>{rating.toFixed(1)}</span>
        {count && <span style={{ fontSize: '11px', color: 'var(--v6-text-muted)' }}>({count} ocena)</span>}
    </div>
);

// ─────────────────────────────────────────────────────────────
// MAIN: TransferCard
// ─────────────────────────────────────────────────────────────
interface TransferCardProps {
    transfer: TransferResult;
    direction?: 'one-way' | 'round-trip';
    index?: number;
}

export const TransferCard: React.FC<TransferCardProps> = ({ transfer, direction = 'one-way', index = 0 }) => {
    const { addToBasket } = useSearchStore();
    const [booked, setBooked] = useState(false);

    const sc = statusStyle[transfer.status] ?? statusStyle.instant;
    const price = direction === 'round-trip' ? transfer.priceRoundTrip : transfer.priceOneWay;
    const priceLabel = direction === 'round-trip' ? 'Povratni' : 'U jednom pravcu';

    const handleBook = () => {
        addToBasket({
            id: `transfer-${transfer.id}`,
            type: 'transfer',
            label: `🚌 ${transfer.vehicle.name}`,
            details: `${transfer.pickupName} → ${transfer.dropoffName} · ${priceLabel} · ${transfer.supplierName}`,
            pricePerUnit: price,
            totalPrice: price,
            currency: transfer.currency,
            status: transfer.status,
            icon: transfer.vehicle.image,
            isRemovable: true,
        });
        setBooked(true);
        setTimeout(() => setBooked(false), 3000);
    };

    return (
        <div
            style={{
                background: 'var(--v6-bg-card)',
                border: `1.5px solid ${transfer.isPrime ? 'rgba(180,83,9,0.35)' : 'var(--v6-border)'}`,
                borderRadius: 'var(--v6-radius-lg)',
                overflow: 'hidden',
                boxShadow: transfer.isPrime ? '0 2px 14px rgba(180,83,9,0.09)' : 'var(--v6-shadow-sm)',
                animation: 'v6-fade-in 0.3s ease forwards',
                animationDelay: `${index * 0.06}s`,
                opacity: 0,
            }}
        >
            {/* ── PRIME TRAKA ── */}
            {transfer.isPrime && (
                <div style={{ padding: '4px 16px', background: 'linear-gradient(135deg,#b45309,#f59e0b)', fontSize: '11px', fontWeight: 800, color: '#fff', letterSpacing: '0.05em' }}>
                    🏆 PRIME — Vlastiti vozački park PrimeClick Travel
                </div>
            )}

            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                {/* ── Leva traka: Vozilo ── */}
                <div style={{ width: '130px', minHeight: '160px', background: 'var(--v6-bg-section)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px', gap: '6px', flexShrink: 0, borderRight: '1px solid var(--v6-border)' }}>
                    <div style={{ fontSize: '48px', lineHeight: 1 }}>{transfer.vehicle.image}</div>
                    <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--v6-text-muted)', textAlign: 'center' }}>
                        {transfer.vehicle.categoryLabel}
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--v6-text-primary)', textAlign: 'center' }}>
                        {transfer.vehicle.seats} sedišta
                    </div>
                </div>

                {/* ── Sredina: Info ── */}
                <div style={{ flex: 1, padding: '16px', minWidth: '220px' }}>
                    {/* Naziv + Snabdevač + Status */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '10px' }}>
                        <div>
                            <div style={{ fontSize: 'var(--v6-fs-md)', fontWeight: 800, color: 'var(--v6-text-primary)', marginBottom: '3px' }}>
                                {transfer.vehicle.name}
                            </div>
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                <span style={{ fontSize: '14px' }}>{transfer.supplierLogo}</span>
                                <span style={{ fontSize: '12px', color: 'var(--v6-text-muted)' }}>{transfer.supplierName}</span>
                            </div>
                        </div>
                        <span style={{ padding: '3px 10px', borderRadius: '999px', background: sc.bg, border: `1px solid ${sc.border}`, color: sc.text, fontSize: '11px', fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0 }}>
                            {sc.label}
                        </span>
                    </div>

                    {/* Ruta + udaljenost + trajanje */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--v6-text-primary)' }}>{transfer.pickupName}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}>
                            <div style={{ height: '1px', background: 'var(--v6-border)', flex: 1, minWidth: '20px' }} />
                            <span style={{ fontSize: '11px', color: 'var(--v6-text-muted)', whiteSpace: 'nowrap' }}>
                                {transfer.distance}km · {formatDuration(transfer.durationMinutes)}
                            </span>
                            <div style={{ height: '1px', background: 'var(--v6-border)', flex: 1, minWidth: '20px' }} />
                        </div>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--v6-text-primary)' }}>{transfer.dropoffName}</span>
                    </div>

                    {/* Features (uključeno) */}
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '8px' }}>
                        <Feature ok={transfer.vehicle.hasMeetGreet}        label="Meet & Greet" />
                        <Feature ok={transfer.vehicle.hasFlightTracking}   label="Flight Tracking" />
                        <Feature ok={transfer.vehicle.hasAC}               label="Klima" />
                        <Feature ok={transfer.vehicle.hasWifi}             label="WiFi" />
                        <Feature ok={transfer.vehicle.hasChildSeat}        label="Dečije sedište" />
                    </div>

                    {/* Otkazivanje */}
                    <div style={{ fontSize: '12px', color: 'var(--v6-color-instant-text)', marginBottom: '4px' }}>
                        {transfer.cancellationPolicy}
                    </div>

                    {/* Napomena */}
                    {transfer.notes && (
                        <div style={{ fontSize: '11px', color: 'var(--v6-text-muted)', fontStyle: 'italic', lineHeight: 1.5 }}>
                            {transfer.notes}
                        </div>
                    )}

                    {/* Rating */}
                    {transfer.rating && (
                        <div style={{ marginTop: '8px' }}>
                            <StarRating rating={transfer.rating} count={transfer.reviewCount} />
                        </div>
                    )}
                </div>

                {/* ── Desna kolona: Cena + Dugme ── */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'space-between', padding: '16px', borderLeft: '1px solid var(--v6-border)', minWidth: '160px', flexShrink: 0, gap: '10px' }}>
                    {/* Cena */}
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '22px', fontWeight: 900, color: 'var(--v6-text-primary)', lineHeight: 1.1 }}>
                            {formatPrice(price, transfer.currency)}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--v6-text-muted)', marginTop: '2px' }}>
                            {priceLabel}
                        </div>
                        {direction === 'one-way' && transfer.priceRoundTrip && (
                            <div style={{ fontSize: '11px', color: 'var(--v6-text-muted)', marginTop: '4px' }}>
                                Povratni: <strong>{formatPrice(transfer.priceRoundTrip, transfer.currency)}</strong>
                            </div>
                        )}
                        <div style={{ fontSize: '11px', color: 'var(--v6-text-muted)', marginTop: '2px' }}>
                            {transfer.vehicle.luggage} kofera uključeno
                        </div>
                    </div>

                    {/* Rezerviši */}
                    <button
                        onClick={handleBook}
                        disabled={transfer.status === 'sold-out'}
                        style={{
                            width: '100%',
                            padding: '10px 0',
                            background: booked ? 'var(--v6-color-instant)' : transfer.status === 'sold-out' ? 'var(--v6-border)' : 'var(--v6-accent)',
                            color: transfer.status === 'sold-out' ? 'var(--v6-text-muted)' : '#fff',
                            border: 'none', borderRadius: 'var(--v6-radius-md)',
                            fontSize: 'var(--v6-fs-sm)', fontWeight: 700,
                            cursor: transfer.status === 'sold-out' ? 'not-allowed' : 'pointer',
                            fontFamily: 'var(--v6-font)', transition: 'background 0.2s',
                        }}
                    >
                        {booked ? '✓ Dodano u korpu' : transfer.status === 'sold-out' ? 'Nije dostupno' : 'Rezerviši →'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TransferCard;
