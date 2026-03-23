import React, { useState } from 'react';
import type { TourResult } from '../../types';
import { useSearchStore } from '../../stores/useSearchStore';
import { Plane, Bed, Utensils, Users, Info, MapPin } from 'lucide-react';
import type { ViewMode } from '../HotelCard/HotelCard';

const formatPrice = (n: number, currency = 'EUR') =>
    new Intl.NumberFormat('de-DE', { style: 'currency', currency, minimumFractionDigits: 0 }).format(n);

const IncludedFeature: React.FC<{ ok: boolean; label: string; icon: React.ReactNode }> = ({ ok, label, icon }) => (
    ok ? (
        <div title={label} style={{
            display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px',
            color: 'var(--text-muted)', fontWeight: 600, background: 'var(--bg-app)',
            padding: '3px 8px', borderRadius: '6px', border: '1px solid var(--border-color)'
        }}>
            <span className="icon-luxury" style={{ display: 'flex' }}>{icon}</span>
            <span>{label}</span>
        </div>
    ) : null
);

interface TourCardProps {
    tour: TourResult;
    index?: number;
    viewMode?: ViewMode;
}

export const TourCard: React.FC<TourCardProps> = ({ tour, index = 0, viewMode = 'list' }) => {
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

    const delayClass = index < 6 ? `v6-delay-${index + 1}` : '';

    // ══════════════════════════════════════════════════════════
    // NOTEPAD VIEW
    // ══════════════════════════════════════════════════════════
    if (viewMode === 'notepad') {
        return (
            <article
                className={`v6-hotel-notepad-row v6-fade-in-up ${delayClass}`}
                aria-label={`Paket: ${tour.name}`}
                data-testid={`tour-card-${tour.id}`}
            >
                <span className="v6-notepad-idx">{String(index + 1).padStart(2, '0')}</span>

                <div className="v6-notepad-name-col">
                    {tour.isPrime && <span className="v6-notepad-prime">PRIME</span>}
                    <span className="v6-notepad-name">{tour.name}</span>
                </div>

                <span className="v6-notepad-location">
                    📍 {tour.destinationName}
                </span>

                <span className="v6-notepad-meal">
                    {tour.durationDays}d / {tour.durationNights}n
                </span>

                {tour.rating
                    ? <span className="v6-notepad-rating">⭐ {tour.rating}</span>
                    : <span className="v6-notepad-rating">—</span>
                }

                <span className={`v6-notepad-status ${tour.status === 'instant' ? 'v6-np-instant' : 'v6-np-request'}`}>
                    {tour.status === 'instant' ? '⚡ Odmah' : '❓ Upit'}
                </span>

                <span className="v6-notepad-price">
                    {formatPrice(tour.totalPrice, tour.currency)}
                </span>

                <button
                    className="v6-notepad-cta"
                    onClick={handleAdd}
                    aria-label={`Rezerviši ${tour.name}`}
                >
                    {booked ? '✓ Odabrano' : 'Rezerviši →'}
                </button>
            </article>
        );
    }

    // ══════════════════════════════════════════════════════════
    // GRID VIEW
    // ══════════════════════════════════════════════════════════
    if (viewMode === 'grid') {
        return (
            <article
                className={`v6-hotel-grid-card v6-fade-in-up ${delayClass}`}
                aria-label={`Paket: ${tour.name}`}
                data-testid={`tour-card-${tour.id}`}
                style={{ animationDelay: `${index * 0.07}s` }}
            >
                <div className="v6-grid-card-image">
                    <img src={tour.image} alt={tour.name} />
                    <div style={{
                        position: 'absolute', top: '10px', left: '10px',
                        background: 'rgba(26,35,78,0.85)', backdropFilter: 'blur(8px)',
                        color: '#fff', padding: '4px 10px', borderRadius: '8px',
                        fontSize: '10px', fontWeight: 800
                    }}>
                        {tour.durationDays}D / {tour.durationNights}N
                    </div>
                    <div style={{ position: 'absolute', bottom: '10px', left: '10px', display: 'flex', gap: '5px' }}>
                        {tour.isPrime && <span className="v6-grid-prime-badge">🏆 PRIME</span>}
                        <span className="v6-grid-prime-badge" style={{ background: 'var(--brand-accent)' }}>{tour.categoryLabel}</span>
                    </div>
                </div>

                <div className="v6-grid-card-body">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
                        <MapPin size={12} className="icon-luxury" />
                        {tour.destinationName}
                    </div>
                    <h3 className="v6-grid-card-name">{tour.name}</h3>
                    {tour.rating && (
                        <div className="v6-grid-card-rating">
                            <span className="v6-grid-rating-score" style={{ background: 'rgba(245,158,11,0.1)', color: '#d97706', fontSize: '11px' }}>
                                ⭐ {tour.rating}
                            </span>
                            <span className="v6-grid-rating-count">({tour.reviewCount})</span>
                        </div>
                    )}
                    <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginTop: '4px' }}>
                        {tour.included.flights && <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-app)', color: 'var(--text-muted)' }}>✈ Avio</span>}
                        {tour.included.hotels && <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-app)', color: 'var(--text-muted)' }}>🛏 Smeštaj</span>}
                        {tour.included.meals && <span style={{ fontSize: '10px', padding: '2px 7px', borderRadius: '6px', border: '1px solid var(--border-color)', background: 'var(--bg-app)', color: 'var(--text-muted)' }}>🍴 Obroci</span>}
                    </div>
                </div>

                <div className="v6-grid-card-footer">
                    <div>
                        <div className="price-label">Ukupno za {tour.includedPax} os.</div>
                        <div className="v6-grid-price">{formatPrice(tour.totalPrice, tour.currency)}</div>
                        <div className="v6-grid-breakdown">{formatPrice(tour.pricePerPerson, tour.currency)} / os.</div>
                    </div>
                    <button className="v6-card-cta-btn v6-grid-cta" onClick={handleAdd}>
                        {booked ? '✓ Odabrano' : 'Rezerviši paket'}
                    </button>
                </div>
            </article>
        );
    }

    // ══════════════════════════════════════════════════════════
    // LIST VIEW (default) — šira i kraća
    // ══════════════════════════════════════════════════════════
    return (
        <article
            className="search-result-card v6-list-card v6-fade-in-up"
            style={{ animationDelay: `${index * 0.07}s` }}
        >
            {/* COL 1: IMAGE & BADGES */}
            <div className="card-image-section">
                <img src={tour.image} alt={tour.name} />

                <div style={{
                    position: 'absolute', top: '10px', left: '10px',
                    background: 'rgba(26, 35, 78, 0.85)', backdropFilter: 'blur(8px)',
                    color: '#fff', padding: '5px 10px', borderRadius: '8px',
                    fontSize: '10px', fontWeight: 800, boxShadow: 'var(--shadow-sm)',
                    border: '1px solid rgba(255,255,255,0.1)'
                }}>
                    {tour.durationDays} DANA / {tour.durationNights} NOĆI
                </div>

                <div style={{ position: 'absolute', bottom: '10px', left: '10px', display: 'flex', gap: '5px' }}>
                    {tour.isPrime && <span className="badge-luxury">🏆 PRIME</span>}
                    <span className="badge-luxury" style={{ background: 'var(--brand-accent)', color: '#fff' }}>
                        {tour.categoryLabel}
                    </span>
                </div>
            </div>

            {/* COL 2: TOUR INFO */}
            <div className="card-info-section" style={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
                        <MapPin size={12} className="icon-luxury" />
                        {tour.destinationName}
                    </div>
                    {tour.rating && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(245,158,11,0.1)', color: '#d97706', padding: '2px 7px', borderRadius: '6px', fontSize: '10px', fontWeight: 800 }}>
                            ⭐ {tour.rating} <span style={{ opacity: 0.7, fontWeight: 600 }}>({tour.reviewCount})</span>
                        </div>
                    )}
                </div>

                <h3 style={{ fontSize: '17px', fontWeight: 900, color: 'var(--text-main)', marginBottom: '5px', lineHeight: 1.2 }}>
                    {tour.name}
                </h3>

                <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.4, marginBottom: '8px' }}>
                    {tour.itinerarySummary.slice(0, 100)}...
                </p>

                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: 'auto' }}>
                    <IncludedFeature ok={tour.included.flights}   icon={<Plane size={11} />} label="Avio" />
                    <IncludedFeature ok={tour.included.hotels}    icon={<Bed size={11} />} label="Smeštaj" />
                    <IncludedFeature ok={tour.included.meals}     icon={<Utensils size={11} />} label="Obroci" />
                    <IncludedFeature ok={tour.included.guide}     icon={<Users size={11} />} label="Vodič" />
                </div>
            </div>

            {/* COL 3: PRICE & ACTION */}
            <div className="price-section">
                <div className="price-label">Ukupno za {tour.includedPax} os.</div>
                <div className="price-amount" style={{ fontSize: '22px' }}>
                    {formatPrice(tour.totalPrice, tour.currency)}
                </div>
                <div className="badge-luxury" style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--brand-accent)', fontSize: '10px', padding: '2px 8px' }}>
                    {formatPrice(tour.pricePerPerson, tour.currency)} po osobi
                </div>

                <div style={{ width: '100%', marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <button
                        className="v6-card-cta-btn"
                        onClick={handleAdd}
                        style={{ width: '100%', padding: '9px', borderRadius: '10px' }}
                    >
                        {booked ? '✓ Odabrano' : 'Rezerviši paket'}
                    </button>

                    <button
                        className="counter-btn-luxury"
                        onClick={() => setShowItin(!showItin)}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '11px', fontWeight: 700 }}
                    >
                        <Info size={14} />
                        {showItin ? 'Zatvori program' : 'Vidi plan puta'}
                    </button>
                </div>
            </div>

            {/* ITINERARY DROPDOWN */}
            {showItin && tour.itineraryDetails.length > 0 && (
                <div style={{
                    gridColumn: '1 / span 3',
                    padding: '20px 24px',
                    background: 'var(--bg-app)',
                    borderTop: '1px solid var(--border-color)',
                    animation: 'v6FadeInUp 0.3s ease'
                }}>
                    <h4 style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--brand-accent)', marginBottom: '12px', letterSpacing: '0.05em' }}>
                        PLAN PUTOVANJA PO DANIMA
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {tour.itineraryDetails.map(day => (
                            <div key={day.dayNumber} style={{ display: 'flex', gap: '12px' }}>
                                <div style={{
                                    width: '32px', height: '32px', flexShrink: 0,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontWeight: 900, fontSize: '11px', color: 'var(--brand-accent)',
                                    background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '8px'
                                }}>
                                    {day.dayNumber}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '3px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        {day.title}
                                        {day.mealsIncluded && day.mealsIncluded.length > 0 && (
                                            <span style={{ fontSize: '10px', color: 'var(--brand-accent)', background: 'rgba(26,35,78,0.05)', padding: '2px 7px', borderRadius: '5px', border: '1px solid var(--border-color)' }}>
                                                🍴 {day.mealsIncluded.join(', ')}
                                            </span>
                                        )}
                                    </div>
                                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.4, margin: 0 }}>
                                        {day.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </article>
    );
};

export default TourCard;
