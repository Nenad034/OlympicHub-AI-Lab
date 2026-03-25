import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { 
    Star, MapPin, CalendarDays, Users, ShieldCheck, 
    AlertTriangle, XCircle, ArrowLeft, Loader2, ArrowRight,
    Wifi, Coffee, Car, Dumbbell, Martini, Utensils, Check
} from 'lucide-react';
import { useSearchStore } from './stores/useSearchStore';
import { useThemeStore } from '../../stores';
import { performSmartSearch, type SmartSearchResult } from '../../services/smartSearchService';
import { 
    formatPrice, normalizeMealPlan,
    formatRoomConfigLabel, getRoomCancelStatus 
} from '../SmartSearch/helpers';
import { 
    renderMealPlanBadge, renderCancellationBadge 
} from '../SmartSearch/renderHelpers';
import { formatDate } from '../../utils/dateUtils';
import { BookingModal } from '../../components/booking/BookingModal';
import type { BookingData } from '../../types/booking.types';
import './styles/PrimeSmartSearch.css';

// Reuse the icon filter component from modal
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
                    padding: '8px 16px', borderRadius: '30px', cursor: 'pointer',
                    transition: 'all 0.2s', display: 'flex', alignItems: 'center',
                    gap: '8px', fontSize: '0.85rem', fontWeight: 700
                }}
            >
                <Icon size={16} /> <span>{label}</span>
            </button>
        ))}
    </div>
);

const HotelDetailsPage: React.FC = () => {
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { theme } = useThemeStore();
    const isNavy = theme === 'navy';

    // State
    const [hotel, setHotel] = useState<SmartSearchResult | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [roomFilters, setRoomFilters] = useState<Record<string | number, string>>({});
    const [selectedCancelPolicy, setSelectedCancelPolicy] = useState('all');
    const [selectedRoomsMap, setSelectedRoomsMap] = useState<Record<number, any>>({});
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [pendingBookingData, setPendingBookingData] = useState<BookingData | null>(null);
    const lastFetchedId = useRef<string | null>(null);

    // Context from URL or Store
    const checkInStr = searchParams.get('checkIn') || '';
    const checkOutStr = searchParams.get('checkOut') || '';
    const checkIn = new Date(checkInStr);
    const checkOut = new Date(checkOutStr);
    const roomsParam = searchParams.get('rooms') || '2-0'; // e.g. 2-0;2-1-5
    
    // Split and parse rooms correctly
    const roomAllocations = useMemo(() => {
        return roomsParam.split(';').map(roomStr => {
            const parts = roomStr.split('-').map(p => parseInt(p, 10) || 0);
            return {
                adults: parts[0] || 2,
                children: parts[1] || 0,
                childrenAges: parts.slice(2)
            };
        });
    }, [roomsParam]);

    const calcNights = () => {
        if (!checkIn || !checkOut || isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) return 0;
        return Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
    };

    useEffect(() => {
        const fetchHotelDetails = async () => {
            if (!id || id === lastFetchedId.current) return;
            setLoading(true);
            lastFetchedId.current = id;
            try {
                const results = await performSmartSearch({
                    searchType: 'hotel',
                    destinations: [{ 
                        id: id, 
                        name: searchParams.get('hCity') || searchParams.get('hName') || '', 
                        type: 'hotel' 
                    }], 
                    checkIn: checkInStr,
                    checkOut: checkOutStr,
                    roomConfig: roomAllocations,
                    nationality: searchParams.get('nat') || 'RS',
                    enabledProviders: id?.startsWith('solvex') ? { solvex: true } : (id?.startsWith('filos') ? { filos: true } : undefined)
                });

                const found = results.find(r => r.id === id);
                if (found) {
                    setHotel(found);
                } else {
                    setError('Hotel nije pronađen ili više nije dostupan za izabrane datume.');
                }
            } catch (e) {
                console.error('Error fetching hotel details:', e);
                setError('Problem pri učitavanju detalja hotela.');
            } finally {
                setLoading(false);
            }
        };

        fetchHotelDetails();
    }, [id, checkInStr, checkOutStr, roomsParam]);

    const handleSelectRoom = (room: any, rIdx: number) => {
        setSelectedRoomsMap(prev => ({
            ...prev,
            [rIdx]: room
        }));
    };

    const handleBook = () => {
        if (!hotel) return;
        const allSelected = roomAllocations.every((_, idx) => !!selectedRoomsMap[idx]);
        if (!allSelected) {
            alert('Molimo odaberite sobu za svaki smeštajni kapacitet.');
            return;
        }

        const selectedRooms = Object.values(selectedRoomsMap);
        const data: BookingData = {
            serviceName: hotel.name,
            serviceType: 'hotel',
            hotelName: hotel.name,
            location: typeof hotel.location === 'string' ? hotel.location : `${hotel.location.city}, ${hotel.location.country}`,
            checkIn: checkInStr,
            checkOut: checkOutStr,
            nights: calcNights(),
            roomType: selectedRooms.map(r => r.name).join(', '),
            mealPlan: selectedRooms.map(r => r.mealPlan).join(', '),
            adults: roomAllocations.reduce((sum, a) => sum + a.adults, 0),
            children: roomAllocations.reduce((sum, a) => sum + a.children, 0),
            totalPrice: totalSelectedPrice,
            currency: hotel.currency || 'EUR',
            stars: hotel.stars,
            providerData: hotel.originalData,
            allSelectedRooms: selectedRooms,
            roomAllocations: roomAllocations
        };
        setPendingBookingData(data);
        setShowBookingModal(true);
    };

    const totalSelectedPrice = useMemo(() => {
        return Object.values(selectedRoomsMap).reduce((sum, r) => sum + (r.price || 0), 0);
    }, [selectedRoomsMap]);

    if (loading) {
        return (
            <div className={`v6-hotel-details-page ${isNavy ? 'v6-dark' : 'v6-light'}`}>
                <div className="v6-todo-state">
                    <Loader2 className="animate-spin" size={48} />
                    <p style={{ marginTop: '20px' }}>Učitavanje ponuda...</p>
                </div>
            </div>
        );
    }

    if (error || !hotel) {
        return (
            <div className={`v6-hotel-details-page ${isNavy ? 'v6-dark' : 'v6-light'}`}>
                <div className="v6-todo-state">
                    <XCircle size={48} color="#ef4444" />
                    <p style={{ marginTop: '20px' }}>{error || 'Hotel nije dostupan.'}</p>
                    <button onClick={() => navigate(-1)} className="v6-hero-btn" style={{ marginTop: '20px', color: '#0078d4' }}>
                         Nazad na pretragu
                    </button>
                </div>
            </div>
        );
    }

    const hotelImage = hotel.images?.[0] || (hotel as any).image;
    // Clean name from stars if it ends with digit* 
    const cleanHotelName = hotel.name.replace(/\s\d\*$/, '').trim();

    return (
        <div className={`v6-hotel-details-page ${isNavy ? 'v6-dark' : 'v6-light'}`}>
            {/* MICROSOFT TO DO HERO */}
            <header className="v6-details-hero">
                {hotelImage && <img src={hotelImage} alt="" className="v6-hero-img-bg" />}
                <div className="v6-hero-overlay" />
                
                <div className="v6-hero-actions">
                    <button className="v6-hero-btn" onClick={() => window.close()}>
                        <ArrowLeft size={16} /> Zatvori
                    </button>
                </div>

                <div className="v6-hero-content">
                    <h1 className="v6-hero-title">{cleanHotelName}</h1>
                    <div className="v6-hero-meta">
                        <div className="v6-meta-item">
                            <Star size={16} fill="#ffc107" color="#ffc107" />
                            <span>{hotel.stars}*</span>
                        </div>
                        <div className="v6-meta-item">
                            <MapPin size={16} />
                            <span>{typeof hotel.location === 'string' ? hotel.location : `${hotel.location.city}, ${hotel.location.country}`}</span>
                        </div>
                        <div className="v6-meta-item">
                            <CalendarDays size={16} />
                            <span>{formatDate(checkInStr)} - {formatDate(checkOutStr)} ({calcNights()} noći)</span>
                        </div>
                    </div>
                </div>
            </header>

            <div className="v6-details-container">
                <div style={{ marginTop: '32px' }}>
                    <div className="v6-section-title">
                        <div className="v6-section-icon"><Users size={14} /></div>
                        <h2>Izaberite smeštaj za svakog putnika</h2>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', overflowX: 'auto', padding: '4px' }}>
                         <CancellationFilterIcons value={selectedCancelPolicy} onChange={setSelectedCancelPolicy} isActuallyDark={isNavy} />
                    </div>

                    {roomAllocations.map((alloc, rIdx) => {
                        const availableRooms = hotel.allocationResults?.[rIdx] || [];
                        const filteredRooms = availableRooms.filter((r: any) => {
                            const searchTerm = (roomFilters[rIdx] || '').toLowerCase();
                            const matchesSearch = !searchTerm || r.name.toLowerCase().includes(searchTerm);
                            const status = getRoomCancelStatus(r);
                            const matchesPolicy = selectedCancelPolicy === 'all' || status === selectedCancelPolicy;
                            return !!(matchesSearch && matchesPolicy);
                        });

                        return (
                            <div key={rIdx} className="v6-allocation-group">
                                <div className="v6-allocation-header">
                                    <div className="v6-allocation-title">
                                        <ArrowRight size={16} className="v6-feature-icon" />
                                        <span>{formatRoomConfigLabel(alloc, rIdx)}</span>
                                    </div>
                                    <input 
                                        type="text" 
                                        placeholder="Pretraži sobe..."
                                        className="v6-allocation-search"
                                        value={roomFilters[rIdx] || ''}
                                        onChange={(e) => setRoomFilters(prev => ({ ...prev, [rIdx]: e.target.value }))}
                                    />
                                </div>

                                <div className="v6-task-list">
                                    {filteredRooms.length === 0 ? (
                                        <div className="v6-todo-state" style={{ height: '80px' }}>Trenutno nema slobodnih soba za ovaj filter.</div>
                                    ) : (
                                        filteredRooms.map((room, idx) => (
                                            <div 
                                                key={idx} 
                                                className={`v6-task-row ${selectedRoomsMap[rIdx]?.id === room.id ? 'v6-selected' : ''}`}
                                                onClick={() => handleSelectRoom(room, rIdx)}
                                            >
                                                <div className="v6-task-check">
                                                    {selectedRoomsMap[rIdx]?.id === room.id ? <Check size={14} strokeWidth={4} /> : null}
                                                </div>
                                                <div className="v6-task-info">
                                                    <span className="v6-task-name">{room.name}</span>
                                                    <div className="v6-task-sub">
                                                        {renderMealPlanBadge(room.mealPlan)}
                                                        {renderCancellationBadge(room, () => alert('Politika otkazivanja: Detalji su prikazani u koraku rezervacije.'))}
                                                    </div>
                                                </div>
                                                <div className="v6-task-pricing">
                                                    <div className="v6-task-price">{formatPrice(room.price)} <span className="v6-task-currency">€</span></div>
                                                    <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>Ukupna cena</span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* BOTTOM SUMMARY BAR */}
            <div className="v6-todo-bottom-bar">
                <div className="v6-total-left">
                    <span className="v6-total-label">UKUPAN IZNOS</span>
                    <span className="v6-total-value">{formatPrice(totalSelectedPrice)} €</span>
                </div>
                <button 
                    className="v6-book-btn"
                    disabled={Object.keys(selectedRoomsMap).length < roomAllocations.length}
                    onClick={handleBook}
                >
                    Rezerviši (Korak 2/2)
                </button>
            </div>

            {showBookingModal && pendingBookingData && (
                <BookingModal 
                    isOpen={showBookingModal}
                    onClose={() => setShowBookingModal(false)}
                    provider={hotel.provider.toLowerCase() as 'solvex' | 'tct' | 'opengreece'}
                    bookingData={pendingBookingData}
                    onSuccess={() => { alert('Uspešno rezervisano!'); setShowBookingModal(false); }}
                    onError={(err) => alert(`Greška: ${err}`)}
                />
            )}
        </div>
    );
};

export default HotelDetailsPage;
