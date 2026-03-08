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
    Search,
    DollarSign,
    Plus,
    BarChart3,
    X,
    Building2,
    RefreshCw,
    PieChart,
    Calculator,
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
    Database,
    Power,
    Eye,
    EyeOff,
    Sun,
    Moon,
    Globe,
    LayoutTemplate
} from 'lucide-react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { ClickToTravelLogo } from '../icons/ClickToTravelLogo';
import { useThemeStore, useAppStore, useAuthStore } from '../../stores';
import { translations } from '../../translations';

const Sidebar: React.FC = () => {
    const { theme, cycleTheme, lang, isPrism, togglePrism, isSidebarCollapsed, toggleSidebar, toggleNavMode } = useThemeStore();
    const { userLevel, impersonatedSubagent, setImpersonatedSubagent, userName, logout } = useAuthStore();
    const location = useLocation();
    const [expandedItem, setExpandedItem] = React.useState<string | null>(null);

    const isB2BView = userLevel < 6 || !!impersonatedSubagent;
    const t = translations[lang];

    const navItemClass = (isActive: boolean) => `nav-item ${isActive ? 'active' : ''}`;

    const NavGroupItem = ({ to, icon: Icon, label, subItems, title, className }: {
        to: string,
        icon: any,
        label: React.ReactNode,
        subItems?: { to: string, label: string, icon?: any }[],
        title?: string,
        className?: string
    }) => {
        const isExpanded = expandedItem === to;
        const isActive = location.pathname.startsWith(to) && to !== '/';

        return (
            <div className={`nav-item-wrapper ${isExpanded ? 'expanded' : ''}`}>
                <div
                    className={`${navItemClass(isActive)} ${className || ''}`}
                    onClick={() => {
                        if (subItems && !isSidebarCollapsed) {
                            setExpandedItem(isExpanded ? null : to);
                        }
                    }}
                    title={title}
                >
                    <NavLink
                        to={to}
                        style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none', color: 'inherit', width: '100%' }}
                    >
                        <Icon size={20} /> {label}
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
                        {subItems.map((sub, idx) => (
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
            width: isSidebarCollapsed ? '80px' : '288px' // Narrowed from 320px (~10% reduce)
        }}>
            <div className="sidebar-header" style={{ padding: '20px', height: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Link to="/" className="sidebar-logo-container" style={{ display: 'block', textDecoration: 'none' }}>
                    <ClickToTravelLogo height={isSidebarCollapsed ? 48 : 220} showText={!isSidebarCollapsed} iconOnly={isSidebarCollapsed} />
                </Link>
            </div>

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
                        <NavGroupItem to="/" icon={LayoutDashboard} label={!isSidebarCollapsed && t.dashboard} title={t.dashboard} />

                        <NavGroupItem
                            to="/reservations"
                            icon={ClipboardList}
                            label={!isSidebarCollapsed && t.reservations}
                            title={t.reservations}
                            subItems={[
                                { to: '/reservations', label: 'Dashboard', icon: BarChart3 },
                                { to: '/reservation-architect', label: 'Novi Dosije', icon: Plus },
                                { to: '/destination-rep', label: 'Dest. Predstavnici', icon: Users },
                                { to: '/deep-archive', label: 'Arhiva', icon: X }
                            ]}
                        />

                        {userLevel >= 6 && !impersonatedSubagent && (
                            <NavGroupItem
                                to="/financial-hub"
                                icon={PieChart}
                                label={!isSidebarCollapsed && 'Finansije'}
                                title="Financial Intelligence"
                                subItems={[
                                    { to: '/financial-hub', label: 'FIL Dashboard', icon: LayoutDashboard },
                                    { to: '/financial-hub?tab=payments', label: 'Isplate', icon: DollarSign },
                                    { to: '/fx-service', label: 'NBS Lista', icon: RefreshCw },
                                    { to: '/financial-hub?tab=payments', label: 'VCC Postavke', icon: Compass }
                                ]}
                            />
                        )}
                        <NavGroupItem
                            to="/operational-reports"
                            icon={Activity}
                            label={!isSidebarCollapsed && 'Izveštaji'}
                            title="Operativni Izveštaji"
                            subItems={[
                                { to: '/operational-reports?tab=inventory', label: 'Inventory', icon: Calendar },
                                { to: '/operational-reports?tab=stats', label: 'PAX & Statistika', icon: BarChart3 },
                                { to: '/operational-reports?tab=analytics', label: 'Analytics', icon: TrendingUp },
                                { to: '/operational-reports?tab=rooming', label: 'Rooming', icon: Users }
                            ]}
                        />
                    </div>
                )}

                {/* Sectors Section */}
                {userLevel >= 6 && !impersonatedSubagent && (
                    <div className="nav-group">
                        <h3 className="nav-label" style={{ opacity: 0.6, fontSize: '10px', fontWeight: 900, letterSpacing: '2px', paddingLeft: '12px', marginBottom: '12px', marginTop: '20px' }}>
                            {!isSidebarCollapsed && 'POSLOVNI SEKTORI'}
                        </h3>

                        <NavGroupItem
                            to="/production"
                            icon={Package}
                            label={!isSidebarCollapsed && t.production}
                            title={t.production}
                            subItems={[
                                { to: '/smart-search', label: 'Smart Search ✨', icon: Sparkles },
                                { to: '/production?view=accommodations', label: 'Smeštaj', icon: Building2 },
                                { to: '/production?tab=trips', label: 'Grupna', icon: Users },
                                { to: '/production?tab=trips', label: 'Individualna', icon: User },
                                { to: '/production?view=transport', label: 'Prevoz', icon: Navigation },
                                { to: '/production?view=services', label: 'Usluge', icon: Waves },
                                { to: '/price-list-architect', label: 'Architect', icon: Calculator }
                            ]}
                        />

                        <NavGroupItem
                            to="/suppliers"
                            icon={Truck}
                            label={!isSidebarCollapsed && 'Snabdevanje'}
                            title="Snabdevanje"
                            subItems={[
                                { to: '/api-connections', label: 'API Connections', icon: SettingsIcon },
                                { to: '/suppliers', label: 'Lista', icon: Users },
                                { to: '/supplier-admin', label: 'Upravljanje', icon: Building2 },
                                { to: '/pricing-intelligence', label: 'Pricing', icon: DollarSign }
                            ]}
                        />

                        <NavGroupItem
                            to="/customers"
                            icon={Users}
                            label={!isSidebarCollapsed && 'Kupci'}
                            title="Kupci"
                            subItems={[
                                { to: '/customers', label: 'B2C Baza', icon: Users },
                                { to: '/subagent-admin', label: 'B2B Subagenti', icon: Users }
                            ]}
                        />
                        <NavGroupItem
                            to="/modules"
                            icon={LayoutGrid}
                            label={!isSidebarCollapsed && 'Moduli'}
                            title="Moduli"
                            subItems={[
                                { to: '/modules', label: 'Svi Moduli', icon: LayoutGrid },
                                { to: '/b2b-promo-manager', label: 'Promo Manager', icon: Sparkles },
                                { to: '/katana', label: 'Katana Engine', icon: Cpu },
                                { to: '/', label: 'Dashboard', icon: LayoutDashboard },
                            ]}
                        />

                        {/* Prime Mail Bookmark */}
                        <NavGroupItem
                            to="/mail"
                            icon={Mail}
                            label={!isSidebarCollapsed && 'Prime Mail'}
                            title="Prime Mail"
                            className="prime-mail-nav-item"
                        />

                        <NavGroupItem
                            to="/settings"
                            icon={SettingsIcon}
                            label={!isSidebarCollapsed && t.settings}
                            title={t.settings}
                            subItems={[
                                { to: '/settings', label: 'Globalne', icon: SettingsIcon },
                                { to: '/activity-log', label: 'Dnevnik', icon: ClipboardList }
                            ]}
                        />
                    </div>
                )}
            </nav>

            {/* Sidebar Footer - Optimized Width & Visibility */}
            <div className="sidebar-footer" style={{
                marginTop: 'auto',
                padding: '16px 0 40px 0', // Increased bottom padding to prevent cutoff
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

                        {/* Control Pill (Tray) */}
                        <div style={{
                            display: 'flex',
                            background: 'rgba(255,255,255,0.03)',
                            padding: '4px',
                            borderRadius: '16px',
                            border: '1px solid rgba(255,255,255,0.08)',
                            justifyContent: 'space-between',
                            width: '100%'
                        }}>
                            <div style={{ display: 'flex', flex: 1 }}>
                                <button
                                    onClick={toggleNavMode}
                                    title="Horizontalni Menu"
                                    style={{ flex: 1, background: 'transparent', border: 'none', padding: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)' }}
                                >
                                    <LayoutTemplate size={16} />
                                </button>
                                <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)', margin: '4px 0' }} />
                                <button
                                    onClick={() => useThemeStore.getState().setLang(lang === 'sr' ? 'en' : 'sr')}
                                    style={{ flex: 1.5, background: 'transparent', border: 'none', padding: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                >
                                    <span style={{ fontSize: '11px', fontWeight: 900, color: 'var(--text-primary)' }}>{lang.toUpperCase()}</span>
                                </button>
                                <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)', margin: '4px 0' }} />
                                <button
                                    onClick={cycleTheme}
                                    style={{ flex: 1, background: 'transparent', border: 'none', padding: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                >
                                    {theme === 'navy' ? <Moon size={15} color="var(--accent)" /> : <Sun size={15} color="#eab308" />}
                                </button>
                                <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)', margin: '4px 0' }} />
                                <button
                                    onClick={togglePrism}
                                    style={{ flex: 1, background: 'transparent', border: 'none', padding: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                >
                                    <Sparkles size={15} color={isPrism ? '#bb9af7' : 'var(--text-secondary)'} />
                                </button>
                            </div>
                        </div>

                        {/* User Pill - SAME WIDTH AS CONTROL TRAY */}
                        <div className="user-profile-pill" style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            background: 'rgba(255,255,255,0.05)',
                            padding: '6px 12px',
                            borderRadius: '16px',
                            border: '1px solid rgba(255,255,255,0.1)',
                            width: '100%', // Match width
                            boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                        }}>
                            <div className="avatar" style={{
                                width: '28px', height: '28px',
                                background: 'linear-gradient(135deg, var(--accent) 0%, #4f46e5 100%)',
                                borderRadius: '10px',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'white', fontWeight: 900, fontSize: '13px',
                                boxShadow: '0 2px 8px rgba(59, 130, 246, 0.4)',
                            }}>
                                {userName.charAt(0)}
                            </div>
                            <div className="user-info" style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '0.2px' }}>
                                    {userName}
                                </div>
                            </div>
                            <button
                                onClick={logout}
                                style={{
                                    background: 'transparent',
                                    border: 'none', color: '#ef4444',
                                    padding: '4px', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    opacity: 0.8
                                }}
                                title="Izlaz"
                            >
                                <Power size={14} />
                            </button>
                        </div>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                        <button onClick={toggleNavMode} style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                            <LayoutTemplate size={20} />
                        </button>
                        <div
                            className="avatar"
                            style={{
                                width: '38px', height: '38px',
                                background: 'var(--accent)', borderRadius: '12px',
                                cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                color: 'white', fontWeight: 900, fontSize: '15px'
                            }}
                            onClick={logout}
                        >
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
                    margin-bottom: 6px;
                }
                .prime-mail-nav-item:hover {
                    background: rgba(255, 215, 0, 0.1) !important;
                    border-color: rgba(255, 215, 0, 0.3) !important;
                }
                .prime-mail-nav-item svg {
                    color: #FFD700 !important;
                }
            `}</style>
        </aside>
    );
};

export default Sidebar;
