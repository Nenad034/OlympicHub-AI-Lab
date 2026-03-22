import React, { useState } from 'react';
import type { CarVehicle } from '../../types';
import { useSearchStore } from '../../stores/useSearchStore';

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
const formatPrice = (n: number, currency = 'EUR') =>
    new Intl.NumberFormat('de-DE', { style: 'currency', currency, minimumFractionDigits: 0 }).format(n);

const fuelLabel: Record<string, string> = {
    petrol: '⛽ Benzin',
    diesel: '🛢️ Dizel',
    electric: '⚡ Električni',
    hybrid: '♻️ Hibrid',
};

const transmissionLabel: Record<string, string> = {
    manual: '🔧 Manuelni',
    automatic: '🤖 Automatik',
};

const statusColors: Record<string, { bg: string; border: string; text: string; label: string }> = {
    instant:    { bg: 'rgba(5,150,105,0.08)',   border: '#059669', text: '#047857', label: '⚡ Odmah potvrđeno' },
    'on-request': { bg: 'rgba(245,158,11,0.08)', border: '#d97706', text: '#b45309', label: '❓ Na upit' },
    'sold-out': { bg: 'rgba(239,68,68,0.08)',   border: '#ef4444', text: '#dc2626', label: '🔴 Nedostupno' },
};

// Policy Icon Row
const PolicyIcon: React.FC<{ ok: boolean; label: string }> = ({ ok, label }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: ok ? 'var(--v6-color-instant-text)' : 'var(--v6-text-muted)', opacity: ok ? 1 : 0.55 }}>
        <span style={{ fontSize: '12px' }}>{ok ? '✓' : '—'}</span>
        <span>{label}</span>
    </div>
);

// ─────────────────────────────────────────────────────────────
// MAIN: CarCard
// ─────────────────────────────────────────────────────────────
interface CarCardProps {
    car: CarVehicle;
    days?: number;
    index?: number;
}

export const CarCard: React.FC<CarCardProps> = ({ car, days = 7, index = 0 }) => {
    const { addToBasket } = useSearchStore();
    const [expanded, setExpanded] = useState(false);
    const [booked, setBooked] = useState(false);

    const sc = statusColors[car.status] ?? statusColors.instant;
    const isSoldOut = car.status === 'sold-out';

    const handleBook = () => {
        addToBasket({
            id: `car-${car.id}`,
            type: 'car',
            label: `🚗 ${car.name}`,
            details: `${car.categoryLabel} · ${transmissionLabel[car.transmission]} · ${days} dana · ${car.supplierName}`,
            pricePerUnit: car.pricePerDay,
            totalPrice: car.totalPrice,
            currency: car.priceCurrency,
            status: car.status,
            icon: car.image,
            isRemovable: true,
        });
        setBooked(true);
        setTimeout(() => setBooked(false), 3000);
    };

    return (
        <div
            style={{
                background: 'var(--v6-bg-card)',
                border: `1.5px solid ${car.isPrime ? 'rgba(180,83,9,0.35)' : 'var(--v6-border)'}`,
                borderRadius: 'var(--v6-radius-lg)',
                overflow: 'hidden',
                boxShadow: car.isPrime ? '0 2px 12px rgba(180,83,9,0.08)' : 'var(--v6-shadow-sm)',
                animation: 'v6-fade-in 0.3s ease forwards',
                animationDelay: `${index * 0.06}s`,
                opacity: 0,
            }}
        >
            {/* ── PRIME BADGE TRAKA ── */}
            {car.isPrime && (
                <div style={{ padding: '4px 16px', background: 'linear-gradient(135deg, #b45309, #f59e0b)', fontSize: '11px', fontWeight: 800, color: '#fff', letterSpacing: '0.05em' }}>
                    🏆 PRIME — Preporučeno od PrimeClick Travel
                </div>
            )}

            {/* ── MAIN SADRŽAJ ── */}
            <div style={{ display: 'flex', gap: '0', flexWrap: 'wrap' }}>
                {/* Leva strana: Vozilo slika + Kategorija */}
                <div style={{ width: '140px', minHeight: '140px', background: 'var(--v6-bg-section)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '16px', flexShrink: 0, borderRight: '1px solid var(--v6-border)' }}>
                    <div style={{ fontSize: '52px', lineHeight: 1 }}>{car.image}</div>
                    <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--v6-text-muted)', textAlign: 'center' }}>
                        {car.categoryLabel}
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--v6-text-muted)', textAlign: 'center' }}>ili sličan</div>
                </div>

                {/* Sredina: Info */}
                <div style={{ flex: 1, padding: '16px', minWidth: '220px' }}>
                    {/* Header: naziv + snabdevač */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px', marginBottom: '10px' }}>
                        <div>
                            <div style={{ fontSize: 'var(--v6-fs-md)', fontWeight: 800, color: 'var(--v6-text-primary)', marginBottom: '2px' }}>
                                {car.name}
                            </div>
                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                <span style={{ fontSize: '14px' }}>{car.supplierLogo}</span>
                                <span style={{ fontSize: '12px', color: 'var(--v6-text-muted)' }}>{car.supplierName}</span>
                            </div>
                        </div>
                        <div style={{ padding: '3px 10px', borderRadius: '999px', background: sc.bg, border: `1px solid ${sc.border}`, color: sc.text, fontSize: '11px', fontWeight: 700, whiteSpace: 'nowrap' }}>
                            {sc.label}
                        </div>
                    </div>

                    {/* Specifikacije grid */}
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '10px' }}>
                        {[
                            { icon: '👥', val: `${car.seats} sedi.` },
                            { icon: '🚪', val: `${car.doors} vrata` },
                            { icon: '🧳', val: `${car.largeBags}+${car.smallBags} torbe` },
                            { icon: '❄️', val: car.hasAC ? 'Klima' : 'Bez klime' },
                        ].map((s, i) => (
                            <span key={i} style={{ fontSize: '12px', color: 'var(--v6-text-secondary)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                {s.icon} {s.val}
                            </span>
                        ))}
                    </div>

                    {/* Transmisija + Gorivo */}
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '12px', padding: '3px 10px', border: '1px solid var(--v6-border)', borderRadius: '4px', color: 'var(--v6-text-secondary)', background: 'var(--v6-bg-section)' }}>
                            {transmissionLabel[car.transmission]}
                        </span>
                        <span style={{ fontSize: '12px', padding: '3px 10px', border: '1px solid var(--v6-border)', borderRadius: '4px', color: car.fuel === 'electric' ? '#047857' : 'var(--v6-text-secondary)', background: car.fuel === 'electric' ? 'rgba(5,150,105,0.06)' : 'var(--v6-bg-section)' }}>
                            {fuelLabel[car.fuel]}
                        </span>
                        {car.minDriverAge > 21 && (
                            <span style={{ fontSize: '12px', padding: '3px 10px', border: '1px solid #d97706', borderRadius: '4px', color: '#b45309', background: 'rgba(245,158,11,0.06)' }}>
                                🪪 Min. {car.minDriverAge} god.
                            </span>
                        )}
                    </div>

                    {/* Pickup/Dropoff */}
                    <div style={{ marginTop: '10px', fontSize: '11px', color: 'var(--v6-text-muted)', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <div>📍 Preuzimanje: <strong style={{ color: 'var(--v6-text-secondary)' }}>{car.pickupLocationName}</strong></div>
                        <div>🏁 Vraćanje: <strong style={{ color: 'var(--v6-text-secondary)' }}>{car.dropoffLocationName}</strong></div>
                    </div>
                </div>

                {/* Desna strana: Cena + Dugme */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'space-between', padding: '16px', borderLeft: '1px solid var(--v6-border)', minWidth: '170px', flexShrink: 0 }}>
                    {/* Cena */}
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 'var(--v6-fs-xxl, 22px)', fontWeight: 900, color: 'var(--v6-text-primary)', lineHeight: 1.1 }}>
                            {formatPrice(car.totalPrice)}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--v6-text-muted)', marginTop: '2px' }}>
                            {formatPrice(car.pricePerDay)}/dan · {days} dana
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--v6-text-muted)', marginTop: '4px' }}>
                            Depozit: {formatPrice(car.depositAmount)}
                        </div>
                    </div>

                    {/* Policy summary */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px' }}>
                        <PolicyIcon ok={car.policy.unlimitedMileage}        label="Neograničena km" />
                        <PolicyIcon ok={car.policy.collisionDamageWaiver}   label="CDW uključen" />
                        <PolicyIcon ok={car.policy.theftProtection}         label="Krađa uključena" />
                        {car.policy.freeCancellationHours > 0 && (
                            <div style={{ fontSize: '11px', color: 'var(--v6-color-instant-text)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                                ✓ Besplatno otkazivanje {car.policy.freeCancellationHours}h pre
                            </div>
                        )}
                    </div>

                    {/* Rezerviši */}
                    <button
                        onClick={handleBook}
                        disabled={isSoldOut}
                        style={{
                            marginTop: '12px',
                            width: '100%',
                            padding: '10px 0',
                            background: booked ? 'var(--v6-color-instant)' : isSoldOut ? 'var(--v6-border)' : 'var(--v6-accent)',
                            color: isSoldOut ? 'var(--v6-text-muted)' : '#ffffff',
                            border: 'none',
                            borderRadius: 'var(--v6-radius-md)',
                            fontSize: 'var(--v6-fs-sm)',
                            fontWeight: 700,
                            cursor: isSoldOut ? 'not-allowed' : 'pointer',
                            fontFamily: 'var(--v6-font)',
                            transition: 'background 0.2s',
                        }}
                    >
                        {booked ? '✓ Dodano u korpu' : isSoldOut ? 'Nedostupno' : 'Izaberi vozilo →'}
                    </button>

                    {/* Policy expand link */}
                    <button onClick={() => setExpanded(!expanded)} type="button"
                        style={{ background: 'none', border: 'none', color: 'var(--v6-text-muted)', fontSize: '11px', cursor: 'pointer', marginTop: '6px', fontFamily: 'var(--v6-font)', textDecoration: 'underline' }}>
                        {expanded ? 'Sakrij uslove ▲' : 'Svi uslovi ▼'}
                    </button>
                </div>
            </div>

            {/* ── EXPANDED POLICY ── */}
            {expanded && (
                <div style={{ padding: '16px 20px', borderTop: '1px solid var(--v6-border)', background: 'var(--v6-bg-section)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                    <div>
                        <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--v6-text-muted)', marginBottom: '8px' }}>
                            Šta je uključeno u cenu:
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            <PolicyIcon ok={car.policy.unlimitedMileage}        label="Neograničena kilometraža" />
                            <PolicyIcon ok={car.policy.collisionDamageWaiver}   label="CDW — Zaštita od sudara" />
                            <PolicyIcon ok={car.policy.theftProtection}         label="Zaštita od krađe vozila" />
                            <PolicyIcon ok={car.policy.liabilityInsurance}      label="Osnovno osiguranje" />
                            <PolicyIcon ok={car.policy.freeCancellationHours > 0} label={`Besplatan otkaz ${car.policy.freeCancellationHours}h unapred`} />
                        </div>
                    </div>
                    <div>
                        <div style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--v6-text-muted)', marginBottom: '8px' }}>
                            Napomene:
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--v6-text-secondary)', lineHeight: 1.6 }}>
                            • Depozit od {formatPrice(car.depositAmount)} se blokira na kartici pri preuzimanju<br />
                            • Min. starost vozača: {car.minDriverAge} godina<br />
                            {car.transmission === 'automatic' && '• Vozilo je automatik — vozački list za manuelni nije potreban\n'}
                            {car.fuel === 'electric' && '• Električno vozilo — punjač uključen, potreban kablić\n'}
                            • Gorivo: zadajte puno, vraćajte puno (Full-to-Full)
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CarCard;
