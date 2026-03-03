import React from 'react';
import { Settings, Globe, Bell, Shield, Database, Trash2, Save, Cpu, Smartphone, Activity } from 'lucide-react';
import type { Dossier } from '../../types/reservationArchitect';

interface SettingsViewProps {
    dossier: Dossier;
    setDossier: React.Dispatch<React.SetStateAction<Dossier>>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ dossier, setDossier }) => {
    return (
        <div className="v4-settings-view" style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <Settings size={22} className="cyan-text" />
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 950, letterSpacing: '1px' }}>KONFIGURACIJA DOSIJEA</h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>

                {/* LOKALIZACIJA */}
                <div className="v4-table-card" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '20px' }}>
                        <Globe size={18} className="cyan-text" />
                        <h4 style={{ margin: 0, fontSize: '12px', fontWeight: 900, color: 'var(--text-secondary)' }}>LOKALIZACIJA I JEZIK</h4>
                    </div>
                    <div className="v4-input-group">
                        <label className="v4-label">PRIMARNI JEZIK DOKUMENTACIJE</label>
                        <select
                            className="v4-input"
                            value={dossier.language}
                            onChange={(e) => setDossier({ ...dossier, language: e.target.value as any })}
                        >
                            <option value="Srpski">Srpski (RS-LAT)</option>
                            <option value="Engleski">Engleski (UK-EN)</option>
                        </select>
                    </div>
                </div>

                {/* AUTOMATIZACIJA */}
                <div className="v4-table-card" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '20px' }}>
                        <Bell size={18} style={{ color: '#fbbf24' }} />
                        <h4 style={{ margin: 0, fontSize: '12px', fontWeight: 900, color: 'var(--text-secondary)' }}>AUTOMATIZACIJA I NOTIFIKACIJE</h4>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div className="v4-text-main" style={{ fontSize: '14px' }}>PODSETNIK PLAĆANJA</div>
                                <div className="v4-text-dim" style={{ fontSize: '11px' }}>Slanje SMS/Viber poruke pred rok</div>
                            </div>
                            <div className="v4-status-pill success" style={{ cursor: 'pointer' }}>ENABLED</div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div className="v4-text-main" style={{ fontSize: '14px' }}>VIBER POTVRDA</div>
                                <div className="v4-text-dim" style={{ fontSize: '11px' }}>Automatska potvrda uplate klijentu</div>
                            </div>
                            <div className="v4-status-pill success" style={{ cursor: 'pointer' }}>ENABLED</div>
                        </div>
                    </div>
                </div>

                {/* SYNC NODES */}
                <div className="v4-table-card" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '20px' }}>
                        <Cpu size={18} style={{ color: '#3b82f6' }} />
                        <h4 style={{ margin: 0, fontSize: '12px', fontWeight: 900, color: 'var(--text-secondary)' }}>CORE MODULE SYNC NODES</h4>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', fontWeight: 800 }}>
                                <Activity size={14} style={{ color: '#10b981' }} /> SOLVEX CLOUD
                            </div>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }}></div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px', fontWeight: 800 }}>
                                <Activity size={14} style={{ color: '#ef4444' }} /> SABRE GDS GATEWAY
                            </div>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }}></div>
                        </div>
                    </div>
                </div>

                {/* CRITICAL ACTIONS */}
                <div className="v4-table-card" style={{ padding: '24px', border: '1px solid rgba(239, 68, 68, 0.2)', background: 'rgba(239, 68, 68, 0.02)' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '20px' }}>
                        <Shield size={18} style={{ color: '#ef4444' }} />
                        <h4 style={{ margin: 0, fontSize: '12px', fontWeight: 900, color: '#ef4444' }}>CRITICAL ACTIONS</h4>
                    </div>
                    <button className="v4-tab-btn" style={{ width: '100%', height: '44px', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', justifyContent: 'center' }}>
                        <Trash2 size={18} /> OBRIŠI DOSIJE
                    </button>
                    <p style={{ fontSize: '11px', fontStyle: 'italic', color: 'var(--text-secondary)', marginTop: '12px', textAlign: 'center' }}>
                        Ova akcija je nepovratna i zahteva Root privilegije.
                    </p>
                </div>

            </div>
        </div>
    );
};
