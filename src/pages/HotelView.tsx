import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    MapPin, Star, Wifi, Coffee, Wind, Utensils,
    ChevronLeft, ChevronRight, Share2, Heart,
    ShieldCheck, Calendar, Users, Info, Sparkles,
    CheckCircle2, Camera, Map as MapIcon, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ModernCalendar } from '../components/ModernCalendar';
import { BookingModal } from '../components/booking/BookingModal';
import { useThemeStore } from '../stores';
import type { BookingData } from '../types/booking.types';
import './HotelView.css';
import '../components/booking/BookingModal.css'; // Reuse some table styles

interface RoomAllocation {
    adults: number;
    children: number;
    childrenAges: number[];
}

const MEAL_PLAN_NAMES: Record<string, string> = {
    'RO': 'Najam (RO) - Samo Smeštaj',
    'BB': 'Noćenje sa doručkom (BB)',
    'HB': 'Polupansion (HB)',
    'FB': 'Pun pansion (FB)',
    'AI': 'All Inclusive (AI)',
    'UAI': 'Ultra All Inclusive (UAI)'
};

const getMealPlanDisplayName = (code: string): string => {
    return MEAL_PLAN_NAMES[code] || code;
};

const getAdultsText = (count: number): string => {
    const map: Record<number, string> = {
        1: 'JEDNA ODRASLA OSOBA',
        2: 'DVE ODRASLE OSOBE',
        3: 'TRI ODRASLE OSOBE',
        4: 'ČETIRI ODRASLE OSOBE'
    };
    return map[count] || `${count} ODRASLIH OSOBA`;
};

const getChildrenText = (ages: number[]): string => {
    if (!ages || ages.length === 0) return '';
    if (ages.length === 1) return ` + DETE ${ages[0]} GODINA`;
    return ` + DECA (${ages.join(', ')} GODINA)`;
};

const HotelView: React.FC = () => {
    const { hotelId } = useParams<{ hotelId: string }>();
    const navigate = useNavigate();
    const { navMode, setNavMode } = useThemeStore();
    const [originalNavMode] = useState(navMode);

    useEffect(() => {
        // Force horizontal nav on this page
        setNavMode('horizontal');

        // Add class to body to override global layout padding/background
        document.body.classList.add('is-hotel-details-page');

        return () => {
            setNavMode(originalNavMode);
            document.body.classList.remove('is-hotel-details-page');
        };
    }, []);

    const [activeImage, setActiveImage] = useState(0);
    const [isGalleryOpen, setIsGalleryOpen] = useState(false);

    const [checkIn, setCheckIn] = useState<Date>(new Date(2026, 5, 14));
    const [checkOut, setCheckOut] = useState<Date>(new Date(2026, 5, 21));
    const [roomAllocations, setRoomAllocations] = useState<RoomAllocation[]>([
        { adults: 2, children: 0, childrenAges: [] }
    ]);
    const [selectedMealPlans, setSelectedMealPlans] = useState<string[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [activeCalendar, setActiveCalendar] = useState<'in' | 'out' | null>(null);
    const [showGuestSelector, setShowGuestSelector] = useState(false);
    const [activeRoomTab, setActiveRoomTab] = useState(0);

    // Booking Modal State
    const [bookingModalOpen, setBookingModalOpen] = useState(false);
    const [selectedBookingData, setSelectedBookingData] = useState<BookingData | null>(null);

    // Light mode detection (can be toggled or read from store)
    // For now we will assume it's part of the global class, but we can have local toggle
    // const { isLightMode } = useTheme(); 

    // Simulated Hotel Data
    const hotel = {
        name: "Galeon Residence & SPA",
        location: "Sunny Beach, Bulgaria",
        address: "Sunny Beach South, 8240 Sunny Beach",
        stars: 5,
        rating: 4.8,
        reviews: 1250,
        description: "Galeon Residence & SPA nudi vrhunski doživljaj na samoj obali Crnog mora. Hotel se odlikuje modernom arhitekturom, luksuznim spa centrom i bazenima koji oduzimaju dah. Svaka soba je dizajnirana da pruži maksimalnu udobnost uz panoramski pogled na more ili prelepo uređene vrtove.",
        images: [
            "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=1200",
            "https://images.unsplash.com/photo-1571896349842-33c89424de2d?auto=format&fit=crop&q=80&w=1200",
            "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=1200",
            "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&q=80&w=1200",
            "https://images.unsplash.com/photo-1584132967334-10e028bd69f7?auto=format&fit=crop&q=80&w=1200",
            "https://images.unsplash.com/photo-1551882547-ff43c63efece?auto=format&fit=crop&q=80&w=1200"
        ],
        rooms: [
            { id: 1, name: "Standard Room Park View", meal: "BB", capacity: "2+1", price: 890 },
            { id: 2, name: "Studio Deluxe", meal: "BB", capacity: "2+2", price: 1045 },
            { id: 3, name: "One Bedroom Apartment", meal: "BB", capacity: "2+2", price: 1260 },
            { id: 4, name: "Two Bedroom Suite", meal: "BB", capacity: "4+2", price: 1850 },
            { id: 5, name: "Standard Room Park View", meal: "HB", capacity: "2+1", price: 980 },
            { id: 6, name: "Studio Deluxe", meal: "HB", capacity: "2+2", price: 1150 }
        ],
        amenities: [
            { icon: <Wifi size={18} />, label: "Besplatan Wi-Fi" },
            { icon: <Coffee size={18} />, label: "Doručak uključen" },
            { icon: <Wind size={18} />, label: "Klima uređaj" },
            { icon: <Utensils size={18} />, label: "Restoran" },
            { icon: <Sparkles size={18} />, label: "Spa & Wellness" },
            { icon: <CheckCircle2 size={18} />, label: "Privatna plaža" }
        ],
        price: 963,
        currency: "€",
        tags: ["Premium Choice", "Best Seller", "Spa & Wellness"]
    };

    // Dynamically derive available meal plans from the room list (Solvex API Logic)
    const availableMealPlans = Array.from(new Set(hotel.rooms.map(r => r.meal)));

    const toggleMealPlan = (code: string) => {
        setSelectedMealPlans(prev =>
            prev.includes(code)
                ? prev.filter(c => c !== code)
                : [...prev, code]
        );
    };

    const handleSearch = () => {
        setIsSearching(true);
        setTimeout(() => setIsSearching(false), 800);
    };

    const formatDateStr = (date: Date) => {
        return date.toLocaleDateString('sr-RS', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const nextImage = () => setActiveImage((prev) => (prev + 1) % hotel.images.length);
    const prevImage = () => setActiveImage((prev) => (prev - 1 + hotel.images.length) % hotel.images.length);

    const openBookingModal = (room: any) => {
        const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
        const totalPax = roomAllocations.reduce((acc, r) => acc + r.adults + r.children, 0);

        const data: BookingData = {
            hotelName: hotel.name,
            location: hotel.location,
            stars: hotel.stars,
            roomType: room.name,
            mealPlan: getMealPlanDisplayName(room.meal),
            checkIn: formatDateStr(checkIn),
            checkOut: formatDateStr(checkOut),
            nights: nights,
            adults: roomAllocations.reduce((acc, r) => acc + r.adults, 0),
            children: roomAllocations.reduce((acc, r) => acc + r.children, 0),
            totalPrice: room.price,
            currency: hotel.currency,
            providerData: { hotelId: hotelId, roomId: room.id }
        };

        setSelectedBookingData(data);
        setBookingModalOpen(true);
    };

    return (
        <div className="hotel-view-master">
            <div className="hv-container">
                {/* 1. Symmetric Gallery Grid */}
                <div className="hv-gallery-symmetric">
                    <div className="hv-main-photo" onClick={() => setIsGalleryOpen(true)}>
                        <img src={hotel.images[0]} alt={hotel.name} />
                        <div className="hv-photo-overlay">
                            <Camera size={20} />
                            <span>Sve fotografije</span>
                        </div>
                    </div>
                    <div className="hv-side-grid">
                        {hotel.images.slice(1, 5).map((img, i) => (
                            <div key={i} className="hv-side-img" onClick={() => { setActiveImage(i + 1); setIsGalleryOpen(true); }}>
                                <img src={img} alt={`${hotel.name} ${i + 2}`} />
                            </div>
                        ))}
                    </div>
                </div>

                {/* 2. Header Status Bar */}
                <div className="hv-utility-bar">
                    <button onClick={() => navigate(-1)} className="hv-back-link">
                        <ChevronLeft size={16} /> Povratak na rezultate
                    </button>
                    <div className="hv-utility-actions">
                        <button className="hv-util-btn"><Share2 size={16} /> Podeli</button>
                        <button className="hv-util-btn"><Heart size={16} /> Sačuvaj</button>
                    </div>
                </div>

                {/* 3. Header Info Section - Premium Stack */}
                <div className="hv-header-section-premium">
                    <div className="hv-tags-row">
                        {hotel.tags.map(t => <span key={t} className="hv-tag-premium">{t}</span>)}
                    </div>

                    <div className="hv-main-title-stack">
                        <h1>{hotel.name}</h1>

                        <div className="hv-stars-under">
                            {[...Array(hotel.stars)].map((_, i) => <Star key={i} size={20} fill="#FFD700" color="#FFD700" />)}
                        </div>

                        <div className="hv-rating-reviews-row">
                            <div className="hv-rating-pill">
                                <strong>{hotel.rating}</strong>
                                <span>Odličan</span>
                            </div>
                            <span className="hv-reviews-count">({hotel.reviews} recenzija)</span>
                        </div>

                        <div className="hv-location-info-row">
                            <MapPin size={16} />
                            <span>{hotel.address}</span>
                        </div>
                    </div>
                </div>

                {/* 4. Horizontal Search Bar */}
                <div className="hv-horizontal-search-section">
                    <div className="hv-search-bar-unified">
                        <div className="hv-search-field clickable" onClick={() => setActiveCalendar('in')}>
                            <Calendar size={18} />
                            <div className="hv-field-content">
                                <label>Datum putovanja</label>
                                <span>{formatDateStr(checkIn)} - {formatDateStr(checkOut)}</span>
                            </div>
                        </div>

                        <div className="hv-search-field clickable" onClick={() => setShowGuestSelector(!showGuestSelector)}>
                            <Users size={18} />
                            <div className="hv-field-content">
                                <label>Sobe i Putnici</label>
                                <span>
                                    {roomAllocations.length} {roomAllocations.length >= 2 && roomAllocations.length <= 4 ? 'Sobe' : 'Soba'} · {roomAllocations.reduce((acc, r) => acc + r.adults + r.children, 0)} {roomAllocations.reduce((acc, r) => acc + r.adults + r.children, 0) === 1 ? 'Putnik' : 'Putnika'}
                                </span>
                            </div>
                            <ChevronDown size={14} className={`hv-chevron ${showGuestSelector ? 'open' : ''}`} />

                            <AnimatePresence>
                                {showGuestSelector && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        className="hv-guest-selector-popover"
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <div className="hv-room-tabs-mini">
                                            {roomAllocations.map((_, idx) => (
                                                <button
                                                    key={idx}
                                                    className={`hv-room-tab-btn ${activeRoomTab === idx ? 'active' : ''}`}
                                                    onClick={() => {
                                                        if (activeRoomTab === idx && idx > 0) {
                                                            // Remove room
                                                            const newRooms = roomAllocations.filter((_, i) => i !== idx);
                                                            setRoomAllocations(newRooms);
                                                            setActiveRoomTab(0);
                                                        } else {
                                                            setActiveRoomTab(idx);
                                                        }
                                                    }}
                                                >
                                                    Soba {idx + 1}
                                                </button>
                                            ))}
                                            {roomAllocations.length < 5 && (
                                                <button className="hv-add-room-btn-premium" onClick={() => {
                                                    const newRooms = [...roomAllocations, { adults: 2, children: 0, childrenAges: [] }];
                                                    setRoomAllocations(newRooms);
                                                    setActiveRoomTab(newRooms.length - 1);
                                                }}>
                                                    Dodaj sobu
                                                </button>
                                            )}
                                        </div>

                                        <div className="hv-room-config-panel">
                                            <div className="hv-config-row">
                                                <div className="hv-config-label"><strong>Odrasli</strong></div>
                                                <div className="hv-config-controls-modern">
                                                    <button className="btn-counter" onClick={() => {
                                                        const newRooms = [...roomAllocations];
                                                        newRooms[activeRoomTab].adults = Math.max(1, newRooms[activeRoomTab].adults - 1);
                                                        setRoomAllocations(newRooms);
                                                    }}>−</button>
                                                    <span className="count-val">{roomAllocations[activeRoomTab].adults}</span>
                                                    <button className="btn-counter" onClick={() => {
                                                        const newRooms = [...roomAllocations];
                                                        newRooms[activeRoomTab].adults += 1;
                                                        setRoomAllocations(newRooms);
                                                    }}>+</button>
                                                </div>
                                            </div>
                                            <div className="hv-config-row">
                                                <div className="hv-config-label"><strong>Deca</strong></div>
                                                <div className="hv-config-controls-modern">
                                                    <button className="btn-counter" onClick={() => {
                                                        const newRooms = [...roomAllocations];
                                                        if (newRooms[activeRoomTab].children > 0) {
                                                            newRooms[activeRoomTab].children -= 1;
                                                            newRooms[activeRoomTab].childrenAges.pop();
                                                            setRoomAllocations(newRooms);
                                                        }
                                                    }}>−</button>
                                                    <span className="count-val">{roomAllocations[activeRoomTab].children}</span>
                                                    <button className="btn-counter" onClick={() => {
                                                        if (roomAllocations[activeRoomTab].children < 4) {
                                                            const newRooms = [...roomAllocations];
                                                            newRooms[activeRoomTab].children += 1;
                                                            newRooms[activeRoomTab].childrenAges.push(7);
                                                            setRoomAllocations(newRooms);
                                                        }
                                                    }}>+</button>
                                                </div>
                                            </div>

                                            {roomAllocations[activeRoomTab].childrenAges.length > 0 && (
                                                <div className="hv-age-inputs-grid">
                                                    {roomAllocations[activeRoomTab].childrenAges.map((age, cIdx) => (
                                                        <div key={cIdx} className="hv-age-input-box">
                                                            <label>Dete {cIdx + 1}</label>
                                                            <div className="hv-custom-select-wrapper">
                                                                <select
                                                                    value={age}
                                                                    onChange={(e) => {
                                                                        const newRooms = [...roomAllocations];
                                                                        newRooms[activeRoomTab].childrenAges[cIdx] = parseInt(e.target.value);
                                                                        setRoomAllocations(newRooms);
                                                                    }}
                                                                >
                                                                    {[...Array(18)].map((_, i) => <option key={i} value={i}>{i} god.</option>)}
                                                                </select>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <div className="hv-popover-footer">
                                            <button className="hv-btn-done-primary" onClick={() => setShowGuestSelector(false)}>Gotovo</button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="hv-search-field-service-modern">
                            <div className="hv-field-content">
                                <label>Usluga</label>
                                <div className="hv-meal-chips-container centered">
                                    {availableMealPlans.map(mp => (
                                        <button
                                            key={mp}
                                            className={`hv-meal-chip ${selectedMealPlans.includes(mp) ? 'active' : ''}`}
                                            onClick={() => toggleMealPlan(mp)}
                                        >
                                            {mp} - {MEAL_PLAN_NAMES[mp]?.split('(')[0].trim() || mp}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <button className="hv-search-btn-unified-equal" onClick={handleSearch} disabled={isSearching}>
                            {isSearching ? <Sparkles size={18} className="animate-spin" /> : 'Click'}
                        </button>
                    </div>
                </div>

                {/* 5. Rooms Table */}
                <div className="hv-full-width-section">
                    <div className="hv-rooms-container-full">
                        {isSearching ? (
                            <div className="hv-rooms-loading">
                                <Sparkles className="animate-pulse" size={40} />
                                <p>Tražimo ponude...</p>
                            </div>
                        ) : (
                            <div className="hv-all-results-container">
                                {roomAllocations.map((alloc, idx) => (
                                    <div key={idx} className="hv-room-result-group">
                                        <div className="hv-offer-banner">
                                            PONUDA ZA SOBU {idx + 1} - {getAdultsText(alloc.adults)}{getChildrenText(alloc.childrenAges)}
                                        </div>

                                        <div className="hv-rooms-table-full">
                                            <div className="hv-table-header-full">
                                                <div className="col-room">TIP SMEŠTAJA</div>
                                                <div className="col-meal">USLUGA</div>
                                                <div className="col-cap">KAPACITET</div>
                                                <div className="col-price">CENA</div>
                                                <div className="col-action">AKCIJA</div>
                                            </div>
                                            {hotel.rooms
                                                .filter(r => selectedMealPlans.length === 0 || selectedMealPlans.includes(r.meal))
                                                .map(room => {
                                                    const finalPrice = Math.round(room.price * (alloc.adults + alloc.children * 0.5));
                                                    return (
                                                        <div key={room.id} className="hv-room-row-full">
                                                            <div className="col-room">
                                                                <strong className="hv-room-name-title">{room.name}</strong>
                                                            </div>
                                                            <div className="col-meal">
                                                                <span className="hv-meal-badge">{getMealPlanDisplayName(room.meal)}</span>
                                                            </div>
                                                            <div className="col-cap">
                                                                <Users size={16} /> <span>{room.capacity}</span>
                                                            </div>
                                                            <div className="col-price">
                                                                <span className="hv-room-price">{finalPrice}{hotel.currency}</span>
                                                            </div>
                                                            <div className="col-action">
                                                                <button className="hv-room-book-btn-premium" onClick={() => openBookingModal({ ...room, price: finalPrice })}>Rezerviši odmah</button>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* 6. Details & Amenities */}
                <div className="hv-details-premium-stack">
                    <div className="hv-about-premium-box">
                        <div className="hv-section-label-premium">
                            <Info size={24} />
                            <h3>O hotelu</h3>
                        </div>
                        <div className="hv-description-premium-text">
                            <p>{hotel.description}</p>
                        </div>
                    </div>
                    <div className="hv-amenities-premium-box">
                        <div className="hv-section-label-premium">
                            <Sparkles size={24} />
                            <h3>Sadržaji</h3>
                        </div>
                        <div className="hv-amenities-modern-grid">
                            {hotel.amenities.map((a, i) => (
                                <div key={i} className="hv-amenity-item-premium">
                                    <span className="hv-am-label-text">{a.label}</span>
                                    <div className="hv-am-icon-below">{a.icon}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 7. Map Section */}
                <div className="hv-map-section">
                    <div className="hv-section-header">
                        <MapIcon size={20} />
                        <h3>Lokacija</h3>
                    </div>
                    <div className="hv-map-canvas">
                        <iframe
                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2938.647754602283!2d27.70882377651!3d42.668852315545236!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x40a694f576e27171%3A0x603f07a7e3d8f8d!2sGaleon%20Residence%20%26%20SPA!5e0!3m2!1sen!2srs!4v1706800000000!5m2!1sen!2srs"
                            width="100%" height="450" style={{ border: 0, borderRadius: '24px' }} allowFullScreen loading="lazy"
                        ></iframe>
                    </div>
                </div>
            </div>

            {/* Overlays */}
            <AnimatePresence>
                {isGalleryOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="hv-full-gallery">
                        <button className="hv-gallery-close" onClick={() => setIsGalleryOpen(false)}>Zatvori</button>
                        <div className="hv-gallery-main">
                            <button className="hv-gal-nav prev" onClick={prevImage}><ChevronLeft size={48} /></button>
                            <img src={hotel.images[activeImage]} alt="Gallery" />
                            <button className="hv-gal-nav next" onClick={nextImage}><ChevronRight size={48} /></button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {activeCalendar && (
                <ModernCalendar
                    startDate={checkIn.toISOString().split('T')[0]}
                    endDate={checkOut.toISOString().split('T')[0]}
                    onChange={(s, e) => {
                        if (s) setCheckIn(new Date(s));
                        if (e) { setCheckOut(new Date(e)); setActiveCalendar(null); handleSearch(); }
                    }}
                    onClose={() => setActiveCalendar(null)}
                />
            )}

            {selectedBookingData && (
                <BookingModal
                    isOpen={bookingModalOpen}
                    onClose={() => setBookingModalOpen(false)}
                    provider="solvex"
                    bookingData={selectedBookingData}
                    onSuccess={() => setBookingModalOpen(false)}
                    onError={(err) => alert(err)}
                />
            )}
        </div>
    );
};

export default HotelView;
