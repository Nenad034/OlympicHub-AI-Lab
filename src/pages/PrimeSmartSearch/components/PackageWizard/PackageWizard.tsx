import React, { useMemo } from 'react';
import { useSearchStore, calcPaxSummary, calcBasketTotal } from '../../stores/useSearchStore';
import { MOCK_HOTEL_RESULTS, MOCK_ROOM_OPTIONS } from '../../data/mockResults';
import { MOCK_FLIGHT_RESULTS } from '../../data/mockFlights';
import { MOCK_TRANSFERS, MOCK_ACTIVITIES } from '../../data/mockPackageData';
import { FlightCard } from '../FlightCard/FlightCard';
import type { FlightSearchResult, HotelSearchResult } from '../../types';
import type { TransferOption, ActivityOption } from '../../data/mockPackageData';

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
const formatPrice = (n: number, currency = 'EUR') =>
    new Intl.NumberFormat('de-DE', { style: 'currency', currency, minimumFractionDigits: 0 }).format(n);

// ─────────────────────────────────────────────────────────────
// STEPPER (Progress Bar)
// ─────────────────────────────────────────────────────────────
const STEPS = [
    { num: 1, label: 'Pretraga',    emoji: '🔍' },
    { num: 2, label: 'Let',         emoji: '✈️' },
    { num: 3, label: 'Hotel',       emoji: '🏨' },
    { num: 4, label: 'Transfer',    emoji: '🚐' },
    { num: 5, label: 'Ekstra',      emoji: '🎟️' },
    { num: 6, label: 'Pregled',     emoji: '✅' },
];

const Stepper: React.FC<{ currentStep: number; onStepClick: (n: number) => void; maxReached: number }> = ({ currentStep, onStepClick, maxReached }) => (
    <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '14px 24px',
        background: 'var(--v6-bg-card)',
        borderBottom: '1px solid var(--v6-border)',
        gap: '0',
        overflowX: 'auto',
    }}
        role="navigation"
        aria-label="Koraci paketa"
    >
        {STEPS.map((step, idx) => {
            const isActive    = step.num === currentStep;
            const isDone      = step.num < currentStep;
            const isReachable = step.num <= maxReached;

            return (
                <React.Fragment key={step.num}>
                    {/* Korak */}
                    <button
                        onClick={() => isReachable && onStepClick(step.num)}
                        disabled={!isReachable}
                        aria-current={isActive ? 'step' : undefined}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '4px',
                            minWidth: '72px',
                            padding: '6px 8px',
                            border: 'none',
                            background: 'transparent',
                            cursor: isReachable ? 'pointer' : 'default',
                            fontFamily: 'var(--v6-font)',
                        }}
                    >
                        <div style={{
                            width: '34px',
                            height: '34px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: isDone ? '16px' : '18px',
                            fontWeight: 700,
                            background: isActive
                                ? 'var(--v6-accent)'
                                : isDone
                                    ? 'var(--v6-color-instant)'
                                    : 'var(--v6-bg-section)',
                            border: `2px solid ${isActive ? 'var(--v6-accent)' : isDone ? 'var(--v6-color-instant)' : 'var(--v6-border)'}`,
                            color: (isActive || isDone) ? '#ffffff' : 'var(--v6-text-muted)',
                            transition: 'all 0.2s',
                        }}>
                            {isDone ? '✓' : step.emoji}
                        </div>
                        <span style={{
                            fontSize: '10px',
                            fontWeight: isActive ? 700 : 500,
                            color: isActive ? 'var(--v6-accent)' : isDone ? 'var(--v6-color-instant-text)' : 'var(--v6-text-muted)',
                            whiteSpace: 'nowrap',
                        }}>
                            {step.label}
                        </span>
                    </button>

                    {/* Linija između */}
                    {idx < STEPS.length - 1 && (
                        <div style={{
                            flex: 1,
                            height: '2px',
                            background: step.num < currentStep ? 'var(--v6-color-instant)' : 'var(--v6-border)',
                            minWidth: '20px',
                            transition: 'background 0.3s',
                            marginBottom: '20px',
                        }} />
                    )}
                </React.Fragment>
            );
        })}
    </div>
);

// ─────────────────────────────────────────────────────────────
// PRICE BUILD-UP PANEL (sticky desno)
// ─────────────────────────────────────────────────────────────
const PriceBuildUp: React.FC<{
    flight?: FlightSearchResult;
    hotelName?: string;
    hotelPrice?: number;
    transferName?: string;
    transferPrice?: number;
    extras: ActivityOption[];
    paxTotal: number;
    nights: number;
}> = ({ flight, hotelName, hotelPrice, transferName, transferPrice, extras, paxTotal, nights }) => {
    const items: { label: string; price: number; icon: string }[] = [];

    if (flight) items.push({ icon: '✈️', label: `Let: ${flight.airline}`, price: flight.totalPrice });
    if (hotelName && hotelPrice) items.push({ icon: '🏨', label: `Hotel: ${hotelName}`, price: hotelPrice });
    if (transferName && transferPrice) items.push({ icon: '🚐', label: `Transfer: ${transferName}`, price: transferPrice });
    extras.forEach(e => items.push({ icon: e.emoji, label: e.title, price: e.totalPrice }));

    const total = items.reduce((s, i) => s + i.price, 0);

    return (
        <div style={{
            width: '260px',
            flexShrink: 0,
            background: 'var(--v6-bg-card)',
            border: '1.5px solid var(--v6-border)',
            borderRadius: 'var(--v6-radius-lg)',
            overflow: 'hidden',
            alignSelf: 'flex-start',
            position: 'sticky',
            top: '12px',
        }}>
            {/* Header */}
            <div style={{
                padding: '12px 16px',
                background: 'var(--v6-bg-section)',
                borderBottom: '1px solid var(--v6-border)',
            }}>
                <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--v6-text-muted)' }}>
                    💰 Vaš Paket
                </div>
                <div style={{ fontSize: '12px', color: 'var(--v6-text-muted)', marginTop: '2px' }}>
                    {paxTotal} {paxTotal === 1 ? 'putnik' : 'putnika'} · {nights} noćenja
                </div>
            </div>

            {/* Stavke */}
            <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '8px', minHeight: '80px' }}>
                {items.length === 0 ? (
                    <div style={{ fontSize: '12px', color: 'var(--v6-text-muted)', fontStyle: 'italic', textAlign: 'center', padding: '12px 0' }}>
                        Ništa odabrano
                    </div>
                ) : (
                    items.map((item, i) => (
                        <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', fontSize: '12px' }}>
                            <span style={{ flexShrink: 0 }}>{item.icon}</span>
                            <span style={{ flex: 1, color: 'var(--v6-text-secondary)', lineHeight: 1.3 }}>{item.label}</span>
                            <span style={{ fontWeight: 700, color: 'var(--v6-text-primary)', whiteSpace: 'nowrap' }}>
                                {formatPrice(item.price)}
                            </span>
                        </div>
                    ))
                )}
            </div>

            {/* Total */}
            <div style={{
                padding: '12px 16px',
                borderTop: '2px solid var(--v6-border)',
                background: 'var(--v6-bg-section)',
            }}>
                <div style={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--v6-text-muted)' }}>
                    Ukupno
                </div>
                <div style={{ fontSize: '22px', fontWeight: 900, color: total > 0 ? 'var(--v6-color-instant-text)' : 'var(--v6-text-muted)', lineHeight: 1.1, marginTop: '2px' }}>
                    {total > 0 ? formatPrice(total) : '—'}
                </div>
                {total > 0 && paxTotal > 1 && (
                    <div style={{ fontSize: '11px', color: 'var(--v6-text-muted)', marginTop: '3px' }}>
                        ≈ {formatPrice(Math.round(total / paxTotal))}/os
                    </div>
                )}
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────
// KORAK 1: Pretraga
// ─────────────────────────────────────────────────────────────
const Step1Search: React.FC<{ onNext: () => void }> = ({ onNext }) => {
    const { destinations, checkIn, checkOut, roomAllocations, addDestination, removeDestination, setCheckIn, setCheckOut } = useSearchStore();
    const [tagInput, setTagInput] = React.useState('');
    const today = new Date().toISOString().split('T')[0];
    const pax = calcPaxSummary(roomAllocations, checkIn, checkOut);

    const handleAddTag = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && tagInput.trim()) {
            addDestination({
                id: Date.now().toString(),
                name: tagInput.trim(),
                type: 'city',
                country: '',
            });
            setTagInput('');
        }
    };

    const canContinue = destinations.length > 0 && checkIn && checkOut && checkOut > checkIn;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
                <h3 style={{ margin: '0 0 16px', fontSize: 'var(--v6-fs-lg)', fontWeight: 800, color: 'var(--v6-text-primary)' }}>
                    🔍 Definišite parametre paketa
                </h3>

                {/* Destinacija */}
                <div style={{ marginBottom: '14px' }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--v6-text-muted)', marginBottom: '6px' }}>
                        Destinacija (max 3)
                    </label>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', padding: '8px 12px', border: '1.5px solid var(--v6-border)', borderRadius: 'var(--v6-radius-md)', background: 'var(--v6-bg-main)', minHeight: '46px', alignItems: 'center' }}>
                        {destinations.map(d => (
                            <span key={d.id} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', background: 'var(--v6-accent)', color: 'var(--v6-accent-text)', borderRadius: '999px', fontSize: '13px', fontWeight: 600 }}>
                                {d.name}
                                <button onClick={() => removeDestination(d.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0, fontSize: '12px', lineHeight: 1 }}>✕</button>
                            </span>
                        ))}
                        {destinations.length < 3 && (
                            <input
                                type="text"
                                value={tagInput}
                                onChange={e => setTagInput(e.target.value)}
                                onKeyDown={handleAddTag}
                                placeholder="Unesite destinaciju, pritisnite Enter..."
                                style={{ flex: 1, minWidth: '160px', border: 'none', outline: 'none', background: 'transparent', color: 'var(--v6-text-primary)', fontSize: 'var(--v6-fs-sm)', fontFamily: 'var(--v6-font)' }}
                            />
                        )}
                    </div>
                </div>

                {/* Datumi */}
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '150px' }}>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--v6-text-muted)', marginBottom: '6px' }}>
                            📅 Datum polaska
                        </label>
                        <input type="date" min={today} value={checkIn} onChange={e => setCheckIn(e.target.value)}
                            style={{ width: '100%', padding: '11px 14px', border: '1.5px solid var(--v6-border)', borderRadius: 'var(--v6-radius-md)', background: 'var(--v6-bg-main)', color: 'var(--v6-text-primary)', fontSize: 'var(--v6-fs-sm)', fontFamily: 'var(--v6-font)', outline: 'none', boxSizing: 'border-box' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: '150px' }}>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--v6-text-muted)', marginBottom: '6px' }}>
                            📅 Datum povratka
                        </label>
                        <input type="date" min={checkIn || today} value={checkOut} onChange={e => setCheckOut(e.target.value)}
                            style={{ width: '100%', padding: '11px 14px', border: '1.5px solid var(--v6-border)', borderRadius: 'var(--v6-radius-md)', background: 'var(--v6-bg-main)', color: 'var(--v6-text-primary)', fontSize: 'var(--v6-fs-sm)', fontFamily: 'var(--v6-font)', outline: 'none', boxSizing: 'border-box' }} />
                    </div>
                </div>

                {/* Sažetak pax */}
                {checkIn && checkOut && (
                    <div style={{ marginTop: '12px', padding: '10px 14px', background: 'var(--v6-bg-section)', borderRadius: 'var(--v6-radius-md)', fontSize: '13px', color: 'var(--v6-text-secondary)' }}>
                        👥 <strong style={{ color: 'var(--v6-text-primary)' }}>{pax.totalAdults} odr.</strong>
                        {pax.totalChildren > 0 && ` + ${pax.totalChildren} dece`} ·
                        🏨 <strong style={{ color: 'var(--v6-text-primary)' }}>{pax.totalRooms} soba{pax.totalRooms > 1 ? 'e' : ''}</strong> ·
                        🌙 <strong style={{ color: 'var(--v6-text-primary)' }}>{pax.nights} noćenja</strong>
                    </div>
                )}
            </div>

            <button onClick={onNext} disabled={!canContinue}
                style={{ alignSelf: 'flex-end', padding: '12px 28px', background: canContinue ? 'var(--v6-accent)' : 'var(--v6-border)', color: canContinue ? 'var(--v6-accent-text)' : 'var(--v6-text-muted)', border: 'none', borderRadius: 'var(--v6-radius-md)', fontSize: 'var(--v6-fs-md)', fontWeight: 700, cursor: canContinue ? 'pointer' : 'not-allowed', fontFamily: 'var(--v6-font)' }}>
                Izaberi let →
            </button>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────
// KORAK 2: Let
// ─────────────────────────────────────────────────────────────
const Step2Flights: React.FC<{ onNext: () => void; onBack: () => void }> = ({ onNext, onBack }) => {
    const { packageWizardSelections, setPackageWizardFlight, roomAllocations } = useSearchStore();
    const pax = calcPaxSummary(roomAllocations, '', '');
    const paxTotal = pax.totalAdults + pax.totalChildren;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ margin: 0, fontSize: 'var(--v6-fs-lg)', fontWeight: 800, color: 'var(--v6-text-primary)' }}>
                ✈️ Izaberi let
            </h3>
            <p style={{ margin: 0, fontSize: 'var(--v6-fs-xs)', color: 'var(--v6-text-muted)' }}>
                Prikazani su dostupni letovi za izabrane termine. Cene su ukupne za sve putnike.
            </p>

            {MOCK_FLIGHT_RESULTS.map((flight, idx) => {
                const isSelected = packageWizardSelections.flight?.id === flight.id;
                return (
                    <div key={flight.id} style={{
                        outline: isSelected ? `2.5px solid var(--v6-color-instant)` : '2.5px solid transparent',
                        borderRadius: 'var(--v6-radius-lg)',
                        transition: 'outline 0.2s',
                    }}>
                        <FlightCard
                            flight={flight}
                            index={idx}
                            paxTotal={paxTotal}
                            onBook={(f) => setPackageWizardFlight(f)}
                        />
                        {isSelected && (
                            <div style={{ textAlign: 'center', padding: '8px', fontSize: '12px', fontWeight: 700, color: 'var(--v6-color-instant-text)', background: 'var(--v6-color-instant-bg)', borderRadius: '0 0 var(--v6-radius-lg) var(--v6-radius-lg)' }}>
                                ✓ Ovaj let je izabran za vaš paket
                            </div>
                        )}
                    </div>
                );
            })}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                <button onClick={onBack} style={{ padding: '11px 20px', border: '1.5px solid var(--v6-border)', borderRadius: 'var(--v6-radius-md)', background: 'transparent', color: 'var(--v6-text-secondary)', fontSize: 'var(--v6-fs-sm)', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--v6-font)' }}>← Nazad</button>
                <button onClick={onNext} disabled={!packageWizardSelections.flight}
                    style={{ padding: '11px 24px', background: packageWizardSelections.flight ? 'var(--v6-accent)' : 'var(--v6-border)', color: packageWizardSelections.flight ? 'var(--v6-accent-text)' : 'var(--v6-text-muted)', border: 'none', borderRadius: 'var(--v6-radius-md)', fontSize: 'var(--v6-fs-sm)', fontWeight: 700, cursor: packageWizardSelections.flight ? 'pointer' : 'not-allowed', fontFamily: 'var(--v6-font)' }}>
                    Izaberi hotel →
                </button>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────
// KORAK 3: Hotel + Soba
// ─────────────────────────────────────────────────────────────
const Step3Hotels: React.FC<{ onNext: () => void; onBack: () => void }> = ({ onNext, onBack }) => {
    const { packageWizardSelections, setPackageWizardHotel } = useSearchStore();
    const [expandedHotel, setExpandedHotel] = React.useState<string | null>(null);

    const selected = packageWizardSelections;
    const canContinue = !!(selected.hotelId && selected.roomId && selected.mealPlanCode);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ margin: 0, fontSize: 'var(--v6-fs-lg)', fontWeight: 800, color: 'var(--v6-text-primary)' }}>
                🏨 Izaberi hotel i sobu
            </h3>

            {MOCK_HOTEL_RESULTS.map(hotel => {
                const isHotelSelected = selected.hotelId === hotel.id;
                const isExpanded = expandedHotel === hotel.id;

                return (
                    <div key={hotel.id} style={{
                        border: `1.5px solid ${isHotelSelected ? 'var(--v6-color-instant)' : 'var(--v6-border)'}`,
                        borderRadius: 'var(--v6-radius-lg)',
                        overflow: 'hidden',
                        transition: 'border-color 0.2s',
                    }}>
                        {/* Hotel row (kompaktno) */}
                        <div
                            onClick={() => setExpandedHotel(isExpanded ? null : hotel.id)}
                            style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', cursor: 'pointer', background: isHotelSelected ? 'var(--v6-color-instant-bg)' : 'var(--v6-bg-card)' }}
                        >
                            {hotel.isPrime && <span style={{ padding: '2px 8px', background: 'linear-gradient(135deg,#b45309,#f59e0b)', color: '#fff', borderRadius: '999px', fontSize: '10px', fontWeight: 800 }}>🏆 PRIME</span>}
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: 700, fontSize: 'var(--v6-fs-sm)', color: 'var(--v6-text-primary)' }}>{hotel.name}</div>
                                <div style={{ fontSize: '11px', color: 'var(--v6-text-muted)' }}>{'★'.repeat(hotel.stars)} · {hotel.location.city} · od {formatPrice(hotel.lowestTotalPrice)}</div>
                            </div>
                            {isHotelSelected && <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--v6-color-instant-text)' }}>✓ Izabrano</span>}
                            <span style={{ color: 'var(--v6-text-muted)', fontSize: '14px' }}>{isExpanded ? '▲' : '▼'}</span>
                        </div>

                        {/* Sobe (expand) */}
                        {isExpanded && (
                            <div style={{ borderTop: '1px solid var(--v6-border)', background: 'var(--v6-bg-main)' }}>
                                {MOCK_ROOM_OPTIONS.map(room => (
                                    <div key={room.id} style={{ borderBottom: '1px solid var(--v6-border)' }}>
                                        <div style={{ padding: '10px 16px 4px', fontSize: '13px', fontWeight: 700, color: 'var(--v6-text-primary)' }}>{room.name}</div>
                                        {room.mealPlans.map(meal => {
                                            const isRowSelected = selected.hotelId === hotel.id && selected.roomId === room.id && selected.mealPlanCode === meal.code;
                                            return (
                                                <div key={meal.code} onClick={() => setPackageWizardHotel(hotel.id, room.id, meal.code)}
                                                    style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '8px 16px 8px 24px', cursor: 'pointer', background: isRowSelected ? 'var(--v6-color-instant-bg)' : 'transparent', transition: 'background 0.15s' }}>
                                                    <span style={{ flex: 1, fontSize: '13px', color: 'var(--v6-text-secondary)' }}>{meal.label}</span>
                                                    <span style={{ padding: '2px 8px', borderRadius: '999px', fontSize: '11px', fontWeight: 700, background: meal.status === 'instant' ? 'var(--v6-color-instant-bg)' : 'var(--v6-color-on-request-bg)', color: meal.status === 'instant' ? 'var(--v6-color-instant-text)' : 'var(--v6-color-on-request-text)' }}>{meal.status === 'instant' ? '⚡ Odmah' : '❓ Na upit'}</span>
                                                    <span style={{ fontSize: 'var(--v6-fs-md)', fontWeight: 800, color: 'var(--v6-text-primary)', minWidth: '80px', textAlign: 'right' }}>{formatPrice(meal.totalPrice)}</span>
                                                    {isRowSelected ? <span style={{ color: 'var(--v6-color-instant-text)', fontWeight: 700, fontSize: '13px' }}>✓</span>
                                                        : <span style={{ color: 'var(--v6-text-muted)', fontSize: '13px' }}>→</span>}
                                                </div>
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                <button onClick={onBack} style={{ padding: '11px 20px', border: '1.5px solid var(--v6-border)', borderRadius: 'var(--v6-radius-md)', background: 'transparent', color: 'var(--v6-text-secondary)', fontSize: 'var(--v6-fs-sm)', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--v6-font)' }}>← Nazad</button>
                <button onClick={onNext} disabled={!canContinue}
                    style={{ padding: '11px 24px', background: canContinue ? 'var(--v6-accent)' : 'var(--v6-border)', color: canContinue ? 'var(--v6-accent-text)' : 'var(--v6-text-muted)', border: 'none', borderRadius: 'var(--v6-radius-md)', fontSize: 'var(--v6-fs-sm)', fontWeight: 700, cursor: canContinue ? 'pointer' : 'not-allowed', fontFamily: 'var(--v6-font)' }}>
                    Izaberi transfer →
                </button>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────
// KORAK 4: Transfer
// ─────────────────────────────────────────────────────────────
const Step4Transfer: React.FC<{ onNext: () => void; onBack: () => void }> = ({ onNext, onBack }) => {
    const { packageWizardSelections, setPackageWizardTransfer } = useSearchStore();

    const typeLabels: Record<TransferOption['type'], string> = {
        shared: '🚌 Shuttle',
        private: '🚐 Privatni',
        luxury: '🚘 Luksuz',
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h3 style={{ margin: 0, fontSize: 'var(--v6-fs-lg)', fontWeight: 800, color: 'var(--v6-text-primary)' }}>
                🚐 Izaberi transfer (opciono)
            </h3>
            <p style={{ margin: 0, fontSize: 'var(--v6-fs-xs)', color: 'var(--v6-text-muted)' }}>
                Aerodrom → Hotel pri dolasku i Hotel → Aerodrom pri odlasku.
            </p>

            {MOCK_TRANSFERS.map(tr => {
                const isSelected = packageWizardSelections.transferId === tr.id;
                return (
                    <div key={tr.id} onClick={() => setPackageWizardTransfer(isSelected ? undefined : tr.id)}
                        style={{ display: 'flex', gap: '14px', alignItems: 'center', padding: '14px 16px', border: `1.5px solid ${isSelected ? 'var(--v6-color-instant)' : 'var(--v6-border)'}`, borderRadius: 'var(--v6-radius-lg)', background: isSelected ? 'var(--v6-color-instant-bg)' : 'var(--v6-bg-card)', cursor: 'pointer', transition: 'all 0.2s' }}>
                        <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', marginBottom: '4px' }}>
                                <span style={{ fontSize: 'var(--v6-fs-sm)', fontWeight: 700, color: 'var(--v6-text-primary)' }}>{tr.vehicle}</span>
                                {tr.isPrime && <span style={{ padding: '2px 8px', background: 'linear-gradient(135deg,#b45309,#f59e0b)', color: '#fff', borderRadius: '999px', fontSize: '10px', fontWeight: 800 }}>🏆 PRIME</span>}
                                <span style={{ fontSize: '11px', color: 'var(--v6-text-muted)' }}>max {tr.maxPassengers} putnika · {tr.durationMinutes} min · {tr.distanceKm} km</span>
                            </div>
                            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                {tr.includes.map(inc => (
                                    <span key={inc} style={{ fontSize: '11px', padding: '2px 8px', background: 'var(--v6-bg-section)', border: '1px solid var(--v6-border)', borderRadius: '4px', color: 'var(--v6-text-muted)' }}>✓ {inc}</span>
                                ))}
                            </div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <div style={{ fontSize: 'var(--v6-fs-xl)', fontWeight: 900, color: 'var(--v6-text-primary)' }}>{formatPrice(tr.totalPrice)}</div>
                            <div style={{ fontSize: '11px', color: 'var(--v6-text-muted)' }}>za grupu (A+P)</div>
                        </div>
                        <div style={{ width: '22px', height: '22px', borderRadius: '50%', border: `2px solid ${isSelected ? 'var(--v6-color-instant)' : 'var(--v6-border)'}`, background: isSelected ? 'var(--v6-color-instant)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '13px', flexShrink: 0 }}>
                            {isSelected && '✓'}
                        </div>
                    </div>
                );
            })}

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                <button onClick={onBack} style={{ padding: '11px 20px', border: '1.5px solid var(--v6-border)', borderRadius: 'var(--v6-radius-md)', background: 'transparent', color: 'var(--v6-text-secondary)', fontSize: 'var(--v6-fs-sm)', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--v6-font)' }}>← Nazad</button>
                <button onClick={onNext}
                    style={{ padding: '11px 24px', background: 'var(--v6-accent)', color: 'var(--v6-accent-text)', border: 'none', borderRadius: 'var(--v6-radius-md)', fontSize: 'var(--v6-fs-sm)', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--v6-font)' }}>
                    {packageWizardSelections.transferId ? 'Izaberi ekstra →' : 'Preskoči (bez transfera) →'}
                </button>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────
// KORAK 5: Aktivnosti & Osiguranje
// ─────────────────────────────────────────────────────────────
const Step5Extras: React.FC<{ onNext: () => void; onBack: () => void }> = ({ onNext, onBack }) => {
    const { packageWizardSelections, togglePackageWizardExtra } = useSearchStore();

    const categories = [
        { key: 'tour',      label: '🗺️ Izleti' },
        { key: 'sport',     label: '⛷️ Sport & Avantura' },
        { key: 'culture',   label: '🎭 Kultura' },
        { key: 'food',      label: '🍷 Gastronomija' },
        { key: 'wellness',  label: '💆 Wellness' },
        { key: 'insurance', label: '🛡️ Osiguranje' },
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
                <h3 style={{ margin: '0 0 4px', fontSize: 'var(--v6-fs-lg)', fontWeight: 800, color: 'var(--v6-text-primary)' }}>
                    🎟️ Dodaj aktivnosti i osiguranje
                </h3>
                <p style={{ margin: 0, fontSize: 'var(--v6-fs-xs)', color: 'var(--v6-text-muted)' }}>
                    Izaberite šta sve želite da dodate u paket. Sve je opciono.
                </p>
            </div>

            {categories.map(cat => {
                const items = MOCK_ACTIVITIES.filter(a => a.category === cat.key);
                if (items.length === 0) return null;
                return (
                    <div key={cat.key}>
                        <div style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--v6-text-muted)', marginBottom: '10px' }}>{cat.label}</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {items.map(act => {
                                const isSelected = packageWizardSelections.extraIds.includes(act.id);
                                return (
                                    <div key={act.id} onClick={() => togglePackageWizardExtra(act.id)}
                                        style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '12px 14px', border: `1.5px solid ${isSelected ? 'var(--v6-color-instant)' : 'var(--v6-border)'}`, borderRadius: 'var(--v6-radius-md)', background: isSelected ? 'var(--v6-color-instant-bg)' : 'var(--v6-bg-card)', cursor: 'pointer', transition: 'all 0.15s' }}>
                                        <span style={{ fontSize: '24px', flexShrink: 0 }}>{act.emoji}</span>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: 'var(--v6-fs-sm)', fontWeight: 700, color: 'var(--v6-text-primary)' }}>{act.title}</div>
                                            <div style={{ fontSize: '12px', color: 'var(--v6-text-muted)', marginTop: '2px', lineHeight: 1.4 }}>{act.description}</div>
                                            {act.durationHours > 0 && <div style={{ fontSize: '11px', color: 'var(--v6-text-muted)', marginTop: '4px' }}>⏱ {act.durationHours}h {act.departureTime ? `· Polazak ${act.departureTime}` : ''}</div>}
                                            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '6px' }}>
                                                {act.includes.slice(0, 3).map(inc => <span key={inc} style={{ fontSize: '10px', padding: '2px 6px', background: 'var(--v6-bg-section)', border: '1px solid var(--v6-border)', borderRadius: '4px', color: 'var(--v6-text-muted)' }}>✓ {inc}</span>)}
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                            <div style={{ fontSize: 'var(--v6-fs-lg)', fontWeight: 900, color: 'var(--v6-text-primary)' }}>{formatPrice(act.totalPrice)}</div>
                                            <div style={{ fontSize: '11px', color: 'var(--v6-text-muted)', whiteSpace: 'nowrap' }}>za grupu</div>
                                        </div>
                                        <div style={{ width: '22px', height: '22px', borderRadius: '50%', border: `2px solid ${isSelected ? 'var(--v6-color-instant)' : 'var(--v6-border)'}`, background: isSelected ? 'var(--v6-color-instant)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '13px', flexShrink: 0 }}>
                                            {isSelected && '✓'}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button onClick={onBack} style={{ padding: '11px 20px', border: '1.5px solid var(--v6-border)', borderRadius: 'var(--v6-radius-md)', background: 'transparent', color: 'var(--v6-text-secondary)', fontSize: 'var(--v6-fs-sm)', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--v6-font)' }}>← Nazad</button>
                <button onClick={onNext}
                    style={{ padding: '11px 24px', background: 'var(--v6-accent)', color: 'var(--v6-accent-text)', border: 'none', borderRadius: 'var(--v6-radius-md)', fontSize: 'var(--v6-fs-sm)', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--v6-font)' }}>
                    {packageWizardSelections.extraIds.length > 0 ? `Pregled paketa (${packageWizardSelections.extraIds.length} extras) →` : 'Preskoči → Pregled'}
                </button>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────
// KORAK 6: Pregled Paketa
// ─────────────────────────────────────────────────────────────
const Step6Summary: React.FC<{ onBack: () => void; onBook: (total: number) => void }> = ({ onBack, onBook }) => {
    const { packageWizardSelections, roomAllocations, checkIn, checkOut } = useSearchStore();
    const pax = calcPaxSummary(roomAllocations, checkIn, checkOut);

    const selectedFlight = packageWizardSelections.flight;
    const selectedHotel = MOCK_HOTEL_RESULTS.find(h => h.id === packageWizardSelections.hotelId);
    const selectedRoom = MOCK_ROOM_OPTIONS.find(r => r.id === packageWizardSelections.roomId);
    const selectedMeal = selectedRoom?.mealPlans.find(m => m.code === packageWizardSelections.mealPlanCode);
    const selectedTransfer = MOCK_TRANSFERS.find(t => t.id === packageWizardSelections.transferId);
    const selectedExtras = MOCK_ACTIVITIES.filter(a => packageWizardSelections.extraIds.includes(a.id));

    const items: { emoji: string; label: string; detail: string; price: number }[] = [];
    if (selectedFlight) items.push({ emoji: selectedFlight.airlineLogo, label: `Let: ${selectedFlight.airline}`, detail: `${selectedFlight.outbound.segments[0].origin} → ${selectedFlight.outbound.segments[selectedFlight.outbound.segments.length - 1].destination}${selectedFlight.inbound ? ' (povratni)' : ''}`, price: selectedFlight.totalPrice });
    if (selectedHotel && selectedRoom && selectedMeal) items.push({ emoji: '🏨', label: selectedHotel.name, detail: `${selectedRoom.name} · ${selectedMeal.label} · ${pax.nights} noćenja`, price: selectedMeal.totalPrice });
    if (selectedTransfer) items.push({ emoji: '🚐', label: selectedTransfer.vehicle, detail: `${selectedTransfer.from} ↔ Hotel`, price: selectedTransfer.totalPrice });
    selectedExtras.forEach(e => items.push({ emoji: e.emoji, label: e.title, detail: e.description.slice(0, 60) + '...', price: e.totalPrice }));

    const grandTotal = items.reduce((s, i) => s + i.price, 0);

    const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('sr-Latn-RS', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ margin: 0, fontSize: 'var(--v6-fs-lg)', fontWeight: 800, color: 'var(--v6-text-primary)' }}>
                ✅ Pregled vašeg paketa
            </h3>

            {/* PAX sažetak */}
            <div style={{ padding: '12px 16px', background: 'var(--v6-bg-section)', borderRadius: 'var(--v6-radius-md)', border: '1px solid var(--v6-border)', fontSize: '13px', color: 'var(--v6-text-secondary)', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <span>📅 <strong style={{ color: 'var(--v6-text-primary)' }}>{formatDate(checkIn)} — {formatDate(checkOut)}</strong></span>
                <span>🌙 <strong style={{ color: 'var(--v6-text-primary)' }}>{pax.nights} noćenja</strong></span>
                <span>👥 <strong style={{ color: 'var(--v6-text-primary)' }}>{pax.totalAdults} odr.{pax.totalChildren > 0 ? ` + ${pax.totalChildren} dece` : ''}</strong></span>
            </div>

            {/* Stavke */}
            <div style={{ border: '1px solid var(--v6-border)', borderRadius: 'var(--v6-radius-lg)', overflow: 'hidden' }}>
                {items.map((item, i) => (
                    <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'center', padding: '14px 16px', borderBottom: i < items.length - 1 ? '1px solid var(--v6-border)' : 'none', background: 'var(--v6-bg-card)' }}>
                        <span style={{ fontSize: '22px', flexShrink: 0 }}>{item.emoji}</span>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 'var(--v6-fs-sm)', fontWeight: 700, color: 'var(--v6-text-primary)' }}>{item.label}</div>
                            <div style={{ fontSize: '12px', color: 'var(--v6-text-muted)', marginTop: '2px' }}>{item.detail}</div>
                        </div>
                        <div style={{ fontSize: 'var(--v6-fs-lg)', fontWeight: 800, color: 'var(--v6-text-primary)', textAlign: 'right', whiteSpace: 'nowrap' }}>{formatPrice(item.price)}</div>
                    </div>
                ))}

                {/* Grand Total */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: 'var(--v6-bg-section)', borderTop: '2px solid var(--v6-border)' }}>
                    <div>
                        <div style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--v6-text-muted)' }}>UKUPNO ZA VAŠ PAKET</div>
                        <div style={{ fontSize: '11px', color: 'var(--v6-text-muted)', marginTop: '2px' }}>
                            {pax.totalAdults} odr.{pax.totalChildren > 0 ? ` + ${pax.totalChildren} dece` : ''} · {pax.nights} noćenja · {items.length} stavki
                        </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '28px', fontWeight: 900, color: 'var(--v6-color-instant-text)', lineHeight: 1 }}>{formatPrice(grandTotal)}</div>
                        <div style={{ fontSize: '12px', color: 'var(--v6-text-muted)', marginTop: '3px' }}>≈ {formatPrice(Math.round(grandTotal / Math.max(pax.totalAdults, 1)))}/os</div>
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button onClick={onBack} style={{ padding: '11px 20px', border: '1.5px solid var(--v6-border)', borderRadius: 'var(--v6-radius-md)', background: 'transparent', color: 'var(--v6-text-secondary)', fontSize: 'var(--v6-fs-sm)', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--v6-font)' }}>← Izmeni</button>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        onClick={() => onBook(grandTotal)}
                        style={{ padding: '13px 28px', background: 'var(--v6-color-instant)', color: '#ffffff', border: 'none', borderRadius: 'var(--v6-radius-md)', fontSize: 'var(--v6-fs-md)', fontWeight: 700, cursor: 'pointer', fontFamily: 'var(--v6-font)' }}>
                        🏁 Rezerviši paket — {formatPrice(grandTotal)}
                    </button>
                </div>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────
// MAIN: PackageWizard
// ─────────────────────────────────────────────────────────────
interface PackageWizardProps {
    onComplete: (total: number) => void;
}

export const PackageWizard: React.FC<PackageWizardProps> = ({ onComplete }) => {
    const { packageWizardStep, packageWizardSelections, setPackageWizardStep, roomAllocations, checkIn, checkOut } = useSearchStore();

    const pax = calcPaxSummary(roomAllocations, checkIn, checkOut);
    const paxTotal = pax.totalAdults + pax.totalChildren;

    // Maksimalni dosegnuti korak (za Stepper navigaciju)
    const maxReached = packageWizardStep;

    // Podaci za Price Build-Up
    const selectedFlight = packageWizardSelections.flight;
    const selectedHotel  = MOCK_HOTEL_RESULTS.find(h => h.id === packageWizardSelections.hotelId);
    const selectedRoom   = MOCK_ROOM_OPTIONS.find(r => r.id === packageWizardSelections.roomId);
    const selectedMeal   = selectedRoom?.mealPlans.find(m => m.code === packageWizardSelections.mealPlanCode);
    const selectedTransfer = MOCK_TRANSFERS.find(t => t.id === packageWizardSelections.transferId);
    const selectedExtras = MOCK_ACTIVITIES.filter(a => packageWizardSelections.extraIds.includes(a.id));

    const renderStep = () => {
        switch (packageWizardStep) {
            case 1: return <Step1Search onNext={() => setPackageWizardStep(2)} />;
            case 2: return <Step2Flights onNext={() => setPackageWizardStep(3)} onBack={() => setPackageWizardStep(1)} />;
            case 3: return <Step3Hotels  onNext={() => setPackageWizardStep(4)} onBack={() => setPackageWizardStep(2)} />;
            case 4: return <Step4Transfer onNext={() => setPackageWizardStep(5)} onBack={() => setPackageWizardStep(3)} />;
            case 5: return <Step5Extras  onNext={() => setPackageWizardStep(6)} onBack={() => setPackageWizardStep(4)} />;
            case 6: return <Step6Summary  onBack={() => setPackageWizardStep(5)} onBook={onComplete} />;
            default: return null;
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
            {/* Stepper */}
            <Stepper currentStep={packageWizardStep} onStepClick={setPackageWizardStep} maxReached={maxReached} />

            {/* Body: Step Content + Price Build-Up */}
            <div style={{
                display: 'flex',
                gap: '20px',
                padding: '20px',
                alignItems: 'flex-start',
            }}>
                {/* Levi panel: aktivan korak */}
                <div style={{ flex: 1, minWidth: 0 }} className="v6-fade-in" key={packageWizardStep}>
                    {renderStep()}
                </div>

                {/* Desni panel: Price Build-Up */}
                <PriceBuildUp
                    flight={selectedFlight}
                    hotelName={selectedHotel?.name}
                    hotelPrice={selectedMeal?.totalPrice}
                    transferName={selectedTransfer?.vehicle}
                    transferPrice={selectedTransfer?.totalPrice}
                    extras={selectedExtras}
                    paxTotal={paxTotal}
                    nights={pax.nights}
                />
            </div>
        </div>
    );
};

export default PackageWizard;
