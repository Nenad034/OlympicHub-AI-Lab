import React, { useState } from 'react';
import type { ReactNode } from 'react';
import { ArrowLeft, CheckCircle2, XCircle, Loader2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import RateLimitMonitor from './RateLimitMonitor';
import './UnifiedAPITest.css';

export interface TestResult {
    id: string;
    test: string;
    status: 'success' | 'error' | 'pending';
    message: string;
    timestamp: string;
}

export interface APITestConfig {
    name: string;
    provider: string;
    description: string;
    icon: ReactNode;
    color: string;
    baseUrl: string;
    environment: string;
    credentials?: {
        username?: string;
        password?: string;
        apiKey?: string;
    };
}

interface UnifiedAPITestProps {
    config: APITestConfig;
    connectionStatus: 'connected' | 'disconnected' | 'connecting';
    authToken?: string | null;
    testResults: TestResult[];
    onConnect: () => void;
    onDisconnect: () => void;
    onRefreshToken?: () => void;
    children: ReactNode; // Test buttons and custom sections
}

const UnifiedAPITest: React.FC<UnifiedAPITestProps> = ({
    config,
    connectionStatus,
    authToken,
    testResults,
    onConnect,
    onDisconnect,
    onRefreshToken,
    children
}) => {
    const navigate = useNavigate();
    const [selectedTab, setSelectedTab] = useState<'tests' | 'config' | 'monitoring'>('tests');

    const getStatusIcon = () => {
        switch (connectionStatus) {
            case 'connected':
                return <CheckCircle2 size={20} color="#10b981" />;
            case 'connecting':
                return <Loader2 size={20} className="spin" color="#f59e0b" />;
            default:
                return <XCircle size={20} color="#ef4444" />;
        }
    };

    const getStatusText = () => {
        switch (connectionStatus) {
            case 'connected': return 'Connected';
            case 'connecting': return 'Connecting...';
            default: return 'Disconnected';
        }
    };

    return (
        <div className="unified-api-test">
            {/* Header */}
            <div className="api-test-header">
                <button className="back-btn" onClick={() => navigate('/api-connections')}>
                    <ArrowLeft size={20} />
                    Back to API Hub
                </button>
                <div className="header-content">
                    <div className="header-icon" style={{ background: config.color }}>
                        {config.icon}
                    </div>
                    <div>
                        <h1>{config.name} - Live Test</h1>
                        <p className="provider-info">{config.provider}</p>
                        <p className="description">{config.description}</p>
                    </div>
                </div>
            </div>

            {/* Connection Status Card */}
            <div className="connection-status-card">
                <div className="status-header">
                    <h3>📋 Connection Status</h3>
                    <div className="status-badge">
                        {getStatusIcon()}
                        <span>{getStatusText()}</span>
                    </div>
                </div>

                {authToken && (
                    <div className="token-display">
                        <label>Current Token:</label>
                        <code>{authToken}</code>
                    </div>
                )}

                <div className="quick-actions">
                    <button
                        className="action-btn primary"
                        onClick={onConnect}
                        disabled={connectionStatus === 'connecting'}
                    >
                        {connectionStatus === 'connecting' ? <Loader2 className="spin" size={18} /> : <CheckCircle2 size={18} />}
                        Connect
                    </button>
                    {onRefreshToken && (
                        <button className="action-btn secondary" onClick={onRefreshToken}>
                            Refresh Token
                        </button>
                    )}
                    <button
                        className="action-btn danger"
                        onClick={onDisconnect}
                        disabled={!authToken}
                    >
                        Disconnect
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="api-test-tabs">
                <button
                    className={`tab ${selectedTab === 'tests' ? 'active' : ''}`}
                    onClick={() => setSelectedTab('tests')}
                >
                    🧪 API Tests
                </button>
                <button
                    className={`tab ${selectedTab === 'config' ? 'active' : ''}`}
                    onClick={() => setSelectedTab('config')}
                >
                    ⚙️ Configuration
                </button>
                <button
                    className={`tab ${selectedTab === 'monitoring' ? 'active' : ''}`}
                    onClick={() => setSelectedTab('monitoring')}
                >
                    🛡️ Rate Limiting
                </button>
            </div>

            {/* Tab Content */}
            {selectedTab === 'tests' && (
                <div className="tests-section">
                    {/* Custom test buttons from children */}
                    <div className="test-actions">
                        {children}
                    </div>

                    {/* Test Results */}
                    <div className="test-results-section">
                        <div className="section-header">
                            <h3>📊 Test Results</h3>
                            <button className="clear-btn" onClick={() => { }}>Clear</button>
                        </div>
                        <div className="results-list">
                            {testResults.length === 0 ? (
                                <div className="no-results">
                                    <AlertCircle size={48} color="var(--text-secondary)" />
                                    <p>No tests run yet. Click a button above to start testing.</p>
                                </div>
                            ) : (
                                testResults.map(result => (
                                    <div key={result.id} className={`result-item ${result.status}`}>
                                        <div className="result-header">
                                            {result.status === 'success' && <CheckCircle2 size={20} />}
                                            {result.status === 'error' && <XCircle size={20} />}
                                            {result.status === 'pending' && <Loader2 className="spin" size={20} />}
                                            <span className="result-test">{result.test}</span>
                                            <span className="result-time">{result.timestamp}</span>
                                        </div>
                                        <div className="result-message">{result.message}</div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {selectedTab === 'config' && (
                <div className="config-section">
                    <h3>⚙️ API Configuration</h3>
                    <div className="config-grid">
                        <div className="config-item">
                            <label>Base URL:</label>
                            <code>{config.baseUrl}</code>
                        </div>
                        <div className="config-item">
                            <label>Environment:</label>
                            <code>{config.environment}</code>
                        </div>
                        {config.credentials?.username && (
                            <div className="config-item">
                                <label>Username:</label>
                                <code>{config.credentials.username}</code>
                            </div>
                        )}
                        {config.credentials?.apiKey && (
                            <div className="config-item">
                                <label>API Key:</label>
                                <code>{config.credentials.apiKey.substring(0, 20)}...</code>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {selectedTab === 'monitoring' && (
                <div className="monitoring-section">
                    <RateLimitMonitor />
                </div>
            )}
        </div>
    );
};

export default UnifiedAPITest;
