import React, { useState } from 'react';
import { History, User, Clock, Info, AlertTriangle, CheckCircle, XCircle, MessageSquare, Search, Mail, Phone, MessageCircle, Send, Smartphone, Terminal, MessagesSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Dossier, ActivityLog, CommunicationRecord } from '../../types/reservationArchitect';
import { formatDate } from '../../utils/dateUtils';

interface LogsViewProps {
    dossier: Dossier;
}

export const LogsView: React.FC<LogsViewProps> = ({ dossier }) => {
    const [activeTab, setActiveTab] = useState<'logs' | 'chat'>('logs');
    const [chatFilter, setChatFilter] = useState<'all' | 'email' | 'viber' | 'whatsapp' | 'telegram' | 'sms' | 'app'>('all');
    const [searchQuery, setSearchQuery] = useState('');

    const getLogIcon = (type: ActivityLog['type']) => {
        switch (type) {
            case 'success': return <CheckCircle size={16} />;
            case 'warning': return <AlertTriangle size={16} />;
            case 'danger': return <XCircle size={16} />;
            default: return <Info size={16} />;
        }
    };

    const getCommIcon = (channel: string) => {
        switch (channel) {
            case 'email': return <Mail size={16} />;
            case 'viber': return <Phone size={16} />;
            case 'whatsapp': return <MessageCircle size={16} />;
            case 'telegram': return <Send size={16} />;
            case 'sms': return <MessageSquare size={16} />;
            case 'app': return <Smartphone size={16} />;
            default: return <MessageSquare size={16} />;
        }
    };

    const filteredComms = (dossier.communications || [])
        .filter(c => chatFilter === 'all' || c.channel === chatFilter)
        .filter(c => !searchQuery ||
            c.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (c.subject && c.subject.toLowerCase().includes(searchQuery.toLowerCase())) ||
            c.recipient.toLowerCase().includes(searchQuery.toLowerCase())
        );

    return (
        <div className="v4-logs-view" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <History size={22} className="cyan-text" />
                    <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 950, letterSpacing: '1px' }}>AUDIT & KOMUNIKACIJA</h3>
                </div>

                <div className="v4-nav-tabs" style={{ marginBottom: 0 }}>
                    <button className={`v4-tab-btn ${activeTab === 'logs' ? 'active' : ''}`} onClick={() => setActiveTab('logs')}>
                        <Terminal size={18} /> SISTEMSKI LOGOVI
                    </button>
                    <button className={`v4-tab-btn ${activeTab === 'chat' ? 'active' : ''}`} onClick={() => setActiveTab('chat')}>
                        <MessagesSquare size={18} /> ISTORIJA CHATA
                    </button>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {activeTab === 'logs' ? (
                    <motion.div key="logs" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ fontSize: '11px', fontWeight: 900, color: 'var(--text-secondary)', letterSpacing: '1px', marginBottom: '8px' }}>
                            <span className="cyan-text">{dossier.logs.length}</span> REGISTROVANIH DOGAĐAJA U SISTEMU
                        </div>

                        {dossier.logs.map((log, index) => (
                            <div key={log.id} style={{ display: 'flex', gap: '20px' }}>
                                <div style={{
                                    width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: log.type === 'success' ? '#10b981' : log.type === 'danger' ? '#ef4444' : log.type === 'warning' ? '#fbbf24' : 'var(--accent-cyan)',
                                    flexShrink: 0
                                }}>
                                    {getLogIcon(log.type)}
                                </div>
                                <div className="v4-table-card" style={{ flex: 1, padding: '20px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                                        <div style={{ fontSize: '11px', fontWeight: 950, letterSpacing: '1px', textTransform: 'uppercase', color: 'var(--text-primary)' }}>{log.action}</div>
                                        <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)', display: 'flex', gap: '4px', alignItems: 'center' }}>
                                            <Clock size={12} /> {formatDate(log.timestamp)}
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '12px' }}>{log.details}</div>
                                    <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '10px', fontSize: '10px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 900 }}>
                                        <User size={12} /> {log.operator}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </motion.div>
                ) : (
                    <motion.div key="chat" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div className="v4-table-card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ position: 'relative' }}>
                                <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                                <input
                                    className="v4-input"
                                    style={{ width: '100%', paddingLeft: '48px', height: '48px' }}
                                    placeholder="Pretraži prepisku..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                {['all', 'email', 'viber', 'whatsapp', 'telegram', 'sms', 'app'].map(f => (
                                    <button
                                        key={f}
                                        className={`v4-chip ${chatFilter === f ? 'active' : ''}`}
                                        onClick={() => setChatFilter(f as any)}
                                        style={{
                                            padding: '6px 16px', borderRadius: '100px', border: '1px solid var(--glass-border)',
                                            background: chatFilter === f ? 'var(--text-primary)' : 'transparent',
                                            color: chatFilter === f ? 'var(--bg-dark)' : 'var(--text-secondary)',
                                            fontSize: '11px', fontWeight: 900, cursor: 'pointer', transition: '0.2s'
                                        }}
                                    >
                                        {f === 'all' ? 'SVI KANALI' : f.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            {filteredComms.map((comm) => (
                                <div key={comm.id} className="v4-table-card" style={{ padding: '24px', borderLeft: `4px solid ${comm.channel === 'email' ? 'var(--accent-cyan)' : comm.channel === 'viber' ? '#a855f7' : '#10b981'}` }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)' }}>
                                                {getCommIcon(comm.channel)}
                                            </div>
                                            <div style={{ fontSize: '11px', fontWeight: 950, letterSpacing: '1px', color: 'var(--text-primary)' }}>{comm.channel.toUpperCase()}</div>
                                            <div className="v4-status-pill success" style={{ transform: 'scale(0.8)' }}>{comm.recipient}</div>
                                        </div>
                                        <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary)' }}>{comm.timestamp}</div>
                                    </div>
                                    {comm.subject && <div style={{ fontSize: '14px', fontWeight: 900, color: 'var(--text-primary)', marginBottom: '12px', paddingBottom: '8px', borderBottom: '1px solid var(--glass-border)' }}>Subj: {comm.subject}</div>}
                                    <div style={{ fontSize: '15px', color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{comm.message}</div>
                                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                                        <div className="v4-status-pill" style={{ background: 'rgba(255,255,255,0.05)', fontSize: '10px' }}>STATUS: {comm.status.toUpperCase()}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
