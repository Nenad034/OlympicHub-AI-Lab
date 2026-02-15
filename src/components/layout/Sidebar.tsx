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
    RefreshCcw
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { GeometricBrain } from '../icons/GeometricBrain';
import { ClickToTravelLogo } from '../icons/ClickToTravelLogo';
import { useThemeStore, useAppStore, useAuthStore } from '../../stores';
import { translations } from '../../translations';

const Sidebar: React.FC = () => {
    const { lang, isSidebarCollapsed, toggleSidebar } = useThemeStore();
    const { setChatOpen } = useAppStore();
    const { userLevel, impersonatedSubagent, setImpersonatedSubagent } = useAuthStore();
    const isB2BView = userLevel < 6 || !!impersonatedSubagent;
    const t = translations[lang];

    const navItemClass = (isActive: boolean) =>
        `nav-item ${isActive ? 'active' : ''}`;

    return (
        <aside className={`sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
            <div className="sidebar-header">
                {/* Logo wrapper now follows header flex/padding constraints */}
                <div className="sidebar-logo-container">
                    <ClickToTravelLogo height={isSidebarCollapsed ? 32 : 72} showText={!isSidebarCollapsed} />
                </div>
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
                        <NavLink
                            to="/"
                            className={({ isActive }) => navItemClass(isActive)}
                            title={t.dashboard}
                            end
                        >
                            <LayoutDashboard size={20} /> {!isSidebarCollapsed && t.dashboard}
                        </NavLink>
                        {/* <NavLink
                            to="/master-search"
                            className={({ isActive }) => navItemClass(isActive)}
                            title="Master Pretraga"
                        >
                            <Search size={20} /> {!isSidebarCollapsed && 'Master Pretraga'}
                        </NavLink> */}
                    </div>
                )}


                {/* Sectors Section - Only for Staff */}
                {userLevel >= 6 && !impersonatedSubagent && (
                    <div className="nav-group">
                        <h3 className="nav-label">{!isSidebarCollapsed && t.sectors}</h3>
                        <NavLink
                            to="/production"
                            className={({ isActive }) => navItemClass(isActive)}
                            title={t.production}
                        >
                            <Package size={20} /> {!isSidebarCollapsed && t.production}
                        </NavLink>
                        <NavLink
                            to="/mail"
                            className={({ isActive }) => navItemClass(isActive)}
                            title="ClickToTravel Mail"
                        >
                            <Mail size={20} /> {!isSidebarCollapsed && 'ClickToTravel Mail'}
                        </NavLink>
                        <NavLink
                            to="/suppliers"
                            className={({ isActive }) => navItemClass(isActive)}
                            title="Dobavljači"
                        >
                            <Truck size={20} /> {!isSidebarCollapsed && 'Dobavljači'}
                        </NavLink>
                        <NavLink
                            to="/customers"
                            className={({ isActive }) => navItemClass(isActive)}
                            title="Kupci"
                        >
                            <Users size={20} /> {!isSidebarCollapsed && 'Kupci'}
                        </NavLink>
                        <NavLink
                            to="/reservations"
                            className={({ isActive }) => navItemClass(isActive)}
                            title={t.reservations}
                        >
                            <ClipboardList size={20} /> {!isSidebarCollapsed && t.reservations}
                        </NavLink>
                        <NavLink
                            to="/supplier-finance"
                            className={({ isActive }) => navItemClass(isActive)}
                            title="Plaćanja"
                        >
                            <DollarSign size={20} /> {!isSidebarCollapsed && 'Plaćanja'}
                        </NavLink>
                        <NavLink
                            to="/subagent-admin"
                            className={({ isActive }) => navItemClass(isActive)}
                            title="Subagent Admin"
                        >
                            <Users size={20} /> {!isSidebarCollapsed && 'Subagent Admin'}
                        </NavLink>
                        <NavLink
                            to="/price-list-architect"
                            className={({ isActive }) => navItemClass(isActive)}
                            title="Pricing Architect"
                        >
                            <DollarSign size={20} /> {!isSidebarCollapsed && 'Pricing Architect'}
                        </NavLink>
                        <NavLink
                            to="/shifts-generator"
                            className={({ isActive }) => navItemClass(isActive)}
                            title="Generator Smena"
                        >
                            <RefreshCcw size={20} /> {!isSidebarCollapsed && 'Generator Smena'}
                        </NavLink>
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
