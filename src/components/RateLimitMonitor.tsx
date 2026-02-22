import React, { useState, useEffect } from 'react';
import { Activity, Shield, AlertTriangle, CheckCircle, Settings } from 'lucide-react';
import { rateLimiter } from '../utils/rateLimiter';

const RateLimitMonitor: React.FC = () => {
    const [stats, setStats] = useState<Record<string, any>>({});

    const providers = ['solvex', 'opengreece', 'tct', 'gemini-api'];

    useEffect(() => {
        const interval = setInterval(() => {
            const newStats: Record<string, any> = {};
            providers.forEach(provider => {
                newStats[provider] = rateLimiter.getStats(provider);
            });
            setStats(newStats);
        }, 1000);

        return () => clearInterval(interval);
    }, []);

    const getUsagePercentage = (current: number, max: number) => {
        return Math.min((current / max) * 100, 100);
    };

    const getStatusColor = (percentage: number) => {
        if (percentage >= 90) return '#ef4444'; // Red
        if (percentage >= 70) return '#f59e0b'; // Orange
        return '#10b981'; // Green
    };

    return (
        <div style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
            padding: '24px',
            marginTop: '20px'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                <Shield size={24} color="#667eea" />
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>API Rate Limit Monitor</h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px' }}>
                {providers.map(provider => {
                    const stat = stats[provider];
                    if (!stat) return null;

                    const percentage = getUsagePercentage(stat.current, stat.max);
                    const color = getStatusColor(percentage);

                    return (
                        <div key={provider} style={{
                            background: 'rgba(255,255,255,0.03)',
                            border: '1px solid var(--border)',
                            borderRadius: '12px',
                            padding: '16px'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <span style={{ fontSize: '14px', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>
                                    {provider}
                                </span>
                                {percentage >= 90 ? (
                                    <AlertTriangle size={16} color={color} />
                                ) : (
                                    <CheckCircle size={16} color={color} />
                                )}
                            </div>

                            <div style={{ marginBottom: '8px' }}>
                                <div style={{ fontSize: '24px', fontWeight: 800, color }}>
                                    {stat.current} / {stat.max}
                                </div>
                                <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                                    requests per minute
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div style={{
                                width: '100%',
                                height: '6px',
                                background: 'rgba(255,255,255,0.1)',
                                borderRadius: '3px',
                                overflow: 'hidden'
                            }}>
                                <div style={{
                                    width: `${percentage}%`,
                                    height: '100%',
                                    background: color,
                                    transition: 'width 0.3s ease'
                                }} />
                            </div>

                            <button
                                onClick={() => {
                                    rateLimiter.reset(provider);
                                    console.log(`[Admin] Reset rate limit for ${provider}`);
                                }}
                                style={{
                                    marginTop: '12px',
                                    width: '100%',
                                    padding: '6px',
                                    background: 'transparent',
                                    border: '1px solid var(--border)',
                                    borderRadius: '6px',
                                    color: 'var(--text-secondary)',
                                    fontSize: '11px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '6px'
                                }}
                            >
                                <Settings size={12} /> Reset Limit
                            </button>
                        </div>
                    );
                })}
            </div>

            <div style={{
                marginTop: '20px',
                padding: '12px',
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                borderRadius: '8px',
                fontSize: '12px',
                color: 'var(--text-secondary)'
            }}>
                <strong style={{ color: '#3b82f6' }}>ℹ️ Info:</strong> Rate limits prevent "bursting" and comply with API provider terms.
                Limits reset automatically after the time window expires.
            </div>
        </div>
    );
};

export default RateLimitMonitor;
