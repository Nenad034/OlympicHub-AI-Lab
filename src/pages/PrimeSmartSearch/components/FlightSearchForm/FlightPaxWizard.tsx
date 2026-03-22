import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Users, Baby, User } from 'lucide-react';

const styles: Record<string, React.CSSProperties> = {
    overlay: {
        position: 'fixed',
        inset: 0,
        zIndex: 10000,
        background: 'transparent',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
    },
    panel: {
        background: 'var(--v6-bg-card, #ffffff)',
        border: '1.5px solid var(--v6-border, #e2e8f0)',
        borderRadius: 'var(--v6-radius-lg, 16px)',
        padding: '24px',
        width: '380px',
        maxWidth: '95vw',
        boxShadow: 'var(--v6-shadow-lg, 0 10px 40px rgba(0,0,0,0.15))',
    },
    panelTitle: {
        fontSize: 'var(--v6-fs-md)',
        fontWeight: 700,
        color: 'var(--v6-text-primary)',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    counterRow: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '16px',
        padding: '12px',
        background: 'var(--v6-bg-section)',
        borderRadius: 'var(--v6-radius-md)',
    },
    counterLabel: {
        fontSize: 'var(--v6-fs-xs)',
        color: 'var(--v6-text-primary)',
        fontWeight: 700,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
    },
    counterSub: {
        fontSize: '11px',
        color: 'var(--v6-text-muted)',
        fontWeight: 500,
        marginTop: '2px',
    },
    counterControls: {
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
    },
    counterBtn: {
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        border: '1.5px solid var(--v6-border)',
        background: 'var(--v6-bg-card)',
        color: 'var(--v6-text-primary)',
        fontSize: '18px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 600,
    },
    counterValue: {
        fontSize: 'var(--v6-fs-md)',
        fontWeight: 700,
        color: 'var(--v6-text-primary)',
        minWidth: '20px',
        textAlign: 'center',
    },
    childrenAgesRow: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
        marginTop: '12px',
        padding: '12px',
        border: '1px solid var(--v6-border)',
        borderRadius: 'var(--v6-radius-md)',
    },
    ageGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        flex: '1 1 80px',
    },
    ageLabel: {
        fontSize: '10px',
        color: 'var(--v6-text-muted)',
        fontWeight: 700,
        textTransform: 'uppercase',
    },
    ageSelect: {
        padding: '6px 10px',
        border: '1.5px solid var(--v6-border)',
        borderRadius: '6px',
        background: 'var(--v6-bg-card)',
        color: 'var(--v6-text-primary)',
        fontSize: '12px',
        fontWeight: 600,
        cursor: 'pointer',
        outline: 'none',
    },
    footer: {
        marginTop: '20px',
        paddingTop: '16px',
        borderTop: '1px solid var(--v6-border)',
    },
    applyBtn: {
        width: '100%',
        padding: '12px',
        background: 'var(--v6-accent)',
        color: 'var(--v6-accent-text)',
        border: 'none',
        borderRadius: 'var(--v6-radius-md)',
        fontSize: 'var(--v6-fs-sm)',
        fontWeight: 700,
        cursor: 'pointer',
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
                className="v6-occupancy-trigger"
                style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center' }}
                type="button"
            >
                <Users size={16} />
                <span style={{ flex: 1, marginLeft: '8px' }}>{summaryLabel}</span>
                <span style={{ opacity: 0.5 }}>▾</span>
            </button>

            {isOpen && createPortal(
                <div className="v6-portal-wrapper">
                    <div style={styles.overlay} onClick={() => setIsOpen(false)}>
                        <div
                            ref={panelRef}
                            onClick={e => e.stopPropagation()}
                            style={{
                                ...styles.panel,
                                position: 'fixed',
                                top: panelPos.top,
                                left: Math.max(10, Math.min(panelPos.left, window.innerWidth - 400)),
                            }}
                        >
                            <div style={styles.panelTitle}>
                                <span>✈️ Putnici</span>
                                <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: 'var(--v6-text-muted)' }}>✕</button>
                            </div>

                            {/* Odrasli */}
                            <div style={styles.counterRow}>
                                <div>
                                    <div style={styles.counterLabel}><User size={14} /> Odrasli</div>
                                    <div style={styles.counterSub}>12+ godina</div>
                                </div>
                                <div style={styles.counterControls}>
                                    <button style={styles.counterBtn} onClick={() => handleUpdate('adults', Math.max(1, adults - 1))} disabled={adults <= 1}>−</button>
                                    <span style={styles.counterValue}>{adults}</span>
                                    <button style={styles.counterBtn} onClick={() => handleUpdate('adults', Math.min(9, adults + 1))} disabled={totalPax >= 9}>+</button>
                                </div>
                            </div>

                            {/* Deca */}
                            <div style={styles.counterRow}>
                                <div>
                                    <div style={styles.counterLabel}><Users size={14} /> Deca</div>
                                    <div style={styles.counterSub}>2–11 godina</div>
                                </div>
                                <div style={styles.counterControls}>
                                    <button style={styles.counterBtn} onClick={() => handleUpdate('children', Math.max(0, children - 1))} disabled={children <= 0}>−</button>
                                    <span style={styles.counterValue}>{children}</span>
                                    <button style={styles.counterBtn} onClick={() => handleUpdate('children', Math.min(6, children + 1))} disabled={totalPax >= 9}>+</button>
                                </div>
                            </div>

                            {/* Bebe */}
                            <div style={styles.counterRow}>
                                <div>
                                    <div style={styles.counterLabel}><Baby size={14} /> Bebe</div>
                                    <div style={styles.counterSub}>Ispod 2 godine</div>
                                </div>
                                <div style={styles.counterControls}>
                                    <button style={styles.counterBtn} onClick={() => handleUpdate('infants', Math.max(0, infants - 1))} disabled={infants <= 0}>−</button>
                                    <span style={styles.counterValue}>{infants}</span>
                                    <button style={styles.counterBtn} onClick={() => handleUpdate('infants', Math.min(4, infants + 1))} disabled={totalPax >= 9}>+</button>
                                </div>
                            </div>

                            {/* Uzrast dece */}
                            {children > 0 && (
                                <div style={styles.childrenAgesRow}>
                                    {childAges.map((age, idx) => (
                                        <div key={idx} style={styles.ageGroup}>
                                            <label style={styles.ageLabel}>Dete {idx + 1}</label>
                                            <select
                                                style={styles.ageSelect}
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

                            <div style={styles.footer}>
                                <button style={styles.applyBtn} onClick={() => setIsOpen(false)}>Potvrdi</button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};
