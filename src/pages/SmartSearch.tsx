import React, { useState } from 'react';
import { useAuthStore } from '../stores';
import {
    Sparkles, Hotel, Plane, Package, Bus, Compass,
    MapPin, Calendar, Users, UtensilsCrossed, Star,
    Search, Bot, TrendingUp, Zap, Shield
} from 'lucide-react';
import './SmartSearch.css';

const SmartSearch: React.FC = () => {
    const { userLevel } = useAuthStore();
    const isSubagent = userLevel < 6;

    const [activeTab, setActiveTab] = useState<'hotel' | 'flight' | 'package' | 'transfer' | 'tour'>('hotel');
    const [destination, setDestination] = useState('');
    const [checkIn, setCheckIn] = useState('');
    const [checkOut, setCheckOut] = useState('');
    const [adults, setAdults] = useState(2);
    const [children, setChildren] = useState(0);
    const [mealPlan, setMealPlan] = useState('all-inclusive');

    const tabs = [
        { id: 'hotel' as const, label: 'Smeštaj', icon: Hotel },
        { id: 'flight' as const, label: 'Letovi', icon: Plane },
        { id: 'package' as const, label: 'Paketi', icon: Package },
        { id: 'transfer' as const, label: 'Transferi', icon: Bus },
        { id: 'tour' as const, label: 'Ture', icon: Compass },
    ];

    const popularDestinations = [
        { name: 'Grčka', flag: '🇬🇷', deals: 234 },
        { name: 'Egipat', flag: '🇪🇬', deals: 189 },
        { name: 'Turska', flag: '🇹🇷', deals: 156 },
        { name: 'Dubai', flag: '🇦🇪', deals: 98 },
    ];

    const quickFilters = [
        { label: 'Last Minute', icon: Zap, color: '#ef4444' },
        { label: 'Early Bird', icon: TrendingUp, color: '#10b981' },
        { label: '5★ Hoteli', icon: Star, color: '#fbbf24' },
    ];

    return (
        <div className="smart-search-container">
            {/* Header */}
            <header className="smart-search-header">
                <div className="header-brand">
                    <div className="logo-olympic">
                        <Shield size={32} className="logo-icon" />
                        <div className="logo-text">
                            <h1>OLYMPIC HUB</h1>
                            <p>Jedan klik, svi dobavljači</p>
                        </div>
                    </div>
                </div>
                {isSubagent && (
                    <div className="b2b-badge-smart">
                        <Shield size={14} />
                        <span>B2B PARTNER</span>
                    </div>
                )}
            </header>

            {/* Tab Navigation */}
            <div className="search-tabs">
                {tabs.map(tab => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(tab.id)}
                        >
                            <Icon size={20} />
                            <span>{tab.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Search Form */}
            <div className="search-form-smart">
                <div className="form-grid">
                    {/* Destination */}
                    <div className="form-field full-width">
                        <label>
                            <MapPin size={16} />
                            <span>Destinacija</span>
                        </label>
                        <input
                            type="text"
                            placeholder="Npr: Hurghada, Grčka, Rodos..."
                            value={destination}
                            onChange={(e) => setDestination(e.target.value)}
                            className="smart-input"
                        />
                    </div>

                    {/* Dates */}
                    <div className="form-field">
                        <label>
                            <Calendar size={16} />
                            <span>Check-in</span>
                        </label>
                        <input
                            type="date"
                            value={checkIn}
                            onChange={(e) => setCheckIn(e.target.value)}
                            className="smart-input"
                        />
                    </div>

                    <div className="form-field">
                        <label>
                            <Calendar size={16} />
                            <span>Check-out</span>
                        </label>
                        <input
                            type="date"
                            value={checkOut}
                            onChange={(e) => setCheckOut(e.target.value)}
                            className="smart-input"
                        />
                    </div>

                    {/* Guests */}
                    <div className="form-field">
                        <label>
                            <Users size={16} />
                            <span>Odrasli</span>
                        </label>
                        <div className="guest-selector">
                            <button onClick={() => setAdults(Math.max(1, adults - 1))}>−</button>
                            <span>{adults}</span>
                            <button onClick={() => setAdults(adults + 1)}>+</button>
                        </div>
                    </div>

                    <div className="form-field">
                        <label>
                            <Users size={16} />
                            <span>Deca</span>
                        </label>
                        <div className="guest-selector">
                            <button onClick={() => setChildren(Math.max(0, children - 1))}>−</button>
                            <span>{children}</span>
                            <button onClick={() => setChildren(children + 1)}>+</button>
                        </div>
                    </div>

                    {/* Meal Plan */}
                    <div className="form-field">
                        <label>
                            <UtensilsCrossed size={16} />
                            <span>Ishrana</span>
                        </label>
                        <select
                            value={mealPlan}
                            onChange={(e) => setMealPlan(e.target.value)}
                            className="smart-select"
                        >
                            <option value="all-inclusive">All Inclusive</option>
                            <option value="half-board">Polupansion</option>
                            <option value="breakfast">Doručak</option>
                            <option value="room-only">Samo Soba</option>
                        </select>
                    </div>
                </div>

                {/* Search Button */}
                <button className="search-btn-smart">
                    <Search size={20} />
                    <span>Pretraži Sve Dobavljače</span>
                </button>
            </div>

            {/* Quick Filters */}
            <div className="quick-filters">
                <h3>🔥 Brzi Filteri</h3>
                <div className="filter-chips">
                    {quickFilters.map((filter, idx) => {
                        const Icon = filter.icon;
                        return (
                            <button key={idx} className="filter-chip" style={{ borderColor: filter.color }}>
                                <Icon size={16} style={{ color: filter.color }} />
                                <span>{filter.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Popular Destinations */}
            <div className="popular-destinations">
                <h3>🌍 Popularne Destinacije</h3>
                <div className="destination-grid">
                    {popularDestinations.map((dest, idx) => (
                        <button key={idx} className="destination-card">
                            <span className="dest-flag">{dest.flag}</span>
                            <div className="dest-info">
                                <h4>{dest.name}</h4>
                                <p>{dest.deals} ponuda</p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* AI Assistant Button */}
            <button className="ai-assistant-btn">
                <Bot size={24} />
                <div className="ai-text">
                    <strong>Olympic Asistent</strong>
                    <span>Pomozi mi da pronađem...</span>
                </div>
                <Sparkles size={16} className="ai-sparkle" />
            </button>
        </div>
    );
};

export default SmartSearch;
