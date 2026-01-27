import { useState, useEffect } from 'react';
import { aiMonitor } from '../../services/aiMonitor';
import { businessHealthMonitor } from '../../services/businessHealthMonitor';
import { hitlManager } from '../../services/hitlManager';
import { tctApiLogger } from '../../services/tctApiLogger';
import './AIWatchdogDashboard.css';

export default function AIWatchdogDashboard() {
    const [healthStats, setHealthStats] = useState<any>(null);
    const [businessStats, setBusinessStats] = useState<any>(null);
    const [pendingActions, setPendingActions] = useState<any[]>([]);
    const [monitorStatus, setMonitorStatus] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'overview' | 'health' | 'business' | 'hitl' | 'logs'>('overview');

    // Refresh data
    const refreshData = () => {
        setHealthStats(aiMonitor.getHealthStats());
        setBusinessStats(businessHealthMonitor.getStats());
        setPendingActions(hitlManager.getPendingActions());
        setMonitorStatus(aiMonitor.getStatus());
    };

    // Auto-refresh every 10 seconds
    useEffect(() => {
        refreshData();
        const interval = setInterval(refreshData, 10000);
        return () => clearInterval(interval);
    }, []);

    const renderOverview = () => (
        <div className="watchdog-overview">
            {/* Status Cards */}
            <div className="status-grid">
                <div className="status-card api-status">
                    <div className="status-header">
                        <h3>🔌 API Health</h3>
                        <div className={`status-badge ${healthStats?.lastCheck?.status || 'unknown'}`}>
                            {healthStats?.lastCheck?.status || 'Unknown'}
                        </div>
                    </div>
                    <div className="status-body">
                        <div className="metric-large">
                            <span className="metric-value">{healthStats?.avgLatency || 'N/A'}</span>
                            <span className="metric-label">Avg Latency</span>
                        </div>
                        <div className="metric-row">
                            <div className="metric-item">
                                <span className="metric-label">Uptime</span>
                                <span className="metric-value">{healthStats?.uptime || 'N/A'}</span>
                            </div>
                            <div className="metric-item">
                                <span className="metric-label">Last Check</span>
                                <span className="metric-value">
                                    {healthStats?.lastCheck?.timestamp
                                        ? new Date(healthStats.lastCheck.timestamp).toLocaleTimeString()
                                        : 'N/A'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="status-card business-status">
                    <div className="status-header">
                        <h3>💼 Business Health</h3>
                        {(businessStats?.alerts?.noSearches || businessStats?.alerts?.noBookings) && (
                            <div className="status-badge warning">Alert</div>
                        )}
                    </div>
                    <div className="status-body">
                        <div className="metric-row">
                            <div className="metric-item">
                                <span className="metric-label">Last Search</span>
                                <span className="metric-value">{businessStats?.lastSearch?.minutesAgo || 0} min ago</span>
                            </div>
                            <div className="metric-item">
                                <span className="metric-label">Last Booking</span>
                                <span className="metric-value">{businessStats?.lastBooking?.minutesAgo || 0} min ago</span>
                            </div>
                        </div>
                        {businessStats?.alerts?.noSearches && (
                            <div className="alert-message error">
                                ⚠️ No searches in last 2 hours!
                            </div>
                        )}
                        {businessStats?.alerts?.noBookings && (
                            <div className="alert-message warning">
                                ⚠️ No bookings in last 4 hours!
                            </div>
                        )}
                    </div>
                </div>

                <div className="status-card hitl-status">
                    <div className="status-header">
                        <h3>🤝 Human-in-the-Loop</h3>
                        {pendingActions.length > 0 && (
                            <div className="status-badge pending">{pendingActions.length} Pending</div>
                        )}
                    </div>
                    <div className="status-body">
                        {pendingActions.length === 0 ? (
                            <div className="empty-state">
                                <span className="empty-icon">✅</span>
                                <span className="empty-text">No pending actions</span>
                            </div>
                        ) : (
                            <div className="pending-list">
                                {pendingActions.slice(0, 3).map((action) => (
                                    <div key={action.id} className="pending-item">
                                        <span className="pending-type">{action.type}</span>
                                        <span className="pending-endpoint">{action.endpoint}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="status-card monitor-status">
                    <div className="status-header">
                        <h3>🤖 Monitor Status</h3>
                        <div className={`status-badge ${monitorStatus?.isRunning ? 'healthy' : 'down'}`}>
                            {monitorStatus?.isRunning ? 'Running' : 'Stopped'}
                        </div>
                    </div>
                    <div className="status-body">
                        <div className="metric-row">
                            <div className="metric-item">
                                <span className="metric-label">Maintenance Mode</span>
                                <span className="metric-value">
                                    {monitorStatus?.maintenanceMode?.length || 0} endpoints
                                </span>
                            </div>
                            <div className="metric-item">
                                <span className="metric-label">Error Count</span>
                                <span className="metric-value">
                                    {Object.keys(monitorStatus?.errorCounts || {}).length}
                                </span>
                            </div>
                        </div>
                        <button
                            className="control-button"
                            onClick={() => monitorStatus?.isRunning ? aiMonitor.stop() : aiMonitor.start()}
                        >
                            {monitorStatus?.isRunning ? '⏸️ Stop Monitor' : '▶️ Start Monitor'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="quick-actions-section">
                <h2>Quick Actions</h2>
                <div className="actions-grid">
                    <button className="action-btn" onClick={() => setActiveTab('health')}>
                        📊 View Health Details
                    </button>
                    <button className="action-btn" onClick={() => setActiveTab('business')}>
                        💼 View Business Metrics
                    </button>
                    <button className="action-btn" onClick={() => setActiveTab('hitl')}>
                        🤝 Manage HITL Actions
                    </button>
                    <button className="action-btn" onClick={() => setActiveTab('logs')}>
                        📝 View API Logs
                    </button>
                    <button className="action-btn" onClick={() => aiMonitor.reset()}>
                        🔄 Reset Monitor
                    </button>
                    <button className="action-btn" onClick={refreshData}>
                        🔃 Refresh Data
                    </button>
                </div>
            </div>
        </div>
    );

    const renderHealthDetails = () => (
        <div className="health-details">
            <h2>📊 API Health Details</h2>

            {/* Health Chart */}
            <div className="chart-card">
                <h3>Health History (Last 20 Checks)</h3>
                <div className="health-chart">
                    {healthStats?.status && (
                        <div className="status-bars">
                            <div className="status-bar">
                                <span className="bar-label">Healthy</span>
                                <div className="bar">
                                    <div
                                        className="bar-fill healthy"
                                        style={{ width: `${(healthStats.status.healthy / 20) * 100}%` }}
                                    />
                                </div>
                                <span className="bar-value">{healthStats.status.healthy}/20</span>
                            </div>
                            <div className="status-bar">
                                <span className="bar-label">Degraded</span>
                                <div className="bar">
                                    <div
                                        className="bar-fill degraded"
                                        style={{ width: `${(healthStats.status.degraded / 20) * 100}%` }}
                                    />
                                </div>
                                <span className="bar-value">{healthStats.status.degraded}/20</span>
                            </div>
                            <div className="status-bar">
                                <span className="bar-label">Down</span>
                                <div className="bar">
                                    <div
                                        className="bar-fill down"
                                        style={{ width: `${(healthStats.status.down / 20) * 100}%` }}
                                    />
                                </div>
                                <span className="bar-value">{healthStats.status.down}/20</span>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Current Status */}
            <div className="chart-card">
                <h3>Current Status</h3>
                <div className="current-status">
                    <div className="status-indicator-large" data-status={healthStats?.lastCheck?.status}>
                        {healthStats?.lastCheck?.status === 'healthy' ? '✅' :
                            healthStats?.lastCheck?.status === 'degraded' ? '⚠️' : '❌'}
                    </div>
                    <div className="status-info">
                        <h4>{healthStats?.lastCheck?.status?.toUpperCase() || 'UNKNOWN'}</h4>
                        <p>Latency: {healthStats?.lastCheck?.latency || 'N/A'}ms</p>
                        <p>Timestamp: {healthStats?.lastCheck?.timestamp
                            ? new Date(healthStats.lastCheck.timestamp).toLocaleString()
                            : 'N/A'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Maintenance Mode */}
            {monitorStatus?.maintenanceMode?.length > 0 && (
                <div className="chart-card alert">
                    <h3>🚧 Maintenance Mode Active</h3>
                    <div className="maintenance-list">
                        {monitorStatus.maintenanceMode.map((endpoint: string) => (
                            <div key={endpoint} className="maintenance-item">
                                <span className="endpoint">{endpoint}</span>
                                <button
                                    className="disable-btn"
                                    onClick={() => {
                                        // TODO: Implement disable maintenance mode
                                        console.log('Disable maintenance for:', endpoint);
                                    }}
                                >
                                    Disable
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );

    const renderBusinessDetails = () => (
        <div className="business-details">
            <h2>💼 Business Health Details</h2>

            <div className="metrics-grid">
                <div className="metric-card">
                    <div className="metric-icon">🔍</div>
                    <div className="metric-content">
                        <h3>Last Search</h3>
                        <p className="metric-time">{businessStats?.lastSearch?.minutesAgo || 0} minutes ago</p>
                        <p className="metric-timestamp">
                            {businessStats?.lastSearch?.timestamp
                                ? new Date(businessStats.lastSearch.timestamp).toLocaleString()
                                : 'Never'}
                        </p>
                    </div>
                    {businessStats?.alerts?.noSearches && (
                        <div className="metric-alert error">
                            ⚠️ No searches in 2 hours!
                        </div>
                    )}
                </div>

                <div className="metric-card">
                    <div className="metric-icon">📝</div>
                    <div className="metric-content">
                        <h3>Last Booking</h3>
                        <p className="metric-time">{businessStats?.lastBooking?.minutesAgo || 0} minutes ago</p>
                        <p className="metric-timestamp">
                            {businessStats?.lastBooking?.timestamp
                                ? new Date(businessStats.lastBooking.timestamp).toLocaleString()
                                : 'Never'}
                        </p>
                    </div>
                    {businessStats?.alerts?.noBookings && (
                        <div className="metric-alert warning">
                            ⚠️ No bookings in 4 hours!
                        </div>
                    )}
                </div>
            </div>

            {/* Recommendations */}
            {(businessStats?.alerts?.noSearches || businessStats?.alerts?.noBookings) && (
                <div className="chart-card recommendations">
                    <h3>💡 AI Recommendations</h3>
                    <div className="recommendation-list">
                        {businessStats?.alerts?.noSearches && (
                            <div className="recommendation-item">
                                <h4>🔍 No Searches Detected</h4>
                                <p>Check:</p>
                                <ul>
                                    <li>Search form visibility</li>
                                    <li>JavaScript errors in console</li>
                                    <li>Mobile responsiveness</li>
                                    <li>Page load time</li>
                                    <li>Marketing campaigns</li>
                                </ul>
                            </div>
                        )}
                        {businessStats?.alerts?.noBookings && (
                            <div className="recommendation-item">
                                <h4>📝 No Bookings Detected</h4>
                                <p>Check:</p>
                                <ul>
                                    <li>Pricing competitiveness</li>
                                    <li>Payment gateway</li>
                                    <li>Booking form UX</li>
                                    <li>Trust signals (reviews, SSL)</li>
                                    <li>Availability of offers</li>
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );

    const renderHITLActions = () => (
        <div className="hitl-actions">
            <h2>🤝 Human-in-the-Loop Actions</h2>

            {pendingActions.length === 0 ? (
                <div className="empty-state-large">
                    <span className="empty-icon">✅</span>
                    <h3>No Pending Actions</h3>
                    <p>All critical actions have been processed</p>
                </div>
            ) : (
                <div className="actions-list">
                    {pendingActions.map((action) => (
                        <div key={action.id} className="action-card-large">
                            <div className="action-header">
                                <div className="action-type">{action.type.replace(/_/g, ' ')}</div>
                                <div className={`action-status ${action.status}`}>{action.status}</div>
                            </div>
                            <div className="action-body">
                                <div className="action-detail">
                                    <span className="detail-label">Endpoint:</span>
                                    <span className="detail-value">{action.endpoint}</span>
                                </div>
                                <div className="action-detail">
                                    <span className="detail-label">Reason:</span>
                                    <span className="detail-value">{action.reason}</span>
                                </div>
                                <div className="action-detail">
                                    <span className="detail-label">Time:</span>
                                    <span className="detail-value">
                                        {new Date(action.timestamp).toLocaleString()}
                                    </span>
                                </div>
                                {action.autoExecuteIn && (
                                    <div className="action-detail">
                                        <span className="detail-label">Auto-execute in:</span>
                                        <span className="detail-value">
                                            {Math.round(action.autoExecuteIn / 1000)}s
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div className="action-buttons">
                                <button className="approve-btn">✅ Approve</button>
                                <button className="reject-btn">❌ Reject</button>
                                <button className="postpone-btn">⏸️ Postpone</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    const renderLogs = () => (
        <div className="logs-view">
            <h2>📝 API Logs</h2>
            <div className="logs-controls">
                <button onClick={() => tctApiLogger.printStats()}>📊 Print Stats</button>
                <button onClick={() => tctApiLogger.printLogs()}>📋 Print All Logs</button>
                <button onClick={() => tctApiLogger.clearLogs()}>🗑️ Clear Logs</button>
            </div>
            <div className="logs-info">
                <p>Check browser console for detailed logs</p>
                <p>Use tctApiLogger methods to export logs</p>
            </div>
        </div>
    );

    return (
        <div className="ai-watchdog-dashboard">
            {/* Header */}
            <div className="watchdog-header">
                <div className="header-content">
                    <h1>🤖 AI Watchdog & Recovery</h1>
                    <p>Autonomous Monitoring and Self-Healing System</p>
                </div>
                <div className="header-actions">
                    <button className="refresh-btn" onClick={refreshData}>
                        🔃 Refresh
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="watchdog-tabs">
                <button
                    className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
                    onClick={() => setActiveTab('overview')}
                >
                    🏠 Overview
                </button>
                <button
                    className={`tab ${activeTab === 'health' ? 'active' : ''}`}
                    onClick={() => setActiveTab('health')}
                >
                    📊 Health
                </button>
                <button
                    className={`tab ${activeTab === 'business' ? 'active' : ''}`}
                    onClick={() => setActiveTab('business')}
                >
                    💼 Business
                </button>
                <button
                    className={`tab ${activeTab === 'hitl' ? 'active' : ''}`}
                    onClick={() => setActiveTab('hitl')}
                >
                    🤝 HITL {pendingActions.length > 0 && `(${pendingActions.length})`}
                </button>
                <button
                    className={`tab ${activeTab === 'logs' ? 'active' : ''}`}
                    onClick={() => setActiveTab('logs')}
                >
                    📝 Logs
                </button>
            </div>

            {/* Content */}
            <div className="watchdog-content">
                {activeTab === 'overview' && renderOverview()}
                {activeTab === 'health' && renderHealthDetails()}
                {activeTab === 'business' && renderBusinessDetails()}
                {activeTab === 'hitl' && renderHITLActions()}
                {activeTab === 'logs' && renderLogs()}
            </div>
        </div>
    );
}
