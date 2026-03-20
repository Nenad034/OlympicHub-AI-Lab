import React, { useState } from 'react';
import {
    Shield, ShieldAlert, MessageCircle, Send, User,
    MapPin, Phone, History, Clock, Globe, Zap,
    Camera, PhoneCall, CheckCircle2, AlertCircle, 
    Smartphone, Info, FileText, Landmark, ShieldCheck
} from 'lucide-react';
import type { Dossier, ActivityLog } from '../../types/reservationArchitect';
import { motion, AnimatePresence } from 'framer-motion';

interface RepTabProps {
    dossier: Dossier;
    setDossier: React.Dispatch<React.SetStateAction<Dossier>>;
    addLog: (action: string, details: string, type: ActivityLog['type']) => void;
}

export const RepTab: React.FC<RepTabProps> = ({ dossier, setDossier, addLog }) => {
    const [message, setMessage] = useState('');
    const navy = '#1e293b';
    const silverBorder = 'rgba(30, 41, 59, 0.1)';

    const mockMessages = [
        { id: 1, role: 'rep', sender: 'Miloš (Hurgada)', text: 'Putnici su smešteni u sobi 412, sprat 4. Sve je u redu.', timestamp: 'Danas, 14:20' },
        { id: 2, role: 'agent', sender: 'Agent Nenad', text: 'Hvala Miloše, javi ako bude bilo kakvih promena vezanih za transfer.', timestamp: 'Danas, 14:25' }
    ];

    const toggleRepStatus = () => {
        const nextChecked = !dossier.repChecked;
        setDossier(prev => ({
            ...prev,
            repChecked: nextChecked,
            repCheckedAt: nextChecked ? new Date().toLocaleString() : '',
            repCheckedBy: nextChecked ? 'Agent (System)' : ''
        }));
        addLog('Destinacija', `Status terenske provere promenjen u: ${nextChecked ? 'Potvrđeno' : 'Resetovano'}`, nextChecked ? 'success' : 'warning');
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px', color: navy }}>

            {/* Header Area */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                    <div style={{ width: '60px', height: '60px', borderRadius: '20px', background: navy, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 30px rgba(30,41,59,0.2)' }}>
                        <Globe size={28} />
                    </div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '30px', fontWeight: 950, color: navy, letterSpacing: '-1px' }}>PREDSTAVNICI NA TERENU</h2>
                        <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600, marginTop: '4px' }}>Direktna komunikacija sa operativom na destinaciji</div>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ padding: '8px 20px', borderRadius: '12px', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)', fontSize: '11px', fontWeight: 950, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }}></div>
                        HURGHADA (LIVE)
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '32px', alignItems: 'start' }}>

                {/* Main Live Chat CRM Style */}
                <div style={{ background: 'white', border: `1px solid ${silverBorder}`, borderRadius: '24px', overflow: 'hidden', height: '650px', display: 'flex', flexDirection: 'column', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                    <div style={{ padding: '20px 32px', background: '#f8fafc', borderBottom: `1px solid ${silverBorder}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{ position: 'relative' }}>
                                <div style={{ width: '42px', height: '42px', borderRadius: '14px', background: navy, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 950 }}>MP</div>
                                <div style={{ position: 'absolute', bottom: -2, right: -2, width: '12px', height: '12px', borderRadius: '50%', background: '#10b981', border: '2px solid white' }}></div>
                            </div>
                            <div>
                                <div style={{ fontSize: '14px', fontWeight: 950 }}>Miloš Predstavnik (Egypt)</div>
                                <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>Destinacijski koordinator</div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'white', border: `1px solid ${silverBorder}`, color: navy, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Phone size={16} /></button>
                            <button style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'white', border: `1px solid ${silverBorder}`, color: navy, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Camera size={16} /></button>
                        </div>
                    </div>

                    <div style={{ flex: 1, padding: '32px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px', background: '#fbfcfd' }}>
                        {mockMessages.map((msg) => (
                            <div
                                key={msg.id}
                                style={{ alignSelf: msg.role === 'rep' ? 'flex-start' : 'flex-end', maxWidth: '80%' }}
                            >
                                <div style={{ fontSize: '10px', fontWeight: 800, marginBottom: '6px', color: '#64748b', textAlign: msg.role === 'rep' ? 'left' : 'right' }}>{msg.sender} • {msg.timestamp}</div>
                                <div style={{
                                    padding: '16px 20px', borderRadius: '18px', fontSize: '14px', lineHeight: 1.5, fontWeight: 600,
                                    background: msg.role === 'rep' ? 'white' : navy,
                                    color: msg.role === 'rep' ? navy : 'white',
                                    boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                                    border: msg.role === 'rep' ? `1px solid ${silverBorder}` : 'none',
                                    borderTopLeftRadius: msg.role === 'rep' ? '2px' : '18px',
                                    borderTopRightRadius: msg.role === 'rep' ? '18px' : '2px'
                                }}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div style={{ padding: '24px 32px', background: 'white', borderTop: `1px solid ${silverBorder}`, display: 'flex', gap: '16px' }}>
                        <input
                            style={{ flex: 1, height: '54px', background: '#f1f5f9', borderRadius: '16px', padding: '0 20px', fontSize: '14px', border: 'none', outline: 'none' }}
                            placeholder="Pošalji direktnu instrukciju..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                        />
                        <button
                            style={{ width: '54px', height: '54px', borderRadius: '16px', background: navy, color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            disabled={!message.trim()}
                        >
                            <Send size={20} />
                        </button>
                    </div>
                </div>

                {/* Right Column Infocards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    
                    {/* Status Card */}
                    <div style={{ padding: '24px', background: 'white', border: `1px solid ${silverBorder}`, borderRadius: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <Shield size={18} color="#64748b" />
                            <h4 style={{ margin: 0, fontSize: '12px', fontWeight: 950, letterSpacing: '0.5px', color: navy }}>PROVERA NA TERENU</h4>
                        </div>
                        <button 
                            onClick={toggleRepStatus}
                            style={{ 
                                width: '100%', height: '54px', borderRadius: '16px', border: 'none', cursor: 'pointer',
                                background: dossier.repChecked ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                color: dossier.repChecked ? '#10b981' : '#ef4444',
                                fontSize: '14px', fontWeight: 950, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px'
                            }}
                        >
                            {dossier.repChecked ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                            {dossier.repChecked ? 'DOSIJE POTVRĐEN' : 'POTVRDI TERENSKU PROVERU'}
                        </button>
                        {dossier.repChecked && (
                            <div style={{ textAlign: 'center', fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                                {dossier.repCheckedBy} @ {dossier.repCheckedAt}
                            </div>
                        )}
                    </div>

                    {/* Contact Card */}
                    <div style={{ padding: '24px', background: 'white', border: `1px solid ${silverBorder}`, borderRadius: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                            <Smartphone size={18} color="#64748b" />
                            <h4 style={{ margin: 0, fontSize: '12px', fontWeight: 950, letterSpacing: '0.5px', color: navy }}>KONTAKT PREDSTAVNIKA</h4>
                        </div>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#f1f5f9', color: navy, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${silverBorder}` }}>
                                <User size={20} />
                            </div>
                            <div>
                                <div style={{ fontSize: '15px', fontWeight: 950 }}>Miloš Predstavnik</div>
                                <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 700 }}>+20 123 456 789</div>
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <button style={{ height: '42px', borderRadius: '12px', border: `1px solid ${silverBorder}`, background: 'white', color: navy, fontSize: '11px', fontWeight: 800, cursor: 'pointer' }}>VIBER CALL</button>
                            <button style={{ height: '42px', borderRadius: '12px', border: 'none', background: '#22c55e', color: 'white', fontSize: '11px', fontWeight: 800, cursor: 'pointer' }}>WHATSAPP</button>
                        </div>
                    </div>

                    {/* Important Note Alert */}
                    <div style={{ padding: '24px', background: 'rgba(168, 85, 247, 0.05)', border: '1px solid rgba(168, 85, 247, 0.1)', borderRadius: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', color: '#a855f7' }}>
                            <Info size={18} />
                            <h4 style={{ margin: 0, fontSize: '11px', fontWeight: 950, letterSpacing: '0.5px' }}>ZABELEŠKA ZA TEREN</h4>
                        </div>
                        <div style={{ fontSize: '13px', color: navy, lineHeight: 1.6, fontWeight: 600, opacity: 0.8 }}>
                            Klijenti su prvi put u Egiptu. Zahtevaju sobu u blizini glavnog bazena zbog deteta. Posebno obratiti pažnju na transfer.
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
};
