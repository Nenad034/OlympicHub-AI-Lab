import React from 'react';
import {
    LayoutDashboard, Users, CreditCard,
    FileText, Zap, Settings, History, Shield, Mail, MessageSquare, Folders
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface MiniSidebarProps {
    activeSection: string;
    onSectionChange: (section: string) => void;
    isSubagent?: boolean;
}

export const MiniSidebar: React.FC<MiniSidebarProps> = ({
    activeSection,
    onSectionChange,
    isSubagent = false
}) => {
    const navItems = [
        { id: 'summary', icon: <LayoutDashboard size={20} />, label: 'REZIME' },
        { id: 'passengers', icon: <Users size={20} />, label: 'PUTNICI' },
        { id: 'finance', icon: <CreditCard size={20} />, label: 'FINANSIJE' },
        { id: 'documents', icon: <Folders size={20} />, label: 'DOKUMENTI' },
        { id: 'notes', icon: <FileText size={20} />, label: 'NAPOMENE' },
        { id: 'legal', icon: <Zap size={20} />, label: 'GARANCIJE' },
        { id: 'rep', icon: <Shield size={20} />, label: 'PREDSTAVNIK' },
        { id: 'communication', icon: <MessageSquare size={20} />, label: 'KOM. CENTAR' },
        { id: 'logs', icon: <History size={20} />, label: 'LOGOVANJE' },
        { id: 'settings', icon: <Settings size={20} />, label: 'PODEŠAVANJA' }
    ];

    return (
        <aside className="v3-mini-sidebar v3-glass-panel">
            <div className="nav-stack">
                {navItems.map((item) => (
                    <div key={item.id} className="v3-nav-item-group">
                        <button
                            className={`v3-nav-btn ${activeSection === item.id ? 'active' : ''}`}
                            onClick={() => onSectionChange(item.id)}
                            title={item.label}
                        >
                            <div className="icon-slot">
                                {item.icon}
                            </div>
                            {activeSection === item.id && (
                                <motion.div
                                    layoutId="sidebar-active-pill"
                                    className="active-indicator"
                                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                />
                            )}
                        </button>
                        <span className="v3-nav-tooltip">{item.label}</span>
                    </div>
                ))}
            </div>

            <style>{`
                .v3-mini-sidebar {
                    width: 72px;
                    height: calc(100vh - 160px);
                    padding: 24px 0;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    position: sticky;
                    top: 130px;
                }
                .nav-stack {
                    display: flex; flex-direction: column; gap: 12px; width: 100%; align-items: center;
                }
                .v3-nav-item-group { position: relative; display: flex; align-items: center; justify-content: center; width: 100%; }
                
                .v3-nav-btn {
                    width: 48px; height: 48px; border-radius: 14px; border: none; background: transparent;
                    color: var(--v3-text-dim); display: flex; align-items: center; justify-content: center;
                    cursor: pointer; transition: 0.3s; position: relative; z-index: 2;
                }
                .v3-nav-btn:hover { color: var(--v3-accent); background: var(--v3-accent-dim); }
                .v3-nav-btn.active { color: #000; background: var(--v3-accent); box-shadow: 0 0 20px var(--v3-accent-glow); }

                .active-indicator {
                    position: absolute; inset: 0; border-radius: 14px; background: var(--v3-accent); z-index: -1;
                }

                .v3-nav-tooltip {
                    position: absolute; left: 80px; background: #000; color: #fff;
                    padding: 6px 12px; border-radius: 8px; font-size: 10px; font-weight: 900;
                    white-space: nowrap; opacity: 0; pointer-events: none; transform: translateX(-10px);
                    transition: 0.3s; border: 1px solid var(--v3-border); z-index: 100;
                }
                .v3-nav-item-group:hover .v3-nav-tooltip { opacity: 1; transform: translateX(0); }

                .icon-slot { position: relative; z-index: 3; display: flex; align-items: center; justify-content: center; }
            `}</style>
        </aside>
    );
};
