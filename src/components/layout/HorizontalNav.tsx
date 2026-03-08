import React from 'react';
import { createPortal } from 'react-dom';
import {
    LayoutDashboard,
    Package,
    Truck,
    Users,
    Settings as SettingsIcon,
    Search,
    Mail,
    Compass,
    ClipboardList,
    Sparkles,
    Activity,
    X,
    DollarSign,
    BarChart3,
    Plus,
    RefreshCw,
    Building2,
    Calculator,
    PieChart,
    User,
    Ship,
    Navigation,
    Car,
    Train,
    Anchor,
    Waves,
    Ticket,
    LayoutGrid,
    Cpu,
    Calendar,
    TrendingUp,
    Power,
    Sun,
    Moon,
    Monitor,
    Globe,
    LayoutTemplate,
    ChevronDown
} from 'lucide-react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { ClickToTravelLogo } from '../icons/ClickToTravelLogo';
import { useThemeStore, useAppStore, useAuthStore } from '../../stores';
import { translations } from '../../translations';
import './HorizontalNav.css';

interface SubItem {
    to: string;
    label: string;
    icon?: React.ElementType;
}

interface NavItemDef {
    to: string;
    icon: React.ElementType;
    label: string;
    subItems?: SubItem[];
}

const HorizontalNav: React.FC = () => {
    const { theme, cycleTheme, lang, setLang, isPrism, togglePrism, navMode, toggleNavMode } = useThemeStore();
    const { userLevel, impersonatedSubagent, userName, logout } = useAuthStore();
    const t = translations[lang];
    const navigate = useNavigate();
    const location = useLocation();

    const isStaff = userLevel >= 6 && !impersonatedSubagent;
    const isB2BView = userLevel < 6 || !!impersonatedSubagent;

    const staffNavItems: NavItemDef[] = [
        { to: '/', icon: LayoutDashboard, label: t.dashboard },
        {
            to: '/reservations',
            icon: ClipboardList,
            label: t.reservations,
            subItems: [
                { to: '/reservations', label: 'Dashboard', icon: BarChart3 },
                { to: '/reservation-architect', label: 'Novi Dosije', icon: Plus },
                { to: '/destination-rep', label: 'Dest. Predstavnici', icon: Users },
                { to: '/deep-archive', label: 'Arhiva', icon: X }
            ]
        },
        {
            to: '/operational-reports',
            icon: Activity,
            label: 'Izveštaji',
            subItems: [
                { to: '/operational-reports?tab=inventory', label: 'Inventory', icon: Calendar },
                { to: '/operational-reports?tab=stats', label: 'PAX & Statistika', icon: BarChart3 },
                { to: '/operational-reports?tab=analytics', label: 'Analytics', icon: TrendingUp },
                { to: '/operational-reports?tab=rooming', label: 'Rooming', icon: Users }
            ]
        },
        {
            to: '/financial-hub',
            icon: PieChart,
            label: 'Finansije',
            subItems: [
                { to: '/financial-hub', label: 'FIL Dashboard', icon: LayoutDashboard },
                { to: '/financial-hub?tab=payments', label: 'Isplate', icon: DollarSign },
                { to: '/fx-service', label: 'NBS Lista', icon: RefreshCw },
                { to: '/financial-hub?tab=payments', label: 'VCC Postavke', icon: Compass }
            ]
        },
        {
            to: '/production',
            icon: Package,
            label: t.production,
            subItems: [
                { to: '/smart-search', label: 'Smart Search ✨', icon: Sparkles },
                { to: '/production?view=accommodations', label: 'Smeštaj', icon: Building2 },
                { to: '/production?tab=trips', label: 'Grupna Putovanja', icon: Users },
                { to: '/production?tab=trips', label: 'Individualna', icon: User },
                { to: '/production?view=transport', label: 'Prevoz', icon: Navigation },
                { to: '/production?view=services', label: 'Usluge', icon: Waves },
                { to: '/price-list-architect', label: 'Architect', icon: Calculator }
            ]
        },
        {
            to: '/suppliers',
            icon: Truck,
            label: 'Snabdevanje',
            subItems: [
                { to: '/api-connections', label: 'API Connections', icon: SettingsIcon },
                { to: '/suppliers', label: 'Lista Dobavljača', icon: Users },
                { to: '/supplier-admin', label: 'Upravljanje', icon: Building2 },
                { to: '/pricing-intelligence', label: 'Pricing Rules', icon: DollarSign }
            ]
        },
        {
            to: '/customers',
            icon: Users,
            label: 'Kupci',
            subItems: [
                { to: '/customers', label: 'B2C Baza', icon: Users },
                { to: '/subagent-admin', label: 'B2B Subagenti', icon: Users }
            ]
        },
        {
            to: '/modules',
            icon: LayoutGrid,
            label: 'Moduli',
            subItems: [
                { to: '/modules', label: 'Svi Moduli', icon: LayoutGrid },
                { to: '/b2b-promo-manager', label: 'Promo Manager', icon: Sparkles },
                { to: '/katana', label: 'Katana Engine', icon: Cpu },
            ]
        },
        {
            to: '/settings',
            icon: SettingsIcon,
            label: t.settings,
            subItems: [
                { to: '/settings', label: 'Globalne', icon: SettingsIcon },
                { to: '/activity-log', label: 'Dnevnik Aktivnosti', icon: ClipboardList }
            ]
        },
    ];

    const b2bItems = [
        { to: '/smart-search', icon: Sparkles, label: 'Smart Search ✨' },
        { to: '/my-reservations', icon: ClipboardList, label: 'Moje Rezervacije' }
    ];

    const [openMenu, setOpenMenu] = React.useState<string | null>(null);
    const [menuPos, setMenuPos] = React.useState<{ top: number; left: number }>({ top: 0, left: 0 });
    const closeTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    const itemRefs = React.useRef<Record<string, HTMLDivElement | null>>({});

    const handleMouseEnter = (key: string) => {
        if (closeTimer.current) clearTimeout(closeTimer.current);
        const el = itemRefs.current[key];
        if (el) {
            const rect = el.getBoundingClientRect();
            setMenuPos({ top: rect.bottom, left: rect.left });
            setOpenMenu(key);
        }
    };

    const handleMouseLeave = () => {
        closeTimer.current = setTimeout(() => setOpenMenu(null), 150);
    };

    const navItemClass = (isActive: boolean) => `h-nav-item ${isActive ? 'active' : ''}`;

    return (
        <div className="horizontal-nav" style={{ height: '100px', padding: '0 24px', position: 'relative' }}>
            <Link to="/" style={{ display: 'flex', alignItems: 'center', flexShrink: 0, marginRight: '32px' }}>
                <ClickToTravelLogo height={180} />
            </Link>

            <div className="nav-horizontal-items" style={{ flex: 1, overflow: 'visible' }}>
                {(userLevel >= 3 || isStaff) && (
                    <div className="h-group-items" style={{ gap: '4px' }}>
                        {staffNavItems.map((item) => (
                            <div
                                key={item.to}
                                ref={el => { itemRefs.current[item.to] = el; }}
                                onMouseEnter={() => item.subItems && handleMouseEnter(item.to)}
                                onMouseLeave={handleMouseLeave}
                                className="h-nav-item-wrapper"
                                style={{ position: 'relative' }}
                            >
                                <NavLink
                                    to={item.to}
                                    className={({ isActive }) => navItemClass(isActive || (openMenu === item.to))}
                                    onClick={(e) => {
                                        if (item.subItems) e.preventDefault();
                                        navigate(item.to);
                                    }}
                                >
                                    <item.icon size={18} />
                                    <span>{item.label}</span>
                                    {item.subItems && <ChevronDown size={12} style={{ opacity: 0.5, marginLeft: '4px' }} />}
                                </NavLink>
                            </div>
                        ))}
                        <NavLink to="/mail" className={({ isActive }) => navItemClass(isActive)} style={{ color: '#FFD700', marginLeft: '12px' }}>
                            <Mail size={18} /> <span>Prime Mail</span>
                        </NavLink>
                    </div>
                )}

                {isB2BView && !isStaff && (
                    <div className="h-group-items">
                        {b2bItems.map((item) => (
                            <NavLink key={item.to} to={item.to} className={({ isActive }) => navItemClass(isActive)}>
                                <item.icon size={18} /> {item.label}
                            </NavLink>
                        ))}
                    </div>
                )}
            </div>

            {/* Portal for Submenus */}
            {openMenu && staffNavItems.find(i => i.to === openMenu)?.subItems && (
                createPortal(
                    <div
                        className="h-submenu-portal"
                        onMouseEnter={() => { if (closeTimer.current) clearTimeout(closeTimer.current); }}
                        onMouseLeave={handleMouseLeave}
                        style={{
                            position: 'fixed',
                            top: menuPos.top,
                            left: menuPos.left,
                            zIndex: 9999,
                            background: 'var(--bg-sidebar)',
                            border: '1px solid var(--border)',
                            borderRadius: '12px',
                            padding: '8px',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
                            minWidth: '200px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px',
                            animation: 'h-submenu-in 0.2s ease-out'
                        }}
                    >
                        {staffNavItems.find(i => i.to === openMenu)?.subItems?.map((sub, idx) => (
                            <NavLink
                                key={idx}
                                to={sub.to}
                                className={({ isActive }) => `h-submenu-item ${isActive ? 'active' : ''}`}
                                onClick={() => setOpenMenu(null)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '10px 14px',
                                    color: 'var(--text-secondary)',
                                    textDecoration: 'none',
                                    fontSize: '13px',
                                    fontWeight: 600,
                                    borderRadius: '8px',
                                    transition: 'all 0.2s'
                                }}
                            >
                                {sub.icon && React.createElement(sub.icon, { size: 16 })}
                                {sub.label}
                            </NavLink>
                        ))}
                    </div>,
                    document.body
                )
            )}

            {/* Right Zone */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginLeft: '32px', flexShrink: 0 }}>
                {/* Control Pill */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: 'rgba(255,255,255,0.03)',
                    padding: '4px 12px',
                    borderRadius: '50px',
                    border: '1px solid rgba(255,255,255,0.08)',
                    height: '44px'
                }}>
                    <button onClick={toggleNavMode} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '6px', display: 'flex' }}>
                        <LayoutTemplate size={18} />
                    </button>
                    <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)', height: '16px', margin: '0 8px' }} />
                    <div style={{ display: 'flex', background: 'rgba(0,0,0,0.25)', padding: '3px', borderRadius: '10px', alignItems: 'center' }}>
                        <button onClick={() => setLang('sr')} style={{
                            padding: '4px 10px', border: 'none',
                            background: lang === 'sr' ? 'rgba(59,130,246,0.15)' : 'transparent',
                            borderRadius: '8px',
                            color: lang === 'sr' ? '#bb9af7' : 'var(--text-secondary)',
                            cursor: 'pointer', fontSize: '11px', fontWeight: 800
                        }}>SRB</button>
                        <button onClick={() => setLang('en')} style={{
                            padding: '4px 10px', border: 'none',
                            background: lang === 'en' ? 'rgba(59,130,246,0.15)' : 'transparent',
                            borderRadius: '8px',
                            color: lang === 'en' ? '#bb9af7' : 'var(--text-secondary)',
                            cursor: 'pointer', fontSize: '11px', fontWeight: 800
                        }}>ENG</button>
                    </div>
                    <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)', height: '16px', margin: '0 8px' }} />
                    <button onClick={cycleTheme} style={{ background: 'transparent', border: 'none', color: '#bb9af7', cursor: 'pointer', padding: '6px', display: 'flex' }}>
                        {theme === 'navy' ? <Moon size={18} /> : <Sun size={18} color="#eab308" />}
                    </button>
                    <button onClick={togglePrism} style={{ background: 'transparent', border: 'none', color: isPrism ? '#3b82f6' : 'var(--text-secondary)', cursor: 'pointer', padding: '6px', display: 'flex' }}>
                        <Sparkles size={18} />
                    </button>
                </div>

                {/* User Pill */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '4px 16px 4px 6px',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: '50px',
                    height: '44px'
                }}>
                    <div className="avatar" style={{
                        width: '32px', height: '32px',
                        background: 'linear-gradient(135deg, #a855f7 0%, #3b82f6 100%)',
                        borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontWeight: 800, fontSize: '14px',
                        boxShadow: '0 0 15px rgba(59,130,246,0.2)'
                    }}>
                        {userName.charAt(0)}
                    </div>
                    <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.2px' }}>{userName}</span>
                    <button
                        onClick={logout}
                        title="Odjava"
                        style={{ background: 'transparent', border: 'none', color: '#ef4444', padding: '4px', cursor: 'pointer', display: 'flex', opacity: 0.8 }}
                    >
                        <Power size={18} />
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes h-submenu-in {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .h-submenu-item:hover {
                    background: rgba(59, 130, 246, 0.1) !important;
                    color: var(--accent) !important;
                    padding-left: 18px !important;
                }
                .h-submenu-item.active {
                    background: rgba(59, 130, 246, 0.15) !important;
                    color: var(--accent) !important;
                }
            `}</style>
        </div>
    );
};

export default HorizontalNav;
