import { useState } from 'react';
import { aiMonitor } from '../../services/aiMonitor';
import { businessHealthMonitor } from '../../services/businessHealthMonitor';
import HotelSearch from './HotelSearch';
import TCTConnectionTest from './TCTConnectionTest';
import './TCTDashboard.css';

type ActiveView = 'dashboard' | 'search' | 'test' | 'monitor';

export default function TCTDashboard() {
    const [activeView, setActiveView] = useState<ActiveView>('dashboard');
    const [healthStats, setHealthStats] = useState<any>(null);
    const [businessStats, setBusinessStats] = useState<any>(null);

    // Refresh stats
    const refreshStats = () => {
        setHealthStats(aiMonitor.getHealthStats());
        setBusinessStats(businessHealthMonitor.getStats());
    };

    // Auto-refresh every 30 seconds
    useState(() => {
        refreshStats();
        const interval = setInterval(refreshStats, 30000);
        return () => clearInterval(interval);
    });

    const renderView = () => {
        switch (activeView) {
            case 'search':
                return <HotelSearch />;
            case 'test':
                return <TCTConnectionTest />;
            case 'monitor':
                return renderMonitor();
            default:
                return renderDashboard();
        }
    };

    const renderDashboard = () => (
        <div className="tct-dashboard-content">
            <div className="dashboard-header">
                <h1>🏨 TCT API Integration</h1>
                <p>Travel Connection Technology - Hotel Booking System</p>
            </div>

            {/* Quick Stats */}
            <div className="stats-grid">
                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'var(--gradient-green)' }}>
                        🔌
                    </div>
                    <div className="stat-info">
                        <div className="stat-label">API Status</div>
                        <div className="stat-value">
                            {healthStats?.lastCheck?.status === 'healthy' ? '✅ Healthy' : '⚠️ Degraded'}
                        </div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'var(--gradient-blue)' }}>
                        ⚡
                    </div>
                    <div className="stat-info">
                        <div className="stat-label">Avg Latency</div>
                        <div className="stat-value">{healthStats?.avgLatency || 'N/A'}</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'var(--gradient-purple)' }}>
                        📊
                    </div>
                    <div className="stat-info">
                        <div className="stat-label">Uptime</div>
                        <div className="stat-value">{healthStats?.uptime || 'N/A'}</div>
                    </div>
                </div>

                <div className="stat-card">
                    <div className="stat-icon" style={{ background: 'var(--gradient-orange)' }}>
                        🔍
                    </div>
                    <div className="stat-info">
                        <div className="stat-label">Last Search</div>
                        <div className="stat-value">
                            {businessStats?.lastSearch?.minutesAgo || 0} min ago
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="quick-actions">
                <h2>Quick Actions</h2>
                <div className="actions-grid">
                    <div className="action-card" onClick={() => setActiveView('search')}>
                        <div className="action-icon">🔍</div>
                        <h3>Search Hotels</h3>
                        <p>Search for available hotels using TCT API</p>
                    </div>

                    <div className="action-card" onClick={() => setActiveView('test')}>
                        <div className="action-icon">🔌</div>
                        <h3>Connection Test</h3>
                        <p>Test TCT API connection and endpoints</p>
                    </div>

                    <div className="action-card" onClick={() => setActiveView('monitor')}>
                        <div className="action-icon">📊</div>
                        <h3>API Monitor</h3>
                        <p>View AI Watchdog monitoring dashboard</p>
                    </div>

                    <div className="action-card">
                        <div className="action-icon">📝</div>
                        <h3>Bookings</h3>
                        <p>Manage hotel bookings and reservations</p>
                        <span className="badge coming-soon">Coming Soon</span>
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="recent-activity">
                <h2>Recent Activity</h2>
                <div className="activity-list">
                    <div className="activity-item">
                        <div className="activity-icon">🔍</div>
                        <div className="activity-info">
                            <div className="activity-title">Hotel Search</div>
                            <div className="activity-time">
                                {businessStats?.lastSearch?.minutesAgo || 0} minutes ago
                            </div>
                        </div>
                    </div>

                    <div className="activity-item">
                        <div className="activity-icon">📝</div>
                        <div className="activity-info">
                            <div className="activity-title">Booking Created</div>
                            <div className="activity-time">
                                {businessStats?.lastBooking?.minutesAgo || 0} minutes ago
                            </div>
                        </div>
                    </div>

                    <div className="activity-item">
                        <div className="activity-icon">✅</div>
                        <div className="activity-info">
                            <div className="activity-title">API Health Check</div>
                            <div className="activity-time">5 minutes ago</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderMonitor = () => (
        <div className="monitor-view">
            <h1>📊 AI Watchdog Monitor</h1>

            <div className="monitor-grid">
                {/* Health Status */}
                <div className="monitor-card">
                    <h3>🔌 API Health</h3>
                    <div className="health-status">
                        <div className="tct-monitor-status" data-status={healthStats?.lastCheck?.status}>
                            {healthStats?.lastCheck?.status === 'healthy' ? '✅' : '⚠️'}
                        </div>
                        <div className="status-text">
                            {healthStats?.lastCheck?.status || 'Unknown'}
                        </div>
                    </div>
                    <div className="health-details">
                        <div className="detail-item">
                            <span>Latency:</span>
                            <span>{healthStats?.avgLatency || 'N/A'}</span>
                        </div>
                        <div className="detail-item">
                            <span>Uptime:</span>
                            <span>{healthStats?.uptime || 'N/A'}</span>
                        </div>
                    </div>
                </div>

                {/* Business Metrics */}
                <div className="monitor-card">
                    <h3>💼 Business Health</h3>
                    <div className="metrics-list">
                        <div className="metric-item">
                            <span>Last Search:</span>
                            <span>{businessStats?.lastSearch?.minutesAgo || 0} min ago</span>
                        </div>
                        <div className="metric-item">
                            <span>Last Booking:</span>
                            <span>{businessStats?.lastBooking?.minutesAgo || 0} min ago</span>
                        </div>
                    </div>
                    {businessStats?.alerts?.noSearches && (
                        <div className="alert-badge error">
                            ⚠️ No searches in 2 hours!
                        </div>
                    )}
                    {businessStats?.alerts?.noBookings && (
                        <div className="alert-badge warning">
                            ⚠️ No bookings in 4 hours!
                        </div>
                    )}
                </div>

                {/* Recent Checks */}
                <div className="monitor-card full-width">
                    <h3>📈 Health History</h3>
                    <div className="health-chart">
                        {healthStats?.status && (
                            <div className="status-bars">
                                <div className="status-bar">
                                    <span>Healthy</span>
                                    <div className="bar">
                                        <div
                                            className="bar-fill healthy"
                                            style={{ width: `${(healthStats.status.healthy / 20) * 100}%` }}
                                        />
                                    </div>
                                    <span>{healthStats.status.healthy}</span>
                                </div>
                                <div className="status-bar">
                                    <span>Degraded</span>
                                    <div className="bar">
                                        <div
                                            className="bar-fill degraded"
                                            style={{ width: `${(healthStats.status.degraded / 20) * 100}%` }}
                                        />
                                    </div>
                                    <span>{healthStats.status.degraded}</span>
                                </div>
                                <div className="status-bar">
                                    <span>Down</span>
                                    <div className="bar">
                                        <div
                                            className="bar-fill down"
                                            style={{ width: `${(healthStats.status.down / 20) * 100}%` }}
                                        />
                                    </div>
                                    <span>{healthStats.status.down}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="tct-dashboard">
            {/* Navigation Tabs */}
            <div className="dashboard-nav">
                <button
                    className={`nav-tab ${activeView === 'dashboard' ? 'active' : ''}`}
                    onClick={() => setActiveView('dashboard')}
                >
                    🏠 Dashboard
                </button>
                <button
                    className={`nav-tab ${activeView === 'search' ? 'active' : ''}`}
                    onClick={() => setActiveView('search')}
                >
                    🔍 Search
                </button>
                <button
                    className={`nav-tab ${activeView === 'test' ? 'active' : ''}`}
                    onClick={() => setActiveView('test')}
                >
                    🔌 Test
                </button>
                <button
                    className={`nav-tab ${activeView === 'monitor' ? 'active' : ''}`}
                    onClick={() => setActiveView('monitor')}
                >
                    📊 Monitor
                </button>
            </div>

            {/* Content */}
            <div className="dashboard-content">
                {renderView()}
            </div>
        </div>
    );
}
