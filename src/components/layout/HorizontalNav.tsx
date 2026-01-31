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
    Sparkles
} from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { useThemeStore, useAppStore, useAuthStore } from '../../stores';
import { translations } from '../../translations';

const HorizontalNav: React.FC = () => {
    const { lang } = useThemeStore();
    const { searchQuery, setSearchQuery } = useAppStore();
    const { userLevel } = useAuthStore();
    const t = translations[lang];

    const navItemClass = (isActive: boolean) =>
        `h-nav-item ${isActive ? 'active' : ''}`;

    const isStaff = userLevel >= 6;
    const isSubagent = userLevel < 6;

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
                {/* Dashboard - Always visible */}
                <NavLink
                    to="/"
                    className={({ isActive }) => navItemClass(isActive)}
                    end
                >
                    <LayoutDashboard size={18} /> {t.dashboard}
                </NavLink>

                {/* Staff-only items */}
                {isStaff && (
                    <>
                        <NavLink
                            to="/master-search"
                            className={({ isActive }) => navItemClass(isActive)}
                        >
                            <Search size={18} /> Master Pretraga
                        </NavLink>
                        <NavLink
                            to="/production"
                            className={({ isActive }) => navItemClass(isActive)}
                        >
                            <Package size={18} /> {t.production}
                        </NavLink>
                        <NavLink
                            to="/mail"
                            className={({ isActive }) => navItemClass(isActive)}
                        >
                            <Mail size={18} /> Olympic Mail
                        </NavLink>
                        <NavLink
                            to="/total-trip"
                            className={({ isActive }) => navItemClass(isActive)}
                        >
                            <Compass size={18} /> Total Trip
                        </NavLink>
                        <NavLink
                            to="/suppliers"
                            className={({ isActive }) => navItemClass(isActive)}
                        >
                            <Truck size={18} /> Dobavljači
                        </NavLink>
                        <NavLink
                            to="/customers"
                            className={({ isActive }) => navItemClass(isActive)}
                        >
                            <Users size={18} /> Kupci
                        </NavLink>
                        <NavLink
                            to="/reservations"
                            className={({ isActive }) => navItemClass(isActive)}
                        >
                            <ClipboardList size={18} /> {t.reservations}
                        </NavLink>
                        <NavLink
                            to="/subagent-admin"
                            className={({ isActive }) => navItemClass(isActive)}
                        >
                            <Users size={18} /> Subagent Admin
                        </NavLink>
                        <NavLink
                            to="/orchestrator"
                            className={({ isActive }) => navItemClass(isActive)}
                        >
                            <Brain size={18} /> Master Orchestrator
                        </NavLink>
                    </>
                )}

                {/* B2B Subagent-only items */}
                {isSubagent && (
                    <>
                        <NavLink
                            to="/smart-search"
                            className={({ isActive }) => navItemClass(isActive)}
                        >
                            <Sparkles size={18} /> Smart Search ✨
                        </NavLink>
                        <NavLink
                            to="/my-reservations"
                            className={({ isActive }) => navItemClass(isActive)}
                        >
                            <ClipboardList size={18} /> Moje Rezervacije
                        </NavLink>
                    </>
                )}

                {/* Settings - Always visible */}
                <NavLink
                    to="/settings"
                    className={({ isActive }) => navItemClass(isActive)}
                >
                    <SettingsIcon size={18} /> {t.settings}
                </NavLink>
            </div>

            {/* Search in Horizontal Nav */}
            <div className="h-nav-search-wrapper">
                <Search
                    size={20}
                    className="h-nav-search-icon"
                />
                <input
                    type="text"
                    placeholder={t.searchPlaceholder}
                    className="search-input"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
        </div>
    );
};

export default HorizontalNav;
