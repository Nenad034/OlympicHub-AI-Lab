import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Users, Baby, User, ChevronDown, X, Plane } from 'lucide-react';
import { useThemeStore } from '../../../../stores';

const styles: Record<string, React.CSSProperties> = {
    overlay: {
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        background: 'transparent',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    panelTitle: {
        fontSize: '18px',
        fontWeight: 800,
        color: 'var(--text-main)',
        marginBottom: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        letterSpacing: '-0.02em',
    },
    counterLabel: {
        fontSize: '14px',
        color: 'var(--text-main)',
        fontWeight: 700,
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
    },
    counterSub: {
        fontSize: '11px',
        color: 'var(--text-muted)',
        fontWeight: 500,
        marginTop: '2px',
    },
    counterControls: {
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
    },
    counterValue: {
        fontSize: '16px',
        fontWeight: 800,
        color: 'var(--text-main)',
        minWidth: '24px',
        textAlign: 'center',
    },
    childrenAgesRow: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '10px',
        marginTop: '16px',
        padding: '16px',
        background: 'var(--bg-app)',
        borderRadius: '16px',
        border: '1px solid var(--border-color)',
    },
};

interface FlightPaxWizardProps {
    adults: number;
    children: number;
    infants: number;
    childAges: number[];
    onChange: (data: { adults: number; children: number; infants: number; childAges: number[] }) => void;
}

export const FlightPaxWizard: React.FC<FlightPaxWizardProps> = ({ 
    adults, children, infants, childAges, onChange 
}) => {
    const { theme } = useThemeStore();
    const isDark = theme === 'navy';
    const [isOpen, setIsOpen] = useState(false);
    const [panelPos, setPanelPos] = useState({ top: 0, left: 0 });
    const triggerRef = useRef<HTMLButtonElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);

    const openWizard = () => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setPanelPos({
                top: rect.bottom + 8,
                left: rect.left,
            });
        }
        setIsOpen(true);
    };

    useEffect(() => {
        if (!isOpen) return;
        const handler = (e: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(e.target as Node) && 
                triggerRef.current && !triggerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [isOpen]);

    const handleUpdate = (key: string, val: number) => {
        const newData = { adults, children, infants, childAges: [...childAges] };
        if (key === 'adults') newData.adults = val;
        if (key === 'infants') newData.infants = val;
        if (key === 'children') {
            newData.children = val;
            if (val > childAges.length) {
                newData.childAges = [...childAges, ...Array(val - childAges.length).fill(7)];
            } else {
                newData.childAges = childAges.slice(0, val);
            }
        }
        onChange(newData);
    };

    const handleAgeChange = (idx: number, age: number) => {
        const newAges = [...childAges];
        newAges[idx] = age;
        onChange({ adults, children, infants, childAges: newAges });
    };

    const totalPax = adults + children + infants;
    const summaryLabel = `${adults} odr${children > 0 ? `, ${children} dec` : ''}${infants > 0 ? `, ${infants} beb` : ''}`;

    return (
        <div style={{ flex: 1, minWidth: '180px' }}>
            <button
                ref={triggerRef}
                onClick={openWizard}
                className="v6-occupancy-trigger field-container"
                style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '12px' }}
                type="button"
            >
                <Users className="icon-luxury" size={18} style={{ color: 'var(--brand-accent)' }} />
                <span style={{ flex: 1, fontWeight: 700, color: 'var(--text-main)' }}>{summaryLabel}</span>
                <ChevronDown className="icon-luxury" size={14} style={{ opacity: 0.5 }} />
            </button>

            {isOpen && createPortal(
                <div style={{ position: 'fixed', inset: 0, zIndex: 10000 }}>
                    <div style={styles.overlay} onClick={() => setIsOpen(false)}>
                        <div
                            ref={panelRef}
                            onClick={e => e.stopPropagation()}
                            className={`v6-prime-hub v6-luxury-popover ${isDark ? 'v6-dark' : ''}`}
                            style={{
                                position: 'fixed',
                                top: panelPos.top,
                                left: Math.max(10, Math.min(panelPos.left, window.innerWidth - 380)),
                                width: 'min(380px, 95vw)',
                                zIndex: 10001
                            }}
                        >
                            <div style={styles.panelTitle}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ background: 'var(--brand-accent-light)', width: '32px', height: '32px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Plane size={18} style={{ color: 'var(--brand-accent)' }} />
                                    </div>
                                    <span style={{ fontSize: '18px', fontWeight: 800 }}>Putnici</span>
                                </div>
                                <button 
                                    onClick={() => setIsOpen(false)} 
                                    style={{ background: 'var(--bg-app)', border: 'none', cursor: 'pointer', color: 'var(--text-main)', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                                    className="v6-close-btn"
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Odrasli */}
                            <div className="dropdown-row">
                                <div>
                                    <div style={styles.counterLabel}><User className="icon-luxury" size={16} /> Odrasli</div>
                                    <div style={styles.counterSub}>12+ godina</div>
                                </div>
                                <div style={styles.counterControls}>
                                    <button className="counter-btn-luxury" style={{ width: 34, height: 34, padding: 0 }} onClick={() => handleUpdate('adults', Math.max(1, adults - 1))} disabled={adults <= 1}>−</button>
                                    <span style={styles.counterValue}>{adults}</span>
                                    <button className="counter-btn-luxury" style={{ width: 34, height: 34, padding: 0 }} onClick={() => handleUpdate('adults', Math.min(9, adults + 1))} disabled={totalPax >= 9}>+</button>
                                </div>
                            </div>

                            {/* Deca */}
                            <div className="dropdown-row">
                                <div>
                                    <div style={styles.counterLabel}><Users className="icon-luxury" size={16} /> Deca</div>
                                    <div style={styles.counterSub}>2–11 godina</div>
                                </div>
                                <div style={styles.counterControls}>
                                    <button className="counter-btn-luxury" style={{ width: 34, height: 34, padding: 0 }} onClick={() => handleUpdate('children', Math.max(0, children - 1))} disabled={children <= 0}>−</button>
                                    <span style={styles.counterValue}>{children}</span>
                                    <button className="counter-btn-luxury" style={{ width: 34, height: 34, padding: 0 }} onClick={() => handleUpdate('children', Math.min(6, children + 1))} disabled={totalPax >= 9}>+</button>
                                </div>
                            </div>

                            {/* Bebe */}
                            <div className="dropdown-row">
                                <div>
                                    <div style={styles.counterLabel}><Baby className="icon-luxury" size={16} /> Bebe</div>
                                    <div style={styles.counterSub}>Ispod 2 godine</div>
                                </div>
                                <div style={styles.counterControls}>
                                    <button className="counter-btn-luxury" style={{ width: 34, height: 34, padding: 0 }} onClick={() => handleUpdate('infants', Math.max(0, infants - 1))} disabled={infants <= 0}>−</button>
                                    <span style={styles.counterValue}>{infants}</span>
                                    <button className="counter-btn-luxury" style={{ width: 34, height: 34, padding: 0 }} onClick={() => handleUpdate('infants', Math.min(4, infants + 1))} disabled={totalPax >= 9}>+</button>
                                </div>
                            </div>

                            {/* Uzrast dece */}
                            {children > 0 && (
                                <div style={styles.childrenAgesRow}>
                                    {childAges.map((age, idx) => (
                                        <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: '1 1 80px' }}>
                                            <label style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 800, textTransform: 'uppercase' }}>Dete {idx + 1}</label>
                                            <select
                                                style={{ padding: '8px', border: '1.5px solid var(--border-color)', borderRadius: '10px', background: 'var(--bg-surface)', color: 'var(--text-main)', fontSize: '12px', fontWeight: 600, outline: 'none' }}
                                                value={age}
                                                onChange={e => handleAgeChange(idx, parseInt(e.target.value))}
                                            >
                                                {Array.from({ length: 12 }, (_, i) => i + 2).map(a => (
                                                    <option key={a} value={a}>{a} god.</option>
                                                ))}
                                            </select>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--border-color)' }}>
                                <button 
                                    className="v6-search-btn-advanced" 
                                    style={{ width: '100%' }} 
                                    onClick={() => setIsOpen(false)} 
                                    type="button"
                                >
                                    Potvrdi
                                </button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};
