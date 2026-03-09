import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, Reorder, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';
import {
    Download,
    Database,
    BarChart3,
    Mail,
    Package,
    Building2,
    Users,
    ChevronRight,
    Sword,
    ShieldAlert,
    ShieldCheck,
    Castle,
    Cpu,
    Brain,
    Sparkles,
    Plane,
    FileText,
    Plug,
    Search,
    RefreshCw,
    TrendingUp,
    RefreshCcw,
    DollarSign,
    User,
    PieChart,
    ClipboardList,
    Bell,
    CreditCard,
    Headset,
    Zap,
    Star,
    ArrowRight,
    Compass
} from 'lucide-react';
import { useThemeStore, useAppStore, useAuthStore } from '../stores';
import { translations } from '../translations';
import DailyWisdom from '../components/DailyWisdom';
import {
    LayoutGrid,
    List,
    Activity,
    Globe,
    Building,
    Hotel,
    ArrowUpRight,
    CheckCircle2,
    XCircle,
    Clock,
    Monitor,
    ChevronLeft,
    Ship
} from 'lucide-react';

const MOCK_LIVE_RESERVATIONS = [
    { id: 'R-9452', customer: 'Jovan Jovanović', country: 'Grčka', destination: 'Rodos', hotel: 'Mitsis Grand Hotel', subagent: 'Travel Pro DOO', supplier: 'Hotelbeds', branch: 'Beograd - Knez', amount: 1250, debt: 1250, payment: 800, status: 'Confirmed', time: 'Pre 2 min', type: 'Hotel', daysAgo: 0, checkIn: '2026-06-15', checkOut: '2026-06-22', productType: 'hotel', productLabel: 'Smeštaj' },
    { id: 'R-9451', customer: 'Marko Marković', country: 'Turska', destination: 'Antalija', hotel: 'Rixos Premium Belek', subagent: null, clientType: 'B2C', supplier: 'Amadeus', branch: 'Novi Sad', amount: 450, debt: 450, payment: 450, status: 'Confirmed', time: 'Pre 5 min', type: 'Flight', daysAgo: 0, checkIn: '2026-07-01', checkOut: '2026-07-10', productType: 'flight', productLabel: 'Avio' },
    { id: 'R-9450', customer: 'Ana Anić', country: 'Egipat', destination: 'Hurgada', hotel: 'Steigenberger ALDAU', subagent: 'SuperTravel', supplier: 'Mts Globe', branch: 'Niš', amount: 2100, debt: 2100, payment: 0, status: 'Pending', time: 'Pre 12 min', type: 'Package', daysAgo: 1, checkIn: '2026-08-10', checkOut: '2026-08-20', productType: 'package', productLabel: 'Paket' },
    { id: 'R-9449', customer: 'Petar Petrović', country: 'Grčka', destination: 'Krit', hotel: 'Stella Island Luxury', subagent: null, clientType: 'B2B', supplier: 'Expedia', branch: 'Beograd - Knez', amount: 890, debt: 890, payment: 890, status: 'Confirmed', time: 'Pre 18 min', type: 'Hotel', daysAgo: 3, checkIn: '2026-09-05', checkOut: '2026-09-12', productType: 'hotel', productLabel: 'Smeštaj' },
    { id: 'R-9448', customer: 'Milica Milić', country: 'Grčka', destination: 'Halkidiki', hotel: 'Sani Beach', subagent: 'Montenegro Fly', supplier: 'Solvex', branch: 'Podgorica', amount: 3200, debt: 3200, payment: 1200, status: 'Cancelled', time: 'Pre 25 min', type: 'Package', daysAgo: 5, checkIn: '2026-10-12', checkOut: '2026-10-22', productType: 'travel', productLabel: 'Putovanje' },
    { id: 'R-9447', customer: 'Ivan Ivanović', country: 'Italija', destination: 'Rim', hotel: 'Hotel Quirinale', subagent: null, clientType: 'B2C', supplier: 'Hotelbeds', branch: 'Novi Sad', amount: 150, debt: 150, payment: 0, status: 'Confirmed', time: 'Pre 40 min', type: 'Transfer', daysAgo: 12, checkIn: '2026-05-20', checkOut: '2026-05-25', productType: 'transfer', productLabel: 'Transfer' },
    { id: 'R-9446', customer: 'Savo Savić', country: 'Turska', destination: 'Bodrum', hotel: 'Titanic Deluxe Bodrum', subagent: 'Travel Pro DOO', supplier: 'Amadeus', branch: 'Beograd - Knez', amount: 1100, debt: 1100, payment: 1100, status: 'Confirmed', time: 'Pre 1h', type: 'Flight', daysAgo: 20, checkIn: '2026-08-01', checkOut: '2026-08-08', productType: 'flight', productLabel: 'Avio' },
];

// Types
interface AppConfig {
    id: string;
    name: string;
    desc: string;
    icon: React.ReactNode;
    category: string;
    color: string;
    badge?: string;
    minLevel: number;
    path: string;
}


const apps: AppConfig[] = [
    { id: 'smart-search', name: 'Smart Search', desc: 'Inteligentna pretraga i preporuka smeštaja sa AI asistencijom i analizom tržišta.', icon: <Sparkles size={24} />, category: 'sales', color: 'var(--gradient-blue)', badge: 'AI', minLevel: 1, path: '/smart-search' },

    { id: 'reservations', name: 'Rezervacije', desc: 'Centralni pregled i upravljanje svim rezervacijama.', icon: <FileText size={24} />, category: 'sales', color: 'var(--gradient-blue)', badge: 'Novo', minLevel: 1, path: '/reservations' },
    { id: 'financial-hub', name: 'Financial Intelligence', desc: 'Sveobuhvatni finansijski hub, KIR, KUR, Član 35 i blagajna sa AI analitikom.', icon: <PieChart size={24} />, category: 'finance', color: 'var(--gradient-purple)', badge: 'FIL', minLevel: 6, path: '/financial-hub' },
    { id: 'mars-analysis', name: 'Mars ERP Analitika', desc: 'Finansijska i operativna analiza procesa.', icon: <Database size={24} />, category: 'production', color: 'var(--gradient-blue)', badge: 'Live', minLevel: 1, path: '/mars-analysis' },
    { id: 'production-hub', name: 'Upravljanje Produkcijom', desc: 'Smeštaj, putovanja, transferi i paketi.', icon: <Package size={24} />, category: 'production', color: 'var(--gradient-green)', badge: 'Novo', minLevel: 1, path: '/production' },
    { id: 'contact-architect', name: 'Master Contact Hub', desc: 'Centralna inteligencija svih kontakata, putnika, dobavljača i subagenata sa AI analitikom.', icon: <Users size={24} />, category: 'production', color: 'var(--gradient-purple)', badge: 'AI CRM', minLevel: 1, path: '/contact-architect' },
    { id: 'price-generator', name: 'Generator Cenovnika', desc: 'Kreiranje cenovnika i import u Mars.', icon: <BarChart3 size={24} />, category: 'production', color: 'var(--gradient-green)', minLevel: 3, path: '/pricing-intelligence' },
    { id: 'yield-management', name: 'Revenue Management', desc: 'Dinamičko upravljanje cenama, praćenje konkurencije i optimizacija marži.', icon: <TrendingUp size={24} />, category: 'production', color: 'var(--gradient-green)', badge: 'Novo', minLevel: 3, path: '/yield-management' },
    { id: 'marketing-ses', name: 'Amazon SES Marketing', desc: 'Slanje newslettera subagentima.', icon: <Mail size={24} />, category: 'marketing', color: 'var(--gradient-orange)', badge: 'Novi', minLevel: 4, path: '/marketing' },
    { id: 'olympic-mail', name: 'ClickToTravel Mail', desc: 'Centralizovano upravljanje email nalozima i komunikacijom.', icon: <Mail size={24} />, category: 'communication', color: 'var(--gradient-blue)', badge: 'Live', minLevel: 1, path: '/mail' },
    { id: 'master-orchestrator', name: 'Master Orchestrator', desc: 'AI Agent Management System - Centralno upravljanje sa 6 specijalizovanih AI agenata.', icon: <Brain size={24} />, category: 'ai', color: 'var(--gradient-purple)', badge: 'AI', minLevel: 6, path: '/orchestrator' },
    { id: 'package-builder', name: 'Dynamic Package Builder', desc: 'Kreirajte kompleksne pakete kombinovanjem letova, hotela, transfera i dodatnih usluga.', icon: <Package size={24} />, category: 'sales', color: 'var(--gradient-green)', badge: 'Novo', minLevel: 1, path: '/packages' },
    { id: 'daily-activity', name: 'Dnevni Izveštaj Aktivnosti', desc: 'Kompletna analiza svih aktivnosti u sistemu sa detaljnim izveštajima po statusima rezervacija.', icon: <FileText size={24} />, category: 'system', color: 'var(--gradient-orange)', badge: 'Live', minLevel: 3, path: '/settings?tab=daily-activity' },
    { id: 'katana', name: 'Katana (To-Do)', desc: 'Efikasno upravljanje procesima i zadacima.', icon: <Sword size={24} />, category: 'system', color: 'var(--gradient-blue)', badge: 'Musashi', minLevel: 1, path: '/katana' },
    { id: 'deep-archive', name: 'Duboka Arhiva', desc: 'Centralni registar svih obrisanih i promenjenih stavki.', icon: <ShieldAlert size={24} />, category: 'system', color: 'var(--gradient-purple)', minLevel: 6, path: '/deep-archive' },
    { id: 'fortress', name: 'Fortress Security', desc: 'Command Center za nadzor i bezbednost koda.', icon: <Castle size={24} />, category: 'system', color: 'var(--gradient-purple)', badge: 'Master', minLevel: 6, path: '/fortress' },
    { id: 'soft-zone', name: 'Vajckin Soft Zone', desc: 'AI-Driven Environmental Reflex System - Inteligentno prilagođavanje tržištu.', icon: <Sparkles size={24} />, category: 'ai', color: 'var(--gradient-blue)', badge: 'Intelligence', minLevel: 1, path: '/soft-zone' },
    { id: 'hotel-importer', name: 'AI Hotel Importer', desc: 'Uvoz i AI obrada hotela iz eksternih sistema (Solvex/OpenGreece).', icon: <Database size={24} />, category: 'system', color: 'var(--gradient-purple)', badge: 'New', minLevel: 5, path: '/admin/import' },
    { id: 'destination-rep', name: 'Dest. Predstavnici', desc: 'Operativni rad na destinaciji, provere vaučera i komunikacija sa bazom.', icon: <ShieldCheck size={24} />, category: 'sales', color: 'var(--gradient-green)', badge: 'Operativa', minLevel: 1, path: '/destination-rep' },
    { id: 'api-connections', name: 'PARTNERI - DOBAVLJAČI', desc: 'Centralno upravljanje partnerima i dostupnim API dobavljačima.', icon: <Plug size={24} />, category: 'system', color: 'var(--gradient-purple)', badge: 'Hub', minLevel: 1, path: '/api-connections' },
    { id: 'subagent-admin', name: 'Subagent Admin', desc: 'Upravljanje subagentima, dozvolama, provizijama i finansijama.', icon: <Users size={24} />, category: 'system', color: 'var(--gradient-orange)', badge: 'New', minLevel: 6, path: '/subagent-admin' },
    { id: 'supplier-finance', name: 'Finansije Dobavljača', desc: 'Upravljanje plaćanjima, VCC karticama i yield analitikom dobavljača.', icon: <DollarSign size={24} />, category: 'finance', color: 'var(--gradient-blue)', badge: 'Phase 2', minLevel: 1, path: '/supplier-finance' },
    { id: 'shifts-generator', name: 'Generator Smena', desc: 'Globalno upravljanje terminima, kapacitetima i vizuelna upozorenja za popunjenost.', icon: <RefreshCcw size={24} />, category: 'production', color: 'var(--gradient-blue)', badge: 'Critical', minLevel: 3, path: '/shifts-generator' },
    {
        id: 'smart-concierge',
        name: 'Savetnica Milica',
        desc: 'Vaša lična AI savetnica za putovanja. Iskren pristup, vrhunska usluga i zaštita vašeg odmora.',
        icon: (
            <div style={{ position: 'relative' }}>
                <Brain size={24} />
                <div style={{
                    position: 'absolute',
                    top: -10,
                    right: -10,
                    background: '#ef4444',
                    borderRadius: '50%',
                    width: '18px',
                    height: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: '#fff',
                    border: '2px solid rgba(255,255,255,0.2)',
                    boxShadow: '0 0 10px rgba(239, 68, 68, 0.5)'
                }}>!</div>
            </div>
        ),
        category: 'ai',
        color: 'var(--gradient-purple)',
        badge: 'PRIORITET',
        minLevel: 1,
        path: '/smart-search'
    },
    { id: 'b2b-promo', name: 'B2B Promo Manager', desc: 'Upravljanje promocijama i obaveštenjima za B2B partnere.', icon: <Sparkles size={24} />, category: 'marketing', color: 'var(--gradient-orange)', badge: 'B2B', minLevel: 6, path: '/b2b-promo-manager' },
    { id: 'main-hub', name: 'Dashboard Central', desc: 'Glavni kontrolni panel sa pregledom osnovnih KPI i brzom navigacijom.', icon: <Database size={24} />, category: 'system', color: 'var(--gradient-blue)', minLevel: 1, path: '/' },
    { id: 'my-reservations', name: 'Moje Rezervacije', desc: 'Pregled svih vaših aktivnih i arhiviranih rezervacija sa statusima plaćanja.', icon: <ClipboardList size={24} />, category: 'sales', color: 'var(--gradient-green)', badge: 'B2B', minLevel: 1, path: '/my-reservations' },
    { id: 'b2b-portal', name: 'B2B Partner Portal', desc: 'Vaša glavna baza za upravljanje prodajom, subagentima i dokumentacijom.', icon: <Building2 size={24} />, category: 'sales', color: 'var(--gradient-purple)', badge: 'HUB', minLevel: 1, path: '/b2b-portal' },
    { id: 'destination-prime-explorer', name: 'Destination Prime Explorer', desc: 'Napredni sistem za istraživanje destinacija i POI tačaka.', icon: <Compass size={24} />, category: 'production', color: 'var(--gradient-blue)', badge: 'NEW', minLevel: 1, path: '/destination-prime-explorer' },
    { id: 'operational-reports', name: 'Operativni Izveštaji', desc: 'Centralni hub za upravljanje kapacitetima, rooming listama i PAX statistikom.', icon: <Activity size={24} />, category: 'production', color: 'var(--gradient-orange)', badge: 'Premium', minLevel: 3, path: '/operational-reports' }
];


interface DashboardProps {
    forceShowAll?: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ forceShowAll }) => {
    const navigate = useNavigate();
    const { lang } = useThemeStore();
    const { searchQuery, setSearchQuery } = useAppStore();
    const { userLevel, impersonatedSubagent } = useAuthStore();
    const t = translations[lang];

    const isStaff = userLevel >= 6 && !impersonatedSubagent;
    const isB2BView = userLevel < 6 || !!impersonatedSubagent;

    const [activeCategory, setActiveCategory] = useState('all');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
        const saved = localStorage.getItem('dashboard-view-mode');
        return (saved as 'grid' | 'list') || 'grid';
    });

    const [showFilters, setShowFilters] = useState(forceShowAll || false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth <= 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        localStorage.setItem('dashboard-view-mode', viewMode);
    }, [viewMode]);


    // Draggable Dashboard Apps
    const [userApps, setUserApps] = useState<AppConfig[]>(() => {
        const saved = localStorage.getItem('hub-apps-order');
        if (saved) {
            try {
                const orderIds = JSON.parse(saved) as string[];

                // If reservations is not in saved order, reset to default
                if (!orderIds.includes('reservations')) {
                    localStorage.removeItem('hub-apps-order');
                    return apps;
                }

                // Filter out any IDs that no longer exist in apps
                const validOrderIds = orderIds.filter(id => apps.some(a => a.id === id));
                // Add any new apps that are not in the saved order
                const missingApps = apps.filter(a => !validOrderIds.includes(a.id));

                // Sort existing apps by saved order
                const existingApps = [...apps]
                    .filter(a => validOrderIds.includes(a.id))
                    .sort((a, b) => validOrderIds.indexOf(a.id) - validOrderIds.indexOf(b.id));

                // Insert reservations at index 1 if it's a new app
                const reservationsApp = missingApps.find(a => a.id === 'reservations');
                const otherMissingApps = missingApps.filter(a => a.id !== 'reservations');

                let sortedApps = [...existingApps];

                // Insert reservations at position 1 (after global-hub)
                if (reservationsApp) {
                    sortedApps.splice(1, 0, reservationsApp);
                }

                // Add other new apps at the end
                sortedApps = [...sortedApps, ...otherMissingApps];

                return sortedApps;
            } catch (e) {
                return apps;
            }
        }
        return apps;
    });

    useEffect(() => {
        localStorage.setItem('hub-apps-order', JSON.stringify(userApps.map(a => a.id)));
    }, [userApps]);

    // Force sync app properties and new apps into user preference
    useEffect(() => {
        setUserApps(prev => {
            // Update properties of existing apps from the master list
            const updated = prev.map(userApp => {
                const masterApp = apps.find(a => a.id === userApp.id);
                return masterApp ? { ...userApp, ...masterApp } : userApp;
            });

            // Find apps in master list that are missing in the user order
            const missingIds = apps.filter(a => !updated.some(ua => ua.id === a.id));

            if (missingIds.length > 0) {
                return [...updated, ...missingIds];
            }
            return updated;
        });
    }, []);

    const filteredApps = userApps.filter(app => {
        const matchesSearch = app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            app.category.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch && userLevel >= app.minLevel;
    });

    const getUserRights = (minLevel: number) => {
        if (userLevel >= minLevel + 2 || userLevel === 5) return t.editView;
        return t.viewOnly;
    };

    const handleAppClick = (app: AppConfig) => {
        navigate(app.path);
    };

    const ROW1_IDS = isB2BView
        ? ['smart-search', 'reservations', 'my-reservations', 'b2b-portal']
        : ['reservations', 'smart-search', 'subagent-admin'];

    const ROW2_IDS: string[] = []; // Hide second row as per user request

    // Quick Info Data
    const staffInfo = [
        { icon: <Zap size={18} />, label: 'Sistem Status', value: 'Operativan (AI Active)', color: '#10b981' },
        { icon: <Users size={18} />, label: 'Aktuelno', value: '12 aktivnih subagenata', color: '#2563eb' },
        { icon: <TrendingUp size={18} />, label: 'Prodaja Danas', value: '+14.2%', color: '#f59e0b' },
        { icon: <Sword size={18} />, label: 'Katana Tasks', value: '4 prioriteta', color: '#ef4444' }
    ];

    const b2bInfo = [
        { icon: <Star size={18} />, label: 'Moj Status', value: 'Premium Partner (12%)', color: '#f59e0b' },
        { icon: <CreditCard size={18} />, label: 'Limit', value: '4.250 EUR preostalo', color: '#10b981' },
        { icon: <Bell size={18} />, label: 'Obaveštenja', value: '3 nove ponude', color: '#2563eb' },
        { icon: <Headset size={18} />, label: 'Podrška', value: 'Agent Nikola: Online', color: '#6366f1' }
    ];

    const quickInfo = isB2BView ? b2bInfo : staffInfo;

    const row1Apps = userApps.filter(app => ROW1_IDS.includes(app.id) && userLevel >= app.minLevel)
        .sort((a, b) => ROW1_IDS.indexOf(a.id) - ROW1_IDS.indexOf(b.id));

    const row2Apps = userApps.filter(app => ROW2_IDS.includes(app.id) && userLevel >= app.minLevel);
    const otherApps = userApps.filter(app => !ROW1_IDS.includes(app.id) && !ROW2_IDS.includes(app.id) && userLevel >= app.minLevel);

    const filteredOtherApps = otherApps.filter(app => {
        if (activeCategory === 'all') return true;
        if (activeCategory === 'system') return ['system', 'marketing', 'communication'].includes(app.category);
        return app.category === activeCategory;
    });

    const CATEGORIES = [
        { id: 'all', label: 'Sve', icon: <Database size={14} /> },
        { id: 'production', label: 'Produkcija', icon: <Package size={14} /> },
        { id: 'sales', label: 'Prodaja', icon: <Sparkles size={14} /> },
        { id: 'ai', label: 'AI Agenti', icon: <Brain size={14} /> },
        { id: 'system', label: 'Sistem', icon: <Cpu size={14} /> }
    ];


    return (
        <>
            <motion.div
                key="dashboard"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
            >
                {/* Removed Welcome Header and Central Search */}

                {/* Catalog Header */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    marginBottom: '20px',
                    textAlign: 'center',
                    marginTop: forceShowAll ? '40px' : '0'
                }}>
                    <h1 style={{
                        fontSize: forceShowAll ? '36px' : '28px',
                        fontWeight: '900',
                        margin: 0,
                        background: 'linear-gradient(135deg, var(--text-primary) 0%, var(--text-secondary) 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        textTransform: 'uppercase',
                        letterSpacing: '2px'
                    }}>
                        {forceShowAll ? 'Svi Moduli Sistema' : t.dashboard}
                    </h1>
                    <p style={{ opacity: 0.6, fontSize: '14px', marginTop: '8px', maxWidth: '600px', lineHeight: '1.6' }}>
                        {forceShowAll ? 'Pregled svih dostupnih alata, analitičkih modula i sistemskih servisa u clicktotravelcloud ekosistemu.' : 'Dobrodošli nazad u clicktotravelcloud'}
                    </p>
                </div>

                {/* Dashboard Application Search - Only in Catalog View */}
                {forceShowAll && (
                    <div className="desktop-only-search" style={{
                        display: 'flex',
                        justifyContent: 'center',
                        marginBottom: '40px',
                        marginTop: '20px'
                    }}>
                        <div style={{
                            width: '100%',
                            maxWidth: '600px',
                            position: 'relative'
                        }}>
                            <Search
                                size={20}
                                color="var(--accent)"
                                style={{
                                    position: 'absolute',
                                    left: '20px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    opacity: 0.7
                                }}
                            />
                            <input
                                type="text"
                                placeholder="Brza pretraga aplikacija..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '16px 24px 16px 56px',
                                    borderRadius: '16px',
                                    background: 'var(--bg-card)',
                                    border: '1px solid var(--accent)',
                                    color: 'var(--text-primary)',
                                    fontSize: '16px',
                                    fontWeight: '500',
                                    outline: 'none',
                                    transition: 'all 0.3s ease',
                                    boxShadow: '0 10px 30px rgba(142, 36, 172, 0.15)'
                                }}
                            />
                            {searchQuery && (
                                <button
                                    onClick={() => setSearchQuery('')}
                                    style={{
                                        position: 'absolute',
                                        right: '16px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        cursor: 'pointer',
                                        opacity: 0.6,
                                        border: 'none',
                                        background: 'var(--accent-glow)',
                                        color: 'var(--accent)',
                                        padding: '4px 8px',
                                        borderRadius: '6px',
                                        fontSize: '11px',
                                        fontWeight: '700'
                                    }}
                                >
                                    ESC
                                </button>
                            )}
                        </div>
                    </div>
                )}

                {/* Apps Grid */}
                {
                    (searchQuery && !(isMobile || document.body.classList.contains('mobile-view'))) ? (
                        <div className={`dashboard-grid ${viewMode === 'list' ? 'view-list' : ''}`}>
                            {filteredApps.map((app, idx) => (
                                <motion.div
                                    key={app.id}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className={`module-card ${viewMode === 'list' ? 'list-item' : ''}`}
                                    onClick={() => handleAppClick(app)}
                                >
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: viewMode === 'list' ? 'center' : 'flex-start',
                                        flexDirection: viewMode === 'list' ? 'row' : 'column',
                                        gap: viewMode === 'list' ? '20px' : '0',
                                        width: '100%'
                                    }}>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '16px',
                                            flex: 1
                                        }}>
                                            <div className="card-icon" style={{
                                                background: app.color,
                                                width: viewMode === 'list' ? '40px' : '48px',
                                                height: viewMode === 'list' ? '40px' : '48px',
                                                minWidth: viewMode === 'list' ? '40px' : '48px'
                                            }}>{app.icon}</div>
                                            <div style={{ flex: 1 }}>
                                                <h3 className="card-title" style={{ margin: 0 }}>{app.name}</h3>
                                                {viewMode === 'list' && <p className="card-desc" style={{ marginTop: '4px', marginBottom: 0 }}>{app.desc}</p>}
                                            </div>
                                        </div>

                                        {viewMode === 'list' && (
                                            <div style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '24px'
                                            }}>
                                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                                    {app.badge && (
                                                        <span className="badge" style={{ position: 'static', margin: 0 }}>
                                                            {app.badge}
                                                        </span>
                                                    )}
                                                    <span style={{ fontSize: '10px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <ShieldAlert size={10} /> {getUserRights(app.minLevel)}
                                                    </span>
                                                </div>
                                                <div className="card-footer" style={{ marginTop: 0, display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '600', color: 'var(--accent)' }}>
                                                    <ChevronRight size={18} />
                                                </div>
                                            </div>
                                        )}

                                        {viewMode === 'grid' && (
                                            <>
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                                                    {app.badge && (
                                                        <span className="badge">
                                                            {app.badge}
                                                        </span>
                                                    )}
                                                    <span style={{ fontSize: '10px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', position: 'absolute', top: '24px', right: '24px' }}>
                                                        <ShieldAlert size={10} /> {getUserRights(app.minLevel)}
                                                    </span>
                                                </div>
                                                <p className="card-desc" style={{ marginBottom: '32px' }}>{app.desc}</p>
                                                <div className="card-footer" style={{
                                                    position: 'absolute',
                                                    bottom: '20px',
                                                    right: '24px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '4px',
                                                    fontSize: '12px',
                                                    fontWeight: '800',
                                                    color: 'var(--accent)',
                                                    textShadow: '0 2px 8px rgba(0,0,0,0.3)'
                                                }}>
                                                    {t.openModule} <ChevronRight size={14} />
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    ) : (isMobile || document.body.classList.contains('mobile-view')) ? (
                        <div className="mobile-tiles-grid" style={{ padding: '0 10px' }}>
                            {[
                                { id: 'search', name: 'Smart Search', icon: <Sparkles size={28} />, color: 'var(--gradient-blue)', path: '/smart-search' },
                                { id: 'res', name: 'Rezervacije', icon: <FileText size={28} />, color: 'var(--gradient-green)', path: '/reservations' },
                                { id: 'fin', name: 'Finansije', icon: <DollarSign size={28} />, color: 'var(--gradient-orange)', path: '/supplier-finance' },
                                { id: 'prof', name: 'Moj Profil', icon: <User size={28} />, color: 'var(--gradient-purple)', path: '/settings' }
                            ].map((app) => (
                                <div
                                    key={app.id}
                                    className="mobile-tile fade-in"
                                    onClick={() => navigate(app.path)}
                                >
                                    <div className="tile-icon" style={{
                                        background: app.color,
                                        width: '60px',
                                        height: '60px',
                                        borderRadius: '20px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        boxShadow: '0 10px 20px rgba(0,0,0,0.2)'
                                    }}>
                                        <div style={{ color: 'white' }}>{app.icon}</div>
                                    </div>
                                    <h3 className="tile-title" style={{ marginTop: '10px' }}>{app.name}</h3>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <>

                            {/* Row 1: Search & Reservations */}
                            {!forceShowAll && (
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'center',
                                    marginBottom: '30px',
                                    width: '100%'
                                }}>
                                    <div className={`dashboard-grid ${viewMode === 'list' ? 'view-list' : ''}`} style={{
                                        display: 'flex',
                                        flexWrap: 'wrap',
                                        justifyContent: 'center',
                                        maxWidth: '1400px',
                                        margin: '0 auto',
                                        width: '100%',
                                        gap: '32px'
                                    }}>
                                        {row1Apps.map((app: AppConfig, idx: number) => (
                                            <motion.div
                                                key={app.id}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.1 }}
                                                className={`module-card featured ${viewMode === 'list' ? 'list-item' : ''}`}
                                                onClick={() => handleAppClick(app)}
                                                style={{
                                                    border: viewMode === 'list' ? '1px solid var(--border)' : '1.5px solid var(--accent)',
                                                    boxShadow: viewMode === 'list' ? 'none' : '0 15px 45px rgba(59, 130, 246, 0.25)',
                                                    padding: viewMode === 'list' ? '20px' : '32px 24px',
                                                    minWidth: viewMode === 'list' ? '100%' : (ROW1_IDS.length >= 4 ? '320px' : '440px'),
                                                    flex: viewMode === 'list' ? '1' : '1 1 300px',
                                                    maxWidth: viewMode === 'list' ? '100%' : (ROW1_IDS.length >= 4 ? '350px' : '460px'),
                                                    minHeight: viewMode === 'list' ? 'auto' : '160px',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    justifyContent: 'center'
                                                }}
                                            >
                                                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                                    <div className="card-icon" style={{ background: app.color, width: '56px', height: '56px' }}>
                                                        {app.icon}
                                                    </div>
                                                    <div>
                                                        <h3 className="card-title" style={{ margin: 0, fontSize: '18px' }}>{app.name}</h3>
                                                        <p className="card-desc" style={{ margin: '4px 0 0', fontSize: '12px', opacity: 0.7 }}>{app.desc.substring(0, 60)}...</p>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Quick Information Section */}
                            {!forceShowAll && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.4 }}
                                    style={{
                                        maxWidth: '1400px',
                                        margin: '0 auto 40px',
                                        width: '100%',
                                        padding: '0 20px'
                                    }}
                                >
                                    <div style={{
                                        background: 'var(--bg-card)',
                                        borderRadius: '24px',
                                        padding: '24px',
                                        border: '1px solid var(--border)',
                                        display: 'grid',
                                        gridTemplateColumns: isMobile ? '1fr' : 'repeat(4, 1fr)',
                                        gap: '20px',
                                        boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
                                    }}>
                                        {quickInfo.map((info, idx) => (
                                            <div key={idx} style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '16px',
                                                padding: '16px',
                                                background: 'var(--bg-main)',
                                                borderRadius: '16px',
                                                borderLeft: `4px solid ${info.color}`,
                                                boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                                            }}>
                                                <div style={{
                                                    color: info.color,
                                                    background: `${info.color}15`,
                                                    padding: '10px',
                                                    borderRadius: '12px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}>{info.icon}</div>
                                                <div>
                                                    <div style={{ fontSize: '10px', opacity: 0.6, fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-secondary)' }}>{info.label}</div>
                                                    <div style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-primary)' }}>{info.value}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}

                            {!forceShowAll && <div style={{ width: '100%', height: '1px', background: 'var(--border)', margin: '20px 0', opacity: 0.3 }}></div>}



                            {(showFilters || forceShowAll) && (
                                <motion.div
                                    initial={forceShowAll ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.4 }}
                                >
                                    {/* Row 2: Payments & Finance - Also hide on forced view if it's redundant */}
                                    {!forceShowAll && (
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'center',
                                            marginBottom: '40px'
                                        }}>
                                            <div className={`dashboard-grid ${viewMode === 'list' ? 'view-list' : ''}`} style={{
                                                display: 'grid',
                                                gridTemplateColumns: viewMode === 'list' ? '1fr' : 'repeat(3, 1fr)',
                                                maxWidth: '1400px',
                                                margin: '0 auto',
                                                width: '100%',
                                                gap: '24px'
                                            }}>
                                                {row2Apps.map((app: AppConfig, idx: number) => (
                                                    <motion.div
                                                        key={app.id}
                                                        initial={{ opacity: 0, y: 20 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        transition={{ delay: idx * 0.1 }}
                                                        className={`module-card ${viewMode === 'list' ? 'list-item' : ''}`}
                                                        onClick={() => handleAppClick(app)}
                                                        style={{
                                                            background: 'rgba(255, 255, 255, 0.02)',
                                                            padding: viewMode === 'list' ? '20px' : '24px'
                                                        }}
                                                    >
                                                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                                            <div className="card-icon" style={{ background: app.color, width: '56px', height: '56px' }}>
                                                                {app.icon}
                                                            </div>
                                                            <div>
                                                                <h3 className="card-title" style={{ margin: 0, fontSize: '18px' }}>{app.name}</h3>
                                                                <p className="card-desc" style={{ margin: '4px 0 0', fontSize: '12px', opacity: 0.7 }}>{app.desc.substring(0, 60)}...</p>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {!forceShowAll && <div style={{ width: '100%', height: '1px', background: 'var(--border)', marginBottom: '40px', opacity: 0.5 }}></div>}

                                    {/* Category Filters & View Toggle */}
                                    <div style={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        marginBottom: '32px',
                                        gap: '20px',
                                        flexWrap: 'wrap'
                                    }}>
                                        <div style={{
                                            display: 'flex',
                                            gap: '12px',
                                            overflowX: 'auto',
                                            paddingBottom: '8px',
                                            scrollbarWidth: 'none',
                                            flex: 1
                                        }}>
                                            {CATEGORIES.map(cat => (
                                                <button
                                                    key={cat.id}
                                                    onClick={() => setActiveCategory(cat.id)}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '8px',
                                                        padding: '10px 20px',
                                                        borderRadius: '100px',
                                                        border: '1px solid',
                                                        borderColor: activeCategory === cat.id ? 'var(--accent)' : 'var(--border)',
                                                        background: activeCategory === cat.id ? 'var(--accent-glow)' : 'var(--bg-card)',
                                                        color: activeCategory === cat.id ? 'var(--accent)' : 'var(--text-secondary)',
                                                        fontSize: '13px',
                                                        fontWeight: '700',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s',
                                                        whiteSpace: 'nowrap'
                                                    }}
                                                >
                                                    {cat.icon}
                                                    {cat.label}
                                                </button>
                                            ))}
                                        </div>

                                        <div style={{
                                            display: 'flex',
                                            gap: '4px',
                                            background: 'var(--bg-card)',
                                            padding: '4px',
                                            borderRadius: '12px',
                                            border: '1px solid var(--border)'
                                        }}>
                                            <button
                                                onClick={() => setViewMode('grid')}
                                                style={{
                                                    padding: '8px',
                                                    borderRadius: '8px',
                                                    border: 'none',
                                                    background: viewMode === 'grid' ? 'var(--accent-glow)' : 'transparent',
                                                    color: viewMode === 'grid' ? 'var(--accent)' : 'var(--text-secondary)',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    transition: 'all 0.2s'
                                                }}
                                                title="Grid View"
                                            >
                                                <LayoutGrid size={18} />
                                            </button>
                                            <button
                                                onClick={() => setViewMode('list')}
                                                style={{
                                                    padding: '8px',
                                                    borderRadius: '8px',
                                                    border: 'none',
                                                    background: viewMode === 'list' ? 'var(--accent-glow)' : 'transparent',
                                                    color: viewMode === 'list' ? 'var(--accent)' : 'var(--text-secondary)',
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    transition: 'all 0.2s'
                                                }}
                                                title="List View"
                                            >
                                                <List size={18} />
                                            </button>
                                        </div>
                                    </div>


                                    {/* Other Apps Section - Only visible in Catalog/Modules view */}
                                    {forceShowAll && (
                                        <Reorder.Group
                                            values={userApps}
                                            onReorder={setUserApps}
                                            className={`dashboard-grid ${viewMode === 'list' ? 'view-list' : ''}`}
                                            style={{ listStyle: 'none', padding: 0 }}
                                        >
                                            {filteredOtherApps.map((app, idx) => (
                                                <Reorder.Item
                                                    key={app.id}
                                                    value={app}
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: idx * 0.05 }}
                                                    className={`module-card draggable ${viewMode === 'list' ? 'list-item' : ''}`}
                                                    onClick={() => handleAppClick(app)}
                                                    style={{ cursor: 'grab', position: 'relative' }}
                                                    whileDrag={{
                                                        scale: 1.05,
                                                        boxShadow: "0 25px 50px rgba(0,0,0,0.4)",
                                                        zIndex: 50,
                                                    }}
                                                >
                                                    <div style={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: viewMode === 'list' ? 'center' : 'flex-start',
                                                        flexDirection: viewMode === 'list' ? 'row' : 'column',
                                                        gap: viewMode === 'list' ? '20px' : '0',
                                                        width: '100%',
                                                        padding: viewMode === 'list' ? '0' : '24px'
                                                    }}>
                                                        <div style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '16px',
                                                            flex: 1
                                                        }}>
                                                            <div className="card-icon" style={{
                                                                background: app.color,
                                                                width: viewMode === 'list' ? '40px' : '48px',
                                                                height: viewMode === 'list' ? '40px' : '48px',
                                                                minWidth: viewMode === 'list' ? '40px' : '48px'
                                                            }}>{app.icon}</div>
                                                            <div style={{ flex: 1 }}>
                                                                <h3 className="card-title" style={{ margin: 0, fontSize: '16px' }}>{app.name}</h3>
                                                                {viewMode === 'list' && <p className="card-desc" style={{ marginTop: '4px', marginBottom: 0 }}>{app.desc.substring(0, 100)}...</p>}
                                                            </div>
                                                        </div>

                                                        {viewMode === 'list' ? (
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                                                                <div className="card-footer" style={{ color: 'var(--accent)' }}>
                                                                    <ChevronRight size={18} />
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <p className="card-desc" style={{ marginTop: '12px', fontSize: '12px' }}>{app.desc.substring(0, 80)}...</p>
                                                                <div className="card-footer" style={{
                                                                    marginTop: 'auto',
                                                                    display: 'flex',
                                                                    justifyContent: 'flex-end',
                                                                    color: 'var(--accent)',
                                                                    fontWeight: '800',
                                                                    fontSize: '11px'
                                                                }}>
                                                                    OTVORI <ChevronRight size={14} />
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </Reorder.Item>
                                            ))}
                                        </Reorder.Group>
                                    )}
                                </motion.div>
                            )}

                            {/* GLOBAL PULSE: LIVE RESERVATIONS MODULE */}
                            {
                                isStaff && !forceShowAll && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 40 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.6 }}
                                        style={{
                                            maxWidth: '1850px', // Wider container (+10%)
                                            margin: '60px auto 100px',
                                            width: '100%',
                                            padding: '0 20px'
                                        }}
                                    >
                                        <GlobalPulse />
                                    </motion.div>
                                )
                            }
                        </>
                    )
                }
            </motion.div >

        </>
    );
};

// --- GLOBAL PULSE COMPONENT ---
function GlobalPulse() {
    const navigate = useNavigate();
    const { theme } = useThemeStore();
    const isDark = theme === 'navy';
    const [aggMode, setAggMode] = useState<'subagent' | 'supplier' | 'branch' | 'clientType'>('subagent');
    const [viewMode, setViewMode] = useState<'feed' | 'agg'>('feed');
    const [statusFilter, setStatusFilter] = useState<'all' | 'Active' | 'Reservation' | 'Pending' | 'Cancelled'>('all');
    const [productFilters, setProductFilters] = useState<string[]>(['all']);
    const [currentPage, setCurrentPage] = useState(1);
    const [daysFilter, setDaysFilter] = useState<number | string>(30);
    const itemsPerPage = 10;

    const filteredReservations = MOCK_LIVE_RESERVATIONS.filter(res => {
        const matchesStatus = statusFilter === 'all' ? true :
            statusFilter === 'Active' ? (res.status === 'Confirmed' && res.payment > 0) :
                statusFilter === 'Reservation' ? (res.status === 'Confirmed' && res.payment === 0) :
                    res.status === statusFilter;
        const matchesDays = res.daysAgo < (typeof daysFilter === 'number' ? daysFilter : 30);
        const matchesProduct = productFilters.includes('all') ? true : productFilters.includes(res.productType);
        return matchesStatus && matchesDays && matchesProduct;
    });

    const totalPages = Math.ceil(filteredReservations.length / itemsPerPage);
    const paginatedReservations = filteredReservations.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    useEffect(() => {
        setCurrentPage(1);
    }, [statusFilter, daysFilter, aggMode, productFilters]);

    const getStatusDisplay = (res: any) => {
        if (res.status === 'Cancelled') return { label: 'Storno', color: '#ef4444' };
        if (res.status === 'Pending') return { label: 'Pending', color: '#f59e0b' };
        if (res.status === 'Confirmed') {
            if (res.payment > 0) return { label: 'Aktivna', color: '#10b981' };
            return { label: 'Rezervacija', color: '#3b82f6' };
        }
        return { label: res.status, color: '#64748b' };
    };

    const totalReservations = filteredReservations.length;
    const totalDebt = filteredReservations.reduce((acc, res) => acc + res.debt, 0);
    const totalPayments = filteredReservations.reduce((acc, res) => acc + res.payment, 0);

    const getAggregatedData = () => {
        const result: any[] = [];
        const map = new Map();

        const key = aggMode === 'subagent' ? 'subagent' :
            aggMode === 'supplier' ? 'supplier' :
                aggMode === 'branch' ? 'branch' : 'clientType';

        filteredReservations.forEach(res => {
            let val = (res as any)[key];
            if (aggMode === 'clientType' && res.subagent) {
                val = 'SUBAGENT';
            }
            if (!map.has(val)) {
                map.set(val, { name: val, count: 0, total: 0 });
            }
            const current = map.get(val);
            current.count++;
            current.total += res.amount;
        });

        map.forEach(val => result.push(val));
        return result.sort((a, b) => b.total - a.total);
    };

    const aggregatedData = getAggregatedData();

    const exportToExcel = () => {
        const dataToExport = filteredReservations.map(res => ({
            'ID': res.id,
            'Vreme': res.time,
            'Kupac': res.customer,
            'Vrsta': res.productType?.toUpperCase() || 'N/A',
            'Usluga': (res as any).type === 'Flight' ? `Itinerer: ${res.hotel}` : (res as any).type === 'Package' ? `Putovanje: ${res.hotel}` : `Hotel: ${res.hotel}`,
            'Zemlja': res.country,
            'Destinacija': res.destination,
            'Partner/Subagent': res.subagent || (res.clientType === 'B2B' ? 'Agencijski Klijent' : 'Direktni Putnik'),
            'Dobavljač': res.supplier,
            'Iznos (€)': res.amount,
            'Zaduženje (€)': res.debt,
            'Uplaćeno (€)': res.payment,
            'Status': res.status,
            'Datum Boravka': `${res.checkIn} - ${res.checkOut}`
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Operacije');
        XLSX.writeFile(workbook, `GlobalPulse_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const openReport = () => {
        const totalReservations = filteredReservations.length;
        const reportWindow = window.open('', '_blank');
        if (reportWindow) {
            reportWindow.document.write(`
                <html>
                    <head>
                        <title>Operativni Izveštaj - Global Pulse</title>
                        <style>
                            body { font-family: sans-serif; padding: 40px; color: #333; }
                            table { width: 100%; border-collapse: collapse; margin-top: 20px; border: 1px solid #777; }
                            th, td { border: 1px solid #777; padding: 12px; text-align: left; }
                            th { background-color: #f4f4f4; text-transform: uppercase; font-size: 11px; font-weight: bold; border-bottom: 2px solid #333; }
                            h1 { color: #1e293b; border-bottom: 2px solid #3b82f6; padding-bottom: 10px; }
                            .meta { color: #64748b; font-size: 13px; margin-bottom: 20px; }
                            .share-btn { margin-top: 20px; padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold; }
                        </style>
                    </head>
                    <body>
                        <h1>Operativni Izveštaj - Global Pulse</h1>
                        <div class="meta">
                            Datum: ${new Date().toLocaleDateString('sr-RS')}<br/>
                            Ukupno rezervacija: ${totalReservations}
                        </div>
                        <table>
                            <thead>
                                <tr>
                                    <th>ID</th><th>Kupac</th><th>Vrsta</th><th>Usluga</th><th>Vrsta Kupca</th><th>Dobavljač</th><th>Zaduženje</th><th>Uplaćeno</th><th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${filteredReservations.map(res => `
                                    <tr>
                                        <td>${res.id}</td>
                                        <td>${res.customer}</td>
                                        <td>${res.productType?.toUpperCase() || 'N/A'}</td>
                                        <td>${(res as any).type === 'Flight' ? `Itinerer: ${res.hotel}` : (res as any).type === 'Package' ? `Putovanje: ${res.hotel}` : `Hotel: ${res.hotel}`} (${res.country})</td>
                                        <td>${res.subagent || (res.clientType === 'B2B' ? 'Agencijski Klijent' : 'Direktni Putnik')}</td>
                                        <td>${res.supplier}</td>
                                        <td>${res.debt.toLocaleString()} €</td>
                                        <td>${res.payment.toLocaleString()} €</td>
                                        <td>${res.status}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                        <div style="margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px; display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <button onclick="window.print()" style="padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;">Štampaj Izveštaj</button>
                                <button onclick="alert('Link kopiran: https://primeclick.travel/share/global_report_${Math.random().toString(36).substr(2, 9)}')" style="padding: 10px 20px; background: #f8fafc; color: #1e293b; border: 1px solid #ddd; border-radius: 8px; cursor: pointer; font-weight: bold; margin-left: 10px;">Kopiraj Javni Link</button>
                            </div>
                            <button onclick="location.href='mailto:?subject=Global Pulse Izveštaj&body=Pogledajte izveštaj na linku...'" style="padding: 10px 20px; background: #10b981; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;">Pošalji Mejlom</button>
                        </div>
                    </body>
                </html>
            `);
            reportWindow.document.close();
        }
    };

    return (
        <div style={{
            background: isDark ? 'rgba(255, 255, 255, 0.03)' : '#ffffff',
            backdropFilter: 'blur(20px)',
            borderRadius: '32px',
            border: isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0,0,0,0.05)',
            overflow: 'hidden',
            boxShadow: isDark ? '0 25px 50px -12px rgba(0, 0, 0, 0.5)' : '0 10px 30px rgba(0,0,0,0.05)'
        }}>
            {/* Clean Header Section */}
            <div style={{
                padding: '24px 30px',
                background: isDark ? 'linear-gradient(90deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.05) 100%)' : 'linear-gradient(90deg, #f8fafc 0%, #f1f5f9 100%)',
                borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.05)',
                display: 'flex',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: '24px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ position: 'relative' }}>
                        <div style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '12px',
                            background: 'var(--accent)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            boxShadow: '0 8px 16px var(--accent-glow)'
                        }}>
                            <Activity size={20} />
                        </div>
                        <motion.div
                            animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            style={{
                                position: 'absolute',
                                top: -2,
                                right: -2,
                                width: '10px',
                                height: '10px',
                                background: '#10b981',
                                borderRadius: '50%',
                                border: `2px solid ${isDark ? '#1e293b' : '#fff'}`
                            }}
                        />
                    </div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '900', letterSpacing: '-0.5px', color: isDark ? '#fff' : '#1e293b' }}>Global Pulse</h2>
                    </div>

                    {/* STATUS FILTERS - Simplified and Modernized */}
                    <div style={{
                        display: 'flex',
                        background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)',
                        padding: '4px',
                        borderRadius: '14px',
                        marginLeft: '10px',
                        border: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)'
                    }}>
                        {[
                            { id: 'all', label: 'Sve' },
                            { id: 'Active', label: 'Aktivne' },
                            { id: 'Reservation', label: 'Rezervacije' },
                            { id: 'Pending', label: 'Na čekanju' },
                            { id: 'Cancelled', label: 'Storno' }
                        ].map(st => (
                            <button
                                key={st.id}
                                onClick={() => setStatusFilter(st.id === statusFilter ? 'all' : st.id as any)}
                                style={{
                                    padding: '6px 16px',
                                    borderRadius: '10px',
                                    border: 'none',
                                    fontSize: '11px',
                                    fontWeight: '800',
                                    cursor: 'pointer',
                                    background: statusFilter === st.id ? (isDark ? '#fff' : '#1e293b') : 'transparent',
                                    color: statusFilter === st.id ? (isDark ? '#0f172a' : '#fff') : (isDark ? '#94a3b8' : '#64748b'),
                                    transition: 'all 0.2s ease',
                                    boxShadow: statusFilter === st.id ? '0 4px 12px rgba(0,0,0,0.1)' : 'none'
                                }}
                            >
                                {st.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    {/* DAYS FILTER */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)',
                        padding: '6px 14px',
                        borderRadius: '12px',
                        border: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)'
                    }}>
                        <span style={{ fontSize: '10px', fontWeight: '900', color: isDark ? '#94a3b8' : '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Period</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <input
                                type="number"
                                min="1"
                                max="365"
                                value={daysFilter === 0 ? '' : daysFilter}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setDaysFilter(val === '' ? 0 : Number(val));
                                }}
                                style={{
                                    width: '40px',
                                    background: 'transparent',
                                    border: 'none',
                                    color: isDark ? '#fff' : '#1e293b',
                                    fontSize: '13px',
                                    fontWeight: '800',
                                    textAlign: 'center',
                                    padding: '0',
                                    outline: 'none'
                                }}
                            />
                            <span style={{ fontSize: '10px', fontWeight: '800', color: 'var(--accent)' }}>DANA</span>
                        </div>
                    </div>

                    {/* Aggregator Switcher */}
                    <div style={{
                        display: 'flex',
                        background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.05)',
                        padding: '4px',
                        borderRadius: '14px',
                        gap: '4px',
                        border: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)'
                    }}>
                        {[
                            { id: 'feed', label: 'Live Feed', icon: <Activity size={12} /> },
                            { id: 'clientType', label: 'Po Tipu Kupca', icon: <Users size={12} /> },
                            { id: 'subagent', label: 'Po Subagentima', icon: <Users size={12} /> },
                            { id: 'supplier', label: 'Po Dobavljačima', icon: <Globe size={12} /> },
                            { id: 'branch', label: 'Po Poslovnicama', icon: <Building size={12} /> }
                        ].map(btn => (
                            <button
                                key={btn.id}
                                onClick={() => {
                                    if (btn.id === 'feed') setViewMode('feed');
                                    else {
                                        setViewMode('agg');
                                        setAggMode(btn.id as any);
                                    }
                                }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '6px 12px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: (btn.id === 'feed' && viewMode === 'feed') || (btn.id !== 'feed' && viewMode === 'agg' && aggMode === btn.id) ? 'var(--accent)' : 'transparent',
                                    color: (btn.id === 'feed' && viewMode === 'feed') || (btn.id !== 'feed' && viewMode === 'agg' && aggMode === btn.id) ? 'white' : 'var(--text-secondary)',
                                    fontSize: '10px',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    transition: '0.2s'
                                }}
                            >
                                {btn.icon} {btn.label}
                            </button>
                        ))}
                    </div>

                    <div style={{ display: 'flex', gap: '8px', marginLeft: '12px' }}>
                        <button
                            onClick={exportToExcel}
                            title="Izvezi u Excel"
                            style={{
                                width: '32px', height: '32px', borderRadius: '10px',
                                background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.2)',
                                color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                                transition: '0.2s'
                            }}
                        >
                            <Download size={16} />
                        </button>
                        <button
                            onClick={openReport}
                            title="Otvori Izveštaj"
                            style={{
                                width: '32px', height: '32px', borderRadius: '10px',
                                background: 'rgba(59, 130, 246, 0.15)', border: '1px solid rgba(59, 130, 246, 0.2)',
                                color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                                transition: '0.2s'
                            }}
                        >
                            <FileText size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* KPI Stats Bar */}
            <div style={{
                display: 'flex',
                background: isDark ? 'rgba(0, 0, 0, 0.2)' : '#f8fafc',
                borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.05)' : '1px solid rgba(0, 0, 0, 0.05)',
                justifyContent: 'space-around'
            }}>
                {[
                    { label: 'Ukupno Rezervacija', value: totalReservations, icon: <FileText size={24} />, color: 'var(--accent)', gradient: 'linear-gradient(135deg, rgba(142, 36, 172, 0.1) 0%, rgba(142, 36, 172, 0.05) 100%)' },
                    { label: 'Ukupno Zaduženje', value: `${totalDebt.toLocaleString()} €`, icon: <CreditCard size={24} />, color: '#ef4444', gradient: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(239, 68, 68, 0.05) 100%)' },
                    { label: 'Ukupno Uplata', value: `${totalPayments.toLocaleString()} €`, icon: <Zap size={24} />, color: '#10b981', gradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.05) 100%)' }
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        whileHover={{ translateY: -3, background: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)' }}
                        style={{
                            padding: '24px 40px',
                            background: 'transparent',
                            borderLeft: i !== 0 ? (isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.05)') : 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '24px',
                            transition: 'all 0.3s ease',
                            flex: 1
                        }}
                    >
                        <div style={{
                            width: '56px',
                            height: '56px',
                            borderRadius: '16px',
                            background: stat.gradient,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: stat.color,
                            border: `1px solid ${stat.color}20`
                        }}>
                            {stat.icon}
                        </div>
                        <div>
                            <div style={{ fontSize: '11px', opacity: 0.6, fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px', color: isDark ? 'var(--text-secondary)' : '#64748b' }}>{stat.label}</div>
                            <div style={{ fontSize: '28px', fontWeight: '900', color: isDark ? stat.color : '#1e293b', letterSpacing: '-1px' }}>{stat.value}</div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Content Area */}
            <div style={{ flex: 1, padding: '30px 40px', background: isDark ? 'transparent' : '#fff' }}>
                {/* PRODUCT TYPE FILTER BAR - Icon-based modern bar */}
                <div style={{
                    width: '100%',
                    display: 'flex',
                    gap: '10px',
                    overflowX: 'auto',
                    padding: '0 0 25px 0',
                    scrollbarWidth: 'none',
                    borderBottom: isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(0,0,0,0.05)',
                    marginBottom: '25px'
                }}>
                    {[
                        { id: 'all', label: 'Sve', icon: <Activity size={18} /> },
                        { id: 'hotel', label: 'Smeštaj', icon: <Building size={18} /> },
                        { id: 'flight', label: 'Avio', icon: <Plane size={18} /> },
                        { id: 'package', label: 'Paket', icon: <Package size={18} /> },
                        { id: 'travel', label: 'Putovanje', icon: <Globe size={18} /> },
                        { id: 'transfer', label: 'Transfer', icon: <TrendingUp size={18} /> },
                        { id: 'charter', label: 'Čarteri', icon: <Zap size={18} /> },
                        { id: 'bus', label: 'Bus Ture', icon: <Monitor size={18} /> },
                        { id: 'cruise', label: 'Krstarenja', icon: <Ship size={18} /> }
                    ].map(p => (
                        <button
                            key={p.id}
                            onClick={() => {
                                if (p.id === 'all') {
                                    setProductFilters(['all']);
                                } else {
                                    setProductFilters(prev => {
                                        const withoutAll = prev.filter(f => f !== 'all');
                                        if (withoutAll.includes(p.id)) {
                                            const updated = withoutAll.filter(f => f !== p.id);
                                            return updated.length === 0 ? ['all'] : updated;
                                        } else {
                                            return [...withoutAll, p.id];
                                        }
                                    });
                                }
                            }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '10px',
                                padding: '12px 24px',
                                borderRadius: '16px',
                                border: 'none',
                                background: (p.id === 'all' && productFilters.includes('all')) || (p.id !== 'all' && productFilters.includes(p.id)) ? 'var(--accent)' : (isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'),
                                color: (p.id === 'all' && productFilters.includes('all')) || (p.id !== 'all' && productFilters.includes(p.id)) ? '#fff' : (isDark ? '#94a3b8' : '#64748b'),
                                fontSize: '14px',
                                fontWeight: '800',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                boxShadow: ((p.id === 'all' && productFilters.includes('all')) || (p.id !== 'all' && productFilters.includes(p.id))) ? '0 8px 20px var(--accent-glow)' : 'none'
                            }}
                        >
                            {p.icon} {p.label}
                        </button>
                    ))}
                </div>

                {viewMode === 'feed' ? (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {/* Table Header Row */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            background: 'rgba(0, 0, 0, 0.2)',
                            borderBottom: '1px solid var(--border)',
                            borderTop: '1px solid var(--border)',
                        }}>
                            <div style={{ padding: '12px 15px', width: '130px', fontSize: '11px', fontWeight: '800', opacity: 0.5, textTransform: 'uppercase', borderRight: '1px solid var(--border)' }}>ID / Vreme</div>
                            <div style={{ padding: '12px 15px', flex: 1, fontSize: '11px', fontWeight: '800', opacity: 0.5, textTransform: 'uppercase', borderRight: '1px solid var(--border)' }}>Kupac / Detalji</div>
                            <div style={{ padding: '12px 15px', width: '100px', fontSize: '11px', fontWeight: '800', opacity: 0.5, textTransform: 'uppercase', borderRight: '1px solid var(--border)' }}>Vrsta</div>
                            <div style={{ padding: '12px 15px', flex: 1, fontSize: '11px', fontWeight: '800', opacity: 0.5, textTransform: 'uppercase', borderRight: '1px solid var(--border)' }}>Vrsta Kupca</div>
                            <div style={{ padding: '12px 15px', flex: 1, fontSize: '11px', fontWeight: '800', opacity: 0.5, textTransform: 'uppercase', borderRight: '1px solid var(--border)' }}>Dobavljač</div>
                            <div style={{ padding: '12px 15px', flex: 1, fontSize: '11px', fontWeight: '800', opacity: 0.5, textTransform: 'uppercase', borderRight: '1px solid var(--border)' }}>Poslovnica</div>
                            <div style={{ padding: '12px 15px', width: '120px', textAlign: 'right', fontSize: '11px', fontWeight: '800', opacity: 0.5, textTransform: 'uppercase' }}>Iznos / Status</div>
                        </div>

                        {paginatedReservations.map((res, idx) => (
                            <motion.div
                                key={res.id}
                                initial={{ opacity: 0, x: -15 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.03 }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    borderBottom: '1px solid var(--border)',
                                    transition: 'all 0.2s'
                                }}
                                className="pulse-row"
                            >
                                <div style={{ padding: '12px 15px', width: '130px', borderRight: '1px solid var(--border)', alignSelf: 'stretch', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                    <a
                                        href={`/reservation-architect?id=${res.id}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                            fontWeight: '900',
                                            background: getStatusDisplay(res).color,
                                            color: 'white',
                                            fontSize: '13px',
                                            padding: '4px 8px',
                                            borderRadius: '6px',
                                            textAlign: 'center',
                                            width: '80px',
                                            marginBottom: '4px',
                                            boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
                                            textDecoration: 'none',
                                            display: 'block'
                                        }}
                                    >
                                        {res.id}
                                    </a>
                                    <div style={{ fontSize: '11px', opacity: 0.5 }}>{res.time}</div>
                                </div>

                                <div style={{ padding: '12px 15px', flex: 1, borderRight: '1px solid var(--border)', alignSelf: 'stretch', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                    <div style={{ fontWeight: '700', color: 'var(--accent)', cursor: 'pointer', textDecoration: 'underline', fontSize: '15px' }}>{res.customer}</div>
                                    <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                        <div style={{ fontWeight: '800', fontSize: '12px', color: 'var(--text-primary)', opacity: 0.9 }}>
                                            {(res as any).type === 'Flight' ? `Itinerer: ${res.hotel}` : (res as any).type === 'Package' ? `Putovanje: ${res.hotel}` : `Hotel: ${res.hotel}`}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Globe size={10} /> {res.country}, {res.destination}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent)', fontWeight: '700' }}>
                                            <Clock size={10} /> Boravak: {new Date((res as any).checkIn).toLocaleDateString('sr-Latn-RS')} - {new Date((res as any).checkOut).toLocaleDateString('sr-Latn-RS')}
                                        </div>
                                    </div>
                                </div>

                                <div style={{ padding: '12px 15px', width: '100px', borderRight: '1px solid var(--border)', alignSelf: 'stretch', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                    <div style={{
                                        padding: '4px 10px',
                                        borderRadius: '6px',
                                        background: 'rgba(255, 255, 255, 0.05)',
                                        color: 'var(--text-primary)',
                                        fontSize: '10px',
                                        fontWeight: '800',
                                        textTransform: 'uppercase',
                                        width: 'fit-content'
                                    }}>
                                        {res.productType}
                                    </div>
                                </div>

                                <div style={{ padding: '12px 15px', flex: 1, borderRight: '1px solid var(--border)', alignSelf: 'stretch', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        <div style={{ fontWeight: '800', fontSize: '14px', color: 'var(--text-primary)' }}>
                                            {res.subagent ? res.subagent : (res.clientType === 'B2B' ? 'Agencijski Klijent' : 'Direktni Putnik')}
                                        </div>
                                        <div style={{
                                            display: 'inline-flex',
                                            padding: '4px 10px',
                                            borderRadius: '6px',
                                            background: 'rgba(0, 0, 0, 0.05)',
                                            border: '1px solid rgba(0, 0, 0, 0.05)',
                                            color: 'var(--text-secondary)',
                                            fontSize: '10px',
                                            fontWeight: '800',
                                            width: '90px'
                                        }}>
                                            {res.subagent ? 'SUBAGENT' : res.clientType}
                                        </div>
                                    </div>
                                </div>

                                <div style={{ padding: '12px 15px', flex: 1, borderRight: '1px solid var(--border)', alignSelf: 'stretch', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                    <div style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Globe size={14} style={{ color: '#10b981' }} /> {res.supplier}
                                    </div>
                                </div>

                                <div style={{ padding: '12px 15px', flex: 1, borderRight: '1px solid var(--border)', alignSelf: 'stretch', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                    <div style={{ fontWeight: '600' }}>{res.branch}</div>
                                </div>

                                <div style={{ padding: '12px 15px', width: '120px', textAlign: 'right', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                    <div style={{ fontWeight: '900', fontSize: '18px', color: 'var(--text-primary)' }}>{res.amount.toLocaleString()} €</div>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px', marginTop: '4px' }}>
                                        {res.status === 'Confirmed' ? <CheckCircle2 size={12} color={getStatusDisplay(res).color} /> : res.status === 'Pending' ? <Clock size={12} color="#f59e0b" /> : <XCircle size={12} color="#ef4444" />}
                                        <span style={{ fontSize: '10px', fontWeight: '800', color: getStatusDisplay(res).color, textTransform: 'uppercase' }}>{getStatusDisplay(res).label}</span>
                                    </div>
                                </div>

                                <div style={{ width: '40px', display: 'flex', justifyContent: 'flex-end' }}>
                                    <button
                                        onClick={() => navigate(`/reservation-architect?id=${res.id}`)}
                                        style={{
                                            width: '36px',
                                            height: '36px',
                                            borderRadius: '10px',
                                            border: 'none',
                                            background: 'rgba(59, 130, 246, 0.1)',
                                            color: 'var(--accent)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <ArrowUpRight size={18} />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                        {/* Pagination Controls */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            padding: '20px 0',
                            gap: '15px'
                        }}>
                            <button
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    color: 'white',
                                    borderRadius: '8px',
                                    width: '32px',
                                    height: '32px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                                    opacity: currentPage === 1 ? 0.3 : 1
                                }}
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-secondary)' }}>
                                Strana <span style={{ color: 'var(--text-primary)' }}>{currentPage}</span> od <span style={{ color: 'var(--text-primary)' }}>{totalPages || 1}</span>
                            </div>
                            <button
                                disabled={currentPage >= totalPages}
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    color: 'white',
                                    borderRadius: '8px',
                                    width: '32px',
                                    height: '32px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer',
                                    opacity: currentPage >= totalPages ? 0.3 : 1
                                }}
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {/* Header for Aggregated View */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            padding: '12px 30px',
                            background: 'rgba(255, 255, 255, 0.03)',
                            borderBottom: '1px solid var(--border)',
                            gap: '30px',
                        }}>
                            <div style={{ flex: 2, fontSize: '11px', fontWeight: '800', opacity: 0.5, textTransform: 'uppercase' }}>
                                {aggMode === 'subagent' ? 'Partner' : aggMode === 'supplier' ? 'Dobavljač' : aggMode === 'branch' ? 'Sektor' : 'Vrsta Kupca'}
                            </div>
                            <div style={{ flex: 1, textAlign: 'center', fontSize: '11px', fontWeight: '800', opacity: 0.5, textTransform: 'uppercase' }}>Broj Rezervacija</div>
                            <div style={{ flex: 1, textAlign: 'right', fontSize: '11px', fontWeight: '800', opacity: 0.5, textTransform: 'uppercase' }}>Ukupan Promet</div>
                            <div style={{ width: '120px' }}></div>
                        </div>

                        {aggregatedData.map((data, idx) => (
                            <motion.div
                                key={data.name}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '16px 30px',
                                    borderBottom: '2px solid #ddd', // Visible light grey line
                                    gap: '30px',
                                    background: 'rgba(255, 255, 255, 0.01)',
                                    transition: 'all 0.2s'
                                }}
                                className="pulse-row"
                            >
                                <div style={{ flex: 2 }}>
                                    <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)' }}>{data.name}</div>
                                </div>

                                <div style={{ flex: 1, textAlign: 'center' }}>
                                    <div style={{
                                        display: 'inline-block',
                                        background: 'rgba(168, 85, 247, 0.15)',
                                        color: '#a855f7',
                                        padding: '4px 16px',
                                        borderRadius: '100px',
                                        fontSize: '14px',
                                        fontWeight: '900',
                                        border: '1px solid rgba(168, 85, 247, 0.2)'
                                    }}>
                                        {data.count} Rez.
                                    </div>
                                </div>

                                <div style={{ flex: 1, textAlign: 'right' }}>
                                    <div style={{ fontSize: '24px', fontWeight: '900', color: '#10b981', letterSpacing: '-0.5px' }}>{data.total.toLocaleString()} €</div>
                                </div>

                                <div style={{ width: '120px', display: 'flex', justifyContent: 'flex-end' }}>
                                    <button style={{
                                        padding: '10px 20px',
                                        borderRadius: '12px',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        background: 'rgba(255,255,255,0.05)',
                                        color: 'white',
                                        fontSize: '12px',
                                        fontWeight: '800',
                                        cursor: 'pointer',
                                        transition: '0.2s'
                                    }}>
                                        Detalji
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Footer / Smart Command Suggestion */}
            <div style={{
                padding: '20px 40px',
                background: 'rgba(0,0,0,0.1)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    <Monitor size={16} />
                    <span>Napredni pregled dostupan u posebnom tabu <strong>Command Center</strong></span>
                </div>
                <button
                    onClick={() => navigate('/command-center')}
                    style={{
                        padding: '10px 24px',
                        borderRadius: '14px',
                        background: 'white',
                        color: 'black',
                        border: 'none',
                        fontWeight: '800',
                        fontSize: '13px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                >
                    Otvori Command Center <ArrowRight size={16} />
                </button>
            </div>

            {/* Daily Wisdom included here to scroll with content */}
            <DailyWisdom />
        </div>
    );
};

export default Dashboard;
