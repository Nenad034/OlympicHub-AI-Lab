import React, { useEffect, useState } from 'react';
import {
    GitBranch,
    AlertCircle,
    Bell,
    Check,
    X,
    Zap,
    Cloud,
    Wifi,
    WifiOff,
    RefreshCw,
    Settings,
    Layout,
    Menu,
    Monitor
} from 'lucide-react';
import { useThemeStore, useAppStore, useAuthStore } from '../../stores';
import { useVSCodeStore } from '../../stores/vscodeStore';

export const StatusBar: React.FC = () => {
    const { theme, cycleTheme, lang, setLang, setLayoutMode } = useThemeStore();
    const { appStatus } = useAppStore();
    const { userLevel, userName } = useAuthStore();
    const { togglePanel, isPanelVisible, toggleMobileMenu } = useVSCodeStore();
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [time, setTime] = useState(new Date());

    // Theme display names
    const themeNames: Record<string, string> = {
        'dark': '🌙 Dark',
        'dark-rainbow': '🌈 Dark Rainbow',
        'navy': '🌊 Navy',
        'cyberpunk': '💜 Cyberpunk',
        'light': '☀️ Light',
        'light-rainbow': '🦄 Light Rainbow',
        'cream': '🍦 Cream',
        'forest': '🌲 Forest',
    };

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        const interval = setInterval(() => setTime(new Date()), 1000);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            clearInterval(interval);
        };
    }, []);

    return (
        <div className="vscode-status-bar">
            {/* Left side */}
            <div className="status-bar-left">
                {/* Mobile Menu Trigger */}
                <div
                    className="status-item clickable mobile-menu-trigger"
                    onClick={toggleMobileMenu}
                >
                    <Menu size={14} />
                </div>

                {/* Git Branch */}
                <div className="status-item clickable" title="Source Control">
                    <GitBranch size={14} />
                    <span>main</span>
                    {appStatus.gitPushed ? (
                        <Check size={12} className="status-success" />
                    ) : (
                        <RefreshCw size={12} className="status-sync" />
                    )}
                </div>

                {/* Sync Status */}
                <div className="status-item" title="Synchronization Status">
                    <Cloud size={14} />
                    <span>{appStatus.vercelLive ? 'Synced' : 'Sync...'}</span>
                </div>

                {/* Errors/Warnings */}
                <div className="status-item clickable" title="Problems" onClick={togglePanel}>
                    <AlertCircle size={14} />
                    <span>0</span>
                    <X size={12} />
                    <span>3</span>
                </div>
            </div>

            {/* Right side */}
            <div className="status-bar-right">
                {/* Connection Status */}
                <div className={`status-item ${isOnline ? '' : 'error'}`} title={isOnline ? 'Online' : 'Offline'}>
                    {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
                </div>

                {/* Language */}
                <div
                    className="status-item clickable"
                    title="Change Language"
                    onClick={() => setLang(lang === 'sr' ? 'en' : 'sr')}
                >
                    <span>{lang.toUpperCase()}</span>
                </div>

                {/* Theme */}
                <div
                    className="status-item clickable"
                    title="Change Theme (Click to cycle)"
                    onClick={cycleTheme}
                >
                    <Zap size={14} />
                    <span>{themeNames[theme] || theme}</span>
                </div>

                {/* Panel Toggle */}
                <div
                    className="status-item clickable"
                    title={isPanelVisible ? "Hide Panel" : "Show Panel"}
                    onClick={togglePanel}
                >
                    <Layout size={14} />
                </div>

                {/* Layout Mode Toggle */}
                <div
                    className="status-item clickable"
                    title="Switch to Classic Visual"
                    onClick={() => setLayoutMode('classic')}
                >
                    <Monitor size={14} />
                    <span>Classic Mode</span>
                </div>

                {/* User Level */}
                <div className="status-item" title={`User Level: ${userLevel}`}>
                    <span className="user-level-badge">L{userLevel}</span>
                </div>

                {/* User */}
                <div className="status-item" title="Current User">
                    <span>{userName || 'Guest'}</span>
                </div>

                {/* Time */}
                <div className="status-item" title="Current Time">
                    <span>{time.toLocaleTimeString('sr-RS', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>

                {/* Notifications */}
                <div className="status-item clickable" title="Notifications">
                    <Bell size={14} />
                </div>

                {/* Settings */}
                <div className="status-item clickable" title="Settings">
                    <Settings size={14} />
                </div>
            </div>
        </div>
    );
};

export default StatusBar;
