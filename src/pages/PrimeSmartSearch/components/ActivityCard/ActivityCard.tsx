import React, { useState } from 'react';
import type { ActivityResult } from '../../types';
import { useSearchStore } from '../../stores/useSearchStore';
import { ACTIVITY_CATEGORIES } from '../../data/mockActivities';

const formatPrice = (n: number, currency = 'EUR') =>
    new Intl.NumberFormat('de-DE', { style: 'currency', currency, minimumFractionDigits: 0 }).format(n);

interface ActivityCardProps {
    activity: ActivityResult;
    pax: number;
    index?: number;
}

export const ActivityCard: React.FC<ActivityCardProps> = ({ activity, pax, index = 0 }) => {
    const { addToBasket } = useSearchStore();
    const [booked, setBooked] = useState(false);
    
    // Find emoji for category
    const cat = ACTIVITY_CATEGORIES.find(c => c.value === activity.category);
    const emoji = cat?.emoji || '🎟️';

    const handleAdd = () => {
        addToBasket({
            id: `act-${activity.id}`,
            type: 'activity',
            label: `${emoji} ${activity.title}`,
            details: `${activity.durationDescription} · ${pax} osoba`,
            pricePerUnit: activity.pricePerPerson,
            totalPrice: activity.pricePerPerson * pax,
            currency: activity.currency,
            status: activity.status,
            icon: emoji,
            isRemovable: true,
        });
        setBooked(true);
        setTimeout(() => setBooked(false), 3000);
    };

    return (
        <div style={{
            background: 'var(--v6-bg-card)',
            border: `1.5px solid ${activity.isPrime ? 'var(--v6-color-prime)' : 'var(--v6-border)'}`,
            borderRadius: 'var(--v6-radius-lg)',
            overflow: 'hidden',
            boxShadow: activity.isPrime ? '0 4px 16px rgba(180,83,9,0.1)' : 'var(--v6-shadow-sm)',
            animation: 'v6-fade-in 0.3s ease forwards',
            animationDelay: `${index * 0.05}s`, opacity: 0,
            display: 'flex', flexWrap: 'wrap'
        }}>
            
            {/* ── IMAGE ── */}
            <div style={{ width: '220px', minHeight: '180px', position: 'relative', flexShrink: 0 }}>
                <img src={activity.image} alt={activity.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                {activity.isPrime && (
                    <div style={{ position: 'absolute', top: 12, left: 12, background: 'linear-gradient(135deg, var(--v6-color-prime), #f59e0b)', color: '#fff', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 800 }}>
                        🏆 PRIME
                    </div>
                )}
            </div>

            {/* ── INFO SREDINA ── */}
            <div style={{ flex: 1, padding: '16px', minWidth: '280px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: '11px', color: 'var(--v6-text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em', marginBottom: '4px' }}>
                    {emoji} {cat?.label} · {activity.locationName}
                </div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--v6-text-primary)', marginBottom: '6px', lineHeight: 1.2 }}>
                    {activity.title}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--v6-text-muted)', marginBottom: '12px' }}>
                    <span>{activity.durationDescription}</span>
                    <span>·</span>
                    <span>{activity.supplierName}</span>
                    {activity.rating && (
                        <>
                            <span>·</span>
                            <span style={{ color: '#f59e0b' }}>★</span>
                            <span style={{ fontWeight: 700, color: 'var(--v6-text-primary)' }}>{activity.rating}</span>
                            <span>({activity.reviewCount})</span>
                        </>
                    )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {activity.included.map((inc, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--v6-text-secondary)' }}>
                            <span style={{ color: 'var(--v6-color-instant)', fontSize: '14px' }}>✓</span> {inc}
                        </div>
                    ))}
                </div>
                
                <div style={{ marginTop: 'auto', paddingTop: '12px', fontSize: '12px', color: 'var(--v6-text-muted)' }}>
                    {activity.cancellationPolicy.includes('Besplatno') ? (
                        <span style={{ color: 'var(--v6-color-instant)' }}>✓ {activity.cancellationPolicy}</span>
                    ) : (
                        <span>ℹ {activity.cancellationPolicy}</span>
                    )}
                </div>
            </div>

            {/* ── CENA I DUGME ── */}
            <div style={{ width: '200px', padding: '16px', borderLeft: '1px solid var(--v6-border)', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center', flexShrink: 0, background: 'var(--v6-bg-section)' }}>
                <div style={{ textAlign: 'right', width: '100%' }}>
                    <div style={{ fontSize: '12px', color: 'var(--v6-text-muted)' }}>
                        Ukupno za {pax} {pax === 1 ? 'osobu' : 'osobe'}
                    </div>
                    <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--v6-text-primary)', lineHeight: 1.1 }}>
                        {formatPrice(activity.pricePerPerson * pax, activity.currency)}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--v6-text-muted)', marginTop: '4px', marginBottom: '16px' }}>
                        {formatPrice(activity.pricePerPerson, activity.currency)} po osobi
                    </div>

                    <button onClick={handleAdd}
                        style={{
                            width: '100%', padding: '10px 0', borderRadius: 'var(--v6-radius-md)',
                            background: booked ? 'var(--v6-color-instant)' : 'var(--v6-accent)',
                            color: booked ? '#fff' : 'var(--v6-accent-text)', border: 'none',
                            fontSize: '13px', fontWeight: 800, cursor: 'pointer', fontFamily: 'var(--v6-font)',
                            transition: 'all 0.2s',
                        }}>
                        {booked ? '✓ Ubačeno u plan' : '+ Dodaj u plan'}
                    </button>
                    
                    {activity.status === 'on-request' && (
                        <div style={{ fontSize: '10px', color: 'var(--v6-color-on-request)', textAlign: 'center', marginTop: '8px', fontWeight: 600 }}>
                            ❓ Potvrda na upit (24h)
                        </div>
                    )}
                </div>
            </div>
            
        </div>
    );
};
