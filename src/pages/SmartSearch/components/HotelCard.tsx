import React from 'react';
import { Star, MapPin, Calendar, Eye, CheckCircle, HelpCircle, XCircle, TrendingUp, CalendarDays, ArrowRight, Users } from 'lucide-react';
import { type SmartSearchResult } from '../../../services/smartSearchService';
import { getProxiedImageUrl } from '../../../utils/imageProxy';
import {
    formatPrice,
    getPriceWithMargin,
    isStatusOnRequest,
    formatRoomConfigLabel,
    cleanRoomName,
    normalizeMealPlan,
    getRoomCancelStatus
} from '../helpers';
import {
    renderAvailabilityStatus,
    renderCancellationBadge,
    renderMealPlanBadge
} from '../renderHelpers';

interface HotelCardProps {
    hotel: SmartSearchResult;
    isSubagent: boolean;
    onOpenDetails: (hotel: SmartSearchResult) => void;
    onReserve?: (room: any, roomIdx: number, hotel: SmartSearchResult) => void;
    viewMode: 'grid' | 'list' | 'notepad';
    checkIn?: string;
    checkOut?: string;
    nights?: number;
    roomAllocations?: any[];
    roomFilters?: Record<string, string>;
    setRoomFilters?: React.Dispatch<React.SetStateAction<Record<string, string>>>;
    selectedCancelPolicy?: string;
    setSelectedTimelineRoom?: (room: any) => void;
    selectedRoomsMap?: Record<number, any>;
    selectionPendingHotelId?: string;
    onlyRefundable?: boolean;
}

export const HotelCard: React.FC<HotelCardProps> = ({
    hotel, isSubagent, onOpenDetails, onReserve, viewMode, checkIn, checkOut, nights,
    roomAllocations = [], roomFilters = {}, setRoomFilters, selectedCancelPolicy = 'all',
    setSelectedTimelineRoom, selectedRoomsMap = {}, selectionPendingHotelId, onlyRefundable = false
}) => {
    // Pricing helper
    const getFinalPrice = (val: number) => isSubagent ? getPriceWithMargin(val) : Number(val);

    if (viewMode === 'notepad') {
        return (
            <div className="hotel-notepad-card-premium animate-fade-in" style={{ width: '100%', marginBottom: '30px' }}>
                {/* Header matching original notepad row */}
                <div className="notepad-header-v6">
                    <div className="notepad-title-stacked">
                        <div className="notepad-main-title" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <h3 onClick={() => onOpenDetails(hotel)} style={{ cursor: 'pointer', margin: 0 }}>{hotel.name?.replace(/\s*\d+\s*\*+\s*$/, '').trim()}</h3>
                            <div className="hotel-stars-badge-v6" style={{ display: 'flex', gap: '2px' }}>
                                {Array(Math.max(0, Math.min(5, Math.floor(Number(hotel.stars || 0)) || 0))).fill(0).map((_, i) => <Star key={i} size={14} fill="#facc15" color="#facc15" />)}
                            </div>
                        </div>
                        <div className="hotel-location-tag-v6">
                            <MapPin size={14} /> <span>{hotel.location}</span>
                            <span className="dot-separator">•</span>
                            <span>{hotel.mealPlan || 'Sve usluge'}</span>
                        </div>
                    </div>
                    <div className="notepad-header-price" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center' }}>
                        <span className="label">UKUPNA CENA OD</span>
                        <span className="val">{formatPrice(getFinalPrice(hotel.price))} EUR</span>
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginTop: '4px' }}>
                            # {roomAllocations.filter(r => r.adults > 0).length} {roomAllocations.filter(r => r.adults > 0).length === 1 ? 'soba' : 'sobe'}, {roomAllocations.reduce((sum, r) => sum + r.adults + r.children, 0)} osoba
                        </div>
                    </div>
                </div>

                {/* Configuration/Date segments for each room */}
                {roomAllocations.map((alloc, roomIdx) => {
                    if (alloc.adults === 0) return null;

                    const allRooms = (hotel.allocationResults && hotel.allocationResults[roomIdx] ? [...hotel.allocationResults[roomIdx]].sort((a, b) => (a.price || 0) - (b.price || 0)) : (hotel.rooms || []));

                    const currentTextFilter = (roomFilters[`${hotel.id}-${roomIdx}`] || '').toLowerCase().trim();
                    const filteredRooms = allRooms.filter(r => {
                        if (selectedCancelPolicy !== 'all') {
                            const status = getRoomCancelStatus(r);
                            if (selectedCancelPolicy === 'non-refundable' && status !== 'non-refundable') return false;
                            if (selectedCancelPolicy === 'free' && status !== 'free') return false;
                        }

                        if (onlyRefundable) {
                            if (getRoomCancelStatus(r) === 'non-refundable') return false;
                        }

                        if (!currentTextFilter) return true;
                        const searchableText = `${r.name} ${r.mealPlan || hotel.mealPlan}`.toLowerCase();
                        const terms = currentTextFilter.split(/\s+/);
                        return terms.every(t => searchableText.includes(t));
                    });

                    return (
                        <div key={`alloc-${roomIdx}`} className="notepad-allocation-segment">
                            <div className="notepad-sub-header-v6">
                                <div className="notepad-date-info">
                                    <CalendarDays size={18} />
                                    <span>{checkIn ? new Date(checkIn).toLocaleDateString('sr-RS', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-'}</span>
                                    <ArrowRight size={14} style={{ opacity: 0.5 }} />
                                    <span>{checkOut ? new Date(checkOut).toLocaleDateString('sr-RS', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-'}</span>
                                    <span className="nights-badge">{nights} noćenja</span>
                                </div>

                                <div className="notepad-config-actions" style={{ display: 'flex', gap: '15px', alignItems: 'center', flex: 1, justifyContent: 'flex-end' }}>
                                    <div style={{ maxWidth: '380px', flex: '0 1 380px' }}>
                                        <input
                                            type="text"
                                            placeholder="🔍 Filtriraj tip sobe ili uslugu (npr. DBL All Inclusive)"
                                            value={roomFilters[`${hotel.id}-${roomIdx}`] || ''}
                                            onChange={(e) => setRoomFilters && setRoomFilters(prev => ({ ...prev, [`${hotel.id}-${roomIdx}`]: e.target.value }))}
                                            style={{
                                                width: '100%',
                                                background: 'rgba(255,255,255,0.05)',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                                color: 'var(--text-primary)',
                                                padding: '8px 16px',
                                                borderRadius: '20px',
                                                fontSize: '0.8rem',
                                                outline: 'none',
                                                transition: 'all 0.3s'
                                            }}
                                            className="room-search-input"
                                        />
                                    </div>
                                    <div className="notepad-config-pill">
                                        {formatRoomConfigLabel(alloc, roomIdx)}
                                    </div>
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
                                    filteredRooms.map((room, rIdx) => {
                                        const fullRoomName = room.name || 'Standardna Soba';
                                        const hyphenIndex = fullRoomName.indexOf(' - ');
                                        const roomTitle = hyphenIndex > -1 ? fullRoomName.substring(0, hyphenIndex) : fullRoomName;
                                        const occupancyTitle = hyphenIndex > -1 ? fullRoomName.substring(hyphenIndex) : '';

                                        return (
                                            <div key={`room-${room.id}-${rIdx}`} className="notepad-ledger-row">
                                                <div className="ledger-room-name" style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                    <div style={{ fontWeight: 800 }}>{cleanRoomName(roomTitle)}</div>
                                                    {occupancyTitle && (
                                                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', opacity: 0.9 }}>
                                                            {occupancyTitle}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="ledger-meal">
                                                    {renderMealPlanBadge(room.mealPlan || hotel.mealPlan || '', true)}
                                                </div>
                                                <div className="ledger-status" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '6px' }}>
                                                    {renderAvailabilityStatus(room.availability || hotel.availability)}
                                                    {setSelectedTimelineRoom && renderCancellationBadge(room, setSelectedTimelineRoom)}
                                                </div>
                                                <div className="ledger-capacity">
                                                    <Users size={16} />
                                                    <span>{room.capacity || `${alloc.adults}+${alloc.children}`}</span>
                                                </div>
                                                <div className="ledger-action-zone">
                                                    <div className="ledger-price">
                                                        {formatPrice(getFinalPrice(room.price))} <span className="curr">EUR</span>
                                                    </div>
                                                    {(() => {
                                                        const isAlreadySelected = selectionPendingHotelId === hotel.id && selectedRoomsMap[roomIdx]?.id === room.id;
                                                        return (
                                                            <button
                                                                className={`btn-ledger-reserve ${isStatusOnRequest(room.availability || hotel.availability) ? 'request-mode' : ''} ${isAlreadySelected ? 'selected-mode' : ''}`}
                                                                onClick={() => onReserve && onReserve(room, roomIdx, hotel)}
                                                                style={isAlreadySelected ? { background: '#22c55e', color: 'white', border: 'none' } : {}}
                                                            >
                                                                {isAlreadySelected ? (
                                                                    <><CheckCircle size={14} /> ODABRANO</>
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
                                        Nema dostupnih soba za izabranu uslugu.
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    }

    // Izdvojeni meal plans bedževi za višekratnu upotrebu
    const mealPlansRender = Array.from(new Set(hotel.mealPlans?.length ? hotel.mealPlans.map(m => normalizeMealPlan(m)) : [normalizeMealPlan(hotel.mealPlan || '')])).map((normCode, mIdx) => {
        const originalName = (hotel.mealPlans?.length ? hotel.mealPlans : [hotel.mealPlan || '']).find(m => normalizeMealPlan(m) === normCode) || normCode;
        const badge = renderMealPlanBadge(originalName);
        return React.cloneElement(badge as React.ReactElement<any>, {
            key: mIdx,
            style: { position: 'relative', top: 'auto', left: 'auto', margin: 0 }
        });
    });

    // Grid/List (Unified View)
    return (
        <div className={`hotel-result-card-premium unified ${hotel.provider?.toLowerCase().replace(/\s+/g, '')} ${viewMode === 'list' ? 'horizontal' : ''}`}>
            <div className="hotel-card-image" onClick={() => onOpenDetails(hotel)} style={{ position: 'relative' }}>
                <img
                    src={getProxiedImageUrl(hotel.images?.[0] || '')}
                    alt={hotel.name}
                    onError={(e) => { (e.target as any).src = 'https://images.unsplash.com/photo-1566073771259-6a8506099945'; }}
                />
                {viewMode !== 'list' && (
                    <div className="hotel-meal-plans-container" style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', flexDirection: 'column', gap: '6px', zIndex: 10 }}>
                        {mealPlansRender}
                    </div>
                )}
            </div>

            <div className="hotel-card-content">
                <div className="hotel-info-text">
                    <div className="hotel-title-row" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div className="hotel-stars-row" style={{ display: 'flex', gap: '2px', marginBottom: '2px' }}>
                            {Array(Math.max(0, Math.min(5, Math.floor(Number(hotel.stars || 0)) || 0))).fill(0).map((_, i) => <Star key={i} size={14} fill="#facc15" color="#facc15" />)}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                            <h3 style={{ margin: 0, fontSize: viewMode === 'grid' ? '1.25rem' : '1.15rem', fontWeight: 800 }}>{hotel.name?.replace(/\s*\d+\s*\*+\s*$/, '').trim()}</h3>
                            {(hotel.salesCount || 0) > 5 && (
                                <span className="best-seller-premium-badge" style={{ padding: '2px 8px', borderRadius: '4px', background: '#facc15', color: '#000', fontSize: '0.65rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <TrendingUp size={10} /> BEST SELLER
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="hotel-location-tag" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        <MapPin size={14} /> <span>{hotel.location}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                        <div className="hotel-date-badge" style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '8px', fontSize: '0.8rem' }}>
                            <CalendarDays size={14} />
                            <span>
                                {checkIn ? new Date(checkIn).toLocaleDateString('sr-RS', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-'} - {checkOut ? new Date(checkOut).toLocaleDateString('sr-RS', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '-'} ({nights} n.)
                            </span>
                        </div>

                        {viewMode === 'list' && (
                            <div className="hotel-meal-plans-inline" style={{ display: 'flex', gap: '4px' }}>
                                {mealPlansRender}
                            </div>
                        )}
                    </div>

                    <div style={{ marginTop: '10px' }}>
                        {renderAvailabilityStatus(hotel.availability)}
                    </div>
                </div>
            </div>

            <div className="price-action-section">
                <div className="lowest-price-tag">
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 700, textTransform: 'uppercase' }}>Ukupna cena od</div>
                    <span className="price-val" style={{ color: viewMode === 'grid' ? '#8E24AC' : undefined }}>{formatPrice(getFinalPrice(hotel.price))} €</span>
                    <div className="capacity-label" style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)', marginTop: '2px' }}>
                        # {roomAllocations.filter(r => r.adults > 0).length} {roomAllocations.filter(r => r.adults > 0).length === 1 ? 'soba' : 'sobe'}, {roomAllocations.reduce((sum, r) => sum + r.adults + r.children, 0)} osoba
                    </div>
                </div>
                <button
                    className="view-more-btn"
                    onClick={() => onOpenDetails(hotel)}
                >
                    {viewMode === 'grid' ? 'DETALJI...' : 'Detalji...'} <ArrowRight size={viewMode === 'grid' ? 18 : 16} />
                </button>
            </div>
        </div>
    );
};

export default HotelCard;
