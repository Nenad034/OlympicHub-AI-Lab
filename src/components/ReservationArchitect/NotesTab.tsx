import React, { useState, useEffect, useRef } from 'react';
import {
    FileText, Sparkles, Building2, Shield, Briefcase, StickyNote,
    Terminal, Info, Lock, Eye, AlertCircle, Save, CheckCircle, X
} from 'lucide-react';
import type { Dossier, ActivityLog } from '../../types/reservationArchitect';
import { motion, AnimatePresence } from 'framer-motion';

interface NotesTabProps {
    dossier: Dossier;
    setDossier: React.Dispatch<React.SetStateAction<Dossier>>;
    addLog: (action: string, details: string, type: ActivityLog['type']) => void;
}

// Local wrapper to handle smooth typing without global state lag
const DebouncedTextArea = ({ value, onChange, placeholder, fullWidth }: any) => {
    const [localValue, setLocalValue] = useState(value || '');
    const timerRef = useRef<any>(null);

    // Sync from outside if needed (e.g. data loaded)
    useEffect(() => {
        if (value !== localValue) {
            setLocalValue(value || '');
        }
    }, [value]);

    const handleChange = (val: string) => {
        setLocalValue(val);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            onChange(val);
        }, 500); // Wait 500ms after last keypress to sync to global state
    };

    return (
        <textarea
            style={{
                width: '100%', minHeight: fullWidth ? '110px' : '85px',
                resize: 'none', background: '#f8fafc',
                padding: '12px 16px', borderRadius: '12px', border: `1px solid rgba(30, 41, 59, 0.1)`,
                fontSize: '13px', lineHeight: 1.5, fontWeight: 500, color: '#1e293b',
                outline: 'none', transition: 'border-color 0.2s',
                fontFamily: 'inherit'
            }}
            value={localValue}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={placeholder}
            spellCheck={false}
            onFocus={(e) => e.currentTarget.style.borderColor = '#1e293b'}
            onBlur={(e) => e.currentTarget.style.borderColor = 'rgba(30, 41, 59, 0.1)'}
        />
    );
};

export const NotesTab: React.FC<NotesTabProps> = ({ dossier, setDossier, addLog }) => {
    const [isNotepadView, setIsNotepadView] = useState(false);
    const navy = '#1e293b';
    const silverBorder = 'rgba(30, 41, 59, 0.1)';

    const handleNoteChange = (key: keyof Dossier['notes'], value: string) => {
        setDossier(prev => ({
            ...prev,
            notes: {
                ...prev.notes,
                [key]: value
            }
        }));
    };

    const labelMap: Record<string, string> = {
        general: 'OPŠTA NAPOMENA',
        contract: 'NAPOMENA ZA UGOVOR',
        voucher: 'NAPOMENA ZA VAUČER',
        internal: 'INTERNA BELEŠKA',
        supplier: 'NAPOMENA ZA DOBAVLJAČE'
    };

    const NoteCard = ({ title, icon: Icon, value, onChange, placeholder, color = '#1e293b', fullWidth = false }: any) => (
        <div
            style={{ 
                padding: '16px 20px', 
                gridColumn: fullWidth ? 'span 2' : 'span 1', 
                background: 'white',
                borderRadius: '16px',
                border: `1px solid ${silverBorder}`,
                boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{
                        width: '32px', height: '32px', borderRadius: '8px',
                        background: `${color}10`, color: color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        border: `1px solid ${color}20`
                    }}>
                        <Icon size={16} />
                    </div>
                    <h4 style={{ margin: 0, fontSize: '10px', fontWeight: 950, letterSpacing: '0.4px', color: navy }}>{title}</h4>
                </div>
                {title === 'INTERNA BELEŠKA' && (
                    <div style={{ fontSize: '9px', fontWeight: 950, padding: '4px 10px', borderRadius: '8px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Lock size={10} /> PRIVATNO
                    </div>
                )}
            </div>
            
            <DebouncedTextArea value={value} onChange={onChange} placeholder={placeholder} fullWidth={fullWidth} />
            
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                 <div style={{ fontSize: '9px', fontWeight: 800, color: '#64748b' }}>{(value || '').length} karaktera</div>
            </div>
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '80px' }}>
            {/* Header Area */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: navy, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 5px 15px rgba(30,41,59,0.1)' }}>
                        <StickyNote size={24} />
                    </div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '24px', fontWeight: 950, color: navy, letterSpacing: '-0.5px' }}>BELEŠKE I NAPOMENE</h2>
                        <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, marginTop: '2px' }}>Svi uneti tekstovi se čuvaju automatski u bazi dosijea</div>
                    </div>
                </div>

                <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '14px', padding: '4px', border: `1px solid ${silverBorder}` }}>
                    <button
                        onClick={() => setIsNotepadView(false)}
                        style={{ height: '36px', padding: '0 16px', borderRadius: '11px', background: !isNotepadView ? 'white' : 'transparent', color: navy, border: !isNotepadView ? `1px solid ${silverBorder}` : 'none', fontWeight: 800, fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: !isNotepadView ? '0 2px 8px rgba(0,0,0,0.04)' : 'none' }}
                    >
                        <Terminal size={14} /> EDIT MOD
                    </button>
                    <button
                        onClick={() => setIsNotepadView(true)}
                        style={{ height: '36px', padding: '0 16px', borderRadius: '11px', background: isNotepadView ? 'white' : 'transparent', color: navy, border: isNotepadView ? `1px solid ${silverBorder}` : 'none', fontWeight: 800, fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: isNotepadView ? '0 2px 8px rgba(0,0,0,0.04)' : 'none' }}
                    >
                        <Eye size={14} /> ČIST PREGLED
                    </button>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {!isNotepadView ? (
                    <motion.div
                        key="edit"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', paddingBottom: '350px' }}
                    >
                        <NoteCard
                            title="OPŠTA NAPOMENA"
                            icon={Sparkles}
                            value={dossier?.notes?.general}
                            onChange={(val: string) => handleNoteChange('general', val)}
                            placeholder="Glavne beleške o putovanju..."
                        />
                        <NoteCard
                            title="NAPOMENA ZA UGOVOR"
                            icon={FileText}
                            color="#10b981"
                            value={dossier?.notes?.contract}
                            onChange={(val: string) => handleNoteChange('contract', val)}
                            placeholder="Ovaj tekst ide na ugovor koji klijent dobija..."
                        />
                        <NoteCard
                            title="NAPOMENA ZA VAUČER"
                            icon={Building2}
                            color="#3b82f6"
                            value={dossier?.notes?.voucher}
                            onChange={(val: string) => handleNoteChange('voucher', val)}
                            placeholder="Napomena za hotel/partnera..."
                        />
                        <NoteCard
                            title="INTERNA BELEŠKA"
                            icon={Lock}
                            color="#ef4444"
                            value={dossier?.notes?.internal}
                            onChange={(val: string) => handleNoteChange('internal', val)}
                            placeholder="Samo za interne potrebe agencije..."
                        />
                        <NoteCard
                            title="NAPOMENA ZA DOBAVLJAČE"
                            icon={Briefcase}
                            color="#f59e0b"
                            fullWidth={true}
                            value={dossier?.notes?.supplier}
                            onChange={(val: string) => handleNoteChange('supplier', val)}
                            placeholder="Instrukcije namenjene dobavljačima..."
                        />
                    </motion.div>
                ) : (
                    <motion.div
                        key="preview"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        style={{ padding: '32px 40px', minHeight: '500px', background: 'white', borderRadius: '24px', border: `1px solid ${silverBorder}`, boxShadow: '0 15px 40px rgba(0,0,0,0.04)', paddingBottom: '600px' }}
                    >
                         <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px', paddingBottom: '20px', borderBottom: `1px solid ${silverBorder}` }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#f1f5f9', color: navy, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${silverBorder}` }}>
                                <FileText size={20} />
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 950, color: navy }}>STRUKTURAN PREGLED BELEŠKI</h3>
                                <div style={{ fontSize: '11px', color: '#64748b' }}>Dokumentaciona forma za arhivu</div>
                            </div>
                         </div>

                         <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            {Object.keys(labelMap).map((key) => {
                                const value = (dossier?.notes as any)?.[key];
                                return (
                                    <div key={key} style={{ opacity: value ? 1 : 0.4 }}>
                                        <div style={{ fontSize: '9px', fontWeight: 950, color: '#64748b', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: navy }}></div>
                                            {labelMap[key]}
                                        </div>
                                        <div style={{ fontSize: '13px', lineHeight: 1.5, color: navy, background: '#f8fafc', padding: '16px 20px', borderRadius: '12px', borderLeft: `4px solid ${navy}` }}>
                                            {value || 'Nema upisanog sadržaja za ovu sekciju.'}
                                        </div>
                                    </div>
                                );
                            })}
                         </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
