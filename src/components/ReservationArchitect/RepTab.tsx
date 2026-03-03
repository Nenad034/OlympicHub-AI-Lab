import React, { useState } from 'react';
import { Shield, ShieldAlert, MessageCircle, Send, User, MapPin, Phone, History, Clock, Globe } from 'lucide-react';
import type { Dossier } from '../../types/reservationArchitect';
import { motion, AnimatePresence } from 'framer-motion';

interface RepTabProps {
    dossier: Dossier;
}

export const RepTab: React.FC<RepTabProps> = ({ dossier }) => {
    const [message, setMessage] = useState('');

    const mockMessages = [
        { id: 1, role: 'rep', sender: 'Miloš (Hurgada)', text: 'Putnici su smešteni u sobi 412, sprat 4. Sve je u redu.', timestamp: '2026-03-02 14:20' },
        { id: 2, role: 'agent', sender: 'Agent Nenad', text: 'Hvala Miloše, javi ako bude bilo kakvih promena vezanih za transfer.', timestamp: '2026-03-02 14:25' }
    ];

    return (
        <div className="v4-rep-tab" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <Globe size={22} className="cyan-text" />
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 950, letterSpacing: '1px' }}>KOMUNIKACIJA NA DESTINACIJI (REP HUB)</h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '32px', minHeight: '600px' }}>

                {/* Chat Section */}
                <div className="v4-table-card" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', background: '#000' }}>
                    <div style={{ padding: '16px 24px', background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }}></div>
                        <div>
                            <div className="v4-label" style={{ fontSize: '10px' }}>REGION: HURGHADA, EGYPT</div>
                            <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--text-secondary)' }}>LIVE CONNECTIONS: 2 OPS</div>
                        </div>
                    </div>

                    <div style={{ flex: 1, padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', background: 'linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.4) 100%)' }} className="v4-scroll-area">
                        {mockMessages.map((msg, index) => (
                            <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, x: msg.role === 'rep' ? -10 : 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                style={{ alignSelf: msg.role === 'rep' ? 'flex-start' : 'flex-end', maxWidth: '75%' }}
                            >
                                <div style={{ fontSize: '9px', fontWeight: 900, marginBottom: '6px', opacity: 0.5, textAlign: msg.role === 'rep' ? 'left' : 'right' }}>{msg.sender} • {msg.timestamp}</div>
                                <div style={{
                                    padding: '14px 20px', borderRadius: '18px', fontSize: '14px', lineHeight: 1.5, fontWeight: 600,
                                    background: msg.role === 'rep' ? 'rgba(255,255,255,0.05)' : 'var(--accent-cyan)',
                                    color: msg.role === 'rep' ? 'var(--text-primary)' : '#000',
                                    border: msg.role === 'rep' ? '1px solid var(--glass-border)' : 'none',
                                    borderTopLeftRadius: msg.role === 'rep' ? '4px' : '18px',
                                    borderTopRightRadius: msg.role === 'rep' ? '18px' : '4px'
                                }}>
                                    {msg.text}
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <div style={{ padding: '20px', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid var(--glass-border)', display: 'flex', gap: '16px' }}>
                        <input
                            className="v4-input"
                            style={{ flex: 1, height: '48px', background: '#000' }}
                            placeholder="Pošalji poruku predstavniku..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                        />
                        <button
                            className="v4-tab-btn active"
                            style={{ width: '48px', height: '48px', padding: 0, justifyContent: 'center' }}
                            disabled={!message.trim()}
                        >
                            <Send size={20} />
                        </button>
                    </div>
                </div>

                {/* Info Section */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                    <div className="v4-table-card" style={{ padding: '24px' }}>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '20px' }}>
                            <Shield size={18} className="cyan-text" />
                            <h4 style={{ margin: 0, fontSize: '12px', fontWeight: 900, color: 'var(--text-secondary)' }}>STATUS OPERACIJE</h4>
                        </div>
                        <div className={`v4-status-pill ${dossier.repChecked ? 'success' : 'danger'}`} style={{ width: '100%', justifyContent: 'center', height: '44px', fontSize: '14px' }}>
                            {dossier.repChecked ? (
                                <><Shield size={18} style={{ marginRight: '8px' }} /> OPERATIVNO (OK)</>
                            ) : (
                                <><ShieldAlert size={18} style={{ marginRight: '8px' }} /> ČEKA NA PROVERU</>
                            )}
                        </div>
                        {dossier.repChecked && (
                            <div style={{ marginTop: '16px', fontSize: '11px', color: 'var(--text-secondary)', textAlign: 'center', fontWeight: 800 }}>
                                <Clock size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: '4px' }} /> {dossier.repCheckedAt}
                                <span style={{ marginLeft: '6px', color: 'var(--text-primary)' }}>by {dossier.repCheckedBy}</span>
                            </div>
                        )}
                    </div>

                    <div className="v4-table-card" style={{ padding: '24px' }}>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '20px' }}>
                            <User size={18} className="cyan-text" />
                            <h4 style={{ margin: 0, fontSize: '12px', fontWeight: 900, color: 'var(--text-secondary)' }}>PROFIL PREDSTAVNIKA</h4>
                        </div>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                            <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'var(--accent-cyan)', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 950 }}>
                                MP
                            </div>
                            <div>
                                <div className="v4-text-main" style={{ fontSize: '16px' }}>Miloš Predstavnik</div>
                                <div className="v4-text-dim" style={{ fontSize: '12px', marginTop: '4px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                                    <MapPin size={12} /> Hurghada, Egypt
                                </div>
                                <div className="v4-text-dim" style={{ fontSize: '12px', marginTop: '4px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                                    <Phone size={12} /> +20 123 456 789
                                </div>
                            </div>
                        </div>
                        <button className="v4-tab-btn" style={{ width: '100%', marginTop: '20px', background: 'var(--bg-secondary)', height: '40px', justifyContent: 'center' }}>
                            DIREKTAN POZIV
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
};
