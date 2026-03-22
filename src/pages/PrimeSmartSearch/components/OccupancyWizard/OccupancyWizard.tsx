import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useSearchStore, calcPaxSummary } from '../../stores/useSearchStore';

// ─────────────────────────────────────────────────────────────
// STYLES (inline — izolovane od globalnog CSS-a)
// ─────────────────────────────────────────────────────────────
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
    panelTitle: {
        fontSize: 'var(--v6-fs-md)',
        fontWeight: 700,
        color: 'var(--v6-text-primary)',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    roomCard: {
        border: '1px solid var(--v6-border)',
        borderRadius: 'var(--v6-radius-md)',
        padding: '14px',
        marginBottom: '12px',
        background: 'var(--v6-bg-main)',
    },
    roomHeader: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '12px',
    },
    roomLabel: {
        fontSize: 'var(--v6-fs-xs)',
        fontWeight: 700,
        color: 'var(--v6-text-primary)',
    },
    removeBtn: {
        background: 'none',
        border: '1px solid var(--v6-border)',
        borderRadius: '6px',
        color: 'var(--v6-text-muted)',
        fontSize: '12px',
        cursor: 'pointer',
        padding: '3px 8px',
    },
    counterLabel: {
        fontSize: 'var(--v6-fs-xs)',
        color: 'var(--v6-text-primary)',
        fontWeight: 500,
    },
    counterSub: {
        fontSize: '12px',
        color: 'var(--v6-text-muted)',
        display: 'block',
    },
    counterValue: {
        fontSize: 'var(--v6-fs-md)',
        fontWeight: 700,
        color: 'var(--v6-text-primary)',
        minWidth: '24px',
        textAlign: 'center',
    },
    childrenAgesRow: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '8px',
        marginTop: '8px',
        paddingTop: '10px',
        borderTop: '1px solid var(--v6-border)',
    },
    ageGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        flex: '1 1 90px',
    },
    ageLabel: {
        fontSize: '11px',
        color: 'var(--v6-text-muted)',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
    },
    ageSelect: {
        padding: '7px 10px',
        border: '1.5px solid var(--v6-border)',
        borderRadius: 'var(--v6-radius-sm)',
        background: 'var(--v6-bg-card)',
        color: 'var(--v6-text-primary)',
        fontSize: 'var(--v6-fs-xs)',
        fontWeight: 600,
        cursor: 'pointer',
        outline: 'none',
        width: '100%',
    },
    addRoomBtn: {
        width: '100%',
        padding: '12px',
        border: '1.5px solid var(--v6-border)',
        borderRadius: 'var(--v6-radius-md)',
        background: 'var(--v6-bg-card)',
        color: 'var(--v6-text-secondary)',
        fontSize: 'var(--v6-fs-xs)',
        fontWeight: 600,
        cursor: 'pointer',
        transition: 'border-color 0.2s, color 0.2s',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        marginTop: '4px',
    },
    footer: {
        marginTop: '16px',
        paddingTop: '16px',
        borderTop: '1px solid var(--v6-border)',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
    },
    summaryLine: {
        fontSize: 'var(--v6-fs-xs)',
        color: 'var(--v6-text-secondary)',
        textAlign: 'center' as const,
    },
    applyBtn: {
        width: '100%',
        padding: '13px',
        background: '#1A234E', // Navy blue background from master design
        color: '#FFFFFF',      // Explicit white text
        border: 'none',
        borderRadius: 'var(--v6-radius-md)',
        fontSize: 'var(--v6-fs-sm)',
        fontWeight: 700,
        cursor: 'pointer',
        transition: 'opacity 0.2s',
    },
};

// ─────────────────────────────────────────────────────────────
// Counter Component (Odrasli / Deca)
// ─────────────────────────────────────────────────────────────
interface CounterProps {
    label: string;
    sublabel?: string;
    value: number;
    min?: number;
    max?: number;
    onChange: (val: number) => void;
}

const Counter: React.FC<CounterProps> = ({ label, sublabel, value, min = 0, max = 10, onChange }) => (
    <div className="dropdown-row">
        <div>
            <span style={styles.counterLabel}>{label}</span>
            {sublabel && <span style={styles.counterSub}>{sublabel}</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button
                className="counter-btn"
                onClick={() => onChange(Math.max(min, value - 1))}
                disabled={value <= min}
                aria-label={`Smanji ${label}`}
                type="button"
            >−</button>
            <span style={styles.counterValue}>{value}</span>
            <button
                className="counter-btn"
                onClick={() => onChange(Math.min(max, value + 1))}
                disabled={value >= max}
                aria-label={`Povećaj ${label}`}
                type="button"
            >+</button>
        </div>
    </div>
);

// ─────────────────────────────────────────────────────────────
// MAIN: Occupancy Wizard
// ─────────────────────────────────────────────────────────────
interface OccupancyWizardProps {
    triggerRef?: React.RefObject<HTMLElement>;
}

export const OccupancyWizard: React.FC<OccupancyWizardProps> = ({ triggerRef }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isDark, setIsDark] = useState(false);
    const [panelPos, setPanelPos] = useState({ top: 0, left: 0 });
    const localTriggerRef = useRef<HTMLButtonElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);

    const {
        roomAllocations,
        addRoom,
        removeRoom,
        updateRoomAllocation,
        checkIn, checkOut,
    } = useSearchStore();

    const pax = calcPaxSummary(roomAllocations, checkIn, checkOut);

    const openWizard = (e: React.MouseEvent<HTMLButtonElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setPanelPos({
            top: rect.bottom + 6,
            left: rect.left,
        });
        setIsDark(!!e.currentTarget.closest('.v6-dark'));
        setIsOpen(true);
    };

    useEffect(() => {
        if (!isOpen) return;
        const handler = (e: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(e.target as Node) && 
                localTriggerRef.current && !localTriggerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [isOpen]);

    const getTriggerLabel = () => {
        const label = `${pax.totalAdults} odr, ${pax.totalChildren} deca`;
        if (roomAllocations.length > 1) return `${label} (${roomAllocations.length} sobe)`;
        return label;
    };

    const getSummaryText = () => {
        return `${pax.totalAdults} Odraslih, ${pax.totalChildren} Dece u ${roomAllocations.length} Soba`;
    };

    return (
        <>
            {/* TRIGGER BUTTON */}
            <button
                ref={localTriggerRef}
                onClick={openWizard}
                className="v6-occupancy-trigger field-container"
                style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '12px' }}
                aria-haspopup="true"
                aria-expanded={isOpen}
                type="button"
            >
                <div style={{ color: 'var(--brand-accent)', display: 'flex', alignItems: 'center' }}>👤</div>
                <span style={{ flex: 1, textAlign: 'left', fontWeight: 700, color: 'var(--text-main)' }}>{getTriggerLabel()}</span>
                <span style={{ opacity: 0.5 }}>▾</span>
            </button>

            {/* PANEL (PORTAL - Izvan DOM stabla komponente) */}
            {isOpen && createPortal(
                <div className={`v6-prime-hub ${isDark ? 'v6-dark' : ''}`} style={{ position: 'fixed', inset: 0, zIndex: 10000, pointerEvents: 'none', background: 'transparent' }}>
                    <div 
                        ref={panelRef}
                        className="v6-portal-panel v6-luxury-popover"
                        style={{
                            position: 'fixed',
                            top: panelPos.top + 8,
                            left: Math.max(10, Math.min(panelPos.left, window.innerWidth - 440)),
                            pointerEvents: 'auto',
                            width: '420px',
                            maxWidth: '95vw',
                            maxHeight: '80vh',
                            overflowY: 'auto',
                            zIndex: 10001
                        }}
                    >
                        {/* Header */}
                        <div style={styles.panelTitle}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ background: 'var(--brand-accent-light)', width: '32px', height: '32px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <span style={{ color: 'var(--brand-accent)', fontSize: '16px' }}>🏨</span>
                                </div>
                                <span style={{ fontSize: '18px', fontWeight: 800 }}>Putnici & Sobe</span>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                style={{ background: 'var(--bg-app)', border: 'none', cursor: 'pointer', color: 'var(--text-main)', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                                aria-label="Zatvori"
                                type="button"
                            >✕</button>
                        </div>

                        {roomAllocations.map((room, idx) => (
                            <div key={idx} style={styles.roomCard}>
                                <div style={styles.roomHeader}>
                                    <span style={styles.roomLabel}>Soba {idx + 1}</span>
                                    {roomAllocations.length > 1 && (
                                        <button
                                            style={styles.removeBtn}
                                            onClick={() => removeRoom(idx)}
                                            aria-label={`Ukloni Sobu ${idx + 1}`}
                                            type="button"
                                        >
                                            ✕ Ukloni sobu
                                        </button>
                                    )}
                                </div>
                                <Counter
                                    label="Odrasli"
                                    sublabel="18+ godina"
                                    value={room.adults}
                                    min={1}
                                    max={8}
                                    onChange={(val) => updateRoomAllocation(idx, { adults: val })}
                                />
                                <Counter
                                    label="Deca"
                                    sublabel="0–17 godina"
                                    value={room.children}
                                    min={0}
                                    max={6}
                                    onChange={(val) => updateRoomAllocation(idx, { children: val })}
                                />
                                {room.children > 0 && (
                                    <div style={styles.childrenAgesRow}>
                                        {room.childrenAges.map((age, childIdx) => (
                                            <div key={childIdx} style={styles.ageGroup}>
                                                <label htmlFor={`age-r${idx}-c${childIdx}`} style={styles.ageLabel}>Dete {childIdx + 1}</label>
                                                <select
                                                    id={`age-r${idx}-c${childIdx}`}
                                                    style={styles.ageSelect}
                                                    value={age}
                                                    onChange={(e) => {
                                                        const newAges = [...room.childrenAges];
                                                        newAges[childIdx] = parseInt(e.target.value);
                                                        updateRoomAllocation(idx, { childrenAges: newAges });
                                                    }}
                                                >
                                                    {Array.from({ length: 18 }, (_, i) => (
                                                        <option key={i} value={i}>
                                                            {i === 0 ? '< 1 god' : `${i} ${i === 1 ? 'godina' : i < 5 ? 'godine' : 'godina'}`}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                        {roomAllocations.length < 6 && (
                            <button style={styles.addRoomBtn} onClick={addRoom} type="button">
                                <span style={{ color: '#CBD5E1' }}>＋</span>
                                <span>Dodaj još jednu sobu</span>
                            </button>
                        )}
                        <div style={styles.footer}>
                            <button 
                                style={{ 
                                    width: '100%', 
                                    padding: '16px', 
                                    background: 'linear-gradient(135deg, #7B2CBF, #9D4EDD)', 
                                    color: 'white', 
                                    border: 'none', 
                                    borderRadius: '14px', 
                                    fontSize: '16px', 
                                    fontWeight: 800, 
                                    cursor: 'pointer', 
                                    boxShadow: '0 4px 15px rgba(157, 78, 221, 0.4)'
                                }} 
                                onClick={() => setIsOpen(false)} 
                                type="button"
                            >
                                Potvrdi
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};

export default OccupancyWizard;
