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
    const { userLevel } = useAuthStore();
    const t = translations[lang];

    const navItemClass = (isActive: boolean) =>
        `nav-item ${isActive ? 'active' : ''}`;

    return (
        <aside className={`sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
            <div className="sidebar-header">
                <div className="logo-container" style={{ background: 'transparent', boxShadow: 'none' }}>
                    <img
                        src="/logo.jpg"
                        alt="Olympic Logo"
                        style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '8px' }}
                    />
                </div>
                {!isSidebarCollapsed && <span className="brand-text" style={{ color: 'white' }}>Olympic B2B</span>}
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
                {userLevel >= 6 && (
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
                        <NavLink
                            to="/master-search"
                            className={({ isActive }) => navItemClass(isActive)}
                            title="Master Pretraga"
                        >
                            <Search size={20} /> {!isSidebarCollapsed && 'Master Pretraga'}
                        </NavLink>
                    </div>
                )}

                {/* AI Chat - Available for Everyone */}
                <div className="nav-group">
                    {userLevel >= 6 && <h3 className="nav-label">{!isSidebarCollapsed && 'AI'}</h3>}
                    <div
                        className="nav-item"
                        title="AI Chat"
                        onClick={() => setChatOpen(true)}
                        style={{ cursor: 'pointer' }}
                    >
                        <GeometricBrain size={30} color="#FFD700" /> {!isSidebarCollapsed && 'AI Chat'}
                    </div>
                </div>

                {/* Sectors Section - Only for Staff */}
                {userLevel >= 6 && (
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
                            to="/total-trip"
                            className={({ isActive }) => navItemClass(isActive)}
                            title="Total Trip"
                        >
                            <Compass size={20} /> {!isSidebarCollapsed && 'Total Trip'}
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
                            style={({ isActive }) => ({
                                borderLeft: isActive ? '4px solid #ff9800' : 'none',
                            })}
                        >
                            <Users size={20} color="#ff9800" /> {!isSidebarCollapsed && (
                                <span style={{ color: '#ff9800', fontWeight: 700 }}>Subagent Admin</span>
                            )}
                        </NavLink>
                    </div>
                )}

                {/* B2B Partners Section - Only for Subagents */}
                {userLevel < 6 && (
                    <div className="nav-group" style={{
                        background: 'rgba(255, 152, 0, 0.05)',
                        borderRadius: '12px',
                        padding: '12px 8px',
                        border: '1px solid rgba(255, 152, 0, 0.2)'
                    }}>
                        <h3 className="nav-label" style={{ color: '#ff9800', fontWeight: 800 }}>
                            {!isSidebarCollapsed && '🤝 B2B PARTNER'}
                        </h3>
                        <NavLink
                            to="/smart-search"
                            className={({ isActive }) => navItemClass(isActive)}
                            title="Smart Search (New)"
                            style={({ isActive }) => ({
                                borderLeft: isActive ? '4px solid #ff9800' : 'none',
                                background: isActive ? 'rgba(255, 152, 0, 0.15)' : 'transparent'
                            })}
                        >
                            <Sparkles size={20} color="#ff9800" /> {!isSidebarCollapsed && (
                                <span style={{ color: '#ff9800', fontWeight: 700 }}>Smart Search ✨</span>
                            )}
                        </NavLink>
                        <NavLink
                            to="/my-reservations"
                            className={({ isActive }) => navItemClass(isActive)}
                            title="My Reservations"
                            style={({ isActive }) => ({
                                borderLeft: isActive ? '4px solid #ff9800' : 'none',
                                background: isActive ? 'rgba(255, 152, 0, 0.15)' : 'transparent'
                            })}
                        >
                            <ClipboardList size={20} color="#ff9800" /> {!isSidebarCollapsed && (
                                <span style={{ color: '#ff9800', fontWeight: 700 }}>Moje Rezervacije</span>
                            )}
                        </NavLink>
                    </div>
                )}


                {/* Intelligence Section - Only for Staff */}
                {userLevel >= 6 && (
                    <div className="nav-group">
                        <h3 className="nav-label">{!isSidebarCollapsed && 'Intelligence'}</h3>
                        <NavLink
                            to="/soft-zone"
                            className={({ isActive }) => navItemClass(isActive)}
                            title="Vajckin Soft Zone"
                            style={({ isActive }) => ({
                                borderLeft: isActive ? '4px solid #3b82f6' : 'none',
                            })}
                        >
                            <Sparkles size={20} color="#3b82f6" /> {!isSidebarCollapsed && 'Meka Zona'}
                        </NavLink>
                    </div>
                )}

                {/* System Section - Only for Staff */}
                {userLevel >= 6 && (
                    <div className="nav-group" style={{ marginTop: 'auto', paddingBottom: '10px' }}>
                        <h3 className="nav-label">{!isSidebarCollapsed && t.system}</h3>
                        <NavLink
                            to="/orchestrator"
                            className={({ isActive }) => navItemClass(isActive)}
                            title="Master Orchestrator"
                        >
                            <Brain size={20} /> {!isSidebarCollapsed && 'Master Orchestrator'}
                        </NavLink>
                        <NavLink
                            to="/settings"
                            className={({ isActive }) => navItemClass(isActive)}
                            title={t.settings}
                        >
                            <SettingsIcon size={20} /> {!isSidebarCollapsed && t.settings}
                        </NavLink>
                    </div>
                )}
            </nav>
        </aside>
    );
};

export default Sidebar;
