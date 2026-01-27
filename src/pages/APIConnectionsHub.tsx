import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Plug, Database, Globe, Plane, CheckCircle, XCircle,
    AlertTriangle, Settings, Activity, ArrowRight, Shield
} from 'lucide-react';
import RateLimitMonitor from '../components/RateLimitMonitor';
import './APIConnectionsHub.css';

interface APIConnection {
    id: string;
    name: string;
    provider: string;
    description: string;
    icon: React.ReactNode;
    status: 'active' | 'inactive' | 'error' | 'testing';
    color: string;
    testPath: string;
    features: string[];
}

const connections: APIConnection[] = [
    {
        id: 'solvex',
        name: 'Solvex (Master-Interlook)',
        provider: 'B&A e-Travel SA',
        description: 'Bulgarian hotel inventory - Ski resorts, beach destinations, city hotels',
        icon: <Database size={32} />,
        status: 'active',
        color: '#e91e63',
        testPath: '/solvex-test',
        features: ['Hotel Search', 'Availability', 'Booking', 'Cancellation']
    },
    {
        id: 'opengreece',
        name: 'OpenGreece',
        provider: 'OpenGreece API',
        description: 'Greek hotel inventory - Islands, mainland, all-inclusive resorts',
        icon: <Globe size={32} />,
        status: 'active',
        color: '#43a047',
        testPath: '/opengreece-test',
        features: ['Hotel Search', 'Real-time Availability', 'Instant Booking']
    },
    {
        id: 'tct',
        name: 'TCT (Travel Compositor)',
        provider: 'TCT API',
        description: 'Multi-destination hotel aggregator - Worldwide coverage',
        icon: <Database size={32} />,
        status: 'active',
        color: '#fb8c00',
        testPath: '/tct-test',
        features: ['Global Search', 'Multi-currency', 'Dynamic Pricing']
    },
    {
        id: 'ors',
        name: 'ORS (Online Reservation System)',
        provider: 'ORS Travel',
        description: 'Multi-operator platform - Hotels, packages, organized trips',
        icon: <Globe size={32} />,
        status: 'active',
        color: '#9c27b0',
        testPath: '/ors-test',
        features: ['Hotel Search', 'Package Deals', 'Organized Trips', 'Optional Bookings', 'GIATA IDs']
    },
    {
        id: 'mars',
        name: 'Mars API',
        provider: 'Neolab',
        description: 'Accommodation management system - Detailed content, pricing, amenities',
        icon: <Database size={32} />,
        status: 'testing',
        color: '#dc2626',
        testPath: '/mars-test',
        features: ['Accommodation Details', 'Complex Pricing', 'Rich Amenities', 'GPS Coordinates', 'Image Gallery']
    },
    {
        id: 'amadeus',
        name: 'Amadeus Flights',
        provider: 'Amadeus GDS',
        description: 'Flight search and booking - Global airline inventory',
        icon: <Plane size={32} />,
        status: 'inactive',
        color: '#667eea',
        testPath: '/amadeus-test',
        features: ['Flight Search', 'Multi-city', 'Fare Rules', 'Ticketing']
    }
];

const APIConnectionsHub: React.FC = () => {
    const navigate = useNavigate();
    const [selectedTab, setSelectedTab] = useState<'overview' | 'monitoring'>('overview');

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

    return (
        <div className="api-hub-container">
            {/* Header */}
            <div className="api-hub-header">
                <div className="header-content">
                    <div className="header-icon">
                        <Plug size={40} />
                    </div>
                    <div>
                        <h1>API Connections Hub</h1>
                        <p>Centralno upravljanje svim eksternim integracijama</p>
                    </div>
                </div>
                <div className="header-stats">
                    <div className="stat-item">
                        <span className="stat-value">{connections.filter(c => c.status === 'active').length}</span>
                        <span className="stat-label">Active</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-value">{connections.filter(c => c.status === 'testing').length}</span>
                        <span className="stat-label">Testing</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-value">{connections.length}</span>
                        <span className="stat-label">Total</span>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="api-hub-tabs">
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
            </div>

            {/* Content */}
            {selectedTab === 'overview' ? (
                <div className="connections-grid">
                    {connections.map(conn => (
                        <div key={conn.id} className="connection-card">
                            <div className="card-header">
                                <div className="icon-wrapper" style={{ background: `${conn.color}20`, color: conn.color }}>
                                    {conn.icon}
                                </div>
                                <div className="status-badge">
                                    {getStatusIcon(conn.status)}
                                    <span>{getStatusText(conn.status)}</span>
                                </div>
                            </div>

                            <div className="card-body">
                                <h3>{conn.name}</h3>
                                <p className="provider">{conn.provider}</p>
                                <p className="description">{conn.description}</p>

                                <div className="features-list">
                                    <h4>Features:</h4>
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
                <div className="monitoring-section">
                    <RateLimitMonitor />

                    <div className="info-panel">
                        <Shield size={24} color="#667eea" />
                        <div>
                            <h3>Rate Limiting Protection</h3>
                            <p>
                                Svi API pozivi su zaštićeni rate limiting-om da bi se sprečio "bursting"
                                i osigurala usklađenost sa ugovornim obavezama prema provajderima.
                            </p>
                            <p style={{ marginTop: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                                <strong>Član 39-41 Compliance:</strong> Tehnički limiti su jasno definisani i automatski primenjeni.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default APIConnectionsHub;
