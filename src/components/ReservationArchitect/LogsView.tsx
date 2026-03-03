import React, { useState } from 'react';
import { History, User, Clock, Info, AlertTriangle, CheckCircle, XCircle, MessageSquare, Search, Mail, Phone, MessageCircle, Send, Smartphone } from 'lucide-react';
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
            case 'success': return <CheckCircle size={16} className="success" />;
            case 'warning': return <AlertTriangle size={16} className="gold" />;
            case 'danger': return <XCircle size={16} className="danger" />;
            default: return <Info size={16} className="cyan" />;
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

    const getCommColor = (channel: string) => {
        switch (channel) {
            case 'email': return 'var(--fil-accent)';
            case 'viber': return '#7360f2';
            case 'whatsapp': return '#25D366';
            case 'telegram': return '#0088cc';
            case 'sms': return '#607d8b';
            case 'app': return '#FF7043';
            default: return 'var(--fil-text)';
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
        <div className="logs-view-v2">
            <div className="section-header">
                <div className="title">
                    <History size={20} className="cyan" />
                    <h3>ISTORIJA I KOMUNIKACIJA</h3>
                </div>
                <div className="view-tabs">
                    <button className={activeTab === 'logs' ? 'active' : ''} onClick={() => setActiveTab('logs')}>
                        <Info size={14} /> SISTEMSKI LOGOVI
                    </button>
                    <button className={activeTab === 'chat' ? 'active' : ''} onClick={() => setActiveTab('chat')}>
                        <MessageSquare size={14} /> CHAT ISTORIJA
                    </button>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {activeTab === 'logs' && (
                    <motion.div
                        key="logs"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="logs-timeline"
                    >
                        <div className="log-count glass">{dossier.logs.length} događaja</div>
                        {dossier.logs.length > 0 ? (
                            dossier.logs.map((log, index) => (
                                <motion.div
                                    key={log.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                    className="log-entry glass"
                                >
                                    <div className="log-marker">
                                        {getLogIcon(log.type)}
                                        <div className="line"></div>
                                    </div>
                                    <div className="log-content">
                                        <div className="log-item-header">
                                            <span className="action-badge">{log.action}</span>
                                            <span className="timestamp">
                                                <Clock size={12} /> {formatDate(log.timestamp)}
                                            </span>
                                        </div>
                                        <p className="details">{log.details}</p>
                                        <div className="operator">
                                            <User size={12} /> {log.operator}
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <div className="empty-logs glass">Nema zabeleženih aktivnosti za ovaj dosije.</div>
                        )}
                    </motion.div>
                )}

                {activeTab === 'chat' && (
                    <motion.div
                        key="chat"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="chat-history-container"
                    >
                        <div className="chat-filters-bar glass">
                            <div className="search-box">
                                <Search size={14} className="text-dim" />
                                <input
                                    type="text"
                                    placeholder="Pretraži poruke, subjekte ili kontakte..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <div className="channel-filters">
                                {['all', 'email', 'viber', 'whatsapp', 'telegram', 'sms', 'app'].map(f => (
                                    <button
                                        key={f}
                                        className={`filter-btn ${chatFilter === f ? 'active' : ''}`}
                                        onClick={() => setChatFilter(f as any)}
                                        style={chatFilter === f && f !== 'all' ? { borderColor: getCommColor(f), color: getCommColor(f) } : {}}
                                    >
                                        {f === 'all' ? 'SVI KANALI' : f.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="chat-messages-list">
                            {filteredComms.length > 0 ? (
                                filteredComms.map((comm) => (
                                    <div key={comm.id} className="chat-bubble-card glass" style={{ '--ch-color': getCommColor(comm.channel) } as any}>
                                        <div className="bubble-header">
                                            <div className="ch-info">
                                                <div className="ch-icon">
                                                    {getCommIcon(comm.channel)}
                                                </div>
                                                <span className="ch-name">{comm.channel.toUpperCase()}</span>
                                                <span className="ch-dir">{comm.direction === 'sent' ? 'POSLATO KA:' : 'PRIMLJENO OD:'} {comm.recipient}</span>
                                            </div>
                                            <div className="ch-time">{comm.timestamp}</div>
                                        </div>
                                        <div className="bubble-body">
                                            {comm.subject && <div className="b-subject">Predmet: {comm.subject}</div>}
                                            <div className="b-msg">{comm.message}</div>
                                        </div>
                                        <div className="bubble-footer">
                                            <CheckCircle size={12} style={{ color: comm.status === 'failed' ? 'var(--fil-danger)' : 'var(--fil-success)' }} />
                                            <span>{comm.status === 'sent' ? 'Poslato' : comm.status === 'failed' ? 'Greška pri slanju' : comm.status}</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="empty-logs glass">Nema zabeleženih poruka za odabrane kriterijume.</div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style>{`
                .logs-view-v2 {
                    display: flex;
                    flex-direction: column;
                    gap: 30px;
                    height: 100%;
                }
                .section-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                }
                .section-header .title {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                .section-header h3 {
                    margin: 0;
                    font-size: 14px;
                    font-weight: 900;
                    letter-spacing: 2px;
                }
                .view-tabs { display: flex; background: rgba(0,0,0,0.3); padding: 5px; border-radius: 12px; }
                .view-tabs button { padding: 8px 16px; border-radius: 8px; border: none; background: transparent; color: var(--fil-text-dim); font-size: 11px; font-weight: 800; display: flex; align-items: center; gap: 8px; cursor: pointer; transition: 0.2s; }
                .view-tabs button.active { background: var(--fil-accent); color: var(--fil-bg); }

                .log-count {
                    padding: 6px 14px;
                    border-radius: 12px;
                    font-size: 11px;
                    font-weight: 800;
                    color: var(--fil-text-dim);
                    width: fit-content;
                    margin-bottom: 20px;
                }
                .logs-timeline {
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                    position: relative;
                }
                .log-entry {
                    display: flex;
                    gap: 20px;
                    padding: 20px;
                    border-radius: 20px;
                    position: relative;
                }
                .log-marker {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 10px;
                    padding-top: 5px;
                }
                .log-marker .line {
                    width: 1px;
                    flex: 1;
                    background: var(--fil-border);
                }
                .log-item-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 8px;
                }
                .action-badge {
                    font-size: 11px;
                    font-weight: 900;
                    color: var(--fil-accent);
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }
                .timestamp {
                    font-size: 11px;
                    color: var(--fil-text-dim);
                    display: flex;
                    align-items: center;
                    gap: 5px;
                }
                .details {
                    font-size: 13px;
                    color: var(--fil-text);
                    margin: 0 0 10px 0;
                    line-height: 1.5;
                }
                .operator {
                    font-size: 11px;
                    color: var(--fil-text-dim);
                    display: flex;
                    align-items: center;
                    gap: 6px;
                    font-weight: 700;
                }
                .empty-logs {
                    padding: 40px;
                    text-align: center;
                    font-style: italic;
                    color: var(--fil-text-dim);
                    border-radius: 20px;
                }

                /* Chat History Styles */
                .chat-history-container { display: flex; flex-direction: column; gap: 20px; height: 100%; }
                .chat-filters-bar { padding: 15px 20px; border-radius: 20px; display: flex; flex-direction: column; gap: 15px; }
                .search-box { display: flex; align-items: center; gap: 10px; background: rgba(0,0,0,0.3); padding: 15px 20px; border-radius: 12px; border: 1px solid var(--fil-border); }
                .search-box input { background: transparent; border: none; color: var(--fil-text); outline: none; width: 100%; font-size: 14px; }
                .channel-filters { display: flex; flex-wrap: wrap; gap: 8px; }
                .filter-btn { padding: 6px 12px; border-radius: 10px; border: 1px solid var(--fil-border); background: transparent; color: var(--fil-text-dim); font-size: 10px; font-weight: 900; cursor: pointer; transition: 0.2s; }
                .filter-btn:hover { background: rgba(255,255,255,0.05); }
                .filter-btn.active { background: rgba(0,0,0,0.4); color: var(--fil-text); border-color: var(--fil-text); }

                .chat-messages-list { display: flex; flex-direction: column; gap: 15px; overflow-y: auto; padding-right: 10px; }
                .chat-messages-list::-webkit-scrollbar { width: 6px; }
                .chat-messages-list::-webkit-scrollbar-thumb { background: var(--fil-border); border-radius: 10px; }
                .chat-bubble-card { padding: 20px; border-radius: 20px; border-left: 4px solid var(--ch-color); display: flex; flex-direction: column; gap: 12px; transition: 0.2s; }
                .chat-bubble-card:hover { transform: translateX(4px); background: rgba(255,255,255,0.03); }
                .bubble-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 12px; }
                .ch-info { display: flex; align-items: center; gap: 10px; }
                .ch-icon { color: var(--ch-color); display: flex; align-items: center; }
                .ch-name { font-size: 11px; font-weight: 900; color: var(--ch-color); letter-spacing: 1px; }
                .ch-dir { font-size: 10px; font-weight: 700; color: var(--fil-text-dim); background: rgba(0,0,0,0.3); padding: 4px 8px; border-radius: 6px; }
                .ch-time { font-size: 10px; color: var(--fil-text-dim); font-weight: 700; }
                
                .bubble-body { padding: 5px 0; }
                .b-subject { font-size: 11px; font-weight: 900; color: var(--fil-text); margin-bottom: 8px; }
                .b-msg { font-size: 13px; line-height: 1.6; color: rgba(255,255,255,0.85); white-space: pre-wrap; }
                
                .bubble-footer { display: flex; align-items: center; gap: 6px; font-size: 9px; font-weight: 800; color: var(--fil-text-dim); text-transform: uppercase; margin-top: 5px; }
            `}</style>
        </div>
    );
};

