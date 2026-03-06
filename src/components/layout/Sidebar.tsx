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
    TrendingUp
} from 'lucide-react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { ClickToTravelLogo } from '../icons/ClickToTravelLogo';
import { useThemeStore, useAppStore, useAuthStore } from '../../stores';
import { translations } from '../../translations';

const Sidebar: React.FC = () => {
    const { lang, isSidebarCollapsed, toggleSidebar } = useThemeStore();
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
        <aside className={`sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
            <div className="sidebar-header">
                <Link to="/" className="sidebar-logo-container" style={{ display: 'block', textDecoration: 'none' }}>
                    <ClickToTravelLogo height={isSidebarCollapsed ? 56 : 288} showText={!isSidebarCollapsed} iconOnly={isSidebarCollapsed} />
                </Link>
            </div>

            <button className="collapse-toggle" onClick={toggleSidebar}>
                <ChevronRight size={16} style={{ transform: isSidebarCollapsed ? 'none' : 'rotate(180deg)', transition: '0.2s' }} />
            </button>

            <nav className="nav-section" style={{ marginTop: '32px' }}>
                {/* Main Section */}
                {(userLevel >= 3 || (userLevel >= 6 && !impersonatedSubagent)) && (
                    <div className="nav-group">
                        <h3 className="nav-label">{!isSidebarCollapsed && 'Main'}</h3>
                        <NavGroupItem to="/" icon={LayoutDashboard} label={!isSidebarCollapsed && t.dashboard} title={t.dashboard} />

                        <NavGroupItem
                            to="/reservations"
                            icon={ClipboardList}
                            label={!isSidebarCollapsed && t.reservations}
                            title={t.reservations}
                            subItems={[
                                { to: '/reservations', label: 'Status Dashboard', icon: BarChart3 },
                                { to: '/reservation-architect', label: 'Novi Dosije', icon: Plus },
                                { to: '/destination-rep', label: 'Dest. Predstavnici', icon: Users },
                                { to: '/deep-archive', label: 'Arhiva', icon: X }
                            ]}
                        />

                        {userLevel >= 6 && !impersonatedSubagent && (
                            <NavGroupItem
                                to="/financial-hub"
                                icon={PieChart}
                                label={!isSidebarCollapsed && 'Financial Intelligence'}
                                title="Financial Intelligence"
                                subItems={[
                                    { to: '/financial-hub', label: 'FIL Dashboard', icon: LayoutDashboard },
                                    { to: '/financial-hub?tab=payments', label: 'Isplate Dobavljačima', icon: DollarSign },
                                    { to: '/fx-service', label: 'Kursna Lista / NBS', icon: RefreshCw },
                                    { to: '/financial-hub?tab=payments', label: 'VCC Postavke', icon: Compass }
                                ]}
                            />
                        )}
                        <NavGroupItem
                            to="/operational-reports"
                            icon={Activity}
                            label={!isSidebarCollapsed && 'Operativni Izveštaji'}
                            title="Operativni Izveštaji"
                            subItems={[
                                { to: '/operational-reports?tab=inventory', label: 'Inventory Orchestrator', icon: Calendar },
                                { to: '/operational-reports?tab=stats', label: 'PAX & Statistika', icon: BarChart3 },
                                { to: '/operational-reports?tab=analytics', label: 'Dynamic Analytics', icon: TrendingUp },
                                { to: '/operational-reports?tab=rooming', label: 'Rooming Lista', icon: Users }
                            ]}
                        />
                    </div>
                )}

                {/* Sectors Section */}
                {userLevel >= 6 && !impersonatedSubagent && (
                    <div className="nav-group">
                        <h3 className="nav-label">{!isSidebarCollapsed && t.sectors}</h3>

                        <NavGroupItem
                            to="/production"
                            icon={Package}
                            label={!isSidebarCollapsed && t.production}
                            title={t.production}
                            subItems={[
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
                            ]}
                        />

                        <NavGroupItem
                            to="/suppliers"
                            icon={Truck}
                            label={!isSidebarCollapsed && 'Dobavljači'}
                            title="Dobavljači"
                            subItems={[
                                { to: '/api-connections', label: 'API Connections', icon: SettingsIcon },
                                { to: '/suppliers', label: 'Lista Dobavljača', icon: Users },
                                { to: '/supplier-admin', label: 'Upravljanje Partnerima', icon: Building2 },
                                { to: '/pricing-intelligence', label: 'Pricing Pravila', icon: DollarSign }
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
                            to="/modules"
                            icon={LayoutGrid}
                            label={!isSidebarCollapsed && 'Moduli'}
                            title="Moduli"
                            subItems={[
                                { to: '/modules', label: 'Svi Moduli', icon: LayoutGrid },
                                { to: '/b2b-promo-manager', label: 'B2B Promo Manager', icon: Sparkles },
                                { to: '/katana', label: 'Katana Engine', icon: Cpu },
                                { to: '/', label: 'Glavni Dashboard', icon: LayoutDashboard },
                            ]}
                        />
                    </div>
                )}

                {/* B2B Sections for Partners */}
                {isB2BView && (
                    <div className="nav-group b2b-nav-group">
                        <h3 className="nav-label">{!isSidebarCollapsed && 'B2B Partner'}</h3>
                        <NavLink to="/smart-search" className={({ isActive }) => navItemClass(isActive)}>
                            <Sparkles size={20} /> {!isSidebarCollapsed && 'Smart Search ✨'}
                        </NavLink>
                        <NavLink to="/my-reservations" className={({ isActive }) => navItemClass(isActive)}>
                            <ClipboardList size={20} /> {!isSidebarCollapsed && 'Moje Rezervacije'}
                        </NavLink>
                    </div>
                )}

                {/* System Section at bottom */}
                {userLevel >= 6 && !impersonatedSubagent && (
                    <div className="nav-group" style={{ marginTop: 'auto', paddingBottom: '20px' }}>
                        <h3 className="nav-label">{!isSidebarCollapsed && t.system}</h3>
                        <NavGroupItem
                            to="/settings"
                            icon={SettingsIcon}
                            label={!isSidebarCollapsed && t.settings}
                            title={t.settings}
                            subItems={[
                                { to: '/b2b-promo-manager', label: 'B2B Promo Manager', icon: Sparkles },
                                { to: '/settings', label: 'Globalne Postavke', icon: SettingsIcon },
                                { to: '/activity-log', label: 'Dnevnik Aktivnosti', icon: ClipboardList },
                                { to: '/katana', label: 'Katana Engine', icon: Sparkles }
                            ]}
                        />

                        <div style={{ padding: '0 8px', marginTop: '12px' }}>
                            <NavLink
                                to="/mail"
                                style={({ isActive }) => ({
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '12px',
                                    textDecoration: 'none',
                                    borderRadius: '14px',
                                    background: isActive
                                        ? 'linear-gradient(135deg, #FFD700 0%, #DAA520 100%)'
                                        : 'rgba(255, 215, 0, 0.1)',
                                    color: isActive ? '#000' : '#FFD700',
                                    border: '1px solid rgba(255,215,0,0.3)',
                                    boxShadow: isActive ? '0 8px 20px rgba(218, 165, 32, 0.4)' : 'none',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                                })}
                            >
                                <Mail size={22} style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }} />
                                {!isSidebarCollapsed && (
                                    <span style={{ fontWeight: 800, fontSize: '13px', letterSpacing: '0.5px' }}>
                                        TCT MAIL ✨
                                    </span>
                                )}
                            </NavLink>
                        </div>
                    </div>
                )}
            </nav>
        </aside>
    );
};

export default Sidebar;
