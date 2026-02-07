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
    Search
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { GeometricBrain } from '../icons/GeometricBrain';
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
                <div className="logo-container" style={{
                    background: 'transparent',
                    boxShadow: 'none',
                    width: isSidebarCollapsed ? '40px' : '150px',
                    height: isSidebarCollapsed ? '40px' : '120px',
                    margin: '0 auto',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                }}>
                    <img
                        src="/logo.jpg"
                        alt="Olympic Logo"
                        style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                            borderRadius: '8px'
                        }}
                    />
                </div>
                {/* Removed Olympic B2B text as requested */}
                <button className="collapse-toggle" onClick={toggleSidebar}>
                    {isSidebarCollapsed ? (
                        <ChevronRight size={16} />
                    ) : (
                        <div style={{ transform: 'rotate(180deg)' }}>
                            <ChevronRight size={16} />
                        </div>
                    )}
                </button>
            </div>

            <nav className="nav-section">
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
                            title="Olympic Mail"
                        >
                            <Mail size={20} /> {!isSidebarCollapsed && 'Olympic Mail'}
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
                            to="/subagent-admin"
                            className={({ isActive }) => navItemClass(isActive)}
                            title="Subagent Admin"
                        >
                            <Users size={20} /> {!isSidebarCollapsed && 'Subagent Admin'}
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
        </aside>
    );
};

export default Sidebar;
