import React from 'react';
import { useSearchStore } from '../stores/useSearchStore';

const formatPrice = (n: number, currency = 'EUR') =>
    new Intl.NumberFormat('de-DE', { style: 'currency', currency, minimumFractionDigits: 0 }).format(n);

export const SavedOffersPanel: React.FC = () => {
    const { 
        savedOffers, 
        removeSavedOffer, 
        togglePriceDropAlert, 
        checkPriceChange,
        lastPriceChangeNotification,
        dismissPriceNotification
    } = useSearchStore();

    const [isOpen, setIsOpen] = React.useState(false);

    if (savedOffers.length === 0) return null;

    return (
        <>
            {/* Floating Toggle Button */}
            <button 
                onClick={() => setIsOpen(!isOpen)}
                style={{
                    position: 'fixed',
                    right: '24px',
                    bottom: '100px',
                    width: '64px',
                    height: '64px',
                    borderRadius: '20px',
                    background: 'var(--v6-color-prime)',
                    color: '#fff',
                    border: 'none',
                    boxShadow: '0 8px 32px rgba(180,83,9,0.3)',
                    cursor: 'pointer',
                    zIndex: 1000,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '4px',
                    transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                }}
                onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.1) rotate(5deg)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1) rotate(0deg)'}
            >
                <span style={{ fontSize: '24px' }}>📁</span>
                <span style={{ fontSize: '10px', fontWeight: 900 }}>{savedOffers.length}</span>
            </button>

            {/* Price Change Notification Toast */}
            {lastPriceChangeNotification && (
                <div style={{
                    position: 'fixed',
                    bottom: '180px',
                    right: '24px',
                    width: '320px',
                    background: 'var(--v6-bg-card)',
                    border: `2px solid ${lastPriceChangeNotification.isHigher ? 'var(--v6-color-error)' : 'var(--v6-color-instant)'}`,
                    borderRadius: 'var(--v6-radius-lg)',
                    padding: '16px',
                    boxShadow: 'var(--v6-shadow-lg)',
                    zIndex: 1100,
                    animation: 'v6-slide-up 0.4s ease-out'
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '18px' }}>{lastPriceChangeNotification.isHigher ? '📈' : '📉'}</span>
                        <button onClick={dismissPriceNotification} style={{ background: 'none', border: 'none', color: 'var(--v6-text-muted)', cursor: 'pointer' }}>✕</button>
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--v6-text-primary)' }}>
                        Promena cene za Vašu ponudu!
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--v6-text-muted)', marginTop: '4px' }}>
                        Cena je sada {lastPriceChangeNotification.isHigher ? 'viša' : 'niža'}.
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '10px' }}>
                        <span style={{ textDecoration: 'line-through', color: 'var(--v6-text-muted)', fontSize: '12px' }}>
                            {formatPrice(lastPriceChangeNotification.oldPrice)}
                        </span>
                        <span style={{ fontSize: '18px', fontWeight: 900, color: lastPriceChangeNotification.isHigher ? 'var(--v6-color-error)' : 'var(--v6-color-instant-text)' }}>
                            {formatPrice(lastPriceChangeNotification.newPrice)}
                        </span>
                    </div>
                </div>
            )}

            {/* Panel Content */}
            {isOpen && (
                <div style={{
                    position: 'fixed',
                    right: '24px',
                    bottom: '180px',
                    width: '380px',
                    maxHeight: '60vh',
                    background: 'var(--v6-bg-card)',
                    border: '1.5px solid var(--v6-border)',
                    borderRadius: 'var(--v6-radius-xl)',
                    boxShadow: 'var(--v6-shadow-2xl)',
                    zIndex: 1000,
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    animation: 'v6-slide-up 0.3s ease-out'
                }}>
                    <div style={{
                        padding: '16px 20px',
                        background: 'var(--v6-bg-section)',
                        borderBottom: '1px solid var(--v6-border)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <h3 style={{ fontSize: '14px', fontWeight: 800, color: 'var(--v6-text-primary)', margin: 0 }}>
                            📂 Vaše Sačuvane Ponude
                        </h3>
                        <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--v6-text-muted)', cursor: 'pointer', padding: '4px' }}>✕</button>
                    </div>

                    <div style={{ padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {savedOffers.map((offer) => (
                            <div key={offer.id} style={{
                                padding: '12px',
                                background: 'var(--v6-bg-section)',
                                borderRadius: 'var(--v6-radius-lg)',
                                border: '1px solid var(--v6-border)',
                                position: 'relative'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--v6-color-prime)', textTransform: 'uppercase' }}>{offer.type}</div>
                                        <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--v6-text-primary)' }}>{offer.label}</div>
                                        <div style={{ fontSize: '11px', color: 'var(--v6-text-muted)', marginTop: '2px' }}>{offer.description}</div>
                                    </div>
                                    <button 
                                        onClick={() => removeSavedOffer(offer.id)}
                                        style={{ background: 'none', border: 'none', color: 'var(--v6-color-error)', cursor: 'pointer', fontSize: '10px', fontWeight: 700 }}
                                    >
                                        UKLONI
                                    </button>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', paddingTop: '10px', borderTop: '1px dashed var(--v6-border)' }}>
                                    <div style={{ fontSize: '16px', fontWeight: 900, color: 'var(--v6-text-primary)' }}>{formatPrice(offer.totalPrice)}</div>
                                    <div style={{ display: 'flex', gap: '6px' }}>
                                        <button 
                                            onClick={() => checkPriceChange(offer.id)}
                                            style={{
                                                padding: '6px 10px',
                                                background: 'var(--v6-bg-card)',
                                                border: '1.5px solid var(--v6-border)',
                                                borderRadius: '8px',
                                                fontSize: '10px',
                                                fontWeight: 800,
                                                cursor: 'pointer'
                                            }}
                                        >
                                            🔄 Osveži cenu
                                        </button>
                                        <button 
                                            onClick={() => togglePriceDropAlert(offer.id)}
                                            style={{
                                                padding: '6px 10px',
                                                background: offer.hasPriceDropAlert ? 'var(--v6-color-instant-bg)' : 'var(--v6-bg-card)',
                                                border: '1.5px solid var(--v6-border)',
                                                borderRadius: '8px',
                                                fontSize: '10px',
                                                fontWeight: 800,
                                                cursor: 'pointer',
                                                color: offer.hasPriceDropAlert ? 'var(--v6-color-instant-text)' : 'var(--v6-text-secondary)'
                                            }}
                                        >
                                            {offer.hasPriceDropAlert ? '🔔 Alert Aktivan' : '🔕 Prati pad cene'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    <div style={{ padding: '12px 20px', background: 'var(--v6-bg-section)', borderTop: '1px solid var(--v6-border)', fontSize: '11px', color: 'var(--v6-text-muted)', textAlign: 'center' }}>
                        Sve ponude se čuvaju 30 dana u Vašem pretraživaču.
                    </div>
                </div>
            )}
        </>
    );
};
