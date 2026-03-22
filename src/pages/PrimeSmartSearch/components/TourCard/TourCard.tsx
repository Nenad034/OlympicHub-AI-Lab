import React, { useState } from 'react';
import type { TourResult } from '../../types';
import { useSearchStore } from '../../stores/useSearchStore';
import { Plane, Bed, Utensils, Users, Info, MapPin } from 'lucide-react';

const formatPrice = (n: number, currency = 'EUR') =>
    new Intl.NumberFormat('de-DE', { style: 'currency', currency, minimumFractionDigits: 0 }).format(n);

const IncludedFeature: React.FC<{ ok: boolean; label: string; icon: React.ReactNode }> = ({ ok, label, icon }) => (
    ok ? (
        <div title={label} style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '11px',
            color: 'var(--text-muted)',
            fontWeight: 600,
            background: 'var(--bg-app)',
            padding: '4px 8px',
            borderRadius: '6px',
            border: '1px solid var(--border-color)'
        }}>
            <span className="icon-luxury" style={{ display: 'flex' }}>{icon}</span>
            <span>{label}</span>
        </div>
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
        <article
            className="search-result-card v6-fade-in-up"
            style={{ animationDelay: `${index * 0.07}s` }}
        >
            {/* ── COL 1: IMAGE & BADGES ── */}
            <div className="card-image-section">
                <img src={tour.image} alt={tour.name} />
                
                {/* Duration Badge */}
                <div style={{ 
                    position: 'absolute', 
                    top: '12px', 
                    left: '12px', 
                    background: 'rgba(26, 35, 78, 0.85)', 
                    backdropFilter: 'blur(8px)',
                    color: '#fff', 
                    padding: '6px 12px', 
                    borderRadius: '10px', 
                    fontSize: '11px', 
                    fontWeight: 800,
                    boxShadow: 'var(--shadow-sm)',
                    border: '1px solid rgba(255,255,255,0.1)'
                }}>
                    {tour.durationDays} DANA / {tour.durationNights} NOĆI
                </div>

                {/* Status Badges */}
                <div style={{ position: 'absolute', bottom: '12px', left: '12px', display: 'flex', gap: '6px' }}>
                    {tour.isPrime && <span className="badge-luxury">🏆 PRIME</span>}
                    <span className="badge-luxury" style={{ background: 'var(--brand-accent)', color: '#fff' }}>
                        {tour.categoryLabel}
                    </span>
                </div>
            </div>

            {/* ── COL 2: TOUR INFO ── */}
            <div className="card-info-section" style={{ padding: '20px 24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>
                        <MapPin size={14} className="icon-luxury" />
                        {tour.destinationName}
                    </div>
                    {tour.rating && (
                         <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(245,158,11,0.1)', color: '#d97706', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 800 }}>
                            ⭐ {tour.rating} <span style={{ opacity: 0.7, fontWeight: 600 }}>({tour.reviewCount})</span>
                        </div>
                    )}
                </div>

                <h3 style={{ fontSize: '20px', fontWeight: 900, color: 'var(--text-main)', marginBottom: '8px', lineHeight: 1.2 }}>
                    {tour.name}
                </h3>

                <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '16px' }}>
                    {tour.itinerarySummary}
                </p>

                {/* Included Features */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: 'auto' }}>
                    <IncludedFeature ok={tour.included.flights}   icon={<Plane size={12} />} label="Avio" />
                    <IncludedFeature ok={tour.included.hotels}    icon={<Bed size={12} />} label="Smeštaj" />
                    <IncludedFeature ok={tour.included.meals}     icon={<Utensils size={12} />} label="Obroci" />
                    <IncludedFeature ok={tour.included.guide}     icon={<Users size={12} />} label="Vodič" />
                </div>
            </div>

            {/* ── COL 3: PRICE & ACTION ── */}
            <div className="price-section">
                <div className="price-label">Ukupno za {tour.includedPax} os.</div>
                <div className="price-amount">
                    {formatPrice(tour.totalPrice, tour.currency)}
                </div>
                <div className="badge-luxury" style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--brand-accent)' }}>
                    {formatPrice(tour.pricePerPerson, tour.currency)} po osobi
                </div>

                <div style={{ width: '100%', marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button
                        className="v6-card-cta-btn"
                        onClick={handleAdd}
                        style={{ width: '100%', padding: '12px', borderRadius: '12px' }}
                    >
                        {booked ? '✓ Odabrano' : 'Rezerviši paket'}
                    </button>
                    
                    <button 
                        className="counter-btn-luxury" 
                        onClick={() => setShowItin(!showItin)}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '12px', fontWeight: 700 }}
                    >
                        <Info size={16} />
                        {showItin ? 'Zatvori program' : 'Vidi plan puta'}
                    </button>
                </div>
            </div>

            {/* ITINERARY DROPDOWN */}
            {showItin && tour.itineraryDetails.length > 0 && (
                <div style={{ 
                    gridColumn: '1 / span 3', 
                    padding: '24px', 
                    background: 'var(--bg-app)', 
                    borderTop: '1px solid var(--border-color)',
                    animation: 'v6FadeInUp 0.3s ease'
                }}>
                    <h4 style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--brand-accent)', marginBottom: '16px', letterSpacing: '0.05em' }}>
                        PLAN PUTOVANJA PO DANIMA
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {tour.itineraryDetails.map(day => (
                            <div key={day.dayNumber} style={{ display: 'flex', gap: '16px' }}>
                                <div style={{ 
                                    width: '36px', height: '36px', flexShrink: 0, 
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontWeight: 900, fontSize: '12px', color: 'var(--brand-accent)', 
                                    background: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: '10px' 
                                }}>
                                    {day.dayNumber}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-main)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        {day.title}
                                        {day.mealsIncluded && day.mealsIncluded.length > 0 && (
                                            <span style={{ fontSize: '10px', color: 'var(--brand-accent)', background: 'rgba(26,35,78,0.05)', padding: '2px 8px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
                                                🍴 {day.mealsIncluded.join(', ')}
                                            </span>
                                        )}
                                    </div>
                                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
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
