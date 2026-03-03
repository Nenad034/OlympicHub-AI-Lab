import React from 'react';
import {
    LayoutDashboard, Users, CreditCard,
    FileText, Zap, Settings, History, Shield, Mail, MessageSquare
} from 'lucide-react';
import { motion } from 'framer-motion';

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
        { id: 'notes', icon: <FileText size={20} />, label: 'NAPOMENE' },
        { id: 'legal', icon: <Zap size={20} />, label: 'GARANCIJE' },
        { id: 'rep', icon: <Shield size={20} />, label: 'PREDSTAVNIK' },
        { id: 'communication', icon: <MessageSquare size={20} />, label: 'KOM. CENTAR' },
        { id: 'logs', icon: <History size={20} />, label: 'LOGOVANJE' },
        { id: 'settings', icon: <Settings size={20} />, label: 'PODEŠAVANJA' }
    ];

    return (
        <aside className="mini-sidebar-v2 glass">
            {navItems.map((item) => (
                <div key={item.id} className="nav-item-container">
                    <button
                        className={`nav-item ${activeSection === item.id ? 'active' : ''}`}
                        onClick={() => onSectionChange(item.id)}
                    >
                        <div className="icon-wrapper">
                            {item.icon}
                            {activeSection === item.id && (
                                <motion.div
                                    layoutId="nav-glow"
                                    className="nav-icon-glow"
                                />
                            )}
                        </div>
                        {activeSection === item.id && (
                            <motion.div
                                layoutId="active-nav-glow"
                                className="nav-glow"
                            />
                        )}
                    </button>
                    <span className="nav-label">{item.label}</span>
                </div>
            ))}

            <style>{`
                .mini-sidebar-v2 {
                    width: 70px;
                    height: fit-content;
                    padding: 15px 0;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 12px;
                    border-radius: 20px;
                    position: sticky;
                    top: 130px;
                    z-index: 1000;
                }
                .nav-item-container {
                    position: relative;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .nav-item {
                    width: 50px;
                    height: 50px;
                    border-radius: 14px;
                    border: none;
                    background: transparent;
                    color: var(--fil-text-dim);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.3s;
                    position: relative;
                }
                .nav-item:hover {
                    background: rgba(255,255,255,0.05);
                    color: var(--fil-text);
                }
                .nav-item.active {
                    color: white;
                    background: var(--fil-accent);
                }
                .nav-label {
                    position: absolute;
                    left: 100%;
                    margin-left: 15px;
                    background: var(--fil-bg-card);
                    color: white;
                    padding: 6px 12px;
                    border-radius: 8px;
                    font-size: 10px;
                    font-weight: 800;
                    white-space: nowrap;
                    opacity: 0;
                    pointer-events: none;
                    transform: translateX(-10px);
                    transition: all 0.3s;
                    box-shadow: 0 4px 15px rgba(0,0,0,0.3);
                    border: 1px solid var(--fil-border);
                    z-index: 1100;
                }
                .nav-item-container:hover .nav-label {
                    opacity: 1;
                    transform: translateX(0);
                }
                .nav-glow {
                    position: absolute;
                    inset: 0;
                    border-radius: 14px;
                    box-shadow: 0 0 20px var(--fil-accent-glow);
                    z-index: -1;
                }
                .icon-wrapper {
                    position: relative;
                    z-index: 1;
                }
            `}</style>
        </aside>
    );
};
