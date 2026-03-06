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
    TrendingUp
} from 'lucide-react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
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
    const { lang } = useThemeStore();
    const { userLevel, impersonatedSubagent } = useAuthStore();
    const t = translations[lang];
    const navigate = useNavigate();

    const isStaff = userLevel >= 6 && !impersonatedSubagent;
    const isB2BView = userLevel < 6 || !!impersonatedSubagent;

    const staffNavItems: NavItemDef[] = [
        { to: '/', icon: LayoutDashboard, label: t.dashboard },
        {
            to: '/reservations', icon: ClipboardList, label: t.reservations,
            subItems: [
                { to: '/reservations', label: 'Status Dashboard', icon: BarChart3 },
                { to: '/reservation-architect', label: 'Novi Dosije', icon: Plus },
                { to: '/destination-rep', label: 'Dest. Predstavnici', icon: Users },
                { to: '/deep-archive', label: 'Arhiva', icon: X },
            ]
        },
        {
            to: '/operational-reports', icon: Activity, label: 'Operativni Izveštaji',
            subItems: [
                { to: '/operational-reports?tab=inventory', label: 'Inventory Orchestrator', icon: Calendar },
                { to: '/operational-reports?tab=stats', label: 'PAX & Statistika', icon: BarChart3 },
                { to: '/operational-reports?tab=analytics', label: 'Dynamic Analytics', icon: TrendingUp },
                { to: '/operational-reports?tab=rooming', label: 'Rooming Lista', icon: Users },
            ]
        },
        {
            to: '/financial-hub', icon: PieChart, label: 'Financial Intelligence',
            subItems: [
                { to: '/financial-hub', label: 'FIL Dashboard', icon: LayoutDashboard },
                { to: '/financial-hub?tab=payments', label: 'Isplate Dobavljačima', icon: DollarSign },
                { to: '/fx-service', label: 'Kursna Lista / NBS', icon: RefreshCw },
                { to: '/financial-hub?tab=payments', label: 'VCC Postavke', icon: Compass },
            ]
        },
        {
            to: '/production', icon: Package, label: t.production,
            subItems: [
                { to: '/smart-search', label: 'Smart Search ✨', icon: Sparkles },
                { to: '/production?view=accommodations', label: 'Smeštaj', icon: Building2 },
                { to: '/production?tab=trips', label: 'Grupna Putovanja', icon: Users },
                { to: '/production?tab=trips', label: 'Individualna Putovanja', icon: User },
                { to: '/production?tab=trips', label: 'Krstarenja', icon: Ship },
                { to: '/production?view=transport', label: 'Avio Karte', icon: Navigation },
                { to: '/production?view=transport', label: 'Autobuski Prevoz', icon: Car },
                { to: '/production?view=transport', label: 'Železnički Prevoz', icon: Train },
                { to: '/production?view=transport', label: 'Brodski Prevoz', icon: Anchor },
                { to: '/production?view=services', label: 'Izleti', icon: Waves },
                { to: '/production?view=services', label: 'Ulaznice', icon: Ticket },
                { to: '/price-list-architect', label: 'Pricing Architect', icon: Calculator },
                { to: '/price-list-architect', label: 'Pricing Architect', icon: Calculator },
            ]
        },
        {
            to: '/suppliers', icon: Truck, label: 'Dobavljači',
            subItems: [
                { to: '/api-connections', label: 'API Connections', icon: SettingsIcon },
                { to: '/suppliers', label: 'Lista Dobavljača', icon: Users },
                { to: '/supplier-admin', label: 'Upravljanje Partnerima', icon: Building2 },
                { to: '/pricing-intelligence', label: 'Pricing Pravila', icon: DollarSign },
            ]
        },
        {
            to: '/customers', icon: Users, label: 'Kupci',
            subItems: [
                { to: '/customers', label: 'B2C Baza Kupaca', icon: Users },
                { to: '/subagent-admin', label: 'B2B Subagenti', icon: Users },
            ]
        },
        {
            to: '/modules', icon: LayoutGrid, label: 'Moduli',
            subItems: [
                { to: '/modules', label: 'Svi Moduli', icon: LayoutGrid },
                { to: '/b2b-promo-manager', label: 'B2B Promo Manager', icon: Sparkles },
                { to: '/katana', label: 'Katana Engine', icon: Cpu },
                { to: '/', label: 'Glavni Dashboard', icon: LayoutDashboard },
            ]
        },
        {
            to: '/settings', icon: SettingsIcon, label: t.settings,
            subItems: [
                { to: '/b2b-promo-manager', label: 'B2B Promo Manager', icon: Sparkles },
                { to: '/settings', label: 'Globalne Postavke', icon: SettingsIcon },
                { to: '/activity-log', label: 'Dnevnik Aktivnosti', icon: ClipboardList },
                { to: '/katana', label: 'Katana Engine', icon: Sparkles },
            ]
        },
    ];

    const mainItems = staffNavItems.filter(i => ['/', '/reservations', '/financial-hub', '/operational-reports'].includes(i.to));
    const sectorItems = staffNavItems.filter(i => ['/production', '/suppliers', '/customers', '/modules'].includes(i.to));
    const systemItems = staffNavItems.filter(i => i.to === '/settings');

    const b2bItems = [
        { to: '/smart-search', icon: Sparkles, label: 'Smart Search ✨' },
        { to: '/my-reservations', icon: ClipboardList, label: 'Moje Rezervacije' }
    ];

    // Premium Mail Item (Horizontal)
    const renderMailLink = () => (
        <NavLink
            to="/mail"
            className={({ isActive }) => `h-nav-item ${isActive ? 'active' : ''}`}
            style={({ isActive }) => ({
                background: isActive
                    ? 'linear-gradient(135deg, #FFD700 0%, #DAA520 100%)'
                    : 'rgba(255, 215, 0, 0.1)',
                color: isActive ? '#000' : '#FFD700',
                border: '1px solid rgba(255,215,0,0.3)',
                padding: '6px 14px',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '12px',
                marginLeft: '8px'
            })}
        >
            <Mail size={16} /> TCT MAIL ✨
        </NavLink>
    );

    // --- Submenu hover state ---
    const [openMenu, setOpenMenu] = React.useState<string | null>(null);
    const [menuPos, setMenuPos] = React.useState<{ top: number; left: number }>({ top: 0, left: 0 });
    const closeTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    const itemRefs = React.useRef<Record<string, HTMLDivElement | null>>({});

    const openSubmenu = (key: string) => {
        if (closeTimer.current) clearTimeout(closeTimer.current);
        const el = itemRefs.current[key];
        if (el) {
            const rect = el.getBoundingClientRect();
            setMenuPos({ top: rect.bottom + 6, left: rect.left });
        }
        setOpenMenu(key);
    };

    const scheduleClose = () => {
        closeTimer.current = setTimeout(() => setOpenMenu(null), 200);
    };

    const cancelClose = () => {
        if (closeTimer.current) clearTimeout(closeTimer.current);
    };

    const activeItem = staffNavItems.find(item => item.to === openMenu);

    const navItemClass = (isActive: boolean) =>
        `h-nav-item ${isActive ? 'active' : ''}`;

    return (
        <div className="horizontal-nav">
            <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', flexShrink: 0 }}>
                <div style={{
                    marginRight: '32px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    paddingTop: '4px'
                }}>
                    <ClickToTravelLogo height={288} />
                </div>
            </Link>

            <div className="nav-horizontal-items">
                {/* Staff / Main Hub items */}
                {(userLevel >= 3 || isStaff) && (
                    <>
                        <div className="h-nav-group">
                            <span className="h-group-label">Main</span>
                            <div className="h-group-items">
                                {mainItems.map((item) => {
                                    // Skip financial intelligence for levels < 6
                                    if (item.to === '/financial-hub' && userLevel < 6) return null;
                                    return (
                                        <div
                                            key={item.to}
                                            ref={(el) => { itemRefs.current[item.to] = el; }}
                                            onMouseEnter={() => openSubmenu(item.to)}
                                            onMouseLeave={scheduleClose}
                                        >
                                            <NavLink to={item.to} className={({ isActive }) => navItemClass(isActive)}>
                                                <item.icon size={18} /> {item.label}
                                            </NavLink>
                                        </div>
                                    );
                                })}
                                {isStaff && renderMailLink()}
                            </div>
                        </div>

                        {isStaff && (
                            <>
                                <div className="h-nav-group">
                                    <span className="h-group-label">Sektori</span>
                                    <div className="h-group-items">
                                        {sectorItems.map((item) => (
                                            <div
                                                key={item.to}
                                                ref={(el) => { itemRefs.current[item.to] = el; }}
                                                onMouseEnter={() => openSubmenu(item.to)}
                                                onMouseLeave={scheduleClose}
                                            >
                                                <NavLink to={item.to} className={({ isActive }) => navItemClass(isActive)}>
                                                    <item.icon size={18} /> {item.label}
                                                </NavLink>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="h-nav-group">
                                    <span className="h-group-label">Sistem</span>
                                    <div className="h-group-items">
                                        {systemItems.map((item) => (
                                            <div
                                                key={item.to}
                                                ref={(el) => { itemRefs.current[item.to] = el; }}
                                                onMouseEnter={() => openSubmenu(item.to)}
                                                onMouseLeave={scheduleClose}
                                            >
                                                <NavLink to={item.to} className={({ isActive }) => navItemClass(isActive)}>
                                                    <item.icon size={18} /> {item.label}
                                                </NavLink>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </>
                )}

                {/* B2B Subagent items */}
                {isB2BView && !isStaff && (
                    <div className="h-nav-group">
                        <span className="h-group-label">B2B Partner</span>
                        <div className="h-group-items">
                            {b2bItems.map((item) => (
                                <NavLink key={item.to} to={item.to} className={({ isActive }) => navItemClass(isActive)}>
                                    <item.icon size={18} /> {item.label}
                                </NavLink>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Right zone */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginLeft: 'auto', flexShrink: 0 }}>
                {impersonatedSubagent && (
                    <div className="impersonation-indicator-premium">
                        <div className="status-dot-pulse" />
                        <Users size={14} />
                        <span className="company-name">{impersonatedSubagent.companyName}</span>
                        <button
                            className="exit-b2b-btn"
                            onClick={() => useAuthStore.getState().setImpersonatedSubagent(undefined)}
                            title="Prekini impersonaciju"
                        >
                            <X size={14} /> <span>IZLAZ</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Global submenu portal — rendered once, outside the nav bar flow */}
            {openMenu && activeItem?.subItems && createPortal(
                <div
                    onMouseEnter={cancelClose}
                    onMouseLeave={scheduleClose}
                    style={{
                        position: 'fixed',
                        top: menuPos.top,
                        left: menuPos.left,
                        minWidth: '220px',
                        background: 'var(--bg-sidebar)',
                        border: '1px solid var(--border)',
                        borderRadius: '12px',
                        boxShadow: '0 16px 48px rgba(0,0,0,0.7)',
                        padding: '8px',
                        zIndex: 99999,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        animation: 'submenuFadeIn 0.15s ease-out',
                    }}
                >
                    {activeItem.subItems.map((sub, idx) => {
                        const SubIcon = sub.icon;
                        return (
                            <NavLink
                                key={idx}
                                to={sub.to}
                                onClick={() => setOpenMenu(null)}
                                className={({ isActive }) => `h-submenu-item ${isActive ? 'active' : ''}`}
                            >
                                {SubIcon && <SubIcon size={14} />} {sub.label}
                            </NavLink>
                        );
                    })}
                </div>,
                document.body
            )}
        </div>
    );
};

export default HorizontalNav;
