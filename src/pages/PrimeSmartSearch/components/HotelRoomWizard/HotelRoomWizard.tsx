import React, { useState } from 'react';
import type { HotelSearchResult, RoomOption, MealPlanOption } from '../../types';
import { useSearchStore, calcPaxSummary } from '../../stores/useSearchStore';
import { MOCK_ROOM_OPTIONS } from '../../data/mockResults';

// ─────────────────────────────────────────────────────────────
// FORMATIRANJE
// ─────────────────────────────────────────────────────────────
const formatPrice = (price: number, currency = 'EUR') =>
    new Intl.NumberFormat('de-DE', { style: 'currency', currency, minimumFractionDigits: 0 }).format(price);

// ─────────────────────────────────────────────────────────────
// STATUS BADGE
// ─────────────────────────────────────────────────────────────
const StatusBadge: React.FC<{ status: MealPlanOption['status'] }> = ({ status }) => (
    <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '3px 10px',
        borderRadius: '999px',
        fontSize: '12px',
        fontWeight: 700,
        background: status === 'instant'
            ? 'var(--v6-color-instant-bg)'
            : 'var(--v6-color-on-request-bg)',
        color: status === 'instant'
            ? 'var(--v6-color-instant-text)'
            : 'var(--v6-color-on-request-text)',
    }}>
        {status === 'instant' ? '⚡ Odmah' : '❓ Na upit'}
    </span>
);

// ─────────────────────────────────────────────────────────────
// POJEDINAČNA SOBA — Classic Clarity Sekcija
// ─────────────────────────────────────────────────────────────
interface RoomSectionProps {
    room: RoomOption;
    slotIndex: number;       // koji slot popunjavamo (Soba 1, Soba 2...)
    paxAdults: number;
    paxChildren: number;
    childrenAges: number[];
    nights: number;
    onSelect: (roomId: string, mealCode: string, totalPrice: number) => void;
    selectedMeal?: { roomId: string; mealCode: string } | null;
}

const RoomSection: React.FC<RoomSectionProps> = ({
    room, slotIndex, paxAdults, paxChildren, childrenAges, nights, onSelect, selectedMeal
}) => {
    // Filtriraj sobe koje odgovaraju strukturi osoba
    const fits = room.maxAdults >= paxAdults && room.maxChildren >= paxChildren;
    if (!fits) return null;

    const isRoomSelected = selectedMeal?.roomId === room.id;

    return (
        <div style={{
            marginBottom: '20px',
            background: 'var(--v6-bg-card)',
            border: `1px solid ${isRoomSelected ? 'var(--v6-color-instant)' : 'var(--v6-border)'}`,
            borderRadius: 'var(--v6-radius-lg)',
            overflow: 'hidden',
            transition: 'border-color 0.2s',
        }}>
            {/* Room Header */}
            <div style={{
                padding: '14px 18px',
                background: isRoomSelected ? 'var(--v6-color-instant-bg)' : 'var(--v6-bg-section)',
                borderBottom: '1px solid var(--v6-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
            }}>
                <div>
                    <h4 style={{
                        margin: 0,
                        fontSize: 'var(--v6-fs-sm)',
                        fontWeight: 700,
                        color: 'var(--v6-text-primary)',
                    }}>
                        {room.name}
                    </h4>
                    <p style={{
                        margin: '3px 0 0',
                        fontSize: '12px',
                        color: 'var(--v6-text-muted)',
                    }}>
                        {room.description}
                    </p>
                </div>
                {isRoomSelected && (
                    <span style={{
                        fontSize: '12px',
                        fontWeight: 700,
                        color: 'var(--v6-color-instant-text)',
                        whiteSpace: 'nowrap',
                    }}>
                        ✓ Izabrano
                    </span>
                )}
            </div>

            {/* Meal Plans tabela */}
            <div>
                {room.mealPlans.map((meal, idx) => {
                    const isSelected = selectedMeal?.roomId === room.id && selectedMeal?.mealCode === meal.code;
                    return (
                        <div
                            key={meal.code}
                            style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr auto auto auto',
                                alignItems: 'center',
                                gap: '16px',
                                padding: '14px 18px',
                                borderTop: idx > 0 ? '1px solid var(--v6-border)' : 'none',
                                background: isSelected ? 'rgba(5,150,105,0.04)' : 'transparent',
                                transition: 'background 0.15s',
                            }}
                        >
                            {/* Naziv usluge (UVEK pun naziv) */}
                            <div>
                                <div style={{
                                    fontSize: 'var(--v6-fs-sm)',
                                    fontWeight: 600,
                                    color: 'var(--v6-text-primary)',
                                }}>
                                    {meal.label}
                                </div>
                                {meal.isRefundable && meal.cancellationDeadline && (
                                    <div style={{
                                        fontSize: '11px',
                                        color: 'var(--v6-color-instant-text)',
                                        marginTop: '2px',
                                    }}>
                                        ✓ Besplatno otkazivanje do {new Date(meal.cancellationDeadline).toLocaleDateString('sr-Latn-RS', { day: 'numeric', month: 'short' })}
                                    </div>
                                )}
                                {!meal.isRefundable && (
                                    <div style={{
                                        fontSize: '11px',
                                        color: 'var(--v6-color-on-request-text)',
                                        marginTop: '2px',
                                    }}>
                                        ⚠ Nije moguće otkazivanje
                                    </div>
                                )}
                            </div>

                            {/* Status */}
                            <StatusBadge status={meal.status} />

                            {/* Cena */}
                            <div style={{ textAlign: 'right' as const }}>
                                <div style={{
                                    fontSize: 'var(--v6-fs-lg)',
                                    fontWeight: 800,
                                    color: 'var(--v6-text-primary)',
                                    lineHeight: 1,
                                }}>
                                    {formatPrice(meal.totalPrice)}
                                </div>
                                <div style={{
                                    fontSize: '11px',
                                    color: 'var(--v6-text-muted)',
                                    marginTop: '3px',
                                    whiteSpace: 'nowrap',
                                }}>
                                    {paxAdults} odr
                                    {paxChildren > 0 ? ` + ${paxChildren} dece (${childrenAges.join(', ')} god)` : ''}
                                    {nights > 0 ? ` · ${nights} noćenja` : ''}
                                </div>
                            </div>

                            {/* Dugme */}
                            <button
                                onClick={() => onSelect(room.id, meal.code, meal.totalPrice)}
                                aria-label={`Izaberi ${meal.label} za ${room.name}`}
                                style={{
                                    padding: '9px 18px',
                                    borderRadius: 'var(--v6-radius-md)',
                                    border: 'none',
                                    background: isSelected ? 'var(--v6-color-instant)' : 'var(--v6-accent)',
                                    color: '#ffffff',
                                    fontSize: 'var(--v6-fs-xs)',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    fontFamily: 'var(--v6-font)',
                                    whiteSpace: 'nowrap',
                                    transition: 'opacity 0.15s',
                                }}
                            >
                                {isSelected ? '✓ Izabrano' : 'Odaberi →'}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────
// MAIN: Hotel Room Wizard
// ─────────────────────────────────────────────────────────────
interface HotelRoomWizardProps {
    hotel: HotelSearchResult;
    onClose: () => void;
    onBook: (selections: RoomSelection[]) => void;
}

interface RoomSelection {
    slotIndex: number;
    roomId: string;
    roomName: string;
    mealPlanCode: string;
    mealPlanLabel: string;
    totalPrice: number;
    adults: number;
    children: number;
    childrenAges: number[];
}

export const HotelRoomWizard: React.FC<HotelRoomWizardProps> = ({ hotel, onClose, onBook }) => {
    const { roomAllocations, checkIn, checkOut } = useSearchStore();
    const pax = calcPaxSummary(roomAllocations, checkIn, checkOut);

    // selectedMeals: Map od slotIndex -> { roomId, mealCode, totalPrice, ... }
    const [selectedMeals, setSelectedMeals] = useState<Record<number, RoomSelection>>({});

    const handleSelect = (
        slotIndex: number,
        roomId: string,
        mealCode: string,
        totalPrice: number
    ) => {
        const room = MOCK_ROOM_OPTIONS.find(r => r.id === roomId);
        const meal = room?.mealPlans.find(m => m.code === mealCode);
        if (!room || !meal) return;

        const allocation = roomAllocations[slotIndex];

        setSelectedMeals(prev => ({
            ...prev,
            [slotIndex]: {
                slotIndex,
                roomId,
                roomName: room.name,
                mealPlanCode: mealCode,
                mealPlanLabel: meal.label,
                totalPrice,
                adults: allocation.adults,
                children: allocation.children,
                childrenAges: allocation.childrenAges,
            },
        }));
    };

    const totalSelected = Object.values(selectedMeals).reduce((sum, s) => sum + s.totalPrice, 0);
    const allSlotsSelected = roomAllocations.length === Object.keys(selectedMeals).length;

    const formatDate = (d: string) => d
        ? new Date(d).toLocaleDateString('sr-Latn-RS', { day: 'numeric', month: 'long', year: 'numeric' })
        : '—';

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 3000,
            background: 'rgba(15,23,42,0.6)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            padding: '20px',
            overflowY: 'auto',
        }}
            role="dialog"
            aria-modal="true"
            aria-label={`Opcije za ${hotel.name}`}
        >
            <div style={{
                width: '100%',
                maxWidth: '900px',
                background: 'var(--v6-bg-main)',
                borderRadius: 'var(--v6-radius-xl)',
                overflow: 'hidden',
                boxShadow: 'var(--v6-shadow-lg)',
                display: 'flex',
                flexDirection: 'column',
                maxHeight: '90vh',
            }}>
                {/* ── HEADER ────────────────────────────────── */}
                <div style={{
                    padding: '20px 24px',
                    background: 'var(--v6-bg-card)',
                    borderBottom: '1px solid var(--v6-border)',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '16px',
                }}>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            {hotel.isPrime && (
                                <span style={{
                                    padding: '2px 8px',
                                    background: 'var(--v6-color-prime-bg)',
                                    color: 'var(--v6-color-prime)',
                                    borderRadius: '999px',
                                    fontSize: '11px',
                                    fontWeight: 800,
                                }}>🏆 PRIME</span>
                            )}
                            <span style={{ fontSize: 'var(--v6-fs-xs)', color: '#f59e0b' }}>
                                {'★'.repeat(hotel.stars)}
                            </span>
                        </div>
                        <h2 style={{
                            margin: '6px 0 4px',
                            fontSize: 'var(--v6-fs-xl)',
                            fontWeight: 800,
                            color: 'var(--v6-text-primary)',
                        }}>
                            {hotel.name}
                        </h2>
                        <p style={{ margin: 0, fontSize: 'var(--v6-fs-xs)', color: 'var(--v6-text-muted)' }}>
                            📍 {hotel.location.city}, {hotel.location.country}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        aria-label="Zatvori"
                        style={{
                            background: 'none',
                            border: '1.5px solid var(--v6-border)',
                            borderRadius: '50%',
                            width: '36px',
                            height: '36px',
                            cursor: 'pointer',
                            fontSize: '16px',
                            color: 'var(--v6-text-muted)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                        }}
                    >✕</button>
                </div>

                {/* ── PAX SUMMARY BANNER (užarena traka) ─── */}
                <div style={{
                    padding: '10px 24px',
                    background: 'var(--v6-bg-section)',
                    borderBottom: '1px solid var(--v6-border)',
                    display: 'flex',
                    gap: '20px',
                    flexWrap: 'wrap',
                    fontSize: 'var(--v6-fs-xs)',
                    color: 'var(--v6-text-secondary)',
                }}>
                    <span>📅 <strong style={{ color: 'var(--v6-text-primary)' }}>{formatDate(checkIn)} — {formatDate(checkOut)}</strong> · {pax.nights} noćenja</span>
                    <span>👥 <strong style={{ color: 'var(--v6-text-primary)' }}>{pax.totalAdults} odr.</strong>
                        {pax.totalChildren > 0 && ` + ${pax.totalChildren} dece (${pax.childrenAges.join(', ')} god)`}
                    </span>
                    <span>🏨 <strong style={{ color: 'var(--v6-text-primary)' }}>{pax.totalRooms} {pax.totalRooms === 1 ? 'soba' : 'sobe'}</strong></span>
                </div>

                {/* ── SCROLLABLE CONTENT ────────────────────── */}
                <div style={{ overflowY: 'auto', padding: '24px', flex: 1 }}>
                    {roomAllocations.map((allocation, slotIdx) => (
                        <div key={slotIdx} style={{ marginBottom: '32px' }}>
                            {/* Slot naslov */}
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                marginBottom: '14px',
                            }}>
                                <div style={{
                                    width: '30px',
                                    height: '30px',
                                    borderRadius: '50%',
                                    background: selectedMeals[slotIdx]
                                        ? 'var(--v6-color-instant)'
                                        : 'var(--v6-accent)',
                                    color: '#ffffff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 800,
                                    fontSize: '14px',
                                    flexShrink: 0,
                                }}>{slotIdx + 1}</div>
                                <div>
                                    <h3 style={{
                                        margin: 0,
                                        fontSize: 'var(--v6-fs-md)',
                                        fontWeight: 700,
                                        color: 'var(--v6-text-primary)',
                                    }}>
                                        Soba {slotIdx + 1}
                                    </h3>
                                    <p style={{
                                        margin: 0,
                                        fontSize: '12px',
                                        color: 'var(--v6-text-muted)',
                                    }}>
                                        {allocation.adults} odraslih
                                        {allocation.children > 0
                                            ? ` + ${allocation.children} dece (${allocation.childrenAges.join(', ')} god)`
                                            : ''
                                        }
                                    </p>
                                </div>
                                {selectedMeals[slotIdx] && (
                                    <span style={{
                                        marginLeft: 'auto',
                                        fontSize: '12px',
                                        fontWeight: 600,
                                        color: 'var(--v6-color-instant-text)',
                                        background: 'var(--v6-color-instant-bg)',
                                        padding: '3px 10px',
                                        borderRadius: '999px',
                                    }}>
                                        ✓ {selectedMeals[slotIdx].roomName} — {selectedMeals[slotIdx].mealPlanLabel}
                                    </span>
                                )}
                            </div>

                            {/* Sobe za ovaj slot */}
                            {MOCK_ROOM_OPTIONS.map(room => (
                                <RoomSection
                                    key={room.id}
                                    room={room}
                                    slotIndex={slotIdx}
                                    paxAdults={allocation.adults}
                                    paxChildren={allocation.children}
                                    childrenAges={allocation.childrenAges}
                                    nights={pax.nights}
                                    onSelect={(roomId, mealCode, totalPrice) =>
                                        handleSelect(slotIdx, roomId, mealCode, totalPrice)
                                    }
                                    selectedMeal={selectedMeals[slotIdx]
                                        ? { roomId: selectedMeals[slotIdx].roomId, mealCode: selectedMeals[slotIdx].mealPlanCode }
                                        : null
                                    }
                                />
                            ))}
                        </div>
                    ))}
                </div>

                {/* ── STICKY FOOTER: Live Summary + Rezerviši ── */}
                <div style={{
                    padding: '16px 24px',
                    borderTop: '2px solid var(--v6-border)',
                    background: 'var(--v6-bg-card)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px',
                    flexWrap: 'wrap',
                }}>
                    {/* Live Summary */}
                    <div>
                        <div style={{
                            fontSize: '12px',
                            color: 'var(--v6-text-muted)',
                            fontWeight: 600,
                            textTransform: 'uppercase' as const,
                            letterSpacing: '0.06em',
                        }}>
                            Ukupno za sve sobe
                        </div>
                        <div style={{
                            fontSize: 'var(--v6-fs-2xl)',
                            fontWeight: 900,
                            color: 'var(--v6-text-primary)',
                            lineHeight: 1.1,
                        }}>
                            {totalSelected > 0 ? formatPrice(totalSelected) : '—'}
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--v6-text-muted)', marginTop: '2px' }}>
                            {pax.totalAdults} odr
                            {pax.totalChildren > 0 ? ` + ${pax.totalChildren} dece` : ''} ·
                            {pax.totalRooms} sobe · {pax.nights} noćenja
                        </div>

                        {/* Stavke koje su izabrane */}
                        {Object.values(selectedMeals).length > 0 && (
                            <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                {Object.values(selectedMeals).map(sel => (
                                    <div key={sel.slotIndex} style={{
                                        fontSize: '12px',
                                        color: 'var(--v6-text-secondary)',
                                        display: 'flex',
                                        gap: '8px',
                                    }}>
                                        <span>Soba {sel.slotIndex + 1}:</span>
                                        <span>{sel.roomName} – {sel.mealPlanLabel}</span>
                                        <strong style={{ marginLeft: 'auto', color: 'var(--v6-text-primary)' }}>
                                            {formatPrice(sel.totalPrice)}
                                        </strong>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Dugme Rezerviši */}
                    <button
                        disabled={!allSlotsSelected}
                        onClick={() => onBook(Object.values(selectedMeals))}
                        style={{
                            padding: '14px 32px',
                            background: allSlotsSelected ? 'var(--v6-color-instant)' : 'var(--v6-border)',
                            color: allSlotsSelected ? '#ffffff' : 'var(--v6-text-muted)',
                            border: 'none',
                            borderRadius: 'var(--v6-radius-md)',
                            fontSize: 'var(--v6-fs-md)',
                            fontWeight: 700,
                            cursor: allSlotsSelected ? 'pointer' : 'not-allowed',
                            fontFamily: 'var(--v6-font)',
                            transition: 'all 0.2s ease',
                            whiteSpace: 'nowrap',
                        }}
                        aria-label={allSlotsSelected
                            ? 'Rezerviši odabrane sobe'
                            : `Izaberite još ${roomAllocations.length - Object.keys(selectedMeals).length} sobu`
                        }
                    >
                        {allSlotsSelected
                            ? '🏁 Nastavi ka rezervaciji'
                            : `Izaberite još ${roomAllocations.length - Object.keys(selectedMeals).length} sobu`
                        }
                    </button>
                </div>
            </div>
        </div>
    );
};

export default HotelRoomWizard;
