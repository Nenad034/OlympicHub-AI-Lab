import React, { useState } from 'react';
import {
    Users, FileText, UserPlus, Copy, Mail, Printer, Share2, Plus,
    Trash2, Search, ArrowRightLeft, Save, MapPin, Phone, Globe, Hash, FileEdit, LayoutDashboard,
    ChevronDown, ChevronUp, CheckCircle, Smartphone, UserCheck, ShieldCheck, CreditCard, Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Dossier, Passenger } from '../../types/reservationArchitect';
import { NATIONALITIES } from '../../constants/nationalities';

interface PassengersTabProps {
    dossier: Dossier;
    setDossier: React.Dispatch<React.SetStateAction<Dossier>>;
    addLog: (action: string, details: string, type?: 'info' | 'success' | 'warning' | 'danger') => void;
    isPartiesNotepadView: boolean;
    setIsPartiesNotepadView: (val: boolean) => void;
    isSubagent: boolean;
    showSaveClientBtn: boolean;
    setShowSaveClientBtn: (val: boolean) => void;
    handleSaveToClients: () => void;
    handlePrint: () => void;
}

export const PassengersTab: React.FC<PassengersTabProps> = ({
    dossier,
    setDossier,
    addLog,
    isPartiesNotepadView,
    setIsPartiesNotepadView,
    isSubagent,
    showSaveClientBtn,
    setShowSaveClientBtn,
    handleSaveToClients,
    handlePrint
}) => {

    const addPassenger = () => {
        const newPax: Passenger = {
            id: 'p-' + Math.random().toString(36).substr(2, 9),
            firstName: '',
            lastName: '',
            idNumber: '',
            birthDate: '',
            type: 'Adult',
            address: '',
            city: '',
            country: 'Srbija',
            phone: '',
            email: '',
            isLeadPassenger: false
        };
        setDossier({ ...dossier, passengers: [...dossier.passengers, newPax] });
        addLog('Putnik Dodat', 'Dodat novi prazan slot za putnika.', 'info');
    };

    const removePassenger = (id: string) => {
        if (dossier.passengers.length === 1) return alert('Dossier mora imati bar jednog putnika.');
        setDossier({ ...dossier, passengers: dossier.passengers.filter(p => p.id !== id) });
        addLog('Putnik Uklonjen', 'Putnik je uklonjen sa rezervacije.', 'warning');
    };

    const setLeadPassenger = (id: string) => {
        const lead = dossier.passengers.find(p => p.id === id);
        if (!lead) return;

        const nextPassengers = dossier.passengers.map(p => ({
            ...p,
            isLeadPassenger: p.id === id
        }));

        setDossier({
            ...dossier,
            passengers: nextPassengers,
            booker: {
                ...dossier.booker,
                fullName: `${lead.firstName} ${lead.lastName}`.trim(),
                address: lead.address || '',
                city: lead.city || '',
                country: lead.country || '',
                idNumber: lead.idNumber || '',
                phone: lead.phone || '',
                email: lead.email || ''
            }
        });

        addLog('Nosilac Putovanja', `Nosilac putovanja postavljen: ${lead.firstName} ${lead.lastName}. Podaci sinhronizovani sa ugovaračem.`, 'success');
    };

    const updatePassenger = (id: string, updates: Partial<Passenger>) => {
        const next = dossier.passengers.map(p => p.id === id ? { ...p, ...updates } : p);
        setDossier({ ...dossier, passengers: next });
    };

    return (
        <div className="v4-passengers-tab" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button className={`v4-tab-btn ${dossier.customerType === 'B2C-Individual' ? 'active' : ''}`} onClick={() => setDossier({ ...dossier, customerType: 'B2C-Individual' })}>B2C INDIVIDUALNI</button>
                    <button className={`v4-tab-btn ${dossier.customerType === 'B2B-Subagent' ? 'active' : ''}`} onClick={() => setDossier({ ...dossier, customerType: 'B2B-Subagent' })}>B2B SUBAGENT</button>
                </div>

                <div className="v4-nav-tabs" style={{ marginBottom: 0 }}>
                    <button className={`v4-tab-btn ${!isPartiesNotepadView ? 'active' : ''}`} onClick={() => setIsPartiesNotepadView(false)}>
                        <LayoutDashboard size={18} /> INTERAKTIVNO
                    </button>
                    <button className={`v4-tab-btn ${isPartiesNotepadView ? 'active' : ''}`} onClick={() => setIsPartiesNotepadView(true)}>
                        <FileEdit size={18} /> NOTEPAD
                    </button>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {isPartiesNotepadView ? (
                    <motion.div key="notepad" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="v4-table-card" style={{ padding: '32px' }}>
                        <pre style={{
                            fontFamily: 'monospace', fontSize: '14px', whiteSpace: 'pre-wrap',
                            background: 'rgba(0,0,0,0.2)', padding: '24px', borderRadius: '16px', border: '1px solid var(--glass-border)'
                        }}>
                            {`PUTNICI I UGOVARAČ - DOSSIER ${dossier.cisCode}\n\n` +
                                dossier.passengers.map((p, i) => `${i + 1}. ${p.firstName} ${p.lastName} (${p.type})\nDoc: ${p.idNumber} | Tel: ${p.phone}`).join('\n\n')}
                        </pre>
                    </motion.div>
                ) : (
                    <motion.div key="interactive" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

                        {/* UGOVARAČ SECTION */}
                        <div className="v4-table-card">
                            <div style={{ padding: '24px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                    <UserCheck size={20} className="cyan-text" />
                                    <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 950, letterSpacing: '1px' }}>UGOVARAČ / NALAGODAVAC</h3>
                                </div>
                                <button className="v4-tab-btn" style={{ background: 'var(--bg-secondary)', color: 'var(--accent-cyan)', height: '36px' }}>
                                    <ArrowRightLeft size={14} /> SINHRONIZUJ
                                </button>
                            </div>

                            <div className="v4-metrics-grid" style={{ padding: '24px', gridTemplateColumns: 'repeat(2, 1fr)' }}>
                                <div className="v4-input-group">
                                    <label className="v4-label">IME I PREZIME</label>
                                    <input className="v4-input" value={dossier.booker.fullName} onChange={e => setDossier({ ...dossier, booker: { ...dossier.booker, fullName: e.target.value } })} />
                                </div>
                                <div className="v4-input-group">
                                    <label className="v4-label">EMAIL ADRESA</label>
                                    <input className="v4-input" value={dossier.booker.email} onChange={e => setDossier({ ...dossier, booker: { ...dossier.booker, email: e.target.value } })} />
                                </div>
                                <div className="v4-input-group">
                                    <label className="v4-label">KONTAKT TELEFON</label>
                                    <input className="v4-input" value={dossier.booker.phone} onChange={e => setDossier({ ...dossier, booker: { ...dossier.booker, phone: e.target.value } })} />
                                </div>
                                <div className="v4-input-group">
                                    <label className="v4-label">ADRESA I GRAD</label>
                                    <input className="v4-input" value={dossier.booker.address} onChange={e => setDossier({ ...dossier, booker: { ...dossier.booker, address: e.target.value } })} />
                                </div>
                            </div>
                        </div>

                        {/* PASSENGERS TABLE */}
                        <div className="v4-table-card">
                            <div style={{ padding: '24px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                    <Users size={20} className="cyan-text" />
                                    <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 950, letterSpacing: '1px' }}>PUTNICI NA ARANŽMANU</h3>
                                </div>
                                <button className="v4-tab-btn active" onClick={addPassenger}>
                                    <Plus size={16} /> DODAJ PUTNIKA
                                </button>
                            </div>

                            <table className="v4-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '40px' }}>#</th>
                                        <th>Putnik (Ime i Prezime)</th>
                                        <th>Tip / Datum Rođenja</th>
                                        <th>Br. Pasoša</th>
                                        <th>Kontakt (Email/Tel)</th>
                                        <th style={{ textAlign: 'right' }}>Stanje</th>
                                        <th style={{ textAlign: 'right' }}>Akcije</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {dossier.passengers.map((p, idx) => (
                                        <tr key={p.id} className={`v4-row-hover ${p.isLeadPassenger ? 'lead-row' : ''}`} style={{ background: p.isLeadPassenger ? 'rgba(0, 229, 255, 0.05)' : 'transparent' }}>
                                            <td style={{ fontWeight: 900, color: 'var(--text-secondary)' }}>{idx + 1}</td>
                                            <td>
                                                <input
                                                    className="v4-input"
                                                    value={`${p.firstName} ${p.lastName}`}
                                                    style={{ background: 'transparent', border: 'none', fontWeight: 800, fontSize: '16px', padding: 0 }}
                                                    onChange={e => {
                                                        const [f, ...l] = e.target.value.split(' ');
                                                        updatePassenger(p.id, { firstName: f || '', lastName: l.join(' ') });
                                                    }}
                                                />
                                                {p.isLeadPassenger && <div style={{ fontSize: '9px', fontWeight: 950, color: 'var(--accent-cyan)', marginTop: '4px' }}>NOSILAC PUTOVANJA</div>}
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <select className="v4-input" style={{ width: '100px', height: '32px', padding: '0 8px', fontSize: '12px' }} value={p.type} onChange={e => updatePassenger(p.id, { type: e.target.value as any })}>
                                                        <option value="Adult">Odrasli</option>
                                                        <option value="Child">Dete</option>
                                                        <option value="Infant">Beba</option>
                                                    </select>
                                                    <input type="date" className="v4-input" style={{ width: '130px', height: '32px', padding: '0 8px', fontSize: '12px' }} value={p.birthDate} onChange={e => updatePassenger(p.id, { birthDate: e.target.value })} />
                                                </div>
                                            </td>
                                            <td>
                                                <input className="v4-input" style={{ height: '32px', padding: '0 8px', fontSize: '13px' }} value={p.idNumber} onChange={e => updatePassenger(p.id, { idNumber: e.target.value })} />
                                            </td>
                                            <td>
                                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{p.email || 'Nema email'}</div>
                                                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{p.phone || 'Nema telefon'}</div>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div className={`v4-status-pill ${p.isLeadPassenger ? 'success' : 'warning'}`} style={{ transform: 'scale(0.85)', transformOrigin: 'right' }}>
                                                    {p.isLeadPassenger ? 'Lead' : 'Guest'}
                                                </div>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                    {!p.isLeadPassenger && (
                                                        <button onClick={() => setLeadPassenger(p.id)} className="v4-tab-btn" style={{ height: '32px', padding: '0 10px', fontSize: '10px' }}>
                                                            SET LEAD
                                                        </button>
                                                    )}
                                                    <button onClick={() => removePassenger(p.id)} style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', width: '32px', height: '32px', borderRadius: '8px', cursor: 'pointer' }}>
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
