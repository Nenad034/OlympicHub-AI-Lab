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
    User,
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
    Eye,
    FileText,
    Copy,
    Share2,
    Download as DownloadIcon,
    Globe,
    History as HistoryIcon,
    Info,
    Link,
    RotateCcw,
    Maximize2,
    Minimize2
} from 'lucide-react';
import { ModernCalendar } from '../../components/ModernCalendar';
import { useNavigate, NavLink, useSearchParams } from 'react-router-dom';
import { useToast } from '../../components/ui/Toast';
import './OperationalReports.css';

// --- TYPES ---
interface ContractStatus {
    id: string;
    name: string;
    all: number;
    sold: number;
    status: 'Alotman' | 'Fix' | 'On Request' | 'Stop';
}

interface CapacityRecord {
    date: string;
    totalAll: number;
    totalSold: number;
    contracts: ContractStatus[];
    masterStatus: 'Alotman' | 'Fix' | 'On Request' | 'Stop';
}

interface RoomCapacity {
    hotelId: string;
    hotelName: string;
    roomType: string;
    records: Record<string, CapacityRecord>;
}

// --- MOCK DATA ---
const MOCK_CONTRACTS = ['Ugovor A', 'Ugovor B', 'Ugovor C', 'Ugovor Special', 'Last Minute'];

const MOCK_HOTELS = [
    { id: '50', name: 'Hotel Hunguest Sun Resort', destination: 'Herceg Novi', country: 'Crna Gora', category: '4*', roomTypes: ['Double Room', 'Suite', 'Apartment'] },
    { id: '62', name: 'Mitsis Grand Hotel', destination: 'Rhodes', country: 'Grčka', category: '5*', roomTypes: ['Standard Sea View', 'Family Room', 'Executive Suite'] },
    { id: '75', name: 'Rixos Premium Belek', destination: 'Belek', country: 'Turska', category: '5*', roomTypes: ['Deluxe Room', 'Pool Suite', 'Royal King Suite'] },
    { id: '80', name: 'Hotel Splendid', destination: 'Budva', country: 'Crna Gora', category: '5*', roomTypes: ['Superior Room', 'Premium Suite'] },
    { id: '81', name: 'Hotel Budva', destination: 'Budva', country: 'Crna Gora', category: '4*', roomTypes: ['Standard Room', 'Studio'] },
];

const DESTINATIONS = ['Sve', 'Budva', 'Herceg Novi', 'Rhodes', 'Belek'];
const CATEGORIES = ['Sve', '5*', '4*', '3*'];

const MOCK_SUPPLIERS = ['Solvex', 'Fibula', 'Big Blue B2B', 'Direct Hotel', 'Bedsonline'];
const MOCK_BRANCHES = ['Poslovnica Beograd - Centar', 'Poslovnica Novi Sad', 'Poslovnica Niš', 'Online Shop'];

const MOCK_RESERVATIONS = [
    { id: 'R-9452', customer: 'Jovan Jovanović', hotelId: '50', roomType: 'Double Room', checkIn: '2026-06-20', checkOut: '2026-06-30', adults: 2, children: 1, babies: 0, amount: 1250, createdAt: '2026-03-01', status: 'Active', contract: 'Ugovor A', supplier: 'Solvex', subagentId: '1', branchId: null, isB2C: false },
    { id: 'R-9451', customer: 'Marko Marković', hotelId: '62', roomType: 'Standard Sea View', checkIn: '2026-06-21', checkOut: '2026-06-28', adults: 2, children: 0, babies: 1, amount: 1850, createdAt: '2026-03-02', status: 'Active', contract: 'Ugovor B', supplier: 'Fibula', subagentId: null, branchId: '1', isB2C: false },
    { id: 'R-9450', customer: 'Ana Anić', hotelId: '50', roomType: 'Suite', checkIn: '2026-06-20', checkOut: '2026-06-27', adults: 2, children: 2, babies: 0, amount: 2100, createdAt: '2026-03-03', status: 'Reservation', contract: 'Ugovor A', supplier: 'Direct Hotel', subagentId: '2', branchId: null, isB2C: false },
    { id: 'R-9460', customer: 'Petar Petrović', hotelId: '50', roomType: 'Apartment', checkIn: '2026-06-18', checkOut: '2026-06-25', adults: 4, children: 0, babies: 0, amount: 3200, createdAt: '2026-03-04', status: 'Active', contract: 'Ugovor C', supplier: 'Big Blue B2B', subagentId: null, branchId: null, isB2C: true },
    { id: 'R-9461', customer: 'Milica Milić', hotelId: '50', roomType: 'Double Room', checkIn: '2026-06-15', checkOut: '2026-06-18', adults: 2, children: 0, babies: 0, amount: 900, createdAt: '2026-03-05', status: 'Reservation', contract: 'Ugovor B', supplier: 'Solvex', subagentId: '6', branchId: null, isB2C: false },
    { id: 'R-9462', customer: 'Dragan Dragić', hotelId: '50', roomType: 'Suite', checkIn: '2026-06-18', checkOut: '2026-06-28', adults: 2, children: 1, babies: 1, amount: 2400, createdAt: '2026-03-06', status: 'Active', contract: 'Ugovor A', supplier: 'Fibula', subagentId: '1', branchId: null, isB2C: false },
    { id: 'R-9470', customer: 'Zoran Zorić', hotelId: '75', roomType: 'Deluxe Room', checkIn: '2026-07-05', checkOut: '2026-07-15', adults: 2, children: 0, babies: 0, amount: 4500, createdAt: '2026-03-07', status: 'Active', contract: 'Ugovor Special', supplier: 'Bedsonline', subagentId: '9', branchId: null, isB2C: false },
    { id: 'R-9471', customer: 'Savo Savić', hotelId: '75', roomType: 'Pool Suite', checkIn: '2026-07-10', checkOut: '2026-07-20', adults: 2, children: 2, babies: 0, amount: 6200, createdAt: '2026-03-08', status: 'Active', contract: 'Last Minute', supplier: 'Direct Hotel', subagentId: null, branchId: '2', isB2C: false },
    { id: 'R-9472', customer: 'Ivana Ivić', hotelId: '80', roomType: 'Superior Room', checkIn: '2026-06-25', checkOut: '2026-07-05', adults: 2, children: 1, babies: 0, amount: 2800, createdAt: '2026-03-09', status: 'Active', contract: 'Ugovor A', supplier: 'Solvex', subagentId: '1', branchId: null, isB2C: false },
    { id: 'R-9480', customer: 'Nikola Nikolić', hotelId: '62', roomType: 'Family Room', checkIn: '2026-08-01', checkOut: '2026-08-10', adults: 2, children: 2, babies: 1, amount: 3500, createdAt: '2026-03-10', status: 'Reservation', contract: 'Ugovor B', supplier: 'Fibula', subagentId: null, branchId: null, isB2C: true },
    { id: 'R-9481', customer: 'Jelena Jelić', hotelId: '81', roomType: 'Standard Room', checkIn: '2026-07-15', checkOut: '2026-07-25', adults: 2, children: 0, babies: 0, amount: 1600, createdAt: '2026-03-11', status: 'Active', contract: 'Ugovor A', supplier: 'Solvex', subagentId: '12', branchId: null, isB2C: false },
    { id: 'R-9490', customer: 'Bojan Bojić', hotelId: '50', roomType: 'Double Room', checkIn: '2026-06-10', checkOut: '2026-06-17', adults: 2, children: 0, babies: 0, amount: 840, createdAt: '2026-03-12', status: 'Active', contract: 'Ugovor B', supplier: 'Fibula', subagentId: '1', branchId: null, isB2C: false },
    { id: 'R-9491', customer: 'Sanja Savić', hotelId: '62', roomType: 'Standard Sea View', checkIn: '2026-06-12', checkOut: '2026-06-19', adults: 2, children: 1, babies: 0, amount: 1100, createdAt: '2026-03-13', status: 'Active', contract: 'Ugovor B', supplier: 'Direct Hotel', subagentId: '15', branchId: null, isB2C: false },
    { id: 'R-9492', customer: 'Goran Gocić', hotelId: '75', roomType: 'Deluxe Room', checkIn: '2026-07-01', checkOut: '2026-07-10', adults: 2, children: 0, babies: 0, amount: 3800, createdAt: '2026-03-14', status: 'Active', contract: 'Ugovor Special', supplier: 'Solvex', subagentId: null, branchId: '1', isB2C: false },
    { id: 'R-9493', customer: 'Tanja Tanić', hotelId: '80', roomType: 'Superior Room', checkIn: '2026-08-05', checkOut: '2026-08-15', adults: 2, children: 2, babies: 0, amount: 3100, createdAt: '2026-03-15', status: 'Active', contract: 'Ugovor A', supplier: 'Bedsonline', subagentId: '1', branchId: null, isB2C: false },
    { id: 'R-9494', customer: 'Luka Lukić', hotelId: '50', roomType: 'Suite', checkIn: '2026-06-25', checkOut: '2026-07-02', adults: 2, children: 1, babies: 1, amount: 1950, createdAt: '2026-03-16', status: 'Active', contract: 'Ugovor A', supplier: 'Fibula', subagentId: null, branchId: '3', isB2C: false },
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

                // Dynamic split for demo
                const hotelContracts: ContractStatus[] = MOCK_CONTRACTS.slice(0, 3).map((name, idx) => {
                    const baseAlloc = idx === 0 ? 2 : (idx === 1 ? 4 : 6);

                    const soldForContract = MOCK_RESERVATIONS.filter(res => {
                        const checkIn = new Date(res.checkIn).getTime();
                        const checkOut = new Date(res.checkOut).getTime();
                        return res.hotelId === hotel.id &&
                            res.roomType === room &&
                            res.contract === name &&
                            currentDay >= checkIn &&
                            currentDay < checkOut;
                    }).length;

                    return {
                        id: `C-${idx}`,
                        name: name,
                        all: baseAlloc,
                        sold: soldForContract,
                        status: 'Alotman'
                    };
                });

                let totalAll = hotelContracts.reduce((acc, c) => acc + c.all, 0);
                const totalSold = hotelContracts.reduce((acc, c) => acc + c.sold, 0);

                // For demo purposes: make some dates have critical capacity (2 units)
                if (i % 15 === 5) totalAll = totalSold + 2;
                if (i % 15 === 10) totalAll = totalSold + 1;

                records[dateStr] = {
                    date: dateStr,
                    totalAll,
                    totalSold,
                    contracts: hotelContracts,
                    masterStatus: totalSold >= totalAll ? 'Stop' : 'Alotman'
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
    const { addToast } = useToast();
    const notifiedUnits = React.useRef<Set<string>>(new Set());

    useEffect(() => {
        console.log("🚀 OperationalReports module mounted at /operational-reports");
    }, []);

    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'inventory' | 'stats' | 'rooming' | 'analytics'>('inventory');
    const [activeTags, setActiveTags] = useState<string[]>(['Država', 'Destinacija', 'Hotel']);
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
    const [isAllExpanded, setIsAllExpanded] = useState(false);
    const [roomingExpandedRows, setRoomingExpandedRows] = useState<Set<string>>(new Set());
    const [isRoomingAllExpanded, setIsRoomingAllExpanded] = useState(false);
    const [showPublicLinkModal, setShowPublicLinkModal] = useState<string | null>(null);
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
    const [reportTrigger, setReportTrigger] = useState(0);
    const [roomingLang, setRoomingLang] = useState<'sr' | 'en'>('sr');
    const [searchParams] = useSearchParams();
    const isReportOnlyView = searchParams.get('reportView') === 'true';
    const reportEntity = searchParams.get('entity');

    const roomingTranslations = {
        sr: {
            bookingId: "Broj rezervacije",
            stayPeriod: "Termin boravka",
            accommodation: "Smeštaj / Usluga",
            passengerList: "Lista Putnika",
            passport: "Pasoš",
            note: "Napomena",
            nights: "noćenja",
            adl: "Adl",
            chd: "Chd",
            guest: "Gost",
            adult: "Odrasla osoba",
            infant: "Beba (Infant)",
            child: "Dete",
            yrs: "god",
            sendEmail: "Pošalji Hotelu Mejlom",
            hotelLink: "Link za Hotel",
            searchPlaceholder: "Pretraži putnika ili ID...",
            dob: "datum rođenja",
            expandAll: "Raširi Sve (Bulk)",
            collapseAll: "Skupi Sve",
            bulkSend: "Bulk Slanje Mejlom",
            defaultNote: "Uvek slati sobu sa pogledom na more. Putnik je stari klijent."
        },
        en: {
            bookingId: "Booking ID",
            stayPeriod: "Stay Period",
            accommodation: "Accommodation / Service",
            passengerList: "Passenger List",
            passport: "Passport",
            note: "Note / Remarks",
            nights: "nights",
            adl: "Adl",
            chd: "Chd",
            guest: "Guest",
            adult: "Adult",
            infant: "Infant",
            child: "Child",
            yrs: "yrs",
            sendEmail: "Send Email to Hotel",
            hotelLink: "Hotel Link",
            searchPlaceholder: "Search passengers or ID...",
            dob: "date of birth",
            expandAll: "Expand All (Bulk)",
            collapseAll: "Collapse All",
            bulkSend: "Bulk Email Sending",
            defaultNote: "Always send a room with a sea view. The passenger is a long-time client."
        }
    };
    const rt = roomingTranslations[roomingLang];

    const normalizeString = (str: string) => {
        if (!str) return '';
        return str.toLowerCase()
            .replace(/š/g, 's')
            .replace(/đ/g, 'd')
            .replace(/ž/g, 'z')
            .replace(/č/g, 'c')
            .replace(/ć/g, 'c');
    };

    const matchesSearch = (text: string) => {
        if (!searchTerm) return true;
        return normalizeString(text).includes(normalizeString(searchTerm));
    };

    useEffect(() => {
        const tab = searchParams.get('tab');
        if (tab && ['inventory', 'stats', 'rooming', 'analytics'].includes(tab)) {
            setActiveTab(tab as any);
        }

        if (isReportOnlyView) {
            const type = searchParams.get('type');
            if (type === 'analytics') {
                setActiveTab('analytics');
                const tags = searchParams.get('tags');
                if (tags) {
                    setActiveTags(tags.split(','));
                }
            }
        }
    }, [isReportOnlyView, searchParams]);

    const MOCK_SUBAGENTS = [
        { id: '1', name: 'Fly Travel', email: 'fly-travel@gmail.com', city: 'Budva', country: 'Crna Gora', active: true },
        { id: '2', name: 'Alun Travel', email: 'alun@aluntravel.me', city: 'Podgorica', country: 'Crna Gora', active: true },
        { id: '3', name: 'Boka Explorer', email: 'info@boka-explorer.com', city: 'Kotor', country: 'Crna Gora', active: true },
        { id: '4', name: 'Sun & Sea', email: 'sun-sea@yahoo.com', city: 'Bar', country: 'Crna Gora', active: true },
        { id: '5', name: 'Olimpik Travel', email: 'booking@olimpik.com', city: 'Berane', country: 'Crna Gora', active: true },
        { id: '6', name: 'Nenad Tomić', email: 'nenad.tomic1403@gmail.com', city: 'Beograd', country: 'Srbija', active: true },
        { id: '7', name: 'Olimpic Travel SRB', email: 'contact@olimpic.rs', city: 'Beograd', country: 'Srbija', active: true },
        { id: '8', name: 'Sabra Travel', email: 'office@sabra.rs', city: 'Novi Sad', country: 'Srbija', active: true },
        { id: '9', name: 'Big Blue', email: 'info@bigblue.rs', city: 'Beograd', country: 'Srbija', active: true },
        { id: '10', name: 'Kontiki Travel', email: 'booking@kontiki.rs', city: 'Beograd', country: 'Srbija', active: true },
        { id: '11', name: 'Wayout', email: 'info@wayout.rs', city: 'Beograd', country: 'Srbija', active: true },
        { id: '12', name: 'Mona Travel', email: 'office@monatravel.me', city: 'Budva', country: 'Crna Gora', active: true },
        { id: '13', name: 'Trend Travel', email: 'trend@travel.me', city: 'Herceg Novi', country: 'Crna Gora', active: true },
        { id: '14', name: 'Adria Line', email: 'info@adrialine.me', city: 'Budva', country: 'Crna Gora', active: true },
        { id: '15', name: 'Grand Travel', email: 'grand@travel.rs', city: 'Novi Sad', country: 'Srbija', active: true },
        { id: '16', name: 'Astra Travel', email: 'astra@travel.rs', city: 'Niš', country: 'Srbija', active: true },
        { id: '17', name: 'Filip Travel', email: 'booking@filiptravel.rs', city: 'Beograd', country: 'Srbija', active: true },
        { id: '18', name: 'Odeon World Travel', email: 'info@odeon.rs', city: 'Beograd', country: 'Srbija', active: true },
        { id: '19', name: 'Argus Tours', email: 'argus@tours.rs', city: 'Beograd', country: 'Srbija', active: true },
        { id: '20', name: 'Plana Tours', email: 'office@planatours.rs', city: 'Beograd', country: 'Srbija', active: true },
        { id: '21', name: 'Jungle Tribe', email: 'jungle@tribe.rs', city: 'Beograd', country: 'Srbija', active: true },
        { id: '22', name: 'Viva Travel', email: 'viva@travel.rs', city: 'Beograd', country: 'Srbija', active: true },
        { id: '23', name: 'Rapsody Travel', email: 'rapsody@travel.rs', city: 'Beograd', country: 'Srbija', active: true },
        { id: '24', name: 'Lider Travel', email: 'lider@travel.rs', city: 'Niš', country: 'Srbija', active: true },
        { id: '25', name: 'Eurojet', email: 'eurojet@travel.rs', city: 'Beograd', country: 'Srbija', active: true },
        { id: '26', name: 'Robinson', email: 'office@robinson.rs', city: 'Beograd', country: 'Srbija', active: true },
        { id: '27', name: 'Spirit Travel', email: 'spirit@travel.rs', city: 'Novi Sad', country: 'Srbija', active: true },
        { id: '28', name: 'Manga Trip', email: 'manga@trip.rs', city: 'Beograd', country: 'Srbija', active: true },
        { id: '29', name: 'Travelland', email: 'office@travelland.rs', city: 'Beograd', country: 'Srbija', active: true }
    ];

    const [reportFilterCountry, setReportFilterCountry] = useState<string>('Sve');
    const [reportFilterCity, setReportFilterCity] = useState<string>('Sve');
    const [agentSearchQuery, setAgentSearchQuery] = useState('');
    const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>(MOCK_SUBAGENTS.map(a => a.id));
    const [reportCurrentPage, setReportCurrentPage] = useState(1);
    const agentsPerPage = 20;

    const countries = useMemo(() => ['Sve', ...new Set(MOCK_SUBAGENTS.map(a => a.country))], []);
    const cities = useMemo(() => {
        const filtered = reportFilterCountry === 'Sve' ? MOCK_SUBAGENTS : MOCK_SUBAGENTS.filter(a => a.country === reportFilterCountry);
        return ['Sve', ...new Set(filtered.map(a => a.city))];
    }, [reportFilterCountry]);

    const filteredAgents = useMemo(() => {
        setReportCurrentPage(1); // Reset pagination on filter change
        return MOCK_SUBAGENTS.filter(a => {
            const countryMatch = reportFilterCountry === 'Sve' || a.country === reportFilterCountry;
            const cityMatch = reportFilterCity === 'Sve' || a.city === reportFilterCity;
            const searchMatch = a.name.toLowerCase().includes(agentSearchQuery.toLowerCase()) ||
                a.email.toLowerCase().includes(agentSearchQuery.toLowerCase());
            return countryMatch && cityMatch && searchMatch;
        });
    }, [reportFilterCountry, reportFilterCity, agentSearchQuery]);

    const paginatedAgents = useMemo(() => {
        const start = (reportCurrentPage - 1) * agentsPerPage;
        return filteredAgents.slice(start, start + agentsPerPage);
    }, [filteredAgents, reportCurrentPage]);

    const totalReportPages = Math.ceil(filteredAgents.length / agentsPerPage);

    // --- GLOBAL FILTERS ---
    const [bookingFrom, setBookingFrom] = useState('2026-01-01');
    const [bookingTo, setBookingTo] = useState('2026-12-31');
    const [stayFrom, setStayFrom] = useState('2026-06-01');
    const [stayTo, setStayTo] = useState('2026-08-31');

    // Multi-select and searchable filters
    const [selectedDestinations, setSelectedDestinations] = useState<string[]>([]);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
    const [hotelFilter, setHotelFilter] = useState('');
    const [showBookingCal, setShowBookingCal] = useState(false);
    const [showStayCal, setShowStayCal] = useState(false);
    const [showGridCal, setShowGridCal] = useState(false);

    const formatDateRange = (start: string, end: string) => {
        if (!start || !end) return 'Odaberite datum';
        const s = new Date(start);
        const e = new Date(end);
        const formatOptions: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric' };
        return `${s.toLocaleDateString('sr-Latn-RS', formatOptions)} - ${e.toLocaleDateString('sr-Latn-RS', formatOptions)}`;
    };

    // --- CAPACITY STATE ---
    const [allCapacities, setAllCapacities] = useState<RoomCapacity[]>(() =>
        GENERATE_MOCK_CAPACITIES(MOCK_HOTELS)
    );

    // Monitoring for low capacity alerts
    useEffect(() => {
        let alertsCount = 0;
        allCapacities.forEach(cap => {
            Object.entries(cap.records).forEach(([dateStr, rec]) => {
                const avail = rec.totalAll - rec.totalSold;
                const unitId = `${cap.hotelId}-${cap.roomType}-${dateStr}`;

                // Only notify for positive low capacity (1 or 2) and skip if already notified
                if (avail <= 2 && avail > 0 && !notifiedUnits.current.has(unitId)) {
                    if (alertsCount < 3) { // Limit initial burst of notifications
                        if (avail === 1) {
                            addToast({
                                type: 'error',
                                title: "DANGER: Samo 1 jedinica!",
                                message: `Hotel: ${cap.hotelName}, Soba: ${cap.roomType} (${dateStr}). Hitno zatvaranje prodaje!`,
                                duration: 10000
                            });
                        } else {
                            addToast({
                                type: 'warning',
                                title: "Upozorenje: 2 jedinice",
                                message: `Nizak nivo za ${cap.hotelName} (${cap.roomType}) na dan ${dateStr}.`,
                                duration: 10000
                            });
                        }
                        alertsCount++;
                    }
                    notifiedUnits.current.add(unitId);
                }
            });
        });
    }, [allCapacities, addToast]);

    const groupedData = useMemo(() => {
        const hasSelection = selectedDestinations.length > 0 || selectedCategories.length > 0 || hotelFilter.trim() !== '';
        if (!hasSelection && reportTrigger === 0 && !isReportOnlyView) return [];

        const filtered = allCapacities.filter(cap => {
            const hotel = MOCK_HOTELS.find(h => h.id === cap.hotelId);
            const matchesDest = selectedDestinations.length === 0 ||
                selectedDestinations.includes(hotel?.destination || '') ||
                selectedDestinations.includes(hotel?.country || '');
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

            // DYNAMICALLY CALCULATE SOLD BASED ON BOOKING FILTERS
            const dynamicCap = { ...cap };
            const newRecords = { ...cap.records };

            Object.keys(newRecords).forEach(dateStr => {
                const currentDay = new Date(dateStr).getTime();

                // Filter reservations by booking date AND stay date
                const soldForDay = MOCK_RESERVATIONS.filter(res => {
                    const checkIn = new Date(res.checkIn).getTime();
                    const checkOut = new Date(res.checkOut).getTime();
                    const isWithinBookingRange = res.createdAt >= bookingFrom && res.createdAt <= bookingTo;
                    const isWithinStayRange = currentDay >= checkIn && currentDay < checkOut;

                    return res.hotelId === cap.hotelId &&
                        res.roomType === cap.roomType &&
                        isWithinBookingRange &&
                        isWithinStayRange;
                });

                const totalSold = soldForDay.length;

                // Update contracts sold counts too
                const updatedContracts = newRecords[dateStr].contracts.map(c => ({
                    ...c,
                    sold: soldForDay.filter(r => r.contract === c.name).length
                }));

                newRecords[dateStr] = {
                    ...newRecords[dateStr],
                    totalSold,
                    contracts: updatedContracts,
                    masterStatus: totalSold >= newRecords[dateStr].totalAll ? 'Stop' : newRecords[dateStr].masterStatus
                };
            });

            dynamicCap.records = newRecords;
            groups[cap.hotelId].rooms.push(dynamicCap);
        });
        return Object.values(groups);
    }, [allCapacities, selectedDestinations, selectedCategories, hotelFilter, bookingFrom, bookingTo, reportTrigger, isReportOnlyView]);

    const toggleHotel = (id: string) => {
        const newExpanded = new Set(expandedHotels);
        if (newExpanded.has(id)) newExpanded.delete(id);
        else newExpanded.add(id);
        setExpandedHotels(newExpanded);
    };

    // --- MOCK DATA FOR DROPDOWNS ---
    const UNIFIED_GEO_OPTIONS = useMemo(() => {
        const countries = Array.from(new Set(MOCK_HOTELS.map(h => h.country)));
        const destinations = Array.from(new Set(MOCK_HOTELS.map(h => h.destination)));
        return [...countries, ...destinations];
    }, []);
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
    const [capBookingFrom, setCapBookingFrom] = useState('2026-01-01');
    const [capBookingTo, setCapBookingTo] = useState('2026-12-31');
    const [capRooms, setCapRooms] = useState<string[]>([]);
    const [capValue, setCapValue] = useState<string>("10");
    const [capStatus, setCapStatus] = useState<CapacityRecord['masterStatus']>('Alotman');
    const [capSelectedContract, setCapSelectedContract] = useState<string>('Svi Ugovori');
    const [showCapStartCal, setShowCapStartCal] = useState(false);
    const [showCapEndCal, setShowCapEndCal] = useState(false);
    const [showCapBookStartCal, setShowCapBookStartCal] = useState(false);
    const [showCapBookEndCal, setShowCapBookEndCal] = useState(false);
    const [showReviewPreview, setShowReviewPreview] = useState(false);
    const [capOverwrite, setCapOverwrite] = useState(false);
    const [showLogsModal, setShowLogsModal] = useState(false);
    const [wizardVersion, setWizardVersion] = useState<'classic' | 'studio'>('classic');

    // Audit Trail Storage (Mock)
    const [capacityLogs, setCapacityLogs] = useState<any[]>([
        { id: 1, user: 'Nenad P.', action: 'Ažuriranje', hotel: 'Hotel Hunguest Sun Resort', room: 'Double Room', period: '01.06 - 15.06.2026', change: '+5', timestamp: '2026-03-05 09:15' },
        { id: 2, user: 'Admin', action: 'Prebrisano', hotel: 'Mitsis Grand Hotel', room: 'Suite Pool View', period: '10.07.2026', change: 'Set 12', timestamp: '2026-03-05 08:30' }
    ]);

    // Tiered Search State & Search Inputs
    const [capCountry, setCapCountry] = useState('');
    const [capCountryQuery, setCapCountryQuery] = useState('');
    const [showCountryChoices, setShowCountryChoices] = useState(false);

    const [capDest, setCapDest] = useState('');
    const [capDestQuery, setCapDestQuery] = useState('');
    const [showDestChoices, setShowDestChoices] = useState(false);

    const [capHotelSearch, setCapHotelSearch] = useState('');

    const hotelCountries = useMemo(() => Array.from(new Set(MOCK_HOTELS.map(h => h.country))).sort(), []);
    const filteredCountriesList = useMemo(() =>
        hotelCountries.filter(c => c.toLowerCase().includes(capCountryQuery.toLowerCase())),
        [hotelCountries, capCountryQuery]);

    const filteredDests = useMemo(() => {
        const dests = MOCK_HOTELS.filter(h => !capCountry || h.country === capCountry).map(h => h.destination);
        return Array.from(new Set(dests)).sort();
    }, [capCountry]);

    const filteredDestsList = useMemo(() =>
        filteredDests.filter(d => d.toLowerCase().includes(capDestQuery.toLowerCase())),
        [filteredDests, capDestQuery]);

    const filteredHotelsForWizard = useMemo(() => {
        return MOCK_HOTELS.filter(h => {
            const matchCountry = !capCountry || h.country === capCountry;
            const matchDest = !capDest || h.destination === capDest;
            const matchSearch = !capHotelSearch || h.name.toLowerCase().includes(capHotelSearch.toLowerCase());
            return matchCountry && matchDest && matchSearch;
        });
    }, [capCountry, capDest, capHotelSearch]);

    const generateTextInventoryReport = () => {
        let report = `<strong>*** TEXT INVENTORY REPORT</strong> - ${new Date().toLocaleString('sr-RS')} ***\n\n`;
        report += `<strong>PERIOD BUKIRANJA:</strong> ${new Date(bookingFrom).toLocaleDateString()} - ${new Date(bookingTo).toLocaleDateString()}\n`;
        report += `<strong>DESTINACIJE:</strong> ${selectedDestinations.length > 0 ? selectedDestinations.join(', ') : 'Sve'}\n`;
        report += `------------------------------------------------------------\n\n`;

        groupedData.forEach(group => {
            report += `<strong>HOTEL: ${group.hotel.name.toUpperCase()}</strong> (${group.hotel.destination}, ${group.hotel.country})\n`;

            group.rooms.forEach(room => {
                report += `  <strong>> TIP SOBE: ${room.roomType}</strong>\n`;

                const dates = Object.keys(room.records).sort().slice(0, 10);
                dates.forEach(d => {
                    const rec = room.records[d];
                    const avail = rec.totalAll - rec.totalSold;
                    report += `    <span style="color: #991b1b;">[${d}] Kapacitet: ${rec.totalAll} | Prodato: ${rec.totalSold} | Slobodno: ${avail} | Status: ${rec.masterStatus}</span>\n`;

                    if (rec.contracts && rec.contracts.length > 0) {
                        report += `      <strong>DETALJI PO UGOVORIMA:</strong>\n`;
                        rec.contracts.forEach(c => {
                            report += `      - ${c.name.padEnd(15)} | Kvota: ${c.all} | Prodato: ${c.sold} | Status: ${c.status}\n`;
                        });
                    }
                });
                report += `\n`;
            });
            report += `============================================================\n\n`;
        });

        return report;
    };

    const handleDateClick = (date: Date, hotelInfo?: any) => {
        const dateStr = date.toISOString().split('T')[0];
        setPulseDate(dateStr);
        if (hotelInfo) setSelectedHotel(hotelInfo);
        setShowDailyPulse(true);
    };

    const handleSaveCapacity = () => {
        const val = parseInt(capValue);
        const isIncrement = capValue.startsWith('-') || capValue.startsWith('+');

        const updated = allCapacities.map(cap => {
            if (cap.hotelId === selectedHotel.id && capRooms.includes(cap.roomType)) {
                const newRecords = { ...cap.records };
                const start = new Date(capDateFrom);
                const end = new Date(capDateTo);

                for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                    const dateStr = d.toISOString().split('T')[0];
                    if (newRecords[dateStr]) {
                        const rec = { ...newRecords[dateStr] };

                        // Determine the new totalAll value based on capOverwrite and isIncrement
                        let newTotalAll;
                        if (capOverwrite) {
                            newTotalAll = Math.max(0, val);
                        } else if (isIncrement) {
                            newTotalAll = Math.max(0, rec.totalAll + val);
                        } else { // Absolute value when not incrementing and not overwriting
                            newTotalAll = Math.max(0, val);
                        }
                        rec.totalAll = newTotalAll;
                        rec.masterStatus = capStatus;

                        if (capSelectedContract === 'Svi Ugovori') {
                            rec.contracts = rec.contracts.map(c => ({
                                ...c,
                                all: capOverwrite ? Math.max(0, val) : (isIncrement ? Math.max(0, c.all + val) : Math.max(0, val)),
                                status: capStatus
                            }));
                        } else {
                            rec.contracts = rec.contracts.map(c =>
                                c.name === capSelectedContract
                                    ? { ...c, all: capOverwrite ? Math.max(0, val) : (isIncrement ? Math.max(0, c.all + val) : Math.max(0, val)), status: capStatus }
                                    : c
                            );
                        }
                        newRecords[dateStr] = rec;
                    }
                }
                return { ...cap, records: newRecords };
            }
            return cap;
        });

        const newLogEntry = {
            id: Date.now(),
            user: 'Trenutni Korisnik',
            action: capOverwrite ? 'Prebrisano' : 'Ažuriranje',
            hotel: selectedHotel.name,
            room: capRooms.join(', '),
            period: `${new Date(capDateFrom).toLocaleDateString()} - ${new Date(capDateTo).toLocaleDateString()}`,
            change: capOverwrite ? `Postavljeno: ${capValue}` : `Promena: ${capValue.startsWith('-') || capValue.startsWith('+') ? '' : '+'}${capValue}`,
            timestamp: new Date().toLocaleString()
        };

        setCapacityLogs(prev => [newLogEntry, ...prev]);
        setAllCapacities(updated);
        setShowCapacityModal(false);
        setShowReviewPreview(false);
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

    const AnalyticsRow = ({ row, level = 0 }: { row: any; level?: number }) => {
        const isExpanded = expandedRows.has(row.id);
        const hasChildren = row.children && row.children.length > 0;

        return (
            <>
                <tr className={`drill-row ${isExpanded ? 'expanded' : ''}`}>
                    <td style={{ paddingLeft: `${level * 40 + 20}px` }}>
                        <div className="drill-cell-name">
                            {hasChildren ? (
                                <button
                                    className={`drill-expand-btn ${isExpanded ? 'active' : ''}`}
                                    onClick={() => {
                                        const newExpanded = new Set(expandedRows);
                                        if (isExpanded) newExpanded.delete(row.id);
                                        else newExpanded.add(row.id);
                                        setExpandedRows(newExpanded);
                                    }}
                                >
                                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                                </button>
                            ) : <div style={{ width: 24 }} />}
                            <div>
                                <div style={{ fontSize: '14px', fontWeight: 700 }}>{row.name}</div>
                                <div className="drill-level-badge">{row.levelName}</div>
                            </div>
                        </div>
                    </td>
                    <td />
                    <td>
                        <span className="kpi-value">{row.count}</span>
                        <span className="kpi-label">Rezervacija</span>
                    </td>
                    <td>
                        <span className="kpi-value">{row.pax}</span>
                        <span className="kpi-label">PAX</span>
                    </td>
                    <td>
                        <span className="kpi-value">{row.revenue.toLocaleString('sr-RS')} €</span>
                        <span className="kpi-label">Revenue</span>
                    </td>
                    <td>
                        <span className="kpi-value">{row.personNights}</span>
                        <span className="kpi-label">Noćenja (PAX x N)</span>
                    </td>
                    <td>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button className="action-pill" onClick={() => setShowReportModal({ show: true, type: 'free' })}>
                                <FileText size={14} /> Report
                            </button>
                            <button className="action-pill" onClick={() => setShowPublicLinkModal(row.name)}>
                                <Link size={14} /> Link
                            </button>
                            <button className="action-pill" onClick={() => alert(`Slanje detaljnog izveštaja za: ${row.name}`)} style={{ color: '#3b82f6', background: '#eff6ff', borderColor: '#bfdbfe' }}>
                                <Mail size={14} /> Slanje
                            </button>
                        </div>
                    </td>
                </tr>
                {isExpanded && row.children.map((child: any) => (
                    <AnalyticsRow key={child.id} row={child} level={level + 1} />
                ))}
            </>
        );
    };
    const getDimensionValue = (res: any, tag: string) => {
        const hotel = MOCK_HOTELS.find(h => h.id === res.hotelId);
        const subagent = MOCK_SUBAGENTS.find(s => s.id === res.subagentId);
        switch (tag) {
            case 'Država': return hotel?.country || 'Nepoznato';
            case 'Destinacija': return hotel?.destination || 'Nepoznato';
            case 'Hotel': return hotel?.name || 'Nepoznato';
            case 'Dobavljač': return res.supplier || 'Direktno';
            case 'Subagent': return subagent?.name || 'Direktna Prodaja';
            case 'Poslovnica': return res.branchId ? MOCK_BRANCHES[parseInt(res.branchId) - 1] : 'Nema';
            case 'B2C': return res.isB2C ? 'Online (B2C)' : 'Partneri (B2B)';
            default: return 'N/A';
        }
    };

    const analyticsData = useMemo(() => {
        const filtered = MOCK_RESERVATIONS.filter(r =>
            (r.createdAt >= bookingFrom && r.createdAt <= bookingTo) &&
            (r.checkIn >= stayFrom && r.checkIn <= stayTo)
        );

        const groupRecursive = (data: any[], tags: string[], level: number, parentId: string = ''): any[] => {
            if (level >= tags.length) return [];
            const tag = tags[level];
            const groups: Record<string, any[]> = {};

            data.forEach(r => {
                const val = getDimensionValue(r, tag);
                if (!groups[val]) groups[val] = [];
                groups[val].push(r);
            });

            return Object.entries(groups).map(([name, items]) => {
                const id = `${parentId}|${name}`;
                const revenue = items.reduce((acc, r) => acc + r.amount, 0);
                const pax = items.reduce((acc, r) => acc + (r.adults + r.children + r.babies), 0);
                const nights = items.reduce((acc, r) => {
                    const n = Math.max(1, Math.ceil((new Date(r.checkOut).getTime() - new Date(r.checkIn).getTime()) / 86400000));
                    return acc + n;
                }, 0);

                return {
                    id,
                    name,
                    levelName: tag,
                    count: items.length,
                    revenue,
                    pax,
                    nights,
                    personNights: items.reduce((acc, r) => {
                        const n = Math.max(1, Math.ceil((new Date(r.checkOut).getTime() - new Date(r.checkIn).getTime()) / 86400000));
                        const p = r.adults + r.children + r.babies;
                        return acc + (n * p);
                    }, 0),
                    children: groupRecursive(items, tags, level + 1, id)
                };
            });
        };

        return groupRecursive(filtered, activeTags, 0);
    }, [activeTags, bookingFrom, bookingTo, stayFrom, stayTo, reportTrigger]);

    const handleExpandAll = () => {
        const allIds = new Set<string>();
        const collectIds = (rows: any[]) => {
            rows.forEach(row => {
                allIds.add(row.id);
                if (row.children) collectIds(row.children);
            });
        };
        collectIds(analyticsData);
        setExpandedRows(allIds);
        setIsAllExpanded(true);
    };

    const handleCollapseAll = () => {
        setExpandedRows(new Set());
        setIsAllExpanded(false);
    };

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
        const type = searchParams.get('type');

        if (type === 'analytics') {
            return (
                <div className="full-report-standalone analytics-standalone">
                    <style>{`
                        /* Nuclear Hide: Kill app navigation */
                        header, nav, aside, .top-header, .main-menu, .navbar, .sidebar { display: none !important; }
                        #root, .app-container, .main-layout { padding: 0 !important; margin: 0 !important; overflow: visible !important; }

                        .analytics-standalone {
                            position: fixed;
                            inset: 0;
                            background: #f8fafc;
                            z-index: 99999999;
                            overflow-y: auto;
                            color: #1e293b;
                            font-family: 'Outfit', sans-serif;
                            padding: 40px;
                        }

                        .analytics-standalone .report-wrapper {
                            margin: 0 auto;
                            max-width: 1200px;
                            background: #fff;
                            border-radius: 16px;
                            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                            padding: 40px;
                        }

                        .analytics-standalone .report-header {
                            display: flex;
                            justify-content: space-between;
                            align-items: flex-start;
                            margin-bottom: 40px;
                            padding-bottom: 20px;
                            border-bottom: 2px solid #e2e8f0;
                        }

                        .analytics-standalone .drill-down-table {
                            width: 100%;
                            border-collapse: collapse;
                            margin-top: 20px;
                            background: white;
                        }

                        .analytics-standalone .drill-down-table th {
                            background: #f8fafc;
                            padding: 16px 20px;
                            text-align: left;
                            font-size: 11px;
                            font-weight: 800;
                            color: #64748b;
                            text-transform: uppercase;
                            border-bottom: 2px solid #e2e8f0;
                            letter-spacing: 0.5px;
                        }

                        .analytics-standalone .drill-down-table td {
                            padding: 16px 20px;
                            border-bottom: 1px solid #f1f5f9;
                            color: #1e293b;
                        }
                    `}</style>
                    <div className="report-wrapper">
                        <div className="report-header">
                            <div>
                                <h1 style={{ margin: '0 0 10px 0', fontSize: '28px', fontWeight: 800, color: '#0f172a' }}>
                                    B2B Analytics Report
                                </h1>
                                <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
                                    Entity: <strong style={{ color: '#3b82f6' }}>{reportEntity || 'All'}</strong> <br />
                                    Filteri: <strong style={{ color: '#64748b' }}>{activeTags.join(' > ')}</strong>
                                </p>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '12px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>
                                    Kreirano
                                </div>
                                <div style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a' }}>
                                    {new Date().toLocaleDateString('sr-Latn-RS', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                </div>
                            </div>
                        </div>

                        <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '30px' }}>
                            <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '10px' }}>
                                <strong>Period Prodaje:</strong> {new Date(bookingFrom).toLocaleDateString()} - {new Date(bookingTo).toLocaleDateString()}
                            </div>
                            <div style={{ fontSize: '12px', color: '#64748b' }}>
                                <strong>Period Boravka:</strong> {new Date(stayFrom).toLocaleDateString()} - {new Date(stayTo).toLocaleDateString()}
                            </div>
                        </div>

                        <table className="drill-down-table">
                            <thead>
                                <tr>
                                    <th>Struktura Rezultata (Drill-down)</th>
                                    <th></th>
                                    <th>Rezervacije</th>
                                    <th>Putnici</th>
                                    <th>Promet (Revenue)</th>
                                    <th>Noćenja</th>
                                    <th></th>
                                </tr>
                            </thead>
                            <tbody>
                                {analyticsData.length > 0 ? (
                                    analyticsData.map(row => (
                                        <AnalyticsRow key={row.id} row={row} />
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                                            Nema podataka za prikaz
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            );
        }

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
                                                    let worstStatus: CapacityRecord['masterStatus'] = 'Alotman';
                                                    group.rooms.forEach(r => {
                                                        const rec = r.records[dateStr];
                                                        if (rec?.masterStatus === 'Stop') worstStatus = 'Stop';
                                                        else if (rec?.masterStatus === 'On Request' && worstStatus !== 'Stop') worstStatus = 'On Request';
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
                                                        const status = rec?.masterStatus || 'Alotman';
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
                            className={`op-tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
                            onClick={() => setActiveTab('analytics')}
                        >
                            <TrendingUp size={18} />
                            Dynamic Analytics
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
                            {monthNames[selectedDate.getMonth()]} {selectedDate.getFullYear()}
                        </span>
                        <button className="btn-icon" onClick={() => setSelectedDate(new Date(selectedDate.getTime() + 7 * 86400000))}>
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>

                <div className="filter-divider" />

                <div className="filter-group">
                    <label>Rezervacije (od-do)</label>
                    <div className="date-field-modern" onClick={() => setShowBookingCal(true)}>
                        <CalendarIcon size={14} className="df-icon" />
                        <span className="df-value">{formatDateRange(bookingFrom, bookingTo)}</span>
                    </div>
                </div>

                <div className="filter-divider" />

                <div className="filter-group">
                    <label>Period Boravka</label>
                    <div className="date-field-modern" onClick={() => setShowStayCal(true)}>
                        <Users size={14} className="df-icon" />
                        <span className="df-value">{formatDateRange(stayFrom, stayTo)}</span>
                    </div>
                </div>
                <div className="filter-divider" />

                <div className="adv-filters-group">
                    <SearchableMultiSelect
                        label="Destinacija (Država / Grad)"
                        options={UNIFIED_GEO_OPTIONS}
                        selected={selectedDestinations}
                        onChange={setSelectedDestinations}
                        icon={MapPin}
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

                    <SearchableMultiSelect
                        label="Kategorija"
                        options={CAT_OPTIONS}
                        selected={selectedCategories}
                        onChange={setSelectedCategories}
                        icon={Tag}
                    />
                </div>

                <div className="filter-divider" />

                <button
                    className="btn-create-cap apply-filters-btn"
                    style={{
                        background: 'var(--accent)',
                        alignSelf: 'center',
                        height: '42px',
                        padding: '0 25px',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        color: 'white',
                        fontWeight: 800,
                        border: 'none',
                        cursor: 'pointer',
                        boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)'
                    }}
                    onClick={() => {
                        setReportTrigger(prev => prev + 1);
                    }}
                >
                    <PieChart size={18} /> Prikaži Izveštaj
                </button>
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
                                    <button className="op-header-btn logs" onClick={() => setShowLogsModal(true)}>
                                        <HistoryIcon size={18} /> Istorija (Logs)
                                    </button>
                                    <button className="op-header-btn mail" onClick={() => alert('Slanje Inventory izveštaja svim hotelima u gridu.')}>
                                        <Mail size={18} /> Pošalji Svima
                                    </button>
                                    <button className="op-header-btn report" onClick={() => setShowReportModal({ show: true, type: 'stop' })}>
                                        <CalendarIcon size={18} /> Inventory Report
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
                                                        <div className="th-top-row">
                                                            <span className="th-day-name">{date.toLocaleDateString('sr-Latn-RS', { weekday: 'short' }).replace('.', '').toUpperCase()}</span>
                                                            <span className="th-day-num">{date.getDate()}</span>
                                                        </div>
                                                        <div className="th-bottom-row">
                                                            <span className="th-month-name">
                                                                {date.toLocaleDateString('sr-Latn-RS', { month: 'short' }).replace('.', '').toUpperCase()}
                                                                <span className="th-year-label">{date.getFullYear()}</span>
                                                            </span>
                                                        </div>
                                                    </div>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {groupedData.length === 0 ? (
                                            <tr>
                                                <td colSpan={dates.length + 1} style={{ padding: '100px 0', textAlign: 'center' }}>
                                                    <motion.div
                                                        initial={{ opacity: 0, y: 20 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        style={{
                                                            display: 'flex',
                                                            flexDirection: 'column',
                                                            alignItems: 'center',
                                                            gap: '15px'
                                                        }}
                                                    >
                                                        <div style={{
                                                            width: '80px',
                                                            height: '80px',
                                                            borderRadius: '50%',
                                                            background: 'var(--accent-glow)',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            color: 'var(--accent)',
                                                            marginBottom: '10px'
                                                        }}>
                                                            <PieChart size={40} />
                                                        </div>
                                                        <h3 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>Izveštaj je prazan</h3>
                                                        <p style={{ color: 'var(--text-secondary)', maxWidth: '400px', margin: '0 auto', fontSize: '15px', lineHeight: '1.6' }}>
                                                            Odaberite <strong>destinaciju</strong>, <strong>kategoriju</strong> ili pretražite specifičan <strong>hotel</strong> u filterima iznad kako biste generisali izveštaj.
                                                        </p>
                                                        <button
                                                            className="btn-primary"
                                                            style={{ marginTop: '10px', padding: '12px 30px', borderRadius: '14px', background: 'var(--accent)' }}
                                                            onClick={(e) => {
                                                                const searchInput = document.querySelector('.hotel-search-box input') as HTMLInputElement;
                                                                if (searchInput) searchInput.focus();
                                                            }}
                                                        >
                                                            Započni pretragu
                                                        </button>
                                                    </motion.div>
                                                </td>
                                            </tr>
                                        ) : (
                                            <>
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
                                                                        <button
                                                                            className="btn-action-small"
                                                                            title="Pošalji izveštaj hotelu"
                                                                            onClick={(e) => { e.stopPropagation(); alert(`Slanje Inventory izveštaja za: ${group.hotel?.name}`); }}
                                                                            style={{ marginLeft: 'auto', marginRight: '5px', background: 'transparent', border: 'none', color: '#3b82f6' }}
                                                                        >
                                                                            <Mail size={18} />
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                                {dates.map((date, dIdx) => {
                                                                    const dateStr = date.toISOString().split('T')[0];
                                                                    let hTotalAll = 0, hTotalSold = 0;
                                                                    group.rooms.forEach(r => {
                                                                        const rec = r.records[dateStr];
                                                                        if (rec) {
                                                                            hTotalAll += rec.totalAll;
                                                                            hTotalSold += rec.totalSold;
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
                                                                                <div className="cap-avail-tag-wrapper">
                                                                                    <span className={`cap-available-tag ${avail === 2 ? 'critical-warn' : avail === 1 ? 'critical-danger' : ''}`}>{avail}</span>
                                                                                </div>
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
                                                                        const available = rec.totalAll - rec.totalSold;
                                                                        const occPercent = rec.totalAll > 0 ? Math.round((rec.totalSold / rec.totalAll) * 100) : 0;
                                                                        const statusClass = `stat-${rec.masterStatus.replace(' ', '-')}`;

                                                                        return (
                                                                            <td key={dIdx} className={`cap-cell ${statusClass}`} onClick={() => handleDateClick(date, group.hotel)}>
                                                                                <div className="cap-content">
                                                                                    <span className="cap-total">{rec.totalAll}</span>
                                                                                    <span className="cap-sold">{rec.totalSold}</span>
                                                                                    <div className="cap-meta-info">
                                                                                        <span className="cap-occ-mini">{occPercent}%</span>
                                                                                        <span className="cap-status-badge">{rec.masterStatus.substring(0, 3)}</span>
                                                                                    </div>
                                                                                    <div className="cap-avail-tag-wrapper">
                                                                                        <span className={`cap-available-tag small ${available === 2 ? 'critical-warn' : available === 1 ? 'critical-danger' : ''}`}>{available}</span>
                                                                                    </div>
                                                                                </div>
                                                                            </td>
                                                                        );
                                                                    })}
                                                                </motion.tr>
                                                            ))}
                                                        </React.Fragment>
                                                    );
                                                })}
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
                                                                    totalAll += rec.totalAll;
                                                                    totalSold += rec.totalSold;
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
                                                                    <div className="cap-avail-tag-wrapper">
                                                                        <span className={`cap-available-tag ${available === 2 ? 'critical-warn' : available === 1 ? 'critical-danger' : ''}`}>{available}</span>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        );
                                                    })}
                                                </tr>
                                            </>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'stats' && (
                        <motion.div
                            key="stats"
                            initial="hidden"
                            animate="show"
                            variants={{
                                hidden: { opacity: 0 },
                                show: {
                                    opacity: 1,
                                    transition: {
                                        staggerChildren: 0.1
                                    }
                                }
                            }}
                            className="stats-view"
                        >
                            <div className="stats-header-actions" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <div>
                                    <h2 className="section-subtitle">Pregled PAX Statistike</h2>
                                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>Analitika za period: <strong>{new Date(stayFrom).toLocaleDateString()} - {new Date(stayTo).toLocaleDateString()}</strong></p>
                                </div>
                                <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                                    <button className="op-btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '12px' }}>
                                        <Download size={18} /> Export Excel
                                    </button>
                                    <button
                                        className="btn-primary"
                                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '12px', background: '#3b82f6' }}
                                        onClick={() => alert('Slanje sistemske PAX Statistike na menadžmentske mejlove.')}
                                    >
                                        <Mail size={18} /> Pošalji Statistiku
                                    </button>
                                </div>
                            </div>
                            <div className="stats-grid">
                                <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} className="stat-card">
                                    <div className="icon-box" style={{ background: '#ecfdf5' }}>
                                        <Users2 size={24} color="#10b981" />
                                    </div>
                                    <div className="stat-info">
                                        <span className="label">Ukupno Putnika (PAX)</span>
                                        <span className="value">{statsData.totalPAX}</span>
                                    </div>
                                    <div className="pax-breakdown">
                                        <div className="pax-tag"><Users size={12} /> ADL: <strong>{statsData.totalAdults}</strong></div>
                                        <div className="pax-tag"><Baby size={12} /> CHD: <strong>{statsData.totalKids}</strong></div>
                                        <div className="pax-tag"><Baby size={12} style={{ opacity: 0.5 }} /> INF: <strong>{statsData.totalBabies}</strong></div>
                                    </div>
                                </motion.div>

                                <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} className="stat-card">
                                    <div className="icon-box" style={{ background: '#f5f3ff' }}>
                                        <Moon size={24} color="#7c3aed" />
                                    </div>
                                    <div className="stat-info">
                                        <span className="label">Ukupno Noćenja</span>
                                        <span className="value">{statsData.totalNights}</span>
                                    </div>
                                    <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0, fontWeight: 600 }}>Prosečno {statsData.totalPAX > 0 ? (statsData.totalNights / statsData.totalPAX).toFixed(1) : 0} noći po putniku</p>
                                </motion.div>

                                <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} className="stat-card">
                                    <div className="icon-box" style={{ background: '#eff6ff' }}>
                                        <TrendingUp size={24} color="#3b82f6" />
                                    </div>
                                    <div className="stat-info">
                                        <span className="label">Prosečna Cena Putovanja</span>
                                        <span className="value">€{statsData.avgPricePAX.toFixed(0)}</span>
                                    </div>
                                    <p style={{ fontSize: '11px', color: 'var(--text-secondary)', margin: 0, fontWeight: 600 }}>Po PAX-u (Bazirano na {statsData.totalRevenue.toLocaleString()}€)</p>
                                </motion.div>

                                <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} className="stat-card highlight">
                                    <div className="icon-box" style={{ background: 'white' }}>
                                        <Activity size={24} color="var(--accent)" />
                                    </div>
                                    <div className="stat-info">
                                        <span className="label">Ukupno Finansija (Revenue)</span>
                                        <span className="value">€{statsData.totalRevenue.toLocaleString()}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 800, color: 'var(--accent)' }}>
                                        <CheckCircle size={14} /> SVE REZERVACIJE UKLJUČENE
                                    </div>
                                </motion.div>
                            </div>

                            {/* Optional: Add a subtle chart placeholder or more info if needed */}
                            <div style={{ background: 'white', padding: '30px', borderRadius: '24px', border: '1px solid var(--border)', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '20px' }}>
                                    <div className="op-icon-badge" style={{ width: '40px', height: '40px' }}>
                                        <TrendingUp size={18} color="var(--accent)" />
                                    </div>
                                    <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800 }}>Trend i Distribucija</h3>
                                </div>
                                <div style={{ height: '80px', display: 'flex', alignItems: 'flex-end', gap: '8px', padding: '10px 0' }}>
                                    {[40, 70, 45, 90, 65, 80, 55, 95, 40, 60, 85, 50].map((h, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ height: 0 }}
                                            animate={{ height: `${h}%` }}
                                            transition={{ delay: 0.5 + i * 0.05, duration: 0.5 }}
                                            style={{
                                                flex: 1,
                                                background: i === 7 ? 'var(--accent)' : '#f1f5f9',
                                                borderRadius: '4px',
                                                cursor: 'pointer'
                                            }}
                                            whileHover={{ background: 'var(--accent)', scaleY: 1.05 }}
                                        />
                                    ))}
                                </div>
                                <p style={{ margin: '15px 0 0', fontSize: '12px', color: 'var(--text-secondary)', textAlign: 'center' }}>Vizuelni prikaz distribucije rezervacija po mesecima (Demo)</p>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'analytics' && (
                        <motion.div
                            key="analytics"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="analytics-view"
                        >
                            <div className="analytics-controls">
                                <div>
                                    <h2 className="section-subtitle">Dynamic Reporting Engine</h2>
                                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                        Konstruište sopstveni izveštaj biranjem nivoa grupisanja. Redosled kliktanja definiše hijerarhiju.
                                    </p>
                                </div>

                                <div className="tag-cloud-wrapper">
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <span className="tag-cloud-label">Dostupni Nivoi (Kliknite za aktivaciju):</span>
                                        <div className="analytics-presets">
                                            <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', marginRight: '10px' }}>PREPORUČENI PRESETI:</span>
                                            <button className="preset-btn" onClick={() => setActiveTags(['Država', 'Destinacija', 'Dobavljač', 'Hotel'])}>
                                                <PieChart size={12} /> 360 Master Overview
                                            </button>
                                            <button className="preset-btn" onClick={() => setActiveTags(['Subagent', 'Poslovnica', 'B2C'])}>
                                                <Users size={12} /> Market Channels
                                            </button>
                                        </div>
                                    </div>
                                    <div className="tag-cloud" style={{ marginTop: '10px' }}>
                                        <button
                                            className="analytics-tag reset-tag"
                                            style={{ background: '#fee2e2', color: '#dc2626', borderColor: '#fecaca' }}
                                            onClick={() => setActiveTags([])}
                                        >
                                            <RotateCcw size={14} /> Reset
                                        </button>
                                        <div style={{ width: '1px', height: '30px', background: '#e2e8f0', margin: '0 10px' }} />
                                        {['Država', 'Destinacija', 'Hotel', 'Dobavljač', 'Subagent', 'Poslovnica', 'B2C'].map((tag) => {
                                            const index = activeTags.indexOf(tag);
                                            const isActive = index !== -1;
                                            return (
                                                <div
                                                    key={tag}
                                                    className={`analytics-tag ${isActive ? 'active' : ''}`}
                                                    onClick={() => {
                                                        if (isActive) {
                                                            setActiveTags(activeTags.filter(t => t !== tag));
                                                        } else {
                                                            setActiveTags([...activeTags, tag]);
                                                        }
                                                        setExpandedRows(new Set()); // Reset on hierarchy change
                                                        setIsAllExpanded(false);
                                                    }}
                                                >
                                                    {isActive && <span className="tag-order">{index + 1}</span>}
                                                    {tag}
                                                    {isActive ? <CheckCircle2 size={16} /> : <Plus size={16} />}
                                                </div>
                                            );
                                        })}
                                        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                                            <button
                                                className="btn-create-cap"
                                                style={{ borderRadius: '12px', background: '#10b981' }}
                                                onClick={() => alert(`Slanje hijerarhijskog izveštaja svima sa liste! (${activeTags.join(' > ')})`)}
                                            >
                                                <Mail size={16} /> Bulk Slanje Svima
                                            </button>
                                            <button
                                                className="btn-create-cap"
                                                style={{ borderRadius: '12px', background: 'var(--accent)' }}
                                                onClick={() => setShowPublicLinkModal(`Full Report (${activeTags.join(' > ')})`)}
                                            >
                                                <Share2 size={16} /> Share Full Report
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="drill-down-card">
                                <table className="drill-down-table">
                                    <thead>
                                        <tr>
                                            <th>Struktura Rezultata (Drill-down)</th>
                                            <th style={{ width: '120px' }}>
                                                <button
                                                    className="op-btn-secondary"
                                                    style={{
                                                        padding: '6px 14px',
                                                        fontSize: '11px',
                                                        borderRadius: '8px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '8px',
                                                        whiteSpace: 'nowrap',
                                                        background: isAllExpanded ? 'rgba(var(--accent-rgb), 0.1)' : 'white'
                                                    }}
                                                    onClick={() => isAllExpanded ? handleCollapseAll() : handleExpandAll()}
                                                >
                                                    {isAllExpanded ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
                                                    {isAllExpanded ? 'Skupi Sve' : 'Raširi Sve'}
                                                </button>
                                            </th>
                                            <th>Rezervacije</th>
                                            <th>Putnici</th>
                                            <th>Promet (Revenue)</th>
                                            <th>Noćenja</th>
                                            <th>Akcije</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {analyticsData.length > 0 ? (
                                            analyticsData.map(row => (
                                                <AnalyticsRow key={row.id} row={row} />
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={7} style={{ padding: '100px', textAlign: 'center' }}>
                                                    <div style={{ opacity: 0.3, marginBottom: '15px' }}>
                                                        <Search size={48} />
                                                    </div>
                                                    <h3 style={{ margin: 0, color: '#64748b' }}>Nema podataka za izabranu hijerarhiju ili filtere</h3>
                                                    <p style={{ color: '#94a3b8' }}>Pokušajte da aktivirate neki od tagova iznad ili promenite period stay/booking.</p>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
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
                            <div className="rooming-header-bar" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                                <div className="search-box" style={{ display: 'flex', alignItems: 'center', background: 'white', padding: '8px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', width: '300px' }}>
                                    <Search size={18} color="#64748b" style={{ marginRight: '10px' }} />
                                    <input
                                        type="text"
                                        placeholder={rt.searchPlaceholder}
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        style={{ border: 'none', outline: 'none', width: '100%', fontSize: '14px' }}
                                    />
                                </div>
                                <div className="rooming-actions" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', background: '#f1f5f9', padding: '4px', borderRadius: '10px', marginRight: '10px' }}>
                                        <button
                                            onClick={() => setRoomingLang('sr')}
                                            style={{
                                                padding: '6px 12px', borderRadius: '8px', border: 'none', fontSize: '11px', fontWeight: 800, cursor: 'pointer',
                                                background: roomingLang === 'sr' ? 'white' : 'transparent',
                                                color: roomingLang === 'sr' ? 'var(--accent)' : '#64748b',
                                                boxShadow: roomingLang === 'sr' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'
                                            }}
                                        >
                                            SR
                                        </button>
                                        <button
                                            onClick={() => setRoomingLang('en')}
                                            style={{
                                                padding: '6px 12px', borderRadius: '8px', border: 'none', fontSize: '11px', fontWeight: 800, cursor: 'pointer',
                                                background: roomingLang === 'en' ? 'white' : 'transparent',
                                                color: roomingLang === 'en' ? 'var(--accent)' : '#64748b',
                                                boxShadow: roomingLang === 'en' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'
                                            }}
                                        >
                                            EN
                                        </button>
                                    </div>
                                    <button
                                        className="op-btn-secondary"
                                        style={{
                                            padding: '6px 14px',
                                            fontSize: '12px',
                                            borderRadius: '8px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            background: isRoomingAllExpanded ? 'rgba(var(--accent-rgb), 0.1)' : 'white'
                                        }}
                                        onClick={() => {
                                            if (isRoomingAllExpanded) {
                                                setRoomingExpandedRows(new Set());
                                                setIsRoomingAllExpanded(false);
                                            } else {
                                                setRoomingExpandedRows(new Set(MOCK_RESERVATIONS.map(r => r.id)));
                                                setIsRoomingAllExpanded(true);
                                            }
                                        }}
                                    >
                                        {isRoomingAllExpanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
                                        {isRoomingAllExpanded ? rt.collapseAll : rt.expandAll}
                                    </button>
                                    <button
                                        className="btn-primary"
                                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: '#f59e0b', color: 'white', borderRadius: '10px', border: 'none', fontWeight: 600, cursor: 'pointer' }}
                                        onClick={() => alert('Bulk slanje generisanih Rooming lista svim ugovorenim hotelima!')}
                                    >
                                        <Mail size={18} /> {rt.bulkSend}
                                    </button>
                                    <button
                                        className="btn-secondary"
                                        onClick={async () => {
                                            try {
                                                const XLSX = await import('xlsx');

                                                const exportData: any[] = [];

                                                MOCK_HOTELS.forEach(hotel => {
                                                    const hotelReservations = MOCK_RESERVATIONS.filter(r => r.hotelId === hotel.id && (!searchTerm || r.customer.toLowerCase().includes(searchTerm.toLowerCase()) || r.id.toLowerCase().includes(searchTerm.toLowerCase())));
                                                    hotelReservations.forEach(res => {
                                                        const totalPax = res.adults + res.children + res.babies;
                                                        for (let i = 0; i < totalPax; i++) {
                                                            const name = i === 0 ? res.customer : `Gost ${i + 1} (${res.customer})`;
                                                            const dob = i >= res.adults ? '15.05.2018' : '';
                                                            const passport = `PA${Math.floor(Math.random() * 8000000 + 1000000)}`;
                                                            exportData.push({
                                                                "Hotel": hotel.name,
                                                                "ID Rez": res.id,
                                                                "Od": res.checkIn,
                                                                "Do": res.checkOut,
                                                                "Soba": res.roomType,
                                                                "Usluga": "All Inclusive",
                                                                "Putnik": name,
                                                                "Datum Rodjenja": dob,
                                                                "Pasos": passport,
                                                                "Napomena": ""
                                                            });
                                                        }
                                                    });
                                                });

                                                const worksheet = XLSX.utils.json_to_sheet(exportData);
                                                const workbook = XLSX.utils.book_new();
                                                XLSX.utils.book_append_sheet(workbook, worksheet, "Rooming Lista");
                                                XLSX.writeFile(workbook, `Rooming_Lista_${new Date().toISOString().split('T')[0]}.xlsx`);
                                            } catch (error) {
                                                console.error("Error exporting to Excel:", error);
                                                alert("Došlo je do greške prilikom exporta u Excel.");
                                            }
                                        }}
                                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: '#10b981', color: 'white', borderRadius: '10px', border: 'none', fontWeight: 600, cursor: 'pointer' }}
                                    >
                                        <Download size={18} /> Export Excel
                                    </button>
                                    <button
                                        className="btn-primary"
                                        onClick={() => {
                                            const token = `RM-${Math.random().toString(36).substring(7).toUpperCase()}`;
                                            const url = `${window.location.protocol}//${window.location.host}/public-inventory?reportView=true&token=${token}&type=rooming`;
                                            navigator.clipboard.writeText(url);
                                            alert('Public Link za Rooming Listu je kopiran u clipboard:\n' + url);
                                        }}
                                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', background: '#3b82f6', color: 'white', borderRadius: '10px', border: 'none', fontWeight: 600, cursor: 'pointer' }}
                                    >
                                        <Link size={18} /> {rt.hotelLink}
                                    </button>
                                </div>
                            </div>

                            {MOCK_HOTELS.filter(h => MOCK_RESERVATIONS.some(r => r.hotelId === h.id && (matchesSearch(r.customer) || matchesSearch(r.id)))).map(hotel => {
                                const hotelReservations = MOCK_RESERVATIONS
                                    .filter(r => r.hotelId === hotel.id && (matchesSearch(r.customer) || matchesSearch(r.id)))
                                    .sort((a, b) => new Date(a.checkIn).getTime() - new Date(b.checkIn).getTime());

                                return (
                                    <div key={hotel.id} className="rooming-table-card" style={{ background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border)', marginBottom: '30px', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}>
                                        <div style={{
                                            padding: '20px 25px',
                                            background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.05) 0%, rgba(59, 130, 246, 0.01) 100%)',
                                            borderBottom: '2px solid var(--border)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '15px'
                                        }}>
                                            <Building2 size={24} color="#3b82f6" />
                                            <div>
                                                <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)' }}>{hotel.name}</h2>
                                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>{hotel.destination}, {hotel.country}</div>
                                            </div>
                                            <button
                                                className="op-btn-secondary"
                                                style={{ marginLeft: 'auto', padding: '6px 12px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', borderColor: '#10b981' }}
                                                onClick={() => alert(`Slanje Rooming liste isključivo hotelu: ${hotel.name}`)}
                                            >
                                                <Mail size={14} /> {rt.sendEmail}
                                            </button>
                                        </div>

                                        <div style={{ overflowX: 'auto' }}>
                                            <table className="op-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left', tableLayout: 'fixed' }}>
                                                <thead>
                                                    <tr style={{ background: '#fff1f2', borderBottom: '1px solid var(--border)' }}>
                                                        <th style={{ width: '130px', padding: '8px 12px', textAlign: 'left', fontSize: '11px', fontWeight: 900, color: '#881337', textTransform: 'uppercase', letterSpacing: '0.8px' }}>{rt.bookingId}</th>
                                                        <th style={{ width: '220px', padding: '8px 12px', textAlign: 'left', fontSize: '11px', fontWeight: 900, color: '#881337', textTransform: 'uppercase', letterSpacing: '0.8px', borderLeft: '1px solid rgba(136, 19, 55, 0.1)' }}>{rt.stayPeriod}</th>
                                                        <th style={{ width: '240px', padding: '8px 12px', textAlign: 'left', fontSize: '11px', fontWeight: 900, color: '#881337', textTransform: 'uppercase', letterSpacing: '0.8px', borderLeft: '1px solid rgba(136, 19, 55, 0.1)' }}>{rt.accommodation}</th>
                                                        <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: '11px', fontWeight: 900, color: '#881337', textTransform: 'uppercase', letterSpacing: '0.8px', borderLeft: '1px solid rgba(136, 19, 55, 0.1)' }}>{rt.passengerList}</th>
                                                        <th style={{ width: '140px', padding: '8px 12px', textAlign: 'left', fontSize: '11px', fontWeight: 900, color: '#881337', textTransform: 'uppercase', letterSpacing: '0.8px', borderLeft: '1px solid rgba(136, 19, 55, 0.1)' }}>{rt.passport}</th>
                                                        <th style={{ width: '360px', padding: '8px 12px', textAlign: 'left', fontSize: '11px', fontWeight: 900, color: '#881337', textTransform: 'uppercase', letterSpacing: '0.8px', borderLeft: '1px solid rgba(136, 19, 55, 0.1)' }}>{rt.note}</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {hotelReservations.map(res => {
                                                        const isExpanded = roomingExpandedRows.has(res.id);
                                                        const nights = Math.ceil((new Date(res.checkOut).getTime() - new Date(res.checkIn).getTime()) / (1000 * 60 * 60 * 24));
                                                        const paxArray = [
                                                            ...Array.from({ length: res.adults }).map((_, i) => ({
                                                                name: i === 0 ? res.customer : `${rt.guest} ${i + 1} (${res.customer.split(' ')[1] || ''})`,
                                                                type: 'adult',
                                                                age: 0,
                                                                passport: `PA${Math.floor(Math.random() * 8000000 + 1000000)}`
                                                            })) as any[],
                                                            ...Array.from({ length: res.children }).map((_, i) => {
                                                                const age = i === 0 ? 7 : 12;
                                                                return {
                                                                    name: `${rt.guest} ${res.adults + i + 1} (${res.customer.split(' ')[1] || ''})`,
                                                                    type: 'child',
                                                                    age,
                                                                    birthDate: `15.05.${2026 - age}`,
                                                                    passport: `PA${Math.floor(Math.random() * 8000000 + 1000000)}`
                                                                };
                                                            }) as any[],
                                                            ...Array.from({ length: res.babies }).map((_, i) => ({
                                                                name: `${rt.guest} ${res.adults + res.children + i + 1} (${res.customer.split(' ')[1] || ''})`,
                                                                type: 'baby',
                                                                age: 1,
                                                                birthDate: '01.01.2025',
                                                                passport: `PA${Math.floor(Math.random() * 8000000 + 1000000)}`
                                                            })) as any[]
                                                        ];

                                                        return (
                                                            <React.Fragment key={res.id}>
                                                                {/* MAIN ROW */}
                                                                <tr style={{
                                                                    borderBottom: isExpanded ? '1px solid rgba(0,0,0,0.1)' : '1px solid var(--border)',
                                                                    background: isExpanded ? 'rgba(59, 130, 246, 0.03)' : 'transparent',
                                                                    borderLeft: '4px solid transparent',
                                                                    borderLeftColor: isExpanded ? 'var(--accent)' : 'transparent',
                                                                    transition: 'all 0.1s ease'
                                                                }}>
                                                                    <td style={{ padding: '6px 12px', verticalAlign: 'top' }}>
                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                                                                            <button
                                                                                onClick={() => {
                                                                                    const newSet = new Set(roomingExpandedRows);
                                                                                    if (isExpanded) newSet.delete(res.id);
                                                                                    else newSet.add(res.id);
                                                                                    setRoomingExpandedRows(newSet);
                                                                                }}
                                                                                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--accent)', display: 'flex', alignItems: 'center' }}
                                                                            >
                                                                                {isExpanded ? <ChevronDown size={16} /> : <Plus size={16} />}
                                                                            </button>
                                                                            <span className="res-id-link" onClick={() => navigate(`/reservations?id=${res.id}`)} style={{ cursor: 'pointer', color: '#3b82f6', fontWeight: 900, fontSize: '13px' }}>#{res.id}</span>
                                                                        </div>
                                                                    </td>
                                                                    <td style={{ padding: '6px 12px', borderLeft: '1px solid var(--border)', verticalAlign: 'top' }}>
                                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                                            <div className="date-cell" style={{ display: 'inline-block', background: 'var(--bg-main)', padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 900, color: 'var(--text-primary)', border: '1px solid var(--border)' }}>
                                                                                {new Date(res.checkIn).toLocaleDateString('sr-Latn-RS', { day: '2-digit', month: '2-digit', year: 'numeric' })} - {new Date(res.checkOut).toLocaleDateString('sr-Latn-RS', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                                                            </div>
                                                                            <span style={{ fontSize: '10px', color: 'var(--text-secondary)', fontWeight: 800, marginLeft: '4px' }}>{nights} {rt.nights}</span>
                                                                        </div>
                                                                    </td>
                                                                    <td style={{ padding: '6px 12px', borderLeft: '1px solid var(--border)', verticalAlign: 'top' }}>
                                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                                                            <div className="room-badge" style={{ background: '#e0e7ff', color: '#4338ca', padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 900, width: 'fit-content' }}>{res.roomType}</div>
                                                                            <div style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', padding: '2px 8px', borderRadius: '6px', fontSize: '8px', fontWeight: 900, letterSpacing: '0.4px', width: 'fit-content', border: '1px solid rgba(59, 130, 246, 0.2)' }}>ALL INCLUSIVE</div>
                                                                        </div>
                                                                    </td>
                                                                    <td style={{ padding: '6px 12px', borderLeft: '1px solid var(--border)', verticalAlign: 'top' }}>
                                                                        <div style={{
                                                                            display: 'inline-flex',
                                                                            alignItems: 'center',
                                                                            gap: '6px',
                                                                            background: 'var(--bg-main)',
                                                                            padding: '3px 10px',
                                                                            borderRadius: '6px',
                                                                            border: '1px solid var(--border)',
                                                                            marginTop: '1px'
                                                                        }}>
                                                                            <User size={14} color="var(--text-secondary)" style={{ minWidth: '14px' }} />
                                                                            <strong style={{ color: 'var(--text-primary)', whiteSpace: 'nowrap', fontSize: '13px', fontWeight: 950 }}>1. {res.customer}</strong>
                                                                            <div style={{ display: 'flex', gap: '3px', alignItems: 'center', marginLeft: '4px' }}>
                                                                                <span style={{ fontSize: '9px', background: 'rgba(59, 130, 246, 0.1)', padding: '1px 5px', borderRadius: '4px', color: '#3b82f6', fontWeight: 900, border: '1px solid rgba(59, 130, 246, 0.2)', whiteSpace: 'nowrap' }}>{res.adults} {rt.adl}</span>
                                                                                {res.children > 0 && (
                                                                                    <span style={{ fontSize: '9px', background: 'rgba(249, 115, 22, 0.1)', padding: '1px 5px', borderRadius: '4px', color: '#fb923c', fontWeight: 900, border: '1px solid rgba(249, 115, 22, 0.1)', whiteSpace: 'nowrap' }}>
                                                                                        {res.children} {rt.chd}
                                                                                    </span>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                    <td style={{ padding: '6px 12px', borderLeft: '1px solid var(--border)', verticalAlign: 'top' }}>
                                                                        <div style={{ marginTop: '2px' }}>
                                                                            <code style={{ background: 'var(--bg-main)', padding: '1px 6px', borderRadius: '4px', color: 'var(--text-primary)', border: '1px solid var(--border)', fontWeight: 900, fontSize: '11px' }}>{paxArray[0].passport}</code>
                                                                        </div>
                                                                    </td>
                                                                    <td style={{ padding: '6px 12px', borderLeft: '1px solid var(--border)', verticalAlign: 'top' }}>
                                                                        <span style={{ color: '#94a3b8', fontSize: '11px', lineHeight: '1.3', fontWeight: 600 }}>{rt.defaultNote}</span>
                                                                    </td>
                                                                </tr>

                                                                {/* EXPANDED PASSENGER DETAILS */}
                                                                {isExpanded && paxArray.length > 1 && (
                                                                    <>
                                                                        {paxArray.slice(1).map((pax, pIdx) => (
                                                                            <tr key={pIdx} style={{ background: 'var(--bg-card)', borderBottom: pIdx === paxArray.length - 2 ? '1px solid var(--border)' : '1px solid rgba(0,0,0,0.06)', borderLeft: '4px solid var(--accent)' }}>
                                                                                <td style={{ padding: '4px 12px' }}></td>
                                                                                <td style={{ padding: '4px 12px', borderLeft: '1px solid var(--border)' }}></td>
                                                                                <td style={{ padding: '4px 12px', borderLeft: '1px solid var(--border)' }}></td>
                                                                                <td style={{ padding: '6px 12px', borderLeft: '1px solid var(--border)' }}>
                                                                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                                            {pax.type === 'baby' ? <Baby size={13} color="#4ade80" /> : pax.type === 'child' ? <Baby size={13} color="#fb923c" /> : <User size={13} color="var(--text-secondary)" />}
                                                                                            <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '12px' }}>{pIdx + 2}. {pax.name}</span>
                                                                                        </div>
                                                                                        <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                                                                                            {pax.type === 'adult' ? rt.adult : pax.type === 'baby' ? `${rt.infant} - DOB: ${pax.birthDate}` : `${rt.child} (${pax.age} ${rt.yrs}) - DOB: ${pax.birthDate}`}
                                                                                        </span>
                                                                                    </div>
                                                                                </td>
                                                                                <td style={{ padding: '6px 12px', borderLeft: '1px solid var(--border)' }}>
                                                                                    <code style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '11px' }}>{pax.passport}</code>
                                                                                </td>
                                                                                <td style={{ padding: '4px 12px', borderLeft: '1px solid var(--border)' }}></td>
                                                                            </tr>
                                                                        ))}
                                                                    </>
                                                                )}
                                                            </React.Fragment>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                );
                            })}
                        </motion.div >
                    )}
                </AnimatePresence >
            </main >

            {/* Daily Pulse Modal */}
            <AnimatePresence>
                {
                    showDailyPulse && (
                        <div className="modal-overlay" onClick={() => setShowDailyPulse(false)}>
                            <motion.div
                                drag
                                dragMomentum={false}
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="daily-pulse-modal"
                                onClick={e => e.stopPropagation()}
                            >
                                <div className="pulse-header">
                                    <div>
                                        <h3>Daily Pulse: {pulseDate ? `${new Date(pulseDate).getDate().toString().padStart(2, '0')}/${(new Date(pulseDate).getMonth() + 1).toString().padStart(2, '0')}/${new Date(pulseDate).getFullYear()}` : ''}</h3>
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
                                                Arrivals (Dolasci) {pulseDate && ` - ${new Date(pulseDate).getDate().toString().padStart(2, '0')}/${(new Date(pulseDate).getMonth() + 1).toString().padStart(2, '0')}/${new Date(pulseDate).getFullYear()}`}
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
                                                Departures (Odlasci) {pulseDate && ` - ${new Date(pulseDate).getDate().toString().padStart(2, '0')}/${(new Date(pulseDate).getMonth() + 1).toString().padStart(2, '0')}/${new Date(pulseDate).getFullYear()}`}
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
                    )
                }
            </AnimatePresence >

            {/* Month Selector Modal */}
            <AnimatePresence>
                {
                    showMonthSelector && (
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
                    )
                }
            </AnimatePresence >

            {/* Capacity Management Modal - REDESIGNED TO SPLIT-PANE */}
            <AnimatePresence>
                {
                    showCapacityModal && (
                        <div className="modal-overlay" onClick={() => setShowCapacityModal(false)}>
                            <motion.div
                                drag
                                dragMomentum={false}
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="visual-report-modal capacity-wizard-premium"
                                style={{ padding: 0, maxWidth: '1100px', width: '90%', height: 'auto', maxHeight: '72vh' }}
                                onClick={e => e.stopPropagation()}
                            >
                                <div className="report-modal-header drag-handle" style={{ margin: 0, background: '#fff', borderBottom: '1px solid #f1f5f9', padding: '15px 30px' }}>
                                    <div className="report-title-section">
                                        <div className="report-icon-box" style={{ background: '#7c3aed' }}>
                                            <Activity size={24} />
                                        </div>
                                        <div>
                                            <h3 style={{ fontSize: '18px', margin: 0 }}>Upravljanje Kapacitetom i Ugovorima</h3>
                                            <p className="report-subtitle">Definišite kvote i stop-sale statuse po specifičnim ugovorima</p>
                                        </div>
                                    </div>

                                    <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '15px', marginRight: '20px' }}>
                                        <div style={{ background: '#f1f5f9', padding: '4px', borderRadius: '10px', display: 'flex', gap: '4px' }}>
                                            <button
                                                onClick={() => setWizardVersion('classic')}
                                                style={{
                                                    padding: '6px 12px',
                                                    borderRadius: '8px',
                                                    border: 'none',
                                                    fontSize: '11px',
                                                    fontWeight: 800,
                                                    cursor: 'pointer',
                                                    background: wizardVersion === 'classic' ? 'white' : 'transparent',
                                                    color: wizardVersion === 'classic' ? '#7c3aed' : '#64748b',
                                                    boxShadow: wizardVersion === 'classic' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'
                                                }}
                                            >
                                                Classic
                                            </button>
                                            <button
                                                onClick={() => setWizardVersion('studio')}
                                                style={{
                                                    padding: '6px 12px',
                                                    borderRadius: '8px',
                                                    border: 'none',
                                                    fontSize: '11px',
                                                    fontWeight: 800,
                                                    cursor: 'pointer',
                                                    background: wizardVersion === 'studio' ? 'white' : 'transparent',
                                                    color: wizardVersion === 'studio' ? '#7c3aed' : '#64748b',
                                                    boxShadow: wizardVersion === 'studio' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none'
                                                }}
                                            >
                                                Studio (V2)
                                            </button>
                                        </div>
                                        <div className="drag-info" style={{ fontSize: '10px', opacity: 0.4 }}>
                                            DRAGGABLE
                                        </div>
                                    </div>

                                    <button className="report-close-btn" onClick={() => setShowCapacityModal(false)}><X size={20} /></button>
                                </div>

                                <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', background: wizardVersion === 'studio' ? '#f8fafc' : '#fff' }}>
                                    {wizardVersion === 'classic' ? (
                                        <div className="capacity-wizard-container" style={{ display: 'flex', flex: 1, height: '100%', background: '#fff', overflow: 'hidden' }}>
                                            {/* LEFT SIDEBAR: ALL FILTERS */}
                                            <div className="wizard-left-sidebar" style={{ width: '340px', minWidth: '340px', padding: '25px', borderRight: '1px solid #e2e8f0', background: '#f8fafc', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>

                                                {/* TIERED SEARCH WITH SEARCHABLE INPUTS */}
                                                <div className="filter-group" style={{ marginBottom: '15px' }}>
                                                    {/* Country Searchable */}
                                                    <div style={{ position: 'relative', marginBottom: '10px' }}>
                                                        <input
                                                            className="op-input-modern"
                                                            placeholder="-- Odabir Drzave --"
                                                            value={capCountry || capCountryQuery}
                                                            onChange={e => { setCapCountryQuery(e.target.value); setCapCountry(''); setShowCountryChoices(true); }}
                                                            onFocus={() => setShowCountryChoices(true)}
                                                            style={{ width: '100%' }}
                                                        />
                                                        {showCountryChoices && (
                                                            <div className="custom-dropdown-list">
                                                                <div className="dropdown-item" onClick={() => { setCapCountry(''); setCapCountryQuery(''); setShowCountryChoices(false); }}>Sve Drzave</div>
                                                                {filteredCountriesList.map(c => (
                                                                    <div key={c} className="dropdown-item" onClick={() => { setCapCountry(c); setCapCountryQuery(''); setShowCountryChoices(false); setCapDest(''); }}>{c}</div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Destination Searchable */}
                                                    <div style={{ position: 'relative', marginBottom: '10px' }}>
                                                        <input
                                                            className="op-input-modern"
                                                            placeholder="-- Odabir Destinacije --"
                                                            value={capDest || capDestQuery}
                                                            onChange={e => { setCapDestQuery(e.target.value); setCapDest(''); setShowDestChoices(true); }}
                                                            onFocus={() => setShowDestChoices(true)}
                                                            style={{ width: '100%' }}
                                                        />
                                                        {showDestChoices && (
                                                            <div className="custom-dropdown-list">
                                                                <div className="dropdown-item" onClick={() => { setCapDest(''); setCapDestQuery(''); setShowDestChoices(false); }}>Sve Destinacije</div>
                                                                {filteredDestsList.map(d => (
                                                                    <div key={d} className="dropdown-item" onClick={() => { setCapDest(d); setCapDestQuery(''); setShowDestChoices(false); }}>{d}</div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div style={{ position: 'relative', marginBottom: '10px' }}>
                                                        <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                                                        <input
                                                            type="text"
                                                            className="op-input-modern"
                                                            placeholder="Pretraga hotela..."
                                                            value={capHotelSearch}
                                                            onChange={e => setCapHotelSearch(e.target.value)}
                                                            style={{ paddingLeft: '35px', width: '100%' }}
                                                        />
                                                    </div>

                                                    <select
                                                        className="op-select-modern"
                                                        value={selectedHotel.id}
                                                        onChange={(e) => setSelectedHotel(MOCK_HOTELS.find(h => h.id === e.target.value) || MOCK_HOTELS[0])}
                                                        style={{ width: '100%', padding: '10px', borderRadius: '12px', height: '150px', fontStyle: 'italic', border: '1px solid #e2e8f0' }}
                                                        size={5}
                                                    >
                                                        {filteredHotelsForWizard.map((h: any) => <option key={h.id} value={h.id} style={{ fontStyle: 'italic', padding: '8px', borderBottom: '1px solid #f1f5f9' }}>{h.name} ({h.destination})</option>)}
                                                    </select>
                                                </div>

                                                <div className="filter-group" style={{ marginBottom: '20px' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                        {/* Booking Period FIRST per user request */}
                                                        <div style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', marginBottom: '2px', textTransform: 'uppercase' }}>Rezervacije od...do</div>
                                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
                                                            <div className="modern-date-field-small" onClick={() => setShowCapBookStartCal(true)}>
                                                                <span>{new Date(capBookingFrom).toLocaleDateString()}</span>
                                                            </div>
                                                            <div className="modern-date-field-small" onClick={() => setShowCapBookEndCal(true)}>
                                                                <span>{new Date(capBookingTo).toLocaleDateString()}</span>
                                                            </div>
                                                        </div>

                                                        {/* Stay Period SECOND per user request */}
                                                        <div style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', marginBottom: '2px', textTransform: 'uppercase', marginTop: '5px' }}>Period Boravka</div>
                                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
                                                            <div className="modern-date-field-small" onClick={() => setShowCapStartCal(true)}>
                                                                <span>{new Date(capDateFrom).toLocaleDateString()}</span>
                                                            </div>
                                                            <div className="modern-date-field-small" onClick={() => setShowCapEndCal(true)}>
                                                                <span>{new Date(capDateTo).toLocaleDateString()}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {showCapStartCal && <ModernCalendar startDate={capDateFrom} endDate={null} singleMode onChange={(s) => setCapDateFrom(s)} onClose={() => setShowCapStartCal(false)} />}
                                                    {showCapEndCal && <ModernCalendar startDate={capDateTo} endDate={null} singleMode onChange={(s) => setCapDateTo(s)} onClose={() => setShowCapEndCal(false)} />}
                                                    {showCapBookStartCal && <ModernCalendar startDate={capBookingFrom} endDate={null} singleMode onChange={(s) => setCapBookingFrom(s)} onClose={() => setShowCapBookStartCal(false)} />}
                                                    {showCapBookEndCal && <ModernCalendar startDate={capBookingTo} endDate={null} singleMode onChange={(s) => setCapBookingTo(s)} onClose={() => setShowCapBookEndCal(false)} />}
                                                </div>

                                                <div className="filter-group">
                                                    <div style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', marginBottom: '8px', textTransform: 'uppercase' }}>Tip Smeštaja</div>
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', maxHeight: '350px', overflowY: 'auto' }} className="custom-tiny-scroll">
                                                        {selectedHotel.roomTypes.map(room => (
                                                            <button
                                                                key={room}
                                                                className={`room-chip-compact ${capRooms.includes(room) ? 'selected' : ''}`}
                                                                onClick={() => setCapRooms(prev => prev.includes(room) ? prev.filter(p => p !== room) : [...prev, room])}
                                                            >
                                                                {room}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* RIGHT PANEL: DEFINITION */}
                                            <div className="wizard-right-main" style={{ flex: 1, padding: '40px', background: '#fff', overflowY: 'auto', height: '100%' }}>
                                                <div style={{ marginBottom: '35px' }}>
                                                    <h4 style={{ fontSize: '22px', fontWeight: 900, margin: 0 }}>Definisanje Uslova</h4>
                                                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>Unesite konkretne vrednosti za odabrane parametre</p>
                                                </div>

                                                <div className="form-section" style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '30px' }}>
                                                    <div className="form-group">
                                                        <label style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: '15px' }}>Vrsta Ugovora (Selektor kanala)</label>
                                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '15px' }}>
                                                            <button
                                                                className={`agent-checkbox-card ${capSelectedContract === 'Svi Ugovori' ? 'active' : ''}`}
                                                                onClick={() => setCapSelectedContract('Svi Ugovori')}
                                                                style={{ padding: '12px', textAlign: 'left', position: 'relative' }}
                                                            >
                                                                <div className="agent-box-info">
                                                                    <span className="a-name" style={{ fontSize: '14px', fontWeight: 800 }}>Zajednička Kvote</span>
                                                                    <span className="a-loc" style={{ fontSize: '11px', opacity: 0.6 }}>Primeni na sve ugovore</span>
                                                                </div>
                                                                {capSelectedContract === 'Svi Ugovori' && <div style={{ position: 'absolute', top: '10px', right: '10px', color: 'var(--accent)' }}><CheckCircle size={16} /></div>}
                                                            </button>
                                                            {MOCK_CONTRACTS.map(c => (
                                                                <button
                                                                    key={c}
                                                                    className={`agent-checkbox-card ${capSelectedContract === c ? 'active' : ''}`}
                                                                    onClick={() => setCapSelectedContract(c)}
                                                                    style={{ padding: '12px', textAlign: 'left', position: 'relative' }}
                                                                >
                                                                    <div className="agent-box-info">
                                                                        <span className="a-name" style={{ fontSize: '14px', fontWeight: 800 }}>{c}</span>
                                                                        <span className="a-loc" style={{ fontSize: '11px', opacity: 0.6 }}>Specifična distribucija</span>
                                                                    </div>
                                                                    {capSelectedContract === c && <div style={{ position: 'absolute', top: '10px', right: '10px', color: 'var(--accent)' }}><CheckCircle size={16} /></div>}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '24px' }}>
                                                        <div className="form-group">
                                                            <label style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-secondary)', display: 'block', marginBottom: '10px' }}>BROJ SOBA (KOLIČINA)</label>
                                                            <div className="capacity-input-modern">
                                                                <button onClick={() => setCapValue(prev => (parseInt(prev) - 1).toString())}>-</button>
                                                                <input
                                                                    type="text"
                                                                    value={capValue}
                                                                    onChange={e => setCapValue(e.target.value)}
                                                                    placeholder="Unesite ili npr. -5"
                                                                />
                                                                <button onClick={() => setCapValue(prev => (parseInt(prev) + 1).toString())}>+</button>
                                                            </div>
                                                            <p style={{ fontSize: '10px', color: 'var(--text-secondary)', marginTop: '5px' }}>* Unesite npr. <strong>-5</strong> da umanjite trenutni kapacitet</p>

                                                            <div style={{ marginTop: '20px', padding: '15px', background: capOverwrite ? '#fee2e2' : '#f8fafc', borderRadius: '12px', border: `1px solid ${capOverwrite ? '#fecaca' : '#e2e8f0'}` }}>
                                                                <label className="op-checkbox-container" style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: 800, color: capOverwrite ? '#dc2626' : '#475569', cursor: 'pointer' }}>
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={capOverwrite}
                                                                        onChange={e => setCapOverwrite(e.target.checked)}
                                                                        style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                                                                    />
                                                                    <span>PREBRIŠI POSTOJEĆE KAPACITETE</span>
                                                                </label>
                                                                <p style={{ fontSize: '11px', opacity: 0.6, marginTop: '6px', color: capOverwrite ? '#dc2626' : 'inherit' }}>* Ako je štiklirano, nove vrednosti će zameniti stare bez sabiranja</p>
                                                            </div>
                                                        </div>
                                                        <div className="form-group">
                                                            <label style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: '10px' }}>Status Prodaje</label>
                                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
                                                                {['Alotman', 'Stop', 'On Request', 'Fix'].map(st => (
                                                                    <button
                                                                        key={st}
                                                                        className={`room-chip ${capStatus === st ? 'selected' : ''}`}
                                                                        onClick={() => setCapStatus(st as any)}
                                                                        style={{ height: '50px', fontSize: '11px', textTransform: 'uppercase', fontWeight: 800, margin: 0 }}
                                                                    >
                                                                        {st}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="contract-info-box" style={{ padding: '24px', borderRadius: '20px', background: 'var(--accent-glow)', border: '1px solid var(--accent)', display: 'flex', gap: '15px', alignItems: 'center' }}>
                                                        <div style={{ width: '48px', height: '48px', background: 'var(--accent)', color: 'white', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                            <Activity size={20} />
                                                        </div>
                                                        <div>
                                                            <h5 style={{ margin: 0, fontSize: '15px', fontWeight: 800 }}>Bezbedna Primena</h5>
                                                            <p style={{ margin: '4px 0 0 0', fontSize: '12px', opacity: 0.7, lineHeight: 1.4 }}>
                                                                Ove promene će biti zabeležene u logu sistema.
                                                                {capSelectedContract === 'Svi Ugovori' ? ' Ukupan kapacitet će biti ažuriran za sve kanale prodaje.' : ` Samo prodajni kanal ${capSelectedContract} će biti pogođen ovom izmenom.`}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        /* STUDIO UI (VERSION 2) */
                                        <div className="studio-wizard-container" style={{ flex: 1, padding: '40px', display: 'grid', gridTemplateColumns: 'minmax(350px, 400px) 1fr', gap: '30px', height: '100%', overflowY: 'auto' }}>
                                            {/* STUDIO LEFT: SELECTION & CONFIG */}
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                                                <div className="studio-card" style={{ background: 'white', padding: '24px', borderRadius: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                                                        <div style={{ width: '32px', height: '32px', background: '#f1f5f9', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            <MapPin size={16} color="#7c3aed" />
                                                        </div>
                                                        <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800 }}>Lokacija i Hotel</h4>
                                                    </div>

                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                                        <div style={{ position: 'relative' }}>
                                                            <Globe size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                                                            <input
                                                                className="op-input-modern"
                                                                placeholder="Država"
                                                                value={capCountry || capCountryQuery}
                                                                onChange={e => { setCapCountryQuery(e.target.value); setCapCountry(''); setShowCountryChoices(true); }}
                                                                style={{ width: '100%', paddingLeft: '35px' }}
                                                            />
                                                        </div>
                                                        <div style={{ position: 'relative' }}>
                                                            <MapPin size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                                                            <input
                                                                className="op-input-modern"
                                                                placeholder="Destinacija"
                                                                value={capDest || capDestQuery}
                                                                onChange={e => { setCapDestQuery(e.target.value); setCapDest(''); setShowDestChoices(true); }}
                                                                style={{ width: '100%', paddingLeft: '35px' }}
                                                            />
                                                        </div>
                                                        <div style={{ position: 'relative' }}>
                                                            <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                                                            <input
                                                                className="op-input-modern"
                                                                placeholder="Pretraga hotela..."
                                                                value={capHotelSearch}
                                                                onChange={e => setCapHotelSearch(e.target.value)}
                                                                style={{ width: '100%', paddingLeft: '35px' }}
                                                            />
                                                        </div>
                                                        <select
                                                            className="op-select-modern"
                                                            value={selectedHotel.id}
                                                            onChange={(e) => setSelectedHotel(MOCK_HOTELS.find(h => h.id === e.target.value) || MOCK_HOTELS[0])}
                                                            style={{ height: '120px', fontSize: '13px', fontStyle: 'italic' }}
                                                            size={5}
                                                        >
                                                            {filteredHotelsForWizard.map((h: any) => <option key={h.id} value={h.id}>{h.name}</option>)}
                                                        </select>
                                                    </div>
                                                </div>

                                                <div className="studio-card" style={{ background: 'white', padding: '24px', borderRadius: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
                                                        <div style={{ width: '32px', height: '32px', background: '#f1f5f9', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            <Tag size={16} color="#7c3aed" />
                                                        </div>
                                                        <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 800 }}>Ugovori</h4>
                                                    </div>
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                                        <button
                                                            onClick={() => setCapSelectedContract('Svi Ugovori')}
                                                            style={{
                                                                padding: '10px 16px', borderRadius: '12px', border: capSelectedContract === 'Svi Ugovori' ? '2px solid #7c3aed' : '1px solid #e2e8f0',
                                                                background: capSelectedContract === 'Svi Ugovori' ? '#f5f3ff' : 'white',
                                                                fontSize: '12px', fontWeight: 700, cursor: 'pointer', transition: '0.2s'
                                                            }}
                                                        >
                                                            Svi Ugovori
                                                        </button>
                                                        {MOCK_CONTRACTS.map(c => (
                                                            <button
                                                                key={c}
                                                                onClick={() => setCapSelectedContract(c)}
                                                                style={{
                                                                    padding: '10px 16px', borderRadius: '12px', border: capSelectedContract === c ? '2px solid #7c3aed' : '1px solid #e2e8f0',
                                                                    background: capSelectedContract === c ? '#f5f3ff' : 'white',
                                                                    fontSize: '12px', fontWeight: 700, cursor: 'pointer', transition: '0.2s'
                                                                }}
                                                            >
                                                                {c}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* STUDIO RIGHT: TIMING & ROOMS & ACTIONS */}
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '25px' }}>
                                                <div className="studio-card" style={{ background: 'white', padding: '30px', borderRadius: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)' }}>
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '40px' }}>
                                                        <div>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                                                                <CalendarIcon size={18} color="#7c3aed" />
                                                                <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 900 }}>Vremenski Okviri</h4>
                                                            </div>
                                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                                                <div>
                                                                    <div style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px' }}>Rezervacije</div>
                                                                    <div className="modern-date-field-small" style={{ height: '50px' }} onClick={() => setShowCapBookStartCal(true)}>{new Date(capBookingFrom).toLocaleDateString()}</div>
                                                                    <div className="modern-date-field-small" style={{ height: '50px', marginTop: '8px' }} onClick={() => setShowCapBookEndCal(true)}>{new Date(capBookingTo).toLocaleDateString()}</div>
                                                                </div>
                                                                <div>
                                                                    <div style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px' }}>Boravak</div>
                                                                    <div className="modern-date-field-small" style={{ height: '50px' }} onClick={() => setShowCapStartCal(true)}>{new Date(capDateFrom).toLocaleDateString()}</div>
                                                                    <div className="modern-date-field-small" style={{ height: '50px', marginTop: '8px' }} onClick={() => setShowCapEndCal(true)}>{new Date(capDateTo).toLocaleDateString()}</div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                                                                <Building2 size={18} color="#7c3aed" />
                                                                <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 900 }}>Tipovi Smeštaja</h4>
                                                            </div>
                                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '8px', maxHeight: '150px', overflowY: 'auto', paddingRight: '10px' }} className="custom-tiny-scroll">
                                                                {selectedHotel.roomTypes.map(room => (
                                                                    <div
                                                                        key={room}
                                                                        onClick={() => setCapRooms(prev => prev.includes(room) ? prev.filter(p => p !== room) : [...prev, room])}
                                                                        style={{
                                                                            padding: '12px 15px', borderRadius: '12px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer',
                                                                            background: capRooms.includes(room) ? '#7c3aed' : 'white',
                                                                            color: capRooms.includes(room) ? 'white' : 'inherit',
                                                                            transition: '0.2s'
                                                                        }}
                                                                    >
                                                                        <div style={{ width: '18px', height: '18px', borderRadius: '4px', border: '2px solid rgba(0,0,0,0.1)', background: capRooms.includes(room) ? 'white' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                            {capRooms.includes(room) && <Check size={12} color="#7c3aed" />}
                                                                        </div>
                                                                        <span style={{ fontSize: '13px', fontWeight: 700 }}>{room}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
                                                    <div className="studio-card" style={{ background: 'white', padding: '30px', borderRadius: '24px', boxShadow: '0 10px 30px rgba(124, 58, 237, 0.08)', border: '2px solid #f1f5f9' }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                                                            <div>
                                                                <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 900 }}>Konfiguracija Kapaciteta</h4>
                                                                <p style={{ margin: 0, fontSize: '12px', opacity: 0.6 }}>Unesite broj soba i status</p>
                                                            </div>
                                                            <div className="capacity-input-modern" style={{ width: '160px', borderRadius: '16px', border: '2px solid #7c3aed' }}>
                                                                <button style={{ color: '#7c3aed' }} onClick={() => setCapValue(prev => (parseInt(prev) - 1).toString())}>-</button>
                                                                <input value={capValue} onChange={e => setCapValue(e.target.value)} style={{ fontWeight: 800, color: '#1e293b' }} />
                                                                <button style={{ color: '#7c3aed' }} onClick={() => setCapValue(prev => (parseInt(prev) + 1).toString())}>+</button>
                                                            </div>
                                                        </div>

                                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '20px' }}>
                                                            {['ALOTMAN', 'STOP', 'ON REQUEST', 'FIX'].map(st => (
                                                                <button
                                                                    key={st}
                                                                    onClick={() => setCapStatus(st as any)}
                                                                    style={{
                                                                        padding: '12px 5px', borderRadius: '12px', border: 'none', fontSize: '10px', fontWeight: 900, cursor: 'pointer', transition: '0.2s',
                                                                        background: capStatus === st ? '#7c3aed' : '#f1f5f9',
                                                                        color: capStatus === st ? 'white' : '#64748b'
                                                                    }}
                                                                >
                                                                    {st}
                                                                </button>
                                                            ))}
                                                        </div>

                                                        <div
                                                            onClick={() => setCapOverwrite(!capOverwrite)}
                                                            style={{
                                                                padding: '15px', borderRadius: '16px', cursor: 'pointer', border: '1px solid',
                                                                borderColor: capOverwrite ? '#dc2626' : '#e2e8f0',
                                                                background: capOverwrite ? '#fef2f2' : '#f8fafc',
                                                                display: 'flex', alignItems: 'center', gap: '15px'
                                                            }}
                                                        >
                                                            <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: capOverwrite ? '#dc2626' : '#fff', border: '2px solid #ddd', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                                {capOverwrite && <Check size={16} color="white" />}
                                                            </div>
                                                            <div>
                                                                <div style={{ fontSize: '13px', fontWeight: 800, color: capOverwrite ? '#991b1b' : '#334155' }}>PREBRIŠI KAPACITETE</div>
                                                                <div style={{ fontSize: '10px', opacity: 0.6 }}>Nove vrednosti menjaju stare (bez sabiranja)</div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', justifyContent: 'center' }}>
                                                        <div style={{ background: '#f5f3ff', padding: '20px', borderRadius: '24px', display: 'flex', gap: '15px', alignItems: 'center' }}>
                                                            <div style={{ width: '40px', height: '40px', background: 'white', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                                <Sparkles size={20} color="#7c3aed" />
                                                            </div>
                                                            <p style={{ margin: 0, fontSize: '13px', lineHeight: '1.4', color: '#5b21b6' }}>
                                                                <strong>Studio Režim:</strong> Sve izmene su pod nadzorom i biće zabeležene u <strong>Audit Trail</strong> logovima.
                                                            </p>
                                                        </div>
                                                        <div style={{ background: '#fff', border: '1px dashed #7c3aed', padding: '20px', borderRadius: '24px', textAlign: 'center' }}>
                                                            <p style={{ margin: '0 0 10px 0', fontSize: '12px', opacity: 0.6 }}>Spremni za primenu?</p>
                                                            <button
                                                                className="preview-trigger-btn"
                                                                onClick={() => setShowReviewPreview(true)}
                                                                style={{ width: '100%', justifyContent: 'center', background: '#e0e7ff', color: '#4338ca', padding: '15px', borderRadius: '16px' }}
                                                            >
                                                                <Eye size={18} /> PROVERI DETALJE
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="wizard-footer" style={{ padding: '24px 40px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '20px', background: '#f8fafc', borderBottomLeftRadius: '24px', borderBottomRightRadius: '24px' }}>
                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                        <button
                                            className="op-btn-cancel-modern"
                                            onClick={() => setShowCapacityModal(false)}
                                            style={{
                                                background: 'white',
                                                border: '1px solid #e2e8f0',
                                                padding: '12px 24px',
                                                borderRadius: '12px',
                                                fontSize: '14px',
                                                fontWeight: 700,
                                                color: '#64748b',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            Odustani
                                        </button>
                                        <button
                                            className="op-btn-save-modern"
                                            onClick={handleSaveCapacity}
                                            style={{
                                                background: '#7c3aed',
                                                color: 'white',
                                                border: 'none',
                                                padding: '12px 32px',
                                                borderRadius: '14px',
                                                fontSize: '14px',
                                                fontWeight: 800,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '10px',
                                                cursor: 'pointer',
                                                boxShadow: '0 4px 12px rgba(124, 58, 237, 0.25)',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            <Check size={20} /> POTVRDI I SAČUVAJ
                                        </button>
                                    </div>
                                </div>

                                {/* NEW SUMMARY & CONFIRM POPUP (REPLACES NOTEPAD PREVIEW) */}
                                {showReviewPreview && (
                                    <div
                                        onClick={() => setShowReviewPreview(false)}
                                        style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.96)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
                                    >
                                        <div
                                            onClick={e => e.stopPropagation()}
                                            style={{ width: '100%', maxWidth: '650px', background: 'white', borderRadius: '24px', display: 'flex', flexDirection: 'column', border: 'none', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)', overflow: 'hidden' }}
                                        >
                                            <div style={{ padding: '30px', background: capOverwrite ? '#fee2e2' : '#f0f9ff', textAlign: 'center' }}>
                                                {capOverwrite ? <AlertTriangle size={48} color="#dc2626" /> : <Info size={48} color="#0284c7" />}
                                                <h2 style={{ margin: '15px 0 5px', color: '#1e293b' }}>Potvrda Akcije</h2>
                                                <p style={{ margin: 0, opacity: 0.7 }}>Pregledajte rezime pre nego što primenite izmene u bazu podataka.</p>
                                            </div>

                                            <div style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                                <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '16px' }}>
                                                    <div style={{ fontSize: '11px', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '10px' }}>Rezime Izmena</div>
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
                                                        <div style={{ fontSize: '14px' }}><strong>Hotel:</strong> {selectedHotel.name}</div>
                                                        <div style={{ fontSize: '14px' }}><strong>Period:</strong> {new Date(capDateFrom).toLocaleDateString()} - {new Date(capDateTo).toLocaleDateString()}</div>
                                                        <div style={{ fontSize: '14px' }}><strong>Tipovi soba:</strong> {capRooms.length} odabrana</div>
                                                        <div style={{ fontSize: '14px', padding: '10px', background: capOverwrite ? '#fef2f2' : '#f0fdf4', borderRadius: '8px', border: `1px dashed ${capOverwrite ? '#f87171' : '#4ade80'}` }}>
                                                            <strong>Način upisa:</strong> {capOverwrite ? 'PREBRISAVANJE (Gube se stare vrednosti)' : 'DODAVANJE (Sabiranje sa postojećim)'}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div style={{ fontSize: '13px' }}>
                                                    <div style={{ fontWeight: 800, marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}><HistoryIcon size={14} /> Mock Primeri Rezultata:</div>
                                                    <div className="summary-mock-table" style={{ border: '1px solid #e2e8f0', borderRadius: '10px', overflow: 'hidden' }}>
                                                        <div style={{ background: '#f1f5f9', padding: '8px 12px', fontSize: '11px', fontWeight: 800, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}>
                                                            <span>Datum</span>
                                                            <span>Staro</span>
                                                            <span>Novo</span>
                                                        </div>
                                                        <div style={{ padding: '8px 12px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderBottom: '1px solid #f1f5f9' }}>
                                                            <span>{new Date(capDateFrom).toLocaleDateString()}</span>
                                                            <span style={{ opacity: 0.5 }}>12</span>
                                                            <span style={{ color: '#7c3aed', fontWeight: 700 }}>{capOverwrite ? capValue : 12 + parseInt(capValue)}</span>
                                                        </div>
                                                        <div style={{ padding: '8px 12px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}>
                                                            <span>...</span>
                                                            <span style={{ opacity: 0.5 }}>12</span>
                                                            <span style={{ color: '#7c3aed', fontWeight: 700 }}>{capOverwrite ? capValue : 12 + parseInt(capValue)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <div style={{ padding: '24px 30px', background: '#f8fafc', display: 'flex', gap: '15px' }}>
                                                <button className="op-btn-secondary" onClick={() => setShowReviewPreview(false)} style={{ flex: 1, height: '54px' }}>Nazad</button>
                                                <button
                                                    className="op-btn-primary"
                                                    onClick={handleSaveCapacity}
                                                    style={{ flex: 2, height: '54px', background: capOverwrite ? '#dc2626' : '#7c3aed' }}
                                                >
                                                    <Check size={20} /> POTVRDI I SAČUVAJ
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        </div>
                    )
                }
            </AnimatePresence >

            {/* Visual Report Modal (Stop Sale / Free Capacity) */}
            <AnimatePresence>
                {
                    showReportModal.show && (
                        <div className="modal-overlay" onClick={() => setShowReportModal({ ...showReportModal, show: false })}>
                            <motion.div
                                drag
                                dragMomentum={false}
                                className="visual-report-modal large-modal"
                                onClick={e => e.stopPropagation()}
                                initial={{ scale: 0.9, opacity: 0, y: 50 }}
                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                exit={{ scale: 0.9, opacity: 0, y: 50 }}
                            >
                                <div className="report-modal-header drag-handle">
                                    <div className="report-title-section">
                                        <div className={`report-icon-box ${showReportModal.type}`}>
                                            {showReportModal.type === 'stop' ? <AlertTriangle size={24} /> : <Sparkles size={24} />}
                                        </div>
                                        <div>
                                            <h3>Hotelski Kapaciteti - Pregled po Danima</h3>
                                            <p className="report-subtitle">Generisano: {new Date().toLocaleDateString('sr-Latn-RS')} • Svi statusi (Stop, On Request, Slobodno)</p>
                                        </div>
                                    </div>
                                    <button className="report-close-btn" onClick={() => setShowReportModal({ ...showReportModal, show: false })}><X size={20} /></button>
                                </div>

                                <div className="report-body">
                                    <div className="report-link-section">
                                        <div style={{ marginBottom: '15px', color: 'var(--text-secondary)' }}>
                                            <Eye size={32} style={{ opacity: 0.3, marginBottom: '8px' }} />
                                            <h4 style={{ color: 'var(--text-primary)', marginBottom: '4px' }}>Jedinstveni B2B Link</h4>
                                            <p style={{ fontSize: '12px' }}>Subagenti mogu pristupiti ovom linku bez logovanja u sistem.</p>
                                        </div>

                                        <a
                                            href={`${window.location.protocol}//${window.location.host}/public-inventory?reportView=true&token=SR-${Math.random().toString(36).substring(7).toUpperCase()}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="secure-link-preview-link"
                                        >
                                            {`${window.location.protocol}//${window.location.host}/public-inventory?reportView=true&token=SR-...`}
                                            <div style={{ marginTop: '8px', fontSize: '10px', opacity: 0.6 }}>Klikni da otvoriš u novom prozoru</div>
                                        </a>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                                            <button
                                                className="link-btn-large"
                                                onClick={() => {
                                                    const token = `SR-${Math.random().toString(36).substring(7).toUpperCase()}`;
                                                    const url = `${window.location.protocol}//${window.location.host}/public-inventory?reportView=true&token=${token}`;
                                                    window.open(url, '_blank');
                                                }}
                                            >
                                                <ArrowUpRight size={18} /> Otvori Public View (Demo)
                                            </button>

                                            <button
                                                className="link-btn-large"
                                                style={{ background: '#f8fafc', color: '#1e293b', border: '1px solid #e2e8f0' }}
                                                onClick={() => {
                                                    const text = generateTextInventoryReport();
                                                    const blob = new Blob([`<html><body style="font-family: monospace; white-space: pre-wrap; padding: 40px; background: #f1f5f9;"><div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); border-left: 5px solid #7c3aed;">${text}</div></body></html>`], { type: 'text/html' });
                                                    const url = URL.createObjectURL(blob);
                                                    const a = document.createElement('a');
                                                    a.href = url;
                                                    a.download = `Inventory_Report_${new Date().toISOString().slice(0, 10)}.html`;
                                                    a.click();
                                                }}
                                            >
                                                <FileText size={18} /> Text Inventory Report
                                            </button>
                                        </div>

                                        <div className="report-sidebar-filters" style={{ marginTop: '25px', display: 'flex', flexDirection: 'column', gap: '15px', padding: '20px', background: 'var(--bg-main)', borderRadius: '16px', border: '1px solid var(--border)' }}>
                                            <div style={{ marginBottom: '5px' }}>
                                                <h5 style={{ margin: 0, fontSize: '14px', fontWeight: 800 }}>Podešavanje Distribucije</h5>
                                                <p style={{ margin: 0, fontSize: '11px', opacity: 0.6 }}>Filteri za odabir subagenata</p>
                                            </div>

                                            <div className="f-item">
                                                <label style={{ display: 'block', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '6px' }}>Pretraga Agenta</label>
                                                <div className="agent-search-wrapper" style={{ position: 'relative' }}>
                                                    <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
                                                    <input
                                                        type="text"
                                                        placeholder="Ime ili Email..."
                                                        value={agentSearchQuery}
                                                        onChange={e => setAgentSearchQuery(e.target.value)}
                                                        style={{ width: '100%', padding: '10px 10px 10px 35px', borderRadius: '10px', border: '1px solid var(--border)', fontSize: '13px', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                                                    />
                                                    {agentSearchQuery && (
                                                        <button style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)' }} onClick={() => setAgentSearchQuery('')}>
                                                            <X size={12} />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="f-item">
                                                <label style={{ display: 'block', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '6px' }}>Država</label>
                                                <select
                                                    value={reportFilterCountry}
                                                    onChange={e => {
                                                        setReportFilterCountry(e.target.value);
                                                        setReportFilterCity('Sve');
                                                    }}
                                                    style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid var(--border)', fontSize: '13px', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                                                >
                                                    {countries.map(c => <option key={c} value={c}>{c}</option>)}
                                                </select>
                                            </div>

                                            <div className="f-item">
                                                <label style={{ display: 'block', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '6px' }}>Grad</label>
                                                <select
                                                    value={reportFilterCity}
                                                    onChange={e => setReportFilterCity(e.target.value)}
                                                    style={{ width: '100%', padding: '10px', borderRadius: '10px', border: '1px solid var(--border)', fontSize: '13px', background: 'var(--bg-card)', color: 'var(--text-primary)' }}
                                                >
                                                    {cities.map(c => <option key={c} value={c}>{c}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="report-agent-config">

                                        {selectedAgentIds.length > 0 && (
                                            <div className="selected-agents-pool">
                                                <label>Trenutno odabrani ({selectedAgentIds.length}):</label>
                                                <div className="selected-chips-area">
                                                    {MOCK_SUBAGENTS.filter(a => selectedAgentIds.includes(a.id)).map(agent => (
                                                        <div key={agent.id} className="selected-agent-chip">
                                                            <span>{agent.name}</span>
                                                            <button onClick={() => setSelectedAgentIds(prev => prev.filter(id => id !== agent.id))}>
                                                                <X size={10} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div className="agent-selection-grid">
                                            <div className="selection-actions">
                                                <button onClick={() => setSelectedAgentIds(MOCK_SUBAGENTS.map(a => a.id))}>Odaberi sve</button>
                                                <button onClick={() => setSelectedAgentIds([])}>Poništi sve</button>
                                                <button onClick={() => setSelectedAgentIds(filteredAgents.map(a => a.id))}>Samo filtrirane</button>
                                            </div>
                                            <div className="agents-scroll-area">
                                                {paginatedAgents.map(agent => (
                                                    <label key={agent.id} className={`agent-checkbox-card ${selectedAgentIds.includes(agent.id) ? 'active' : ''}`}>
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedAgentIds.includes(agent.id)}
                                                            onChange={() => {
                                                                const next = selectedAgentIds.includes(agent.id)
                                                                    ? selectedAgentIds.filter(id => id !== agent.id)
                                                                    : [...selectedAgentIds, agent.id];
                                                                setSelectedAgentIds(next);
                                                            }}
                                                        />
                                                        <div className="agent-box-info">
                                                            <span className="a-name">{agent.name}</span>
                                                            <span className="a-loc">{agent.city}, {agent.country}</span>
                                                        </div>
                                                        {selectedAgentIds.includes(agent.id) && <Check size={14} className="check-icon" />}
                                                    </label>
                                                ))}
                                            </div>

                                            {totalReportPages > 1 && (
                                                <div className="report-pagination">
                                                    <button
                                                        disabled={reportCurrentPage === 1}
                                                        onClick={() => setReportCurrentPage(prev => Math.max(1, prev - 1))}
                                                        className="pag-btn"
                                                    >
                                                        <ChevronLeft size={16} />
                                                    </button>
                                                    <span className="pag-info">
                                                        Stranica <strong>{reportCurrentPage}</strong> od {totalReportPages}
                                                    </span>
                                                    <button
                                                        disabled={reportCurrentPage === totalReportPages}
                                                        onClick={() => setReportCurrentPage(prev => Math.min(totalReportPages, prev + 1))}
                                                        className="pag-btn"
                                                    >
                                                        <ChevronRight size={16} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="report-footer">
                                    <div className="subagent-bulk-info">
                                        <div className="subagent-summary">
                                            <MailCheck size={18} />
                                            <span>Target: <strong>{selectedAgentIds.length}</strong> subagenata</span>
                                        </div>
                                    </div>

                                    <button
                                        disabled={isSendingReport || selectedAgentIds.length === 0}
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
                                            <><CheckCircle2 size={18} /> Uspešno poslato!</>
                                        ) : (
                                            <><Send size={18} /> Pošalji odabranima</>
                                        )}
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )
                }
            </AnimatePresence >
            {/* AUDIT LOGS MODAL */}
            <AnimatePresence>
                {
                    showLogsModal && (
                        <div className="modal-overlay" onClick={() => setShowLogsModal(false)}>
                            <motion.div
                                drag
                                dragMomentum={false}
                                className="visual-report-modal"
                                style={{
                                    width: '98%',
                                    maxWidth: '1600px',
                                    height: 'auto',
                                    minHeight: '300px',
                                    maxHeight: '72vh',
                                    display: 'flex',
                                    flexDirection: 'column'
                                }}
                                onClick={e => e.stopPropagation()}
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                            >
                                <div className="report-modal-header drag-handle">
                                    <div className="report-title-section">
                                        <div className="report-icon-box" style={{ background: '#64748b' }}>
                                            <HistoryIcon size={24} />
                                        </div>
                                        <div>
                                            <h3>Audit Trail - Istorija Izmena Kapaciteta</h3>
                                            <p className="report-subtitle">Evidencija svih operacija, ko je izvršio promenu i šta je tačno urađeno.</p>
                                        </div>
                                    </div>
                                    <button className="report-close-btn" onClick={() => setShowLogsModal(false)}><X size={20} /></button>
                                </div>

                                <div className="report-body" style={{ background: '#fff', flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ overflow: 'auto', width: '100%', padding: '0' }}>
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                                            <thead>
                                                <tr style={{ textAlign: 'left', background: '#f8fafc', borderBottom: '2px solid #cbd5e1', position: 'sticky', top: 0, zIndex: 10 }}>
                                                    <th style={{ padding: '20px' }}>Datum i Vreme</th>
                                                    <th style={{ padding: '20px' }}>Korisnik</th>
                                                    <th style={{ padding: '20px' }}>Akcija</th>
                                                    <th style={{ padding: '20px' }}>Hotel</th>
                                                    <th style={{ padding: '20px' }}>Tip Sobe</th>
                                                    <th style={{ padding: '20px' }}>Opis Promene</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {capacityLogs.map((log, index) => (
                                                    <tr key={log.id} style={{ borderBottom: '1px solid #f1f5f9', background: index % 2 === 0 ? '#fff' : '#faffff' }}>
                                                        <td style={{ padding: '18px 20px', whiteSpace: 'nowrap', color: '#64748b' }}>{log.timestamp}</td>
                                                        <td style={{ padding: '18px 20px' }}><strong>{log.user}</strong></td>
                                                        <td style={{ padding: '18px 20px' }}>
                                                            <span style={{
                                                                padding: '5px 10px',
                                                                borderRadius: '8px',
                                                                background: log.action === 'Prebrisano' ? '#fee2e2' : '#f0f9ff',
                                                                color: log.action === 'Prebrisano' ? '#dc2626' : '#0284c7',
                                                                fontSize: '11px',
                                                                fontWeight: 900,
                                                                textTransform: 'uppercase'
                                                            }}>
                                                                {log.action}
                                                            </span>
                                                        </td>
                                                        <td style={{ padding: '18px 20px' }}>{log.hotel}</td>
                                                        <td style={{ padding: '18px 20px', color: '#475569', fontStyle: 'italic' }}>{log.room}</td>
                                                        <td style={{ padding: '18px 20px' }}>
                                                            <code style={{ background: '#7c3aed', color: 'white', padding: '6px 12px', borderRadius: '8px', fontWeight: 800 }}>{log.change}</code>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )
                }

                {
                    showPublicLinkModal && (
                        <div className="modal-overlay" onClick={() => setShowPublicLinkModal(null)}>
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.9, opacity: 0 }}
                                className="visual-report-modal"
                                style={{ maxWidth: '500px', width: '90%', padding: '30px' }}
                                onClick={e => e.stopPropagation()}
                            >
                                <div style={{ textAlign: 'center' }}>
                                    <div className="op-icon-badge" style={{ margin: '0 auto 20px', width: '60px', height: '60px' }}>
                                        <ExternalLink size={30} color="var(--accent)" />
                                    </div>
                                    <h3 style={{ margin: '0 0 10px', fontSize: '20px', fontWeight: 800 }}>Javni Link Generisan</h3>
                                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '25px' }}>
                                        Ovaj link omogućava direktan pristup izveštaju samo za entitet: <strong>{showPublicLinkModal}</strong>.
                                    </p>

                                    <div style={{
                                        background: '#f8fafc',
                                        padding: '15px',
                                        borderRadius: '12px',
                                        border: '1px solid #e2e8f0',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '10px',
                                        marginBottom: '25px'
                                    }}>
                                        <a
                                            href={`/public-inventory?reportView=true&entity=${encodeURIComponent(showPublicLinkModal || '')}&type=analytics&tags=${activeTags.join(',')}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{ flex: 1, fontSize: '12px', color: 'var(--accent)', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 700 }}
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            https://prime-click.travel/report/public/{showPublicLinkModal?.toLowerCase().replace(/ /g, '-')}/{Date.now()}
                                        </a>
                                        <button
                                            className="btn-icon"
                                            title="Copy to clipboard"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const url = `${window.location.origin}/public-inventory?reportView=true&entity=${encodeURIComponent(showPublicLinkModal || '')}&type=analytics&tags=${activeTags.join(',')}`;
                                                navigator.clipboard.writeText(url);
                                                alert('Link kopiran u clipboard!');
                                            }}
                                        >
                                            <Copy size={16} />
                                        </button>
                                    </div>

                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                        <button className="op-btn-secondary" onClick={() => setShowPublicLinkModal(null)}>Zatvori</button>
                                        <button className="btn-create-cap" style={{ background: '#10b981' }}>
                                            <Send size={16} /> Pošalji na Email
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )
                }
            </AnimatePresence >

            {
                showBookingCal && (
                    <ModernCalendar
                        startDate={bookingFrom}
                        endDate={bookingTo}
                        onChange={(start, end) => {
                            setBookingFrom(start || '2026-01-01');
                            setBookingTo(end || '2026-12-31');
                        }}
                        onClose={() => setShowBookingCal(false)}
                        allowPast={true}
                    />
                )
            }

            {
                showStayCal && (
                    <ModernCalendar
                        startDate={stayFrom}
                        endDate={stayTo}
                        onChange={(start, end) => {
                            setStayFrom(start || '2026-06-01');
                            setStayTo(end || '2026-08-31');
                        }}
                        onClose={() => setShowStayCal(false)}
                        allowPast={true}
                    />
                )
            }

            {
                showGridCal && (
                    <ModernCalendar
                        startDate={selectedDate.toISOString().split('T')[0]}
                        endDate={selectedDate.toISOString().split('T')[0]}
                        singleMode={true}
                        onChange={(start) => {
                            setSelectedDate(new Date(start));
                        }}
                        onClose={() => setShowGridCal(false)}
                        allowPast={true}
                    />
                )
            }


        </div >
    );
};

export default OperationalReports;
