import { useState, useEffect } from 'react';
import { Activity, TrendingUp, Zap, DollarSign, AlertCircle, Download, Settings, Mail, Send } from 'lucide-react';
import { quotaNotificationService } from '../../services/quotaNotificationService';
import { aiRateLimiter } from '../../services/aiRateLimiter';
import { aiCache } from '../../services/aiCache';
import { multiKeyAI } from '../../services/multiKeyAI';

interface QuotaData {
    provider: 'Google Gemini' | 'OpenAI' | 'Claude';
    icon: string;
    color: string;
    dailyLimit: number;
    dailyUsed: number;
    weeklyUsed: number;
    monthlyUsed: number;
    avgPerRequest: number;
    lastReset: string;
    nextReset: string;
}

export default function AIQuotaDashboard() {
    const [showSettings, setShowSettings] = useState(false);
    const [telegramToken, setTelegramToken] = useState('');
    const [telegramChatId, setTelegramChatId] = useState('');
    const [emailEnabled, setEmailEnabled] = useState(true);
    const [telegramEnabled, setTelegramEnabled] = useState(false);

    const [quotaData, setQuotaData] = useState<QuotaData[]>([
        {
            provider: 'Google Gemini',
            icon: '🤖',
            color: '#3b82f6',
            dailyLimit: 1000000,
            dailyUsed: 0,
            weeklyUsed: 0,
            monthlyUsed: 0,
            avgPerRequest: 0,
            lastReset: new Date().toISOString(),
            nextReset: new Date(new Date().setHours(24, 0, 0, 0)).toISOString()
        },
        {
            provider: 'OpenAI',
            icon: '🔮',
            color: '#10b981',
            dailyLimit: 500000,
            dailyUsed: 0,
            weeklyUsed: 0,
            monthlyUsed: 0,
            avgPerRequest: 0,
            lastReset: new Date().toISOString(),
            nextReset: new Date(new Date().setHours(24, 0, 0, 0)).toISOString()
        },
        {
            provider: 'Claude',
            icon: '🧠',
            color: '#8b5cf6',
            dailyLimit: 750000,
            dailyUsed: 0,
            weeklyUsed: 0,
            monthlyUsed: 0,
            avgPerRequest: 0,
            lastReset: new Date().toISOString(),
            nextReset: new Date(new Date().setHours(24, 0, 0, 0)).toISOString()
        }
    ]);

    // Load notification settings
    useEffect(() => {
        const config = localStorage.getItem('notification_config');
        if (config) {
            const parsed = JSON.parse(config);
            setTelegramToken(parsed.telegramBotToken || '');
            setTelegramChatId(parsed.telegramChatId || '');
            setEmailEnabled(parsed.enableEmail !== false);
            setTelegramEnabled(parsed.enableTelegram || false);
        }
    }, []);

    // Load quota data from localStorage
    useEffect(() => {
        const loadQuotaData = () => {
            const geminiData = localStorage.getItem('ai_quota_gemini');
            const openaiData = localStorage.getItem('ai_quota_openai');
            const claudeData = localStorage.getItem('ai_quota_claude');

            setQuotaData(prev => prev.map(provider => {
                let savedData = null;
                if (provider.provider === 'Google Gemini' && geminiData) {
                    savedData = JSON.parse(geminiData);
                } else if (provider.provider === 'OpenAI' && openaiData) {
                    savedData = JSON.parse(openaiData);
                } else if (provider.provider === 'Claude' && claudeData) {
                    savedData = JSON.parse(claudeData);
                }

                return savedData ? { ...provider, ...savedData } : provider;
            }));
        };

        loadQuotaData();
        // Refresh every 10 seconds
        const interval = setInterval(loadQuotaData, 10000);
        return () => clearInterval(interval);
    }, []);

    const handleExportCSV = () => {
        quotaNotificationService.exportToCSV(quotaData);
    };

    const handleAutoDetectChatId = async () => {
        if (!telegramToken) {
            alert('⚠️ Molim vas prvo unesite Bot Token!');
            return;
        }

        try {
            const url = `https://api.telegram.org/bot${telegramToken}/getUpdates`;
            const response = await fetch(url);
            const data = await response.json();

            if (data.ok && data.result.length > 0) {
                const uniqueChats = new Map();

                data.result.forEach((update: any) => {
                    if (update.message && update.message.chat) {
                        const chat = update.message.chat;
                        const chatId = chat.id;

                        if (!uniqueChats.has(chatId)) {
                            uniqueChats.set(chatId, {
                                id: chatId,
                                firstName: chat.first_name || '',
                                lastName: chat.last_name || '',
                                username: chat.username || '',
                                type: chat.type
                            });
                        }
                    }
                });

                if (uniqueChats.size > 0) {
                    const firstChat = Array.from(uniqueChats.values())[0];
                    setTelegramChatId(firstChat.id.toString());
                    alert(`✅ Chat ID pronađen!\n\n👤 ${firstChat.firstName} ${firstChat.lastName}\n📱 Chat ID: ${firstChat.id}\n\nSada kliknite "Save Settings"!`);
                } else {
                    alert('❌ Nema pronađenih chat-ova.\n\n📱 Molim vas pošaljite /start vašem botu prvo!');
                }
            } else {
                alert('❌ Nema poruka.\n\n📱 Molim vas pošaljite /start vašem botu!');
            }
        } catch (error) {
            console.error('Error detecting chat ID:', error);
            alert('❌ Greška pri detekciji Chat ID-a. Proverite Bot Token.');
        }
    };

    const handleSaveSettings = () => {
        quotaNotificationService.updateConfig({
            telegramBotToken: telegramToken,
            telegramChatId: telegramChatId,
            enableEmail: emailEnabled,
            enableTelegram: telegramEnabled
        });
        setShowSettings(false);
        alert('✅ Notification settings saved!');
    };

    const getPercentage = (used: number, limit: number) => {
        return Math.min((used / limit) * 100, 100);
    };

    const getStatusColor = (percentage: number) => {
        if (percentage < 50) return '#22c55e';
        if (percentage < 80) return '#eab308';
        return '#ef4444';
    };

    const formatNumber = (num: number) => {
        if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
        if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
        return num.toString();
    };

    const getTimeUntilReset = (nextReset: string) => {
        const now = new Date();
        const reset = new Date(nextReset);
        const diff = reset.getTime() - now.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
    };

    return (
        <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <h3 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>AI Quota Dashboard</h3>
                    <p style={{ fontSize: '13px', color: '#94a3b8', margin: '4px 0 0' }}>
                        Real-time token usage tracking for all AI providers
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
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
                    <button
                        onClick={() => setShowSettings(!showSettings)}
                        style={{
                            padding: '8px 16px',
                            borderRadius: '10px',
                            fontSize: '12px',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: 'rgba(139, 92, 246, 0.1)',
                            color: '#8b5cf6',
                            border: '1px solid rgba(139, 92, 246, 0.2)',
                            cursor: 'pointer'
                        }}
                    >
                        <Settings size={14} />
                        Notifications
                    </button>
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
                </div>
            </div>

            {/* Notification Settings Panel */}
            {showSettings && (
                <div style={{
                    background: 'rgba(30, 41, 59, 0.5)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: '16px',
                    padding: '24px',
                    marginBottom: '20px'
                }}>
                    <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: 700 }}>🔔 Notification Settings</h4>

                    {/* Email Settings */}
                    <div style={{ marginBottom: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                            <input
                                type="checkbox"
                                checked={emailEnabled}
                                onChange={(e) => setEmailEnabled(e.target.checked)}
                                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                            />
                            <Mail size={16} color="#3b82f6" />
                            <span style={{ fontWeight: 600 }}>Email Notifications</span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#94a3b8', marginLeft: '28px' }}>
                            Sending to: <strong>nenad.tomic@olympic.rs</strong>
                        </div>
                    </div>

                    {/* Telegram Settings */}
                    <div style={{ marginBottom: '20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                            <input
                                type="checkbox"
                                checked={telegramEnabled}
                                onChange={(e) => setTelegramEnabled(e.target.checked)}
                                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                            />
                            <Send size={16} color="#3b82f6" />
                            <span style={{ fontWeight: 600 }}>Telegram Notifications</span>
                        </div>
                        <div style={{ marginLeft: '28px', display: 'grid', gap: '10px' }}>
                            <input
                                type="text"
                                placeholder="Bot Token (123456789:ABCdef...)"
                                value={telegramToken}
                                onChange={(e) => setTelegramToken(e.target.value)}
                                disabled={!telegramEnabled}
                                style={{
                                    padding: '10px 12px',
                                    borderRadius: '8px',
                                    background: 'rgba(15, 23, 42, 0.6)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    color: '#fff',
                                    fontSize: '12px',
                                    opacity: telegramEnabled ? 1 : 0.5
                                }}
                            />
                            <input
                                type="text"
                                placeholder="Chat ID (123456789)"
                                value={telegramChatId}
                                onChange={(e) => setTelegramChatId(e.target.value)}
                                disabled={!telegramEnabled}
                                style={{
                                    padding: '10px 12px',
                                    borderRadius: '8px',
                                    background: 'rgba(15, 23, 42, 0.6)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    color: '#fff',
                                    fontSize: '12px',
                                    opacity: telegramEnabled ? 1 : 0.5
                                }}
                            />
                            <button
                                onClick={handleAutoDetectChatId}
                                disabled={!telegramEnabled || !telegramToken}
                                style={{
                                    padding: '10px 16px',
                                    borderRadius: '8px',
                                    background: telegramEnabled && telegramToken ? 'rgba(34, 197, 94, 0.1)' : 'rgba(255,255,255,0.05)',
                                    color: telegramEnabled && telegramToken ? '#22c55e' : '#64748b',
                                    border: `1px solid ${telegramEnabled && telegramToken ? 'rgba(34, 197, 94, 0.2)' : 'rgba(255,255,255,0.1)'}`,
                                    cursor: telegramEnabled && telegramToken ? 'pointer' : 'not-allowed',
                                    fontSize: '12px',
                                    fontWeight: 600,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    justifyContent: 'center',
                                    opacity: telegramEnabled && telegramToken ? 1 : 0.5
                                }}
                            >
                                <Zap size={14} />
                                Auto-Detect Chat ID
                            </button>
                            <div style={{ fontSize: '11px', color: '#64748b' }}>
                                📱 Prvo pošaljite <strong>/start</strong> vašem botu, pa kliknite Auto-Detect
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleSaveSettings}
                        style={{
                            padding: '10px 20px',
                            borderRadius: '10px',
                            background: '#3b82f6',
                            color: '#fff',
                            border: 'none',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: '13px'
                        }}
                    >
                        Save Settings
                    </button>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px' }}>
                {quotaData.map((provider) => {
                    const dailyPercentage = getPercentage(provider.dailyUsed, provider.dailyLimit);
                    const statusColor = getStatusColor(dailyPercentage);

                    return (
                        <div
                            key={provider.provider}
                            style={{
                                background: 'rgba(30, 41, 59, 0.5)',
                                border: '1px solid rgba(255,255,255,0.05)',
                                borderRadius: '16px',
                                padding: '24px',
                                position: 'relative',
                                overflow: 'hidden'
                            }}
                        >
                            {/* Header */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{
                                        width: '48px',
                                        height: '48px',
                                        borderRadius: '12px',
                                        background: `${provider.color}15`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '24px'
                                    }}>
                                        {provider.icon}
                                    </div>
                                    <div>
                                        <div style={{ fontWeight: 700, fontSize: '16px' }}>{provider.provider}</div>
                                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                                            Resets in {getTimeUntilReset(provider.nextReset)}
                                        </div>
                                    </div>
                                </div>
                                <div style={{
                                    padding: '4px 10px',
                                    borderRadius: '20px',
                                    fontSize: '10px',
                                    fontWeight: 700,
                                    background: `${statusColor}15`,
                                    color: statusColor,
                                    border: `1px solid ${statusColor}30`
                                }}>
                                    {dailyPercentage.toFixed(1)}%
                                </div>
                            </div>

                            {/* Daily Usage Bar */}
                            <div style={{ marginBottom: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>Daily Usage</span>
                                    <span style={{ fontSize: '12px', fontWeight: 600 }}>
                                        {formatNumber(provider.dailyUsed)} / {formatNumber(provider.dailyLimit)}
                                    </span>
                                </div>
                                <div style={{
                                    height: '8px',
                                    background: 'rgba(255,255,255,0.05)',
                                    borderRadius: '4px',
                                    overflow: 'hidden'
                                }}>
                                    <div style={{
                                        width: `${dailyPercentage}%`,
                                        height: '100%',
                                        background: `linear-gradient(90deg, ${provider.color}, ${statusColor})`,
                                        transition: 'width 0.3s ease',
                                        borderRadius: '4px'
                                    }} />
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                                <div style={{
                                    background: 'rgba(255,255,255,0.02)',
                                    padding: '12px',
                                    borderRadius: '10px',
                                    border: '1px solid rgba(255,255,255,0.05)'
                                }}>
                                    <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <TrendingUp size={12} /> Weekly
                                    </div>
                                    <div style={{ fontSize: '16px', fontWeight: 700 }}>{formatNumber(provider.weeklyUsed)}</div>
                                </div>
                                <div style={{
                                    background: 'rgba(255,255,255,0.02)',
                                    padding: '12px',
                                    borderRadius: '10px',
                                    border: '1px solid rgba(255,255,255,0.05)'
                                }}>
                                    <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Zap size={12} /> Monthly
                                    </div>
                                    <div style={{ fontSize: '16px', fontWeight: 700 }}>{formatNumber(provider.monthlyUsed)}</div>
                                </div>
                            </div>

                            {/* Average per request */}
                            <div style={{
                                background: `${provider.color}10`,
                                padding: '10px 12px',
                                borderRadius: '8px',
                                border: `1px solid ${provider.color}20`,
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center'
                            }}>
                                <div style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <DollarSign size={12} /> Avg per request
                                </div>
                                <div style={{ fontSize: '13px', fontWeight: 700, color: provider.color }}>
                                    ~{provider.avgPerRequest > 0 ? formatNumber(provider.avgPerRequest) : '0'} tokens
                                </div>
                            </div>

                            {/* Warning if high usage */}
                            {dailyPercentage > 80 && (
                                <div style={{
                                    marginTop: '12px',
                                    padding: '10px',
                                    background: 'rgba(239, 68, 68, 0.1)',
                                    border: '1px solid rgba(239, 68, 68, 0.2)',
                                    borderRadius: '8px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    fontSize: '11px',
                                    color: '#f87171'
                                }}>
                                    <AlertCircle size={14} />
                                    High usage detected! Consider optimizing prompts.
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Advanced Statistics Panel */}
            <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
                {/* Rate Limiter Stats */}
                <div style={{
                    background: 'rgba(30, 41, 59, 0.5)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: '16px',
                    padding: '20px'
                }}>
                    <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Activity size={16} color="#3b82f6" />
                        Rate Limiter Status
                    </h4>
                    {(() => {
                        const stats = aiRateLimiter.getUsageStats();
                        return (
                            <>
                                <div style={{ marginBottom: '12px' }}>
                                    <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>Requests Per Minute</div>
                                    <div style={{ fontSize: '20px', fontWeight: 700 }}>{stats.requestsPerMinute} / 15</div>
                                    <div style={{
                                        height: '4px',
                                        background: 'rgba(255,255,255,0.05)',
                                        borderRadius: '2px',
                                        marginTop: '6px',
                                        overflow: 'hidden'
                                    }}>
                                        <div style={{
                                            width: `${(stats.requestsPerMinute / 15) * 100}%`,
                                            height: '100%',
                                            background: stats.requestsPerMinute > 12 ? '#ef4444' : '#3b82f6',
                                            transition: 'width 0.3s ease'
                                        }} />
                                    </div>
                                </div>
                                <div style={{ marginBottom: '12px' }}>
                                    <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>Requests Today</div>
                                    <div style={{ fontSize: '20px', fontWeight: 700 }}>{stats.requestsToday.toLocaleString()} / 3,000</div>
                                    <div style={{
                                        height: '4px',
                                        background: 'rgba(255,255,255,0.05)',
                                        borderRadius: '2px',
                                        marginTop: '6px',
                                        overflow: 'hidden'
                                    }}>
                                        <div style={{
                                            width: `${stats.percentageUsed}%`,
                                            height: '100%',
                                            background: stats.percentageUsed > 80 ? '#ef4444' : stats.percentageUsed > 50 ? '#eab308' : '#22c55e',
                                            transition: 'width 0.3s ease'
                                        }} />
                                    </div>
                                </div>
                                <div style={{
                                    padding: '8px 12px',
                                    borderRadius: '8px',
                                    background: stats.canMakeRequest ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                    border: `1px solid ${stats.canMakeRequest ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`,
                                    fontSize: '11px',
                                    color: stats.canMakeRequest ? '#22c55e' : '#ef4444',
                                    fontWeight: 600
                                }}>
                                    {stats.canMakeRequest ? '✅ Ready to send requests' : '⏸️ Rate limit reached, queuing...'}
                                </div>
                            </>
                        );
                    })()}
                </div>

                {/* Cache Stats */}
                <div style={{
                    background: 'rgba(30, 41, 59, 0.5)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: '16px',
                    padding: '20px'
                }}>
                    <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Zap size={16} color="#8b5cf6" />
                        Cache Performance
                    </h4>
                    {(() => {
                        const stats = aiCache.getStats();
                        const size = aiCache.getCacheSize();
                        return (
                            <>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                                    <div>
                                        <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>Hit Rate</div>
                                        <div style={{ fontSize: '20px', fontWeight: 700, color: '#8b5cf6' }}>{stats.hitRate.toFixed(1)}%</div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>Tokens Saved</div>
                                        <div style={{ fontSize: '20px', fontWeight: 700, color: '#22c55e' }}>{formatNumber(stats.tokensSaved)}</div>
                                    </div>
                                </div>
                                <div style={{ marginBottom: '12px' }}>
                                    <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>Cache Entries: {size.entries} ({size.estimatedKB} KB)</div>
                                    <div style={{ fontSize: '10px', color: '#64748b' }}>
                                        Hits: {stats.hits} | Misses: {stats.misses}
                                    </div>
                                </div>
                                <div style={{
                                    padding: '8px 12px',
                                    borderRadius: '8px',
                                    background: 'rgba(139, 92, 246, 0.1)',
                                    border: '1px solid rgba(139, 92, 246, 0.2)',
                                    fontSize: '11px',
                                    color: '#8b5cf6',
                                    fontWeight: 600
                                }}>
                                    💾 Saving ~{Math.round(stats.hitRate)}% API calls
                                </div>
                            </>
                        );
                    })()}
                </div>

                {/* Multi-Key Status */}
                <div style={{
                    background: 'rgba(30, 41, 59, 0.5)',
                    border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: '16px',
                    padding: '20px'
                }}>
                    <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Settings size={16} color="#10b981" />
                        API Keys Status
                    </h4>
                    {(() => {
                        const keys = multiKeyAI.getKeysStatus();
                        return (
                            <>
                                {keys.map((key, index) => (
                                    <div key={index} style={{
                                        padding: '10px 12px',
                                        borderRadius: '8px',
                                        background: 'rgba(255,255,255,0.02)',
                                        border: '1px solid rgba(255,255,255,0.05)',
                                        marginBottom: '8px'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <div style={{ fontSize: '12px', fontWeight: 600 }}>{key.name}</div>
                                                <div style={{ fontSize: '10px', color: '#64748b' }}>Priority: {key.priority}</div>
                                            </div>
                                            <div style={{
                                                padding: '4px 8px',
                                                borderRadius: '6px',
                                                fontSize: '10px',
                                                fontWeight: 600,
                                                background: key.enabled ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                                color: key.enabled ? '#22c55e' : '#ef4444',
                                                border: `1px solid ${key.enabled ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
                                            }}>
                                                {key.status}
                                            </div>
                                        </div>
                                        {key.failureCount > 0 && (
                                            <div style={{ fontSize: '10px', color: '#f87171', marginTop: '4px' }}>
                                                ⚠️ Failures: {key.failureCount}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </>
                        );
                    })()}
                </div>
            </div>

            {/* Info Card */}
            <div style={{
                marginTop: '20px',
                background: 'rgba(59, 130, 246, 0.05)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                borderRadius: '12px',
                padding: '16px',
                fontSize: '12px',
                color: '#94a3b8'
            }}>
                <div style={{ fontWeight: 700, color: '#3b82f6', marginBottom: '8px' }}>ℹ️ How Quota Tracking Works</div>
                <ul style={{ margin: 0, paddingLeft: '20px' }}>
                    <li>Tokens are counted automatically when you use AI Chat</li>
                    <li>Daily limits reset at midnight (local time)</li>
                    <li>Free tier limits: Gemini (1M), OpenAI (500K), Claude (750K)</li>
                    <li>Data is stored locally in your browser</li>
                </ul>
            </div>
        </div>
    );
}
