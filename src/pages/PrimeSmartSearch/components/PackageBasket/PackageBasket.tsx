import React, { useState } from 'react';
import { useSearchStore } from '../../stores/useSearchStore';

const formatPrice = (n: number, currency = 'EUR') =>
    new Intl.NumberFormat('de-DE', { style: 'currency', currency, minimumFractionDigits: 0 }).format(n);

export const PackageBasket: React.FC = () => {
    const { packageBasket, removeFromBasket, setShowPackageCheckout } = useSearchStore();
    const [isExpanded, setIsExpanded] = useState(false);

    if (packageBasket.length === 0) return null; // Ne prikazuj ako je prazno

    // Računanje totala
    const rawTotal = packageBasket.reduce((sum, item) => sum + item.totalPrice, 0);

    return (
        <div style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: isExpanded ? '380px' : 'auto',
            background: 'var(--v6-bg-main)',
            border: '1.5px solid var(--v6-border)',
            borderRadius: 'var(--v6-radius-lg)',
            boxShadow: '0 8px 32px rgba(15,23,42,0.15)',
            zIndex: 9999,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            fontFamily: 'var(--v6-font)',
            animation: 'v6-slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}>
            
            {/* ZAGLAVLJE (Uvek vidljivo kada ima nečega u korpi) */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '16px 20px', background: 'var(--v6-bg-section)', border: 'none',
                    cursor: 'pointer', textAlign: 'left', width: '100%',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ background: 'var(--v6-color-prime)', color: '#fff', width: '36px', height: '36px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '16px' }}>
                        {packageBasket.length}
                    </div>
                    <div>
                        <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--v6-text-primary)' }}>Vaš Paket</div>
                        <div style={{ fontSize: '12px', color: 'var(--v6-text-muted)' }}>{formatPrice(rawTotal, 'EUR')} ukupno</div>
                    </div>
                </div>
                
                <span style={{ fontSize: '18px', color: 'var(--v6-text-muted)', transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                    ▼
                </span>
            </button>

            {/* EXPANDED DETALJI */}
            {isExpanded && (
                <div style={{ display: 'flex', flexDirection: 'column', maxHeight: '450px', borderTop: '1px solid var(--v6-border)' }}>
                    
                    {/* Lista stavki */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {packageBasket.map(item => (
                            <div key={item.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                {/* Ikonica modula */}
                                <div style={{ fontSize: '20px', padding: '8px', background: 'var(--v6-bg-section)', borderRadius: '8px', border: '1px solid var(--v6-border)' }}>
                                    {item.icon}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--v6-text-primary)', lineHeight: 1.2, marginBottom: '2px' }}>
                                        {item.label}
                                    </div>
                                    <div style={{ fontSize: '11px', color: 'var(--v6-text-muted)' }}>
                                        {item.details}
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                                        <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--v6-text-primary)' }}>
                                            {formatPrice(item.totalPrice, item.currency)}
                                        </span>
                                        {item.isRemovable && (
                                            <button
                                                onClick={() => removeFromBasket(item.id)}
                                                style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '12px', fontWeight: 600, cursor: 'pointer', padding: 0 }}
                                            >
                                                Ukloni x
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* FUTER Baskets (Pregled / Plati) */}
                    <div style={{ padding: '20px', background: 'var(--v6-bg-section)', borderTop: '1px solid var(--v6-border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--v6-text-muted)' }}>Ukupno za plaćanje:</span>
                            <span style={{ fontSize: '18px', fontWeight: 900, color: 'var(--v6-text-primary)' }}>{formatPrice(rawTotal, 'EUR')}</span>
                        </div>
                        <button 
                            onClick={() => {
                                setIsExpanded(false);
                                setShowPackageCheckout(true);
                            }}
                            style={{
                            width: '100%', padding: '14px', background: 'var(--v6-accent)', color: 'var(--v6-accent-text)',
                            border: 'none', borderRadius: 'var(--v6-radius-md)', fontSize: '14px', fontWeight: 800, cursor: 'pointer'
                        }}>
                            ZAVRŠI I REZERVIŠI →
                        </button>
                    </div>

                </div>
            )}
        </div>
    );
};
