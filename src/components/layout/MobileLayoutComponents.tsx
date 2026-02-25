import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Search, FileText, DollarSign } from 'lucide-react';
import { useAuthStore } from '../../stores';

export const MobileHeader: React.FC = () => {
    const { userName } = useAuthStore();
    return (
        <div className="mobile-header">
            <img src="/clicktotravel.png" alt="Logo" style={{ height: '32px' }} />
            <div className="user-profile" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, textAlign: 'right' }}>
                    {userName}
                </div>
                <div className="avatar" style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '10px',
                    background: 'var(--gradient-purple)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                }}></div>
            </div>
        </div>
    );
};

export const MobileBottomNav: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const navItems = [
        { id: 'home', icon: <LayoutDashboard size={20} />, path: '/', label: 'Početna' },
        { id: 'search', icon: <Search size={20} />, path: '/smart-search', label: 'Traži' },
        { id: 'reservations', icon: <FileText size={20} />, path: '/reservations', label: 'Buking' },
        { id: 'finance', icon: <DollarSign size={20} />, path: '/finance', label: 'Finansije' },
    ];

    return (
        <div className="mobile-bottom-nav">
            {navItems.map(item => (
                <button
                    key={item.id}
                    className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
                    onClick={() => navigate(item.path)}
                >
                    {item.icon}
                    <span>{item.label}</span>
                </button>
            ))}
        </div>
    );
};
