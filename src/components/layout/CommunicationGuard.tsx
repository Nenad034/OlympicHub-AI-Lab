import React from 'react';
// Imports su sačuvani za buduću upotrebu:
// import { useState, useEffect, useCallback } from 'react';
// import { AlertCircle, Clock, User, MessageCircle, ExternalLink, X } from 'lucide-react';
// import { getUnansweredStats } from '../../services/emailService';
// import { getUnansweredWebEnquiries } from '../../services/communicationService';
// import { useMailStore } from '../../stores';
// import './CommunicationGuard.css';

export const CommunicationGuard: React.FC = () => {
    // ============================================================
    // PRIVREMENO UGAŠENO - aktivirati kada aplikacija bude operativna
    // Da biste aktivirali, zamenite ovu komponentu sa verzijom iz git istorije
    // ili odkomentarišite kod ispod.
    // ============================================================
    return null;
};

/*
// ===================== UGAŠENA IMPLEMENTACIJA =====================
// Aktivirati po potrebi kada aplikacija bude operativna.
// Kopirati sadržaj ispod i zameniti export komponentu gore.

import React, { useState, useEffect, useCallback } from 'react';
import { AlertCircle, Clock, MessageCircle, X } from 'lucide-react';
import { getUnansweredStats } from '../../services/emailService';
import { getUnansweredWebEnquiries } from '../../services/communicationService';
import { useMailStore } from '../../stores';
import './CommunicationGuard.css';

export const CommunicationGuard: React.FC = () => {
    const { accounts } = useMailStore();
    const [showModal, setShowModal] = useState(false);
    const [stats, setStats] = useState<{ accountId: string; count: number; overdue: boolean }[]>([]);
    const [webEnquiries, setWebEnquiries] = useState<any[]>([]);

    const checkStatus = useCallback(async () => {
        const emailStats = await getUnansweredStats();
        const enquiries = await getUnansweredWebEnquiries();

        setStats(emailStats);
        setWebEnquiries(enquiries);

        const hasOverdue = emailStats.some(s => s.overdue);
        const hasEnquiries = enquiries.length > 0;

        if (hasOverdue || hasEnquiries) {
            setShowModal(true);
        }
    }, []);

    useEffect(() => {
        checkStatus();
        const interval = setInterval(checkStatus, 600000); // svakih 10 minuta
        return () => clearInterval(interval);
    }, [checkStatus]);

    if (!showModal) return null;

    return (
        <div className="comm-guard-overlay">
            <div className="comm-guard-modal">
                <div className="comm-guard-header">
                    <div className="header-title">
                        <AlertCircle className="warning-icon" />
                        <h2>PAŽNJA: Neodgovoreni upiti</h2>
                    </div>
                    <button className="close-btn" onClick={() => setShowModal(false)}>
                        <X size={20} />
                    </button>
                </div>

                <div className="comm-guard-content">
                    <p className="description">
                        Pronađeni su zahtevi koji čekaju na odgovor duže od 2 sata.
                        Molimo vas da ih obradite pre nastavka rada.
                    </p>

                    <div className="stats-section">
                        <h3>Email Nalozi</h3>
                        <div className="accounts-grid">
                            {accounts.map(acc => {
                                const accStat = stats.find(s => s.accountId === acc.id);
                                if (!accStat || accStat.count === 0) return null;

                                return (
                                    <div key={acc.id} className={`account-stat-card ${accStat.overdue ? 'overdue' : ''}`}>
                                        <div className="acc-color" style={{ background: acc.color }}></div>
                                        <div className="acc-info">
                                            <span className="acc-name">{acc.name}</span>
                                            <span className="acc-count">{accStat.count} poruka</span>
                                        </div>
                                        {accStat.overdue && <Clock className="overdue-icon" size={16} />}
                                    </div>
                                );
                            })}
                            {stats.length === 0 && <p className="empty-msg">Nema neodgovorenih mejlova.</p>}
                        </div>
                    </div>

                    {webEnquiries.length > 0 && (
                        <div className="stats-section">
                            <h3>Upiti sa sajta ({webEnquiries.length})</h3>
                            <div className="enquiries-list">
                                {webEnquiries.slice(0, 3).map(enq => (
                                    <div key={enq.id} className="enquiry-card">
                                        <MessageCircle size={14} />
                                        <div className="enq-details">
                                            <span className="enq-name">{enq.customerName}</span>
                                            <span className="enq-subject">{enq.subject || 'Bez naslova'}</span>
                                        </div>
                                        <Clock size={12} />
                                        <span className="enq-time">{new Date(enq.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                ))}
                                {webEnquiries.length > 3 && (
                                    <p className="more-enquiries">I još {webEnquiries.length - 3} druga upita...</p>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="comm-guard-footer">
                    <p className="footer-note">Zatvaranjem ovog prozora potvrđujete da ste svesni obaveza.</p>
                    <button className="btn-primary" onClick={() => setShowModal(false)}>
                        Razumem, idem na Inbox
                    </button>
                </div>
            </div>
        </div>
    );
};
*/
