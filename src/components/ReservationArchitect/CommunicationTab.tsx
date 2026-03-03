import React, { useState, useRef } from 'react';
import { Mail, MessageCircle, History, Info, Send, User, Phone, Share2, Smartphone, Paperclip, X, Image as ImageIcon, FileText, QrCode, ShieldCheck, Zap, Bell, CheckCircle2, AlertCircle, MessageSquare, Search, Sparkles, Terminal, ArrowUpRight } from 'lucide-react';
import type { Dossier, ActivityLog, CommunicationRecord } from '../../types/reservationArchitect';
import { motion, AnimatePresence } from 'framer-motion';

interface CommunicationTabProps {
    dossier: Dossier;
    addLog: (title: string, message: string, type: ActivityLog['type']) => void;
    addCommunication: (record: Omit<CommunicationRecord, 'id' | 'timestamp'>) => void;
    onOpenEmailModal?: () => void;
}

type CommChannel = 'email' | 'viber' | 'whatsapp' | 'telegram' | 'app' | 'sms';

export const CommunicationTab: React.FC<CommunicationTabProps> = ({ dossier, addLog, addCommunication, onOpenEmailModal }) => {
    const isSubagent = dossier.customerType === 'B2B-Subagent';
    const [activeChannel, setActiveChannel] = useState<CommChannel>('email');

    // Form States
    const [subject, setSubject] = useState(isSubagent ? '' : `Informacije o vašoj rezervaciji - ${dossier.resCode || dossier.cisCode}`);
    const [message, setMessage] = useState('');
    const [phoneNumber, setPhoneNumber] = useState(dossier.booker.phone || '');
    const [attachments, setAttachments] = useState<File[]>([]);
    const [isScanning, setIsScanning] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSend = () => {
        let target = activeChannel === 'email' ? dossier.booker.email : phoneNumber;

        addCommunication({
            channel: activeChannel,
            direction: 'sent',
            subject: activeChannel === 'email' ? subject : undefined,
            message,
            recipient: target,
            status: 'sent'
        });

        if (activeChannel === 'whatsapp') {
            window.open(`https://wa.me/${phoneNumber.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
        }

        setMessage('');
        setAttachments([]);
    };

    const channels = [
        { id: 'email', label: 'Email', icon: <Mail size={18} />, color: 'var(--accent-cyan)' },
        { id: 'viber', label: 'Viber', icon: <Phone size={18} />, color: '#a855f7' },
        { id: 'whatsapp', label: 'WhatsApp', icon: <MessageCircle size={18} />, color: '#22c55e' },
        { id: 'telegram', label: 'Telegram', icon: <Send size={18} />, color: '#3b82f6' },
        { id: 'sms', label: 'SMS', icon: <MessageSquare size={18} />, color: '#eab308' },
        { id: 'app', label: 'Mobilna App', icon: <Smartphone size={18} />, color: '#ef4444' }
    ];

    return (
        <div className="v4-communication-tab" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

            {/* Channel Selector mimicking Nav Tabs */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div className="v4-nav-tabs" style={{ marginBottom: 0 }}>
                    {channels.map(ch => (
                        <button
                            key={ch.id}
                            className={`v4-tab-btn ${activeChannel === ch.id ? 'active' : ''}`}
                            onClick={() => setActiveChannel(ch.id as CommChannel)}
                            style={activeChannel === ch.id ? { background: ch.color, color: '#000' } : {}}
                        >
                            {ch.icon} {ch.label}
                        </button>
                    ))}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: '32px' }}>

                {/* Composer Card */}
                <div className="v4-table-card" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(255,255,255,0.05)', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {channels.find(c => c.id === activeChannel)?.icon}
                        </div>
                        <div>
                            <div className="v4-label" style={{ fontSize: '10px' }}>SENDING VIA {activeChannel.toUpperCase()}</div>
                            <div className="v4-text-main" style={{ fontSize: '18px' }}>TO: {activeChannel === 'email' ? dossier.booker.email : phoneNumber}</div>
                        </div>
                    </div>

                    {activeChannel === 'email' && (
                        <div className="v4-input-group">
                            <label className="v4-label">NASLOV PORUKE / SUBJECT</label>
                            <input
                                className="v4-input"
                                value={subject}
                                onChange={e => setSubject(e.target.value)}
                                placeholder="Unesite naslov email-a..."
                            />
                        </div>
                    )}

                    <div className="v4-input-group">
                        <label className="v4-label">SADRŽAJ PORUKE</label>
                        <textarea
                            className="v4-input"
                            style={{ minHeight: '300px', resize: 'vertical', fontFamily: 'monospace' }}
                            value={message}
                            onChange={e => setMessage(e.target.value)}
                            placeholder={`Unesite tekst ${activeChannel} poruke...`}
                        />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', borderTop: '1px solid var(--glass-border)' }}>
                        <div style={{ display: 'flex', gap: '12px' }}>
                            <button className="v4-tab-btn" style={{ background: 'var(--bg-secondary)', width: '40px', padding: 0, justifyContent: 'center' }} onClick={() => fileInputRef.current?.click()}>
                                <Paperclip size={18} />
                            </button>
                            <input type="file" ref={fileInputRef} hidden multiple onChange={() => { }} />
                            {isScanning && <div style={{ fontSize: '10px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}><ShieldCheck size={14} /> SCAN OK</div>}
                        </div>
                        <button className="v4-tab-btn active" style={{ height: '44px', padding: '0 32px' }} disabled={!message.trim()} onClick={handleSend}>
                            POŠALJI ODMAH <Send size={18} />
                        </button>
                    </div>
                </div>

                {/* Sidebar History/Triggers Card */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                    <div className="v4-table-card" style={{ padding: '24px' }}>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '20px' }}>
                            <History size={18} className="cyan-text" />
                            <h4 style={{ margin: 0, fontSize: '12px', fontWeight: 900, color: 'var(--text-secondary)' }}>ISTORIJA KOMUNIKACIJE</h4>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '400px', overflowY: 'auto' }} className="v4-scroll-area">
                            {(dossier.communications || []).length > 0 ? (dossier.communications || []).map(comm => (
                                <div key={comm.id} style={{ padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                        <span style={{ fontSize: '9px', fontWeight: 950, color: 'var(--accent-cyan)' }}>{comm.channel.toUpperCase()}</span>
                                        <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-secondary)' }}>{comm.timestamp}</span>
                                    </div>
                                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-primary)', lineHeight: 1.4 }}>{comm.message.substring(0, 100)}...</p>
                                </div>
                            )) : (
                                <div style={{ textAlign: 'center', padding: '40px 0', opacity: 0.2 }}>
                                    <MessageSquare size={32} style={{ marginBottom: '8px' }} />
                                    <div style={{ fontSize: '11px', fontWeight: 800 }}>NEMA ISTORIJE</div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="v4-table-card" style={{ padding: '24px', background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(251, 191, 36, 0.05) 100%)' }}>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
                            <Zap size={18} style={{ color: '#fbbf24' }} />
                            <h4 style={{ margin: 0, fontSize: '12px', fontWeight: 900, color: 'var(--text-secondary)' }}>SMART TRIGGERS</h4>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: 'var(--text-secondary)', fontWeight: 700 }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></div>
                                Avio promena - Auto SMS
                            </div>
                            <button className="v4-tab-btn" style={{ background: 'rgba(255,255,255,0.05)', fontSize: '11px', height: '32px' }}>KONFIGURIŠI OKIDAČE</button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};
