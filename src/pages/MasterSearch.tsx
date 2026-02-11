import React, { useState } from 'react';
import { ClickToTravelLogo } from '../components/icons/ClickToTravelLogo';
import { useNavigate } from 'react-router-dom';
import {
    Hotel,
    Plane,
    Bus,
    MapPin,
    Globe,
    Search,
    Settings,
    Filter,
    ChevronRight,
    Package,
    Sparkles,
    Plus,
    Users,
    Users2,
    Calendar as CalendarIcon,
    X,
    Compass,
    Briefcase,
    Banknote,
    Scale,
    Ship,
    Ticket,
    Zap
} from 'lucide-react';
import './MasterSearch.css';
import DynamicPackageBuilder from '../components/DynamicPackageBuilder';
import GlobalHubSearch from './GlobalHubSearch';
import FlightSearch from './FlightSearch';
import PackageSearch from './PackageSearch';
import Services from '../modules/production/Services';
import ProductionHub from '../modules/production/ProductionHub';


type SearchTab = 'accommodation' | 'flights' | 'packages' | 'services' | 'tours';

interface Supplier {
    id: string;
    name: string;
    type: 'api' | 'manual';
    category: SearchTab[];
    minLevel: number;
}

const SUPPLIERS: Supplier[] = [
    { id: 'tct', name: 'TCT (Hoteli)', type: 'api', category: ['accommodation'], minLevel: 1 },
    { id: 'opengreece', name: 'Open Greece', type: 'api', category: ['accommodation'], minLevel: 1 },
    { id: 'solvex', name: 'Solvex', type: 'api', category: ['accommodation'], minLevel: 1 },
    { id: 'ors', name: 'ORS (Multi-Operator)', type: 'api', category: ['accommodation'], minLevel: 1 },
    { id: 'amadeus', name: 'Amadeus (Letovi)', type: 'api', category: ['flights'], minLevel: 3 },
    { id: 'kiwi', name: 'Kiwi.com', type: 'api', category: ['flights'], minLevel: 1 },
    { id: 'manual-hotels', name: 'Ručni Unos - Hoteli', type: 'manual', category: ['accommodation'], minLevel: 1 },
    { id: 'manual-flights', name: 'Ručni Unos - Letovi', type: 'manual', category: ['flights'], minLevel: 1 },
    { id: 'manual-packages', name: 'Ručni Unos - Paketi', type: 'manual', category: ['packages'], minLevel: 1 },
    { id: 'manual-services', name: 'Ručni Unos - Usluge', type: 'manual', category: ['services'], minLevel: 1 },
    { id: 'manual-tours', name: 'Ručni Unos - Putovanja', type: 'manual', category: ['tours'], minLevel: 1 }
];

const MasterSearch: React.FC = () => {
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState('accommodation');
    const [advisorType, setAdvisorType] = useState('accommodation');
    const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>(['tct', 'opengreece', 'manual-hotels']);
    const [showSupplierSelector, setShowSupplierSelector] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const userLevel = 5; // TODO: Get from auth store

    const toggleSupplier = (supplierId: string) => {
        setSelectedSuppliers(prev => {
            if (prev.includes(supplierId)) {
                return prev.filter(s => s !== supplierId);
            } else {
                return [...prev, supplierId];
            }
        });
    };

    const selectAllSuppliers = () => {
        setSelectedSuppliers(SUPPLIERS.map(s => s.id));
    };

    const deselectAllSuppliers = () => {
        setSelectedSuppliers([]);
    };

    const getAvailableSuppliers = () => {
        return SUPPLIERS.filter(supplier => {
            // Check user level access
            return userLevel >= supplier.minLevel;
        });
    };

    const filteredSuppliers = getAvailableSuppliers().filter(supplier =>
        supplier.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const TABS = [
        { id: 'accommodation' as SearchTab, label: 'Savetnik (Smeštaj)', icon: <Hotel size={20} />, color: '#3b82f6' },
        { id: 'flights' as SearchTab, label: 'Letovi', icon: <Plane size={20} />, color: '#8b5cf6' },
        { id: 'packages' as SearchTab, label: 'Dinamički Paketi', icon: <Package size={20} />, color: '#10b981' },
        { id: 'services' as SearchTab, label: 'Dodatne Usluge', icon: <Ticket size={20} />, color: '#f59e0b' },
        { id: 'tours' as SearchTab, label: 'Grupna Putovanja', icon: <Globe size={20} />, color: '#ec4899' }
    ];

    const renderSectionContent = () => {
        switch (activeSection) {
            case 'accommodation':
                return (
                    <section className="res-section fade-in">
                        <div className="advisor-search-wrapper">
                            <div className="section-title" style={{ border: 'none', marginBottom: '10px' }}>
                                <h3 style={{ fontSize: '24px' }}>
                                    <Sparkles size={24} color="var(--accent)" /> Savetnik za Smeštaj
                                </h3>
                            </div>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '30px', marginTop: '-15px', fontSize: '13px' }}>
                                Unifikovana pretraga hotela, apartmana i vila širom sveta. <br />
                                <span style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <Sparkles size={10} /> AI Enhanced Hotel Selection
                                </span>
                            </p>

                            <div className="adv-search-form">
                                <div className="search-main-input">
                                    <label className="adv-label">
                                        <MapPin size={12} /> Destinacija, Hotel... ili specifičan zahtev
                                    </label>
                                    <input placeholder="Npr. Porodični hotel u Grčkoj pored plaže do 2000€ ili samo 'Kopaonik'..." />
                                </div>

                                <div className="search-row-secondary">
                                    <div>
                                        <label className="adv-label">Dolazak</label>
                                        <div className="date-input-box">dd/mm/yyyy</div>
                                    </div>
                                    <div>
                                        <label className="adv-label">Noćenja</label>
                                        <div className="date-input-box">7</div>
                                    </div>
                                    <div>
                                        <label className="adv-label">Povratak</label>
                                        <div className="date-input-box">dd/mm/yyyy</div>
                                    </div>
                                    <div>
                                        <label className="adv-label">Fleksibilnost</label>
                                        <div className="date-input-box" style={{ width: '120px' }}>+/- 3 dana</div>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'end' }}>
                                    <div className="pax-inputs">
                                        <div>
                                            <label className="adv-label">Sobe</label>
                                            <div className="pax-box">1</div>
                                        </div>
                                        <div>
                                            <label className="adv-label">Odrasli</label>
                                            <div className="pax-box">2</div>
                                        </div>
                                        <div>
                                            <label className="adv-label">Deca</label>
                                            <div className="pax-box" style={{ background: 'rgba(255,255,255,0.05)' }}>0</div>
                                        </div>
                                    </div>

                                    <button className="search-action-btn-prm" onClick={() => setShowSupplierSelector(true)}>
                                        <ClickToTravelLogo height={28} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Results list or GlobalHubSearch can be integrated here */}
                        <div className="embedded-module-container" style={{ marginTop: '40px' }}>
                            <GlobalHubSearch />
                        </div>
                    </section>
                );
            case 'flights':
                return (
                    <section className="res-section fade-in">
                        <div className="section-title">
                            <h3><Plane size={20} color="var(--accent)" /> Pretraga Letova</h3>
                        </div>
                        <div className="embedded-module-container">
                            <FlightSearch />
                        </div>
                    </section>
                );
            case 'transfers':
                return (
                    <section className="res-section fade-in">
                        <div className="section-title">
                            <h3><Bus size={20} color="var(--accent)" /> Transferi i Prevoz</h3>
                        </div>
                        <div className="search-placeholder-view">
                            <Bus size={48} className="placeholder-icon" />
                            <h3>Modul za Transfere</h3>
                            <p>Pretražite privatne i grupne transfere sa aerodroma do hotela.</p>
                        </div>
                    </section>
                );
            case 'packages':
                return (
                    <section className="res-section fade-in">
                        <div className="section-title">
                            <h3><Zap size={20} color="var(--accent)" /> Dinamički Paketi</h3>
                        </div>
                        <DynamicPackageBuilder
                            activeTabs={['accommodation', 'flights']}
                            selectedSuppliers={selectedSuppliers}
                            onComplete={(data) => console.log(data)}
                            onCancel={() => setActiveSection('accommodation')}
                        />
                    </section>
                );
            case 'services':
                return (
                    <section className="res-section fade-in">
                        <div className="section-title">
                            <h3><Ticket size={20} color="var(--accent)" /> Dodatne Usluge</h3>
                        </div>
                        <div className="embedded-module-container">
                            <Services onBack={() => setActiveSection('accommodation')} />
                        </div>
                    </section>
                );
            case 'tours':
                return (
                    <section className="res-section fade-in">
                        <div className="section-title">
                            <h3><Globe size={20} color="var(--accent)" /> Grupna Putovanja</h3>
                        </div>
                        <div className="embedded-module-container">
                            <ProductionHub
                                onBack={() => setActiveSection('accommodation')}
                                initialTab="trips"
                            />
                        </div>
                    </section>
                );
            default:
                return null;
        }
    };

    return (
        <div className="res-master-container fade-in">
            <div className="res-architect-modal">
                {/* --- HEADER --- */}
                <header className="res-header-v2">
                    <div className="header-left">
                        <div className="cis-badge">
                            <Sparkles size={14} />
                            <span>MASTER: <strong>HUB</strong></span>
                        </div>
                        <div className="horizontal-status-tags">
                            {['accommodation', 'flights', 'transfers', 'packages', 'services', 'tours'].map((s) => (
                                <button
                                    key={s}
                                    className={`status-item ${activeSection === s ? 'active' : ''}`}
                                    style={{
                                        '--status-color':
                                            s === 'accommodation' ? '#3b82f6' :
                                                s === 'flights' ? '#8b5cf6' :
                                                    s === 'transfers' ? '#10b981' :
                                                        s === 'packages' ? '#f59e0b' :
                                                            s === 'services' ? '#ec4899' : '#94a3b8'
                                    } as React.CSSProperties}
                                    onClick={() => setActiveSection(s)}
                                >
                                    {s === 'accommodation' ? 'Smeštaj' :
                                        s === 'flights' ? 'Letovi' :
                                            s === 'transfers' ? 'Transferi' :
                                                s === 'packages' ? 'Paketi' :
                                                    s === 'services' ? 'Usluge' : 'Putovanja'}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="header-center">
                        <h2>ARHITEKTA PRETRAGE</h2>
                    </div>
                    <div className="header-right">
                        <button className="action-icon-btn close" onClick={() => navigate('/')}>
                            <X size={20} />
                        </button>
                    </div>
                </header>

                <div className="res-body-layout">
                    {/* --- SIDE NAVIGATION --- */}
                    <aside className="res-sidebar-nav">
                        <button className={activeSection === 'accommodation' ? 'active' : ''} onClick={() => setActiveSection('accommodation')}>
                            <Compass size={18} /> Smeštaj
                        </button>
                        <button className={activeSection === 'flights' ? 'active' : ''} onClick={() => setActiveSection('flights')}>
                            <Briefcase size={18} /> Letovi
                        </button>
                        <button className={activeSection === 'transfers' ? 'active' : ''} onClick={() => setActiveSection('transfers')}>
                            <Users size={18} /> Transfer
                        </button>
                        <button className={activeSection === 'packages' ? 'active' : ''} onClick={() => setActiveSection('packages')}>
                            <Package size={18} /> Dinamika
                        </button>
                        <button className={activeSection === 'services' ? 'active' : ''} onClick={() => setActiveSection('services')}>
                            <Banknote size={18} /> Usluge
                        </button>
                        <button className={activeSection === 'tours' ? 'active' : ''} onClick={() => setActiveSection('tours')}>
                            <Globe size={18} /> Putovanja
                        </button>

                        <div className="sidebar-stats">
                            <div className="stat-line">
                                <span>Dobavljači:</span>
                                <strong>{selectedSuppliers.length} Aktivno</strong>
                            </div>
                            <button
                                className="supplier-toggle-btn"
                                onClick={() => setShowSupplierSelector(!showSupplierSelector)}
                                style={{
                                    width: '100%',
                                    marginTop: '12px',
                                    background: 'var(--accent)',
                                    color: 'white',
                                    border: 'none',
                                    padding: '8px',
                                    borderRadius: '8px',
                                    fontSize: '11px',
                                    fontWeight: '800',
                                    cursor: 'pointer'
                                }}
                            >
                                <Plus size={14} /> UPRAVLJAJ IZVORIMA
                            </button>
                        </div>
                    </aside>

                    {/* --- MAIN CONTENT --- */}
                    <main className="res-main-content">
                        {renderSectionContent()}
                    </main>

                    {/* Supplier Sidebar (Optional Overlay or Sidebar) */}
                    {showSupplierSelector && (
                        <aside className="search-supplier-sidebar">
                            <div className="sidebar-header">
                                <h3>Izvori Podataka</h3>
                                <button onClick={() => setShowSupplierSelector(false)}><X size={18} /></button>
                            </div>
                            <div className="supplier-search-box">
                                <Search size={14} />
                                <input
                                    placeholder="Traži dobavljače..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <div className="supplier-items-list">
                                {SUPPLIERS.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase())).map(supplier => (
                                    <label key={supplier.id} className="sidebar-supplier-item">
                                        <input
                                            type="checkbox"
                                            checked={selectedSuppliers.includes(supplier.id)}
                                            onChange={() => {
                                                if (selectedSuppliers.includes(supplier.id)) {
                                                    setSelectedSuppliers(selectedSuppliers.filter(id => id !== supplier.id));
                                                } else {
                                                    setSelectedSuppliers([...selectedSuppliers, supplier.id]);
                                                }
                                            }}
                                        />
                                        <span>{supplier.name}</span>
                                    </label>
                                ))}
                            </div>
                        </aside>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MasterSearch;
