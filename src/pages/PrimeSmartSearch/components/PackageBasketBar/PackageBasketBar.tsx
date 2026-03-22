import React from 'react';
import { useSearchStore, calcBasketTotal } from '../../stores/useSearchStore';

interface PackageBasketBarProps {
    onExport: () => void;
}

/**
 * Sticky bar na dnu stranice koji se pojavljuje čim ima stavki u korpi.
 * Prikazuje stavke, ukupnu cenu i dugme za Export/Share.
 */
export const PackageBasketBar: React.FC<PackageBasketBarProps> = ({ onExport }) => {
    const { packageBasket, removeFromBasket } = useSearchStore();
    const total = calcBasketTotal(packageBasket);

    if (packageBasket.length === 0) return null;

    const formatPrice = (n: number) =>
        new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0 }).format(n);

    return (
        <div
            role="region"
            aria-label="Vaša korpa"
            style={{
                position: 'sticky',
                bottom: 0,
                zIndex: 500,
                background: 'var(--v6-bg-card)',
                borderTop: '2px solid var(--v6-border)',
                padding: '12px 24px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                flexWrap: 'wrap',
                boxShadow: '0 -4px 20px rgba(0,0,0,0.08)',
            }}
        >
            {/* Label */}
            <div style={{
                fontSize: '12px',
                fontWeight: 800,
                textTransform: 'uppercase' as const,
                letterSpacing: '0.08em',
                color: 'var(--v6-text-muted)',
                flexShrink: 0,
            }}>
                📋 Vaš paket:
            </div>

            {/* Stavke korpe */}
            <div style={{
                display: 'flex',
                gap: '8px',
                flex: 1,
                flexWrap: 'wrap',
                alignItems: 'center',
                overflow: 'hidden',
            }}>
                {packageBasket.map(item => (
                    <div
                        key={item.id}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '5px 10px',
                            background: 'var(--v6-bg-section)',
                            border: '1px solid var(--v6-border)',
                            borderRadius: '999px',
                            fontSize: '13px',
                            fontWeight: 600,
                            color: 'var(--v6-text-primary)',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        <span>{item.icon}</span>
                        <span>{item.label}</span>
                        <span style={{ color: 'var(--v6-text-muted)', fontWeight: 500 }}>
                            {formatPrice(item.totalPrice)}
                        </span>
                        {item.isRemovable && (
                            <button
                                onClick={() => removeFromBasket(item.id)}
                                aria-label={`Ukloni ${item.label} iz korpe`}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    color: 'var(--v6-text-muted)',
                                    padding: 0,
                                    lineHeight: 1,
                                    fontSize: '12px',
                                    marginLeft: '2px',
                                }}
                            >✕</button>
                        )}
                    </div>
                ))}
            </div>

            {/* Ukupno + Export */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                flexShrink: 0,
            }}>
                <div style={{ textAlign: 'right' as const }}>
                    <div style={{
                        fontSize: '11px',
                        color: 'var(--v6-text-muted)',
                        fontWeight: 600,
                        textTransform: 'uppercase' as const,
                        letterSpacing: '0.05em',
                    }}>
                        Extras ukupno
                    </div>
                    <div style={{
                        fontSize: 'var(--v6-fs-lg)',
                        fontWeight: 900,
                        color: 'var(--v6-text-primary)',
                        lineHeight: 1,
                    }}>
                        {formatPrice(total)}
                    </div>
                </div>

                <button
                    onClick={onExport}
                    id="v6-export-btn"
                    aria-label="Export i deljenje ponude"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '11px 20px',
                        background: 'var(--v6-accent)',
                        color: 'var(--v6-accent-text)',
                        border: 'none',
                        borderRadius: 'var(--v6-radius-md)',
                        fontSize: 'var(--v6-fs-sm)',
                        fontWeight: 700,
                        cursor: 'pointer',
                        fontFamily: 'var(--v6-font)',
                        transition: 'opacity 0.15s',
                        whiteSpace: 'nowrap',
                    }}
                >
                    <span>📤</span>
                    <span>Export & Share</span>
                </button>
            </div>
        </div>
    );
};

export default PackageBasketBar;
