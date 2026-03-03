import React from 'react';
import { Settings, Globe, Bell, Shield, Database, Trash2, Save } from 'lucide-react';
import type { Dossier } from '../../types/reservationArchitect';

interface SettingsViewProps {
    dossier: Dossier;
    setDossier: React.Dispatch<React.SetStateAction<Dossier>>;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ dossier, setDossier }) => {
    return (
        <div className="settings-view-v2">
            <div className="section-header">
                <div className="title">
                    <Settings size={20} className="cyan" />
                    <h3>PODEŠAVANJA DOSIJEA</h3>
                </div>
            </div>

            <div className="settings-grid">
                <div className="settings-card glass">
                    <div className="card-header">
                        <Globe size={18} className="cyan" />
                        <h4>LOKALIZACIJA</h4>
                    </div>
                    <div className="setting-item">
                        <label>JEZIK DOKUMENTACIJE</label>
                        <select
                            value={dossier.language}
                            onChange={(e) => setDossier({ ...dossier, language: e.target.value as any })}
                        >
                            <option value="Srpski">Srpski (SR)</option>
                            <option value="Engleski">Engleski (EN)</option>
                        </select>
                    </div>
                </div>

                <div className="settings-card glass">
                    <div className="card-header">
                        <Bell size={18} className="gold" />
                        <h4>NOTIFIKACIJE</h4>
                    </div>
                    <div className="setting-item toggle">
                        <label>PODSETNIK ZA PLAĆANJE</label>
                        <input type="checkbox" defaultChecked />
                    </div>
                    <div className="setting-item toggle">
                        <label>VIBER POTVRDA UPLATE</label>
                        <input type="checkbox" defaultChecked />
                    </div>
                </div>

                <div className="settings-card glass">
                    <div className="card-header">
                        <Shield size={18} className="success" />
                        <h4>ADMINISTRACIJA</h4>
                    </div>
                    <button className="admin-btn danger">
                        <Trash2 size={16} /> OBRIŠI DOSIJE
                    </button>
                    <p className="hint">Ova akcija je nepovratna i zahteva administratorsku šifru.</p>
                </div>

                <div className="settings-card glass">
                    <div className="card-header">
                        <Database size={18} className="cyan" />
                        <h4>INTEGRACIJE</h4>
                    </div>
                    <div className="integration-status">
                        <div className="node">
                            <span>SOLVEX SYNC</span>
                            <span className="status-dot online"></span>
                        </div>
                        <div className="node">
                            <span>SABRE GDS</span>
                            <span className="status-dot offline"></span>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                .settings-view-v2 {
                    display: flex;
                    flex-direction: column;
                    gap: 30px;
                }
                .section-header h3 {
                    margin: 0;
                    font-size: 14px;
                    font-weight: 900;
                    letter-spacing: 2px;
                }
                .settings-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 20px;
                }
                .settings-card {
                    padding: 24px;
                    border-radius: 20px;
                    display: flex;
                    flex-direction: column;
                    gap: 15px;
                }
                .card-header {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 5px;
                }
                .card-header h4 {
                    margin: 0;
                    font-size: 12px;
                    font-weight: 800;
                    color: var(--fil-text);
                }
                .setting-item {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }
                .setting-item.toggle {
                    flex-direction: row;
                    justify-content: space-between;
                    align-items: center;
                }
                .setting-item label {
                    font-size: 10px;
                    font-weight: 800;
                    color: var(--fil-text-dim);
                }
                .setting-item select {
                    background: rgba(0,0,0,0.2);
                    border: 1px solid var(--fil-border);
                    color: white;
                    padding: 10px;
                    border-radius: 10px;
                }
                .admin-btn {
                    width: 100%;
                    padding: 12px;
                    border-radius: 12px;
                    border: 1px solid var(--fil-danger);
                    background: rgba(255, 77, 77, 0.1);
                    color: var(--fil-danger);
                    font-weight: 800;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 10px;
                }
                .hint {
                    font-size: 10px;
                    color: var(--fil-text-dim);
                    font-style: italic;
                }
                .integration-status {
                    display: flex;
                    flex-direction: column;
                    gap: 10px;
                }
                .integration-status .node {
                    display: flex;
                    justify-content: space-between;
                    font-size: 11px;
                    font-weight: 700;
                    color: var(--fil-text-dim);
                }
                .status-dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                }
                .status-dot.online { background: var(--fil-success); box-shadow: 0 0 5px var(--fil-success); }
                .status-dot.offline { background: var(--fil-danger); }
            `}</style>
        </div>
    );
};
