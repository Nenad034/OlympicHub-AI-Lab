import React, { useEffect } from 'react';
import {
    Search,
    Github,
    Globe,
    LayoutDashboard,
    Settings as SettingsIcon,
    Sun,
    Moon,
    Zap,
    Coffee,
    Sparkles,
    Power,
    Monitor
} from 'lucide-react';
import { useThemeStore, useAppStore, useAuthStore } from '../../stores';
import { translations } from '../../translations';

const TopBar: React.FC = () => {
    const {
        theme,
        cycleTheme,
        isPrism,
        togglePrism,
        lang,
        setLang,
        navMode,
        toggleNavMode,
        setLayoutMode
    } = useThemeStore();
    const { appStatus, setAppStatus, searchQuery, setSearchQuery } = useAppStore();
    const { userLevel, userName, logout } = useAuthStore();
    const t = translations[lang];

    useEffect(() => {
        fetch('/app-status.json')
            .then(res => res.json())
            .then(data => setAppStatus(data))
            .catch(err => console.error("Error fetching app status:", err));
    }, [setAppStatus]);

    const getThemeIcon = () => {
        switch (theme) {
            case 'navy': return <Moon size={18} color="var(--accent)" />;
            case 'light': return <Sun size={18} color="var(--accent)" />;
            default: return <Sun size={18} />;
        }
    };

    const getThemeLabel = () => {
        return theme === 'navy' ? 'Tamna' : 'Svetla';
    };

    return (
        <div className="top-bar">
            {/* Dashboard Application Search */}
            <div style={{ flex: '1', maxWidth: '400px', position: 'relative', marginRight: '24px' }}>
                <Search
                    size={16}
                    color="var(--accent)"
                    style={{
                        position: 'absolute',
                        left: '14px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        opacity: 0.7
                    }}
                />
                <input
                    type="text"
                    placeholder="Brza pretraga aplikacija..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '10px 16px 10px 42px',
                        borderRadius: '10px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-primary)',
                        fontSize: '13px',
                        fontWeight: '500',
                        outline: 'none',
                        transition: 'all 0.3s ease',
                        boxShadow: 'none'
                    }}
                />
                {searchQuery && (
                    <button
                        onClick={() => setSearchQuery('')}
                        style={{
                            position: 'absolute',
                            right: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            cursor: 'pointer',
                            opacity: 0.5,
                            border: 'none',
                            background: 'rgba(255,255,255,0.1)',
                            color: 'var(--text-primary)',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '10px'
                        }}
                    >
                        ESC
                    </button>
                )}
            </div>
            {/* Controls */}
            <div className="top-bar-controls">
                <button
                    onClick={toggleNavMode}
                    title="Promeni raspored menija"
                    className="btn-glass"
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid var(--border)',
                        padding: '8px 12px',
                        borderRadius: '10px',
                        color: 'var(--text-primary)',
                        cursor: 'pointer'
                    }}
                >
                    {navMode === 'sidebar' ? <LayoutDashboard size={18} /> : <SettingsIcon size={18} />}
                    <span style={{ fontSize: '12px', fontWeight: 600 }}>
                        {navMode === 'sidebar' ? 'Horizontalni' : 'Vertikalni'}
                    </span>
                </button>

                {/* Modern Layout Toggle - ISKLJUCENO PRIVREMENO
                <button
                    className="btn-glass"
                    onClick={() => setLayoutMode('modern')}
                    title="Switch to Modern VS Code Visual"
                    style={{ borderColor: 'var(--accent)', color: 'var(--accent)' }}
                >
                    <Monitor size={18} />
                    <span style={{ fontSize: '12px', fontWeight: 600 }}>Modern IDE</span>
                </button>
                */}

                {/* Language Toggle */}
                <div style={{
                    display: 'flex',
                    background: 'var(--glass-bg)',
                    padding: '4px',
                    borderRadius: '10px',
                    border: '1px solid var(--border)'
                }}>
                    <button
                        onClick={() => setLang('sr')}
                        style={{
                            padding: '6px 10px',
                            border: 'none',
                            background: lang === 'sr' ? 'var(--bg-card)' : 'transparent',
                            borderRadius: '6px',
                            color: lang === 'sr' ? 'var(--accent)' : 'var(--text-secondary)',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: 600
                        }}
                    >
                        SRB
                    </button>
                    <button
                        onClick={() => setLang('en')}
                        style={{
                            padding: '6px 10px',
                            border: 'none',
                            background: lang === 'en' ? 'var(--bg-card)' : 'transparent',
                            borderRadius: '6px',
                            color: lang === 'en' ? 'var(--accent)' : 'var(--text-secondary)',
                            cursor: 'pointer',
                            fontSize: '12px',
                            fontWeight: 600
                        }}
                    >
                        ENG
                    </button>
                </div>

                {/* Theme Toggle */}
                <button
                    onClick={cycleTheme}
                    style={{
                        background: 'var(--glass-bg)',
                        border: '1px solid var(--border)',
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                        padding: '10px',
                        borderRadius: '12px',
                        display: 'flex',
                        gap: '8px',
                        alignItems: 'center'
                    }}
                >
                    {getThemeIcon()}
                    <span style={{ fontSize: '11px', fontWeight: 600 }}>
                        {getThemeLabel()}
                    </span>
                </button>

                {/* Prism Toggle */}
                <button
                    onClick={togglePrism}
                    className={`btn-glass ${isPrism ? 'active' : ''}`}
                    style={{
                        padding: '10px',
                        borderRadius: '12px',
                        borderColor: isPrism ? '#bb9af7' : 'var(--border)',
                        boxShadow: isPrism ? '0 0 15px rgba(187, 154, 247, 0.3)' : 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                    title="Sarena slova (Prism Mode)"
                >
                    <Sparkles size={18} color={isPrism ? '#bb9af7' : 'var(--text-secondary)'} />
                </button>

                {/* User Profile */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div className="user-profile">
                        <div className="avatar"></div>
                        <div style={{ fontSize: '13px', fontWeight: '600' }}>
                            {userName} (Lvl {userLevel})
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        title="Logout"
                        style={{
                            background: 'rgba(239, 68, 68, 0.1)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            color: '#ef4444',
                            padding: '8px',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            display: 'flex'
                        }}
                    >
                        <Power size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TopBar;
