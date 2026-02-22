import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useThemeStore, useAuthStore } from '../stores';
import { useQueryState } from '../hooks/useQueryState';
import SmartSearch from './SmartSearch';
import ReservationsDashboard from './ReservationsDashboard';
import {
    Search,
    FileText,
    LogOut,
    User,
    Building2,
    ShieldCheck,
    Globe,
    Sun,
    Moon,
    Compass,
    LayoutDashboard,
    Settings
} from 'lucide-react';
import useTheme from '../hooks/useTheme';
import B2BSettings from './B2BSettings';
import './B2BPortal.css';

const B2BPortal: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const subagentId = searchParams.get('subagentId');
    const { impersonatedSubagent, setImpersonatedSubagent } = useAuthStore();

    const { theme, cycleTheme, navMode, toggleNavMode } = useThemeStore();
    const [activeTab, setActiveTab] = useQueryState<'search' | 'reservations' | 'settings'>('tab', 'search');

    // If no impersonation and no subagentId in URL, redirect or show error
    useEffect(() => {
        if (!impersonatedSubagent && !subagentId) {
            // In a real app, we might redirect to login or subagent selection
            console.error('No subagent context found');
        }
    }, [impersonatedSubagent, subagentId]);

    const handleExitPortal = () => {
        setImpersonatedSubagent(undefined);
        navigate('/subagent-admin');
    };

    const getThemeIcon = () => {
        if (theme === 'light') return <Sun size={18} color="var(--accent)" />;
        return <Moon size={18} color="var(--accent)" />;
    };

    return (
        <div className={`b2b-portal-root ${navMode === 'horizontal' ? 'nav-horizontal' : 'nav-sidebar'}`}>
            {/* Minimalist Sidebar for B2B - Only in Sidebar Mode */}
            {navMode === 'sidebar' && (
                <aside className="b2b-sidebar">
                    <div className="b2b-sidebar-header">
                        <div className="b2b-logo">
                            <Globe size={24} className="logo-icon" />
                            <span>B2B PORTAL</span>
                        </div>
                        {impersonatedSubagent && (
                            <div className="b2b-agent-card">
                                <div className="agent-avatar">
                                    <Building2 size={16} />
                                </div>
                                <div className="agent-info">
                                    <div className="agent-name">{impersonatedSubagent.companyName}</div>
                                    <div className="agent-label">Partner ID: {impersonatedSubagent.id}</div>
                                </div>
                            </div>
                        )}
                    </div>

                    <nav className="b2b-nav">
                        <button
                            className={`b2b-nav-item ${activeTab === 'search' ? 'active' : ''}`}
                            onClick={() => setActiveTab('search')}
                        >
                            <Search size={20} />
                            <span>Smart Search</span>
                        </button>
                        <button
                            className={`b2b-nav-item ${activeTab === 'reservations' ? 'active' : ''}`}
                            onClick={() => setActiveTab('reservations')}
                        >
                            <FileText size={20} />
                            <span>Moje rezervacije</span>
                        </button>
                        <button
                            className={`b2b-nav-item ${activeTab === 'settings' ? 'active' : ''}`}
                            onClick={() => setActiveTab('settings')}
                        >
                            <Settings size={20} />
                            <span>Podešavanja</span>
                        </button>
                    </nav>

                    <div className="b2b-sidebar-footer">
                        <button className="exit-portal-btn" onClick={handleExitPortal}>
                            <LogOut size={18} />
                            <span>Zatvori B2B</span>
                        </button>
                    </div>
                </aside>
            )}

            {/* Main Content Area */}
            <main className="b2b-main-content">
                <header className="b2b-header">
                    <div className="header-left">
                        {navMode === 'horizontal' && (
                            <div className="b2b-logo horizontal-logo">
                                <Globe size={24} className="logo-icon" />
                                <span>B2B PORTAL</span>
                            </div>
                        )}

                        {navMode === 'horizontal' && (
                            <nav className="b2b-header-nav">
                                <button
                                    className={`b2b-nav-link ${activeTab === 'search' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('search')}
                                >
                                    <Search size={18} /> Smart Search
                                </button>
                                <button
                                    className={`b2b-nav-link ${activeTab === 'reservations' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('reservations')}
                                >
                                    <FileText size={18} /> Rezervacije
                                </button>
                                <button
                                    className={`b2b-nav-link ${activeTab === 'settings' ? 'active' : ''}`}
                                    onClick={() => setActiveTab('settings')}
                                >
                                    <Settings size={18} /> Podešavanja
                                </button>
                            </nav>
                        )}

                        {navMode === 'sidebar' && (
                            <div className="header-breadcrumb">
                                {activeTab === 'search' ? 'Nova Pretraga' : activeTab === 'reservations' ? 'Pregled Rezervacija' : 'Podešavanja Naloga'}
                            </div>
                        )}
                    </div>

                    <div className="header-right">
                        {navMode === 'horizontal' && impersonatedSubagent && (
                            <div className="b2b-agent-pill">
                                <Building2 size={14} />
                                <span>{impersonatedSubagent.companyName}</span>
                            </div>
                        )}

                        <div className="user-badge">
                            <ShieldCheck size={14} />
                            <span>B2B MODE</span>
                        </div>

                        {/* Layout Toggle Button */}
                        <button
                            className="theme-toggle-btn"
                            onClick={toggleNavMode}
                            title={navMode === 'sidebar' ? 'Horizontalni meni' : 'Vertikalni meni'}
                        >
                            {navMode === 'sidebar' ? <LayoutDashboard size={18} /> : <Compass size={18} />}
                        </button>

                        <button className="theme-toggle-btn" onClick={cycleTheme} title="Promeni temu">
                            {getThemeIcon()}
                        </button>

                        {navMode === 'horizontal' && (
                            <button className="theme-toggle-btn exit-btn-header" onClick={handleExitPortal} title="Izlaz iz portala">
                                <LogOut size={18} />
                            </button>
                        )}

                        <div className="user-profile">
                            <User size={18} />
                        </div>
                    </div>
                </header>

                <div className="b2b-page-container">
                    {activeTab === 'search' ? (
                        <SmartSearch />
                    ) : activeTab === 'reservations' ? (
                        <ReservationsDashboard />
                    ) : (
                        <B2BSettings />
                    )}
                </div>
            </main>
        </div>
    );
};

export default B2BPortal;
