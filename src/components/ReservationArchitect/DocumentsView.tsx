import React from 'react';
import { FileText, Download, Send, Printer, FileSearch, CheckCircle, Clock, AlertCircle, ShieldCheck, Globe, Languages } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Dossier } from '../../types/reservationArchitect';

interface DocumentsViewProps {
    dossier: Dossier;
    onGenerate: (type: string, format: 'PDF' | 'HTML') => void;
    onPrint: () => void;
    onSend: (type: string, method: 'Email' | 'Viber') => void;
}

export const DocumentsView: React.FC<DocumentsViewProps> = ({ dossier, onGenerate, onPrint, onSend }) => {
    const docs = [
        { id: 'contract', label: 'Ugovor o Putovanju', desc: 'Glavni dokument o ugovorenim uslugama', icon: <ShieldCheck size={24} /> },
        { id: 'voucher', label: 'Vaučer / Smeštaj', desc: 'Potvrda o plaćenom smeštaju i uslugama', icon: <FileText size={24} /> },
        { id: 'itinerary', label: 'Plan Puta / Itinerer', desc: 'Detaljan raspored letova i transfera', icon: <Globe size={24} /> },
        { id: 'proforma', label: 'Račun / Profaktura', desc: 'Dokument za uplatu preko računa', icon: <FileText size={24} /> },
        { id: 'paxList', label: 'Lista Putnika', desc: 'Interni spisak učesnika za dobavljače', icon: <FileText size={24} /> }
    ];

    return (
        <div className="v4-documents-view" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <FileSearch size={22} className="cyan-text" />
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 950, letterSpacing: '1px' }}>ARHIVA DOKUMENATA I GENERATOR</h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
                {docs.map((doc, index) => {
                    const status = dossier.documentTracker[doc.id] || {
                        generated: false, sentEmail: false, sentViber: false, sentPrint: false
                    };

                    return (
                        <motion.div
                            key={doc.id}
                            className="v4-table-card"
                            style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                    <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(0, 229, 255, 0.1)', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {doc.icon}
                                    </div>
                                    <div>
                                        <div className="v4-text-main" style={{ fontSize: '16px' }}>{doc.label}</div>
                                        <div className="v4-text-dim" style={{ fontSize: '12px' }}>{doc.desc}</div>
                                    </div>
                                </div>
                                <div className="v4-status-pill success" style={{ transform: 'scale(0.8)', transformOrigin: 'right' }}>
                                    VERZIJA 1.0
                                </div>
                            </div>

                            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '16px', border: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', opacity: status.generated ? 1 : 0.2 }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-cyan)' }}></div>
                                    <span style={{ fontSize: '9px', fontWeight: 900, color: 'var(--text-secondary)' }}>KREIRAN</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', opacity: status.sentEmail ? 1 : 0.2 }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></div>
                                    <span style={{ fontSize: '9px', fontWeight: 900, color: 'var(--text-secondary)' }}>EMAIL</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', opacity: status.sentViber ? 1 : 0.2 }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#8b5cf6' }}></div>
                                    <span style={{ fontSize: '9px', fontWeight: 900, color: 'var(--text-secondary)' }}>VIBER</span>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                                <button className="v4-tab-btn" style={{ background: 'var(--bg-secondary)', height: '40px', justifyContent: 'center' }} onClick={() => onGenerate(doc.id, 'PDF')}>
                                    <Download size={16} /> PDF
                                </button>
                                <button className="v4-tab-btn" style={{ background: 'var(--bg-secondary)', height: '40px', justifyContent: 'center' }} onClick={onPrint}>
                                    <Printer size={16} /> PRINT
                                </button>
                                <button className="v4-tab-btn active" style={{ height: '40px', justifyContent: 'center' }} onClick={() => onSend(doc.id, 'Email')}>
                                    <Send size={16} /> POŠALJI
                                </button>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Quick Settings Section integrated from DocumentCenter */}
            <div className="v4-table-card" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '24px' }}>
                    <Languages size={20} className="cyan-text" />
                    <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 950, letterSpacing: '1px' }}>PODEŠAVANJA JEZIKA I LOKALIZACIJE</h3>
                </div>
                <div className="v4-metrics-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
                    <div className="v4-input-group">
                        <label className="v4-label">JEZIK DOKUMENTACIJE</label>
                        <select className="v4-input" defaultValue="Srpski">
                            <option>Srpski</option>
                            <option>Engleski</option>
                            <option>Nemački</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
};
