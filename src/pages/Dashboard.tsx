import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, Reorder } from 'framer-motion';
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
    Castle,
    Cpu,
    Brain,
    Sparkles,
    Plane,
    FileText,
    Plug,
    Search
} from 'lucide-react';
import { useThemeStore, useAppStore, useAuthStore } from '../stores';
import { translations } from '../translations';
import DailyWisdom from '../components/DailyWisdom';
import { useIntelligenceStore } from '../stores/intelligenceStore';
import { softZoneService } from '../services/softZoneService';
import { Zap, Thermometer, TrendingDown, RefreshCcw } from 'lucide-react';

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
    { id: 'smart-search', name: 'Smart Search', desc: 'Inteligentna pretraga i preporuka smeštaja sa AI asistencijom i analizom tržišta.', icon: <Sparkles size={24} />, category: 'sales', color: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', badge: 'AI', minLevel: 1, path: '/smart-search' },
    { id: 'global-hub', name: 'Globalni Hub Search', desc: 'Jedinstvena pretraga za TCT i Open Greece baze.', icon: <Search size={24} />, category: 'sales', color: 'var(--gradient-blue)', badge: 'Beta', minLevel: 1, path: '/hub' },
    { id: 'reservations', name: 'Rezervacije', desc: 'Centralni pregled i upravljanje svim rezervacijama.', icon: <FileText size={24} />, category: 'sales', color: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', badge: 'Novo', minLevel: 1, path: '/reservations' },
    { id: 'mars-analysis', name: 'Mars ERP Analitika', desc: 'Finansijska i operativna analiza procesa.', icon: <Database size={24} />, category: 'production', color: 'var(--gradient-blue)', badge: 'Live', minLevel: 1, path: '/mars-analysis' },
    { id: 'production-hub', name: 'Upravljanje Produkcijom', desc: 'Smeštaj, putovanja, transferi i paketi.', icon: <Package size={24} />, category: 'production', color: 'var(--gradient-green)', badge: 'Novo', minLevel: 1, path: '/production' },
    { id: 'contact-architect', name: 'Master Contact Hub', desc: 'Centralna inteligencija svih kontakata, putnika, dobavljača i subagenata sa AI analitikom.', icon: <Users size={24} />, category: 'production', color: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', badge: 'AI CRM', minLevel: 1, path: '/contact-architect' },
    { id: 'price-generator', name: 'Generator Cenovnika', desc: 'Kreiranje cenovnika i import u Mars.', icon: <BarChart3 size={24} />, category: 'production', color: 'var(--gradient-green)', minLevel: 3, path: '/pricing-intelligence' },
    { id: 'portfolio', name: 'Naša Ponuda', desc: 'Upravljanje bazom hotela i prevoza.', icon: <Building2 size={24} />, category: 'sales', color: 'var(--gradient-purple)', minLevel: 2, path: '/portfolio' },
    { id: 'marketing-ses', name: 'Amazon SES Marketing', desc: 'Slanje newslettera subagentima.', icon: <Mail size={24} />, category: 'marketing', color: 'var(--gradient-orange)', badge: 'Novi', minLevel: 4, path: '/marketing' },
    { id: 'olympic-mail', name: 'Olympic Mail', desc: 'Centralizovano upravljanje email nalozima i komunikacijom.', icon: <Mail size={24} />, category: 'communication', color: 'var(--gradient-blue)', badge: 'Live', minLevel: 1, path: '/mail' },
    { id: 'master-orchestrator', name: 'Master Orchestrator', desc: 'AI Agent Management System - Centralno upravljanje sa 6 specijalizovanih AI agenata.', icon: <Brain size={24} />, category: 'ai', color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', badge: 'AI', minLevel: 6, path: '/orchestrator' },
    { id: 'package-builder', name: 'Dynamic Package Builder', desc: 'Kreirajte kompleksne pakete kombinovanjem letova, hotela, transfera i dodatnih usluga.', icon: <Package size={24} />, category: 'sales', color: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', badge: 'Novo', minLevel: 1, path: '/packages' },
    { id: 'daily-activity', name: 'Dnevni Izveštaj Aktivnosti', desc: 'Kompletna analiza svih aktivnosti u sistemu sa detaljnim izveštajima po statusima rezervacija.', icon: <FileText size={24} />, category: 'system', color: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', badge: 'Live', minLevel: 3, path: '/settings?tab=daily-activity' },
    { id: 'katana', name: 'Katana (To-Do)', desc: 'Efikasno upravljanje procesima i zadacima.', icon: <Sword size={24} />, category: 'system', color: 'var(--gradient-blue)', badge: 'Musashi', minLevel: 1, path: '/katana' },
    { id: 'deep-archive', name: 'Duboka Arhiva', desc: 'Centralni registar svih obrisanih i promenjenih stavki.', icon: <ShieldAlert size={24} />, category: 'system', color: 'var(--gradient-purple)', minLevel: 6, path: '/deep-archive' },
    { id: 'fortress', name: 'Fortress Security', desc: 'Command Center za nadzor i bezbednost koda.', icon: <Castle size={24} />, category: 'system', color: 'var(--gradient-purple)', badge: 'Master', minLevel: 6, path: '/fortress' },
    { id: 'soft-zone', name: 'Vajckin Soft Zone', desc: 'AI-Driven Environmental Reflex System - Inteligentno prilagođavanje tržištu.', icon: <Sparkles size={24} />, category: 'ai', color: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', badge: 'Intelligence', minLevel: 1, path: '/soft-zone' },
    { id: 'hotel-importer', name: 'AI Hotel Importer', desc: 'Uvoz i AI obrada hotela iz eksternih sistema (Solvex/OpenGreece).', icon: <Database size={24} />, category: 'system', color: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)', badge: 'New', minLevel: 5, path: '/admin/import' },
    { id: 'api-connections', name: 'PARTNERI - DOBAVLJAČI', desc: 'Centralno upravljanje partnerima i dostupnim API dobavljačima.', icon: <Plug size={24} />, category: 'system', color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', badge: 'Hub', minLevel: 1, path: '/api-connections' },
    { id: 'subagent-admin', name: 'Subagent Admin', desc: 'Upravljanje subagentima, dozvolama, provizijama i finansijama.', icon: <Users size={24} />, category: 'system', color: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', badge: 'New', minLevel: 6, path: '/subagent-admin' }
];


const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const { lang } = useThemeStore();
    const { searchQuery } = useAppStore();
    const { userLevel } = useAuthStore();
    const { activeTriggers } = useIntelligenceStore();
    const t = translations[lang];
    const [activeCategory, setActiveCategory] = useState('all');


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

    // Force sync new apps into user preference
    useEffect(() => {
        const currentIds = userApps.map(a => a.id);
        const missingFromUser = apps.filter(a => !currentIds.includes(a.id));

        if (missingFromUser.length > 0) {
            setUserApps(prev => [...missingFromUser, ...prev]);
        }
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

    const FEATURED_IDS = ['smart-search', 'global-hub', 'reservations'];

    const featuredApps = userApps.filter(app => FEATURED_IDS.includes(app.id) && userLevel >= app.minLevel);
    const otherApps = userApps.filter(app => !FEATURED_IDS.includes(app.id) && userLevel >= app.minLevel);

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
        <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
        >
            {/* Header */}
            <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
                <div>
                    <h1 style={{ fontSize: '32px', fontWeight: '700', marginBottom: '8px' }}>
                        {t.welcomeBack}
                    </h1>
                    <p style={{ color: 'var(--text-secondary)' }}>{t.hubDesc}</p>
                </div>

                {/* Vajckin Intelligence Status Widget */}
                <div className="intelligence-widget-header" onClick={() => navigate('/soft-zone')} style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: '16px',
                    padding: '12px 20px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '15px',
                    minWidth: '300px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                }}>
                    <div style={{
                        background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white'
                    }}>
                        <Brain size={20} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 600 }}>{t.intelligence.toUpperCase()} STATUS</div>
                        <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {t.softZone}: {activeTriggers.length > 0 ? t.activeReflexes : t.baselineMode}
                        </div>
                    </div>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            softZoneService.scanEnvironment();
                        }}
                        style={{
                            background: 'transparent',
                            border: '1px solid var(--border)',
                            borderRadius: '8px',
                            padding: '6px',
                            color: 'var(--text-secondary)',
                            cursor: 'pointer'
                        }}
                        title="Scan Environment"
                    >
                        <RefreshCcw size={16} />
                    </button>
                    <ChevronRight size={16} color="var(--text-secondary)" />
                </div>
            </div>

            {/* Apps Grid */}
            {searchQuery ? (
                <div className="dashboard-grid">
                    {filteredApps.map((app, idx) => (
                        <motion.div
                            key={app.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: idx * 0.05 }}
                            className="module-card"
                            onClick={() => handleAppClick(app)}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div className="card-icon" style={{ background: app.color }}>{app.icon}</div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                                    {app.badge && (
                                        <span className="badge" style={{ position: 'static', background: 'rgba(63, 185, 80, 0.1)', color: '#3fb950' }}>
                                            {app.badge}
                                        </span>
                                    )}
                                    <span style={{ fontSize: '10px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <ShieldAlert size={10} /> {getUserRights(app.minLevel)}
                                    </span>
                                </div>
                            </div>
                            <h3 className="card-title">{app.name}</h3>
                            <p className="card-desc">{app.desc}</p>
                            <div className="card-footer" style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '600', color: 'var(--accent)' }}>
                                {t.openModule} <ChevronRight size={14} />
                            </div>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <>
                    {/* Featured Apps Section - Centered */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        marginBottom: '40px'
                    }}>
                        <div className="dashboard-grid" style={{
                            display: 'grid',
                            gridTemplateColumns: `repeat(${featuredApps.length}, 1fr)`,
                            maxWidth: '1200px',
                            margin: '0 auto',
                            width: '100%',
                            gap: '20px'
                        }}>


                            {featuredApps.map((app, idx) => (
                                <motion.div
                                    key={app.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="module-card featured"
                                    onClick={() => handleAppClick(app)}
                                    style={{
                                        border: '2px solid var(--accent)',
                                        boxShadow: '0 0 20px var(--accent-glow)'
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div className="card-icon" style={{ background: app.color }}>{app.icon}</div>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                                            {app.badge && (
                                                <span className="badge" style={{ position: 'static', background: 'rgba(63, 185, 80, 0.1)', color: '#3fb950' }}>
                                                    {app.badge}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <h3 className="card-title">{app.name}</h3>
                                    <p className="card-desc">{app.desc}</p>
                                    <div className="card-footer" style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '600', color: 'var(--accent)' }}>
                                        {t.openModule} <ChevronRight size={14} />
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>

                    <div style={{ width: '100%', height: '1px', background: 'var(--border)', marginBottom: '40px', opacity: 0.5 }}></div>

                    {/* Category Filters */}
                    <div style={{
                        display: 'flex',
                        gap: '12px',
                        marginBottom: '32px',
                        overflowX: 'auto',
                        paddingBottom: '8px',
                        scrollbarWidth: 'none'
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


                    {/* Other Apps Section */}
                    <Reorder.Group
                        values={userApps}
                        onReorder={setUserApps}
                        className="dashboard-grid"
                        style={{ listStyle: 'none', padding: 0 }}
                    >
                        {filteredOtherApps.map((app, idx) => (

                            <Reorder.Item
                                key={app.id}
                                value={app}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}

                                className="module-card draggable"
                                onClick={() => handleAppClick(app)}
                                style={{ cursor: 'grab', position: 'relative' }}
                                whileDrag={{
                                    scale: 1.05,
                                    boxShadow: "0 25px 50px rgba(0,0,0,0.4)",
                                    zIndex: 50,
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div className="card-icon" style={{ background: app.color }}>{app.icon}</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                                        {app.badge && (
                                            <span className="badge" style={{ position: 'static', background: 'rgba(63, 185, 80, 0.1)', color: '#3fb950' }}>
                                                {app.badge}
                                            </span>
                                        )}
                                        <span style={{ fontSize: '10px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <ShieldAlert size={10} /> {getUserRights(app.minLevel)}
                                        </span>
                                    </div>
                                </div>
                                <h3 className="card-title">{app.name}</h3>
                                <p className="card-desc">{app.desc}</p>
                                <div className="card-footer" style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: '600', color: 'var(--accent)' }}>
                                    {t.openModule} <ChevronRight size={14} />
                                </div>
                            </Reorder.Item>
                        ))}
                    </Reorder.Group>
                </>
            )
            }

            {/* Daily Wisdom */}
            <DailyWisdom />


        </motion.div >
    );
};

export default Dashboard;
