import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, Reorder, AnimatePresence } from 'framer-motion';
import {
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
    ArrowRight
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
    Monitor
} from 'lucide-react';

const MOCK_LIVE_RESERVATIONS = [
    { id: 'R-9452', customer: 'Jovan Jovanović', country: 'Grčka', destination: 'Rodos', hotel: 'Mitsis Grand Hotel', subagent: 'Travel Pro DOO', supplier: 'Hotelbeds', branch: 'Beograd - Knez', amount: 1250, debt: 1250, payment: 800, status: 'Confirmed', time: 'Pre 2 min', type: 'Hotel', daysAgo: 0 },
    { id: 'R-9451', customer: 'Marko Marković', country: 'Turska', destination: 'Antalija', hotel: 'Rixos Premium Belek', subagent: null, clientType: 'B2C', supplier: 'Amadeus', branch: 'Novi Sad', amount: 450, debt: 450, payment: 450, status: 'Confirmed', time: 'Pre 5 min', type: 'Flight', daysAgo: 0 },
    { id: 'R-9450', customer: 'Ana Anić', country: 'Egipat', destination: 'Hurgada', hotel: 'Steigenberger ALDAU', subagent: 'SuperTravel', supplier: 'Mts Globe', branch: 'Niš', amount: 2100, debt: 2100, payment: 0, status: 'Pending', time: 'Pre 12 min', type: 'Package', daysAgo: 1 },
    { id: 'R-9449', customer: 'Petar Petrović', country: 'Grčka', destination: 'Krit', hotel: 'Stella Island Luxury', subagent: null, clientType: 'B2B', supplier: 'Expedia', branch: 'Beograd - Knez', amount: 890, debt: 890, payment: 890, status: 'Confirmed', time: 'Pre 18 min', type: 'Hotel', daysAgo: 3 },
    { id: 'R-9448', customer: 'Milica Milić', country: 'Grčka', destination: 'Halkidiki', hotel: 'Sani Beach', subagent: 'Montenegro Fly', supplier: 'Solvex', branch: 'Podgorica', amount: 3200, debt: 3200, payment: 1200, status: 'Cancelled', time: 'Pre 25 min', type: 'Package', daysAgo: 5 },
    { id: 'R-9447', customer: 'Ivan Ivanović', country: 'Italija', destination: 'Rim', hotel: 'Hotel Quirinale', subagent: null, clientType: 'B2C', supplier: 'Hotelbeds', branch: 'Novi Sad', amount: 150, debt: 150, payment: 150, status: 'Confirmed', time: 'Pre 40 min', type: 'Transfer', daysAgo: 12 },
    { id: 'R-9446', customer: 'Savo Savić', country: 'Turska', destination: 'Bodrum', hotel: 'Titanic Deluxe Bodrum', subagent: 'Travel Pro DOO', supplier: 'Amadeus', branch: 'Beograd - Knez', amount: 1100, debt: 1100, payment: 1100, status: 'Confirmed', time: 'Pre 1h', type: 'Flight', daysAgo: 20 },
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
        name: 'Smart Concierge',
        desc: 'AI prodajni agent sa yield optimizacijom i VCC sigurnosnom zaštitom.',
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
    const [aggMode, setAggMode] = useState<'feed' | 'subagent' | 'supplier' | 'branch'>('feed');
    const [statusFilter, setStatusFilter] = useState<'all' | 'Confirmed' | 'Pending' | 'Cancelled'>('all');
    const [daysFilter, setDaysFilter] = useState<number | string>(30);

    const filteredReservations = MOCK_LIVE_RESERVATIONS.filter(res => {
        const matchesStatus = statusFilter === 'all' ? true : res.status === statusFilter;
        const matchesDays = res.daysAgo < (typeof daysFilter === 'number' ? daysFilter : 30);
        return matchesStatus && matchesDays;
    });

    const totalReservations = filteredReservations.length;
    const totalDebt = filteredReservations.reduce((acc, res) => acc + res.debt, 0);
    const totalPayments = filteredReservations.reduce((acc, res) => acc + res.payment, 0);

    const getAggregatedData = () => {
        const result: any[] = [];
        const map = new Map();

        const key = aggMode === 'subagent' ? 'subagent' : aggMode === 'supplier' ? 'supplier' : 'branch';

        filteredReservations.forEach(res => {
            const val = (res as any)[key];
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

    return (
        <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(20px)',
            borderRadius: '32px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
        }}>
            {/* Pulsing Header & Status Filters */}
            <div style={{
                padding: '16px 30px',
                background: 'linear-gradient(90deg, rgba(59, 130, 246, 0.1) 0%, rgba(37, 99, 235, 0.05) 100%)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                display: 'flex',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ position: 'relative' }}>
                        <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '10px',
                            background: 'var(--accent)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            boxShadow: '0 0 15px var(--accent-glow)'
                        }}>
                            <Activity size={16} />
                        </div>
                        <motion.div
                            animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0, 0.5] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            style={{
                                position: 'absolute',
                                top: -2,
                                right: -2,
                                width: '8px',
                                height: '8px',
                                background: '#10b981',
                                borderRadius: '50%',
                                border: '2px solid var(--bg-card)'
                            }}
                        />
                    </div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>Global Pulse</h2>
                    </div>

                    {/* STATUS FILTERS */}
                    <div style={{ display: 'flex', background: 'rgba(0,0,0,0.2)', padding: '3px', borderRadius: '10px', margin: '0 10px' }}>
                        {[
                            { id: 'all', label: 'Sve' },
                            { id: 'Confirmed', label: 'Potvrđene' },
                            { id: 'Pending', label: 'Na čekanju' },
                            { id: 'Cancelled', label: 'Otkazane' }
                        ].map(st => (
                            <button
                                key={st.id}
                                onClick={() => setStatusFilter(st.id as any)}
                                style={{
                                    padding: '5px 12px',
                                    borderRadius: '7px',
                                    border: 'none',
                                    fontSize: '10px',
                                    fontWeight: '700',
                                    cursor: 'pointer',
                                    background: statusFilter === st.id ? 'var(--text-primary)' : 'transparent',
                                    color: statusFilter === st.id ? 'var(--bg-card)' : 'var(--text-secondary)',
                                    transition: '0.2s'
                                }}
                            >
                                {st.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    {/* DAYS FILTER */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(0,0,0,0.2)', padding: '5px 12px', borderRadius: '10px' }}>
                        <span style={{ fontSize: '10px', fontWeight: '800', opacity: 0.5, textTransform: 'uppercase' }}>Broj dana</span>
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
                                width: '45px',
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                borderRadius: '5px',
                                color: 'var(--text-primary)',
                                fontSize: '11px',
                                fontWeight: '700',
                                textAlign: 'center',
                                padding: '3px'
                            }}
                        />
                    </div>

                    {/* Aggregator Switcher */}
                    <div style={{
                        display: 'flex',
                        background: 'rgba(0,0,0,0.2)',
                        padding: '4px',
                        borderRadius: '12px',
                        gap: '3px'
                    }}>
                        {[
                            { id: 'feed', label: 'Live Feed', icon: <Activity size={12} /> },
                            { id: 'subagent', label: 'Po Subagentima', icon: <Users size={12} /> },
                            { id: 'supplier', label: 'Po Dobavljačima', icon: <Globe size={12} /> },
                            { id: 'branch', label: 'Po Poslovnicama', icon: <Building size={12} /> }
                        ].map(btn => (
                            <button
                                key={btn.id}
                                onClick={() => setAggMode(btn.id as any)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '6px 12px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: aggMode === btn.id ? 'var(--accent)' : 'transparent',
                                    color: aggMode === btn.id ? 'white' : 'var(--text-secondary)',
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
                </div>
            </div>

            {/* QUICK SUMMARY KPI ROW - ENHANCED */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '12px',
                padding: '20px 30px',
                background: 'rgba(0, 0, 0, 0.15)',
                borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
                {[
                    {
                        label: 'Ukupno rezervacija',
                        value: totalReservations,
                        icon: <FileText size={18} />,
                        color: 'var(--accent)',
                        gradient: 'linear-gradient(135deg, rgba(59, 130, 246, 0.2) 0%, transparent 100%)'
                    },
                    {
                        label: 'Ukupno zaduženje',
                        value: `${totalDebt.toLocaleString()} €`,
                        icon: <CreditCard size={18} />,
                        color: '#ef4444',
                        gradient: 'linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, transparent 100%)'
                    },
                    {
                        label: 'Ukupno uplata',
                        value: `${totalPayments.toLocaleString()} €`,
                        icon: <Zap size={18} />,
                        color: '#10b981',
                        gradient: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, transparent 100%)'
                    }
                ].map((stat, i) => (
                    <motion.div
                        key={i}
                        whileHover={{ translateY: -3, background: 'rgba(255, 255, 255, 0.05)' }}
                        style={{
                            padding: '16px 20px',
                            borderRadius: '16px',
                            background: 'rgba(255, 255, 255, 0.02)',
                            border: '1px solid rgba(255, 255, 255, 0.05)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '15px',
                            transition: 'all 0.3s ease'
                        }}
                    >
                        <div style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: '14px',
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
                            <div style={{ fontSize: '10px', opacity: 0.5, fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>{stat.label}</div>
                            <div style={{ fontSize: '20px', fontWeight: '900', color: stat.color, letterSpacing: '-0.5px' }}>{stat.value}</div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Content Area */}
            <div style={{ padding: '0 20px 20px 20px' }}>
                {aggMode === 'feed' ? (
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {filteredReservations.map((res, idx) => (
                            <motion.div
                                key={res.id}
                                initial={{ opacity: 0, x: -15 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.03 }}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '12px 15px',
                                    borderBottom: '1px solid var(--border)',
                                    gap: '16px',
                                    transition: 'all 0.2s'
                                }}
                                className="pulse-row"
                            >
                                <div style={{ width: '80px' }}>
                                    <div style={{ fontWeight: '800', color: 'var(--text-primary)', fontSize: '14px' }}>{res.id}</div>
                                    <div style={{ fontSize: '11px', opacity: 0.5, marginTop: '2px' }}>{res.time}</div>
                                </div>

                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '11px', opacity: 0.5, textTransform: 'uppercase', fontWeight: '800', marginBottom: '4px' }}>Kupac</div>
                                    <div style={{ fontWeight: '700', color: 'var(--accent)', cursor: 'pointer', textDecoration: 'underline' }}>{res.customer}</div>
                                    <div style={{ fontSize: '11px', opacity: 0.8, marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Globe size={10} /> {res.country}, {res.destination}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <Hotel size={10} /> {res.hotel}
                                        </div>
                                    </div>
                                </div>

                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '11px', opacity: 0.5, textTransform: 'uppercase', fontWeight: '800', marginBottom: '4px' }}>Vrsta kupca</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        <div style={{
                                            display: 'inline-flex',
                                            padding: '4px 10px',
                                            borderRadius: '6px',
                                            background: res.subagent ? 'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)' : (res.clientType === 'B2B' ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)'),
                                            color: 'white',
                                            fontSize: '10px',
                                            paddingTop: '3px',
                                            fontWeight: '800',
                                            width: 'fit-content'
                                        }}>
                                            {res.subagent ? 'SUBAGENT' : res.clientType}
                                        </div>
                                        {res.subagent && (
                                            <div style={{ fontSize: '11px', fontWeight: '600', opacity: 0.8 }}>{res.subagent}</div>
                                        )}
                                    </div>
                                </div>

                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '11px', opacity: 0.5, textTransform: 'uppercase', fontWeight: '800', marginBottom: '4px' }}>Dobavljač</div>
                                    <div style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Globe size={14} style={{ color: '#10b981' }} /> {res.supplier}
                                    </div>
                                </div>

                                <div style={{ flex: 1 }}>
                                    <div style={{ fontSize: '11px', opacity: 0.5, textTransform: 'uppercase', fontWeight: '800', marginBottom: '4px' }}>Poslovnica</div>
                                    <div style={{ fontWeight: '600' }}>{res.branch}</div>
                                </div>

                                <div style={{ width: '120px', textAlign: 'right' }}>
                                    <div style={{ fontWeight: '900', fontSize: '18px', color: 'var(--text-primary)' }}>{res.amount.toLocaleString()} €</div>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px', marginTop: '4px' }}>
                                        {res.status === 'Confirmed' ? <CheckCircle2 size={12} color="#10b981" /> : res.status === 'Pending' ? <Clock size={12} color="#f59e0b" /> : <XCircle size={12} color="#ef4444" />}
                                        <span style={{ fontSize: '10px', fontWeight: '800', color: res.status === 'Confirmed' ? '#10b981' : res.status === 'Pending' ? '#f59e0b' : '#ef4444', textTransform: 'uppercase' }}>{res.status}</span>
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
                    </div>
                ) : (
                    <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                        {aggregatedData.map((data, idx) => (
                            <motion.div
                                key={data.name}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.05 }}
                                style={{
                                    background: 'rgba(255, 255, 255, 0.02)',
                                    borderRadius: '24px',
                                    padding: '24px',
                                    border: '1px solid rgba(255, 255, 255, 0.05)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '16px'
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div>
                                        <div style={{ fontSize: '11px', opacity: 0.5, textTransform: 'uppercase', fontWeight: '800', marginBottom: '4px' }}>
                                            {aggMode === 'subagent' ? 'Partner' : aggMode === 'supplier' ? 'Dobavljač' : 'Sektor'}
                                        </div>
                                        <div style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-primary)' }}>{data.name}</div>
                                    </div>
                                    <div style={{
                                        background: 'var(--accent)',
                                        color: 'white',
                                        padding: '4px 12px',
                                        borderRadius: '8px',
                                        fontSize: '12px',
                                        fontWeight: '800'
                                    }}>
                                        {data.count} Rez.
                                    </div>
                                </div>

                                <div style={{ height: '1px', background: 'rgba(255,255,255,0.05)' }}></div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                    <div>
                                        <div style={{ fontSize: '10px', opacity: 0.5, textTransform: 'uppercase', fontWeight: '800', marginBottom: '2px' }}>Ukupan Promet</div>
                                        <div style={{ fontSize: '22px', fontWeight: '900', color: '#10b981' }}>{data.total.toLocaleString()} €</div>
                                    </div>
                                    <button style={{
                                        padding: '8px 12px',
                                        borderRadius: '10px',
                                        border: '1px solid rgba(255,255,255,0.1)',
                                        background: 'transparent',
                                        color: 'var(--text-secondary)',
                                        fontSize: '11px',
                                        fontWeight: '700',
                                        cursor: 'pointer'
                                    }}>Detalji</button>
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
