import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Activity,
    Wifi,
    Cpu,
    Clock,
    AlertTriangle,
    CheckCircle2,
    BarChart3
} from 'lucide-react';

interface SystemMetric {
    id: string;
    name: string;
    status: 'OPTIMAL' | 'DEGRADED' | 'CRITICAL';
    value: string;
    trend: 'UP' | 'DOWN' | 'STABLE';
    lastCheck: string;
}

interface ApiConnection {
    id: string;
    serviceName: string;
    latency: number; // ms
    uptime: number; // %
    status: 'ONLINE' | 'UNSTABLE' | 'OFFLINE';
    errorsLastHour: number;
}

export default function SystemPulse() {
    // Mock Data for Initial UI Structure
    const [metrics] = useState<SystemMetric[]>([
        { id: 'm1', name: 'CPU Load', status: 'OPTIMAL', value: '12%', trend: 'STABLE', lastCheck: 'Just now' },
        { id: 'm2', name: 'Memory Usage', status: 'OPTIMAL', value: '34%', trend: 'UP', lastCheck: 'Just now' },
        { id: 'm3', name: 'Disk I/O', status: 'DEGRADED', value: '89%', trend: 'UP', lastCheck: '2m ago' },
        { id: 'm4', name: 'Active Sessions', status: 'OPTIMAL', value: '42', trend: 'STABLE', lastCheck: 'Just now' }
    ]);

    const [apis, setApis] = useState<ApiConnection[]>([
        { id: 'api_1', serviceName: 'Supabase Database', latency: 45, uptime: 99.9, status: 'ONLINE', errorsLastHour: 0 },
        { id: 'api_2', serviceName: 'Amadeus GDS (Flights)', latency: 850, uptime: 98.5, status: 'UNSTABLE', errorsLastHour: 12 },
        { id: 'api_3', serviceName: 'Google Maps API', latency: 120, uptime: 99.9, status: 'ONLINE', errorsLastHour: 0 },
        { id: 'api_4', serviceName: 'OpenAI / Gemini', latency: 1500, uptime: 99.0, status: 'ONLINE', errorsLastHour: 2 },
        { id: 'api_5', serviceName: 'Bank Intesa Payment', latency: 0, uptime: 0, status: 'OFFLINE', errorsLastHour: 50 }
    ]);

    // Simulated "Pulse" Effect
    useEffect(() => {
        const interval = setInterval(() => {
            setApis(current => current.map(api => ({
                ...api,
                latency: api.status === 'OFFLINE' ? 0 : Math.max(20, api.latency + (Math.random() * 40 - 20))
            })));
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'OPTIMAL': case 'ONLINE': return 'var(--emerald)';
            case 'DEGRADED': case 'UNSTABLE': return 'var(--amber)';
            case 'CRITICAL': case 'OFFLINE': return '#ef4444';
            default: return 'var(--text-secondary)';
        }
    };

    return (
        <div style={{
            padding: '40px',
            height: '100%',
            overflowY: 'auto',
            background: 'linear-gradient(180deg, var(--bg-main) 0%, #0f172a 100%)',
            color: '#fff'
        }}>

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                        width: '50px', height: '50px',
                        borderRadius: '16px',
                        background: 'rgba(59, 130, 246, 0.2)',
                        border: '1px solid rgba(59, 130, 246, 0.4)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 0 20px rgba(59, 130, 246, 0.2)'
                    }}>
                        <Activity size={24} color="#3b82f6" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '28px', fontWeight: '800', margin: 0, background: 'linear-gradient(90deg, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            System Pulse
                        </h1>
                        <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '14px' }}>Real-time Infrastructure Monitoring & AI Watchdog</p>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                    <div className="pulse-badge" style={{ padding: '8px 16px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '100px', display: 'flex', alignItems: 'center', gap: '8px', color: '#10b981', fontSize: '12px', fontWeight: '700' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }} />
                        SYSTEM HEALTHY
                    </div>
                </div>
            </div>

            {/* Main Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '40px' }}>
                {metrics.map(metric => (
                    <motion.div
                        key={metric.id}
                        whileHover={{ y: -5 }}
                        style={{
                            background: 'var(--bg-card)',
                            border: `1px solid ${metric.status === 'OPTIMAL' ? 'var(--border)' : '#ef4444'}`,
                            borderRadius: '20px',
                            padding: '24px',
                            position: 'relative',
                            overflow: 'hidden'
                        }}
                    >
                        {metric.status !== 'OPTIMAL' && (
                            <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: '#ef4444' }} />
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                            <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: '600', textTransform: 'uppercase' }}>{metric.name}</span>
                            {metric.name.includes('CPU') ? <Cpu size={18} color="var(--text-secondary)" /> : <BarChart3 size={18} color="var(--text-secondary)" />}
                        </div>
                        <div style={{ fontSize: '32px', fontWeight: '800', marginBottom: '8px', color: metric.status === 'OPTIMAL' ? '#fff' : '#ef4444' }}>
                            {metric.value}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                            <Clock size={12} /> Checked {metric.lastCheck}
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* API Connectivity Panel */}
            <div style={{
                background: 'var(--bg-card)',
                borderRadius: '24px',
                border: '1px solid var(--border)',
                padding: '30px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Wifi size={20} color="var(--accent)" /> External API Connections
                    </h3>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Auto-refreshing every 2s</div>
                </div>

                <div style={{ display: 'grid', gap: '16px' }}>
                    {apis.map(api => (
                        <div key={api.id} style={{
                            display: 'grid',
                            gridTemplateColumns: '200px 150px 150px 1fr 100px',
                            alignItems: 'center',
                            padding: '16px 24px',
                            background: 'rgba(255,255,255,0.02)',
                            borderRadius: '16px',
                            border: '1px solid var(--border)',
                            transition: '0.2s'
                        }}>
                            {/* Service Name */}
                            <div style={{ fontWeight: '600', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{
                                    width: '8px', height: '8px', borderRadius: '50%',
                                    background: getStatusColor(api.status),
                                    boxShadow: `0 0 10px ${getStatusColor(api.status)}`
                                }} />
                                {api.serviceName}
                            </div>

                            {/* Status Pill */}
                            <div>
                                <span style={{
                                    padding: '4px 12px',
                                    borderRadius: '100px',
                                    fontSize: '11px',
                                    fontWeight: '800',
                                    background: `${getStatusColor(api.status)}20`,
                                    color: getStatusColor(api.status),
                                    border: `1px solid ${getStatusColor(api.status)}40`
                                }}>
                                    {api.status}
                                </span>
                            </div>

                            {/* Latency */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                                <Activity size={14} />
                                <span style={{ fontFamily: 'monospace', color: api.latency > 500 ? '#ef4444' : '#fff' }}>
                                    {api.latency.toFixed(0)} ms
                                </span>
                            </div>

                            {/* Uptime Bar */}
                            <div style={{ paddingRight: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '4px', color: 'var(--text-secondary)' }}>
                                    <span>Uptime</span>
                                    <span>{api.uptime}%</span>
                                </div>
                                <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '10px', overflow: 'hidden' }}>
                                    <div style={{
                                        width: `${api.uptime}%`,
                                        height: '100%',
                                        background: getStatusColor(api.status),
                                        transition: '1s ease-out'
                                    }} />
                                </div>
                            </div>

                            {/* Actions / Alert */}
                            <div style={{ textAlign: 'right' }}>
                                {api.errorsLastHour > 0 ? (
                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#ef4444', fontSize: '12px', fontWeight: '700' }}>
                                        <AlertTriangle size={14} /> {api.errorsLastHour} Errs
                                    </div>
                                ) : (
                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#10b981', fontSize: '12px', opacity: 0.5 }}>
                                        <CheckCircle2 size={14} /> Stable
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <style>{`
                .pulse-badge { animation: pulse-soft 2s infinite; }
                @keyframes pulse-soft {
                    0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.4); }
                    70% { box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
                }
            `}</style>

        </div>
    );
}
