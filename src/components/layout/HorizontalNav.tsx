import React from 'react';
import {
    LayoutDashboard,
    Package,
    Truck,
    Users,
    Settings as SettingsIcon,
    Search,
    Mail,
    Compass,
    Brain,
    ClipboardList,
    Sparkles,
    X
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useThemeStore, useAppStore, useAuthStore } from '../../stores';
import { translations } from '../../translations';
import './HorizontalNav.css';

const HorizontalNav: React.FC = () => {
    const { lang } = useThemeStore();
    const { searchQuery, setSearchQuery } = useAppStore();
    const { userLevel, impersonatedSubagent } = useAuthStore();
    const t = translations[lang];

    const navItemClass = (isActive: boolean) =>
        `h-nav-item ${isActive ? 'active' : ''}`;

    const isStaff = userLevel >= 6 && !impersonatedSubagent;
    const isB2BView = userLevel < 6 || !!impersonatedSubagent;

    return (
        <div className="horizontal-nav">
            <div
                className="logo-container sm"
                style={{ background: 'transparent', boxShadow: 'none', width: '48px', height: '48px' }}
            >
                <img
                    src="/logo.jpg"
                    alt="Logo"
                    style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: '4px' }}
                />
            </div>

            <div className="nav-horizontal-items">
                {/* B2B Sections Label for Subagents */}
                {isB2BView && !isStaff && (
                    <div className="h-nav-label">NAVIGACIJA:</div>
                )}

                {/* Staff-only items */}
                {isStaff && (
                    <>
                        <NavLink to="/" className={({ isActive }) => navItemClass(isActive)} end>
                            <LayoutDashboard size={18} /> {t.dashboard}
                        </NavLink>
                        <NavLink to="/master-search" className={({ isActive }) => navItemClass(isActive)}>
                            <Search size={18} /> Master Pretraga
                        </NavLink>
                        <NavLink to="/production" className={({ isActive }) => navItemClass(isActive)}>
                            <Package size={18} /> {t.production}
                        </NavLink>
                        <NavLink to="/mail" className={({ isActive }) => navItemClass(isActive)}>
                            <Mail size={18} /> Olympic Mail
                        </NavLink>
                        <NavLink to="/total-trip" className={({ isActive }) => navItemClass(isActive)}>
                            <Compass size={18} /> Total Trip
                        </NavLink>
                        <NavLink to="/suppliers" className={({ isActive }) => navItemClass(isActive)}>
                            <Truck size={18} /> Dobavljači
                        </NavLink>
                        <NavLink to="/customers" className={({ isActive }) => navItemClass(isActive)}>
                            <Users size={18} /> Kupci
                        </NavLink>
                        <NavLink to="/reservations" className={({ isActive }) => navItemClass(isActive)}>
                            <ClipboardList size={18} /> {t.reservations}
                        </NavLink>
                        <NavLink to="/subagent-admin" className={({ isActive }) => navItemClass(isActive)}>
                            <Users size={18} /> Subagent Admin
                        </NavLink>
                        <NavLink to="/orchestrator" className={({ isActive }) => navItemClass(isActive)}>
                            <Brain size={18} /> Master Orchestrator
                        </NavLink>
                        <NavLink to="/settings" className={({ isActive }) => navItemClass(isActive)}>
                            <SettingsIcon size={18} /> {t.settings}
                        </NavLink>
                    </>
                )}

                {/* B2B Partners Section - Only for Subagents or Impersonation */}
                {isB2BView && (
                    <>
                        <div className="h-nav-group-b2b" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <NavLink
                                to="/smart-search"
                                className={({ isActive }) => navItemClass(isActive)}
                            >
                                <Sparkles size={18} /> Smart Search ✨
                            </NavLink>
                            <NavLink
                                to="/reservations"
                                className={({ isActive }) => navItemClass(isActive)}
                            >
                                <ClipboardList size={18} /> Moje Rezervacije
                            </NavLink>
                        </div>
                    </>
                )}
            </div>

            {/* B2B Status & Search Area */}
            <div className="h-nav-right-zone" style={{ display: 'flex', alignItems: 'center', gap: '20px', marginLeft: 'auto' }}>
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

                <div className="h-nav-search-wrapper">
                    <Search size={18} className="h-nav-search-icon" />
                    <input
                        type="text"
                        placeholder={t.searchPlaceholder}
                        className="search-input"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>
        </div>
    );
};

export default HorizontalNav;
