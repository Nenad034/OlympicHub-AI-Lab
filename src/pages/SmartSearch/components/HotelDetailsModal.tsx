import React from 'react';
import { createPortal } from 'react-dom';
import { X, Star, MapPin, CalendarDays, Users, ShieldCheck, AlertTriangle, XCircle, ArrowRight } from 'lucide-react';
import type { SmartSearchResult } from '../../../services/smartSearchService';
import type { RoomAllocation } from '../types';
import {
    formatPrice, getPriceWithMargin, cleanRoomName,
    formatRoomConfigLabel, getRoomCancelStatus, isStatusOnRequest
} from '../helpers';
import {
    renderMealPlanBadge, renderAvailabilityStatus, renderCancellationBadge
} from '../renderHelpers';
import { formatDate } from '../../../utils/dateUtils';

interface HotelDetailsModalProps {
    hotel: SmartSearchResult;
    checkIn: string;
    checkOut: string;
    nights: number;
    roomAllocations: RoomAllocation[];
    isActuallyDark: boolean;
    isSubagent: boolean;
    roomFilters: Record<string | number, string>;
    setRoomFilters: React.Dispatch<React.SetStateAction<Record<string | number, string>>>;
    selectedCancelPolicy: string;
    setSelectedCancelPolicy: (v: string) => void;
    setSelectedTimelineRoom: (room: any) => void;
    onClose: () => void;
    onReserve: (room: any, rIdx: number) => void;
    selectedRoomsMap?: Record<number, any>;
    selectionPendingHotelId?: string;
}

const CancellationFilterIcons: React.FC<{
    value: string;
    onChange: (v: string) => void;
    isActuallyDark: boolean;
}> = ({ value, onChange, isActuallyDark }) => (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        {[
            { key: 'free', label: 'BEZ TROŠKOVA', Icon: ShieldCheck, color: '#4cd964', bg: 'rgba(76,217,100,0.2)', border: '#4cd964' },
            { key: 'penalty', label: 'PENALI', Icon: AlertTriangle, color: '#f59e0b', bg: 'rgba(245,158,11,0.2)', border: '#f59e0b' },
            { key: 'non-refundable', label: '100% TROŠAK', Icon: XCircle, color: '#ef4444', bg: 'rgba(239,68,68,0.2)', border: '#ef4444' },
        ].map(({ key, label, Icon, color, bg, border }) => (
            <button
                key={key}
                onClick={() => onChange(value === key ? 'all' : key)}
                style={{
                    background: value === key ? bg : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${value === key ? border : 'rgba(255,255,255,0.1)'}`,
                    color: value === key ? color : (isActuallyDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)'),
                    padding: '8px 12px', borderRadius: '16px', cursor: 'pointer',
                    transition: 'all 0.2s', display: 'flex', alignItems: 'center',
                    gap: '6px', fontSize: '0.8rem', fontWeight: 700
                }}
            >
                <Icon size={16} /> <span>{label}</span>
            </button>
        ))}
    </div>
);

export const HotelDetailsModal: React.FC<HotelDetailsModalProps> = ({
    hotel, checkIn, checkOut, nights, roomAllocations,
    isActuallyDark, isSubagent, roomFilters, setRoomFilters,
    selectedCancelPolicy, setSelectedCancelPolicy,
    setSelectedTimelineRoom, onClose, onReserve,
    selectedRoomsMap = {}, selectionPendingHotelId
}) => {
    const getFinalDisplayPrice = (h: SmartSearchResult) => {
        let total = 0;
        if (h.allocationResults && Object.keys(h.allocationResults).length > 0) {
            Object.values(h.allocationResults).forEach((rooms: any) => {
                if (!rooms || rooms.length === 0) return;
                const minPrice = Math.min(...rooms.map((r: any) => r.price));
                total += isSubagent ? getPriceWithMargin(minPrice) : Number(minPrice);
            });
        } else {
            total = isSubagent ? getPriceWithMargin(hotel.price) : Number(hotel.price);
        }
        return total;
    };

    return createPortal(
        <div
            className="modern-calendar-overlay hotel-modal-overlay"
            onClick={onClose}
            style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                width: '100vw', height: '100vh',
                background: 'rgba(26, 43, 60, 0.95)',
                backdropFilter: 'blur(20px) saturate(180%)',
                WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                padding: '40px 20px', overflowY: 'auto', zIndex: 9999999
            }}
        >
            <div
                className="modern-calendar-popup wide hotel-details-wide animate-fade-in"
                onClick={e => e.stopPropagation()}
                style={{
                    margin: 'auto', maxHeight: '85vh', maxWidth: '1400px', width: '95%',
                    background: 'var(--bg-card)', border: 'var(--border-thin)',
                    borderRadius: '24px', overflow: 'hidden', display: 'flex', flexDirection: 'column'
                }}
            >
                {/* HEADER */}
                <div className="hotel-rooms-modal-header notepad-header-v6" style={{ padding: '30px 40px', background: 'var(--bg-card)', borderBottom: '1px solid rgba(255,255,255,0.1)', position: 'relative' }}>
                    <div className="modal-title-zone" style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap', marginBottom: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <h2 className="modal-hotel-title-premium-v6" style={{
                                    margin: 0, fontSize: '1.8rem', fontWeight: 900, letterSpacing: '-0.5px',
                                    color: isActuallyDark ? '#FFFFFF' : '#0e4b5e',
                                    WebkitTextFillColor: isActuallyDark ? '#FFFFFF' : '#0e4b5e',
                                    background: 'none', opacity: 1
                                }}>
                                    {hotel.name?.replace(/\s*\d+\s*\*+\s*$/, '').trim().toUpperCase()}
                                </h2>
                                <div style={{ display: 'flex', gap: '3px' }}>
                                    {Array(Math.max(0, Math.min(5, Math.floor(Number(hotel.stars || 0)) || 0))).fill(0).map((_, i) => <Star key={i} size={20} fill="#facc15" color="#facc15" />)}
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', opacity: 0.7, fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><MapPin size={16} /> {hotel.location}</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><CalendarDays size={16} /> {formatDate(checkIn)} - {formatDate(checkOut)} ({nights} noćenja)</div>
                        </div>
                    </div>
                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                        <div className="notepad-header-price">
                            <span className="price-val" style={{ fontSize: '2.2rem', fontWeight: 900, color: '#ce93d8', lineHeight: 1 }}>
                                od {formatPrice(getFinalDisplayPrice(hotel))} €
                            </span>
                            <span className="price-label" style={{ display: 'block', fontSize: '0.75rem', opacity: 0.5, fontWeight: 800, letterSpacing: '1px', marginTop: '4px' }}>
                                UKUPNA CENA ARANŽMANA ({roomAllocations.filter(a => a.adults > 0).length} {roomAllocations.filter(a => a.adults > 0).length === 1 ? 'SOBA' : 'SOBE'} / {roomAllocations.reduce((sum, a) => sum + a.adults + a.children, 0)} OSOBA)
                            </span>
                        </div>
                        {renderAvailabilityStatus(hotel.availability)}
                    </div>
                    <button
                        className="close-modal-btn"
                        onClick={onClose}
                        style={{ position: 'absolute', top: '20px', left: '20px', background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', padding: '10px', borderRadius: '50%', cursor: 'pointer', zIndex: 10 }}
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* BODY */}
                <div className="modal-body-v6" style={{ padding: '0', overflowY: 'auto', flex: 1 }}>
                    {roomAllocations.map((alloc, rIdx) => {
                        if (alloc.adults === 0) return null;
                        const rawRooms = (hotel.allocationResults && hotel.allocationResults[rIdx]) || [];
                        const currentFilter = (roomFilters[rIdx] || '').toLowerCase().trim();

                        const filteredRooms = rawRooms.filter((room: any) => {
                            if (selectedCancelPolicy !== 'all') {
                                const status = getRoomCancelStatus(room);
                                if (selectedCancelPolicy !== status) return false;
                            }
                            if (!currentFilter) return true;
                            const searchable = `${room.name} ${room.mealPlan || hotel.mealPlan}`.toLowerCase();
                            return currentFilter.split(/\s+/).every(t => searchable.includes(t));
                        });

                        return (
                            <div key={rIdx} className="room-allocation-section-v6">
                                <div className="notepad-sub-header-v6" style={{ padding: '1.5rem 2.5rem', background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.03)', display: 'flex', gap: '20px', alignItems: 'center', justifyContent: 'flex-start' }}>
                                    <div className="notepad-config-pill" style={{ flex: '0 0 auto' }}>
                                        {formatRoomConfigLabel(alloc, rIdx)}
                                    </div>
                                    <div style={{ flex: '1', maxWidth: '380px' }}>
                                        <input
                                            type="text"
                                            placeholder="🔍 Filtriraj tip sobe ili uslugu (npr. DBL All Inclusive)"
                                            value={roomFilters[rIdx] || ''}
                                            onChange={(e) => setRoomFilters(prev => ({ ...prev, [rIdx]: e.target.value }))}
                                            className="room-search-input"
                                            style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-primary)', padding: '8px 16px', borderRadius: '20px', fontSize: '0.8rem', outline: 'none', transition: 'all 0.3s' }}
                                        />
                                    </div>
                                    <div style={{ flex: '0 0 auto' }}>
                                        <CancellationFilterIcons
                                            value={selectedCancelPolicy}
                                            onChange={setSelectedCancelPolicy}
                                            isActuallyDark={isActuallyDark}
                                        />
                                    </div>
                                </div>

                                <div className="notepad-ledger-header">
                                    <div style={{ paddingLeft: '20px' }}>TIP SMEŠTAJA</div>
                                    <div style={{ textAlign: 'center' }}>USLUGA</div>
                                    <div style={{ textAlign: 'center' }}>STATUS</div>
                                    <div style={{ textAlign: 'center' }}>KAPACITET</div>
                                    <div style={{ textAlign: 'right', paddingRight: '20px' }}>CENA & AKCIJA</div>
                                </div>

                                <div className="notepad-room-list">
                                    {filteredRooms.length > 0 ? (
                                        filteredRooms.map((room: any, idx: number) => {
                                            const fullRoomName = room.name || 'Standardna Soba';
                                            const hyphenIndex = fullRoomName.indexOf(' - ');
                                            const roomTitle = hyphenIndex > -1 ? fullRoomName.substring(0, hyphenIndex) : fullRoomName;
                                            const occupancyTitle = hyphenIndex > -1 ? fullRoomName.substring(hyphenIndex) : '';

                                            return (
                                                <div key={`room-modal-${room.id}-${idx}`} className="notepad-ledger-row">
                                                    <div className="ledger-room-name" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                        <div style={{ fontWeight: 800 }}>{cleanRoomName(roomTitle)}</div>
                                                        {occupancyTitle && (
                                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', opacity: 0.9 }}>
                                                                {occupancyTitle}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="ledger-meal">{renderMealPlanBadge(room.mealPlan || hotel.mealPlan, true)}</div>
                                                    <div className="ledger-status" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '6px' }}>
                                                        {renderAvailabilityStatus(room.availability || hotel.availability)}
                                                        {renderCancellationBadge(room, setSelectedTimelineRoom)}
                                                    </div>
                                                    <div className="ledger-capacity">
                                                        <Users size={16} />
                                                        <span>{room.capacity || `${alloc.adults}+${alloc.children}`}</span>
                                                    </div>
                                                    <div className="ledger-action-zone">
                                                        <div className="ledger-price">
                                                            {formatPrice(isSubagent ? getPriceWithMargin(room.price) : Number(room.price))} <span className="curr">EUR</span>
                                                        </div>
                                                        {(() => {
                                                            const isAlreadySelected = selectionPendingHotelId === hotel.id && selectedRoomsMap[rIdx]?.id === room.id;
                                                            return (
                                                                <button
                                                                    className={`btn-ledger-reserve ${isStatusOnRequest(room.availability || hotel.availability) ? 'request-mode' : ''} ${isAlreadySelected ? 'selected-mode' : ''}`}
                                                                    onClick={() => onReserve(room, rIdx)}
                                                                    style={isAlreadySelected ? { background: '#22c55e', color: 'white', border: 'none' } : {}}
                                                                >
                                                                    {isAlreadySelected ? (
                                                                        <><ShieldCheck size={14} /> ODABRANO</>
                                                                    ) : (
                                                                        <>{isStatusOnRequest(room.availability || hotel.availability) ? 'POŠALJI UPIT' : 'REZERVIŠI'} <ArrowRight size={14} /></>
                                                                    )}
                                                                </button>
                                                            );
                                                        })()}
                                                    </div>
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)', opacity: 0.5 }}>
                                            {selectedCancelPolicy === 'free' ? 'Nema soba sa besplatnim otkazivanjem.'
                                                : selectedCancelPolicy === 'penalty' ? 'Nema soba sa delimičnim penalima.'
                                                    : selectedCancelPolicy === 'non-refundable' ? 'Nema soba sa 100% troškom otkaza.'
                                                        : 'Nema slobodnih soba za ovu konfiguraciju.'}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>,
        document.getElementById('portal-root') || document.body
    );
};

export default HotelDetailsModal;
