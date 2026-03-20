import React, { useState, useRef } from 'react';
import {
    Mail, MessageCircle, History, Send, User, Phone,
    Share2, Smartphone, Paperclip, X, ShieldCheck, Zap,
    MessageSquare, Search, Sparkles, Terminal, Info,
    CreditCard, Globe, Bell, CheckCircle2, AlertCircle,
    ArrowUpRight, Camera, Copy, Hash, MoreVertical, Layout, Type,
    Bold, Italic, List, Link, Image as ImageIcon, Languages, PenTool, Eraser, AtSign
} from 'lucide-react';
import type { Dossier, ActivityLog, CommunicationRecord } from '../../types/reservationArchitect';
import { motion, AnimatePresence } from 'framer-motion';

interface CommunicationTabProps {
    dossier: Dossier;
    addLog: (title: string, message: string, type: ActivityLog['type']) => void;
    addCommunication: (record: Omit<CommunicationRecord, 'id' | 'timestamp'>) => void;
    onOpenEmailModal?: () => void;
}

type CommChannel = 'email' | 'viber' | 'whatsapp' | 'telegram' | 'app' | 'sms';

export const CommunicationTab: React.FC<CommunicationTabProps> = ({ dossier, addLog, addCommunication }) => {
    const [activeChannel, setActiveChannel] = useState<CommChannel>('email');

    // States
    const [recipientEmail, setRecipientEmail] = useState(dossier.booker.email || '');
    const [subject, setSubject] = useState(`Potvrda rezervacije: ${dossier.cisCode}`);
    const [cc, setCc] = useState('');
    const [bcc, setBcc] = useState('');
    const [message, setMessage] = useState('');
    const [phoneNumber, setPhoneNumber] = useState(dossier.booker.phone || '');
    const [isSending, setIsSending] = useState(false);
    const [activeLang, setActiveLang] = useState('SRB');
    const [useSignature, setUseSignature] = useState(true);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSend = async () => {
        setIsSending(true);
        await new Promise(r => setTimeout(r, 1200));
        let target = activeChannel === 'email' ? recipientEmail : phoneNumber;
        addCommunication({
            channel: activeChannel, direction: 'sent',
            subject: activeChannel === 'email' ? subject : undefined,
            message, recipient: target, status: 'sent'
        });
        setMessage('');
        setIsSending(false);
        addLog('Komunikacija', `${activeChannel.toUpperCase()} je uspešno poslat.`, 'success');
    };

    const channels = [
        { id: 'email', label: 'E-MAIL', icon: <Mail size={16} /> },
        { id: 'viber', label: 'VIBER', icon: <Phone size={16} /> },
        { id: 'whatsapp', label: 'WA', icon: <MessageCircle size={16} /> },
        { id: 'sms', label: 'SMS', icon: <MessageSquare size={16} /> },
        { id: 'app', label: 'PORTAL', icon: <Smartphone size={16} /> }
    ];

    // Premium Navy Color Palette
    const navy = '#1e293b';
    const softBg = 'rgba(255, 255, 255, 0.9)';
    const silverBorder = 'rgba(30, 41, 59, 0.1)';

    return (
        <div className="v6-comm-center" style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '100px', color: navy }}>

            {/* Omni-Channel Header - Clean style */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: navy, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Globe size={20} />
                    </div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 900, letterSpacing: '-0.3px', color: navy }}>OMNI-CHANNEL CENTER</h2>
                        <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 600 }}>Upravljanje dolaznim i odlaznim porukama • {dossier.cisCode}</div>
                    </div>
                </div>

                <div style={{ display: 'flex', background: 'rgba(30, 41, 59, 0.05)', borderRadius: '10px', padding: '4px', border: `1px solid ${silverBorder}` }}>
                    {channels.map(ch => (
                        <button
                            key={ch.id}
                            className={`v4-tab-btn ${activeChannel === ch.id ? 'active' : ''}`}
                            onClick={() => setActiveChannel(ch.id as CommChannel)}
                            style={{ 
                                height: '32px', padding: '0 12px', borderRadius: '8px', border: 'none', 
                                gap: '6px', fontSize: '9px', fontWeight: 950,
                                background: activeChannel === ch.id ? navy : 'transparent',
                                color: activeChannel === ch.id ? 'white' : navy
                            }}
                        >
                            {ch.icon} {ch.label}
                        </button>
                    ))}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: '24px' }}>

                {/* Main Composer Area - LIGHT & WIDE */}
                <div 
                    className="v4-table-card" 
                    style={{ 
                        padding: '0', display: 'flex', flexDirection: 'column', background: 'white', 
                        border: `1px solid ${silverBorder}`, boxShadow: '0 4px 20px rgba(0,0,0,0.03)', borderRadius: '24px' 
                    }}
                >
                    {/* Compact Toolbar */}
                    <div style={{ padding: '16px 24px', borderBottom: `1px solid ${silverBorder}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Mail size={16} style={{ color: navy, opacity: 0.5 }} />
                            <span style={{ fontSize: '13px', fontWeight: 800, color: navy }}>{activeChannel === 'email' ? recipientEmail : phoneNumber}</span>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <div style={{ display: 'flex', background: 'rgba(0,0,0,0.03)', padding: '2px', borderRadius: '6px' }}>
                                {['SRB', 'ENG'].map(lang => (
                                    <button key={lang} onClick={() => setActiveLang(lang)} style={{ height: '24px', padding: '0 8px', borderRadius: '4px', background: activeLang === lang ? navy : 'transparent', color: activeLang === lang ? 'white' : navy, border: 'none', fontSize: '9px', fontWeight: 950, cursor: 'pointer' }}>{lang}</button>
                                ))}
                            </div>
                            <button onClick={() => setUseSignature(!useSignature)} style={{ height: '28px', padding: '0 10px', borderRadius: '6px', background: 'white', color: navy, border: `1px solid ${silverBorder}`, fontSize: '9px', fontWeight: 950 }}>
                                {useSignature ? 'SIGNATURE ON' : 'SIGNATURE OFF'}
                            </button>
                        </div>
                    </div>

                    {/* Email Inputs Grid - Compact & Light */}
                    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        
                        {activeChannel === 'email' ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 1fr) 200px', gap: '8px' }}>
                                    <div style={{ position: 'relative' }}>
                                        <label style={{ fontSize: '8px', fontWeight: 950, color: '#64748b', position: 'absolute', top: '4px', left: '10px' }}>SEND TO (PRIMARY EMAIL)</label>
                                        <input style={{ width: '100%', height: '38px', background: '#f8fafc', border: `1px solid ${silverBorder}`, borderRadius: '8px', padding: '14px 10px 0 10px', fontSize: '12px', fontWeight: 700, color: navy }} value={recipientEmail} onChange={e => setRecipientEmail(e.target.value)} />
                                    </div>
                                    <div style={{ position: 'relative' }}>
                                        <label style={{ fontSize: '8px', fontWeight: 950, color: '#64748b', position: 'absolute', top: '4px', left: '10px' }}>SELECT TEMPLATE</label>
                                        <select style={{ width: '100%', height: '38px', background: '#f8fafc', border: `1px solid ${silverBorder}`, borderRadius: '8px', padding: '14px 10px 0 10px', fontSize: '11px', fontWeight: 700, color: navy }}>
                                            <option>Bez šablona</option>
                                            <option>Potvrda Rezervacije V6</option>
                                        </select>
                                    </div>
                                </div>
                                <div style={{ position: 'relative' }}>
                                    <label style={{ fontSize: '8px', fontWeight: 950, color: '#64748b', position: 'absolute', top: '4px', left: '10px' }}>EMAIL SUBJECT</label>
                                    <input style={{ width: '100%', height: '38px', background: '#f8fafc', border: `1px solid ${silverBorder}`, borderRadius: '8px', padding: '14px 10px 0 10px', fontSize: '12px', fontWeight: 800, color: navy }} value={subject} onChange={e => setSubject(e.target.value)} />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                    <div style={{ position: 'relative' }}>
                                        <label style={{ fontSize: '8px', fontWeight: 950, color: '#64748b', position: 'absolute', top: '4px', left: '10px' }}>CC</label>
                                        <input style={{ width: '100%', height: '34px', background: '#f8fafc', border: `1px solid ${silverBorder}`, borderRadius: '8px', padding: '14px 10px 0 10px', fontSize: '11px', color: navy }} value={cc} onChange={e => setCc(e.target.value)} />
                                    </div>
                                    <div style={{ position: 'relative' }}>
                                        <label style={{ fontSize: '8px', fontWeight: 950, color: '#64748b', position: 'absolute', top: '4px', left: '10px' }}>BCC</label>
                                        <input style={{ width: '100%', height: '34px', background: '#f8fafc', border: `1px solid ${silverBorder}`, borderRadius: '8px', padding: '14px 10px 0 10px', fontSize: '11px', color: navy }} value={bcc} onChange={e => setBcc(e.target.value)} />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div style={{ position: 'relative' }}>
                                <label style={{ fontSize: '8px', fontWeight: 950, color: '#64748b', position: 'absolute', top: '8px', left: '14px' }}>MOBILE RECIPIENT</label>
                                <input style={{ width: '100%', height: '48px', background: '#f8fafc', border: `1px solid ${silverBorder}`, borderRadius: '12px', padding: '18px 14px 0 14px', fontSize: '16px', fontWeight: 900, color: navy }} value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} />
                            </div>
                        )}

                        {/* MESSAGE AREA */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, marginTop: '10px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '9px', fontWeight: 950, color: navy, opacity: 0.4 }}>TEXTUAL CONTENT</span>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                    {[Bold, Italic, List, Link].map((Icon, i) => (
                                        <button key={i} style={{ width: '26px', height: '26px', border: `1px solid ${silverBorder}`, borderRadius: '4px', color: navy, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={12} /></button>
                                    ))}
                                </div>
                            </div>
                            <textarea
                                style={{ 
                                    width: '100%', height: '480px', borderRadius: '16px', padding: '24px', 
                                    fontSize: '15px', color: navy, border: `1px solid ${silverBorder}`,
                                    background: '#f8fafc', lineHeight: 1.6, resize: 'vertical'
                                }}
                                value={message}
                                onChange={e => setMessage(e.target.value)}
                                placeholder="Poštovani, ..."
                            />
                        </div>

                        {/* Footer Actions */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                            <button style={{ height: '44px', border: `1px solid ${silverBorder}`, background: 'white', borderRadius: '10px', padding: '0 16px', color: navy }} onClick={() => fileInputRef.current?.click()}><Paperclip size={18} /></button>
                            <input type="file" ref={fileInputRef} hidden multiple />
                            <div style={{ display: 'flex', gap: '12px' }}>
                                <button style={{ height: '44px', padding: '0 20px', fontSize: '11px', fontWeight: 900, color: navy, background: 'transparent', border: 'none' }}>DRAFT</button>
                                <button 
                                    style={{ height: '44px', padding: '0 32px', borderRadius: '10px', background: navy, color: 'white', fontWeight: 950, fontSize: '11px' }}
                                    onClick={handleSend}
                                    disabled={!message.trim() || isSending}
                                >
                                    {isSending ? 'SENDING...' : `SEND AS ${activeChannel.toUpperCase()}`}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* History Column - Clean & Navy */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div className="v4-table-card" style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'white', border: `1px solid ${silverBorder}`, borderRadius: '24px' }}>
                        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${silverBorder}`, display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <History size={16} style={{ color: navy }} />
                            <h4 style={{ margin: 0, fontSize: '10px', fontWeight: 900, color: navy }}>COMMUNICATION HISTORY</h4>
                        </div>
                        <div className="v4-scroll-area" style={{ flex: 1, padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                             {(dossier.communications || []).length > 0 ? (dossier.communications || []).slice(0, 10).reverse().map(comm => (
                                <div key={comm.id} style={{ padding: '14px', border: `1px solid ${silverBorder}`, borderRadius: '12px' }}>
                                     <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                        <span style={{ fontSize: '9px', fontWeight: 950, color: navy }}>{comm.channel.toUpperCase()}</span>
                                        <span style={{ fontSize: '9px', opacity: 0.4 }}>{comm.timestamp}</span>
                                    </div>
                                    <div style={{ fontSize: '11px', fontWeight: 800, color: navy, marginBottom: '2px' }}>TO: {comm.recipient}</div>
                                    <p style={{ margin: 0, fontSize: '12px', color: '#64748b', lineHeight: 1.4 }}>{comm.message.substring(0, 80)}...</p>
                                </div>
                             )) : (
                                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.2 }}>
                                    <MessageSquare size={32} style={{ color: navy }} />
                                </div>
                             )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};
