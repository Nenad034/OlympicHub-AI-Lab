import React from 'react';
import { 
    Search, Star, Zap, HelpCircle, XCircle, 
    RefreshCw, ShieldCheck, Plane, MousePointer2, Clock
} from 'lucide-react';
import { useSearchStore } from '../../stores/useSearchStore';
import type { AvailabilityStatus } from '../../types';

export const FilterSidebar: React.FC = () => {
    const { 
        filters, 
        updateFilter, 
        resetFilters, 
        activeTab,
        packageWizardStep
    } = useSearchStore();

    // Determine what to show
    const isStays = activeTab === 'hotel';
    const isFlights = activeTab === 'flight';
    const isPackages = activeTab === 'package';
    
    // In Package Wizard, filters change based on step
    const showHotelFilters = isStays || (isPackages && packageWizardStep === 3);
    const showFlightFilters = isFlights || (isPackages && packageWizardStep === 2);

    const STAR_OPTIONS = [
        { value: '5', label: '5★ - Hotel 5 zvezdica' },
        { value: '4', label: '4★ - Hotel 4 zvezdice' },
        { value: '3', label: '3★ - Hotel 3 zvezdice' },
        { value: '2', label: '2★ - Hotel 2 zvezdice' },
        { value: '0', label: 'Bez kategorizacije' },
    ];

    const MEAL_PLANS = [
        { value: 'RO', label: 'RO — Samo Smeštaj' },
        { value: 'BB', label: 'BB — Noćenje sa Doručkom' },
        { value: 'HB', label: 'HB — Polupansion' },
        { value: 'FB', label: 'FB — Pun Pansion' },
        { value: 'AI', label: 'AI — All Inclusive' },
        { value: 'AIP', label: 'AIP — All Inclusive Premium' },
        { value: 'UAI', label: 'UAI — Ultra All Inclusive' },
    ];

    const toggleStar = (star: string) => {
        const current = typeof filters.stars === 'string' ? [filters.stars] : (filters.stars || []);
        if (current.includes('all')) {
            updateFilter('stars', [star]);
        } else if (current.includes(star)) {
            const next = current.filter(s => s !== star);
            updateFilter('stars', next.length === 0 ? ['all'] : next);
        } else {
            updateFilter('stars', [...current, star]);
        }
    };

    const toggleMeal = (code: string) => {
        const current = filters.mealPlans || [];
        if (current.includes('all')) {
            updateFilter('mealPlans', [code]);
        } else if (current.includes(code)) {
            const next = current.filter(c => c !== code);
            updateFilter('mealPlans', next.length === 0 ? ['all'] : next);
        } else {
            updateFilter('mealPlans', [...current, code]);
        }
    };

    const toggleAvailability = (status: AvailabilityStatus) => {
        const current = filters.availability || [];
        if (current.includes(status)) {
            updateFilter('availability', current.filter(s => s !== status));
        } else {
            updateFilter('availability', [...current, status]);
        }
    };

    // Only show sidebar if we have something to filter
    if (!showHotelFilters && !showFlightFilters) return null;

    return (
        <aside className="v6-filter-sidebar-stack v6-fade-in-right">
            {/* Header Sticky */}
            <div className="v6-sidebar-dynamic-header">
                <div className="v6-header-content">
                    <Search size={18} />
                    <span>VAŠI FILTERI</span>
                </div>
            </div>

            <div className="v6-filter-card header-card">
                <div className="sidebar-header">
                    <h3>Opcije pretrage</h3>
                    <button className="reset-btn" onClick={resetFilters}>
                        <RefreshCw size={14} /> RESETUJ
                    </button>
                </div>
            </div>

            {/* FLIGHT FILTERS */}
            {showFlightFilters && (
                <>
                    <div className="v6-filter-card">
                        <div className="filter-group">
                            <label>Presedanja</label>
                            <div className="status-stack">
                                <button className="status-btn active">Direktan let</button>
                                <button className="status-btn">Max 1 presedanje</button>
                            </div>
                        </div>
                    </div>
                    <div className="v6-filter-card">
                        <div className="filter-group">
                            <label>Vreme polaska</label>
                            <div className="chip-stack">
                                <button className="filter-chip"><Clock size={12}/> Juto</button>
                                <button className="filter-chip"><Clock size={12}/> Popodne</button>
                                <button className="filter-chip"><Clock size={12}/> Veče</button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* HOTEL FILTERS */}
            {showHotelFilters && (
                <>
                    {/* Hotel Name Card */}
                    <div className="v6-filter-card">
                        <div className="filter-group">
                            <label>Ime hotela</label>
                            <div className="input-with-icon">
                                <Search size={16} />
                                <input 
                                    type="text" 
                                    placeholder="Upišite naziv..." 
                                    value={filters.hotelName || ''}
                                    onChange={(e) => updateFilter('hotelName', e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Categories (Stars) Card */}
                    <div className="v6-filter-card">
                        <div className="filter-group">
                            <label>Kategorija</label>
                            <div className="chip-stack">
                                {STAR_OPTIONS.map(opt => {
                                    const active = !filters.stars.includes('all') && filters.stars.includes(opt.value);
                                    return (
                                        <button 
                                            key={opt.value}
                                            className={`filter-chip ${active ? 'active' : ''}`}
                                            onClick={() => toggleStar(opt.value)}
                                        >
                                            {opt.value !== '0' && <Star size={12} fill={active ? "currentColor" : "transparent"} />}
                                            <span>{opt.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Meal Plans Card */}
                    <div className="v6-filter-card">
                        <div className="filter-group">
                            <label>Usluga</label>
                            <div className="chip-stack">
                                <button 
                                    className={`filter-chip ${filters.mealPlans.includes('all') ? 'active active-green' : ''}`}
                                    onClick={() => updateFilter('mealPlans', ['all'])}
                                >
                                    Sve Usluge
                                </button>
                                {MEAL_PLANS.map(mp => {
                                    const active = !filters.mealPlans.includes('all') && filters.mealPlans.includes(mp.value);
                                    return (
                                        <button 
                                            key={mp.value}
                                            className={`filter-chip ${active ? 'active active-green' : ''}`}
                                            onClick={() => toggleMeal(mp.value)}
                                        >
                                            {mp.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Availability Card */}
                    <div className="v6-filter-card">
                        <div className="filter-group">
                            <label>Dostupnost</label>
                            <div className="status-stack">
                                <button 
                                    className={`status-btn instant ${filters.availability?.includes('instant') ? 'active' : ''}`}
                                    onClick={() => toggleAvailability('instant')}
                                >
                                    <Zap size={14} /> <span>DOSTUPNO ODMAH</span>
                                </button>
                                <button 
                                    className={`status-btn request ${filters.availability?.includes('on-request') ? 'active' : ''}`}
                                    onClick={() => toggleAvailability('on-request')}
                                >
                                    <HelpCircle size={14} /> <span>NA UPIT</span>
                                </button>
                                <button 
                                    className={`status-btn stop ${filters.availability?.includes('sold-out') ? 'active' : ''}`}
                                    onClick={() => toggleAvailability('sold-out')}
                                >
                                    <XCircle size={14} /> <span>STOP SALE</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Refundable Card */}
                    <div className="v6-filter-card">
                        <div className="filter-group">
                            <button 
                                className={`toggle-btn ${filters.onlyRefundable ? 'active' : ''}`}
                                onClick={() => updateFilter('onlyRefundable', !filters.onlyRefundable)}
                            >
                                <ShieldCheck size={16} /> <span>Samo Refundabilno</span>
                                <div className="toggle-indicator"></div>
                            </button>
                        </div>
                    </div>
                </>
            )}
        </aside>
    );
};

export default FilterSidebar;
