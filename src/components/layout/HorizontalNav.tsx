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
    X,
    DollarSign,
    BarChart3,
    Plus,
    RefreshCw,
    Building2
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
            to: '/production', icon: Package, label: t.production,
            subItems: [
                { to: '/hotels', label: 'Lista Hotela', icon: Compass },
                { to: '/package-search', label: 'Paket Aranžmani', icon: Sparkles },
                { to: '/flight-search', label: 'Avio Karte', icon: Compass },
                { to: '/shifts-generator', label: 'Generator Smena', icon: RefreshCw },
                { to: '/ors-test', label: 'ORS Engine', icon: Search },
            ]
        },
        { to: '/mail', icon: Mail, label: 'ClickToTravel Mail' },
        {
            to: '/suppliers', icon: Truck, label: 'Dobavljači',
            subItems: [
                { to: '/api-connections', label: 'API Connections', icon: SettingsIcon },
                { to: '/suppliers', label: 'Lista Dobavljača', icon: Users },
                { to: '/supplier-admin', label: 'Upravljanje Partnerima', icon: Building2 },
                { to: '/pricing-rules', label: 'Pricing Pravila', icon: DollarSign },
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
            to: '/reservations', icon: ClipboardList, label: t.reservations,
            subItems: [
                { to: '/reservations', label: 'Status Dashboard', icon: BarChart3 },
                { to: '/reservation-architect', label: 'Novi Dosije', icon: Plus },
                { to: '/destination-rep', label: 'Dest. Predstavnici', icon: Users },
                { to: '/deep-archive', label: 'Arhiva', icon: X },
            ]
        },
        {
            to: '/supplier-finance', icon: DollarSign, label: 'Plaćanja',
            subItems: [
                { to: '/supplier-finance', label: 'Isplate Dobavljačima', icon: DollarSign },
                { to: '/fx-service', label: 'Kursna Lista / NBS', icon: RefreshCw },
                { to: '/vcc-settings', label: 'VCC Postavke', icon: Compass },
            ]
        },
        { to: '/price-list-architect', icon: DollarSign, label: 'Pricing Architect' },
        {
            to: '/settings', icon: SettingsIcon, label: t.settings,
            subItems: [
                { to: '/settings', label: 'Globalne Postavke', icon: SettingsIcon },
                { to: '/activity-log', label: 'Dnevnik Aktivnosti', icon: ClipboardList },
                { to: '/katana', label: 'Katana Engine', icon: Sparkles },
            ]
        },
    ];

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

                {/* Staff items */}
                {isStaff && staffNavItems.map((item) => (
                    <div
                        key={item.to}
                        ref={(el) => { itemRefs.current[item.to] = el; }}
                        style={{ display: 'inline-block' }}
                        onMouseEnter={() => openSubmenu(item.to)}
                        onMouseLeave={scheduleClose}
                    >
                        <NavLink
                            to={item.to}
                            className={({ isActive }) => navItemClass(isActive)}
                        >
                            <item.icon size={18} /> {item.label}
                        </NavLink>
                    </div>
                ))}

                {/* B2B Subagent items */}
                {isB2BView && (
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <NavLink to="/smart-search" className={({ isActive }) => navItemClass(isActive)}>
                            <Sparkles size={18} /> Smart Search ✨
                        </NavLink>
                        <NavLink to="/reservations" className={({ isActive }) => navItemClass(isActive)}>
                            <ClipboardList size={18} /> Moje Rezervacije
                        </NavLink>
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
                        background: '#1e293b',
                        border: '1px solid rgba(255,255,255,0.12)',
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
