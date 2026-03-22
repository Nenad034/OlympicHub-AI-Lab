import React from 'react';
import { useSearchStore, calcPaxSummary } from '../../stores/useSearchStore';

/**
 * PaxSummaryBanner — Sticky traka koja uvek pokazuje ko putuje i kada.
 * Prikazuje se UVEK čim korisnik unese neke podatke u pretragu.
 * Sekcija 4 iz V6_TECHNICAL_DOCUMENTATION.md
 */
export const PaxSummaryBanner: React.FC = () => {
    const { roomAllocations, checkIn, checkOut, destinations } = useSearchStore();
    const pax = calcPaxSummary(roomAllocations, checkIn, checkOut);

    // Ne prikazuj ako nema ni destinacije ni putnika podešenih
    if (!checkIn && !checkOut && destinations.length === 0) return null;

    const formatDate = (d: string) => {
        if (!d) return '—';
        return new Date(d).toLocaleDateString('sr-Latn-RS', { day: 'numeric', month: 'short' });
    };

    const childrenLabel = pax.totalChildren > 0
        ? `+ ${pax.totalChildren} dece (${pax.childrenAges.join(', ')} god)`
        : '';

    return (
        <div className="v6-pax-banner">
            {(checkIn || checkOut) && (
                <div className="v6-pax-chip">
                    <span>📅</span>
                    <strong>{formatDate(checkIn)} — {formatDate(checkOut)}</strong>
                    {pax.nights > 0 && <span>· {pax.nights} noćenja</span>}
                </div>
            )}

            <div className="v6-pax-chip">
                <span>👥</span>
                <strong>{pax.totalAdults} odr.</strong>
                {childrenLabel && <span>{childrenLabel}</span>}
            </div>

            <div className="v6-pax-chip">
                <span>🏨</span>
                <strong>{pax.totalRooms} {pax.totalRooms === 1 ? 'soba' : pax.totalRooms < 5 ? 'sobe' : 'soba'}</strong>
            </div>

            {destinations.length > 0 && (
                <div className="v6-pax-chip">
                    <span>📍</span>
                    <strong>{destinations.map(d => d.name).join(' · ')}</strong>
                </div>
            )}
        </div>
    );
};
