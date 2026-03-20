import React from 'react';
import { 
    FileText, Download, Mail, Printer, Share2, 
    ShieldCheck, Eye, Zap, Info, Clock, 
    AlertCircle, CheckCircle2, FileCode, Layout,
    Landmark, ShieldAlert, Scale, QrCode, Terminal, ExternalLink
} from 'lucide-react';
import type { Dossier, ActivityLog, Language } from '../../types/reservationArchitect';
import { motion, AnimatePresence } from 'framer-motion';

interface DocumentsViewProps {
    dossier: Dossier;
    onGenerate: (type: string, format: 'PDF' | 'HTML') => void;
    onSend: (type: string, method: 'Email' | 'Viber') => void;
    onPrint: () => void;
}

export const DocumentsView: React.FC<DocumentsViewProps> = ({ 
    dossier, onGenerate, onSend, onPrint
}) => {
    
    const navy = '#1e293b';
    const silverBorder = 'rgba(30, 41, 59, 0.1)';

    const [docSettings, setDocSettings] = React.useState<Record<string, Language>>({
        SUMMARY: 'Srpski', PROFORMA: 'Srpski', CONTRACT: 'Srpski', VOUCHER: 'Srpski', paxList: 'Srpski', FISCAL: 'Srpski'
    });

    const isB2B = dossier.customerType === 'B2B-Subagent' || dossier.customerType === 'B2C-Legal';
    const totalPaid = (dossier.finance.payments || []).reduce((sum, p) => p.status === 'deleted' ? sum : sum + (p.amount || 0), 0);
    const hasUninvoicedAmount = totalPaid > 0; // Simplified logic for demo

    const docs = [
        { 
            id: 'SUMMARY', label: 'REZIME REZERVACIJE', 
            icon: <Layout size={24} />, color: '#00bcd4',
            desc: 'Kompletan pregled svih usluga, putnika i finansija.'
        },
        { 
            id: 'PROFORMA', label: 'PROFAKTURA / RAČUN', 
            icon: <FileText size={24} />, color: '#10b981',
            desc: 'Dokument za uplatu sa instrukcijama i barkodom.'
        },
        { 
            id: 'CONTRACT', label: 'UGOVOR O PUTOVANJU', 
            icon: <ShieldCheck size={24} />, color: '#3b82f6',
            desc: 'Pravni dokument sa Opštim uslovima putovanja.'
        },
        { 
            id: 'VOUCHER', label: 'PUTNI VAUČER (VOUCHER)', 
            icon: <Zap size={24} />, color: '#fbbf24',
            desc: 'Dokument koji se predaje hotelu / prevozniku.'
        },
        { 
            id: 'paxList', label: 'LISTA PUTNIKA', 
            icon: <Clock size={24} />, color: '#a855f7',
            desc: 'Rooming lista namenjena hotelima i partnerima.'
        }
    ];

    const handleLangChange = (id: string, lang: Language) => {
        setDocSettings(prev => ({ ...prev, [id]: lang }));
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', color: navy }}>
            
            {/* COMPONENT HEADER */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: navy, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FileCode size={24} />
                    </div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 950, letterSpacing: '-0.5px' }}>DOKUMENT CENTAR</h2>
                        <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 800 }}>Generisanje dokumentacije • {dossier.cisCode}</div>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={onPrint} className="v4-tab-btn" style={{ height: '44px', padding: '0 20px', borderRadius: '12px', background: 'white', border: `1px solid ${silverBorder}`, color: navy, fontSize: '11px', fontWeight: 950 }}>
                        <Printer size={18} style={{ marginRight: '8px' }} /> ŠTAMPAJ STRANICU
                    </button>
                </div>
            </div>

            {/* NEW: CRITICAL FISCAL & SEF SECTION */}
            <div className="v4-table-card" style={{ padding: '0', background: 'rgba(30, 41, 59, 0.01)', border: `2px solid ${hasUninvoicedAmount ? '#f59e0b' : silverBorder}`, borderRadius: '24px', overflow: 'hidden' }}>
                <div style={{ background: hasUninvoicedAmount ? 'linear-gradient(90deg, #f59e0b, #fbbf24)' : '#f8fafc', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${silverBorder}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', color: hasUninvoicedAmount ? 'white' : navy }}>
                        <Scale size={20} />
                        <span style={{ fontSize: '12px', fontWeight: 950, letterSpacing: '1px' }}>ZAKONSKA FISKALIZACIJA & E-FAKTURE (SEF)</span>
                    </div>
                    {hasUninvoicedAmount && (
                        <div style={{ background: 'white', color: '#f59e0b', fontSize: '10px', fontWeight: 950, padding: '4px 12px', borderRadius: '8px' }}>
                           POTREBNA AKCIJA: NEIZDATA UPLATA ({totalPaid.toLocaleString()} {dossier.finance.currency})
                        </div>
                    )}
                </div>

                <div style={{ padding: '32px', display: 'grid', gridTemplateColumns: '1fr 380px', gap: '48px' }}>
                    <div>
                        <div style={{ fontSize: '18px', fontWeight: 950, color: navy, marginBottom: '8px' }}>
                            {isB2B ? 'E-Faktura (SEF / B2B)' : 'Fiskalni Račun (ESIR / PFR / B2C)'}
                        </div>
                        <p style={{ fontSize: '13px', color: '#64748b', lineHeight: 1.6, margin: 0 }}>
                            Sistem je detektovao klijenta kao <strong>{dossier.customerType}</strong>. 
                            {isB2B ? ' Dokument će biti automatski prosleđen na državni portal e-Faktura (SEF) u UBL 2.1 formatu.' : ' Dokument će biti fiskalizovan putem LPFR/V-PFR servisa i sadržaće obavezan QR kod.'}
                        </p>

                        <div style={{ display: 'flex', gap: '16px', marginTop: '24px' }}>
                            <button 
                                onClick={() => onGenerate('FISCAL', 'PDF')}
                                style={{ height: '56px', padding: '0 32px', borderRadius: '16px', background: navy, color: 'white', border: 'none', fontSize: '12px', fontWeight: 950, display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', boxShadow: '0 10px 20px rgba(30, 41, 59, 0.2)' }}
                            >
                                <QrCode size={20} /> GENERIŠI & FISKALIŠI RAČUN
                            </button>
                            <button 
                                onClick={onPrint}
                                style={{ height: '56px', padding: '0 24px', borderRadius: '16px', background: 'white', color: navy, border: `1px solid ${silverBorder}`, fontSize: '12px', fontWeight: 950, display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
                            >
                                <Printer size={20} /> SAMO ŠTAMPA
                            </button>
                        </div>
                    </div>

                    <div style={{ background: '#f8fafc', borderRadius: '20px', padding: '24px', border: `1px solid ${silverBorder}` }}>
                        <div style={{ fontSize: '10px', fontWeight: 950, opacity: 0.5, marginBottom: '16px', letterSpacing: '1px' }}>STATUS DOKUMENTA</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '12px', fontWeight: 700 }}>ESIR / PFR Status:</span>
                                <span style={{ color: '#ef4444', fontSize: '11px', fontWeight: 950, display: 'flex', alignItems: 'center', gap: '6px' }}><AlertCircle size={14} /> NIJE IZDAT</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '12px', fontWeight: 700 }}>SEF Sinhronizacija:</span>
                                <span style={{ opacity: 0.5, fontSize: '11px', fontWeight: 950 }}>ČEKA AKCIJU</span>
                            </div>
                            <div style={{ height: '1px', background: silverBorder, margin: '8px 0' }}></div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '12px', fontWeight: 700 }}>Poreski Period:</span>
                                <span style={{ fontSize: '12px', fontWeight: 800 }}>MART 2026</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* REGULAR DOCUMENTS LIST */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ fontSize: '11px', fontWeight: 950, opacity: 0.4, letterSpacing: '2px', marginLeft: '8px' }}>OPERATIVNA DOKUMENTACIJA</div>
                {docs.map(doc => (
                    <motion.div 
                        key={doc.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="v4-table-card"
                        style={{ padding: '0', background: 'white', border: `1px solid ${silverBorder}`, borderRadius: '24px', boxShadow: '0 4px 15px rgba(0,0,0,0.02)', display: 'grid', gridTemplateColumns: '100px 1fr 180px 450px' }}
                    >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(30, 41, 59, 0.02)', borderRight: `1px solid ${silverBorder}`, color: doc.color }}>
                            {doc.icon}
                        </div>

                        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                            <div style={{ fontSize: '14px', fontWeight: 950, color: navy }}>{doc.label}</div>
                            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, marginTop: '4px' }}>{doc.desc}</div>
                        </div>

                        <div style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '8px', borderLeft: `1px solid ${silverBorder}`, borderRight: `1px solid ${silverBorder}` }}>
                            <div style={{ background: 'rgba(30, 41, 59, 0.04)', padding: '4px', borderRadius: '10px', display: 'flex', width: '100%' }}>
                                {(['Srpski', 'English'] as Language[]).map(lang => (
                                    <button 
                                        key={lang}
                                        onClick={() => handleLangChange(doc.id, lang)}
                                        style={{ height: '32px', flex: 1, borderRadius: '8px', border: 'none', background: (docSettings[doc.id] || dossier.language) === lang ? navy : 'transparent', color: (docSettings[doc.id] || dossier.language) === lang ? 'white' : navy, fontSize: '9px', fontWeight: 950, cursor: 'pointer', transition: 'all 0.2s' }}
                                    >
                                        {lang === 'Srpski' ? 'SRB' : 'ENG'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div style={{ padding: '24px', display: 'flex', gap: '12px', alignItems: 'center', justifyContent: 'flex-end' }}>
                            <button 
                                onClick={() => onGenerate(doc.id, 'PDF')}
                                className="v4-tab-btn" 
                                style={{ height: '48px', padding: '0 16px', borderRadius: '14px', background: '#f8fafc', border: `1px solid ${silverBorder}`, color: navy, fontSize: '10px', fontWeight: 950, display: 'flex', alignItems: 'center', gap: '8px' }}
                            >
                                <Download size={18} /> PDF
                            </button>
                            <button 
                                onClick={() => onGenerate(doc.id, 'HTML')}
                                className="v4-tab-btn" 
                                style={{ height: '48px', padding: '0 16px', borderRadius: '14px', background: '#f8fafc', border: `1px solid ${silverBorder}`, color: navy, fontSize: '10px', fontWeight: 950, display: 'flex', alignItems: 'center', gap: '8px' }}
                            >
                                <Eye size={18} /> HTML
                            </button>
                            <button 
                                onClick={() => onSend(doc.id, 'Email')}
                                className="v4-tab-btn" 
                                style={{ height: '48px', padding: '0 24px', borderRadius: '14px', background: navy, color: 'white', fontSize: '10px', fontWeight: 950, display: 'flex', alignItems: 'center', gap: '8px' }}
                            >
                                <Mail size={18} /> POŠALJI MEJL
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* ARHIVA I INFO */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div className="v4-table-card" style={{ padding: '32px', background: 'white', border: `1px solid ${silverBorder}`, borderRadius: '24px', display: 'flex', gap: '32px', alignItems: 'center' }}>
                    <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: 'rgba(30, 41, 59, 0.05)', color: navy, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Info size={28} />
                    </div>
                    <div>
                        <h4 style={{ margin: '0 0 6px 0', fontSize: '14px', fontWeight: 950 }}>AUTOMATSKO ARHIVIRANJE</h4>
                        <p style={{ margin: 0, fontSize: '12px', color: '#64748b', lineHeight: 1.6 }}>Sistemska arhiva čuva sve verzije generisanih dokumenata. Dostupno u tabu Audit.</p>
                    </div>
                </div>

                <div className="v4-table-card" style={{ padding: '32px', background: 'white', border: `1px solid ${silverBorder}`, borderRadius: '24px', display: 'flex', gap: '32px', alignItems: 'center' }}>
                    <div style={{ width: '56px', height: '56px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.05)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Terminal size={28} />
                    </div>
                    <div>
                        <h4 style={{ margin: '0 0 6px 0', fontSize: '14px', fontWeight: 950 }}>E-FAKTURA PORTAL</h4>
                        <p style={{ margin: 0, fontSize: '12px', color: '#64748b', lineHeight: 1.6 }}>Direktan link ka državnom test i produkcionom okruženju za proveru statusa faktura.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
