/**
 * Yield Management Dashboard
 * Main UI component for dynamic pricing and revenue management
 */

import React, { useState, useEffect } from 'react';
import {
    TrendingUp, DollarSign, Target, Activity, AlertCircle,
    CheckCircle, XCircle, Clock, BarChart3, RefreshCw, Settings,
    Eye, ThumbsUp, ThumbsDown, Zap, Globe
} from 'lucide-react';
import { priceAggregator } from '../../services/yield/priceAggregator';
import { markupEngine } from '../../services/yield/markupEngine';
import { competitorScraper } from '../../services/yield/competitorScraper';
import { hotelMatcher } from '../../services/yield/hotelMatcher';
import type {
    MarkupProposal,
    YieldDashboardStats,
    ScrapingSession
} from '../../services/yield/types';
import './YieldDashboard.css';

const YieldDashboard: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'overview' | 'proposals' | 'scraping' | 'settings'>('overview');
    const [pendingProposals, setPendingProposals] = useState<MarkupProposal[]>([]);
    const [scrapingSessions, setScrapingSessions] = useState<ScrapingSession[]>([]);
    const [stats, setStats] = useState<YieldDashboardStats>({
        total_proposals: 0,
        pending_proposals: 0,
        approved_today: 0,
        rejected_today: 0,
        avg_markup_percent: 0,
        avg_competitor_advantage: 0,
        total_scraped_prices: 0,
        active_hotels_tracked: 0,
        competitors_monitored: 3
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        setLoading(true);
        try {
            // Load pending proposals
            const proposalsResult = await markupEngine.getPendingProposals();
            if (proposalsResult.success && proposalsResult.data) {
                setPendingProposals(proposalsResult.data);
                setStats(prev => ({
                    ...prev,
                    pending_proposals: proposalsResult.data!.length
                }));
            }

            // Load scraping sessions
            const sessionsResult = await competitorScraper.getScrapingSessions(10);
            if (sessionsResult.success && sessionsResult.data) {
                setScrapingSessions(sessionsResult.data);
            }

        } catch (error) {
            console.error('Error loading dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApproveProposal = async (proposalId: string) => {
        const result = await markupEngine.approveProposal(proposalId, 'current-user-id', 'Approved from dashboard');
        if (result.success) {
            loadDashboardData();
        }
    };

    const handleRejectProposal = async (proposalId: string) => {
        const result = await markupEngine.rejectProposal(proposalId, 'current-user-id', 'Rejected from dashboard');
        if (result.success) {
            loadDashboardData();
        }
    };

    const handleStartScraping = async () => {
        setLoading(true);
        try {
            await competitorScraper.scrapeAllCompetitors(
                'Grčka', // Default destination
                new Date().toISOString().split('T')[0],
                new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                2,
                0
            );
            loadDashboardData();
        } catch (error) {
            console.error('Scraping error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="yield-dashboard">
            {/* Header */}
            <div className="yield-header">
                <div className="yield-header-content">
                    <div className="yield-title-section">
                        <TrendingUp size={32} style={{ color: 'var(--accent)' }} />
                        <div>
                            <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 800 }}>Revenue Management</h1>
                            <p style={{ margin: '4px 0 0 0', color: 'var(--text-secondary)', fontSize: '14px' }}>
                                Dynamic Pricing & Competitor Intelligence
                            </p>
                        </div>
                    </div>
                    <button
                        className="yield-refresh-btn"
                        onClick={loadDashboardData}
                        disabled={loading}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '12px 24px',
                            background: 'var(--accent)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '12px',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            fontWeight: 600,
                            fontSize: '14px'
                        }}
                    >
                        <RefreshCw size={16} className={loading ? 'spinning' : ''} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="yield-stats-grid">
                <div className="yield-stat-card">
                    <div className="yield-stat-icon" style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
                        <Clock size={24} style={{ color: '#3b82f6' }} />
                    </div>
                    <div className="yield-stat-content">
                        <div className="yield-stat-value">{stats.pending_proposals}</div>
                        <div className="yield-stat-label">Pending Proposals</div>
                    </div>
                </div>

                <div className="yield-stat-card">
                    <div className="yield-stat-icon" style={{ background: 'rgba(34, 197, 94, 0.1)' }}>
                        <CheckCircle size={24} style={{ color: '#22c55e' }} />
                    </div>
                    <div className="yield-stat-content">
                        <div className="yield-stat-value">{stats.approved_today}</div>
                        <div className="yield-stat-label">Approved Today</div>
                    </div>
                </div>

                <div className="yield-stat-card">
                    <div className="yield-stat-icon" style={{ background: 'rgba(168, 85, 247, 0.1)' }}>
                        <Target size={24} style={{ color: '#a855f7' }} />
                    </div>
                    <div className="yield-stat-content">
                        <div className="yield-stat-value">{stats.avg_markup_percent.toFixed(1)}%</div>
                        <div className="yield-stat-label">Avg Markup</div>
                    </div>
                </div>

                <div className="yield-stat-card">
                    <div className="yield-stat-icon" style={{ background: 'rgba(249, 115, 22, 0.1)' }}>
                        <Globe size={24} style={{ color: '#f97316' }} />
                    </div>
                    <div className="yield-stat-content">
                        <div className="yield-stat-value">{stats.competitors_monitored}</div>
                        <div className="yield-stat-label">Competitors Tracked</div>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="yield-tabs">
                <button
                    className={`yield-tab ${activeTab === 'overview' ? 'active' : ''}`}
                    onClick={() => setActiveTab('overview')}
                >
                    <Activity size={16} />
                    Overview
                </button>
                <button
                    className={`yield-tab ${activeTab === 'proposals' ? 'active' : ''}`}
                    onClick={() => setActiveTab('proposals')}
                >
                    <DollarSign size={16} />
                    Markup Proposals
                    {stats.pending_proposals > 0 && (
                        <span className="yield-tab-badge">{stats.pending_proposals}</span>
                    )}
                </button>
                <button
                    className={`yield-tab ${activeTab === 'scraping' ? 'active' : ''}`}
                    onClick={() => setActiveTab('scraping')}
                >
                    <BarChart3 size={16} />
                    Competitor Scraping
                </button>
                <button
                    className={`yield-tab ${activeTab === 'settings' ? 'active' : ''}`}
                    onClick={() => setActiveTab('settings')}
                >
                    <Settings size={16} />
                    Settings
                </button>
            </div>

            {/* Tab Content */}
            <div className="yield-tab-content">
                {activeTab === 'overview' && (
                    <div className="yield-overview">
                        <h2>System Overview</h2>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                            Revenue Management system is active and monitoring competitor prices.
                        </p>

                        <div className="yield-info-card">
                            <AlertCircle size={20} style={{ color: '#3b82f6' }} />
                            <div>
                                <strong>Next Scraping Session:</strong> Scheduled for tomorrow at 02:00 AM
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'proposals' && (
                    <div className="yield-proposals">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h2 style={{ margin: 0 }}>Pending Markup Proposals</h2>
                        </div>

                        {pendingProposals.length === 0 ? (
                            <div className="yield-empty-state">
                                <CheckCircle size={48} style={{ color: 'var(--text-secondary)', opacity: 0.5 }} />
                                <p>No pending proposals</p>
                            </div>
                        ) : (
                            <div className="yield-proposals-list">
                                {pendingProposals.map(proposal => (
                                    <div key={proposal.id} className="yield-proposal-card">
                                        <div className="yield-proposal-header">
                                            <div>
                                                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700 }}>
                                                    {proposal.hotel_name || 'Unknown Hotel'}
                                                </h3>
                                                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
                                                    {proposal.destination}
                                                </p>
                                            </div>
                                            <div className="yield-proposal-badge">
                                                {proposal.status}
                                            </div>
                                        </div>

                                        <div className="yield-proposal-pricing">
                                            <div className="yield-pricing-item">
                                                <span className="yield-pricing-label">Base Cost</span>
                                                <span className="yield-pricing-value">€{proposal.base_cost.toFixed(2)}</span>
                                            </div>
                                            <div className="yield-pricing-arrow">→</div>
                                            <div className="yield-pricing-item">
                                                <span className="yield-pricing-label">Current Markup</span>
                                                <span className="yield-pricing-value">{proposal.current_markup_percent?.toFixed(1)}%</span>
                                            </div>
                                            <div className="yield-pricing-arrow">→</div>
                                            <div className="yield-pricing-item highlight">
                                                <span className="yield-pricing-label">Proposed Markup</span>
                                                <span className="yield-pricing-value" style={{ color: 'var(--accent)' }}>
                                                    {proposal.proposed_markup_percent.toFixed(1)}%
                                                </span>
                                            </div>
                                        </div>

                                        <div className="yield-proposal-actions">
                                            <button
                                                className="yield-action-btn approve"
                                                onClick={() => handleApproveProposal(proposal.id!)}
                                            >
                                                <ThumbsUp size={16} />
                                                Approve
                                            </button>
                                            <button
                                                className="yield-action-btn reject"
                                                onClick={() => handleRejectProposal(proposal.id!)}
                                            >
                                                <ThumbsDown size={16} />
                                                Reject
                                            </button>
                                            <button className="yield-action-btn view">
                                                <Eye size={16} />
                                                Details
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'scraping' && (
                    <div className="yield-scraping">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h2 style={{ margin: 0 }}>Competitor Scraping</h2>
                            <button
                                className="yield-scrape-btn"
                                onClick={handleStartScraping}
                                disabled={loading}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    padding: '12px 24px',
                                    background: 'var(--accent)',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '12px',
                                    cursor: loading ? 'not-allowed' : 'pointer',
                                    fontWeight: 600
                                }}
                            >
                                <Zap size={16} />
                                Start Scraping
                            </button>
                        </div>

                        <div className="yield-scraping-sessions">
                            {scrapingSessions.map(session => (
                                <div key={session.id} className="yield-session-card">
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <strong>{session.session_type}</strong>
                                            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
                                                {new Date(session.started_at!).toLocaleString()}
                                            </p>
                                        </div>
                                        <div className={`yield-status-badge ${session.status}`}>
                                            {session.status}
                                        </div>
                                    </div>
                                    <div style={{ marginTop: '12px', fontSize: '13px' }}>
                                        <span>Scraped: {session.total_prices_scraped || 0} prices</span>
                                        {session.duration_seconds && (
                                            <span style={{ marginLeft: '16px' }}>
                                                Duration: {session.duration_seconds}s
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'settings' && (
                    <div className="yield-settings">
                        <h2>Yield Management Settings</h2>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                            Configure markup rules, auto-approval thresholds, and scraping frequency.
                        </p>
                        <div className="yield-info-card">
                            <Settings size={20} style={{ color: '#3b82f6' }} />
                            <div>
                                Settings panel coming soon...
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default YieldDashboard;
