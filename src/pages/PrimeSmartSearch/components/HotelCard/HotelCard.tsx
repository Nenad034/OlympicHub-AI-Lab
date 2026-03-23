import React from 'react';
import type { HotelSearchResult } from '../../types';
import { useSearchStore, calcPaxSummary } from '../../stores/useSearchStore';

export type ViewMode = 'list' | 'grid' | 'notepad';

interface HotelCardProps {
    hotel: HotelSearchResult;
    index: number;
    onViewOptions: (hotel: HotelSearchResult) => void;
    viewMode?: ViewMode;
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
// PLACEHOLDER IMAGE
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
// HOTEL CARD — 3 view modes
// ─────────────────────────────────────────────────────────────
export const HotelCard: React.FC<HotelCardProps> = ({ hotel, index, onViewOptions, viewMode = 'list' }) => {
    const { roomAllocations, checkIn, checkOut } = useSearchStore();
    const pax = calcPaxSummary(roomAllocations, checkIn, checkOut);
    const [imgError, setImgError] = React.useState(false);

    const formatPrice = (price: number, currency: string = 'EUR') =>
        new Intl.NumberFormat('de-DE', { style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(price);

    const getPriceBreakdown = () => {
        const parts: string[] = [];
        if (pax.totalRooms > 1) parts.push(`${pax.totalRooms} sobe`);
        parts.push(`${pax.totalAdults} odr.`);
        if (pax.totalChildren > 0) parts.push(`${pax.totalChildren} dece (${pax.childrenAges.join(', ')} god)`);
        if (pax.nights > 0) parts.push(`${pax.nights} noćenja`);
        if (hotel.lowestMealPlanLabel) parts.push(hotel.lowestMealPlanLabel);
        return parts.join(' · ');
    };

    const delayClass = index < 6 ? `v6-delay-${index + 1}` : '';

    // ══════════════════════════════════════════════════════════
    // NOTEPAD VIEW — kompaktan tabelarni red
    // ══════════════════════════════════════════════════════════
    if (viewMode === 'notepad') {
        return (
            <article
                className={`v6-hotel-notepad-row v6-fade-in-up ${delayClass}`}
                aria-label={`Hotel: ${hotel.name}`}
                data-testid={`hotel-card-${hotel.id}`}
            >
                <span className="v6-notepad-idx">{String(index + 1).padStart(2, '0')}</span>

                <div className="v6-notepad-name-col">
                    {hotel.isPrime && <span className="v6-notepad-prime">PRIME</span>}
                    <span className="v6-notepad-stars">{'★'.repeat(hotel.stars)}</span>
                    <span className="v6-notepad-name">{hotel.name}</span>
                </div>

                <span className="v6-notepad-location">
                    📍 {hotel.location.city}{hotel.location.country ? `, ${hotel.location.country}` : ''}
                </span>

                <span className="v6-notepad-meal">{hotel.lowestMealPlanLabel ?? '—'}</span>

                {hotel.rating
                    ? <span className="v6-notepad-rating">⭐ {hotel.rating.toFixed(1)}</span>
                    : <span className="v6-notepad-rating">—</span>
                }

                <span className={`v6-notepad-status ${hotel.status === 'instant' ? 'v6-np-instant' : 'v6-np-request'}`}>
                    {hotel.status === 'instant' ? '⚡ Odmah' : '❓ Upit'}
                </span>

                <span className="v6-notepad-price">
                    {formatPrice(hotel.lowestTotalPrice, hotel.currency)}
                </span>

                <button
                    className="v6-notepad-cta"
                    onClick={() => onViewOptions(hotel)}
                    aria-label={`Rezerviši ${hotel.name}`}
                >
                    Rezerviši →
                </button>
            </article>
        );
    }

    // ══════════════════════════════════════════════════════════
    // GRID VIEW — vertikalna kartica
    // ══════════════════════════════════════════════════════════
    if (viewMode === 'grid') {
        return (
            <article
                className={`v6-hotel-grid-card v6-fade-in-up ${delayClass}`}
                aria-label={`Hotel: ${hotel.name}`}
                data-testid={`hotel-card-${hotel.id}`}
            >
                <div className="v6-grid-card-image">
                    {hotel.images.length > 0 && !imgError ? (
                        <img
                            src={hotel.images[0]}
                            alt={hotel.name}
                            loading="lazy"
                            onError={() => setImgError(true)}
                        />
                    ) : (
                        <div className="v6-grid-img-placeholder">
                            <span>🏨</span>
                            <span>{hotel.name}</span>
                        </div>
                    )}
                    {hotel.isPrime && <span className="v6-grid-prime-badge">🏆 PRIME</span>}
                    <span className={`v6-grid-status-badge ${hotel.status === 'instant' ? 'v6-gs-instant' : 'v6-gs-request'}`}>
                        {hotel.status === 'instant' ? '⚡ Odmah' : '❓ Upit'}
                    </span>
                </div>

                <div className="v6-grid-card-body">
                    <div className="v6-card-stars" aria-label={`${hotel.stars} zvezdice`}>
                        {'★'.repeat(hotel.stars)}{'☆'.repeat(5 - hotel.stars)}
                    </div>
                    <h3 className="v6-grid-card-name">{hotel.name}</h3>
                    <p className="v6-grid-card-location">
                        📍 {hotel.location.city}{hotel.location.country ? `, ${hotel.location.country}` : ''}
                    </p>
                    {hotel.rating && (
                        <div className="v6-grid-card-rating">
                            <span className="v6-grid-rating-score">{hotel.rating.toFixed(1)}</span>
                            <span className="v6-grid-rating-count">{hotel.ratingCount?.toLocaleString('de-DE')} recenzija</span>
                        </div>
                    )}
                    {hotel.lowestMealPlanLabel && (
                        <span className="v6-grid-meal-badge">{hotel.lowestMealPlanLabel}</span>
                    )}
                    {hotel.description && (
                        <p className="v6-grid-description" style={{ 
                            fontSize: '11px', 
                            color: 'var(--v6-text-muted)', 
                            marginTop: '8px',
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            lineHeight: '1.4'
                        }}>
                            {hotel.description.replace(/<[^>]*>/g, '').substring(0, 150)}...
                        </p>
                    )}
                </div>

                <div className="v6-grid-card-footer">
                    <div>
                        <div className="price-label">Ukupna cena</div>
                        <div className="v6-grid-price">{formatPrice(hotel.lowestTotalPrice, hotel.currency)}</div>
                        <div className="v6-grid-breakdown">{getPriceBreakdown()}</div>
                    </div>
                    <button
                        className="v6-card-cta-btn v6-grid-cta"
                        onClick={() => onViewOptions(hotel)}
                    >
                        Rezerviši odmah
                    </button>
                </div>
            </article>
        );
    }

    // ══════════════════════════════════════════════════════════
    // LIST VIEW (default) — horizontalna kartica, šira i kraća (-30% visina, +30% širina)
    // ══════════════════════════════════════════════════════════
    return (
        <article
            className={`search-result-card v6-list-card v6-fade-in-up ${delayClass}`}
            aria-label={`Hotel: ${hotel.name}`}
            data-testid={`hotel-card-${hotel.id}`}
        >
            {/* COL 1: IMAGE */}
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
                {hotel.isPrime && (
                    <div style={{ position: 'absolute', top: '10px', left: '10px' }}>
                        <span className="badge-luxury">🏆 PRIME</span>
                    </div>
                )}
                <div style={{ position: 'absolute', bottom: '10px', left: '10px' }}>
                    <StatusBadge status={hotel.status} />
                </div>
            </div>

            {/* COL 2: INFO */}
            <div className="card-info-section">
                <Stars count={hotel.stars} />
                <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-main)', margin: '3px 0 5px 0' }}>{hotel.name}</h3>
                <p style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>
                    <span style={{ color: 'var(--brand-accent)' }}>📍</span>
                    <span>{hotel.location.city}{hotel.location.country ? `, ${hotel.location.country}` : ''}</span>
                </p>

                {hotel.rating && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                        <div style={{ background: 'var(--brand-accent)', color: 'white', borderRadius: '8px', padding: '2px 8px', fontWeight: 800, fontSize: '13px' }}>
                            {hotel.rating.toFixed(1)}
                        </div>
                        <div>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-main)' }}>Odlična ocena</div>
                            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{hotel.ratingCount?.toLocaleString('de-DE')} recenzija</div>
                        </div>
                    </div>
                )}

                {hotel.description && (
                    <p style={{ 
                        fontSize: '12px', 
                        color: 'var(--text-muted)', 
                        marginTop: '8px', 
                        marginBottom: '8px',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        lineHeight: '1.4'
                    }}>
                        {hotel.description.replace(/<[^>]*>/g, '')}
                    </p>
                )}

                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                    <div className="badge-luxury" style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '10px', padding: '2px 8px' }}>
                        Besplatan WiFi
                    </div>
                    {hotel.lowestMealPlanLabel && (
                        <div className="badge-luxury" style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-muted)', fontSize: '10px', padding: '2px 8px' }}>
                            {hotel.lowestMealPlanLabel}
                        </div>
                    )}
                </div>
            </div>

            {/* COL 3: PRICE */}
            <div className="price-section">
                <div className="price-label">Ukupna cena</div>
                <div className="price-amount" style={{ fontSize: '22px' }}>
                    {formatPrice(hotel.lowestTotalPrice, hotel.currency)}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>
                    {getPriceBreakdown()}
                </div>
                <div style={{ width: '100%', marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <button
                        className="v6-card-cta-btn"
                        onClick={() => onViewOptions(hotel)}
                        style={{ width: '100%', padding: '9px', borderRadius: '10px' }}
                    >
                        Rezerviši odmah
                    </button>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
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
                        <button className="counter-btn-luxury" onClick={() => alert('Link kopiran!')} title="Podeli">
                            🔗
                        </button>
                    </div>
                </div>
            </div>
        </article>
    );
};

export default HotelCard;
