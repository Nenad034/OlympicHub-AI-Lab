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
        background: 'transparent', // Bez zatamnjenja cele strane
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'flex-start',
    },
    panel: {
        background: 'var(--v6-bg-card, #ffffff)', // Fallback na solidnu belu
        border: '1.5px solid var(--v6-border, #e2e8f0)', // Naglašenije
        borderRadius: 'var(--v6-radius-lg, 16px)',
        padding: '24px', // Više disanja
        width: '420px',
        maxWidth: '95vw',
        maxHeight: '80vh',
        overflowY: 'auto',
        boxShadow: 'var(--v6-shadow-lg, 0 10px 40px rgba(0,0,0,0.15))',
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
        background: 'var(--v6-bg-section)',
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
    counterRow: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '10px',
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
        transition: 'border-color 0.2s',
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
        border: '1.5px dashed var(--v6-border)',
        borderRadius: 'var(--v6-radius-md)',
        background: 'transparent',
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
        background: 'var(--v6-accent)',
        color: 'var(--v6-accent-text)',
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
    <div style={styles.counterRow}>
        <div>
            <span style={styles.counterLabel}>{label}</span>
            {sublabel && <span style={styles.counterSub}>{sublabel}</span>}
        </div>
        <div style={styles.counterControls}>
            <button
                style={styles.counterBtn}
                onClick={() => onChange(Math.max(min, value - 1))}
                disabled={value <= min}
                aria-label={`Smanji ${label}`}
            >−</button>
            <span style={styles.counterValue}>{value}</span>
            <button
                style={styles.counterBtn}
                onClick={() => onChange(Math.min(max, value + 1))}
                disabled={value >= max}
                aria-label={`Povećaj ${label}`}
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
    const [panelPos, setPanelPos] = useState({ top: 0, left: 0 });
    const panelRef = useRef<HTMLDivElement>(null);

    const {
        roomAllocations,
        addRoom,
        removeRoom,
        updateRoomAllocation,
        checkIn, checkOut,
    } = useSearchStore();

    const pax = calcPaxSummary(roomAllocations, checkIn, checkOut);

    // Postavi poziciju panela ispod trigger dugmeta
    const openWizard = (e: React.MouseEvent<HTMLButtonElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        setPanelPos({
            top: rect.bottom + 6, // Približeno (samo 6px ofseta umesto 8 + scroll)
            left: rect.left,
        });
        setIsOpen(true);
    };

    // Zatvori klik izvan panela
    useEffect(() => {
        if (!isOpen) return;
        const handler = (e: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [isOpen]);

    // Trigger button label
    const getTriggerLabel = () => {
        const rooms = roomAllocations.length;
        const adults = pax.totalAdults;
        const children = pax.totalChildren;
        
        let label = `${adults} odr.`;
        if (children > 0) label += ` · ${children} dece`;
        label += ` · ${rooms} s.`;
        return label;
    };

    // Ukupan summary tekst
    const getSummaryText = () => {
        const parts: string[] = [];
        parts.push(`${pax.totalAdults} odraslih`);
        if (pax.totalChildren > 0) {
            const agesStr = pax.childrenAges.map(a => `${a} god`).join(', ');
            parts.push(`${pax.totalChildren} dece (${agesStr})`);
        }
        parts.push(`${roomAllocations.length} ${roomAllocations.length === 1 ? 'soba' : 'sobe'}`);
        return parts.join(' · ');
    };

    return (
        <>
            {/* TRIGGER DUGME */}
            <button
                className="v6-occupancy-trigger"
                onClick={openWizard}
                type="button"
                aria-expanded={isOpen}
                aria-haspopup="dialog"
            >
                <span>👤</span>
                <span style={{ flex: 1, textAlign: 'left' }}>{getTriggerLabel()}</span>
                <span style={{ opacity: 0.5 }}>▾</span>
            </button>

            {/* PANEL (PORTAL - Izvan DOM stabla komponente) */}
            {isOpen && createPortal(
                <div className="v6-prime-hub v6-portal-wrapper">
                    <div
                        style={{
                            ...styles.overlay,
                            background: 'transparent',
                            backdropFilter: 'none', 
                        }}
                        role="dialog"
                        aria-modal="true"
                        aria-label="Putnici i sobe"
                    >
                        <div
                            ref={panelRef}
                            style={{
                                ...styles.panel,
                                position: 'fixed',
                                top: panelPos.top + 8, // Mali odmak da se vidi polje iznad
                                left: Math.max(10, Math.min(panelPos.left, window.innerWidth - 440)),
                            }}
                        >
                        {/* Header */}
                        <div style={styles.panelTitle}>
                            <span>🏨 Putnici & Sobe</span>
                            <button
                                onClick={() => setIsOpen(false)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: 'var(--v6-text-muted)' }}
                                aria-label="Zatvori"
                            >✕</button>
                        </div>

                        {/* ... rest of the content (skipped for speed, will use same logic) ... */}
                        {roomAllocations.map((room, idx) => (
                            <div key={idx} style={styles.roomCard}>
                                <div style={styles.roomHeader}>
                                    <span style={styles.roomLabel}>Soba {idx + 1}</span>
                                    {roomAllocations.length > 1 && (
                                        <button
                                            style={styles.removeBtn}
                                            onClick={() => removeRoom(idx)}
                                            aria-label={`Ukloni Sobu ${idx + 1}`}
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
                                <span>＋</span>
                                <span>Dodaj još jednu sobu</span>
                            </button>
                        )}
                        <div style={styles.footer}>
                            <p style={styles.summaryLine}>📋 {getSummaryText()}</p>
                            <button style={styles.applyBtn} onClick={() => setIsOpen(false)} type="button">Potvrdi izbor</button>
                        </div>
                    </div>
                </div>
            </div>,
            document.body
        )}
    </>
);
};

export default OccupancyWizard;
