import { RevenueOptimizationAgent } from '../../services/ai/RevenueOptimizationAgent';
import React, { useState, useEffect } from 'react';
import {
    Bot,
    Send,
    Settings,
    FileSpreadsheet,
    Zap,
    Save,
    Calendar,
    Table as TableIcon,
    Clock,
    Database,
    Sun,
    Moon,
    Trash2,
    Plus,
    Download,
    AlertCircle,
    FolderOpen,
    Loader2,
    CheckCircle2,
    Play,
    Code,
    Edit3,
    Copy,
    Info,
    RefreshCcw,
    FileText,
    Search,
    MapPin,
    Globe,
    Hotel,
    X,
    X as XIcon,
    ArrowLeft,
    Move
} from 'lucide-react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import './PricingModule.styles.css';
import { useThemeStore } from '../../stores';
import { PricingCodeView } from './PricingCodeView';
import { HOTEL_SERVICES } from '../../data/services/hotelServices';
import { ROOM_PREFIXES, ROOM_VIEWS, ROOM_TYPES } from '../../data/rooms/roomTypes';
import { mapSolvexToInternal, MOCK_SOLVEX_DATA } from './solvexImporter';
import {
    createPricelist,
    getPricelists,
    getPricelistWithDetails,
    type Pricelist,
    type PricePeriod,
    type PriceRule
} from './pricelistService';
import AiMapperPreview from './AiMapperPreview';
import PricingSimulator from './PricingSimulator';
import ManualPricelistCreator from './ManualPricelistCreator';
import PricelistItemsList from './PricelistItemsList';
import PricelistReportView from './PricelistReportView';
import BulkPriceManagement from './BulkPriceManagement';
import PricingTeacher from './PricingTeacher';
import { ModernCalendar } from '../../components/ModernCalendar';
import PricelistSpreadsheet from './PricelistSpreadsheet';
import PriceInspector from './PriceInspector';

const styles = {
    button: {
        padding: '10px 20px',
        borderRadius: '10px',
        border: 'none',
        cursor: 'pointer',
        fontSize: '13px',
        fontWeight: 600,
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        transition: 'all 0.2s',
        fontFamily: "'Inter', sans-serif"
    },
    input: {
        width: '100%',
        padding: '12px 16px',
        borderRadius: '10px',
        background: 'var(--bg-input)',
        border: '1.5px solid var(--pricing-input-border, var(--border))',
        color: 'var(--text-primary)',
        outline: 'none',
        fontSize: '14px',
        fontFamily: "'Inter', sans-serif",
        boxSizing: 'border-box' as const,
        transition: 'border-color 0.2s'
    }
};

const SOLVEX_MOCK_DATA = [
    {
        id: 'solvex-1',
        hotelId: 'BG-BSK-101',
        title: 'Solvex Casa Karina 2026',
        roomType: 'DBL ROOM (2 Adults)',
        dateFrom: '2026-12-01',
        dateTo: '2026-12-21',
        netPrice: 100,
        brutoPrice: 120,
        status: 'active',
        occupancy: { adults: 2, children: 0 },
        logs: [
            { timestamp: '2024-03-10 10:00', user: 'Sistem', action: 'Inicijalni import' }
        ]
    }
];

const MEETING_POINT_MOCK_DATA = [
    {
        id: 'mp-1',
        hotelId: 'HR-POR-202',
        title: 'Meeting Point - Materada 2024',
        roomType: 'Standard Garden View',
        dateFrom: '2024-04-20',
        dateTo: '2024-05-20',
        netPrice: 38.00,
        brutoPrice: 48.00,
        status: 'active',
        occupancy: { adults: 2, children: 1 },
        hotelName: "Hotel Materada Plava Laguna",
        supplier: "Meeting Point"
    },
    {
        id: 'mp-2',
        hotelId: 'HR-POR-202',
        title: 'Meeting Point - Materada 2024',
        roomType: 'Standard Garden View',
        dateFrom: '2024-05-21',
        dateTo: '2024-06-15',
        netPrice: 52.00,
        brutoPrice: 65.00,
        status: 'active',
        occupancy: { adults: 2, children: 1 },
        hotelName: "Hotel Materada Plava Laguna",
        supplier: "Meeting Point"
    },
    {
        id: 'mp-3',
        hotelId: 'HR-POR-202',
        title: 'Meeting Point - Materada 2024',
        roomType: 'Standard Garden View',
        dateFrom: '2024-06-16',
        dateTo: '2024-07-10',
        netPrice: 82.00,
        brutoPrice: 99.00,
        status: 'active',
        occupancy: { adults: 2, children: 1 },
        hotelName: "Hotel Materada Plava Laguna",
        supplier: "Meeting Point"
    },
    {
        id: 'mp-4',
        hotelId: 'HR-POR-202',
        title: 'Meeting Point - Materada 2024',
        roomType: 'Standard Garden View',
        dateFrom: '2024-07-11',
        dateTo: '2024-08-25',
        netPrice: 105.00,
        brutoPrice: 128.00,
        status: 'active',
        occupancy: { adults: 2, children: 1 },
        hotelName: "Hotel Materada Plava Laguna",
        supplier: "Meeting Point"
    },
    {
        id: 'mp-5',
        hotelId: 'HR-POR-202',
        title: 'Meeting Point - Materada 2024',
        roomType: 'Standard Garden View',
        dateFrom: '2024-08-26',
        dateTo: '2024-09-15',
        netPrice: 75.00,
        brutoPrice: 89.00,
        status: 'active',
        occupancy: { adults: 2, children: 1 },
        hotelName: "Hotel Materada Plava Laguna",
        supplier: "Meeting Point"
    },
    {
        id: 'mp-6',
        hotelId: 'HR-POR-202',
        title: 'Meeting Point - Materada 2024',
        roomType: 'Standard Garden View',
        dateFrom: '2024-09-16',
        dateTo: '2024-10-31',
        netPrice: 42.00,
        brutoPrice: 52.00,
        status: 'active',
        occupancy: { adults: 2, children: 1 },
        hotelName: "Hotel Materada Plava Laguna",
        supplier: "Meeting Point"
    }
];

const VESPERA_MOCK_DATA = [
    // Standard Plus Room (2+1)
    { id: 'vs-1', hotelId: 'HR-LOS-303', title: 'Hotel Vespera - Summer 2026', roomType: 'Standard Plus Room (2+1)', dateFrom: '2026-05-15', dateTo: '2026-06-20', netPrice: 95.00, brutoPrice: 115.00, status: 'active', occupancy: { adults: 2, children: 1 }, hotelName: "Hotel Vespera", supplier: "Family Hotels Group" },
    { id: 'vs-2', hotelId: 'HR-LOS-303', title: 'Hotel Vespera - Summer 2026', roomType: 'Standard Plus Room (2+1)', dateFrom: '2026-06-21', dateTo: '2026-07-15', netPrice: 145.00, brutoPrice: 178.00, status: 'active', occupancy: { adults: 2, children: 1 }, hotelName: "Hotel Vespera", supplier: "Family Hotels Group" },
    { id: 'vs-3', title: 'Hotel Vespera - Summer 2026', roomType: 'Standard Plus Room (2+1)', dateFrom: '2026-07-16', dateTo: '2026-08-25', netPrice: 195.00, brutoPrice: 245.00, status: 'active', occupancy: { adults: 2, children: 1 }, hotelName: "Hotel Vespera", supplier: "Family Hotels Group" },
    { id: 'vs-4', title: 'Hotel Vespera - Summer 2026', roomType: 'Standard Plus Room (2+1)', dateFrom: '2026-08-26', dateTo: '2026-09-20', netPrice: 155.00, brutoPrice: 189.00, status: 'active', occupancy: { adults: 2, children: 1 }, hotelName: "Hotel Vespera", supplier: "Family Hotels Group" },

    // Family Room (2+2)
    { id: 'vs-5', hotelId: 'HR-LOS-303', title: 'Hotel Vespera - Summer 2026', roomType: 'Family Room (2+2)', dateFrom: '2026-05-15', dateTo: '2026-06-20', netPrice: 145.00, brutoPrice: 175.00, status: 'active', occupancy: { adults: 2, children: 2 }, hotelName: "Hotel Vespera", supplier: "Family Hotels Group" },
    { id: 'vs-6', hotelId: 'HR-LOS-303', title: 'Hotel Vespera - Summer 2026', roomType: 'Family Room (2+2)', dateFrom: '2026-06-21', dateTo: '2026-07-15', netPrice: 185.00, brutoPrice: 225.00, status: 'active', occupancy: { adults: 2, children: 2 }, hotelName: "Hotel Vespera", supplier: "Family Hotels Group" },
    { id: 'vs-7', title: 'Hotel Vespera - Summer 2026', roomType: 'Family Room (2+2)', dateFrom: '2026-07-16', dateTo: '2026-08-25', netPrice: 245.00, brutoPrice: 299.00, status: 'active', occupancy: { adults: 2, children: 2 }, hotelName: "Hotel Vespera", supplier: "Family Hotels Group" },
    { id: 'vs-8', title: 'Hotel Vespera - Summer 2026', roomType: 'Family Room (2+2)', dateFrom: '2026-08-26', dateTo: '2026-09-20', netPrice: 195.00, brutoPrice: 239.00, status: 'active', occupancy: { adults: 2, children: 2 }, hotelName: "Hotel Vespera", supplier: "Family Hotels Group" },

    // Suite Sea View (2+1)
    { id: 'vs-9', hotelId: 'HR-LOS-303', title: 'Hotel Vespera - Summer 2026', roomType: 'Suite Sea View (2+1)', dateFrom: '2026-05-15', dateTo: '2026-06-20', netPrice: 185.00, brutoPrice: 225.00, status: 'active', occupancy: { adults: 2, children: 1 }, hotelName: "Hotel Vespera", supplier: "Family Hotels Group" },
    { id: 'vs-10', hotelId: 'HR-LOS-303', title: 'Hotel Vespera - Summer 2026', roomType: 'Suite Sea View (2+1)', dateFrom: '2026-06-21', dateTo: '2026-07-15', netPrice: 235.00, brutoPrice: 285.00, status: 'active', occupancy: { adults: 2, children: 1 }, hotelName: "Hotel Vespera", supplier: "Family Hotels Group" },
    { id: 'vs-11', title: 'Hotel Vespera - Summer 2026', roomType: 'Suite Sea View (2+1)', dateFrom: '2026-07-16', dateTo: '2026-08-25', netPrice: 315.00, brutoPrice: 385.00, status: 'active', occupancy: { adults: 2, children: 1 }, hotelName: "Hotel Vespera", supplier: "Family Hotels Group" },
    { id: 'vs-12', title: 'Hotel Vespera - Summer 2026', roomType: 'Suite Sea View (2+1)', dateFrom: '2026-08-26', dateTo: '2026-09-20', netPrice: 255.00, brutoPrice: 310.00, status: 'active', occupancy: { adults: 2, children: 1 }, hotelName: "Hotel Vespera", supplier: "Family Hotels Group" }
];

const formatDate = (dateStr: string) => {
    if (!dateStr || typeof dateStr !== 'string') return dateStr;
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
};

export interface PricingIntelligenceProps {
    isPublic?: boolean;
}

const DEFAULT_TABS = [
    {id: 'teacher', label: 'Teacher'},
    {id: 'items', label: 'Pregled Cena'},
    {id: 'simulator', label: 'Simulator'},
    {id: 'manual', label: 'Ručni Unos'},
    {id: 'bulk', label: 'Grupna Izmena'},
    {id: 'agent', label: 'AI Agent'},
    {id: 'supplements', label: 'Doplate / Popusti'},
    {id: 'offers', label: 'Specijalne Ponude'},
    {id: 'taxes', label: 'Takse'},
    {id: 'notes', label: 'Napomene'},
    {id: 'report', label: 'Izveštaj'}
];

const PricingIntelligence: React.FC<PricingIntelligenceProps> = ({ isPublic = false }) => {
    const { theme } = useThemeStore();
    const location = useLocation();
    
    // States first
    const [tabs, setTabs] = useState(() => {
        const saved = localStorage.getItem('pricing-tabs-order');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                const existingIds = new Set(parsed.map((t: any) => t.id));
                const missing = DEFAULT_TABS.filter(t => !existingIds.has(t.id));
                return [...parsed, ...missing];
            } catch (e) {
                return DEFAULT_TABS;
            }
        }
        return DEFAULT_TABS;
    });
    const [isReordering, setIsReordering] = useState(false);
    const [viewMode, setViewMode] = useState<'code' | 'standard'>('standard');
    const [priceDisplay, setPriceDisplay] = useState<'neto' | 'bruto' | 'all'>('all');
    const [showAiMapper, setShowAiMapper] = useState(false);
    const [activeTab, setActiveTab] = useState<string>(isPublic ? 'report' : 'teacher');
    const [bookingDates, setBookingDates] = useState<{from: string, to: string}>({from: '', to: ''});
    const [stayDates, setStayDates] = useState<{from: string, to: string}>({from: '', to: ''});
    const [activePicker, setActivePicker] = useState<'booking' | 'stay' | null>(null);
    const [messages, setMessages] = useState([
        { role: 'ai', content: 'Pozdrav! Ja sam vaš Revenue AI asistent. Možete mi davati komande za optimizaciju cena.' }
    ]);
    const [input, setInput] = useState('');
    const [isDarkMode, setIsDarkMode] = useState(theme === 'navy');
    const [isExecutingCommand, setIsExecutingCommand] = useState(false);
    const [pricelists, setPricelists] = useState<any[]>([...SOLVEX_MOCK_DATA, ...MEETING_POINT_MOCK_DATA, ...VESPERA_MOCK_DATA]);
    const [isLoading, setIsLoading] = useState(false);
    const [productState, setProductState] = useState({ service: '', prefix: '', type: '', view: '', name: '' });
    const [pricePeriods, setPricePeriods] = useState<any[]>([]);
    const [supplementsState, setSupplementsState] = useState<any[]>([
        { name: 'Polupansion (HB)', price: 'Uračunato', type: 'Doplata' },
        { name: 'Boravišna taksa', price: '1.50 € / dan', type: 'Doplata' },
        { name: 'Early Booking', price: '10%', type: 'Popust' }
    ]);
    const [notesState, setNotesState] = useState<string[]>([
        'Cene su izražene po osobi po noćenju.',
        'Deca do 3.99 godina borave besplatno.'
    ]);
    const [specialOffers, setSpecialOffers] = useState<any[]>([
        { name: 'Early Booking', details: '15% popusta za uplate do 31.12.', type: 'EB' },
        { name: '7=6 Gratis dani', details: 'Boravite 7 noći, platite 6 (u junu)', type: 'FreeDay' }
    ]);
    const [taxState, setTaxState] = useState<any[]>([
        { name: 'Sojourn Tax adults', price: '1.50 € / dan', type: 'Daily' },
        { name: 'Sojourn Tax children (12-18)', price: '0.75 € / dan', type: 'Daily' }
    ]);
    const [pricelistId, setPricelistId] = useState<string | null>(null);
    const [pricelistTitle, setPricelistTitle] = useState('Novi Cenovnik');
    const [savedPricelists, setSavedPricelists] = useState<Pricelist[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [showLoadModal, setShowLoadModal] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [calcMode, setCalcMode] = useState('per_person_day');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchTags, setSearchTags] = useState<string[]>([]);
    const [showPredictive, setShowPredictive] = useState(false);
    const [marginPercent, setMarginPercent] = useState('15');
    const [marginAmount, setMarginAmount] = useState('0');
    const [marginRooms, setMarginRooms] = useState<string[]>([]);
    const [marginBookingRange, setMarginBookingRange] = useState({ from: '', to: '' });
    const [marginStayRange, setMarginStayRange] = useState({ from: '', to: '' });
    const [pricelistSearchQuery, setPricelistSearchQuery] = useState('');

    // Functions
    const loadItemToDev = (item: any) => {
        setPricelistId(item.id);
        const title = item.title || 'Cenovnik';
        const hotelName = item.hotelName || item.hotelId || '';
        setPricelistTitle(title);
        
        setProductState({
            service: item.service || 'HB',
            prefix: '',
            type: item.roomType || '',
            view: '',
            name: hotelName
        });

        // Load all periods for this hotel and room type combination
        const relatedPeriods = pricelists
            .filter(p => (p.hotelName === hotelName || p.hotelId === item.hotelId) && p.roomType === item.roomType)
            .map((p, idx) => ({
                id: p.id || String(idx),
                dateFrom: p.dateFrom,
                dateTo: p.dateTo,
                netPrice: p.netPrice,
                brutoPrice: p.brutoPrice,
                status: p.status || 'active'
            }));

        if (relatedPeriods.length > 0) {
            setPricePeriods(relatedPeriods);
        } else if (item.dateFrom && item.dateTo) {
            setPricePeriods([{
                id: '1',
                dateFrom: item.dateFrom,
                dateTo: item.dateTo,
                netPrice: item.netPrice,
                brutoPrice: item.brutoPrice,
                status: 'active'
            }]);
        }
    };

    // Effects
    useEffect(() => {
        localStorage.setItem('pricing-tabs-order', JSON.stringify(tabs));
    }, [tabs]);

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        
        if (isPublic) {
            setActiveTab('report');
            setViewMode('standard');
            
            const entity = params.get('entity');
            const tags = params.get('tags');
            const view = params.get('view') as 'neto' | 'bruto' | 'all';
            
            if (entity) setSearchQuery(entity);
            if (tags) setSearchTags(tags.split(',').filter(Boolean));
            if (view) setPriceDisplay(view);
            else setPriceDisplay('bruto');
        }

        if (params.get('mode') === 'dev') {
            setViewMode('code');
            const id = params.get('id');
            if (id) {
                const item = pricelists.find(p => p.id === id);
                if (item) {
                    loadItemToDev(item);
                }
            }
        }
    }, [isPublic, location.search, pricelists]);

    const PREDICTIVE_HINTS = [
        { label: 'Hrvatska', type: 'country' },
        { label: 'Bugarska', type: 'country' },
        { label: 'Grčka', type: 'country' },
        { label: 'Crna Gora', type: 'country' },
        { label: 'Italija', type: 'country' },
        { label: 'Bansko', type: 'destination' },
        { label: 'Poreč', type: 'destination' },
        { label: 'Budva', type: 'destination' },
        { label: 'Hotel Materada Plava Laguna', type: 'hotel' },
        { label: 'Hotel Vespera', type: 'hotel' },
        { label: 'Casa Karina 4*', type: 'hotel' }
    ];

    useEffect(() => {
        setIsDarkMode(theme === 'navy');
        loadSavedPricelists();
        fetchPricelistItems();
    }, [theme]);

    const loadSavedPricelists = async () => {
        const { data, error } = await getPricelists();
        if (!error && data) setSavedPricelists(data);
    };

    const fetchPricelistItems = async () => {
        setIsLoading(true);
        try {
            const { pricingService } = await import('../../services/pricing/pricingService');
            const data = await pricingService.getPricelists();
            const mappedItems: any[] = [];
            data.forEach((pl: any) => {
                pl.price_periods?.forEach((pp: any) => {
                    mappedItems.push({
                        id: pp.id,
                        pricelist_id: pl.id,
                        roomType: pp.room_type_name,
                        dateFrom: pp.date_from,
                        dateTo: pp.date_to,
                        netPrice: pp.net_price,
                        brutoPrice: pp.gross_price,
                        occupancy: { adults: 2, children: 1 },
                        status: pl.status,
                        title: pl.title
                    });
                });
            });
            setPricelists([...SOLVEX_MOCK_DATA, ...MEETING_POINT_MOCK_DATA, ...VESPERA_MOCK_DATA, ...mappedItems]);
        } catch (error) {
            console.error('Failed to fetch items:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleApplyMargin = () => {
        const percent = parseFloat(marginPercent) || 0;
        const amount = parseFloat(marginAmount) || 0;
        
        const selectedHotelTag = searchTags.find(t => PREDICTIVE_HINTS.some(h => h.label === t && h.type === 'hotel'));

        const updatedPricelists = pricelists.map(p => {
            const title = p.title || "";
            const hotelName = p.hotelName || (title.includes('Solvex') ? "Casa Karina 4*" : (title.includes('Meeting Point') ? "Hotel Materada Plava Laguna" : "Hotel Vespera"));
            
            // 1. Hotel check
            if (selectedHotelTag && !hotelName.toLowerCase().includes(selectedHotelTag.toLowerCase())) {
                return p;
            }

            // 2. Room Type check
            if (marginRooms.length > 0) {
                const roomType = (p.roomType || "").toLowerCase();
                const matchesRoom = marginRooms.some(r => roomType.includes(r.toLowerCase()));
                if (!matchesRoom) return p;
            }

            // 3. Stay Period check
            if (marginStayRange.from && p.dateFrom < marginStayRange.from) return p;
            if (marginStayRange.to && p.dateTo > marginStayRange.to) return p;

            // 4. Apply Margin
            let newBruto = p.netPrice || 0;
            if (percent > 0) {
                newBruto = newBruto + (newBruto * (percent / 100));
            }
            if (amount > 0) {
                newBruto += amount;
            }

            if (percent === 0 && amount === 0) return p;

            return {
                ...p,
                brutoPrice: Math.round(newBruto * 100) / 100
            };
        });

        setPricelists(updatedPricelists);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
    };

    const handleSendMessage = async () => {
        if (!input.trim() || isExecutingCommand) return;
        const userMsg = input;
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setInput('');
        setIsExecutingCommand(true);
        try {
            const command = await RevenueOptimizationAgent.parseCommand(userMsg);
            const result = await RevenueOptimizationAgent.executeUpdate(command);
            if (result.success) {
                setMessages(prev => [...prev, { role: 'ai', content: `Uspešno: ${result.modifiedCount} izmena.` }]);
                fetchPricelistItems();
            } else {
                setMessages(prev => [...prev, { role: 'ai', content: 'Nije pronađeno ništa za izmenu.' }]);
            }
        } catch (e) {
            setMessages(prev => [...prev, { role: 'ai', content: 'Greška u obradi.' }]);
        } finally {
            setIsExecutingCommand(false);
        }
    };

    function renderStandardUI() {
        if (isPublic) {
            return (
                <div className="no-scrollbar" style={{ padding: '0px', width: '100%', display: 'flex', flexDirection: 'column', flex: 1, minHeight: '100vh' }}>
                    <div style={{ 
                        background: 'var(--bg-dark)', 
                        padding: '30px 20px', 
                        textAlign: 'center', 
                        borderBottom: '1px solid var(--border)',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                        zIndex: 100,
                        position: 'sticky',
                        top: 0
                    }}>
                        <h2 style={{ fontSize: '28px', fontWeight: 800, margin: 0, color: 'var(--accent-cyan)' }}>Zvanični Izveštaj Cena</h2>
                        <p style={{ color: 'var(--text-secondary)', margin: '8px 0 0' }}>PrimeClick Pricing Intelligence System</p>
                    </div>
                    <div style={{ padding: '20px 20px 60px', flex: 1 }}>
                        {renderTabContent()}
                    </div>
                </div>
            );
        }

        return (
            <div style={{ padding: '20px', width: '100%', display: 'flex', flexDirection: 'column' }}>
                {/* Sticky Navigation Block (Header + Tabs) */}
                <div style={{ 
                    position: 'sticky',
                    top: 0,
                    zIndex: 110,
                    background: 'var(--bg-dark)',
                    margin: '-20px -20px 0 -20px',
                    padding: '20px 20px 0 20px',
                    borderBottom: '1px solid var(--border)',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
                }}>
                    <div style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        marginBottom: '10px'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                            <button 
                                onClick={() => window.history.back()}
                                style={{ 
                                    ...styles.button, 
                                    background: 'rgba(255,255,255,0.05)', 
                                    padding: '12px', 
                                    border: '1px solid var(--glass-border)',
                                    color: 'var(--accent-cyan)'
                                }}
                            >
                                <ArrowLeft size={20} />
                            </button>
                            <div>
                                <h2 style={{ fontSize: '28px', fontWeight: 800, margin: 0, color: 'var(--accent-cyan)' }}>Pricing Intelligence</h2>
                                <p style={{ color: 'var(--text-secondary)', margin: '4px 0 0' }}>Sistem za upravljanje i analizu profitabilnosti.</p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <button 
                                onClick={() => setIsReordering(!isReordering)} 
                                style={{ 
                                    ...styles.button, 
                                    background: isReordering ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.05)', 
                                    color: isReordering ? '#000' : 'var(--text-secondary)',
                                    borderColor: isReordering ? 'var(--accent-cyan)' : 'var(--glass-border)'
                                }}
                                title="Reorganizuj tabove"
                            >
                                <Move size={16} /> {isReordering ? 'Završi' : 'Pomeri Tabove'}
                            </button>
                            <button 
                                onClick={() => {
                                    if (selectedItem) loadItemToDev(selectedItem);
                                    setViewMode('code');
                                }} 
                                style={{ ...styles.button, background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}
                            >
                                <Code size={16} /> Dev Mode
                            </button>
                            <button style={{ ...styles.button, background: 'var(--accent-cyan)', color: '#000' }}>
                                <Save size={18} /> Sačuvaj Promene
                            </button>
                            {/* Added Price Display Filters */}
                            <div style={{ width: '1px', height: '20px', background: 'var(--border)', margin: '0 10px' }} />
                            
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <span style={{ fontSize: '11px', color: 'var(--text-dim)', fontWeight: 800, textTransform: 'uppercase', marginRight: '5px' }}>Prikaz Cene:</span>
                                <button 
                                    onClick={() => setPriceDisplay('neto')} 
                                    style={{ ...styles.button, background: priceDisplay === 'neto' ? 'rgba(0, 229, 255, 0.2)' : 'transparent', border: priceDisplay === 'neto' ? '1px solid var(--accent-cyan)' : '1px solid transparent', color: priceDisplay === 'neto' ? 'var(--accent-cyan)' : 'var(--text-secondary)', padding: '6px 14px' }}
                                >Neto</button>
                                <button 
                                    onClick={() => setPriceDisplay('bruto')} 
                                    style={{ ...styles.button, background: priceDisplay === 'bruto' ? 'rgba(16, 185, 129, 0.2)' : 'transparent', border: priceDisplay === 'bruto' ? '1px solid #10b981' : '1px solid transparent', color: priceDisplay === 'bruto' ? '#10b981' : 'var(--text-secondary)', padding: '6px 14px' }}
                                >Bruto</button>
                                <button 
                                    onClick={() => setPriceDisplay('all')} 
                                    style={{ ...styles.button, background: priceDisplay === 'all' ? 'rgba(255, 179, 0, 0.2)' : 'transparent', border: priceDisplay === 'all' ? '1px solid var(--accent-gold)' : '1px solid transparent', color: priceDisplay === 'all' ? 'var(--accent-gold)' : 'var(--text-secondary)', padding: '6px 14px' }}
                                >Sve (N+B+M)</button>
                            </div>
                        </div>
                    </div>

                    <div style={{ 
                        marginTop: '10px'
                    }}>
                        <Reorder.Group 
                            axis="x" 
                            values={tabs} 
                            onReorder={setTabs}
                            style={{ 
                                display: 'flex', 
                                gap: '10px', 
                                overflowX: 'auto', 
                                paddingBottom: '5px',
                                listStyle: 'none',
                                padding: 0,
                                margin: 0
                            }}
                            className="no-scrollbar"
                        >
                            {tabs.map(tab => (
                                <Reorder.Item 
                                    key={tab.id} 
                                    value={tab}
                                    dragListener={isReordering}
                                    style={{ flexShrink: 0 }}
                                >
                                    <button 
                                        onClick={() => !isReordering && setActiveTab(tab.id)} 
                                        style={{ 
                                            padding: '12px 20px', 
                                            border: 'none', 
                                            background: 'transparent', 
                                            color: activeTab === tab.id ? 'var(--accent-cyan)' : 'var(--text-secondary)', 
                                            fontSize: '13px', 
                                            fontWeight: 800, 
                                            cursor: isReordering ? 'grab' : 'pointer', 
                                            borderBottom: activeTab === tab.id ? '3px solid var(--accent-cyan)' : '3px solid transparent', 
                                            textTransform: 'uppercase', 
                                            whiteSpace: 'nowrap',
                                            transition: 'all 0.2s',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            opacity: isReordering ? 0.8 : 1
                                        }}
                                    >
                                        {isReordering && <Move size={12} style={{ opacity: 0.5 }} />}
                                        {tab.label}
                                    </button>
                                </Reorder.Item>
                            ))}
                        </Reorder.Group>
                    </div>
                </div>

                {/* Main Search Bar Expanded - ONLY for Pregled Cena */}
                {activeTab === 'items' && (
                    <div style={{ background: 'var(--bg-card)', borderRadius: '20px', padding: '15px', border: '1px solid var(--glass-border)', backdropFilter: 'blur(20px)', display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '30px', marginBottom: '30px' }}>
                        
                        {/* Top Row: Smart Search + Modes */}
                        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                            <div style={{ display: 'flex', flex: 1, alignItems: 'center', gap: '15px', background: 'rgba(0,0,0,0.3)', padding: '15px 25px', borderRadius: '18px', border: '1px solid var(--accent-cyan)' }}>
                                <Search size={24} color="var(--accent-cyan)" />
                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', flex: 1 }}>
                                    {searchTags.map(tag => (
                                        <span key={tag} style={{ background: 'var(--petrol-500)', color: '#fff', padding: '5px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid var(--accent-cyan)' }}>
                                            {tag}
                                            <XIcon size={14} style={{ cursor: 'pointer' }} onClick={() => setSearchTags(searchTags.filter(t => t !== tag))} />
                                        </span>
                                    ))}
                                    <input 
                                        placeholder="Pretraži Državu, Destinaciju, Hotel..." 
                                        value={searchQuery}
                                        onChange={(e) => {setSearchQuery(e.target.value); setShowPredictive(true);}}
                                        style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '18px', outline: 'none', flex: 1, minWidth: '400px', fontWeight: 600 }} 
                                    />
                                </div>
                            </div>

                            {/* New Dedicated Pricelist Name Field */}
                            <div style={{ display: 'flex', flex: 0.6, alignItems: 'center', gap: '15px', background: 'rgba(0,0,0,0.3)', padding: '15px 25px', borderRadius: '18px', border: '1px solid var(--accent-gold)' }}>
                                <FileText size={20} color="var(--accent-gold)" />
                                <input 
                                    placeholder="Naziv cenovnika..." 
                                    value={pricelistSearchQuery}
                                    onChange={(e) => setPricelistSearchQuery(e.target.value)}
                                    style={{ background: 'transparent', border: 'none', color: 'white', fontSize: '18px', outline: 'none', flex: 1, fontWeight: 600 }} 
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '8px' }}>
                                {['per_person_day', 'per_person_period', 'per_room_day', 'per_room_period'].map(mode => (
                                    <button key={mode} onClick={() => setCalcMode(mode)} style={{ padding: '10px 15px', borderRadius: '12px', border: calcMode === mode ? '1px solid var(--accent-cyan)' : '1px solid var(--glass-border)', background: calcMode === mode ? 'rgba(0, 229, 255, 0.1)' : 'transparent', color: calcMode === mode ? 'var(--accent-cyan)' : 'var(--text-secondary)', fontSize: '11px', fontWeight: 800, cursor: 'pointer' }}>
                                        {mode.replace(/_/g, ' ').toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Bottom Row: Date Filters */}
                        <div style={{ display: 'flex', gap: '15px' }}>
                            <div style={{ flex: 1, display: 'flex', gap: '10px', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '10px 20px', borderRadius: '15px', border: '1px solid var(--glass-border)' }}>
                                <Calendar size={18} color="var(--accent-cyan)" />
                                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginRight: '10px' }}>REZERVACIJE OD/DO:</div>
                                <div 
                                    onClick={() => setActivePicker('booking')}
                                    style={{ flex: 1, cursor: 'pointer', fontSize: '14px', fontWeight: 800, color: bookingDates.from ? '#fff' : 'var(--text-dim)' }}
                                >
                                    {bookingDates.from ? `${bookingDates.from.split('-').reverse().join('/')} - ${bookingDates.to.split('-').reverse().join('/')}` : 'Svi Datumi'}
                                </div>
                                {bookingDates.from && <X size={14} onClick={() => setBookingDates({from: '', to: ''})} style={{ cursor: 'pointer' }} />}
                            </div>

                            <div style={{ flex: 1, display: 'flex', gap: '10px', alignItems: 'center', background: 'rgba(255,255,255,0.03)', padding: '10px 20px', borderRadius: '15px', border: '1px solid var(--glass-border)' }}>
                                <Calendar size={18} color="var(--accent-cyan)" />
                                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginRight: '10px' }}>BORAVCI OD/DO:</div>
                                <div 
                                    onClick={() => setActivePicker('stay')}
                                    style={{ flex: 1, cursor: 'pointer', fontSize: '14px', fontWeight: 800, color: stayDates.from ? '#fff' : 'var(--text-dim)' }}
                                >
                                    {stayDates.from ? `${stayDates.from.split('-').reverse().join('/')} - ${stayDates.to.split('-').reverse().join('/')}` : 'Svi Datumi'}
                                </div>
                                {stayDates.from && <X size={14} onClick={() => setStayDates({from: '', to: ''})} style={{ cursor: 'pointer' }} />}
                            </div>
                        </div>

                        {/* Predictive Search Results */}
                        <AnimatePresence>
                            {showPredictive && searchQuery && (
                                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} style={{ position: 'absolute', top: '100px', left: '25px', right: '350px', background: 'var(--bg-dark)', borderRadius: '15px', marginTop: '10px', zIndex: 100, border: '1px solid var(--glass-border)', padding: '10px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
                                    {PREDICTIVE_HINTS.filter(h => h.label.toLowerCase().includes(searchQuery.toLowerCase())).map(hint => (
                                        <div key={hint.label} onClick={() => { setSearchTags([...new Set([...searchTags, hint.label])]); setSearchQuery(''); setShowPredictive(false); }} style={{ padding: '12px 15px', borderRadius: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                            {hint.type === 'country' && <Globe size={16} color="var(--accent-cyan)" />}
                                            <span style={{ fontWeight: 600 }}>{hint.label}</span>
                                        </div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}

                {/* Modern Calendar Modal for Search Bar */}
                {activePicker && (
                    <ModernCalendar 
                        startDate={activePicker === 'booking' ? bookingDates.from : stayDates.from}
                        endDate={activePicker === 'booking' ? bookingDates.to : stayDates.to}
                        onChange={(from, to) => {
                            if (activePicker === 'booking') setBookingDates({from, to});
                            else setStayDates({from, to});
                        }}
                        onClose={() => setActivePicker(null)}
                    />
                )}

                {renderTabContent()}
            </div>
        );
    }

    function renderTabContent() {
        return (
            <>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {activeTab === 'items' && (
                        <>
                            {/* Profit Control Center */}
                            <div style={{ 
                                background: 'linear-gradient(135deg, rgba(0, 229, 255, 0.05) 0%, rgba(0, 0, 0, 0.4) 100%)', 
                                border: '1px solid var(--accent-cyan)', 
                                borderRadius: '18px', 
                                padding: '20px',
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: '20px',
                                alignItems: 'center',
                                backdropFilter: 'blur(10px)',
                                boxShadow: '0 8px 32px rgba(0, 229, 255, 0.1)'
                            }}>
                                <div style={{ flex: '1 1 100%', borderBottom: '1px solid rgba(0, 229, 255, 0.2)', paddingBottom: '10px', marginBottom: '5px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <Zap size={18} color="var(--accent-cyan)" />
                                    <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px' }}>Profit Control Center</h3>
                                    <span style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 600 }}>(Definišite maržu za odabrane parametre)</span>
                                </div>

                                {/* Inputs */}
                                <div style={{ display: 'flex', flex: 1, gap: '15px', minWidth: '300px' }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ display: 'block', fontSize: '10px', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '5px', textTransform: 'uppercase' }}>Marža %</label>
                                        <input 
                                            type="number" 
                                            value={marginPercent} 
                                            onChange={(e) => setMarginPercent(e.target.value)}
                                            style={{ ...styles.input, padding: '10px 12px', borderColor: 'rgba(0, 229, 255, 0.3)' }}
                                            placeholder="15%"
                                        />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ display: 'block', fontSize: '10px', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '5px', textTransform: 'uppercase' }}>Fiksno €</label>
                                        <input 
                                            type="number" 
                                            value={marginAmount} 
                                            onChange={(e) => setMarginAmount(e.target.value)}
                                            style={{ ...styles.input, padding: '10px 12px', borderColor: 'rgba(0, 229, 255, 0.3)' }}
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>

                                <div style={{ flex: 1, minWidth: '200px' }}>
                                    <label style={{ display: 'block', fontSize: '10px', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '5px', textTransform: 'uppercase' }}>Tip Smještaja</label>
                                    <select 
                                        style={{ ...styles.input, padding: '10px 12px', borderColor: 'rgba(0, 229, 255, 0.3)', cursor: 'pointer' }}
                                        value={marginRooms[0] || ''}
                                        onChange={(e) => setMarginRooms(e.target.value ? [e.target.value] : [])}
                                    >
                                        <option value="">Svi tipovi smještaja</option>
                                        <option value="Standard">Standard Rooms</option>
                                        <option value="Family">Family Rooms</option>
                                        <option value="Suite">Suites</option>
                                    </select>
                                </div>

                                <div style={{ display: 'flex', gap: '15px', flex: '1.5', minWidth: '400px' }}>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ display: 'block', fontSize: '10px', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '5px', textTransform: 'uppercase' }}>Rezervacije Od/Do</label>
                                        <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                                            <input type="date" style={{ ...styles.input, padding: '8px', fontSize: '12px' }} />
                                            <span style={{ opacity: 0.5 }}>-</span>
                                            <input type="date" style={{ ...styles.input, padding: '8px', fontSize: '12px' }} />
                                        </div>
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label style={{ display: 'block', fontSize: '10px', fontWeight: 800, color: 'var(--text-secondary)', marginBottom: '5px', textTransform: 'uppercase' }}>Boravci Od/Do</label>
                                        <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                                            <input type="date" style={{ ...styles.input, padding: '8px', fontSize: '12px' }} />
                                            <span style={{ opacity: 0.5 }}>-</span>
                                            <input type="date" style={{ ...styles.input, padding: '8px', fontSize: '12px' }} />
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                    {saveSuccess && (
                                        <motion.div 
                                            initial={{ opacity: 0, x: 20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            style={{ color: '#22c55e', fontSize: '12px', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '5px' }}
                                        >
                                            <CheckCircle2 size={16} /> PRIMENJENO!
                                        </motion.div>
                                    )}
                                    <button 
                                        onClick={handleApplyMargin}
                                        style={{ 
                                            background: 'var(--accent-cyan)', 
                                            color: '#000', 
                                            border: 'none', 
                                            padding: '12px 24px', 
                                            borderRadius: '12px', 
                                            fontWeight: 900, 
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '10px',
                                            transition: 'all 0.3s'
                                        }}
                                    >
                                        <Save size={18} /> PRIMENI MARŽU
                                    </button>
                                </div>
                            </div>

                            <PricelistSpreadsheet 
                                items={pricelists
                                    .filter(p => {
                                        const searchStr = searchQuery.toLowerCase();
                                        const tags = searchTags.map(t => t.toLowerCase());
                                        const title = p.title || "";
                                        const hotelStr = (p.hotelName || (title.includes('Solvex') ? "Casa Karina 4*" : (title.includes('Meeting Point') ? "Hotel Materada Plava Laguna" : "Hotel Vespera"))).toLowerCase();
                                        const locStr = ((title.includes('Solvex') || (p.hotelName && p.hotelName.includes('Karina'))) ? "Bansko, Bugarska" : "Poreč, Hrvatska").toLowerCase();
                                        
                                        const matchesTags = tags.length === 0 || tags.some(tag => hotelStr.includes(tag) || locStr.includes(tag) || (p.hotelId || "").toLowerCase().includes(tag));
                                        const matchesQuery = !searchStr || 
                                                           hotelStr.includes(searchStr) || 
                                                           locStr.includes(searchStr) || 
                                                           (title || "").toLowerCase().includes(searchStr) || 
                                                           (p.hotelId || "").toLowerCase().includes(searchStr);
                                        
                                        // Date filters
                                        let matchesBooking = true;
                                        if (bookingDates.from && bookingDates.to) {
                                            const pFrom = p.bookingFrom || p.dateFrom;
                                            const pTo = p.bookingTo || p.dateTo;
                                            matchesBooking = (pFrom >= bookingDates.from && pFrom <= bookingDates.to) || 
                                                             (pTo >= bookingDates.from && pTo <= bookingDates.to);
                                        }

                                        let matchesStay = true;
                                        if (stayDates.from && stayDates.to) {
                                            matchesStay = (p.dateFrom >= stayDates.from && p.dateFrom <= stayDates.to) ||
                                                          (p.dateTo >= stayDates.from && p.dateTo <= stayDates.to) ||
                                                          (p.dateFrom <= stayDates.from && p.dateTo >= stayDates.to);
                                        }
                                        
                                        return matchesTags && matchesQuery && matchesBooking && matchesStay;
                                    })
                                    .map(p => {
                                        const title = p.title || "";
                                        const hotelName = p.hotelName || (title.includes('Solvex') ? "Casa Karina 4*" : (title.includes('Meeting Point') ? "Hotel Materada Plava Laguna" : "Hotel Vespera"));
                                        const location = (title.includes('Solvex') || (hotelName && hotelName.includes('Karina'))) ? "Bansko, Bugarska" : "Poreč, Hrvatska";
                                        const netPrice = p.netPrice || 0;
                                        const brutoPrice = p.brutoPrice || 0;

                                        // Intelligent Supplement Mapping
                                        const specs: any[] = [];
                                        if (p.roomType.toLowerCase().includes('sea view') || p.roomType.toLowerCase().includes('pogled more')) {
                                            specs.push({ name: 'Doplata za pogled na more', price: '25.00 € / dan', type: 'Doplata' });
                                        }
                                        if (p.roomType.toLowerCase().includes('family') || p.roomType.toLowerCase().includes('porodična')) {
                                            specs.push({ name: 'Popust za drugo dete (2-12g)', price: '100%', type: 'Popust' });
                                        }
                                        if (hotelName.includes('Vespera')) {
                                            specs.push({ name: 'Klub maskota (Pino)', price: 'Uračunato', type: 'Doplata' });
                                        }
                                        
                                        return {
                                            ...p,
                                            hotelName,
                                            location,
                                            service: p.service || 'HB',
                                            calcMode: p.calcMode || 'per_person_day' as any,
                                            minStay: p.minStay || 3,
                                            arrivalDays: p.arrivalDays || [0, 1, 2, 3, 4, 5, 6],
                                            netPrice,
                                            grossPrice: brutoPrice,
                                            margin: brutoPrice - netPrice,
                                            marginPercent: netPrice > 0 ? Math.round(((brutoPrice - netPrice) / netPrice) * 100) : 0,
                                            specificSupplements: specs
                                        }
                                    })} 
                                activeCalcMode={calcMode}
                                priceDisplay={priceDisplay}
                                onItemClick={(item) => {
                                    setSelectedItem(selectedItem?.id === item.id ? null : item);
                                    if (item) loadItemToDev(item);
                                }}
                            />
                        </>
                    )}

                    {activeTab === 'supplements' && (
                        <div style={{ background: 'var(--bg-card)', padding: '30px', borderRadius: '20px', border: '1px solid var(--glass-border)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                <div>
                                    <h3 style={{ margin: 0, fontWeight: 800 }}>Doplate i Popusti</h3>
                                    <div style={{ fontSize: '12px', color: 'var(--accent-cyan)', fontWeight: 700, marginTop: '4px' }}>
                                        HOTEL: {searchTags.find(t => PREDICTIVE_HINTS.some(h => h.label === t && h.type === 'hotel')) || "Svi Hoteli (Globalno)"}
                                    </div>
                                </div>
                                <button style={{ ...styles.button, background: 'var(--accent-cyan)', color: '#000' }}>
                                    <Plus size={16} /> Dodaj Novo Pravilo
                                </button>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {supplementsState.map((s, i) => (
                                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 100px 50px', gap: '20px', alignItems: 'center', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                                        <div>
                                            <div style={{ fontWeight: 700 }}>{s.name}</div>
                                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Primenjuje se na: Sve sobe</div>
                                        </div>
                                        <div style={{ color: 'var(--accent-cyan)', fontWeight: 800, textAlign: 'right' }}>{s.price}</div>
                                        <div style={{ fontSize: '10px', background: s.type === 'Popust' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)', color: s.type === 'Popust' ? '#10b981' : '#3b82f6', padding: '6px 10px', borderRadius: '6px', textAlign: 'center', fontWeight: 900, textTransform: 'uppercase' }}>{s.type}</div>
                                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                            <Trash2 size={16} style={{ cursor: 'pointer', color: '#ef4444', opacity: 0.6 }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'notes' && (
                        <div style={{ background: 'var(--bg-card)', padding: '30px', borderRadius: '20px', border: '1px solid var(--glass-border)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                <div>
                                    <h3 style={{ margin: 0, fontWeight: 800 }}>Tekstualne Napomene i Specifičnosti</h3>
                                    <div style={{ fontSize: '12px', color: 'var(--accent-gold)', fontWeight: 700, marginTop: '4px' }}>
                                        HOTEL: {searchTags.find(t => PREDICTIVE_HINTS.some(h => h.label === t && h.type === 'hotel')) || "Svi Hoteli (Globalno)"}
                                    </div>
                                </div>
                                <button style={{ ...styles.button, background: 'transparent', border: '1px dashed var(--accent-cyan)', color: 'var(--accent-cyan)' }}>
                                    <Plus size={16} /> Dodaj Novu Napomenu
                                </button>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                {notesState.map((n, i) => (
                                    <div key={i} style={{ display: 'flex', gap: '15px', alignItems: 'center', padding: '15px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                                        <div style={{ color: 'var(--accent-gold)', fontWeight: 800 }}>#0{i+1}</div>
                                        <input value={n} style={{ ...styles.input, background: 'transparent', border: 'none', padding: 0 }} onChange={() => {}} />
                                        <Trash2 size={18} style={{ cursor: 'pointer', color: '#ef4444', opacity: 0.5 }} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'offers' && (
                        <div style={{ background: 'var(--bg-card)', padding: '30px', borderRadius: '20px', border: '1px solid var(--glass-border)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                <div>
                                    <h3 style={{ margin: 0, fontWeight: 800 }}>Specijalne Ponude (EB, Last Minute, Gratis Dani)</h3>
                                    <div style={{ fontSize: '12px', color: 'var(--accent-gold)', fontWeight: 700, marginTop: '4px' }}>
                                        HOTEL: {searchTags.find(t => PREDICTIVE_HINTS.some(h => h.label === t && h.type === 'hotel')) || "Svi Hoteli (Globalno)"}
                                    </div>
                                </div>
                                <button style={{ ...styles.button, background: 'var(--accent-gold)', color: '#000' }}>
                                    <Zap size={16} /> Dodaj Ponudu
                                </button>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                                {specialOffers.map((o, i) => (
                                    <div key={i} style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', borderRadius: '15px', border: '1px solid var(--glass-border)', position: 'relative' }}>
                                        <div style={{ position: 'absolute', top: '15px', right: '15px', fontSize: '10px', fontWeight: 900, background: 'var(--accent-gold)', color: '#000', padding: '3px 8px', borderRadius: '4px' }}>{o.type}</div>
                                        <h4 style={{ margin: '0 0 8px 0', color: 'var(--accent-gold)' }}>{o.name}</h4>
                                        <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>{o.details}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'taxes' && (
                        <div style={{ background: 'var(--bg-card)', padding: '30px', borderRadius: '20px', border: '1px solid var(--glass-border)' }}>
                            <div style={{ marginBottom: '24px' }}>
                                <h3 style={{ margin: 0, fontWeight: 800 }}>Boravišne i Turističke Takse</h3>
                                <div style={{ fontSize: '12px', color: 'var(--accent-cyan)', fontWeight: 700, marginTop: '4px' }}>
                                    HOTEL: {searchTags.find(t => PREDICTIVE_HINTS.some(h => h.label === t && h.type === 'hotel')) || "Svi Hoteli (Globalno)"}
                                    </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {taxState.map((t, i) => (
                                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                                        <div style={{ fontWeight: 700 }}>{t.name}</div>
                                        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                                            <div style={{ fontWeight: 800, color: 'var(--accent-cyan)' }}>{t.price}</div>
                                            <div style={{ fontSize: '10px', border: '1px solid var(--border)', padding: '4px 8px', borderRadius: '6px' }}>{t.type}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'teacher' && (
                        <PricingTeacher />
                    )}

                    {activeTab === 'simulator' && (
                        <PricingSimulator 
                            initialHotel={searchTags.find(t => PREDICTIVE_HINTS.some(h => h.label === t && h.type === 'hotel'))}
                        />
                    )}

                    {activeTab === 'manual' && (
                        <ManualPricelistCreator 
                            onAddItem={(item) => setPricelists(prev => [...prev, { ...item, id: `manual-${Date.now()}` }])}
                            addedItems={pricelists}
                        />
                    )}

                    {activeTab === 'bulk' && (
                        <BulkPriceManagement />
                    )}

                    {activeTab === 'agent' && (
                        <div style={{ background: 'var(--bg-card)', borderRadius: '20px', border: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '250px 1fr', minHeight: '500px' }}>
                            <div style={{ padding: '24px', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                <h4 style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>AI Alati</h4>
                                <button onClick={() => setShowAiMapper(true)} style={{ ...styles.button, background: 'var(--accent-cyan)', color: '#000', width: '100%' }}>
                                    <FileSpreadsheet size={16} /> Import Dokument
                                </button>
                            </div>
                            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column' }}>
                                <div style={{ flex: 1, overflowY: 'auto', paddingRight: '10px' }}>
                                    {messages.map((m, i) => (
                                        <div key={i} style={{ 
                                            alignSelf: m.role === 'ai' ? 'flex-start' : 'flex-end', 
                                            background: m.role === 'ai' ? 'rgba(255,255,255,0.05)' : 'var(--accent-cyan)', 
                                            padding: '12px 16px', 
                                            borderRadius: '16px', 
                                            marginBottom: '10px', 
                                            color: m.role === 'ai' ? 'inherit' : '#000',
                                            maxWidth: '80%',
                                            fontSize: '14px',
                                            lineHeight: 1.5,
                                            marginLeft: m.role === 'user' ? 'auto' : '0'
                                        }}>{m.content}</div>
                                    ))}
                                </div>
                                <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                                    <input value={input} onChange={e => setInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSendMessage()} style={styles.input} placeholder="Pitajte agenta za optimizaciju..." />
                                    <button onClick={handleSendMessage} style={{ ...styles.button, background: 'var(--accent-cyan)', color: '#000' }}><Send size={18} /></button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'report' && (
                        <PricelistReportView 
                            items={pricelists
                                .filter(p => {
                                    const searchStr = searchQuery.toLowerCase();
                                    const tags = searchTags.map(t => t.toLowerCase());
                                    const title = p.title || "";
                                    const hotelStr = (p.hotelName || (title.includes('Solvex') ? "Casa Karina 4*" : (title.includes('Meeting Point') ? "Hotel Materada Plava Laguna" : "Hotel Vespera"))).toLowerCase();
                                    const locStr = ((title.includes('Solvex') || (p.hotelName && p.hotelName.includes('Karina'))) ? "Bansko, Bugarska" : "Poreč, Hrvatska").toLowerCase();
                                    
                                    const matchesTags = tags.length === 0 || tags.some(tag => hotelStr.includes(tag) || locStr.includes(tag));
                                    const matchesQuery = !searchStr || hotelStr.includes(searchStr) || locStr.includes(searchStr) || (title || "").toLowerCase().includes(searchStr);
                                    const matchesPricelist = !pricelistSearchQuery || (title || "").toLowerCase().includes(pricelistSearchQuery.toLowerCase());
                                    
                                    // Date filters
                                    let matchesBooking = true;
                                    if (bookingDates.from && bookingDates.to) {
                                        const pFrom = p.bookingFrom || p.dateFrom;
                                        const pTo = p.bookingTo || p.dateTo;
                                        matchesBooking = (pFrom >= bookingDates.from && pFrom <= bookingDates.to) || 
                                                         (pTo >= bookingDates.from && pTo <= bookingDates.to);
                                    }

                                    let matchesStay = true;
                                    if (stayDates.from && stayDates.to) {
                                        matchesStay = (p.dateFrom >= stayDates.from && p.dateFrom <= stayDates.to) ||
                                                      (p.dateTo >= stayDates.from && p.dateTo <= stayDates.to) ||
                                                      (p.dateFrom <= stayDates.from && p.dateTo >= stayDates.to);
                                    }
                                    
                                    return matchesTags && matchesQuery && matchesPricelist && matchesBooking && matchesStay;
                                })
                                .map(p => {
                                    const title = p.title || "";
                                    const hotelName = p.hotelName || (title.includes('Solvex') ? "Casa Karina 4*" : (title.includes('Meeting Point') ? "Hotel Materada Plava Laguna" : "Hotel Vespera"));
                                    
                                    // Intelligent Supplement Mapping
                                    const specs: any[] = [];
                                    if (p.roomType.toLowerCase().includes('sea view') || p.roomType.toLowerCase().includes('pogled more')) {
                                        specs.push({ name: 'Doplata za pogled na more', price: '25.00 € / dan', type: 'Doplata' });
                                    }
                                    if (p.roomType.toLowerCase().includes('family') || p.roomType.toLowerCase().includes('porodična')) {
                                        specs.push({ name: 'Popust za drugo dete (2-12g)', price: '100%', type: 'Popust' });
                                    }
                                    if (hotelName.includes('Vespera')) {
                                        specs.push({ name: 'Klub maskota (Pino)', price: 'Uračunato', type: 'Doplata' });
                                    }

                                    return {
                                        id: `PC-${p.id.slice(0, 4).toUpperCase()}`,
                                        date: `${formatDate(p.dateFrom)} - ${formatDate(p.dateTo)}`,
                                        hotelName,
                                        roomType: p.roomType,
                                        supplier: p.supplier || (title.includes('Meeting Point') ? "Meeting Point" : "Direct"),
                                        netPrice: p.netPrice,
                                        margin: p.brutoPrice - p.netPrice,
                                        marginPercent: Math.round(((p.brutoPrice - p.netPrice) / p.netPrice) * 100),
                                        grossPrice: p.brutoPrice,
                                        status: 'Aktivna',
                                        specificSupplements: specs,
                                        hotelId: p.id
                                    };
                                })} 
                            supplements={supplementsState}
                            notes={notesState}
                            priceDisplay={priceDisplay}
                            kidsInfo="2-6.99 god: 50%, 7-11.99 god: 30%"
                            onItemClick={(id) => {
                                const item = pricelists.find(p => p.id === id);
                                if (item) {
                                    setSelectedItem(item);
                                    loadItemToDev(item);
                                }
                            }}
                        />
                    )}
                </div>

                <AnimatePresence>
                    {selectedItem && (
                        <PriceInspector 
                            item={selectedItem} 
                            onClose={() => setSelectedItem(null)} 
                            onOpenDev={() => setViewMode('code')}
                            onOpenDevNewTab={(id: string) => {
                                const url = `${window.location.origin}${window.location.pathname}?mode=dev&id=${id}`;
                                window.open(url, '_blank');
                            }}
                        />
                    )}
                </AnimatePresence>
            </>
        );
    }

    return (
        <div className={`pricing-module no-scrollbar ${isDarkMode ? 'navy-theme' : ''}`} style={{ 
            background: 'var(--bg-dark)', 
            height: '100vh', 
            width: '100%',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column' 
        }}>
            {viewMode === 'code' ? (
                <PricingCodeView 
                    pricelistTitle={pricelistTitle} 
                    pricelistId={pricelistId} 
                    productState={productState as any} 
                    pricePeriods={pricePeriods as any} 
                    supplements={supplementsState as any} 
                    validationIssues={[]} 
                    saveSuccess={saveSuccess} 
                    isSaving={isSaving} 
                    isDarkMode={isDarkMode} 
                    onTitleChange={setPricelistTitle} 
                    onDarkModeToggle={() => setIsDarkMode(!isDarkMode)} 
                    onLoadPricelist={() => setShowLoadModal(true)} 
                    onExportJSON={() => {}} 
                    onSaveDraft={() => {}} 
                    onActivate={() => setViewMode('standard')} 
                    onProductChange={(p: any) => setProductState(p)} 
                    onPeriodsChange={setPricePeriods} 
                    onSupplementsChange={setSupplementsState} 
                />
            ) : renderStandardUI()}
        </div>
    );
};

export default PricingIntelligence;
