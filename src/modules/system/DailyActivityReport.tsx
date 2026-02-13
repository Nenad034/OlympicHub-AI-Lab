import { useState, useEffect } from 'react';
import {
    Activity, TrendingUp, Users, DollarSign, AlertCircle,
    Download, Calendar, Clock, CheckCircle, XCircle,
    Loader, FileText, Mail, Bot, Database, Zap,
    BarChart3, PieChart, TrendingDown, User, X, Code,
    Search, Filter, ChevronDown, ChevronUp
} from 'lucide-react';
import { activityTracker, type DailyStats, type ActivityLog } from '../../services/activityTracker';

// User Stats Interface
interface UserStats {
    userId: string;
    userName: string;
    totalActivities: number;
    successCount: number;
    errorCount: number;
    lastActivity: string;
    modules: string[];
}

export default function DailyActivityReport() {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [stats, setStats] = useState<DailyStats | null>(null);
    const [recentActivities, setRecentActivities] = useState<ActivityLog[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState<string | null>(null);
    const [userStats, setUserStats] = useState<UserStats[]>([]);
    const [viewMode, setViewMode] = useState<'dashboard' | 'notepad' | 'errors'>('dashboard');
    const [searchQuery, setSearchQuery] = useState('');
    const [filterModule, setFilterModule] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<string>('all');

    useEffect(() => {
        loadData();
        // Refresh every 5 seconds
        const interval = setInterval(loadData, 5000);
        return () => clearInterval(interval);
    }, [selectedDate]);

    const loadData = () => {
        setIsLoading(true);
        const dailyStats = activityTracker.getDailyStats(selectedDate);
        const activities = selectedDate === new Date().toISOString().split('T')[0]
            ? activityTracker.getTodayLogs()
            : activityTracker.getLogsByDateRange(
                new Date(selectedDate + 'T00:00:00'),
                new Date(selectedDate + 'T23:59:59')
            );

        setStats(dailyStats);
        setRecentActivities(activities);

        // Calculate user stats
        const userMap = new Map<string, UserStats>();
        activities.forEach(activity => {
            const userId = activity.userId || 'system';
            const userName = activity.userName || 'System';

            if (!userMap.has(userId)) {
                userMap.set(userId, {
                    userId,
                    userName,
                    totalActivities: 0,
                    successCount: 0,
                    errorCount: 0,
                    lastActivity: activity.timestamp,
                    modules: []
                });
            }

            const user = userMap.get(userId)!;
            user.totalActivities++;
            if (activity.status === 'success') user.successCount++;
            if (activity.status === 'error') user.errorCount++;
            if (!user.modules.includes(activity.module)) user.modules.push(activity.module);
            if (new Date(activity.timestamp) > new Date(user.lastActivity)) {
                user.lastActivity = activity.timestamp;
            }
        });

        setUserStats(Array.from(userMap.values()).sort((a, b) => b.totalActivities - a.totalActivities));
        setIsLoading(false);
    };

    const handleExportCSV = () => {
        const startDate = new Date(selectedDate + 'T00:00:00');
        const endDate = new Date(selectedDate + 'T23:59:59');
        const csv = activityTracker.exportToCSV(startDate, endDate);

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `activity-report-${selectedDate}.csv`;
        a.click();
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('sr-RS', { style: 'currency', currency: 'EUR' }).format(amount);
    };

    const formatTime = (timestamp: string) => {
        return new Date(timestamp).toLocaleTimeString('sr-RS', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const formatDateTime = (timestamp: string) => {
        return new Date(timestamp).toLocaleString('sr-RS', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    const getActivityIcon = (type: string) => {
        switch (type) {
            case 'login': case 'logout': return <Users size={14} />;
            case 'create': case 'update': case 'delete': return <FileText size={14} />;
            case 'search': case 'view': return <Activity size={14} />;
            case 'email': return <Mail size={14} />;
            case 'ai_chat': return <Bot size={14} />;
            case 'api_call': return <Database size={14} />;
            case 'error': return <XCircle size={14} />;
            default: return <Activity size={14} />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'success': return '#22c55e';
            case 'error': return '#ef4444';
            case 'warning': return '#eab308';
            default: return '#3b82f6';
        }
    };

    // Filter activities
    const filteredActivities = recentActivities.filter(activity => {
        if (selectedUser && activity.userId !== selectedUser && activity.userName !== selectedUser) return false;
        if (filterModule !== 'all' && activity.module !== filterModule) return false;
        if (filterStatus !== 'all' && activity.status !== filterStatus) return false;
        if (searchQuery && !activity.action.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
    });

    const errorActivities = recentActivities.filter(a => a.status === 'error');
    const uniqueModules = Array.from(new Set(recentActivities.map(a => a.module)));

    if (isLoading && !stats) {
        return (
            <div className="fade-in" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
                <Loader className="rotate" size={32} color="#3b82f6" />
            </div>
        );
    }

    if (!stats) {
        return (
            <div className="fade-in" style={{ padding: '40px', textAlign: 'center' }}>
                <AlertCircle size={48} color="#ef4444" style={{ margin: '0 auto 20px' }} />
                <h3>Nema podataka za izabrani datum</h3>
            </div>
        );
    }

    // Calculate total business volume (only Active and Reserved)
    const totalBusinessVolume =
        stats.reservations.byStatus.active.revenue +
        stats.reservations.byStatus.reserved.revenue;

    return (
        <div className="fade-in">
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <h3 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>📊 Dnevni Izveštaj Aktivnosti</h3>
                    <p style={{ fontSize: '13px', color: '#94a3b8', margin: '4px 0 0' }}>
                        Kompletna analiza svih aktivnosti u sistemu
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                    {/* View Mode Selector */}
                    <div style={{ display: 'flex', gap: '4px', background: 'rgba(30, 41, 59, 0.5)', borderRadius: '10px', padding: '4px', border: '1px solid rgba(255,255,255,0.1)' }}>
                        <button
                            onClick={() => setViewMode('dashboard')}
                            style={{
                                padding: '6px 12px',
                                borderRadius: '8px',
                                fontSize: '11px',
                                fontWeight: 600,
                                background: viewMode === 'dashboard' ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                                color: viewMode === 'dashboard' ? '#3b82f6' : '#94a3b8',
                                border: 'none',
                                cursor: 'pointer'
                            }}
                        >
                            📊 Dashboard
                        </button>
                        <button
                            onClick={() => setViewMode('notepad')}
                            style={{
                                padding: '6px 12px',
                                borderRadius: '8px',
                                fontSize: '11px',
                                fontWeight: 600,
                                background: viewMode === 'notepad' ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                                color: viewMode === 'notepad' ? '#3b82f6' : '#94a3b8',
                                border: 'none',
                                cursor: 'pointer'
                            }}
                        >
                            📝 Notepad
                        </button>
                        <button
                            onClick={() => setViewMode('errors')}
                            style={{
                                padding: '6px 12px',
                                borderRadius: '8px',
                                fontSize: '11px',
                                fontWeight: 600,
                                background: viewMode === 'errors' ? 'rgba(239, 68, 68, 0.2)' : 'transparent',
                                color: viewMode === 'errors' ? '#ef4444' : '#94a3b8',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                            }}
                        >
                            ⚠️ Greške ({errorActivities.length})
                        </button>
                    </div>

                    <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        max={new Date().toISOString().split('T')[0]}
                        style={{
                            padding: '8px 12px',
                            borderRadius: '10px',
                            border: '1px solid rgba(255,255,255,0.1)',
                            background: 'rgba(30, 41, 59, 0.5)',
                            color: '#fff',
                            fontSize: '12px',
                            fontWeight: 600
                        }}
                    />
                    <button
                        onClick={handleExportCSV}
                        style={{
                            padding: '8px 16px',
                            borderRadius: '10px',
                            fontSize: '12px',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: 'rgba(59, 130, 246, 0.1)',
                            color: '#3b82f6',
                            border: '1px solid rgba(59, 130, 246, 0.2)',
                            cursor: 'pointer'
                        }}
                    >
                        <Download size={14} />
                        Export CSV
                    </button>
                    {selectedDate === new Date().toISOString().split('T')[0] && (
                        <div style={{
                            padding: '8px 16px',
                            borderRadius: '20px',
                            fontSize: '11px',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: 'rgba(34, 197, 94, 0.1)',
                            color: '#4ade80',
                            border: '1px solid rgba(34, 197, 94, 0.2)'
                        }}>
                            <Activity size={12} />
                            LIVE
                        </div>
                    )}
                </div>
            </div>

            {/* DASHBOARD VIEW */}
            {viewMode === 'dashboard' && (
                <>
                    {/* Executive Summary */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
                        <div style={{
                            background: 'rgba(30, 41, 59, 0.5)',
                            border: '1px solid rgba(255,255,255,0.05)',
                            borderRadius: '16px',
                            padding: '20px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '12px',
                                    background: 'rgba(59, 130, 246, 0.1)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <Activity size={20} color="#3b82f6" />
                                </div>
                                <div>
                                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>Ukupno Aktivnosti</div>
                                    <div style={{ fontSize: '24px', fontWeight: 700 }}>{stats.totalActivities}</div>
                                </div>
                            </div>
                        </div>

                        <div style={{
                            background: 'rgba(30, 41, 59, 0.5)',
                            border: '1px solid rgba(255,255,255,0.05)',
                            borderRadius: '16px',
                            padding: '20px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '12px',
                                    background: 'rgba(34, 197, 94, 0.1)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <Users size={20} color="#22c55e" />
                                </div>
                                <div>
                                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>Aktivni Korisnici</div>
                                    <div style={{ fontSize: '24px', fontWeight: 700 }}>{stats.activeUsers}</div>
                                </div>
                            </div>
                        </div>

                        <div style={{
                            background: 'rgba(30, 41, 59, 0.5)',
                            border: '1px solid rgba(255,255,255,0.05)',
                            borderRadius: '16px',
                            padding: '20px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '12px',
                                    background: 'rgba(139, 92, 246, 0.1)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    <DollarSign size={20} color="#8b5cf6" />
                                </div>
                                <div>
                                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>Obim Poslovanja</div>
                                    <div style={{ fontSize: '24px', fontWeight: 700 }}>{formatCurrency(totalBusinessVolume)}</div>
                                    <div style={{ fontSize: '10px', color: '#64748b' }}>Active + Reserved</div>
                                </div>
                            </div>
                        </div>

                        <div style={{
                            background: 'rgba(30, 41, 59, 0.5)',
                            border: '1px solid rgba(255,255,255,0.05)',
                            borderRadius: '16px',
                            padding: '20px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                <div style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '12px',
                                    background: stats.errors > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    {stats.errors > 0 ? <XCircle size={20} color="#ef4444" /> : <CheckCircle size={20} color="#22c55e" />}
                                </div>
                                <div>
                                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>Greške / Upozorenja</div>
                                    <div style={{ fontSize: '24px', fontWeight: 700 }}>{stats.errors} / {stats.warnings}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* User Cards */}
                    <div style={{
                        background: 'rgba(30, 41, 59, 0.5)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '16px',
                        padding: '24px',
                        marginBottom: '24px'
                    }}>
                        <h4 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Users size={18} color="#3b82f6" />
                            Aktivnosti po Korisnicima
                        </h4>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
                            {userStats.map(user => (
                                <div
                                    key={user.userId}
                                    onClick={() => setSelectedUser(selectedUser === user.userId ? null : user.userId)}
                                    style={{
                                        background: selectedUser === user.userId ? 'rgba(59, 130, 246, 0.1)' : 'rgba(15, 23, 42, 0.5)',
                                        border: selectedUser === user.userId ? '2px solid #3b82f6' : '1px solid rgba(255,255,255,0.05)',
                                        borderRadius: '12px',
                                        padding: '16px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                        <div style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '10px',
                                            background: user.userName === 'ClickToTravel Web' ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'linear-gradient(135deg, #3b82f6, #2563eb)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '18px',
                                            fontWeight: 700,
                                            color: '#fff'
                                        }}>
                                            {user.userName === 'ClickToTravel Web' ? '🌐' : user.userName.charAt(0).toUpperCase()}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '14px', fontWeight: 700 }}>{user.userName}</div>
                                            <div style={{ fontSize: '10px', color: '#94a3b8' }}>{user.totalActivities} aktivnosti</div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                                        <div style={{ flex: 1, textAlign: 'center', padding: '8px', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '8px' }}>
                                            <div style={{ fontSize: '16px', fontWeight: 700, color: '#22c55e' }}>{user.successCount}</div>
                                            <div style={{ fontSize: '9px', color: '#94a3b8' }}>Uspešno</div>
                                        </div>
                                        <div style={{ flex: 1, textAlign: 'center', padding: '8px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px' }}>
                                            <div style={{ fontSize: '16px', fontWeight: 700, color: '#ef4444' }}>{user.errorCount}</div>
                                            <div style={{ fontSize: '9px', color: '#94a3b8' }}>Greške</div>
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '10px', color: '#64748b' }}>
                                        Moduli: {user.modules.join(', ')}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Reservations Breakdown */}
                    <div style={{
                        background: 'rgba(30, 41, 59, 0.5)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '16px',
                        padding: '24px',
                        marginBottom: '24px'
                    }}>
                        <h4 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FileText size={18} color="#3b82f6" />
                            Rezervacije po Statusima
                        </h4>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                            {/* Active */}
                            <div style={{
                                background: 'rgba(34, 197, 94, 0.05)',
                                border: '1px solid rgba(34, 197, 94, 0.2)',
                                borderRadius: '12px',
                                padding: '16px'
                            }}>
                                <div style={{ fontSize: '12px', color: '#22c55e', fontWeight: 700, marginBottom: '8px' }}>✅ ACTIVE</div>
                                <div style={{ fontSize: '20px', fontWeight: 700, marginBottom: '4px' }}>{stats.reservations.byStatus.active.count}</div>
                                <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '2px' }}>Osobe: {stats.reservations.byStatus.active.people}</div>
                                <div style={{ fontSize: '13px', fontWeight: 600, color: '#22c55e' }}>{formatCurrency(stats.reservations.byStatus.active.revenue)}</div>
                            </div>

                            {/* Reserved */}
                            <div style={{
                                background: 'rgba(59, 130, 246, 0.05)',
                                border: '1px solid rgba(59, 130, 246, 0.2)',
                                borderRadius: '12px',
                                padding: '16px'
                            }}>
                                <div style={{ fontSize: '12px', color: '#3b82f6', fontWeight: 700, marginBottom: '8px' }}>📋 RESERVED</div>
                                <div style={{ fontSize: '20px', fontWeight: 700, marginBottom: '4px' }}>{stats.reservations.byStatus.reserved.count}</div>
                                <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '2px' }}>Osobe: {stats.reservations.byStatus.reserved.people}</div>
                                <div style={{ fontSize: '13px', fontWeight: 600, color: '#3b82f6' }}>{formatCurrency(stats.reservations.byStatus.reserved.revenue)}</div>
                            </div>

                            {/* Cancelled */}
                            <div style={{
                                background: 'rgba(239, 68, 68, 0.05)',
                                border: '1px solid rgba(239, 68, 68, 0.2)',
                                borderRadius: '12px',
                                padding: '16px'
                            }}>
                                <div style={{ fontSize: '12px', color: '#ef4444', fontWeight: 700, marginBottom: '8px' }}>❌ CANCELLED</div>
                                <div style={{ fontSize: '20px', fontWeight: 700, marginBottom: '4px' }}>{stats.reservations.byStatus.cancelled.count}</div>
                                <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '2px' }}>Osobe: {stats.reservations.byStatus.cancelled.people}</div>
                                <div style={{ fontSize: '13px', fontWeight: 600, color: '#ef4444' }}>{formatCurrency(stats.reservations.byStatus.cancelled.revenue)}</div>
                            </div>

                            {/* Completed */}
                            <div style={{
                                background: 'rgba(139, 92, 246, 0.05)',
                                border: '1px solid rgba(139, 92, 246, 0.2)',
                                borderRadius: '12px',
                                padding: '16px'
                            }}>
                                <div style={{ fontSize: '12px', color: '#8b5cf6', fontWeight: 700, marginBottom: '8px' }}>✔️ COMPLETED</div>
                                <div style={{ fontSize: '20px', fontWeight: 700, marginBottom: '4px' }}>{stats.reservations.byStatus.completed.count}</div>
                                <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '2px' }}>Osobe: {stats.reservations.byStatus.completed.people}</div>
                                <div style={{ fontSize: '13px', fontWeight: 600, color: '#8b5cf6' }}>{formatCurrency(stats.reservations.byStatus.completed.revenue)}</div>
                            </div>

                            {/* Pending */}
                            <div style={{
                                background: 'rgba(234, 179, 8, 0.05)',
                                border: '1px solid rgba(234, 179, 8, 0.2)',
                                borderRadius: '12px',
                                padding: '16px'
                            }}>
                                <div style={{ fontSize: '12px', color: '#eab308', fontWeight: 700, marginBottom: '8px' }}>⏳ PENDING</div>
                                <div style={{ fontSize: '20px', fontWeight: 700, marginBottom: '4px' }}>{stats.reservations.byStatus.pending.count}</div>
                                <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '2px' }}>Osobe: {stats.reservations.byStatus.pending.people}</div>
                                <div style={{ fontSize: '13px', fontWeight: 600, color: '#eab308' }}>{formatCurrency(stats.reservations.byStatus.pending.revenue)}</div>
                            </div>
                        </div>

                        {/* Total Summary */}
                        <div style={{
                            marginTop: '20px',
                            padding: '16px',
                            background: 'rgba(59, 130, 246, 0.1)',
                            border: '1px solid rgba(59, 130, 246, 0.2)',
                            borderRadius: '12px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                        }}>
                            <div>
                                <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>UKUPNO REZERVACIJA</div>
                                <div style={{ fontSize: '24px', fontWeight: 700 }}>{stats.reservations.total}</div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '4px' }}>OBIM POSLOVANJA (Active + Reserved)</div>
                                <div style={{ fontSize: '24px', fontWeight: 700, color: '#3b82f6' }}>{formatCurrency(totalBusinessVolume)}</div>
                            </div>
                        </div>
                    </div>

                    {/* AI & API Stats */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                        {/* AI Usage */}
                        <div style={{
                            background: 'rgba(30, 41, 59, 0.5)',
                            border: '1px solid rgba(255,255,255,0.05)',
                            borderRadius: '16px',
                            padding: '20px'
                        }}>
                            <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Bot size={16} color="#8b5cf6" />
                                AI Upotreba
                            </h4>
                            <div style={{ marginBottom: '12px' }}>
                                <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>Zahtevi</div>
                                <div style={{ fontSize: '20px', fontWeight: 700 }}>{stats.aiUsage.requests}</div>
                            </div>
                            <div style={{ marginBottom: '12px' }}>
                                <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>Tokeni</div>
                                <div style={{ fontSize: '20px', fontWeight: 700 }}>{stats.aiUsage.tokens.toLocaleString()}</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>Trošak</div>
                                <div style={{ fontSize: '16px', fontWeight: 700, color: '#8b5cf6' }}>{formatCurrency(stats.aiUsage.cost)}</div>
                            </div>
                        </div>

                        {/* API Calls */}
                        <div style={{
                            background: 'rgba(30, 41, 59, 0.5)',
                            border: '1px solid rgba(255,255,255,0.05)',
                            borderRadius: '16px',
                            padding: '20px'
                        }}>
                            <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Database size={16} color="#10b981" />
                                API Pozivi
                            </h4>
                            <div style={{ marginBottom: '12px' }}>
                                <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>Ukupno</div>
                                <div style={{ fontSize: '20px', fontWeight: 700 }}>{stats.apiCalls.total}</div>
                            </div>
                            {Object.entries(stats.apiCalls.byProvider).map(([provider, count]) => (
                                <div key={provider} style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '11px', color: '#94a3b8' }}>{provider}</span>
                                    <span style={{ fontSize: '13px', fontWeight: 600 }}>{count}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Recent Activities */}
                    <div style={{
                        background: 'rgba(30, 41, 59, 0.5)',
                        border: '1px solid rgba(255,255,255,0.05)',
                        borderRadius: '16px',
                        padding: '24px'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                            <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Clock size={18} color="#3b82f6" />
                                Nedavne Aktivnosti ({filteredActivities.length})
                            </h4>
                            {selectedUser && (
                                <button
                                    onClick={() => setSelectedUser(null)}
                                    style={{
                                        padding: '6px 12px',
                                        borderRadius: '8px',
                                        fontSize: '11px',
                                        fontWeight: 600,
                                        background: 'rgba(239, 68, 68, 0.1)',
                                        color: '#ef4444',
                                        border: '1px solid rgba(239, 68, 68, 0.2)',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px'
                                    }}
                                >
                                    <X size={12} />
                                    Očisti Filter
                                </button>
                            )}
                        </div>

                        <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                            {filteredActivities.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                                    Nema aktivnosti za izabrani filter
                                </div>
                            ) : (
                                filteredActivities.map((activity) => (
                                    <div
                                        key={activity.id}
                                        style={{
                                            padding: '12px',
                                            borderBottom: '1px solid rgba(255,255,255,0.05)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px'
                                        }}
                                    >
                                        <div style={{
                                            width: '32px',
                                            height: '32px',
                                            borderRadius: '8px',
                                            background: `${getStatusColor(activity.status)}15`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: getStatusColor(activity.status),
                                            flexShrink: 0
                                        }}>
                                            {getActivityIcon(activity.activityType)}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '2px' }}>
                                                {activity.action}
                                            </div>
                                            <div style={{ fontSize: '10px', color: '#94a3b8' }}>
                                                {activity.userName || 'System'} • {activity.module} • {formatTime(activity.timestamp)}
                                            </div>
                                        </div>
                                        <div style={{
                                            padding: '4px 8px',
                                            borderRadius: '6px',
                                            fontSize: '10px',
                                            fontWeight: 600,
                                            background: `${getStatusColor(activity.status)}15`,
                                            color: getStatusColor(activity.status),
                                            border: `1px solid ${getStatusColor(activity.status)}30`
                                        }}>
                                            {activity.status}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}

            {/* NOTEPAD VIEW */}
            {viewMode === 'notepad' && (
                <div style={{
                    background: '#0f172a',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '16px',
                    padding: '24px',
                    fontFamily: 'Consolas, Monaco, "Courier New", monospace',
                    fontSize: '12px',
                    lineHeight: '1.6'
                }}>
                    <div style={{ marginBottom: '20px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <input
                            type="text"
                            placeholder="🔍 Pretraži aktivnosti..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{
                                flex: 1,
                                minWidth: '200px',
                                padding: '8px 12px',
                                borderRadius: '8px',
                                border: '1px solid rgba(255,255,255,0.1)',
                                background: 'rgba(30, 41, 59, 0.5)',
                                color: '#fff',
                                fontSize: '12px'
                            }}
                        />
                        <select
                            value={filterModule}
                            onChange={(e) => setFilterModule(e.target.value)}
                            style={{
                                padding: '8px 12px',
                                borderRadius: '8px',
                                border: '1px solid rgba(255,255,255,0.1)',
                                background: 'rgba(30, 41, 59, 0.5)',
                                color: '#fff',
                                fontSize: '12px'
                            }}
                        >
                            <option value="all">Svi Moduli</option>
                            {uniqueModules.map(m => <option key={m} value={m}>{m}</option>)}
                        </select>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            style={{
                                padding: '8px 12px',
                                borderRadius: '8px',
                                border: '1px solid rgba(255,255,255,0.1)',
                                background: 'rgba(30, 41, 59, 0.5)',
                                color: '#fff',
                                fontSize: '12px'
                            }}
                        >
                            <option value="all">Svi Statusi</option>
                            <option value="success">Success</option>
                            <option value="error">Error</option>
                            <option value="warning">Warning</option>
                        </select>
                    </div>

                    <div style={{ color: '#22c55e', marginBottom: '12px' }}>
                        ═══════════════════════════════════════════════════════════════════════════════
                    </div>
                    <div style={{ color: '#3b82f6', marginBottom: '12px', fontSize: '14px', fontWeight: 700 }}>
                        📝 CLICKTOTRAVEL HUB - ACTIVITY LOG VIEWER
                    </div>
                    <div style={{ color: '#94a3b8', marginBottom: '12px' }}>
                        Date: {selectedDate} | Total Entries: {filteredActivities.length}
                    </div>
                    <div style={{ color: '#22c55e', marginBottom: '20px' }}>
                        ═══════════════════════════════════════════════════════════════════════════════
                    </div>

                    <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                        {filteredActivities.map((activity, index) => (
                            <div key={activity.id} style={{ marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <div style={{ color: '#64748b', marginBottom: '4px' }}>
                                    [{index + 1}] {formatDateTime(activity.timestamp)}
                                </div>
                                <div style={{ display: 'flex', gap: '12px', marginBottom: '4px' }}>
                                    <span style={{ color: '#8b5cf6', fontWeight: 600 }}>USER:</span>
                                    <span style={{ color: '#fff' }}>{activity.userName || 'System'}</span>
                                </div>
                                <div style={{ display: 'flex', gap: '12px', marginBottom: '4px' }}>
                                    <span style={{ color: '#8b5cf6', fontWeight: 600 }}>MODULE:</span>
                                    <span style={{ color: '#3b82f6' }}>{activity.module}</span>
                                </div>
                                <div style={{ display: 'flex', gap: '12px', marginBottom: '4px' }}>
                                    <span style={{ color: '#8b5cf6', fontWeight: 600 }}>TYPE:</span>
                                    <span style={{ color: '#eab308' }}>{activity.activityType}</span>
                                </div>
                                <div style={{ display: 'flex', gap: '12px', marginBottom: '4px' }}>
                                    <span style={{ color: '#8b5cf6', fontWeight: 600 }}>STATUS:</span>
                                    <span style={{ color: getStatusColor(activity.status), fontWeight: 700 }}>
                                        {activity.status.toUpperCase()}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', gap: '12px', marginBottom: '4px' }}>
                                    <span style={{ color: '#8b5cf6', fontWeight: 600 }}>ACTION:</span>
                                    <span style={{ color: '#fff' }}>{activity.action}</span>
                                </div>
                                {activity.details && Object.keys(activity.details).length > 0 && (
                                    <div style={{ marginTop: '8px', paddingLeft: '20px' }}>
                                        <div style={{ color: '#64748b', marginBottom: '4px' }}>DETAILS:</div>
                                        <pre style={{ color: '#94a3b8', margin: 0, fontSize: '11px' }}>
                                            {JSON.stringify(activity.details, null, 2)}
                                        </pre>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    <div style={{ color: '#22c55e', marginTop: '20px' }}>
                        ═══════════════════════════════════════════════════════════════════════════════
                    </div>
                    <div style={{ color: '#64748b', marginTop: '12px', textAlign: 'center' }}>
                        End of Log • {filteredActivities.length} entries displayed
                    </div>
                </div>
            )}

            {/* ERRORS VIEW */}
            {viewMode === 'errors' && (
                <div style={{
                    background: 'rgba(30, 41, 59, 0.5)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    borderRadius: '16px',
                    padding: '24px'
                }}>
                    <h4 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444' }}>
                        <AlertCircle size={18} />
                        Greške i Upozorenja ({errorActivities.length})
                    </h4>

                    {errorActivities.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px' }}>
                            <CheckCircle size={48} color="#22c55e" style={{ margin: '0 auto 16px' }} />
                            <div style={{ fontSize: '16px', fontWeight: 600, color: '#22c55e' }}>Nema grešaka za izabrani datum! 🎉</div>
                        </div>
                    ) : (
                        <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                            {errorActivities.map((activity, index) => (
                                <div
                                    key={activity.id}
                                    style={{
                                        padding: '16px',
                                        marginBottom: '12px',
                                        background: 'rgba(239, 68, 68, 0.05)',
                                        border: '1px solid rgba(239, 68, 68, 0.2)',
                                        borderRadius: '12px'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', marginBottom: '12px' }}>
                                        <div style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '10px',
                                            background: 'rgba(239, 68, 68, 0.2)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: '#ef4444',
                                            flexShrink: 0,
                                            fontSize: '18px',
                                            fontWeight: 700
                                        }}>
                                            #{index + 1}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontSize: '14px', fontWeight: 700, color: '#ef4444', marginBottom: '4px' }}>
                                                {activity.action}
                                            </div>
                                            <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '8px' }}>
                                                {formatDateTime(activity.timestamp)} • {activity.userName || 'System'} • {activity.module}
                                            </div>
                                            {activity.details && (
                                                <div style={{
                                                    padding: '12px',
                                                    background: 'rgba(15, 23, 42, 0.5)',
                                                    borderRadius: '8px',
                                                    fontSize: '11px',
                                                    fontFamily: 'Consolas, Monaco, monospace',
                                                    color: '#94a3b8'
                                                }}>
                                                    <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>
                                                        {JSON.stringify(activity.details, null, 2)}
                                                    </pre>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
