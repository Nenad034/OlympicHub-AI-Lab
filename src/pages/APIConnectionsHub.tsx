import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plug, Database, Globe, Plane, CheckCircle, XCircle,
    AlertTriangle, Settings, Activity, ArrowRight, Shield,
    LayoutGrid, List, Info, ExternalLink, CreditCard, Link, Ticket
} from 'lucide-react';
import RateLimitMonitor from '../components/RateLimitMonitor';
import AIWatchdogDashboard from '../components/watchdog/AIWatchdogDashboard';
import GeneralAIChat from '../components/GeneralAIChat';
import { aiMonitor } from '../services/aiMonitor';
import './APIConnectionsHub.css';

console.log('🚀 [API Hub] Module evaluating...');

interface APIConnection {
    id: string;
    name: string;
    provider: string;
    description: string;
    iconName: 'database' | 'globe' | 'plane' | 'credit-card' | 'link' | 'ticket';
    status: 'active' | 'inactive' | 'error' | 'testing';
    category: 'flights' | 'supplier' | 'systems' | 'payments' | 'mapping';
    color: string;
    testPath: string;
    features: string[];
    dataQualityScore: number; // 0-100 based on mapping and rich content
    avgLatency: number; // in ms
}

const APIConnectionsHub: React.FC = () => {
    const navigate = useNavigate();
    const [selectedTab, setSelectedTab] = useState<'overview' | 'monitoring' | 'watchdog'>('overview');
    const [isAiChatOpen, setIsAiChatOpen] = useState(false);
    const [healthStats, setHealthStats] = useState<any>(null);
    const [monitorStatus, setMonitorStatus] = useState<any>(null);
    const [testErrorCode, setTestErrorCode] = useState('');
    const [decodedError, setDecodedError] = useState<any>(null);

    // Dynamic Connections Data
    const connections = useMemo<APIConnection[]>(() => [
        {
            id: 'solvex',
            name: 'Solvex (Master-Interlook)',
            provider: 'B&A e-Travel SA',
            description: 'Bulgarian hotel inventory - Ski resorts, beach destinations, city hotels',
            iconName: 'database',
            status: 'active',
            category: 'supplier',
            color: '#e91e63',
            testPath: '/solvex-test',
            features: ['Hotel Search', 'Availability', 'Booking', 'Cancellation'],
            dataQualityScore: 85,
            avgLatency: 1200
        },
        {
            id: 'mtsglobe',
            name: 'MTS Globe / Axisdata',
            provider: 'MTS Globe Group',
            description: 'Leading DMC in Europe, Mediterranean and UAE - Global hotel supply via OTA XML',
            iconName: 'globe',
            status: 'testing',
            category: 'supplier',
            color: '#00bcd4',
            testPath: '/mtsglobe-test',
            features: ['OTA Standard', 'Global Inventory', 'Dynamic Availability', 'Room Mapping'],
            dataQualityScore: 98,
            avgLatency: 850
        },
        {
            id: 'opengreece',
            name: 'OpenGreece',
            provider: 'OpenGreece API',
            description: 'Greek hotel inventory - Islands, mainland, all-inclusive resorts',
            iconName: 'globe',
            status: 'active',
            category: 'supplier',
            color: '#43a047',
            testPath: '/opengreece-test',
            features: ['Hotel Search', 'Real-time Availability', 'Instant Booking'],
            dataQualityScore: 90,
            avgLatency: 450
        },
        {
            id: 'tct',
            name: 'TCT (Travel Compositor)',
            provider: 'TCT API',
            description: 'Multi-destination hotel aggregator - Worldwide coverage',
            iconName: 'database',
            status: 'active',
            category: 'supplier',
            color: '#fb8c00',
            testPath: '/tct-test',
            features: ['Global Search', 'Multi-currency', 'Dynamic Pricing'],
            dataQualityScore: 75,
            avgLatency: 2100
        },
        {
            id: 'ors',
            name: 'ORS (Online Reservation System)',
            provider: 'ORS Travel',
            description: 'Multi-operator platform - Hotels, packages, organized trips',
            iconName: 'globe',
            status: 'active',
            category: 'supplier',
            color: '#9c27b0',
            testPath: '/ors-test',
            features: ['Hotel Search', 'Package Deals', 'Organized Trips', 'Optional Bookings', 'GIATA IDs'],
            dataQualityScore: 92,
            avgLatency: 600
        },
        {
            id: 'mars',
            name: 'Mars API',
            provider: 'Neolab',
            description: 'Accommodation management system - Detailed content, pricing, amenities',
            iconName: 'database',
            status: 'testing',
            category: 'systems',
            color: '#dc2626',
            testPath: '/mars-test',
            features: ['Accommodation Details', 'Complex Pricing', 'Rich Amenities', 'GPS Coordinates', 'Image Gallery'],
            dataQualityScore: 95,
            avgLatency: 150
        },
        {
            id: 'amadeus',
            name: 'Amadeus Flights',
            provider: 'Amadeus GDS',
            description: 'Flight search and booking - Global airline inventory',
            iconName: 'plane',
            status: 'inactive',
            category: 'flights',
            color: '#667eea',
            testPath: '/amadeus-test',
            features: ['Flight Search', 'Multi-city', 'Fare Rules', 'Ticketing'],
            dataQualityScore: 60,
            avgLatency: 0
        },
        {
            id: 'filos',
            name: 'Filos (One Tourismo)',
            provider: 'Filos Travel / One Tourismo',
            description: 'Greek travel market specialist - Extensive hotel inventory, transfers and activities',
            iconName: 'globe',
            status: 'testing',
            category: 'supplier',
            color: '#0277bd',
            testPath: '/filos-test',
            features: ['B2B XML/JSON API', 'Greek Hotels', 'Transfers', 'Activities', 'Static Data Sync'],
            dataQualityScore: 88,
            avgLatency: 1800
        },
        {
            id: 'travelsoft-ndc',
            name: 'Travelsoft NDC',
            provider: 'Travelsoft (contacts@travelsoft.fr)',
            description: 'IATA NDC 19.2 gateway — direktan pristup avio-kompanijama, ancillary usluge, mapa sedišta i kompletno upravljanje rezervacijama',
            iconName: 'plane',
            status: 'testing',
            category: 'flights',
            color: '#f59e0b',
            testPath: '/travelsoft-test',
            features: ['NDC 19.2 Standard', 'AirShopping', 'Seat Map', 'Ancillary Services', 'OrderCreate / Ticketing', 'OrderCancel / Reshop'],
            dataQualityScore: 92,
            avgLatency: 0
        },
        {
            id: 'travelgate',
            name: 'Travelgate Hotel-X',
            provider: 'Travelgate Network',
            description: 'GraphQL hotel aggregator — pristup stotinama dobavljača u jednom zahtevu, Rich Content, dinamičko formiranje cena i upravljanje rezervacijama',
            iconName: 'globe',
            status: 'testing',
            category: 'supplier',
            color: '#6366f1',
            testPath: '/travelgate-test',
            features: ['GraphQL API', 'Multi-Supplier', 'Dynamic Availability', 'Rich Content', 'Cancel / Reshop', 'Booking Management'],
            dataQualityScore: 95,
            avgLatency: 0
        },
        {
            id: 'kyte',
            name: 'Kyte Flights',
            provider: 'Kyte API (Modern NDC)',
            description: 'Direct connect flight aggregator — moderni NDC API za direktnu prodaju avio karata, ancillary usluge i rich content',
            iconName: 'plane',
            status: 'active',
            category: 'flights',
            color: '#06b6d4',
            testPath: '/kyte-test',
            features: ['Direct NDC Content', 'Seat Selection', 'Baggage Booking', 'Ancillaries', 'Instant Issuance', 'Flight Tracking'],
            dataQualityScore: 94,
            avgLatency: 420
        },
        {
            id: 'giata',
            name: 'GIATA Multicodes & Drive',
            provider: 'GIATA GmbH',
            description: 'Mapiranje hotelskih kodova različitih dobavljača (Multicodes) i povlačenje statičkih podataka (Drive API) za CRM/ERP.',
            iconName: 'link',
            status: 'active',
            category: 'mapping',
            color: '#10b981',
            testPath: '/giata-test',
            features: ['Multicodes Matching', 'GIATA ID Sync', 'Drive Content API', 'Bearer Token Auth', 'REST Endpoints'],
            dataQualityScore: 99,
            avgLatency: 120
        },
        {
            id: 'worldpay',
            name: 'Worldpay (FIS)',
            provider: 'Worldpay',
            description: 'Global payment processing gateway, podrška za različite valute, tokenizacija i sigurne naplate.',
            iconName: 'credit-card',
            status: 'testing',
            category: 'payments',
            color: '#ef4444',
            testPath: '/worldpay-test',
            features: ['Secure Checkout', 'Multi-currency', 'Tokenization', 'Fraud Protection', 'Refund Management'],
            dataQualityScore: 98,
            avgLatency: 350
        },
        {
            id: 'travelsoftpay',
            name: 'TravelsoftPay VCC',
            provider: 'Travelsoft Group (partnerstvo sa Worldpay)',
            description: 'B2B virtuelne kartice za plaćanje dobavljačima — hoteli, avio, DMC. Svaka rezervacija dobija jedinstvenu VCC karticu sa tačnim iznosom i rokom važenja.',
            iconName: 'credit-card',
            status: 'inactive',
            category: 'payments',
            color: '#8b5cf6',
            testPath: '/worldpay-test',
            features: ['Virtual Card Issuing', 'Just-in-time VCC', 'MCC Controls', 'Multi-currency Payout', 'Auto Reconciliation', 'FX Management'],
            dataQualityScore: 0,
            avgLatency: 0
        },
        {
            id: 'hotelbeds',
            name: 'Hotelbeds APItude',
            provider: 'Hotelbeds Group',
            description: 'Vodeći B2B platforma za hotele, aktivnosti i transfere — globalni inventar sa 180.000+ hotela, aktivnosti i transfernih usluga.',
            iconName: 'globe',
            status: 'testing',
            category: 'supplier',
            color: '#10b981',
            testPath: '/hotelbeds-test',
            features: ['Hotel Booking API', 'Activities API', 'Transfers API', 'X-Signature Auth', 'CheckRates', 'Content API'],
            dataQualityScore: 96,
            avgLatency: 700
        },
        {
            id: 'viator',
            name: 'Viator Partner API',
            provider: 'Viator (Tripadvisor Group)',
            description: 'Najveća platforma za tours & experiences sa 300.000+ aktivnosti globalno. Affiliate i Merchant model — pretraga produkata, provera dostupnosti, direktno bookovanje i upravljanje rezervacijama.',
            iconName: 'ticket',
            status: 'testing',
            category: 'supplier',
            color: '#6366f1',
            testPath: '/viator-test',
            features: ['Tours & Experiences', 'Availability Check', 'Hold + Book Flow', 'Voucher Management', 'Cancellation API', 'Affiliate & Merchant'],
            dataQualityScore: 97,
            avgLatency: 450
        },
        {
            id: 'expedia',
            name: 'Expedia Group — Rapid API',
            provider: 'Expedia Group (EAN)',
            description: 'Vodeći globalni OTA platfor sa 700.000+ nekretnina. Rapid v3 API pokriva Shopping, Content, Booking i Geography servise sa EAN SHA-512 autentifikacijom.',
            iconName: 'globe',
            status: 'testing',
            category: 'supplier',
            color: '#0B6FBA',
            testPath: '/expedia-test',
            features: ['Shopping / Availability', 'Content API', 'Price Check', 'Booking (Itinerary)', 'Cancel / Modify', 'Geography API'],
            dataQualityScore: 98,
            avgLatency: 600
        },
        {
            id: 'travelport',
            name: 'Travelport+ (Galileo)',
            provider: 'Travelport GDS',
            description: 'Globalna travel platforma koja nudi integraciju letova, hotela i rent-a-car usluga. Moderni JSON v11 API sa OAuth 2.0 autentifikacijom za Air pretragu i PNR menadžment.',
            iconName: 'plane',
            status: 'testing',
            category: 'flights',
            color: '#00adef',
            testPath: '/travelport-test',
            features: ['JSON Air APIs v11', 'OAuth 2.0 Auth', 'AirSearch', 'Order Create', 'PNR Management', 'uAPI Support'],
            dataQualityScore: 95,
            avgLatency: 550
        }
    ], []);

    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [filterCategory, setFilterCategory] = useState<'all' | 'flights' | 'supplier' | 'systems' | 'payments' | 'mapping'>('all');

    // Filtered connections based on category
    const filteredConnections = useMemo(() => {
        if (filterCategory === 'all') return connections;
        return connections.filter(c => c.category === filterCategory);
    }, [connections, filterCategory]);

    const renderIcon = (name: string, size: number = 32) => {
        switch (name) {
            case 'database': return <Database size={size} />;
            case 'globe': return <Globe size={size} />;
            case 'plane': return <Plane size={size} />;
            case 'credit-card': return <CreditCard size={size} />;
            case 'link': return <Link size={size} />;
            case 'ticket': return <Ticket size={size} />;
            default: return <Plug size={size} />;
        }
    };

    // Refresh function for stats
    const refreshStats = () => {
        setHealthStats(aiMonitor.getHealthStats());
        setMonitorStatus(aiMonitor.getStatus());
    };

    // Auto-refresh stats every 5 seconds for the AI
    useEffect(() => {
        console.log('✅ [API Hub] Component mounted');
        refreshStats();
        const interval = setInterval(refreshStats, 5000);
        return () => {
            console.log('❌ [API Hub] Component unmounting');
            clearInterval(interval);
        };
    }, []);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'active': return <CheckCircle size={20} color="#10b981" />;
            case 'testing': return <AlertTriangle size={20} color="#f59e0b" />;
            case 'error': return <XCircle size={20} color="#ef4444" />;
            default: return <XCircle size={20} color="#64748b" />;
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'active': return 'Active';
            case 'testing': return 'Testing';
            case 'error': return 'Error';
            default: return 'Inactive';
        }
    };

    const getQualityColor = (score: number) => {
        if (score >= 90) return '#10b981';
        if (score >= 75) return '#f59e0b';
        return '#ef4444';
    };

    const handleDecodeTest = async () => {
        const { otaErrorDecoder } = await import('../services/api/otaErrorDecoder');
        const decoded = otaErrorDecoder.decode(testErrorCode);
        setDecodedError(decoded);
    };

    return (
        <div className="api-hub-container">
            {/* Header */}
            <div className="api-hub-header">
                <div className="header-content">
                    <div className="header-icon">
                        <Plug size={40} />
                    </div>
                    <div>
                        <h1>PARTNERI - DOBAVLJAČI</h1>
                        <p>Centralno upravljanje svim partnerskim konekcijama (OTA Standards Refined)</p>
                    </div>
                </div>
                <div className="header-stats">
                    <div className="stat-item">
                        <span className="stat-value">{connections.filter(c => c.status === 'active').length}</span>
                        <span className="stat-label">Active</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-value">
                            {Math.round(connections.reduce((acc, c) => acc + c.dataQualityScore, 0) / connections.length)}%
                        </span>
                        <span className="stat-label">Avg Quality</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-value">{connections.length}</span>
                        <span className="stat-label">Total</span>
                    </div>
                </div>
            </div>

            {/* Tabs & View Toggle */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <div className="api-hub-tabs" style={{ marginBottom: 0 }}>
                    <button
                        className={`tab-btn ${selectedTab === 'overview' ? 'active' : ''}`}
                        onClick={() => setSelectedTab('overview')}
                    >
                        <Database size={18} /> Connections
                    </button>
                    <button
                        className={`tab-btn ${selectedTab === 'monitoring' ? 'active' : ''}`}
                        onClick={() => setSelectedTab('monitoring')}
                    >
                        <Activity size={18} /> Rate Limiting
                    </button>
                    <button
                        className={`tab-btn ${selectedTab === 'watchdog' ? 'active' : ''}`}
                        onClick={() => setSelectedTab('watchdog')}
                    >
                        <Shield size={18} /> AI Watchdog & Diagnostics
                    </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    {selectedTab === 'overview' && (
                        <div className="filter-group">
                            {[
                                { id: 'all', label: 'Sve', icon: <Database size={14} /> },
                                { id: 'flights', label: 'Letovi', icon: <Plane size={14} /> },
                                { id: 'supplier', label: 'Dobavljači', icon: <Globe size={14} /> },
                                { id: 'systems', label: 'Sistemi', icon: <Settings size={14} /> },
                                { id: 'payments', label: 'Plaćanja', icon: <CreditCard size={14} /> },
                                { id: 'mapping', label: 'Mapping', icon: <Link size={14} /> },
                            ].map(cat => (
                                <button
                                    key={cat.id}
                                    className={`filter-btn ${filterCategory === cat.id ? 'active' : ''}`}
                                    onClick={() => setFilterCategory(cat.id as any)}
                                >
                                    {cat.icon}
                                    {cat.label}
                                </button>
                            ))}
                        </div>
                    )}

                    {selectedTab === 'overview' && (
                        <div className="view-mode-toggle">
                            <button
                                className={`toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
                                onClick={() => setViewMode('grid')}
                                title="Grid View"
                            >
                                <LayoutGrid size={18} />
                            </button>
                            <button
                                className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
                                onClick={() => setViewMode('list')}
                                title="List View"
                            >
                                <List size={18} />
                            </button>
                        </div>
                    )}
                </div>

            </div>


            {/* Content */}
            {selectedTab === 'overview' && (
                viewMode === 'grid' ? (
                    <div className="connections-grid">
                        {filteredConnections.map(conn => (

                            <div key={conn.id} className="connection-card">
                                <div className="card-header">
                                    <div className="icon-wrapper" style={{ background: `${conn.color}20`, color: conn.color }}>
                                        {renderIcon(conn.iconName)}
                                    </div>
                                    <div className="card-metrics">
                                        <div className="latency-badge" title="Avg Latency">
                                            <Activity size={12} />
                                            <span>{conn.avgLatency}ms</span>
                                        </div>
                                        <div className="status-badge">
                                            {getStatusIcon(conn.status)}
                                            <span>{getStatusText(conn.status)}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="card-body">
                                    <div className="title-row">
                                        <h3>{conn.name}</h3>
                                        <div className="quality-donut" style={{ borderColor: getQualityColor(conn.dataQualityScore) }}>
                                            {conn.dataQualityScore}%
                                        </div>
                                    </div>
                                    <p className="provider">{conn.provider}</p>
                                    <p className="description">{conn.description}</p>

                                    <div className="features-list">
                                        <h4>Unificirane Funkcije:</h4>
                                        <ul>
                                            {conn.features.map((feature, idx) => (
                                                <li key={idx}>
                                                    <CheckCircle size={14} color="#10b981" />
                                                    {feature}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>

                                <div className="card-footer">
                                    <button
                                        className="test-btn"
                                        onClick={() => navigate(conn.testPath)}
                                    >
                                        <Settings size={16} />
                                        Test & Configure
                                        <ArrowRight size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="connections-list">
                        <div className="list-header">
                            <div className="col-provider">Provider</div>
                            <div className="col-status">Status</div>
                            <div className="col-latency">Latency</div>
                            <div className="col-quality">Quality</div>
                            <div className="col-actions">Actions</div>
                        </div>
                        <div className="list-body">
                            {filteredConnections.map(conn => (
                                <div key={conn.id} className="connection-list-item">

                                    <div className="col-provider">
                                        <div className="list-icon" style={{ background: `${conn.color}20`, color: conn.color }}>
                                            {renderIcon(conn.iconName, 18)}
                                        </div>
                                        <div>
                                            <div className="list-item-name">{conn.name}</div>
                                            <div className="list-item-sub">{conn.provider}</div>
                                        </div>
                                    </div>
                                    <div className="col-status">
                                        <div className={`status-pill ${conn.status}`}>
                                            {getStatusIcon(conn.status)}
                                            {getStatusText(conn.status)}
                                        </div>
                                    </div>
                                    <div className="col-latency">
                                        <div className="latency-info">
                                            <Activity size={14} />
                                            {conn.avgLatency}ms
                                        </div>
                                    </div>
                                    <div className="col-quality">
                                        <div className="quality-bar-container">
                                            <div
                                                className="quality-bar"
                                                style={{
                                                    width: `${conn.dataQualityScore}%`,
                                                    background: getQualityColor(conn.dataQualityScore)
                                                }}
                                            />
                                            <span className="quality-text">{conn.dataQualityScore}%</span>
                                        </div>
                                    </div>
                                    <div className="col-actions">
                                        <button className="list-action-btn" onClick={() => navigate(conn.testPath)} title="Configure">
                                            <Settings size={16} />
                                        </button>
                                        <button className="list-action-btn primary" onClick={() => navigate(conn.testPath)} title="Open">
                                            <ArrowRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )
            )}


            {selectedTab === 'monitoring' && (
                <div className="monitoring-section">
                    <RateLimitMonitor />

                    <div className="info-panel">
                        <Shield size={24} color="#667eea" />
                        <div>
                            <h3>OTA-Compliant Rate Limiting</h3>
                            <p>
                                Svi API pozivi su zaštićeni rate limiting-om. Implementiran je inteligentni štit
                                koji prati "Success Ratio" po provajderu.
                            </p>
                            <p style={{ marginTop: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                                <strong>Standardi kvaliteta:</strong> Provajderi sa ocenom ispod 70% automatski se degradiraju u pretrazi.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {selectedTab === 'watchdog' && (
                <div className="watchdog-tab-content">
                    {/* OTA Diagnostic Tool */}
                    <div className="ota-diagnostic-tool" style={{ marginBottom: '30px', padding: '24px', background: 'rgba(255,255,255,0.05)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#667eea', marginBottom: '15px' }}>
                            <Settings size={20} /> OTA Standard Error Decoder (Diagnostic Mode)
                        </h3>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <input
                                type="text"
                                placeholder="Unesite kod greške (npr. 397, 450, 497)..."
                                value={testErrorCode}
                                onChange={(e) => setTestErrorCode(e.target.value)}
                                style={{ flex: 1, padding: '12px', borderRadius: '10px', background: '#0f172a', border: '1px solid #334155', color: '#fff' }}
                            />
                            <button
                                onClick={handleDecodeTest}
                                style={{ padding: '0 24px', borderRadius: '10px', background: '#667eea', color: '#fff', border: 'none', fontWeight: 600, cursor: 'pointer' }}
                            >
                                Dekodiraj
                            </button>
                        </div>
                        {decodedError && (
                            <div style={{ marginTop: '20px', padding: '16px', borderRadius: '12px', background: `${decodedError.category === 'System' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)'}`, border: `1px solid ${decodedError.category === 'System' ? '#ef4444' : '#10b981'}` }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <strong style={{ color: decodedError.category === 'System' ? '#ef4444' : '#10b981' }}>Kategorija: {decodedError.category}</strong>
                                    <span>Kod: {decodedError.code}</span>
                                </div>
                                <p style={{ fontSize: '15px', fontWeight: 600, margin: '4px 0' }}>{decodedError.description}</p>
                                <p style={{ fontSize: '13px', opacity: 0.8 }}>Relay Preporuka: <strong>{decodedError.recommendation}</strong></p>
                            </div>
                        )}
                    </div>

                    <AIWatchdogDashboard />
                </div>
            )}

            {/* AI Assistant FAB */}
            <button
                className={`ai-sentinel-fab ${isAiChatOpen ? 'active' : ''}`}
                onClick={() => setIsAiChatOpen(true)}
                title="Open API Sentinel Assistant"
            >
                <div className="fab-icon">🤖</div>
                <div className="fab-ping"></div>
                <span className="fab-text">API Sentinel</span>
            </button>

            {/* AI Chat Modal */}
            <GeneralAIChat
                isOpen={isAiChatOpen}
                onOpen={() => setIsAiChatOpen(true)}
                onClose={() => setIsAiChatOpen(false)}
                lang="sr"
                context="API-Sentinel"
                analysisData={[healthStats, monitorStatus, connections]}
            />
        </div>
    );
};

export default APIConnectionsHub;
