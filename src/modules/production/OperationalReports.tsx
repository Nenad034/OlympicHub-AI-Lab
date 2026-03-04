import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calendar as CalendarIcon,
    BarChart3,
    Users,
    ChevronLeft,
    ChevronRight,
    Search,
    Download,
    Mail,
    Filter,
    ArrowUpRight,
    Users2,
    Baby,
    Moon,
    TrendingUp,
    CheckCircle2,
    Clock,
    X,
    Building2,
    Activity,
    ExternalLink,
    Plus,
    Check,
    ChevronDown,
    MapPin,
    Tag,
    ChevronUp,
    AlertTriangle,
    MailCheck,
    Send,
    PieChart,
    Sparkles,
    CheckCircle,
    Eye
} from 'lucide-react';
import { useNavigate, NavLink, useSearchParams } from 'react-router-dom';
import './OperationalReports.css';

// --- TYPES ---
interface CapacityRecord {
    date: string;
    all: number;
    sold: number;
    status: 'Alotman' | 'Fix' | 'On Request' | 'Stop';
}

interface RoomCapacity {
    hotelId: string;
    hotelName: string;
    roomType: string;
    records: Record<string, CapacityRecord>;
}

// --- MOCK DATA ---
const MOCK_HOTELS = [
    { id: '50', name: 'Hotel Hunguest Sun Resort', destination: 'Herceg Novi', category: '4*', roomTypes: ['Double Room', 'Suite', 'Apartment'] },
    { id: '62', name: 'Mitsis Grand Hotel', destination: 'Rhodes', category: '5*', roomTypes: ['Standard Sea View', 'Family Room', 'Executive Suite'] },
    { id: '75', name: 'Rixos Premium Belek', destination: 'Belek', category: '5*', roomTypes: ['Deluxe Room', 'Pool Suite', 'Royal King Suite'] },
    { id: '80', name: 'Hotel Splendid', destination: 'Budva', category: '5*', roomTypes: ['Superior Room', 'Premium Suite'] },
    { id: '81', name: 'Hotel Budva', destination: 'Budva', category: '4*', roomTypes: ['Standard Room', 'Studio'] },
];

const DESTINATIONS = ['Sve', 'Budva', 'Herceg Novi', 'Rhodes', 'Belek'];
const CATEGORIES = ['Sve', '5*', '4*', '3*'];

const MOCK_RESERVATIONS = [
    { id: 'R-9452', customer: 'Jovan Jovanović', hotelId: '50', roomType: 'Double Room', checkIn: '2026-06-20', checkOut: '2026-06-30', adults: 2, children: 1, babies: 0, amount: 1250, createdAt: '2026-03-01', status: 'Active' },
    { id: 'R-9451', customer: 'Marko Marković', hotelId: '62', roomType: 'Standard Sea View', checkIn: '2026-06-21', checkOut: '2026-06-28', adults: 2, children: 0, babies: 1, amount: 850, createdAt: '2026-03-02', status: 'Active' },
    { id: 'R-9450', customer: 'Ana Anić', hotelId: '50', roomType: 'Suite', checkIn: '2026-06-20', checkOut: '2026-06-27', adults: 2, children: 2, babies: 0, amount: 2100, createdAt: '2026-03-03', status: 'Reservation' },
    { id: 'R-9460', customer: 'Petar Petrović', hotelId: '50', roomType: 'Apartment', checkIn: '2026-06-18', checkOut: '2026-06-25', adults: 4, children: 0, babies: 0, amount: 3200, createdAt: '2026-03-04', status: 'Active' },
    { id: 'R-9461', customer: 'Milica Milić', hotelId: '50', roomType: 'Double Room', checkIn: '2026-06-15', checkOut: '2026-06-18', adults: 2, children: 0, babies: 0, amount: 900, createdAt: '2026-03-05', status: 'Reservation' },
    { id: 'R-9462', customer: 'Dragan Dragić', hotelId: '50', roomType: 'Suite', checkIn: '2026-06-18', checkOut: '2026-06-28', adults: 2, children: 1, babies: 1, amount: 2400, createdAt: '2026-03-06', status: 'Active' },
];

const GENERATE_MOCK_CAPACITIES = (hotels: typeof MOCK_HOTELS) => {
    const allCapacities: RoomCapacity[] = [];

    hotels.forEach(hotel => {
        hotel.roomTypes.forEach(room => {
            const records: Record<string, CapacityRecord> = {};
            const startDate = new Date('2026-06-01');

            for (let i = 0; i < 90; i++) {
                const d = new Date(startDate);
                d.setDate(startDate.getDate() + i);
                const dateStr = d.toISOString().split('T')[0];
                const currentDay = d.getTime();

                // DYNAMIC CALCULATION: Count real reservations from MOCK_RESERVATIONS
                const soldCount = MOCK_RESERVATIONS.filter(res => {
                    const checkIn = new Date(res.checkIn).getTime();
                    const checkOut = new Date(res.checkOut).getTime();
                    const isValidStatus = ['Active', 'Reservation'].includes(res.status);
                    return res.hotelId === hotel.id &&
                        res.roomType === room &&
                        currentDay >= checkIn &&
                        currentDay < checkOut &&
                        isValidStatus;
                }).length;

                const total = 5 + Math.floor(Math.random() * 5);
                const statuses: Array<CapacityRecord['status']> = ['Alotman', 'Fix', 'On Request', 'Stop'];
                let status: CapacityRecord['status'] = 'Alotman';

                // FORCE SOME DATA FOR DEMO
                if (i % 15 === 0) status = 'Stop';
                else if (i % 7 === 0) status = 'On Request';
                else if (soldCount >= total) status = 'Stop';
                else if (soldCount >= total * 0.8) status = 'On Request';
                else status = statuses[Math.floor(Math.random() * 2)];

                records[dateStr] = {
                    date: dateStr,
                    all: total,
                    sold: i % 10 === 0 ? 0 : soldCount, // Force some 0 sold for "Free"
                    status: status
                };
            }
            allCapacities.push({
                hotelId: hotel.id,
                hotelName: hotel.name,
                roomType: room,
                records
            });
        });
    });
    return allCapacities;
};

const OperationalReports: React.FC = () => {
    useEffect(() => {
        console.log("🚀 OperationalReports module mounted at /operational-reports");
    }, []);

    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'inventory' | 'stats' | 'rooming'>('inventory');
    const [selectedDate, setSelectedDate] = useState(new Date('2026-06-20'));
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedHotel, setSelectedHotel] = useState(MOCK_HOTELS[0]);
    const [showDailyPulse, setShowDailyPulse] = useState(false);
    const [pulseDate, setPulseDate] = useState<string | null>(null);
    const [showCapacityModal, setShowCapacityModal] = useState(false);
    const [showMonthSelector, setShowMonthSelector] = useState(false);
    const [expandedHotels, setExpandedHotels] = useState<Set<string>>(new Set());
    const [showReportModal, setShowReportModal] = useState<{ show: boolean, type: 'stop' | 'free' }>({ show: false, type: 'stop' });
    const [isSendingReport, setIsSendingReport] = useState(false);
    const [reportSentAt, setReportSentAt] = useState<string | null>(null);
    const [searchParams] = useSearchParams();
    const isReportOnlyView = searchParams.get('reportView') === 'true';

    const MOCK_SUBAGENTS = [
        { id: '1', name: 'Fly Travel', email: 'fly-travel@gmail.com', city: 'Budva', active: true },
        { id: '2', name: 'Alun Travel', email: 'alun@aluntravel.me', city: 'Podgorica', active: true },
        { id: '3', name: 'Boka Explorer', email: 'info@boka-explorer.com', city: 'Kotor', active: true },
        { id: '4', name: 'Sun & Sea', email: 'sun-sea@yahoo.com', city: 'Bar', active: true },
        { id: '5', name: 'Olimpik Travel', email: 'booking@olimpik.com', city: 'Berane', active: true },
        { id: '6', name: 'Nenad Tomić', email: 'nenad.tomic1403@gmail.com', city: 'Beograd', active: true }
    ];

    // --- GLOBAL FILTERS ---
    const [bookingFrom, setBookingFrom] = useState('2026-01-01');
    const [bookingTo, setBookingTo] = useState('2026-12-31');
    const [stayFrom, setStayFrom] = useState('2026-06-01');
    const [stayTo, setStayTo] = useState('2026-08-31');

    // Multi-select and searchable filters
    const [selectedDestinations, setSelectedDestinations] = useState<string[]>([]);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [hotelFilter, setHotelFilter] = useState('');

    // --- CAPACITY STATE ---
    const [allCapacities, setAllCapacities] = useState<RoomCapacity[]>(() =>
        GENERATE_MOCK_CAPACITIES(MOCK_HOTELS)
    );

    const groupedData = useMemo(() => {
        const filtered = allCapacities.filter(cap => {
            const hotel = MOCK_HOTELS.find(h => h.id === cap.hotelId);
            const matchesDest = selectedDestinations.length === 0 || selectedDestinations.includes(hotel?.destination || '');
            const matchesCat = selectedCategories.length === 0 || selectedCategories.includes(hotel?.category || '');
            const matchesSearch = cap.hotelName.toLowerCase().includes(hotelFilter.toLowerCase());

            return matchesDest && matchesCat && matchesSearch;
        });

        const groups: Record<string, { hotel: any, rooms: RoomCapacity[] }> = {};
        filtered.forEach(cap => {
            if (!groups[cap.hotelId]) {
                groups[cap.hotelId] = {
                    hotel: MOCK_HOTELS.find(h => h.id === cap.hotelId),
                    rooms: []
                };
            }
            groups[cap.hotelId].rooms.push(cap);
        });
        return Object.values(groups);
    }, [allCapacities, selectedDestinations, selectedCategories, hotelFilter]);

    const toggleHotel = (id: string) => {
        const newExpanded = new Set(expandedHotels);
        if (newExpanded.has(id)) newExpanded.delete(id);
        else newExpanded.add(id);
        setExpandedHotels(newExpanded);
    };

    // --- MOCK DATA FOR DROPDOWNS ---
    const DEST_OPTIONS = DESTINATIONS.filter(d => d !== 'Sve');
    const CAT_OPTIONS = CATEGORIES.filter(c => c !== 'Sve');

    // --- REUSABLE DROPDOWN COMPONENT ---
    const SearchableMultiSelect = ({ label, options, selected, onChange, icon: Icon }: any) => {
        const [isOpen, setIsOpen] = useState(false);
        const [query, setQuery] = useState('');
        const containerRef = React.useRef<HTMLDivElement>(null);

        useEffect(() => {
            const handleClickOutside = (event: MouseEvent) => {
                if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                    setIsOpen(false);
                }
            };
            if (isOpen) {
                document.addEventListener('mousedown', handleClickOutside);
            }
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }, [isOpen]);

        const filtered = options.filter((o: string) => o.toLowerCase().includes(query.toLowerCase()));

        return (
            <div className="multi-select-container" ref={containerRef}>
                <label className="filter-label">{label}</label>
                <div className="ms-trigger" onClick={() => setIsOpen(!isOpen)}>
                    <Icon size={14} className="ms-icon" />
                    <div className="ms-values">
                        {selected.length === 0 ? `Sve ${label.toLowerCase()}` : selected.join(', ')}
                    </div>
                    <ChevronDown size={14} className={`ms-arrow ${isOpen ? 'open' : ''}`} />
                </div>
                {isOpen && (
                    <div className="ms-dropdown">
                        <div className="ms-search">
                            <Search size={14} />
                            <input
                                autoFocus
                                placeholder="Traži..."
                                value={query}
                                onChange={e => setQuery(e.target.value)}
                                onClick={e => e.stopPropagation()}
                            />
                        </div>
                        <div className="ms-options">
                            {filtered.map((opt: string) => (
                                <div
                                    key={opt}
                                    className={`ms-option ${selected.includes(opt) ? 'selected' : ''}`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const next = selected.includes(opt)
                                            ? selected.filter((s: string) => s !== opt)
                                            : [...selected, opt];
                                        onChange(next);
                                    }}
                                >
                                    <div className="ms-checkbox">
                                        {selected.includes(opt) && <Check size={12} />}
                                    </div>
                                    <span>{opt}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // --- CAPACITY MODAL STATE ---
    const [capDateFrom, setCapDateFrom] = useState('2026-06-01');
    const [capDateTo, setCapDateTo] = useState('2026-06-30');
    const [capRooms, setCapRooms] = useState<string[]>([]);
    const [capValue, setCapValue] = useState(10);
    const [capStatus, setCapStatus] = useState<CapacityRecord['status']>('Alotman');

    const handleDateClick = (date: Date, hotelInfo?: any) => {
        const dateStr = date.toISOString().split('T')[0];
        setPulseDate(dateStr);
        if (hotelInfo) setSelectedHotel(hotelInfo);
        setShowDailyPulse(true);
    };

    const handleSaveCapacity = () => {
        const newCapacities = [...allCapacities];
        const startDate = new Date(capDateFrom);
        const endDate = new Date(capDateTo);

        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            capRooms.forEach(roomType => {
                // Find capacity record in our flat list
                const idx = newCapacities.findIndex(rc => rc.roomType === roomType && rc.hotelId === selectedHotel.id);
                if (idx !== -1) {
                    newCapacities[idx].records[dateStr] = {
                        date: dateStr,
                        all: capValue,
                        sold: Math.floor(Math.random() * (capValue < 5 ? capValue : 5)),
                        status: capStatus
                    };
                }
            });
        }
        setAllCapacities(newCapacities);
        setShowCapacityModal(false);
    };

    // --- Inventory View Helpers ---
    const daysInView = 20;
    const dates = useMemo(() => {
        const d = [];
        for (let i = 0; i < daysInView; i++) {
            const date = new Date(selectedDate);
            date.setDate(selectedDate.getDate() + i);
            d.push(date);
        }
        return d;
    }, [selectedDate]);

    // --- Stats Filters & Calculation ---
    const statsData = useMemo(() => {
        const filtered = MOCK_RESERVATIONS.filter(r =>
            (r.createdAt >= bookingFrom && r.createdAt <= bookingTo) &&
            (r.checkIn >= stayFrom && r.checkIn <= stayTo)
        );

        const totalAdults = filtered.reduce((acc, r) => acc + r.adults, 0);
        const totalKids = filtered.reduce((acc, r) => acc + r.children, 0);
        const totalBabies = filtered.reduce((acc, r) => acc + r.babies, 0);
        const totalPAX = totalAdults + totalKids + totalBabies;

        let totalNights = 0;
        let totalRevenue = 0;

        filtered.forEach(r => {
            const startStr = r.checkIn;
            const endStr = r.checkOut;
            const start = new Date(startStr);
            const end = new Date(endStr);
            const nights = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
            totalNights += nights;
            totalRevenue += r.amount;
        });

        return {
            totalAdults,
            totalKids,
            totalBabies,
            totalPAX,
            totalNights,
            totalRevenue,
            avgPricePAX: totalPAX > 0 ? totalRevenue / totalPAX : 0,
            avgPriceNight: totalNights > 0 ? totalRevenue / totalNights : 0
        };
    }, [bookingFrom, bookingTo, stayFrom, stayTo]);

    // --- Daily Pulse Data ---
    const getArrivalsDepartures = (dateStr: string) => {
        const arrivals = MOCK_RESERVATIONS.filter(r => r.checkIn === dateStr);
        const departures = MOCK_RESERVATIONS.filter(r => r.checkOut === dateStr);
        return { arrivals, departures };
    };

    const handleMonthSelect = (monthIdx: number) => {
        const newDate = new Date(selectedDate.getFullYear(), monthIdx, 1);
        setSelectedDate(newDate);
        setShowMonthSelector(false);
    };

    const monthNames = [
        "Januar", "Februar", "Mart", "April", "Maj", "Jun",
        "Jul", "Avgust", "Septembar", "Oktobar", "Novembar", "Decembar"
    ];

    // MOVED UP to avoid reference errors

    if (isReportOnlyView) {
        const reportToken = searchParams.get('token') || 'PUBLIC-DEMO';

        return (
            <div className="full-report-standalone">
                <style>{`
                    /* Nuclear Hide: Kill app navigation */
                    header, nav, aside, .top-header, .main-menu, .navbar, .sidebar { display: none !important; }
                    #root, .app-container, .main-layout { padding: 0 !important; margin: 0 !important; overflow: visible !important; }

                    .full-report-standalone { 
                        position: fixed; 
                        inset: 0;
                        background: #f8fafc; 
                        z-index: 99999999;
                        overflow-y: auto;
                        color: #1e293b;
                        font-family: 'Outfit', sans-serif;
                    }
                    
                    .report-wrapper { max-width: 1800px; margin: 0 auto; background: white; min-height: 100vh; display: flex; flex-direction: column; }

                    .report-header { 
                        display: flex; justify-content: space-between; align-items: center; 
                        padding: 20px 40px; border-bottom: 2px solid #e2e8f0; 
                        background: white; position: sticky; top: 0; z-index: 50;
                    }

                    .api-sync-badge {
                        background: #eff6ff; border: 1px dashed #3b82f6; color: #1d4ed8;
                        padding: 8px 16px; border-radius: 8px; font-size: 11px; font-weight: 700;
                        display: flex; align-items: center; gap: 8px;
                    }

                    .standalone-table-container { padding: 40px; flex-grow: 1; }
                    .report-table { 
                        width: 100%; border-collapse: collapse; border-spacing: 0;
                        table-layout: fixed;
                    }
                    
                    .report-table th, .report-table td { 
                        border: 1px solid #e2e8f0; 
                        padding: 0; height: 40px;
                        text-align: center;
                    }

                    .hotel-col-head { width: 300px; background: #f8fafc; text-align: left !important; padding: 0 15px !important; font-weight: 800; color: #64748b; font-size: 12px; }
                    .date-col-head { width: 40px; background: #f8fafc; }
                    .date-col-head .d-day { font-size: 9px; text-transform: uppercase; display: block; color: #94a3b8; }
                    .date-col-head .d-num { font-size: 14px; font-weight: 800; display: block; color: #1e293b; }

                    .hotel-summary-row { background: #fff; }
                    .hotel-name-cell { padding: 0 15px !important; text-align: left !important; position: sticky; left: 0; background: white; z-index: 10; cursor: pointer; }
                    .hotel-name-cell h3 { margin: 0; font-size: 14px; font-weight: 800; color: #0f172a; }
                    .hotel-name-cell p { margin: 2px 0 0; font-size: 10px; color: #64748b; font-weight: 600; }

                    .room-row { background: #fbfbfc; }
                    .room-name-cell { 
                        padding-left: 45px !important; text-align: left !important; 
                        font-size: 12px; font-weight: 700; color: #475569;
                    }

                    /* STATUS COLORS - NO TEXT INSIDE */
                    .cell-status { width: 100%; height: 100%; display: block; border: none; }
                    .status-Stop { background: #ef4444; }
                    .status-On-Request { background: #f59e0b; }
                    .status-Alotman, .status-Fix { background: #10b981; }
                    .status-Empty { background: #f8fafc; }

                    .expand-icon { width: 24px; height: 24px; display: inline-flex; align-items: center; justify-content: center; border-radius: 6px; background: #f1f5f9; color: #64748b; margin-right: 10px; }
                    .expanded .expand-icon { background: #3b82f6; color: white; }
                    
                    .report-footer { padding: 40px; border-top: 1px solid #e2e8f0; text-align: center; color: #94a3b8; font-size: 12px; }
                `}</style>

                <div className="report-wrapper">
                    <header className="report-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                            <div style={{ width: '45px', height: '45px', background: '#0f172a', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900, fontSize: '24px' }}>P</div>
                            <div>
                                <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 900 }}>Prime B2B Inventory</h1>
                                <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Live Standalone Document</span>
                            </div>
                        </div>

                        <div className="api-sync-badge" title="U planu: Automatsko ažuriranje sa Hotelbeds, Travelport...">
                            <Activity size={16} />
                            <span>TO-DO: API Sync Module</span>
                        </div>

                        <button className="print-btn" onClick={() => window.print()} style={{ background: '#3b82f6', color: 'white', border: 'none', padding: '10px 24px', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 10px rgba(59, 130, 246, 0.3)' }}>
                            <Download size={18} /> Export Document
                        </button>
                    </header>

                    <div className="standalone-table-container">
                        <table className="report-table">
                            <thead>
                                <tr>
                                    <th className="hotel-col-head">Hotel / Tip Smeštaja</th>
                                    {dates.map((date, idx) => (
                                        <th key={idx} className="date-col-head">
                                            <span className="d-day">{date.toLocaleDateString('sr-Latn-RS', { weekday: 'short' }).replace('.', '')}</span>
                                            <span className="d-num">{date.getDate()}</span>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {groupedData.length === 0 && (
                                    <tr>
                                        <td colSpan={dates.length + 1} style={{ padding: '60px', textAlign: 'center', color: '#64748b' }}>
                                            <div style={{ fontSize: '18px', fontWeight: 700 }}>Nema podataka za prikaz</div>
                                            <p>Proverite filtere ili osvežite stranicu.</p>
                                        </td>
                                    </tr>
                                )}
                                {groupedData.map(group => {
                                    const isExp = expandedHotels.has(group.hotel?.id);
                                    return (
                                        <React.Fragment key={group.hotel?.id || Math.random()}>
                                            <tr className={`hotel-summary-row ${isExp ? 'expanded' : ''}`}>
                                                <td className="hotel-name-cell" onClick={() => group.hotel && toggleHotel(group.hotel.id)}>
                                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                                        <span className="expand-icon">{isExp ? <ChevronUp size={14} /> : <Plus size={14} />}</span>
                                                        <div>
                                                            <h3>{group.hotel?.name || 'Nepoznat Hotel'}</h3>
                                                            <p>{group.hotel?.destination} • {group.hotel?.category}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                {dates.map((date, idx) => {
                                                    const dateStr = date.toISOString().split('T')[0];
                                                    let worstStatus: CapacityRecord['status'] = 'Alotman';
                                                    group.rooms.forEach(r => {
                                                        const rec = r.records[dateStr];
                                                        if (rec?.status === 'Stop') worstStatus = 'Stop';
                                                        else if (rec?.status === 'On Request' && worstStatus !== 'Stop') worstStatus = 'On Request';
                                                    });
                                                    return (
                                                        <td key={idx}>
                                                            <span className={`cell-status status-${worstStatus.replace(' ', '-')}`}></span>
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                            {isExp && group.rooms.map((room, rIdx) => (
                                                <tr key={rIdx} className="room-row">
                                                    <td className="room-name-cell">{room.roomType}</td>
                                                    {dates.map((date, idx) => {
                                                        const dateStr = date.toISOString().split('T')[0];
                                                        const rec = room.records[dateStr];
                                                        const status = rec?.status || 'Alotman';
                                                        return (
                                                            <td key={idx}>
                                                                <span className={`cell-status status-${status.replace(' ', '-')}`}></span>
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            ))}
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <footer className="report-footer">
                        <p>© 2026 Prime B2B Click To Travel | Dokument autorizovan za subagente</p>
                        <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '15px', fontSize: '11px', fontWeight: 700 }}>
                            <span style={{ color: '#10b981' }}>● AVAILABLE</span>
                            <span style={{ color: '#f59e0b' }}>● ON REQUEST</span>
                            <span style={{ color: '#ef4444' }}>● STOP SALE</span>
                        </div>
                    </footer>
                </div>
            </div>
        );
    }

    return (
        <div className="op-reports-container">
            {/* Header Area */}
            <header className="op-header">
                <div className="op-title-group">
                    <div className="op-icon-badge">
                        <Activity size={24} color="var(--accent)" />
                    </div>
                    <div>
                        <h1>Operativni Izveštaji</h1>
                        <p>Command Center za upravljanje produkcijom i kapacitetima</p>
                    </div>
                </div>

                <div className="op-header-actions">
                    <button className="btn-create-cap header-btn" onClick={() => setShowCapacityModal(true)}>
                        <Plus size={18} /> Kreiraj Kapacitet
                    </button>

                    <div className="op-tabs">
                        <button
                            className={`op-tab-btn ${activeTab === 'inventory' ? 'active' : ''}`}
                            onClick={() => setActiveTab('inventory')}
                        >
                            <CalendarIcon size={18} />
                            Inventory Orchestrator
                        </button>
                        <button
                            className={`op-tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
                            onClick={() => setActiveTab('stats')}
                        >
                            <BarChart3 size={18} />
                            PAX & Statistika
                        </button>
                        <button
                            className={`op-tab-btn ${activeTab === 'rooming' ? 'active' : ''}`}
                            onClick={() => setActiveTab('rooming')}
                        >
                            <Users size={18} />
                            Rooming Lista
                        </button>
                    </div>
                </div>
            </header>

            {/* Global Master Filters */}
            <section className="global-filters-bar">
                <div className="filter-group date-nav-group">
                    <label>Kalendar (Brzi pregled)</label>
                    <div className="date-nav">
                        <button className="btn-icon" onClick={() => setSelectedDate(new Date(selectedDate.getTime() - 7 * 86400000))}>
                            <ChevronLeft size={16} />
                        </button>
                        <span
                            className="current-view-label clickable"
                            onClick={() => setShowMonthSelector(true)}
                            title="Promeni mesec"
                        >
                            {dates[0].toLocaleDateString('sr-Latn-RS', { month: 'long', year: 'numeric' })}
                        </span>
                        <button className="btn-icon" onClick={() => setSelectedDate(new Date(selectedDate.getTime() + 7 * 86400000))}>
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>

                <div className="filter-divider" />

                <div className="filter-group">
                    <label>Rezervacije (od-do)</label>
                    <div className="range">
                        <input type="date" value={bookingFrom} onChange={e => setBookingFrom(e.target.value)} />
                        <input type="date" value={bookingTo} onChange={e => setBookingTo(e.target.value)} />
                    </div>
                </div>
                <div className="filter-divider" />

                <div className="adv-filters-group">
                    <SearchableMultiSelect
                        label="Destinacija"
                        options={DEST_OPTIONS}
                        selected={selectedDestinations}
                        onChange={setSelectedDestinations}
                        icon={MapPin}
                    />

                    <SearchableMultiSelect
                        label="Kategorija"
                        options={CAT_OPTIONS}
                        selected={selectedCategories}
                        onChange={setSelectedCategories}
                        icon={Tag}
                    />

                    <div className="hotel-search-box">
                        <label className="filter-label">Hotel (Search)</label>
                        <div className="search-input-wrapper">
                            <Search size={14} />
                            <input
                                type="text"
                                placeholder="Kucaj naziv hotela..."
                                value={hotelFilter}
                                onChange={e => setHotelFilter(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Main Content View */}
            <main className="op-content">
                <AnimatePresence mode="wait">
                    {activeTab === 'inventory' && (
                        <motion.div
                            key="inventory"
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            className="inventory-view"
                        >
                            {/* Inventory Controls - SIMPLIFIED */}
                            <div className="inventory-sub-header">
                                <h2 className="inventory-title">Pregled Kapaciteta po Danima</h2>
                                <div className="report-actions">
                                    <button
                                        className="report-btn stop-sale-btn"
                                        onClick={() => setShowReportModal({ show: true, type: 'stop' })}
                                    >
                                        <CalendarIcon size={14} /> Inventory Report
                                    </button>
                                </div>
                            </div>

                            {/* Quantum Inventory Grid */}
                            <div className="quantum-grid-wrapper">
                                <table className="quantum-grid">
                                    <thead>
                                        <tr>
                                            <th className="sticky-col">Tip Smeštaja</th>
                                            {dates.map((date, idx) => (
                                                <th key={idx} className={date.getDay() === 0 || date.getDay() === 6 ? 'weekend' : ''} onClick={() => handleDateClick(date)}>
                                                    <div className="th-date-container">
                                                        <span className="th-day-name">{date.toLocaleDateString('sr-Latn-RS', { weekday: 'short' }).replace('.', '')}</span>
                                                        <span className="th-day-num">{date.getDate()}</span>
                                                        <span className="th-month-name">{date.toLocaleDateString('sr-Latn-RS', { month: 'short' }).replace('.', '')}</span>
                                                    </div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {groupedData.map((group, gIdx) => {
                                            const isExpanded = expandedHotels.has(group.hotel?.id || '');

                                            // Calculate Hotel Total Row for this group
                                            return (
                                                <React.Fragment key={group.hotel?.id || gIdx}>
                                                    {/* Hotel Summary Row */}
                                                    <tr className="hotel-group-row">
                                                        <td className="sticky-col">
                                                            <div className="hotel-row-identity">
                                                                <button
                                                                    className={`expand-btn ${isExpanded ? 'active' : ''}`}
                                                                    onClick={() => group.hotel && toggleHotel(group.hotel.id)}
                                                                >
                                                                    {isExpanded ? <ChevronUp size={14} /> : <Plus size={14} />}
                                                                </button>
                                                                <div className="hotel-info">
                                                                    <strong>{group.hotel?.name || 'Nepoznat'}</strong>
                                                                    <span className="hotel-tags">{group.hotel?.destination} • {group.hotel?.category}</span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        {dates.map((date, dIdx) => {
                                                            const dateStr = date.toISOString().split('T')[0];
                                                            let hTotalAll = 0, hTotalSold = 0;
                                                            group.rooms.forEach(r => {
                                                                const rec = r.records[dateStr];
                                                                if (rec) {
                                                                    hTotalAll += rec.all;
                                                                    hTotalSold += rec.sold;
                                                                }
                                                            });
                                                            const avail = hTotalAll - hTotalSold;
                                                            const occPercent = hTotalAll > 0 ? Math.round((hTotalSold / hTotalAll) * 100) : 0;

                                                            return (
                                                                <td key={dIdx} className="cap-cell hotel-sum-cell" onClick={() => handleDateClick(date, group.hotel)}>
                                                                    <div className="cap-content">
                                                                        <span className="cap-total">{hTotalAll}</span>
                                                                        <span className="cap-sold">{hTotalSold}</span>
                                                                        <span className="cap-occ-percent">{occPercent}%</span>
                                                                        <span className="cap-available">{avail}</span>
                                                                    </div>
                                                                </td>
                                                            );
                                                        })}
                                                    </tr>

                                                    {/* Room Type Details (Conditional) */}
                                                    {isExpanded && group.rooms.map((room, rIdx) => (
                                                        <motion.tr
                                                            key={`${group.hotel?.id || gIdx}-${rIdx}`}
                                                            initial={{ opacity: 0, y: -10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            className="room-detail-row"
                                                        >
                                                            <td className="sticky-col">
                                                                <div className="room-type-inner">
                                                                    <span>{room.roomType}</span>
                                                                </div>
                                                            </td>
                                                            {dates.map((date, dIdx) => {
                                                                const dateStr = date.toISOString().split('T')[0];
                                                                const rec = room.records[dateStr];
                                                                if (!rec) return <td key={dIdx} className="cap-cell cell-empty"></td>;
                                                                const available = rec.all - rec.sold;
                                                                const occPercent = rec.all > 0 ? Math.round((rec.sold / rec.all) * 100) : 0;
                                                                const statusClass = `stat-${rec.status.replace(' ', '-')}`;

                                                                return (
                                                                    <td key={dIdx} className={`cap-cell ${statusClass}`} onClick={() => handleDateClick(date, group.hotel)}>
                                                                        <div className="cap-content">
                                                                            <span className="cap-total">{rec.all}</span>
                                                                            <span className="cap-sold">{rec.sold}</span>
                                                                            <div className="cap-meta-info">
                                                                                <span className="cap-occ-mini">{occPercent}%</span>
                                                                                <span className="cap-status-badge">{rec.status.substring(0, 3)}</span>
                                                                            </div>
                                                                            <span className="cap-available">{available}</span>
                                                                        </div>
                                                                    </td>
                                                                );
                                                            })}
                                                        </motion.tr>
                                                    ))}
                                                </React.Fragment>
                                            );
                                        })}

                                        {/* TOTAL ROW (Grand Total) */}
                                        <tr className="total-row grand-total">
                                            <td className="sticky-col">
                                                <div className="room-type-label">
                                                    <strong>UKUPNO PRODAJA</strong>
                                                </div>
                                            </td>
                                            {dates.map((date, dIdx) => {
                                                const dateStr = date.toISOString().split('T')[0];
                                                let totalAll = 0, totalSold = 0;
                                                groupedData.forEach(group => {
                                                    group.rooms.forEach(cap => {
                                                        const rec = cap.records[dateStr];
                                                        if (rec) {
                                                            totalAll += rec.all;
                                                            totalSold += rec.sold;
                                                        }
                                                    });
                                                });
                                                const available = totalAll - totalSold;
                                                const occPercent = totalAll > 0 ? Math.round((totalSold / totalAll) * 100) : 0;
                                                return (
                                                    <td key={dIdx} className="cap-cell total-cell">
                                                        <div className="cap-content">
                                                            <span className="cap-total">{totalAll}</span>
                                                            <span className="cap-sold">{totalSold}</span>
                                                            <span className="cap-occ-percent">{occPercent}%</span>
                                                            <span className="cap-available">{available}</span>
                                                        </div>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'stats' && (
                        <motion.div
                            key="stats"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="stats-view"
                        >
                            <div className="stats-header-actions">
                                <h2 className="section-subtitle">Pregled PAX Statistike za odabrani period</h2>
                                <button className="export-btn">
                                    <Download size={18} /> Export Excel
                                </button>
                            </div>

                            <div className="stats-grid">
                                <div className="stat-card">
                                    <Users2 size={24} color="#3fb950" />
                                    <div className="stat-info">
                                        <span className="label">Ukupno Putnika (PAX)</span>
                                        <span className="value">{statsData.totalPAX}</span>
                                    </div>
                                    <div className="pax-breakdown">
                                        <div className="pax-tag">ADL: <strong>{statsData.totalAdults}</strong></div>
                                        <div className="pax-tag">CHD: <strong>{statsData.totalKids}</strong></div>
                                        <div className="pax-tag">INF: <strong>{statsData.totalBabies}</strong></div>
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <Moon size={24} color="#a855f7" />
                                    <div className="stat-info">
                                        <span className="label">Ukupno Noćenja</span>
                                        <span className="value">{statsData.totalNights}</span>
                                    </div>
                                </div>
                                <div className="stat-card">
                                    <TrendingUp size={24} color="#3b82f6" />
                                    <div className="stat-info">
                                        <span className="label">Prosečna Cena Putovanja</span>
                                        <span className="value">€{statsData.avgPricePAX.toFixed(2)}</span>
                                    </div>
                                </div>
                                <div className="stat-card highlight">
                                    <Activity size={24} color="var(--accent)" />
                                    <div className="stat-info">
                                        <span className="label">Ukupno Finansija</span>
                                        <span className="value">€{statsData.totalRevenue.toLocaleString()}</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'rooming' && (
                        <motion.div
                            key="rooming"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="rooming-list-view"
                        >
                            <div className="rooming-header-bar">
                                <div className="search-box">
                                    <Search size={18} />
                                    <input
                                        type="text"
                                        placeholder="Pretraži listu (putnik, soba...)"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <div className="rooming-actions">
                                    <button className="btn-secondary">
                                        <Download size={18} /> Export PDF
                                    </button>
                                    <button className="btn-primary">
                                        <Mail size={18} /> Pošalji listu hotelu
                                    </button>
                                </div>
                            </div>

                            <div className="rooming-table-card">
                                <table className="op-table">
                                    <thead>
                                        <tr>
                                            <th>ID Rez.</th>
                                            <th>Glavni Putnik</th>
                                            <th>Check-In</th>
                                            <th>Check-Out</th>
                                            <th>Tip Smeštaja</th>
                                            <th>PAX</th>
                                            <th>Status</th>
                                            <th>Akcije</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {MOCK_RESERVATIONS.map(res => (
                                            <tr key={res.id}>
                                                <td><span className="res-id-link">#{res.id}</span></td>
                                                <td><div className="px-name">{res.customer}</div></td>
                                                <td><div className="date-cell">{res.checkIn}</div></td>
                                                <td><div className="date-cell">{res.checkOut}</div></td>
                                                <td><span className="room-badge">{res.roomType}</span></td>
                                                <td>{res.adults} + {res.children} + {res.babies}</td>
                                                <td><span className="badge-status confirmed">Uplaćeno</span></td>
                                                <td>
                                                    <button className="btn-action-small">
                                                        <ExternalLink size={14} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* Daily Pulse Modal */}
            <AnimatePresence>
                {showDailyPulse && (
                    <div className="modal-overlay" onClick={() => setShowDailyPulse(false)}>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="daily-pulse-modal"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="pulse-header">
                                <div>
                                    <h3>Daily Pulse: {pulseDate}</h3>
                                    <p>{selectedHotel.name}</p>
                                </div>
                                <button className="close-btn" onClick={() => setShowDailyPulse(false)}>
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="pulse-content">
                                <div className="pulse-section">
                                    <div className="section-title">
                                        <div className="title-left">
                                            <ArrowUpRight size={18} color="#10b981" />
                                            Arrivals (Dolasci)
                                        </div>
                                        <NavLink to={`/reservations?checkIn=${pulseDate}`} className="section-link">
                                            Vidi sve dolaske <ChevronRight size={14} />
                                        </NavLink>
                                    </div>
                                    <div className="pulse-list">
                                        {getArrivalsDepartures(pulseDate!).arrivals.length > 0 ? (
                                            getArrivalsDepartures(pulseDate!).arrivals.map(r => (
                                                <div key={r.id} className="pulse-item-card">
                                                    <div className="p-info">
                                                        <strong>{r.customer}</strong>
                                                        <span>{r.roomType}</span>
                                                    </div>
                                                    <div className="p-pax">{r.adults + r.children} PAX</div>
                                                    <NavLink to={`/reservations?id=${r.id}`} className="p-link">
                                                        Dosije <ChevronRight size={14} />
                                                    </NavLink>
                                                </div>
                                            ))
                                        ) : <p className="empty-msg">Nema dolazaka.</p>}
                                    </div>
                                </div>

                                <div className="pulse-section">
                                    <div className="section-title">
                                        <div className="title-left">
                                            <ExternalLink size={18} color="#ef4444" style={{ transform: 'rotate(90deg)' }} />
                                            Departures (Odlasci)
                                        </div>
                                        <NavLink to={`/reservations?checkOut=${pulseDate}`} className="section-link">
                                            Vidi sve odlaske <ChevronRight size={14} />
                                        </NavLink>
                                    </div>
                                    <div className="pulse-list">
                                        {getArrivalsDepartures(pulseDate!).departures.length > 0 ? (
                                            getArrivalsDepartures(pulseDate!).departures.map(r => (
                                                <div key={r.id} className="pulse-item-card">
                                                    <div className="p-info">
                                                        <strong>{r.customer}</strong>
                                                        <span>{r.roomType}</span>
                                                    </div>
                                                    <div className="p-pax">{r.adults + r.children} PAX</div>
                                                    <NavLink to={`/reservations?id=${r.id}`} className="p-link">
                                                        Dosije <ChevronRight size={14} />
                                                    </NavLink>
                                                </div>
                                            ))
                                        ) : <p className="empty-msg">Nema odlazaka.</p>}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Month Selector Modal */}
            <AnimatePresence>
                {showMonthSelector && (
                    <div className="modal-overlay" onClick={() => setShowMonthSelector(false)}>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="month-selector-modal"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="wizard-header">
                                <h3>Odaberi Mesec ({selectedDate.getFullYear()})</h3>
                                <button className="close-btn" onClick={() => setShowMonthSelector(false)}>
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="month-grid">
                                {monthNames.map((name, idx) => (
                                    <button
                                        key={idx}
                                        className={`month-square ${selectedDate.getMonth() === idx ? 'active' : ''}`}
                                        onClick={() => handleMonthSelect(idx)}
                                    >
                                        <span className="m-num">{idx + 1}</span>
                                        <span className="m-name">{name}</span>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Capacity Management Modal */}
            <AnimatePresence>
                {showCapacityModal && (
                    <div className="modal-overlay" onClick={() => setShowCapacityModal(false)}>
                        <motion.div
                            initial={{ x: 300, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            exit={{ x: 300, opacity: 0 }}
                            className="capacity-wizard-modal"
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="wizard-header">
                                <h3>Upravljanje Kapacitetom</h3>
                                <button className="close-btn" onClick={() => setShowCapacityModal(false)}><X size={20} /></button>
                            </div>
                            <div className="wizard-content">
                                <div className="wizard-field">
                                    <label>Period boravka</label>
                                    <div className="wizard-range">
                                        <input type="date" value={capDateFrom} onChange={e => setCapDateFrom(e.target.value)} />
                                        <input type="date" value={capDateTo} onChange={e => setCapDateTo(e.target.value)} />
                                    </div>
                                </div>

                                <div className="form-group full-width">
                                    <label>Za Hotel:</label>
                                    <div className="search-input-wrapper">
                                        <Building2 size={16} />
                                        <select
                                            className="op-select"
                                            style={{ width: '100%', background: 'transparent', border: 'none' }}
                                            value={selectedHotel.id}
                                            onChange={(e) => setSelectedHotel(MOCK_HOTELS.find(h => h.id === e.target.value) || MOCK_HOTELS[0])}
                                        >
                                            {MOCK_HOTELS.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="form-group full-width">
                                    <label>Tipovi Smeštaja:</label>
                                    <div className="rooms-checklist">
                                        {selectedHotel.roomTypes.map(room => (
                                            <button
                                                key={room}
                                                className={`room-chip ${capRooms.includes(room) ? 'selected' : ''}`}
                                                onClick={() => setCapRooms(prev => prev.includes(room) ? prev.filter(p => p !== room) : [...prev, room])}
                                            >
                                                {room}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="wizard-half-fields">
                                    <div className="wizard-field">
                                        <label>Broj soba (zadato)</label>
                                        <input type="number" value={capValue} onChange={e => setCapValue(parseInt(e.target.value))} />
                                    </div>
                                    <div className="wizard-field">
                                        <label>Status</label>
                                        <select value={capStatus} onChange={e => setCapStatus(e.target.value as any)}>
                                            <option value="Alotman">Alotman</option>
                                            <option value="Fix">Fix</option>
                                            <option value="On Request">On Request</option>
                                            <option value="Stop">Stop Sale</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            <div className="wizard-footer">
                                <button className="btn-cancel" onClick={() => setShowCapacityModal(false)}>Odustani</button>
                                <button className="btn-save" onClick={handleSaveCapacity}>
                                    <Check size={18} /> Primeni Kapacitet
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Visual Report Modal (Stop Sale / Free Capacity) */}
            <AnimatePresence>
                {showReportModal.show && (
                    <div className="modal-overlay" onClick={() => setShowReportModal({ ...showReportModal, show: false })}>
                        <motion.div
                            className="visual-report-modal"
                            onClick={e => e.stopPropagation()}
                            initial={{ scale: 0.9, opacity: 0, y: 50 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 50 }}
                        >
                            <div className="report-modal-header">
                                <div className="report-title-section">
                                    <div className={`report-icon-box ${showReportModal.type}`}>
                                        {showReportModal.type === 'stop' ? <AlertTriangle size={24} /> : <Sparkles size={24} />}
                                    </div>
                                    <div>
                                        <h3>Hotelski Kapaciteti - Pregled po Danima</h3>
                                        <p className="report-subtitle">Generisano: {new Date().toLocaleDateString('sr-Latn-RS')} • Svi statusi (Stop, On Request, Slobodno)</p>
                                    </div>
                                </div>
                                <button className="report-close-btn" onClick={() => setShowReportModal({ ...showReportModal, show: false })}>
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="report-body" style={{ textAlign: 'center', padding: '30px 20px' }}>
                                <div style={{ marginBottom: '25px', color: 'var(--text-secondary)' }}>
                                    <Eye size={40} style={{ opacity: 0.3, marginBottom: '10px' }} />
                                    <h4 style={{ color: 'var(--text-primary)', marginBottom: '4px' }}>Jedinstveni B2B Link</h4>
                                    <p style={{ fontSize: '13px' }}>Subagenti mogu pristupiti ovom linku bez logovanja u sistem.</p>
                                </div>

                                <div className="secure-link-preview" style={{
                                    background: '#f1f5f9',
                                    padding: '15px',
                                    borderRadius: '10px',
                                    fontSize: '11px',
                                    color: '#64748b',
                                    fontFamily: 'monospace',
                                    marginBottom: '20px',
                                    border: '1px dashed #cbd5e1',
                                    wordBreak: 'break-all'
                                }}>
                                    {`${window.location.protocol}//${window.location.host}${window.location.pathname}?token=SR-${Math.random().toString(36).substring(7).toUpperCase()}&view=inventory`}
                                </div>

                                <button
                                    className="link-btn-large"
                                    style={{
                                        background: 'var(--accent)',
                                        color: 'white',
                                        padding: '12px 24px',
                                        borderRadius: '12px',
                                        border: 'none',
                                        fontWeight: '800',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        cursor: 'pointer'
                                    }}
                                    onClick={() => {
                                        const token = `SR-${Math.random().toString(36).substring(7).toUpperCase()}`;
                                        const url = `${window.location.protocol}//${window.location.host}${window.location.pathname}?reportView=true&token=${token}`;
                                        window.open(url, '_blank');
                                    }}
                                >
                                    <ArrowUpRight size={18} /> Otvori Public View (Demo)
                                </button>
                            </div>

                            <div className="report-footer">
                                <div className="subagent-bulk-info">
                                    <div className="subagent-summary">
                                        <MailCheck size={18} />
                                        <span>Target: <strong>nenad.tomic1403@gmail.com</strong> + {MOCK_SUBAGENTS.length - 1} agenata</span>
                                    </div>
                                    <div className="agent-chips">
                                        {MOCK_SUBAGENTS.map(agent => (
                                            <span key={agent.id} className="agent-chip">{agent.name}</span>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    disabled={isSendingReport}
                                    className={`send-bulk-btn ${reportSentAt ? 'success' : ''}`}
                                    onClick={async () => {
                                        setIsSendingReport(true);
                                        await new Promise(r => setTimeout(r, 2000));
                                        setIsSendingReport(false);
                                        setReportSentAt(new Date().toLocaleTimeString('sr-Latn-RS'));
                                    }}
                                >
                                    {isSendingReport ? (
                                        <><Clock className="animate-spin" size={18} /> Slanje u toku...</>
                                    ) : reportSentAt ? (
                                        <><CheckCircle2 size={18} /> Poslato na nenad.tomic1403@gmail.com</>
                                    ) : (
                                        <><Send size={18} /> Pošalji svima</>
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div >
    );
};

export default OperationalReports;
