import React, { useState } from 'react';
import type { TourResult } from '../../types';
import { useSearchStore } from '../../stores/useSearchStore';

const formatPrice = (n: number, currency = 'EUR') =>
    new Intl.NumberFormat('de-DE', { style: 'currency', currency, minimumFractionDigits: 0 }).format(n);

const IncludedFeature: React.FC<{ ok: boolean; label: string; icon: string }> = ({ ok, label, icon }) => (
    ok ? (
        <span title={label} style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: '28px', height: '28px', borderRadius: '50%',
            background: 'var(--v6-bg-main)', border: '1px solid var(--v6-border)',
            fontSize: '14px',
        }}>
            {icon}
        </span>
    ) : null
);

interface TourCardProps {
    tour: TourResult;
    index?: number;
}

export const TourCard: React.FC<TourCardProps> = ({ tour, index = 0 }) => {
    const { addToBasket } = useSearchStore();
    const [booked, setBooked] = useState(false);
    const [showItin, setShowItin] = useState(false);

    const handleAdd = () => {
        addToBasket({
            id: `tour-${tour.id}`,
            type: 'tour',
            label: `🌍 ${tour.name}`,
            details: `${tour.durationDays} dana · ${tour.destinationName} · ${tour.supplierName}`,
            pricePerUnit: tour.pricePerPerson,
            totalPrice: tour.totalPrice,
            currency: tour.currency,
            status: tour.status,
            icon: '🌍',
            isRemovable: true,
        });
        setBooked(true);
        setTimeout(() => setBooked(false), 3000);
    };

    return (
        <div style={{
            background: 'var(--v6-bg-card)',
            border: `1.5px solid ${tour.isPrime ? 'var(--v6-color-prime)' : 'var(--v6-border)'}`,
            borderRadius: 'var(--v6-radius-lg)',
            overflow: 'hidden',
            boxShadow: tour.isPrime ? '0 4px 16px rgba(180,83,9,0.1)' : 'var(--v6-shadow-sm)',
            animation: 'v6-fade-in 0.3s ease forwards',
            animationDelay: `${index * 0.05}s`, opacity: 0,
        }}>
            {tour.isPrime && (
                <div style={{ padding: '6px 16px', background: 'linear-gradient(135deg, var(--v6-color-prime), #f59e0b)', color: '#fff', fontSize: '11px', fontWeight: 800, letterSpacing: '0.05em' }}>
                    🏆 PRIME — Garantovan polazak & PrimeClick organizacija
                </div>
            )}

            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                {/* ── IMAGE ── */}
                <div style={{ width: '220px', minHeight: '180px', position: 'relative', flexShrink: 0 }}>
                    <img src={tour.image} alt={tour.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', color: '#fff', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 800 }}>
                        {tour.durationDays} dana / {tour.durationNights} noći
                    </div>
                </div>

                {/* ── INFO SREDINA ── */}
                <div style={{ flex: 1, padding: '16px', minWidth: '280px', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                            <div style={{ fontSize: '11px', color: 'var(--v6-text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '4px' }}>
                                {tour.categoryLabel} · {tour.destinationName}
                            </div>
                            <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--v6-text-primary)', marginBottom: '6px', lineHeight: 1.2 }}>
                                {tour.name}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--v6-text-muted)', marginBottom: '12px' }}>
                                <span>{tour.supplierLogo}</span>
                                <span>{tour.supplierName}</span>
                                {tour.rating && (
                                    <>
                                        <span>·</span>
                                        <span style={{ color: '#f59e0b' }}>★</span>
                                        <span style={{ fontWeight: 700, color: 'var(--v6-text-primary)' }}>{tour.rating}</span>
                                        <span>({tour.reviewCount})</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    <div style={{ fontSize: '13px', color: 'var(--v6-text-secondary)', lineHeight: 1.5, marginBottom: '14px', flex: 1 }}>
                        {tour.itinerarySummary}
                    </div>

                    {/* INCLUDED ICONS */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--v6-text-muted)' }}>UKLJUČENO:</div>
                        <div style={{ display: 'flex', gap: '4px' }}>
                            <IncludedFeature ok={tour.included.flights}   icon="✈️" label="Avio prevoz uključen" />
                            <IncludedFeature ok={tour.transportType === 'bus'} icon="🚌" label="Autobuski prevoz uključen" />
                            <IncludedFeature ok={tour.included.hotels}    icon="🛏️" label="Smeštaj uključen" />
                            <IncludedFeature ok={tour.included.transfers} icon="🚕" label="Transferi uključeni" />
                            <IncludedFeature ok={tour.included.meals}     icon="🍽️" label="Obroci po programu" />
                            <IncludedFeature ok={tour.included.guide}     icon="🗣️" label="Vodič na srpskom" />
                        </div>
                        {tour.itineraryDetails.length > 0 && (
                            <button onClick={() => setShowItin(!showItin)}
                                style={{ marginLeft: 'auto', background: 'none', border: 'none', color: 'var(--v6-accent)', fontSize: '12px', fontWeight: 700, cursor: 'pointer', outline: 'none' }}>
                                {showItin ? 'Zatvori program' : 'Vidi program po danima ↓'}
                            </button>
                        )}
                    </div>
                </div>

                {/* ── CENA I DATUMI ── */}
                <div style={{ width: '200px', padding: '16px', borderLeft: '1px solid var(--v6-border)', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'space-between', flexShrink: 0, background: 'var(--v6-bg-section)' }}>
                    <div style={{ width: '100%' }}>
                        <div style={{ fontSize: '11px', color: 'var(--v6-text-muted)', fontWeight: 600, marginBottom: '6px' }}>Polasci:</div>
                        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginBottom: '16px' }}>
                            {tour.departureDates.slice(0, 3).map(d => (
                                <span key={d} style={{ fontSize: '11px', padding: '2px 6px', background: 'var(--v6-bg-main)', border: '1px solid var(--v6-border)', borderRadius: '4px', color: 'var(--v6-text-secondary)' }}>
                                    {new Date(d).toLocaleDateString('sr')}
                                </span>
                            ))}
                            {tour.departureDates.length > 3 && <span style={{ fontSize: '11px', color: 'var(--v6-text-muted)' }}>+{tour.departureDates.length - 3}</span>}
                        </div>
                    </div>

                    <div style={{ textAlign: 'right', width: '100%' }}>
                        <div style={{ fontSize: '12px', color: 'var(--v6-text-muted)' }}>Ukupno za {tour.includedPax} os.</div>
                        <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--v6-text-primary)', lineHeight: 1.1 }}>
                            {formatPrice(tour.totalPrice, tour.currency)}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--v6-color-instant-text)', marginTop: '4px', marginBottom: '12px' }}>
                            {formatPrice(tour.pricePerPerson, tour.currency)} / os.
                        </div>

                        <button onClick={handleAdd}
                            style={{
                                width: '100%', padding: '10px 0', borderRadius: 'var(--v6-radius-md)',
                                background: booked ? 'var(--v6-color-instant)' : 'var(--v6-accent)',
                                color: booked ? '#fff' : 'var(--v6-accent-text)', border: 'none',
                                fontSize: '13px', fontWeight: 800, cursor: 'pointer', fontFamily: 'var(--v6-font)',
                                transition: 'all 0.2s',
                            }}>
                            {booked ? '✓ Rezervisano' : 'Odaberi termin →'}
                        </button>
                    </div>
                </div>
            </div>

            {/* ── ITINERARY DROPDOWN ── */}
            {showItin && tour.itineraryDetails.length > 0 && (
                <div style={{ borderTop: '1px solid var(--v6-border)', background: 'var(--v6-bg-section)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', animation: 'v6-slide-down 0.2s ease forwards' }}>
                    <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--v6-text-primary)' }}>PLAN PUTOVANJA PO DANIMA</div>
                    {tour.itineraryDetails.map(day => (
                        <div key={day.dayNumber} style={{ display: 'flex', gap: '12px' }}>
                            <div style={{ width: '40px', flexShrink: 0, textAlign: 'center', fontWeight: 800, fontSize: '11px', color: 'var(--v6-accent)', background: 'rgba(99,102,241,0.1)', height: '24px', lineHeight: '24px', borderRadius: '4px' }}>
                                D{day.dayNumber}
                            </div>
                            <div>
                                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--v6-text-primary)', marginBottom: '2px' }}>
                                    {day.title}
                                    {day.mealsIncluded && day.mealsIncluded.length > 0 && (
                                        <span style={{ fontSize: '10px', color: 'var(--v6-color-prime)', marginLeft: '8px', border: '1px solid var(--v6-color-prime-alpha)', padding: '1px 4px', borderRadius: '4px' }}>
                                            {day.mealsIncluded.join(', ')}
                                        </span>
                                    )}
                                </div>
                                <div style={{ fontSize: '12px', color: 'var(--v6-text-secondary)', lineHeight: 1.4 }}>
                                    {day.description}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
