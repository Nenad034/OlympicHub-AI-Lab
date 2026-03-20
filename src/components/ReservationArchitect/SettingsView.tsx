import React from 'react';
import {
    Settings, Globe, Bell, Shield, Database, Trash2, Save,
    Cpu, Smartphone, Activity, ChevronDown, Monitor, Zap,
    Lock, Share2, Mail, Layout, Terminal, Key, Info, ShieldAlert,
    RefreshCw, CloudIcon
} from 'lucide-react';
import type { Dossier, ActivityLog } from '../../types/reservationArchitect';
import { motion } from 'framer-motion';

interface SettingsViewProps {
    dossier: Dossier;
    setDossier: React.Dispatch<React.SetStateAction<Dossier>>;
    addLog: (action: string, details: string, type: ActivityLog['type']) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ dossier, setDossier, addLog }) => {
    
    const navy = '#1e293b';
    const silverBorder = 'rgba(30, 41, 59, 0.1)';

    const handleSettingChange = (key: keyof Dossier, value: any) => {
        setDossier(prev => ({ ...prev, [key]: value }));
        addLog('Podešavanja', `Promena parametra [${key}]: ${value}`, 'info');
    };

    const SettingCard = ({ title, icon: Icon, children, color = '#1e293b' }: any) => (
        <div 
            style={{ 
                padding: '28px', background: 'white', borderRadius: '24px', 
                border: `1px solid ${silverBorder}`, display: 'flex', flexDirection: 'column', gap: '24px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.02)'
            }}
        >
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{
                    width: '40px', height: '40px', borderRadius: '12px',
                    background: `${color}10`, color: color,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: `1px solid ${color}20`
                }}>
                    <Icon size={20} />
                </div>
                <h4 style={{ margin: 0, fontSize: '12px', fontWeight: 950, letterSpacing: '0.5px', color: navy }}>{title}</h4>
            </div>
            <div style={{ flex: 1 }}>{children}</div>
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px', color: navy, paddingBottom: '100px' }}>

            {/* Header Area */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '20px', background: navy, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 30px rgba(30,41,59,0.2)' }}>
                    <Settings size={28} />
                </div>
                <div>
                    <h2 style={{ margin: 0, fontSize: '30px', fontWeight: 950, color: navy, letterSpacing: '-1px' }}>KONFIGURACIJA DOSIJE V4</h2>
                    <div style={{ fontSize: '13px', color: '#64748b', fontWeight: 600, marginTop: '4px' }}>Upravljanje sistemskim okidačima i sinhronizacijom podataka</div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '32px' }}>

                {/* LOCALE SETTINGS */}
                <SettingCard title="LOKALIZACIJA I DOKUMENTI" icon={Globe}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                            <label style={{ fontSize: '10px', fontWeight: 950, color: '#64748b', display: 'block', marginBottom: '8px' }}>JEZIK ŠTAMPE</label>
                            <div style={{ position: 'relative' }}>
                                <select
                                    style={{ width: '100%', height: '54px', padding: '0 16px', borderRadius: '16px', border: `1px solid ${silverBorder}`, background: '#f8fafc', fontSize: '14px', fontWeight: 900, outline: navy, appearance: 'none' }}
                                    value={dossier.language}
                                    onChange={(e) => handleSettingChange('language', e.target.value)}
                                >
                                    <option value="Srpski">SRPSKI (RS-LAT)</option>
                                    <option value="Engleski">ENGLESKI (UK-EN)</option>
                                </select>
                                <ChevronDown size={18} style={{ position: 'absolute', right: '16px', top: '18px', pointerEvents: 'none', opacity: 0.5 }} />
                            </div>
                        </div>
                        <div style={{ padding: '16px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '16px', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                            <Info size={16} color="#3b82f6" style={{ marginTop: '2px' }} />
                            <div style={{ fontSize: '12px', lineHeight: 1.5, color: '#1e40af', fontWeight: 600 }}>
                                Promena jezika utiče na sve buduće PDF reporte, ugovore i vaučere koji se generišu iz ovog dosijea.
                            </div>
                        </div>
                    </div>
                </SettingCard>

                {/* AUTOMATION TRIGGERED BY SYSTEM */}
                <SettingCard title="SISTEMSKI OKIDAČI" icon={Zap} color="#f59e0b">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                         {[
                            { label: 'SMS PODSETNIK PLAĆANJA', desc: 'Slanje SMS-a 2 dana pred rok', status: 'ACTIVE', color: '#10b981' },
                            { label: 'VIBER POTVRDA UPLATE', desc: 'Automatska potvrda nakon knjiženja', status: 'ACTIVE', color: '#10b981' },
                            { label: 'AUTO-GENERATE VOUCHER', desc: 'Generisanje vaučera nakon isplate 100%', status: 'PAUSED', color: '#f59e0b' }
                         ].map((item, i) => (
                            <div key={i} style={{ padding: '16px', background: '#f8fafc', borderRadius: '16px', border: `1px solid ${silverBorder}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <div>
                                    <div style={{ fontSize: '12px', fontWeight: 950 }}>{item.label}</div>
                                    <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 600, marginTop: '2px' }}>{item.desc}</div>
                                </div>
                                <div style={{ fontSize: '9px', fontWeight: 950, padding: '4px 8px', borderRadius: '6px', background: `${item.color}15`, color: item.color }}>{item.status}</div>
                            </div>
                         ))}
                    </div>
                </SettingCard>

                {/* EXTERNAL INTEGRATIONS */}
                <SettingCard title="EKSTERNE SINHRONIZACIJE" icon={Activity} color="#3b82f6">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '16px', border: `1px solid ${silverBorder}` }}>
                             <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'white', border: `1px solid ${silverBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <CloudIcon size={16} />
                                    </div>
                                    <div style={{ fontSize: '13px', fontWeight: 950 }}>SOLVEX CLOUD API</div>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></div>
                                    <span style={{ fontSize: '10px', fontWeight: 950, color: '#10b981' }}>CONNECTED</span>
                                </div>
                             </div>
                             <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, lineHeight: 1.5 }}>
                                Poslednja uspešna sinhronizacija statusa: <br/> 
                                <span style={{ fontWeight: 800, color: navy }}>{new Date().toLocaleString()}</span>
                             </div>
                        </div>
                        <button style={{ height: '48px', width: '100%', borderRadius: '12px', background: 'white', border: `1px solid ${silverBorder}`, color: navy, fontSize: '11px', fontWeight: 950, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                            <RefreshCw size={14} /> RE-SCAN CONNECTIONS
                        </button>
                    </div>
                </SettingCard>

                {/* DESTRUCTIVE / CORE ACTIONS */}
                <SettingCard title="BEZBEDNOST I PRIVILEGIJE" icon={Lock} color="#ef4444">
                    <div style={{ padding: '20px', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '20px', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '20px' }}>
                            <ShieldAlert size={20} color="#ef4444" />
                            <div style={{ fontSize: '13px', fontWeight: 950, color: '#ef4444' }}>CRITICAL ACTIONS HUB</div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <button style={{ height: '52px', border: 'none', background: '#ef4444', color: 'white', borderRadius: '14px', fontSize: '12px', fontWeight: 950, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                                <Trash2 size={16} /> OBRIŠI DOSIJE PERMANENTNO
                            </button>
                            <button style={{ height: '52px', border: `1px solid ${silverBorder}`, background: 'white', color: navy, borderRadius: '14px', fontSize: '11px', fontWeight: 950, cursor: 'pointer' }}>
                                RE-GENERATE ENCRYPTION KEY
                            </button>
                        </div>
                    </div>
                </SettingCard>

            </div>
        </div>
    );
};
