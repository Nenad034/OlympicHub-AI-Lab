import React from 'react';
import {
    LayoutDashboard,
    Package,
    Truck,
    Users,
    Settings as SettingsIcon,
    ChevronRight,
    Mail,
    Compass,
    Sparkles,
    Activity,
    ClipboardList,
    DollarSign,
    Plus,
    BarChart3,
    X,
    Building2,
    RefreshCw,
    PieChart,
    Calculator,
    User,
    Navigation,
    Waves,
    LayoutGrid,
    Cpu,
    Calendar,
    TrendingUp,
    Power,
    Sun,
    Moon,
    LayoutTemplate,
    Brain,
    GripVertical
} from 'lucide-react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { motion, Reorder } from 'framer-motion';
import { ClickToTravelLogo } from '../icons/ClickToTravelLogo';
import { PrimeChatIcon } from '../../icons/PrimeChatIcon';
import { useThemeStore, useAppStore, useAuthStore } from '../../stores';
import { translations } from '../../translations';

const Sidebar: React.FC = () => {
    const { theme, cycleTheme, lang, setLang, isPrism, togglePrism, isSidebarCollapsed, toggleSidebar, toggleNavMode } = useThemeStore();
    const { userLevel, impersonatedSubagent, userName, logout } = useAuthStore();
    const { setChatOpen } = useAppStore();
    const location = useLocation();
    const [expandedItem, setExpandedItem] = React.useState<string | null>(null);

    const t = translations[lang];

    const mainFocusItems = React.useMemo(() => [
        { id: 'dashboard', id_str: 'dashboard', to: "/", icon: LayoutDashboard, label: t.dashboard, title: t.dashboard },
        {
            id: 'reservations',
            id_str: 'reservations',
            to: "/reservations",
            icon: ClipboardList,
            label: t.reservations,
            title: t.reservations,
            subItems: [
                { to: '/reservations', label: 'Dashboard', icon: BarChart3 },
                { to: '/reservation-architect', label: 'Novi Dosije', icon: Plus },
                { to: '/destination-rep', label: 'Dest. Predstavnici', icon: Users },
                { to: '/deep-archive', label: 'Arhiva', icon: X }
            ]
        },
        {
            id: 'finances',
            id_str: 'finances',
            to: "/financial-hub",
            icon: PieChart,
            label: 'Finansije',
            title: "Financial Intelligence",
            subItems: [
                { to: '/financial-hub', label: 'FIL Dashboard', icon: LayoutDashboard },
                { to: '/financial-hub?tab=payments', label: 'Isplate', icon: DollarSign },
                { to: '/fx-service', label: 'NBS Lista', icon: RefreshCw },
                { to: '/financial-hub?tab=payments', label: 'VCC Postavke', icon: Compass }
            ],
            staffOnly: true
        },
        {
            id: 'reports',
            id_str: 'reports',
            to: "/operational-reports",
            icon: Activity,
            label: 'Izveštaji',
            title: "Operativni Izveštaji",
            subItems: [
                { to: '/operational-reports?tab=inventory', label: 'Inventory', icon: Calendar },
                { to: '/operational-reports?tab=stats', label: 'PAX & Statistika', icon: BarChart3 },
                { to: '/operational-reports?tab=analytics', label: 'Analytics', icon: TrendingUp },
                { to: '/operational-reports?tab=rooming', label: 'Rooming', icon: Users }
            ]
        }
    ], [t]);

    const sectorItems = React.useMemo(() => [
        {
            id: 'production',
            id_str: 'production',
            to: "/production",
            icon: Package,
            label: t.production,
            title: t.production,
            subItems: [
                { to: '/smart-search', label: 'Smart Search ✨', icon: Sparkles },
                { to: '/production?view=accommodations', label: 'Smeštaj', icon: Building2 },
                { to: '/production?tab=trips', label: 'Grupna', icon: Users },
                { to: '/production?tab=trips', label: 'Individualna', icon: User },
                { to: '/production?view=transport', label: 'Prevoz', icon: Navigation },
                { to: '/production?view=services', label: 'Usluge', icon: Waves },
                { to: '/price-list-architect', label: 'Architect', icon: Calculator }
            ]
        },
        {
            id: 'suppliers',
            id_str: 'suppliers',
            to: "/suppliers",
            icon: Truck,
            label: 'Snabdevanje',
            title: "Snabdevanje",
            subItems: [
                { to: '/api-connections', label: 'API Connections', icon: SettingsIcon },
                { to: '/suppliers', label: 'Lista', icon: Users },
                { to: '/suppliers?tab=matrix', label: 'Matrica Cene', icon: Building2 },
                { to: '/pricing-intelligence', label: 'Pricing Hub', icon: DollarSign }
            ]
        },
        {
            id: 'customers',
            id_str: 'customers',
            to: "/customers",
            icon: Users,
            label: 'Kupci',
            title: "Kupci",
            subItems: [
                { to: '/customers', label: 'B2C Baza', icon: Users },
                { to: '/subagent-admin', label: 'B2B Subagenti', icon: Users }
            ]
        },
        {
            id: 'modules',
            id_str: 'modules',
            to: "/modules",
            icon: LayoutGrid,
            label: 'Moduli',
            title: "Moduli",
            subItems: [
                { to: '/modules', label: 'Svi Moduli', icon: LayoutGrid },
                { to: '/smart-marketing', label: 'Smart AI Marketing', icon: Brain },
                { to: '/b2b-promo-manager', label: 'Promo Manager', icon: Sparkles },
                { to: '/katana', label: 'Katana Engine', icon: Cpu },
                { to: '/', label: 'Dashboard', icon: LayoutDashboard },
            ]
        },
        { id: 'mail', id_str: 'mail', to: "/mail", icon: Mail, label: 'Prime Mail', title: "Prime Mail", className: "prime-mail-nav-item" },
        { id: 'chat', id_str: 'chat', isChat: true },
        {
            id: 'settings',
            id_str: 'settings',
            to: "/settings",
            icon: SettingsIcon,
            label: t.settings,
            title: t.settings,
            subItems: [
                { to: '/settings', label: 'Globalne', icon: SettingsIcon },
                { to: '/activity-log', label: 'Dnevnik', icon: ClipboardList }
            ]
        }
    ], [t]);

    const [mainFocusOrder, setMainFocusOrder] = React.useState(() => {
        const saved = localStorage.getItem('sidebar_main_order');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                return parsed.map((p: any) => mainFocusItems.find(i => i.id === p.id)).filter(Boolean);
            } catch (e) { return mainFocusItems; }
        }
        return mainFocusItems;
    });

    const [sectorOrder, setSectorOrder] = React.useState(() => {
        const saved = localStorage.getItem('sidebar_sector_order');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                return parsed.map((p: any) => sectorItems.find(i => i.id === p.id)).filter(Boolean);
            } catch (e) { return sectorItems; }
        }
        return sectorItems;
    });

    React.useEffect(() => {
        localStorage.setItem('sidebar_main_order', JSON.stringify(mainFocusOrder.map((i: any) => ({ id: i.id }))));
    }, [mainFocusOrder]);

    React.useEffect(() => {
        localStorage.setItem('sidebar_sector_order', JSON.stringify(sectorOrder.map((i: any) => ({ id: i.id }))));
    }, [sectorOrder]);

    const navItemClass = (isActive: boolean) => `nav-item ${isActive ? 'active' : ''}`;

    const NavGroupItem = ({ to, icon: Icon, label, subItems, title, className, isDraggable }: any) => {
        const isExpanded = expandedItem === to;
        const isActive = location.pathname.startsWith(to) && to !== '/';

        return (
            <div className={`nav-item-wrapper ${isExpanded ? 'expanded' : ''} ${isDraggable ? 'is-draggable' : ''}`}>
                <div
                    className={`${navItemClass(isActive)} ${className || ''}`}
                    onClick={() => {
                        if (subItems && !isSidebarCollapsed) {
                            setExpandedItem(isExpanded ? null : to);
                        }
                    }}
                    title={title}
                    style={{ position: 'relative' }}
                >
                    {isDraggable && !isSidebarCollapsed && (
                        <div className="drag-handle" style={{ opacity: 0.3, cursor: 'grab', marginRight: '4px', display: 'flex', alignItems: 'center' }}>
                            <GripVertical size={14} />
                        </div>
                    )}
                    <NavLink
                        to={to}
                        style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none', color: 'inherit', width: '100%' }}
                    >
                        <Icon size={20} /> {!isSidebarCollapsed && label}
                    </NavLink>
                    {subItems && !isSidebarCollapsed && (
                        <ChevronRight
                            size={14}
                            style={{
                                marginLeft: 'auto',
                                transform: isExpanded ? 'rotate(90deg)' : 'none',
                                transition: '0.2s'
                            }}
                        />
                    )}
                </div>

                {subItems && (
                    <div className="submenu-list">
                        {subItems.map((sub: any, idx: number) => (
                            <NavLink
                                key={idx}
                                to={sub.to}
                                className={({ isActive }) => `submenu-item ${isActive ? 'active' : ''}`}
                                style={sub.to === '/smart-search' ? {
                                    color: 'var(--accent)',
                                    fontWeight: '800',
                                    background: 'rgba(59, 130, 246, 0.1)',
                                    borderRadius: '10px'
                                } : {}}
                            >
                                {sub.icon && <sub.icon size={16} />}
                                {!isSidebarCollapsed && sub.label}
                            </NavLink>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <aside className={`sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`} style={{
            background: 'var(--bg-sidebar)',
            borderRight: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            overflow: 'hidden',
            width: isSidebarCollapsed ? '80px' : '288px'
        }}>
            {/* Logo removed from Sidebar as requested */}
            <div style={{ height: '20px' }} />

            <button className="collapse-toggle" onClick={toggleSidebar}>
                <ChevronRight size={16} style={{ transform: isSidebarCollapsed ? 'none' : 'rotate(180deg)', transition: '0.2s' }} />
            </button>

            <nav className="nav-section" style={{
                marginTop: '10px',
                flex: 1,
                overflowY: 'auto',
                padding: '0 12px',
                msOverflowStyle: 'none',
                scrollbarWidth: 'none'
            }}>
                {/* Main Section */}
                {(userLevel >= 3 || (userLevel >= 6 && !impersonatedSubagent)) && (
                    <div className="nav-group">
                        <h3 className="nav-label" style={{ opacity: 0.6, fontSize: '10px', fontWeight: 900, letterSpacing: '2px', paddingLeft: '12px', marginBottom: '12px' }}>
                            {!isSidebarCollapsed && 'MAIN FOCUS'}
                        </h3>
                        <Reorder.Group axis="y" values={mainFocusOrder} onReorder={setMainFocusOrder} style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                            {mainFocusOrder.map((item: any) => (
                                <Reorder.Item
                                    key={item.id}
                                    value={item}
                                    dragListener={!isSidebarCollapsed}
                                    style={{ userSelect: 'none' }}
                                >
                                    <NavGroupItem {...item} isDraggable={!isSidebarCollapsed} />
                                </Reorder.Item>
                            ))}
                        </Reorder.Group>
                    </div>
                )}

                {/* Sectors Section */}
                {userLevel >= 6 && !impersonatedSubagent && (
                    <div className="nav-group">
                        <h3 className="nav-label" style={{ opacity: 0.6, fontSize: '10px', fontWeight: 900, letterSpacing: '2px', paddingLeft: '12px', marginBottom: '12px', marginTop: '20px' }}>
                            {!isSidebarCollapsed && 'POSLOVNI SEKTORI'}
                        </h3>

                        <Reorder.Group axis="y" values={sectorOrder} onReorder={setSectorOrder} style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                            {sectorOrder.map((item: any) => {
                                if (item.isChat) {
                                    return (
                                        <Reorder.Item
                                            key={item.id}
                                            value={item}
                                            dragListener={!isSidebarCollapsed}
                                            style={{ userSelect: 'none' }}
                                        >
                                            <div className="nav-item-wrapper is-draggable">
                                                <div
                                                    className="nav-item"
                                                    onClick={() => setChatOpen(true)}
                                                    title="Prime Chat"
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '12px',
                                                        padding: '12px 16px',
                                                        cursor: 'pointer',
                                                        color: '#800020',
                                                        fontWeight: 800,
                                                        width: '100%',
                                                        marginTop: '2px',
                                                        marginBottom: '2px',
                                                        borderRadius: '12px',
                                                        position: 'relative'
                                                    }}
                                                >
                                                    {!isSidebarCollapsed && (
                                                        <div className="drag-handle" style={{ opacity: 0.3, cursor: 'grab', marginRight: '4px', display: 'flex', alignItems: 'center' }}>
                                                            <GripVertical size={14} />
                                                        </div>
                                                    )}
                                                    <PrimeChatIcon size={20} />
                                                    {!isSidebarCollapsed && 'Prime Chat'}
                                                </div>
                                            </div>
                                        </Reorder.Item>
                                    );
                                }
                                return (
                                    <Reorder.Item
                                        key={item.id}
                                        value={item}
                                        dragListener={!isSidebarCollapsed}
                                        style={{ userSelect: 'none' }}
                                    >
                                        <NavGroupItem {...item} isDraggable={!isSidebarCollapsed} />
                                    </Reorder.Item>
                                );
                            })}
                        </Reorder.Group>
                    </div>
                )}
            </nav>

            {/* Sidebar Footer */}
            <div className="sidebar-footer" style={{
                marginTop: 'auto',
                padding: '16px 0 40px 0',
                borderTop: '1px solid var(--border)',
                background: 'rgba(0,0,0,0.3)',
                backdropFilter: 'blur(20px)',
                zIndex: 10,
                display: 'flex',
                alignItems: 'center',
                flexDirection: 'column',
                gap: '8px'
            }}>
                {!isSidebarCollapsed ? (
                    <div className="footer-expanded-content" style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', padding: '0 12px' }}>
                        <div style={{
                            display: 'flex',
                            background: 'rgba(255,255,255,0.03)',
                            padding: '4px',
                            borderRadius: '16px',
                            border: '1px solid rgba(255,255,255,0.08)',
                            justifyContent: 'space-between',
                            width: '100%'
                        }}>
                            <button onClick={toggleNavMode} title="Horizontalni Menu" style={{ flex: 1, background: 'transparent', border: 'none', padding: '6px', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                                <LayoutTemplate size={16} />
                            </button>
                            <div style={{ display: 'flex', background: theme === 'light' ? 'rgba(0,0,0,0.1)' : 'rgba(0,0,0,0.25)', padding: '3px', borderRadius: '10px', alignItems: 'center', flex: 1.5 }}>
                                <button onClick={() => setLang('sr')} style={{
                                    flex: 1, padding: '4px 0', border: 'none',
                                    background: lang === 'sr' ? (theme === 'light' ? 'var(--accent)' : 'rgba(59,130,246,0.3)') : 'transparent',
                                    borderRadius: '8px',
                                    color: lang === 'sr' ? '#fff' : (theme === 'light' ? '#1e3a8a' : 'var(--text-secondary)'),
                                    cursor: 'pointer', fontSize: '10px', fontWeight: 950,
                                    transition: 'all 0.2s'
                                }}>SRB</button>
                                <button onClick={() => setLang('en')} style={{
                                    flex: 1, padding: '4px 0', border: 'none',
                                    background: lang === 'en' ? (theme === 'light' ? 'var(--accent)' : 'rgba(59,130,246,0.3)') : 'transparent',
                                    borderRadius: '8px',
                                    color: lang === 'en' ? '#fff' : (theme === 'light' ? '#1e3a8a' : 'var(--text-secondary)'),
                                    cursor: 'pointer', fontSize: '10px', fontWeight: 950,
                                    transition: 'all 0.2s'
                                }}>ENG</button>
                            </div>
                            <button onClick={cycleTheme} style={{ flex: 1, background: 'transparent', border: 'none', padding: '6px', cursor: 'pointer' }}>
                                {theme === 'navy' ? <Moon size={15} color="var(--accent)" /> : <Sun size={15} color="#eab308" />}
                            </button>
                            <button onClick={togglePrism} style={{ flex: 1, background: 'transparent', border: 'none', padding: '6px', cursor: 'pointer' }}>
                                <Sparkles size={15} color={isPrism ? '#bb9af7' : 'var(--text-secondary)'} />
                            </button>
                        </div>

                        <div className="user-profile-pill" style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            background: 'rgba(255,255,255,0.05)',
                            padding: '6px 12px',
                            borderRadius: '16px',
                            border: '1px solid rgba(255,255,255,0.1)',
                            width: '100%'
                        }}>
                            <div className="avatar" style={{
                                width: '28px', height: '28px',
                                background: 'linear-gradient(135deg, var(--accent) 0%, #4f46e5 100%)',
                                borderRadius: '10px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'white', fontWeight: 900, fontSize: '13px'
                            }}>
                                {userName.charAt(0)}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{userName}</div>
                            </div>
                            <button onClick={logout} style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                                <Power size={14} />
                            </button>
                        </div>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                        <button onClick={toggleNavMode} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                            <LayoutTemplate size={20} />
                        </button>
                        <div onClick={logout} style={{ width: '38px', height: '38px', background: 'var(--accent)', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900 }}>
                            {userName.charAt(0)}
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                .prime-mail-nav-item {
                    color: #FFD700 !important;
                    background: rgba(255, 215, 0, 0.05) !important;
                    border: 1px solid rgba(255, 215, 0, 0.1) !important;
                    margin-top: 24px;
                }
                .prime-mail-nav-item svg { color: #FFD700 !important; }
            `}</style>
        </aside>
    );
};

export default Sidebar;
