import React, { useState, useMemo } from 'react';
import { 
    Users, Plus, Trash2, User, Phone, Mail, 
    Calendar, ShieldCheck, HeartPulse, CreditCard,
    MoreVertical, ArrowUpRight, CheckCircle2, Search,
    Hash, Globe, Smartphone, MapPin, Zap, Info, FileText, 
    LayoutGrid, List as ListIcon, Copy, Save, Edit, Edit3, Trash, X, Check,
    Users2, ClipboardCheck, UserPlus
} from 'lucide-react';
import type { Dossier, Passenger, ActivityLog } from '../../types/reservationArchitect';
import { motion, AnimatePresence } from 'framer-motion';

interface PassengersTabProps {
    dossier: Dossier;
    setDossier: (d: Dossier) => void;
    addLog: (title: string, message: string, type: ActivityLog['type']) => void;
    isPartiesNotepadView: boolean;
    setIsPartiesNotepadView: (v: boolean) => void;
    isSubagent?: boolean;
    showSaveClientBtn?: boolean;
    setShowSaveClientBtn?: (v: boolean) => void;
    handleSaveToClients?: () => void;
    handlePrint?: () => void;
}

type ViewMode = 'grid' | 'list' | 'notepad';

export const PassengersTab: React.FC<PassengersTabProps> = ({ 
    dossier, setDossier, addLog, 
    isPartiesNotepadView, setIsPartiesNotepadView,
    isSubagent, showSaveClientBtn, setShowSaveClientBtn,
    handleSaveToClients, handlePrint
}) => {
    const [viewMode, setViewMode] = useState<ViewMode>(isPartiesNotepadView ? 'notepad' : 'grid');
    const [editingPassenger, setEditingPassenger] = useState<Passenger | null>(null);
    
    // SORT PASSENGERS: Lead always first
    const sortedPassengers = useMemo(() => {
        return [...(dossier.passengers || [])].sort((a, b) => {
            if (a.isLeadPassenger && !b.isLeadPassenger) return -1;
            if (!a.isLeadPassenger && b.isLeadPassenger) return 1;
            return 0;
        });
    }, [dossier.passengers]);

    const navy = '#1e293b';
    const silverBorder = 'rgba(30, 41, 59, 0.1)';

    const toggleNotepad = (mode: ViewMode) => {
        setViewMode(mode);
        setIsPartiesNotepadView(mode === 'notepad');
    };

    const getRawNotepadText = () => {
        return sortedPassengers.map((p, i) => 
            `${i + 1}. ${p.firstName} ${p.lastName} (${p.type.toUpperCase()}) / DOB: ${p.birthDate} / PASSPORT: ${p.idNumber || 'N/A'}`
        ).join('\n');
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(getRawNotepadText());
        addLog('Notepad', 'Spisak putnika kopiran.', 'info');
    };

    const handleSyncLeadData = () => {
        const lead = dossier.passengers.find(p => p.isLeadPassenger);
        if (!lead) {
            alert('NOSILAC GRUPE NIJE DEFINISAN!');
            return;
        }

        if (window.confirm(`Da li želite da prepišete Telefon, Email i Adresu nosioca (${lead.firstName} ${lead.lastName}) na sve ostale putnike?`)) {
            const nextPassengers = dossier.passengers.map(p => {
                if (p.isLeadPassenger) return p;
                return { ...p, phone: lead.phone || p.phone, email: lead.email || p.email, address: lead.address || p.address };
            });
            setDossier({ ...dossier, passengers: nextPassengers });
            addLog('Sinhronizacija', 'Podaci nosioca su prepisani na grupu.', 'success');
        }
    };

    const handlePassengerSave = (p: Passenger) => {
        const nextPassengers = dossier.passengers.map(old => old.id === p.id ? p : old);
        setDossier({ ...dossier, passengers: nextPassengers });
        addLog('Putnici', `Profil ažuriran: ${p.firstName} ${p.lastName}`, 'success');
        setEditingPassenger(null);
    };

    const handleRemove = (id: string) => {
        if (window.confirm('Da li ste sigurni da želite da uklonite putnika?')) {
            const nextPassengers = dossier.passengers.filter(p => p.id !== id);
            setDossier({ ...dossier, passengers: nextPassengers });
            addLog('Uklanjanje', 'Putnik uklonjen.', 'warning');
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', color: navy }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(168, 85, 247, 0.1)', color: '#a855f7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Users size={24} />
                    </div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 950, letterSpacing: '-0.5px' }}>MANIFEST PUTNIKA</h2>
                        <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 800 }}>Ukupno {dossier.passengers.length} putnika • Nosilac na vrhu liste</span>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '4px', background: '#f1f5f9', padding: '4px', borderRadius: '14px' }}>
                        {(['grid', 'list', 'notepad'] as ViewMode[]).map(m => (
                            <button key={m} onClick={() => toggleNotepad(m)} style={{ height: '34px', padding: '0 16px', borderRadius: '10px', border: 'none', background: viewMode === m ? 'white' : 'transparent', color: navy, fontSize: '10px', fontWeight: 950, display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', boxShadow: viewMode === m ? '0 2px 8px rgba(0,0,0,0.05)' : 'none' }}>
                                {m === 'grid' ? <LayoutGrid size={15}/> : m === 'list' ? <ListIcon size={15}/> : <FileText size={15}/>} {m.toUpperCase()}
                            </button>
                        ))}
                    </div>
                    <button onClick={handleSyncLeadData} style={{ height: '44px', padding: '0 20px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.2)', fontSize: '11px', fontWeight: 950, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        <ClipboardCheck size={18} /> POPUNI PODACIMA NOSIOCA
                    </button>
                    <button className="v4-tab-btn active" style={{ height: '44px', padding: '0 24px', borderRadius: '12px', background: navy, color: 'white', fontWeight: 950, fontSize: '11px' }}>
                        <UserPlus size={18} style={{ marginRight: '8px' }} /> DODAJ PUTNIKA
                    </button>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {viewMode === 'grid' && (
                    <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(550px, 1fr))', gap: '30px' }}>
                        {sortedPassengers.map((p) => (
                            <div key={p.id} className="v4-table-card" style={{ background: 'white', border: `1px solid ${silverBorder}`, borderLeft: p.isLeadPassenger ? '8px solid navy' : '1px solid ' + silverBorder, borderRadius: '28px', overflow: 'hidden' }}>
                                <div style={{ padding: '30px', borderBottom: `1px solid ${silverBorder}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: p.isLeadPassenger ? 'rgba(30, 41, 59, 0.02)' : 'transparent' }}>
                                    <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                                        <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'white', border: `1px solid ${silverBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: navy, boxShadow: '0 2px 10px rgba(0,0,0,0.03)' }}>
                                            <User size={28} />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '20px', fontWeight: 950, letterSpacing: '-0.5px' }}>{p.firstName} {p.lastName}</div>
                                            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 900, marginTop: '2px' }}>{p.type.toUpperCase()} • PASOŠ: {p.idNumber || 'N/A'}</div>
                                        </div>
                                    </div>
                                    {p.isLeadPassenger && <span style={{ fontSize: '10px', fontWeight: 950, background: navy, color: 'white', padding: '5px 12px', borderRadius: '8px' }}>NOSILAC GRUPE</span>}
                                </div>
                                <div style={{ padding: '30px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                            <Calendar size={16} style={{ color: navy, opacity: 0.3 }} />
                                            <div><div style={{ fontSize: '9px', fontWeight: 950, color: '#94a3b8' }}>ROĐEN / DRŽAVLJANSTVO</div><div style={{ fontSize: '13px', fontWeight: 800 }}>{p.birthDate} <span style={{ opacity: 0.3 }}>|</span> {p.nationality || 'SRBIJA'}</div></div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                            <Phone size={16} style={{ color: navy, opacity: 0.3 }} />
                                            <div><div style={{ fontSize: '9px', fontWeight: 950, color: '#94a3b8' }}>KONTAKT TELEFON</div><div style={{ fontSize: '13px', fontWeight: 800 }}>{p.phone || '---'}</div></div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                            <Mail size={16} style={{ color: navy, opacity: 0.3 }} />
                                            <div><div style={{ fontSize: '9px', fontWeight: 950, color: '#94a3b8' }}>EMAIL ADRESA</div><div style={{ fontSize: '13px', fontWeight: 800 }}>{p.email || '---'}</div></div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                            <MapPin size={16} style={{ color: navy, opacity: 0.3 }} />
                                            <div><div style={{ fontSize: '9px', fontWeight: 950, color: '#94a3b8' }}>ADRESA STANOVANJA</div><div style={{ fontSize: '13px', fontWeight: 800 }}>{p.address || '---'}</div></div>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ padding: '20px 30px', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'white', border: `1px solid ${silverBorder}`, color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="POLISA"><ShieldCheck size={18} /></div>
                                        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'white', border: `1px solid ${silverBorder}`, color: '#fbbf24', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="VAUČER"><Zap size={18} /></div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <button onClick={() => setEditingPassenger(p)} style={{ height: '38px', padding: '0 16px', borderRadius: '10px', background: 'white', border: `1px solid ${silverBorder}`, color: navy, fontSize: '11px', fontWeight: 950, cursor: 'pointer' }}>IZMENI PODATKE</button>
                                        <button onClick={() => handleRemove(p.id)} style={{ height: '38px', padding: '0 16px', borderRadius: '10px', background: 'white', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', fontSize: '11px', fontWeight: 950, cursor: 'pointer' }}>UKLONI</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </motion.div>
                )}

                {viewMode === 'list' && (
                    <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="v4-table-card" style={{ background: 'white', border: `1px solid ${silverBorder}`, borderRadius: '28px', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead style={{ background: '#f8fafc', borderBottom: `2px solid ${silverBorder}` }}>
                                <tr>
                                    <th style={{ padding: '20px 30px', fontSize: '10px', fontWeight: 950, color: '#64748b' }}>PUTNIK / GRUPA</th>
                                    <th style={{ padding: '20px 30px', fontSize: '10px', fontWeight: 950, color: '#64748b' }}>TIP / DOB</th>
                                    <th style={{ padding: '20px 30px', fontSize: '10px', fontWeight: 950, color: '#64748b' }}>PASOŠ / DRŽ.</th>
                                    <th style={{ padding: '20px 30px', fontSize: '10px', fontWeight: 950, color: '#64748b' }}>TEL / EMAIL</th>
                                    <th style={{ padding: '20px 30px', fontSize: '10px', fontWeight: 950, color: '#64748b' }}>ADRESA</th>
                                    <th style={{ padding: '20px 30px', textAlign: 'right' }}>UPRAVLJANJE</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedPassengers.map((p, idx) => (
                                    <tr key={p.id} style={{ borderBottom: idx === sortedPassengers.length - 1 ? 'none' : `1px solid ${silverBorder}`, transition: 'background 0.2s', background: p.isLeadPassenger ? 'rgba(30, 41, 59, 0.015)' : 'transparent' }}>
                                        <td style={{ padding: '20px 30px' }}><div style={{ fontSize: '14px', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '12px' }}>{p.isLeadPassenger && <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: navy }}></div>}{p.firstName} {p.lastName}</div></td>
                                        <td style={{ padding: '20px 30px' }}><div style={{ fontSize: '11px', fontWeight: 800 }}>{p.type.toUpperCase()}<br/><span style={{ color: '#94a3b8' }}>{p.birthDate}</span></div></td>
                                        <td style={{ padding: '20px 30px' }}><div style={{ fontSize: '11px', fontWeight: 800 }}>{p.idNumber || '---'}<br/><span style={{ color: '#94a3b8' }}>{p.nationality || 'SRBIJA'}</span></div></td>
                                        <td style={{ padding: '20px 30px' }}><div style={{ fontSize: '11px', fontWeight: 800 }}>{p.phone || '---'}<br/><span style={{ color: '#94a3b8' }}>{p.email || '---'}</span></div></td>
                                        <td style={{ padding: '20px 30px' }}><div style={{ fontSize: '11px', fontWeight: 800, maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.address || '---'}</div></td>
                                        <td style={{ padding: '20px 30px', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                <button onClick={() => setEditingPassenger(p)} style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(30, 41, 59, 0.05)', border: 'none', color: navy, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Edit3 size={16} /></button>
                                                <button onClick={() => handleRemove(p.id)} style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(239, 68, 68, 0.05)', border: 'none', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Trash2 size={16} /></button>
                                                <button style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(251, 191, 36, 0.05)', border: 'none', color: '#fbbf24', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Zap size={16} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </motion.div>
                )}

                {viewMode === 'notepad' && (
                    <motion.div key="notepad" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}><button onClick={copyToClipboard} style={{ height: '36px', padding: '0 20px', borderRadius: '10px', background: navy, color: 'white', border: 'none', fontSize: '10px', fontWeight: 950, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}><Copy size={16} /> KOPIRAJ SPISAK</button></div>
                        <div style={{ background: '#f8fafc', padding: '40px', borderRadius: '32px', border: `1px solid ${silverBorder}`, minHeight: '500px' }}>
                            <textarea className="v4-notepad-textarea" style={{ width: '100%', height: '600px', background: 'transparent', border: 'none', color: navy, fontFamily: 'monospace', fontSize: '15px', lineHeight: '2', resize: 'none', outline: 'none' }} value={getRawNotepadText()} readOnly />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* EDIT MODAL ON TOP CENTER */}
            {editingPassenger && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '20px' }}>
                    <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} style={{ width: '100%', maxWidth: '700px', background: 'white', borderRadius: '32px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflow: 'hidden' }}>
                        <div style={{ padding: '30px 40px', background: navy, color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div><h3 style={{ margin: 0, fontSize: '18px', fontWeight: 950 }}>IZMENA PUTNIKA</h3><div style={{ fontSize: '11px', opacity: 0.5 }}>Ažuriranje manifesta • Lead Sync Active</div></div>
                            <button onClick={() => setEditingPassenger(null)} style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer' }}><X size={24} /></button>
                        </div>
                        <div style={{ padding: '40px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                            <div className="v4-field-group"><label style={{ fontSize: '10px', fontWeight: 950, color: '#64748b', display: 'block', marginBottom: '8px' }}>IME</label><input className="v4-input" style={{ width: '100%', height: '44px' }} value={editingPassenger.firstName} onChange={e => setEditingPassenger({...editingPassenger, firstName: e.target.value})} /></div>
                            <div className="v4-field-group"><label style={{ fontSize: '10px', fontWeight: 950, color: '#64748b', display: 'block', marginBottom: '8px' }}>PREZIME</label><input className="v4-input" style={{ width: '100%', height: '44px' }} value={editingPassenger.lastName} onChange={e => setEditingPassenger({...editingPassenger, lastName: e.target.value})} /></div>
                            <div className="v4-field-group">
                                <label style={{ fontSize: '10px', fontWeight: 950, color: '#64748b', display: 'block', marginBottom: '8px' }}>PROFIL / TIP</label>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <select className="v4-input" style={{ width: '100%', height: '44px' }} value={editingPassenger.type} onChange={e => setEditingPassenger({...editingPassenger, type: e.target.value as any})}><option value="adult">ADULT</option><option value="child">CHILD</option><option value="infant">INFANT</option></select>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '0 12px', background: '#f1f5f9', borderRadius: '12px' }}>
                                        <input type="checkbox" checked={editingPassenger.isLeadPassenger} onChange={e => setEditingPassenger({...editingPassenger, isLeadPassenger: e.target.checked})} />
                                        <span style={{ fontSize: '11px', fontWeight: 950 }}>LEAD</span>
                                    </div>
                                </div>
                            </div>
                            <div className="v4-field-group"><label style={{ fontSize: '10px', fontWeight: 950, color: '#64748b', display: 'block', marginBottom: '8px' }}>DATUM ROĐENJA</label><input className="v4-input" style={{ width: '100%', height: '44px' }} value={editingPassenger.birthDate} onChange={e => setEditingPassenger({...editingPassenger, birthDate: e.target.value})} /></div>
                            <div className="v4-field-group"><label style={{ fontSize: '10px', fontWeight: 950, color: '#64748b', display: 'block', marginBottom: '8px' }}>BROJ PASOŠA</label><input className="v4-input" style={{ width: '100%', height: '44px' }} value={editingPassenger.idNumber} onChange={e => setEditingPassenger({...editingPassenger, idNumber: e.target.value})} /></div>
                            <div className="v4-field-group"><label style={{ fontSize: '10px', fontWeight: 950, color: '#64748b', display: 'block', marginBottom: '8px' }}>DRŽAVLJANSTVO</label><input className="v4-input" style={{ width: '100%', height: '44px' }} value={editingPassenger.nationality} onChange={e => setEditingPassenger({...editingPassenger, nationality: e.target.value})} /></div>
                            <div className="v4-field-group"><label style={{ fontSize: '10px', fontWeight: 950, color: '#64748b', display: 'block', marginBottom: '8px' }}>TELEFON</label><input className="v4-input" style={{ width: '100%', height: '44px' }} value={editingPassenger.phone} onChange={e => setEditingPassenger({...editingPassenger, phone: e.target.value})} /></div>
                            <div className="v4-field-group"><label style={{ fontSize: '10px', fontWeight: 950, color: '#64748b', display: 'block', marginBottom: '8px' }}>EMAIL ADRESA</label><input className="v4-input" style={{ width: '100%', height: '44px' }} value={editingPassenger.email} onChange={e => setEditingPassenger({...editingPassenger, email: e.target.value})} /></div>
                            <div className="v4-field-group" style={{ gridColumn: 'span 2' }}><label style={{ fontSize: '10px', fontWeight: 950, color: '#64748b', display: 'block', marginBottom: '8px' }}>ADRESA STANOVANJA</label><input className="v4-input" style={{ width: '100%', height: '44px' }} value={editingPassenger.address} onChange={e => setEditingPassenger({...editingPassenger, address: e.target.value})} /></div>
                        </div>
                        <div style={{ padding: '30px 40px', background: '#f8fafc', borderTop: `1px solid ${silverBorder}`, display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
                            <button onClick={() => setEditingPassenger(null)} style={{ height: '44px', padding: '0 24px', borderRadius: '12px', background: 'white', border: `1px solid ${silverBorder}`, color: navy, fontSize: '12px', fontWeight: 950, cursor: 'pointer' }}>ODUSTANI</button>
                            <button onClick={() => handlePassengerSave(editingPassenger)} style={{ height: '44px', padding: '0 32px', borderRadius: '12px', background: navy, color: 'white', border: 'none', fontSize: '12px', fontWeight: 950, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}><Check size={18} /> SAČUVAJ PROMENE</button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};
