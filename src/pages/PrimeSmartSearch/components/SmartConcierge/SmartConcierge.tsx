import React, { useState, useEffect } from 'react';
import { useSearchStore } from '../../stores/useSearchStore';
import type { ConciergeOffer } from '../../types';

// ─────────────────────────────────────────────────────────────
// MOCK Concierge ponude (po hotelu / destinaciji)
// Faza 5: Pricing Intelligence DB će ovo servirati
// ─────────────────────────────────────────────────────────────
const CONCIERGE_OFFERS_BY_TAG: Record<string, ConciergeOffer[]> = {
    'budva': [
        {
            id: 'transfer-tivat-budva',
            type: 'transfer',
            title: '🚐 Privatni transfer do hotela',
            description: 'Tivat aerodrom → Hotel · Privatni kombi · Maksimalna udobnost',
            price: 35,
            currency: 'EUR',
            hotelTag: 'budva',
        },
        {
            id: 'boat-tour-budva',
            type: 'activity',
            title: '⛵ Sunset Boat Tour Budva',
            description: '3h krstarenje duž rivijere sa zalazom sunca i pićem na brodu',
            price: 45,
            currency: 'EUR',
            hotelTag: 'budva',
        },
        {
            id: 'insurance-budva',
            type: 'insurance',
            title: '🛡️ Putno osiguranje',
            description: 'Kompletno putno osiguranje (medicinska pomoć, odgođen let, prtljag)',
            price: 18,
            currency: 'EUR',
            hotelTag: 'budva',
        },
    ],
    'tivat': [
        {
            id: 'porto-tour',
            type: 'activity',
            title: '⚓ Porto Montenegro Tour',
            description: 'Privatna tura marino-luksuznog naselja sa vodičem · 2 sata',
            price: 30,
            currency: 'EUR',
            hotelTag: 'tivat',
        },
    ],
    'herceg-novi': [
        {
            id: 'transfer-dubrovnik',
            type: 'transfer',
            title: '🚗 Transfer Herceg Novi → Dubrovnik',
            description: 'Privatni transfer do Dubrovnika (80km) · A/C vozilo',
            price: 55,
            currency: 'EUR',
            hotelTag: 'herceg-novi',
        },
    ],
};

// ─────────────────────────────────────────────────────────────
// POJEDINAČNA PONUDA (Bubble)
// ─────────────────────────────────────────────────────────────
interface ConciergeCardProps {
    offer: ConciergeOffer;
    onDismiss: (id: string) => void;
    onAccept: (offer: ConciergeOffer) => void;
    delay: number;
}

const ConciergeCard: React.FC<ConciergeCardProps> = ({ offer, onDismiss, onAccept, delay }) => {
    const [visible, setVisible] = useState(false);
    const [leaving, setLeaving] = useState(false);

    useEffect(() => {
        const t = setTimeout(() => setVisible(true), delay);
        return () => clearTimeout(t);
    }, [delay]);

    const handleDismiss = () => {
        setLeaving(true);
        setTimeout(() => onDismiss(offer.id), 350);
    };

    const handleAccept = () => {
        onAccept(offer);
        setLeaving(true);
        setTimeout(() => onDismiss(offer.id), 350);
    };

    return (
        <div
            role="complementary"
            aria-label={`Preporuka: ${offer.title}`}
            style={{
                background: 'var(--v6-bg-card)',
                border: '1px solid var(--v6-border)',
                borderRadius: 'var(--v6-radius-lg)',
                boxShadow: 'var(--v6-shadow-lg)',
                padding: '14px 16px',
                width: '300px',
                maxWidth: '90vw',
                transition: 'opacity 0.35s ease, transform 0.35s ease',
                opacity: visible && !leaving ? 1 : 0,
                transform: visible && !leaving ? 'translateX(0)' : 'translateX(24px)',
                pointerEvents: visible ? 'all' : 'none',
            }}
        >
            {/* Header */}
            <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '8px',
                marginBottom: '8px',
            }}>
                <span style={{
                    fontSize: 'var(--v6-fs-sm)',
                    fontWeight: 700,
                    color: 'var(--v6-text-primary)',
                    lineHeight: 1.3,
                }}>
                    {offer.title}
                </span>
                <button
                    onClick={handleDismiss}
                    aria-label="Zatvori preporuku"
                    style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--v6-text-muted)',
                        fontSize: '14px',
                        lineHeight: 1,
                        padding: '0 2px',
                        flexShrink: 0,
                    }}
                >✕</button>
            </div>

            {/* Opis */}
            <p style={{
                margin: '0 0 12px',
                fontSize: '13px',
                color: 'var(--v6-text-secondary)',
                lineHeight: 1.5,
            }}>
                {offer.description}
            </p>

            {/* Cena + CTA */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '10px',
            }}>
                <span style={{
                    fontSize: 'var(--v6-fs-lg)',
                    fontWeight: 800,
                    color: 'var(--v6-text-primary)',
                }}>
                    {offer.price} {offer.currency}
                    <span style={{
                        fontSize: '11px',
                        fontWeight: 500,
                        color: 'var(--v6-text-muted)',
                        marginLeft: '4px',
                    }}>/os</span>
                </span>
                <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                        onClick={handleDismiss}
                        style={{
                            padding: '7px 12px',
                            border: '1.5px solid var(--v6-border)',
                            borderRadius: 'var(--v6-radius-sm)',
                            background: 'transparent',
                            color: 'var(--v6-text-muted)',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontFamily: 'var(--v6-font)',
                        }}
                    >
                        Ne hvala
                    </button>
                    <button
                        onClick={handleAccept}
                        style={{
                            padding: '7px 14px',
                            border: 'none',
                            borderRadius: 'var(--v6-radius-sm)',
                            background: 'var(--v6-accent)',
                            color: 'var(--v6-accent-text)',
                            fontSize: '12px',
                            fontWeight: 700,
                            cursor: 'pointer',
                            fontFamily: 'var(--v6-font)',
                        }}
                    >
                        Dodaj +
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────
// MAIN: Smart Concierge Manager
// ─────────────────────────────────────────────────────────────
interface SmartConciergeProps {
    activeHotelCity?: string; // Grad izabranog hotela (trigger)
}

export const SmartConcierge: React.FC<SmartConciergeProps> = ({ activeHotelCity }) => {
    const { conciergeOffers, setConciergeOffers, dismissConciergeOffer, packageBasket, addToBasket } = useSearchStore();
    const [initialized, setInitialized] = useState(false);

    // Aktiviraj ponude kada korisnik izabere hotel
    useEffect(() => {
        if (!activeHotelCity || initialized) return;

        const cityKey = activeHotelCity.toLowerCase()
            .replace(/\s+/g, '-')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');

        const offers = CONCIERGE_OFFERS_BY_TAG[cityKey] || CONCIERGE_OFFERS_BY_TAG['budva'];
        if (offers.length > 0) {
            setConciergeOffers(offers);
            setInitialized(true);
        }
    }, [activeHotelCity, initialized, setConciergeOffers]);

    const handleAccept = (offer: ConciergeOffer) => {
        // Dodaj u Package Basket
        addToBasket({
            id: `basket-${offer.id}`,
            type: offer.type,
            label: offer.title,
            details: offer.description,
            pricePerUnit: offer.price,
            totalPrice: offer.price,
            currency: offer.currency,
            status: 'instant',
            icon: offer.title.slice(0, 2), // Emoji iz naslova
            isRemovable: true,
        });
    };

    if (conciergeOffers.length === 0) return null;

    return (
        <div
            style={{
                position: 'fixed',
                bottom: '24px',
                right: '24px',
                zIndex: 1500,
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
                alignItems: 'flex-end',
                pointerEvents: 'none',
            }}
            aria-live="polite"
            aria-label="Personalizovane preporuke"
        >
            {/* Label */}
            {conciergeOffers.length > 0 && (
                <div style={{
                    padding: '5px 12px',
                    background: 'var(--v6-accent)',
                    color: 'var(--v6-accent-text)',
                    borderRadius: '999px',
                    fontSize: '11px',
                    fontWeight: 700,
                    pointerEvents: 'all',
                    letterSpacing: '0.06em',
                }}>
                    🎩 PRIME PREPORUKE
                </div>
            )}

            {/* Kartice (max 3 odjednom) */}
            {conciergeOffers.slice(0, 3).map((offer, idx) => (
                <div key={offer.id} style={{ pointerEvents: 'all' }}>
                    <ConciergeCard
                        offer={offer}
                        onDismiss={dismissConciergeOffer}
                        onAccept={handleAccept}
                        delay={idx * 400}
                    />
                </div>
            ))}
        </div>
    );
};

export default SmartConcierge;
