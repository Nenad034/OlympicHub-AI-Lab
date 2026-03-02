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
    Brain,
    Sparkles,
    ClipboardList,
    Search,
    DollarSign,
    Plus,
    BarChart3,
    X,
    Building2,
    RefreshCw,
    ShieldCheck,
    PieChart
} from 'lucide-react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { GeometricBrain } from '../icons/GeometricBrain';
import { ClickToTravelLogo } from '../icons/ClickToTravelLogo';
import { useThemeStore, useAppStore, useAuthStore } from '../../stores';
import { translations } from '../../translations';

const Sidebar: React.FC = () => {
    const { lang, isSidebarCollapsed, toggleSidebar } = useThemeStore();
    const { setChatOpen } = useAppStore();
    const { userLevel, impersonatedSubagent, setImpersonatedSubagent } = useAuthStore();
    const location = useLocation();
    const [expandedItem, setExpandedItem] = React.useState<string | null>(null);

    const isB2BView = userLevel < 6 || !!impersonatedSubagent;
    const t = translations[lang];

    const navItemClass = (isActive: boolean) =>
        `nav-item ${isActive ? 'active' : ''}`;

    const NavGroupItem = ({ to, icon: Icon, label, subItems, title }: {
        to: string,
        icon: any,
        label: React.ReactNode,
        subItems?: { to: string, label: string, icon?: any }[],
        title?: string
    }) => {
        const isExpanded = expandedItem === to;
        const isActive = location.pathname.startsWith(to) && to !== '/';

        return (
            <div className={`nav-item-wrapper ${isExpanded ? 'expanded' : ''}`}>
                <div
                    className={`nav-item ${isActive ? 'active' : ''}`}
                    onClick={() => {
                        if (subItems && !isSidebarCollapsed) {
                            setExpandedItem(isExpanded ? null : to);
                        }
                    }}
                    title={title}
                >
                    <NavLink
                        to={subItems ? '#' : to}
                        style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none', color: 'inherit', width: '100%' }}
                        onClick={(e) => { if (subItems) e.preventDefault(); }}
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
        <aside className={`sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
            <div className="sidebar-header">
                {/* Logo wrapper now follows header flex/padding constraints */}
                <Link to="/" className="sidebar-logo-container" style={{ display: 'block', textDecoration: 'none' }}>
                    <ClickToTravelLogo height={isSidebarCollapsed ? 56 : 288} showText={!isSidebarCollapsed} iconOnly={isSidebarCollapsed} />
                </Link>
            </div>

            <button className="collapse-toggle" onClick={toggleSidebar}>
                {isSidebarCollapsed ? (
                    <ChevronRight size={16} />
                ) : (
                    <div style={{ transform: 'rotate(180deg)' }}>
                        <ChevronRight size={16} />
                    </div>
                )}
            </button>

            <nav className="nav-section" style={{ marginTop: '32px' }}>
                {/* Main Section - Only for Staff */}
                {userLevel >= 6 && !impersonatedSubagent && (
                    <div className="nav-group">
                        <h3 className="nav-label">{!isSidebarCollapsed && 'Main'}</h3>
                        <NavGroupItem to="/" icon={LayoutDashboard} label={!isSidebarCollapsed && t.dashboard} title={t.dashboard} />
                        <NavGroupItem to="/financial-hub" icon={PieChart} label={!isSidebarCollapsed && 'Financial Intelligence'} title="Financial Intelligence (FIL)" />
                    </div>
                )}


                {/* Sectors Section - Only for Staff */}
                {userLevel >= 6 && !impersonatedSubagent && (
                    <div className="nav-group">
                        <h3 className="nav-label">{!isSidebarCollapsed && t.sectors}</h3>

                        <NavGroupItem
                            to="/production"
                            icon={Package}
                            label={!isSidebarCollapsed && t.production}
                            title={t.production}
                            subItems={[
                                { to: '/hotels', label: 'Lista Hotela', icon: Compass },
                                { to: '/package-search', label: 'Paket Aranžmani', icon: Sparkles },
                                { to: '/flight-search', label: 'Avio Karte', icon: Compass }
                            ]}
                        />

                        <NavGroupItem to="/mail" icon={Mail} label={!isSidebarCollapsed && 'ClickToTravel Mail'} title="ClickToTravel Mail" />

                        <NavGroupItem
                            to="/suppliers"
                            icon={Truck}
                            label={!isSidebarCollapsed && 'Dobavljači'}
                            title="Dobavljači"
                            subItems={[
                                { to: '/api-connections', label: 'API Connections', icon: SettingsIcon },
                                { to: '/suppliers', label: 'Lista Dobavljača', icon: Users },
                                { to: '/pricing-rules', label: 'Pricing Pravila', icon: DollarSign }
                            ]}
                        />

                        <NavGroupItem
                            to="/customers"
                            icon={Users}
                            label={!isSidebarCollapsed && 'Kupci'}
                            title="Kupci"
                            subItems={[
                                { to: '/customers', label: 'B2C Baza Kupaca', icon: Users },
                                { to: '/subagent-admin', label: 'B2B Subagenti', icon: Users }
                            ]}
                        />

                        <NavGroupItem
                            to="/reservations"
                            icon={ClipboardList}
                            label={!isSidebarCollapsed && t.reservations}
                            title={t.reservations}
                            subItems={[
                                { to: '/reservations', label: 'Status Dashboard', icon: BarChart3 },
                                { to: '/reservation-architect', label: 'Novi Dosije', icon: Plus },
                                { to: '/deep-archive', label: 'Arhiva', icon: X }
                            ]}
                        />

                        <NavGroupItem
                            to="/supplier-finance"
                            icon={DollarSign}
                            label={!isSidebarCollapsed && 'Plaćanja'}
                            title="Plaćanja"
                            subItems={[
                                { to: '/supplier-finance', label: 'Isplate Dobavljačima', icon: DollarSign },
                                { to: '/fx-service', label: 'Kursna Lista / NBS', icon: RefreshCw },
                                { to: '/vcc-settings', label: 'VCC Postavke', icon: Compass }
                            ]}
                        />

                        <NavGroupItem
                            to="/price-list-architect"
                            icon={DollarSign}
                            label={!isSidebarCollapsed && 'Pricing Architect'}
                            title="Pricing Architect"
                        />

                        <NavGroupItem
                            to="/shifts-generator"
                            icon={RefreshCw}
                            label={!isSidebarCollapsed && 'Generator Smena'}
                            title="Generator Smena"
                        />
                    </div>
                )}

                {/* B2B Partners Section - Only for Subagents or Impersonation */}
                {isB2BView && (
                    <div className="nav-group b2b-nav-group" style={{
                        background: 'rgba(255, 255, 255, 0.05)',
                        borderRadius: '12px',
                        padding: '12px 8px',
                        border: '1px solid var(--border)'
                    }}>
                        <h3 className="nav-label">
                            {!isSidebarCollapsed && (impersonatedSubagent ? `🤝 ${impersonatedSubagent.companyName}` : '🤝 B2B PARTNER')}
                        </h3>
                        <NavLink
                            to="/smart-search"
                            className={({ isActive }) => navItemClass(isActive)}
                            title="Smart Search (New)"
                        >
                            <Sparkles size={20} /> {!isSidebarCollapsed && (
                                <span style={{ fontWeight: 700 }}>Smart Search ✨</span>
                            )}
                        </NavLink>
                        <NavLink
                            to="/my-reservations"
                            className={({ isActive }) => navItemClass(isActive)}
                            title="My Reservations"
                        >
                            <ClipboardList size={20} /> {!isSidebarCollapsed && (
                                <span style={{ fontWeight: 700 }}>Moje Rezervacije</span>
                            )}
                        </NavLink>
                        <NavLink
                            to="/b2b-portal?tab=settings"
                            className={({ isActive }) => navItemClass(isActive)}
                            title="AI Podešavanja"
                        >
                            <SettingsIcon size={20} /> {!isSidebarCollapsed && (
                                <span style={{ fontWeight: 700 }}>AI Podešavanja</span>
                            )}
                        </NavLink>
                    </div>
                )}



                {/* System Section - Only for Staff */}
                {userLevel >= 6 && !impersonatedSubagent && (
                    <div className="nav-group" style={{ marginTop: 'auto', paddingBottom: '10px' }}>
                        <h3 className="nav-label">{!isSidebarCollapsed && t.system}</h3>
                        <NavLink
                            to="/settings"
                            className={({ isActive }) => navItemClass(isActive)}
                            title={t.settings}
                        >
                            <SettingsIcon size={20} /> {!isSidebarCollapsed && t.settings}
                        </NavLink>
                    </div>
                )}
                {/* Exit B2B View Button for Impersonating Admins */}
                {impersonatedSubagent && userLevel >= 6 && (
                    <div className="nav-group" style={{ marginTop: 'auto', paddingBottom: '10px' }}>
                        <button
                            className="nav-item"
                            onClick={() => setImpersonatedSubagent(undefined)}
                            style={{
                                color: '#f87171',
                                background: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.2)',
                                cursor: 'pointer',
                                width: '100%',
                                textAlign: 'left'
                            }}
                        >
                            <SettingsIcon size={20} /> {!isSidebarCollapsed && 'Zatvori B2B Prikaz'}
                        </button>
                    </div>
                )}
            </nav>
        </aside >
    );
};

export default Sidebar;
