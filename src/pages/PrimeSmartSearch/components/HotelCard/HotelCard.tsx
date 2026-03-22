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
            className={`v6-hotel-card v6-fade-in-up ${delayClass}`}
            aria-label={`Hotel: ${hotel.name}`}
            data-testid={`hotel-card-${hotel.id}`}
        >
            {/* ── SLIKA ────────────────────────────────────── */}
            <div className="v6-card-image-wrap">
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
                    <span className="v6-badge-prime" aria-label="Prime ponuda">
                        🏆 PRIME
                    </span>
                )}

                {/* Status badge */}
                <StatusBadge status={hotel.status} />
            </div>

            {/* ── SADRŽAJ ──────────────────────────────────── */}
            <div className="v6-card-body">
                {/* Stars */}
                <Stars count={hotel.stars} />

                {/* Naziv */}
                <h3 className="v6-card-name">{hotel.name}</h3>

                {/* Lokacija */}
                <p className="v6-card-location">
                    <span aria-hidden="true">📍</span>
                    <span>{hotel.location.city}{hotel.location.country ? `, ${hotel.location.country}` : ''}</span>
                </p>

                {/* Ocena gostiju (ako postoji) */}
                {hotel.rating && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: 'var(--v6-fs-xs)',
                        color: 'var(--v6-text-secondary)',
                    }}>
                        <span style={{
                            background: '#059669',
                            color: 'white',
                            borderRadius: '6px',
                            padding: '2px 7px',
                            fontWeight: 700,
                            fontSize: '13px',
                        }}>
                            {hotel.rating.toFixed(1)}
                        </span>
                        <span>Ocena gostiju</span>
                        {hotel.ratingCount && (
                            <span style={{ color: 'var(--v6-text-muted)' }}>
                                ({hotel.ratingCount.toLocaleString('de-DE')} recenzija)
                            </span>
                        )}
                    </div>
                )}

                {/* ── CENA SEKCIJA ──────────────────────────── */}
                <div className="v6-card-price-section">
                    <div style={{
                        display: 'flex',
                        alignItems: 'baseline',
                        gap: '6px',
                        flexWrap: 'wrap',
                    }}>
                        <span style={{
                            fontSize: '12px',
                            color: 'var(--v6-text-muted)',
                            fontWeight: 600,
                            textTransform: 'uppercase' as const,
                            letterSpacing: '0.05em',
                        }}>
                            Ukupno
                        </span>
                        <span className="v6-card-price-total">
                            {formatPrice(hotel.lowestTotalPrice, hotel.currency)}
                        </span>
                    </div>
                    <p className="v6-card-price-breakdown">
                        {getPriceBreakdown()}
                    </p>
                </div>

                {/* ── CTA RUBLIC ─────────────────────────────── */}
                <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                    <button
                        className="v6-card-cta-btn"
                        onClick={() => onViewOptions(hotel)}
                        aria-label={`Pogledaj opcije za ${hotel.name}`}
                        id={`v6-view-options-${hotel.id}`}
                        style={{ flex: 1.5 }}
                    >
                        Pogledaj opcije →
                    </button>
                    
                    <button
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
                        style={{
                            width: '44px',
                            height: '44px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'var(--v6-bg-section)',
                            border: '1.5px solid var(--v6-border)',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            fontSize: '18px'
                        }}
                        title="Sačuvaj ponudu"
                    >
                        💾
                    </button>

                    <button
                        onClick={() => alert('Share opcije: Facebook, Instagram, Viber...')}
                        style={{
                            width: '44px',
                            height: '44px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'var(--v6-bg-section)',
                            border: '1.5px solid var(--v6-border)',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            fontSize: '18px'
                        }}
                        title="Podeli ponudu"
                    >
                        🔗
                    </button>
                </div>
            </div>
        </article>
    );
};

export default HotelCard;
