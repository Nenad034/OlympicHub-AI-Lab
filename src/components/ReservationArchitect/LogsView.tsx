import React, { useState } from 'react';
import { 
    Clock, History, User, Info, CheckCircle2, 
    AlertCircle, ShieldCheck, Database, Search, 
    Filter, ArrowUpRight, Zap, MoreVertical, 
    ChevronRight, Terminal, Globe, Smartphone, Mail, Calendar, X,
    CalendarCheck, CalendarDays
} from 'lucide-react';
import type { Dossier, ActivityLog, CommunicationRecord } from '../../types/reservationArchitect';
import { motion, AnimatePresence } from 'framer-motion';

interface LogsViewProps {
    dossier: Dossier;
}

// Global helper for the smart entry DDMMYYYY -> DD.MM.YYYY.
const SmartDateInput = ({ label, value, onChange }: any) => {
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let val = e.target.value.replace(/\D/g, '').slice(0, 8);
        
        if (val.length === 8) {
            const d = val.slice(0, 2);
            const m = val.slice(2, 4);
            const y = val.slice(4);
            onChange(`${d}.${m}.${y}.`);
        } else {
            onChange(val);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ fontSize: '9px', fontWeight: 950, color: '#64748b', letterSpacing: '0.5px' }}>{label}</span>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Calendar size={14} style={{ position: 'absolute', left: '12px', color: '#1e293b' }} />
                <input 
                    type="text"
                    value={value}
                    onChange={handleInputChange}
                    placeholder="01052026"
                    style={{ 
                        width: '130px', height: '40px', background: 'white', 
                        border: '2px solid #1e293b', borderRadius: '12px',
                        padding: '0 12px 0 34px', fontSize: '13px', fontWeight: 950, color: '#1e293b',
                        outline: 'none', boxShadow: '0 2px 8px rgba(30,41,59,0.05)'
                    }} 
                />
            </div>
        </div>
    );
};

export const LogsView: React.FC<LogsViewProps> = ({ dossier }) => {
    const [auditStart, setAuditStart] = useState('');
    const [auditEnd, setAuditEnd] = useState('');
    const [msgStart, setMsgStart] = useState('');
    const [msgEnd, setMsgEnd] = useState('');
    
    const navy = '#1e293b';
    const silverBorder = 'rgba(30, 41, 59, 0.1)';

    const renderLogIcon = (type: string) => {
        switch (type) {
            case 'success': return <CheckCircle2 size={16} style={{ color: '#10b981' }} />;
            case 'danger': return <AlertCircle size={16} style={{ color: '#ef4444' }} />;
            case 'warning': return <AlertCircle size={16} style={{ color: '#f59e0b' }} />;
            default: return <Info size={16} style={{ color: '#3b82f6' }} />;
        }
    };

    const parseDate = (dStr: string) => {
        const match = dStr.match(/(\d{2})\.(\d{2})\.(\d{4})/);
        return match ? new Date(`${match[3]}-${match[2]}-${match[1]}`) : null;
    };

    const matchesRange = (targetTs: string, startStr: string, endStr: string) => {
        if (!startStr && !endStr) return true;
        const target = parseDate(targetTs);
        if (!target) return true;

        if (startStr && startStr.length >= 10) {
            const s = parseDate(startStr);
            if (s && target < s) return false;
        }
        if (endStr && endStr.length >= 10) {
            const e = parseDate(endStr);
            if (e && target > e) return false;
        }
        return true;
    };

    const filteredLogs = (dossier.logs || []).filter(l => matchesRange(l.timestamp, auditStart, auditEnd));
    const filteredComms = (dossier.communications || []).filter(c => matchesRange(c.timestamp, msgStart, msgEnd));

    const FilterBar = ({ start, setStart, end, setEnd }: any) => (
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', background: '#f8fafc', padding: '12px 16px', borderRadius: '20px', border: `1px solid ${silverBorder}`, boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}>
            <SmartDateInput label="OD DATUMA" value={start} onChange={setStart} />
            <SmartDateInput label="DO DATUMA" value={end} onChange={setEnd} />
            {(start || end) && (
                <button 
                    onClick={() => { setStart(''); setEnd(''); }} 
                    style={{ width: '40px', height: '40px', borderRadius: '12px', background: navy, color: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                    <X size={18} />
                </button>
            )}
        </div>
    );

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '32px', color: navy, paddingBottom: '100px' }}>
            
            {/* AUDIT LOGS */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: navy, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 5px 15px rgba(0,0,0,0.1)' }}>
                            <History size={22} />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 950, letterSpacing: '-0.5px' }}>AUDIT LOGOVI</h3>
                            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>Hronologija svih sistemskih izmena</div>
                        </div>
                    </div>
                </div>
                
                <FilterBar start={auditStart} setStart={setAuditStart} end={auditEnd} setEnd={setAuditEnd} />

                <div style={{ background: 'white', border: `1px solid ${silverBorder}`, borderRadius: '24px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                    <div className="v4-scroll-area" style={{ height: '700px', padding: '16px' }}>
                        {filteredLogs.length ? filteredLogs.slice().reverse().map((log, i) => (
                            <motion.div key={log.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: '20px', borderBottom: i === filteredLogs.length - 1 ? 'none' : `1px solid ${silverBorder}`, display: 'flex', gap: '16px' }}>
                                <div style={{ marginTop: '2px' }}>{renderLogIcon(log.type)}</div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                                        <div style={{ fontSize: '13px', fontWeight: 950 }}>{log.action}</div>
                                        <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 800 }}>{log.timestamp}</div>
                                    </div>
                                    <p style={{ margin: 0, fontSize: '12px', color: '#64748b', lineHeight: 1.5, fontWeight: 500 }}>{log.details}</p>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px', opacity: 0.6 }}>
                                        <User size={12} /> <span style={{ fontSize: '10px', fontWeight: 950 }}>{log.operator || 'SISTEM'}</span>
                                    </div>
                                </div>
                            </motion.div>
                        )) : <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '400px', opacity: 0.2 }}><Zap size={48} /><div style={{ fontSize: '14px', fontWeight: 950, marginTop: '20px' }}>NEMA REZULTATA DRŽEĆI FILTER</div></div>}
                    </div>
                </div>
            </div>

            {/* MESSAGES */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: '#f1f5f9', color: navy, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `1px solid ${silverBorder}` }}>
                            <Smartphone size={22} />
                        </div>
                        <div>
                            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 950, letterSpacing: '-0.5px' }}>ARHIVA PORUKA</h3>
                            <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>Kompletna komunikacija</div>
                        </div>
                    </div>
                </div>

                <FilterBar start={msgStart} setStart={setMsgStart} end={msgEnd} setEnd={setMsgEnd} />

                <div style={{ background: 'white', border: `1px solid ${silverBorder}`, borderRadius: '24px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                    <div className="v4-scroll-area" style={{ height: '700px', padding: '24px' }}>
                        {filteredComms.length ? filteredComms.slice().reverse().map((comm, i) => (
                            <motion.div key={comm.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: '20px', background: '#f8fafc', borderRadius: '16px', border: `1px solid ${silverBorder}`, marginBottom: '16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: navy, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            {comm.channel === 'email' ? <Mail size={16} /> : <Smartphone size={16} />}
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '9px', fontWeight: 950, opacity: 0.5 }}>{comm.channel.toUpperCase()}</div>
                                            <div style={{ fontSize: '12px', fontWeight: 950 }}>TO: {comm.recipient}</div>
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '10px', fontWeight: 800, color: '#94a3b8' }}>{comm.timestamp}</div>
                                </div>
                                <div style={{ background: 'white', padding: '16px', borderRadius: '12px', border: `1px solid ${silverBorder}`, fontSize: '13px', lineHeight: 1.6, color: '#1e293b', fontWeight: 500 }}>
                                    {comm.message}
                                </div>
                            </motion.div>
                        )) : <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '400px', opacity: 0.2 }}><Mail size={48} /><div style={{ fontSize: '14px', fontWeight: 950, marginTop: '20px' }}>NEMA PORUKA</div></div>}
                    </div>
                </div>
            </div>

        </div>
    );
};
