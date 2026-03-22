import React from 'react';
import type { HotelSearchResult } from '../../types';
import { useSearchStore, calcPaxSummary } from '../../stores/useSearchStore';

interface HotelCardProps {
    hotel: HotelSearchResult;
    index: number;  // Za stagger animaciju
    onViewOptions: (hotel: HotelSearchResult) => void;
}

// ─────────────────────────────────────────────────────────────
// STARS RENDERER
// ─────────────────────────────────────────────────────────────
const Stars: React.FC<{ count: number }> = ({ count }) => (
    <div className="v6-card-stars" aria-label={`${count} zvezdice`}>
        {'★'.repeat(count)}{'☆'.repeat(5 - count)}
    </div>
);

// ─────────────────────────────────────────────────────────────
// STATUS BADGE
// ─────────────────────────────────────────────────────────────
const StatusBadge: React.FC<{ status: HotelSearchResult['status'] }> = ({ status }) => {
    if (status === 'instant') {
        return (
            <span className="v6-badge-status v6-instant" aria-label="Odmah potvrđeno">
                ⚡ Odmah
            </span>
        );
    }
    if (status === 'on-request') {
        return (
            <span className="v6-badge-status v6-on-request" aria-label="Na upit">
                ❓ Na upit
            </span>
        );
    }
    return null;
};

// ─────────────────────────────────────────────────────────────
// PLACEHOLEDER IMAGE (ako slika ne postoji)
// ─────────────────────────────────────────────────────────────
const ImagePlaceholder: React.FC<{ name: string }> = ({ name }) => (
    <div style={{
        width: '100%',
        height: '100%',
        background: 'linear-gradient(135deg, var(--v6-bg-section) 0%, var(--v6-border) 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        color: 'var(--v6-text-muted)',
    }}>
        <span style={{ fontSize: '36px' }}>🏨</span>
        <span style={{ fontSize: '12px', fontWeight: 600, textAlign: 'center', padding: '0 16px' }}>
            {name}
        </span>
    </div>
);

// ─────────────────────────────────────────────────────────────
// HOTEL CARD
// ─────────────────────────────────────────────────────────────
export const HotelCard: React.FC<HotelCardProps> = ({ hotel, index, onViewOptions }) => {
    const { roomAllocations, checkIn, checkOut } = useSearchStore();
    const pax = calcPaxSummary(roomAllocations, checkIn, checkOut);

    const [imgError, setImgError] = React.useState(false);

    // ── Formatiranje cene ────────────────────────────────────
    const formatPrice = (price: number, currency: string = 'EUR') => {
        return new Intl.NumberFormat('de-DE', {
            style: 'currency',
            currency,
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(price);
    };

    // ── Breakdown tekst (za šta je cena) ────────────────────
    const getPriceBreakdown = () => {
        const roomCount = pax.totalRooms;
        const adults = pax.totalAdults;
        const children = pax.totalChildren;
        const nights = pax.nights;

        const parts: string[] = [];
        if (roomCount > 1) parts.push(`${roomCount} sobe`);
        parts.push(`${adults} odr.`);
        if (children > 0) {
            const agesStr = pax.childrenAges.join(', ');
            parts.push(`${children} dece (${agesStr} god)`);
        }
        if (nights > 0) parts.push(`${nights} noćenja`);
        if (hotel.lowestMealPlanLabel) parts.push(hotel.lowestMealPlanLabel);

        return parts.join(' · ');
    };

    // ── Stagger animacija delay ──────────────────────────────
    const delayClass = index < 6 ? `v6-delay-${index + 1}` : '';

    return (
        <article
            className={`search-result-card v6-fade-in-up ${delayClass}`}
            aria-label={`Hotel: ${hotel.name}`}
            data-testid={`hotel-card-${hotel.id}`}
        >
            {/* ── COL 1: IMAGE ────────────────────────────────────── */}
            <div className="card-image-section">
                {hotel.images.length > 0 && !imgError ? (
                    <img
                        src={hotel.images[0]}
                        alt={`${hotel.name} – fotografija hotela`}
                        loading="lazy"
                        onError={() => setImgError(true)}
                    />
                ) : (
                    <ImagePlaceholder name={hotel.name} />
                )}

                {/* PRIME badge */}
                {hotel.isPrime && (
                    <div style={{ position: 'absolute', top: '12px', left: '12px' }}>
                        <span className="badge-luxury">🏆 PRIME</span>
                    </div>
                )}

                {/* Status badge */}
                <div style={{ position: 'absolute', bottom: '12px', left: '12px' }}>
                     <StatusBadge status={hotel.status} />
                </div>
            </div>

            {/* ── COL 2: INFO ──────────────────────────────────── */}
            <div className="card-info-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <Stars count={hotel.stars} />
                        <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-main)', margin: '4px 0 8px 0' }}>{hotel.name}</h3>
                        
                        <p style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
                            <span style={{ color: 'var(--brand-accent)' }}>📍</span>
                            <span>{hotel.location.city}{hotel.location.country ? `, ${hotel.location.country}` : ''}</span>
                        </p>
                    </div>
                </div>

                {/* Ocena gostiju */}
                {hotel.rating && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: 'auto' }}>
                        <div style={{ 
                            background: 'var(--brand-accent)', 
                            color: 'white', 
                            borderRadius: '8px', 
                            padding: '4px 10px', 
                            fontWeight: 800, 
                            fontSize: '15px' 
                        }}>
                            {hotel.rating.toFixed(1)}
                        </div>
                        <div>
                            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-main)' }}>Odlična ocena</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                                {hotel.ratingCount?.toLocaleString('de-DE')} recenzija gostiju
                            </div>
                        </div>
                    </div>
                )}

                {/* Sadržaj / Features */}
                <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                    <div className="badge-luxury" style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '10px', padding: '4px 8px' }}>
                         Besplatan WiFi
                    </div>
                    {hotel.lowestMealPlanLabel && (
                        <div className="badge-luxury" style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '10px', padding: '4px 8px' }}>
                            {hotel.lowestMealPlanLabel}
                        </div>
                    )}
                </div>
            </div>

            {/* ── COL 3: PRICE ─────────────────────────────── */}
            <div className="price-section">
                <div className="price-label">Ukupna cena</div>
                <div className="price-amount">
                    {formatPrice(hotel.lowestTotalPrice, hotel.currency)}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
                    {getPriceBreakdown()}
                </div>

                <div style={{ width: '100%', marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button
                        className="v6-card-cta-btn"
                        onClick={() => onViewOptions(hotel)}
                        style={{ width: '100%', padding: '12px', borderRadius: '12px' }}
                    >
                        Rezerviši odmah
                    </button>
                    
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button
                            className="counter-btn-luxury"
                            onClick={() => {
                                useSearchStore.getState().saveOffer({
                                    id: `htl-${hotel.id}-${Date.now()}`,
                                    type: 'hotel',
                                    label: hotel.name,
                                    description: getPriceBreakdown(),
                                    totalPrice: hotel.lowestTotalPrice,
                                    currency: hotel.currency,
                                    timestamp: Date.now(),
                                    data: { hotelId: hotel.id, checkIn, checkOut, roomAllocations },
                                    hasPriceDropAlert: false
                                });
                                alert('Hotel sačuvan u ponude!');
                            }}
                            title="Sačuvaj"
                        >
                            💾
                        </button>

                        <button
                            className="counter-btn-luxury"
                            onClick={() => alert('Link kopiran!')}
                            title="Podeli"
                        >
                            🔗
                        </button>
                    </div>
                </div>
            </div>
        </article>
    );
};

export default HotelCard;
