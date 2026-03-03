import React, { useState, useRef } from 'react';
import { Mail, MessageCircle, History, Info, Send, User, Phone, Share2, Smartphone, Paperclip, X, Image as ImageIcon, FileText, QrCode, ShieldCheck, Zap, Bell, CheckCircle2, AlertCircle, MessageSquare, Search } from 'lucide-react';
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
    const [showQrCode, setShowQrCode] = useState(false);
    const [inviteChannel, setInviteChannel] = useState<CommChannel>('sms');
    const [historySearch, setHistorySearch] = useState('');
    const [historyFilter, setHistoryFilter] = useState<'all' | CommChannel>('all');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const quickSubjects = isSubagent ? [
        `Promena imena putnika - REZ: ${dossier.resCode || dossier.clientReference}`,
        `Otkaz rezervacije - REZ: ${dossier.resCode || dossier.clientReference}`,
        `Slanje vaučera ponovo`,
        `Dodatne usluge / Napomene`
    ] : [
        `Vaš vaučer i dokumentacija - ${dossier.resCode}`,
        `Informacija o uplati - ${dossier.resCode}`,
        `Promena vremena leta - ${dossier.resCode}`,
        `Važna napomena za vaše putovanje`
    ];

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            setIsScanning(true);
            setTimeout(() => {
                setAttachments([...attachments, ...newFiles]);
                setIsScanning(false);
                addLog('Safety Check', `Provereno ${newFiles.length} fajlova. Nema pretnji.`, 'success');
            }, 1000);
        }
    };

    const removeAttachment = (index: number) => {
        setAttachments(attachments.filter((_, i) => i !== index));
    };

    const handleSend = () => {
        let target = activeChannel === 'email' ? dossier.booker.email : phoneNumber;

        // Save to persistent history
        addCommunication({
            channel: activeChannel,
            direction: 'sent',
            subject: activeChannel === 'email' ? subject : undefined,
            message,
            recipient: target,
            status: 'sent'
        });

        // Trigger side effects
        if (activeChannel === 'whatsapp') {
            window.open(`https://wa.me/${phoneNumber.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
        } else if (activeChannel === 'telegram') {
            window.open(`https://t.me/share/url?url=&text=${encodeURIComponent(message)}`, '_blank');
        } else if (activeChannel === 'app') {
            alert(`Push notifikacija poslata klijentu: ${dossier.booker.fullName}`);
        } else {
            alert(`Poruka poslata putem kanala: ${activeChannel.toUpperCase()}`);
        }

        setMessage('');
        setAttachments([]);
    };

    const handleSendAppInvite = () => {
        addCommunication({
            channel: inviteChannel,
            direction: 'sent',
            message: "Instalacioni link za mobilnu aplikaciju",
            recipient: inviteChannel === 'email' ? dossier.booker.email : phoneNumber,
            status: 'sent'
        });
        addLog('App Pozivnica', `Poslata pozivnica putem ${inviteChannel.toUpperCase()}`, 'info');
        alert(`Pozivnica za instalaciju poslata putem: ${inviteChannel.toUpperCase()}`);
    };

    const channels = [
        { id: 'email', label: 'Email', icon: <Mail size={18} />, color: 'var(--fil-accent)' },
        { id: 'viber', label: 'Viber', icon: <Phone size={18} />, color: '#7360f2' },
        { id: 'whatsapp', label: 'WhatsApp', icon: <MessageCircle size={18} />, color: '#25D366' },
        { id: 'telegram', label: 'Telegram', icon: <Send size={18} />, color: '#0088cc' },
        { id: 'sms', label: 'SMS', icon: <MessageSquare size={18} />, color: '#607d8b' },
        { id: 'app', label: 'Mobilna App', icon: <Smartphone size={18} />, color: '#FF7043' }
    ];

    return (
        <div className="comms-tab-v4">
            <div className="tab-header-v2 glass">
                <div className="title-group">
                    <motion.div
                        key={activeChannel}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="icon-box-premium"
                        style={{ '--box-color': channels.find(c => c.id === activeChannel)?.color } as any}
                    >
                        {channels.find(c => c.id === activeChannel)?.icon}
                    </motion.div>
                    <div className="text-meta">
                        <h2>KOMUNIKACIONI CENTAR</h2>
                        <span className="channel-badge">{activeChannel}</span>
                    </div>
                </div>

                <div className="system-status-pills">
                    <div className="status-pill live">
                        <div className="dot"></div>
                        <span>SYSTEM LIVE</span>
                    </div>
                    <div className="status-pill automation">
                        <Zap size={12} />
                        <span>SMART AUTO V2.0</span>
                    </div>
                </div>

                <div className="channel-tabs">
                    {channels.map(ch => (
                        <button
                            key={ch.id}
                            className={`ch-tab-btn ${activeChannel === ch.id ? 'active' : ''}`}
                            onClick={() => setActiveChannel(ch.id as CommChannel)}
                            style={{ '--accent': ch.color } as any}
                        >
                            {ch.icon}
                            <span>{ch.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="comms-grid-v2">
                <div className="main-form-section glass-premium">
                    <AnimatePresence mode="wait">
                        {activeChannel === 'app' && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                className="onboarding-wizard glass"
                            >
                                <div className="wiz-header">
                                    <div className="wiz-brand">
                                        <div className="brand-orb">O</div>
                                        <div className="brand-text">
                                            <h4>Olympic Travel Hub</h4>
                                            <p>Aktivacija klijentske aplikacije</p>
                                        </div>
                                    </div>
                                    <div className="wiz-security">
                                        <ShieldCheck size={16} className="success" />
                                        <span>ENCRYPTED</span>
                                    </div>
                                </div>

                                <div className="wiz-body">
                                    {showQrCode ? (
                                        <div className="qr-focus">
                                            <div className="qr-frame">
                                                <div className="qr-scanner-line"></div>
                                                <div className="qr-sim">
                                                    <QrCode size={120} />
                                                </div>
                                            </div>
                                            <button className="btn-back-wiz" onClick={() => setShowQrCode(false)}>NAZAD NA LINK</button>
                                        </div>
                                    ) : (
                                        <div className="invite-flow">
                                            <div className="channel-picker-invite">
                                                <label>Pošalji instalacioni link putem:</label>
                                                <div className="invite-channels-row">
                                                    {['sms', 'viber', 'whatsapp', 'email'].map(ch => (
                                                        <button
                                                            key={ch}
                                                            className={`invite-ch-btn ${inviteChannel === ch ? 'active' : ''}`}
                                                            onClick={() => setInviteChannel(ch as CommChannel)}
                                                        >
                                                            {ch.toUpperCase()}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="invite-target">
                                                <div className="target-input-box">
                                                    {inviteChannel === 'email' ? <Mail size={16} /> : <Phone size={16} />}
                                                    <input
                                                        type="text"
                                                        value={inviteChannel === 'email' ? dossier.booker.email : phoneNumber}
                                                        readOnly
                                                    />
                                                </div>
                                                <button className="btn-trigger-invite" onClick={handleSendAppInvite}>
                                                    GENERISI I POŠALJI
                                                </button>
                                            </div>
                                            <div className="qr-secondary-trigger" onClick={() => setShowQrCode(true)}>
                                                <QrCode size={16} /> ILI PRIKAŽI QR KOD ZA SKENIRANJE
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="composer-v2">
                        {activeChannel === 'email' && (
                            <div className="composer-row subject">
                                <label>PREDMET MEJLA</label>
                                <div className="input-with-subjects">
                                    <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="Unesite naslov..." />
                                    <div className="quick-subject-bar">
                                        {quickSubjects.map((s, i) => (
                                            <button key={i} onClick={() => setSubject(s)} className={subject === s ? 'active' : ''}>
                                                {s.split(' - ')[0]}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="composer-row message">
                            <div className="row-header">
                                <label>TEKST PORUKE</label>
                                {isScanning && <div className="scan-v2"><ShieldCheck size={12} className="spin" /> Skeniranje bezbednosti...</div>}
                            </div>
                            <div className="textarea-wrapper-v2">
                                <textarea
                                    value={message}
                                    onChange={e => setMessage(e.target.value)}
                                    placeholder={activeChannel === 'app' ? "Klijent dobija push notifikaciju..." : `Vaša poruka za ${activeChannel.toUpperCase()}...`}
                                />
                                <div className="composer-toolbar-v2">
                                    <div className="tool-group-left">
                                        <button className="attach-btn-v2" onClick={() => fileInputRef.current?.click()}>
                                            <Paperclip size={16} /> PRILOŽI FAJLOVE
                                        </button>
                                        <input type="file" ref={fileInputRef} hidden multiple onChange={handleFileSelect} />

                                        {onOpenEmailModal && (
                                            <button className="attach-btn-v2" onClick={onOpenEmailModal} style={{ borderStyle: 'solid', borderColor: 'color-mix(in srgb, var(--fil-accent), transparent 60%)', color: 'var(--fil-accent)', marginLeft: '10px', background: 'rgba(0, 229, 255, 0.05)', boxShadow: '0 0 15px rgba(0, 229, 255, 0.1)' }}>
                                                <Mail size={16} /> DETALJNI EMAIL MODUL
                                            </button>
                                        )}
                                    </div>

                                    <div className="tool-group-right">
                                        {attachments.length > 0 && <span className="attach-count-v2">{attachments.length} fajla spremno</span>}
                                        <button
                                            className="btn-main-send"
                                            disabled={!message}
                                            onClick={handleSend}
                                            style={{ '--btn-bg': channels.find(c => c.id === activeChannel)?.color } as any}
                                        >
                                            POŠALJI <Send size={16} />
                                        </button>
                                    </div>
                                </div>

                                {attachments.length > 0 && (
                                    <div className="composer-attachments-view">
                                        {attachments.map((f, i) => (
                                            <div key={i} className="mini-attach-card">
                                                {f.type.includes('image') ? <ImageIcon size={14} /> : <FileText size={14} />}
                                                <span className="f-name">{f.name}</span>
                                                <X size={12} className="remove-f" onClick={() => removeAttachment(i)} />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="comms-sidebar-v2 glass-premium">
                    <div className="sidebar-section history-sec">
                        <div className="sec-head">
                            <History size={16} />
                            <h4>ISTORIJA KOMUNIKACIJE</h4>
                        </div>

                        {/* History Search & Filters */}
                        <div className="history-controls">
                            <div className="history-search-box">
                                <Search size={14} className="dim" />
                                <input
                                    type="text"
                                    placeholder="Pretraži istoriju..."
                                    value={historySearch}
                                    onChange={(e) => setHistorySearch(e.target.value)}
                                />
                            </div>
                            <div className="history-filters">
                                <button
                                    className={`hist-filter-btn ${historyFilter === 'all' ? 'active' : ''}`}
                                    onClick={() => setHistoryFilter('all')}
                                >Sve</button>
                                {channels.map(ch => (
                                    <button
                                        key={ch.id}
                                        className={`hist-filter-btn ${historyFilter === ch.id ? 'active' : ''}`}
                                        onClick={() => setHistoryFilter(ch.id as any)}
                                        style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                                    >
                                        {ch.id.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="history-list-v2">
                            {(() => {
                                const filtered = (dossier.communications || []).filter(comm => {
                                    const matchesSearch = comm.message.toLowerCase().includes(historySearch.toLowerCase()) ||
                                        comm.recipient.toLowerCase().includes(historySearch.toLowerCase()) ||
                                        (comm.subject?.toLowerCase().includes(historySearch.toLowerCase()));
                                    const matchesFilter = historyFilter === 'all' || comm.channel === historyFilter;
                                    return matchesSearch && matchesFilter;
                                });

                                if (filtered.length > 0) {
                                    return filtered.map(comm => (
                                        <div key={comm.id} className="history-card-v2">
                                            <div className="h-top">
                                                <div className={`h-channel ${comm.channel}`}>
                                                    {channels.find(c => c.id === comm.channel)?.icon}
                                                    <span>{comm.channel.toUpperCase()}</span>
                                                </div>
                                                <span className="h-time">{comm.timestamp}</span>
                                            </div>
                                            <div className="h-msg">{comm.message}</div>
                                            <div className="h-status">
                                                <CheckCircle2 size={10} className="success" />
                                                <span>Poslato na {comm.recipient}</span>
                                            </div>
                                        </div>
                                    ));
                                }
                                return (
                                    <div className="empty-history">
                                        <AlertCircle size={24} />
                                        <p>Nema rezultata pretrage</p>
                                    </div>
                                );
                            })()}
                        </div>
                    </div>

                    <div className="sidebar-section automation-sec">
                        <div className="sec-head">
                            <Zap size={16} className="gold" />
                            <h4>PAMETNA AUTOMATIZACIJA</h4>
                        </div>
                        <div className="smart-notif-list">
                            <div className="automation-item">
                                <div className="a-icon"><Bell size={14} /></div>
                                <div className="a-content">
                                    <strong>Promena leta (PUSH)</strong>
                                    <p>Sistem će automatski obavestiti klijenta o novim terminima leta.</p>
                                </div>
                                <div className="a-toggle active"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};
