import React from 'react';
import { motion } from 'framer-motion';
import { Bell, Mail, BarChart2, Shield, Clock, Check, AlertCircle, TestTube } from 'lucide-react';
import { useNotificationStore } from '../../stores';
import { useToast } from '../../components/ui/Toast';
import type { NotificationSettings } from '../../stores';
import './NotificationCenter.css';

interface NotificationCenterProps {
    onBack?: () => void;
}

const NotificationCenter: React.FC<NotificationCenterProps> = ({ onBack }) => {
    const { settings, updateSettings } = useNotificationStore();
    const { success, error, warning, info } = useToast();

    const testNotifications = () => {
        success('Test Uspešno!', 'Ovo je test notifikacija tipa SUCCESS');
        setTimeout(() => error('Test Greška!', 'Ovo je test notifikacija tipa ERROR'), 1000);
        setTimeout(() => warning('Test Upozorenje!', 'Ovo je test notifikacija tipa WARNING'), 2000);
        setTimeout(() => info('Test Info!', 'Ovo je test notifikacija tipa INFO'), 3000);
    };

    const modules: { id: keyof NotificationSettings; name: string; icon: React.ReactNode; color: string }[] = [
        { id: 'mail', name: 'Email Poruke', icon: <Mail size={20} />, color: '#ea4335' },
        { id: 'pricing', name: 'Pricing Intelligence', icon: <BarChart2 size={20} />, color: '#3fb950' },
        { id: 'system', name: 'Sistemska Obaveštenja', icon: <Shield size={20} />, color: '#3b82f6' },
    ];

    return (
        <div className="notification-center">
            <header className="nc-header">
                <div className="nc-title-area">
                    <div className="nc-icon-wrapper">
                        <Bell size={24} />
                    </div>
                    <div>
                        <h1>Centar za Notifikacije</h1>
                        <p>Podesite parametre obaveštenja za svaki modul Hub-a</p>
                    </div>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                        className="nc-test-button"
                        onClick={testNotifications}
                        style={{
                            padding: '8px 16px',
                            background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: '8px',
                            color: 'white',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            fontSize: '14px',
                            fontWeight: '500'
                        }}
                    >
                        <TestTube size={16} />
                        Test Notifikacije
                    </button>
                    {onBack && (
                        <button className="nc-back-button" onClick={onBack}>
                            Nazad
                        </button>
                    )}
                </div>
            </header>

            <div className="nc-content">
                {modules.map((module) => (
                    <motion.div
                        key={module.id}
                        className="nc-module-card"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className="nc-module-header">
                            <div className="nc-module-info">
                                <div className="nc-module-icon" style={{ color: module.color, background: `${module.color}15` }}>
                                    {module.icon}
                                </div>
                                <div className="nc-module-details">
                                    <h3>{module.name}</h3>
                                    <span className={`nc-status ${settings[module.id].enabled ? 'enabled' : 'disabled'}`}>
                                        {settings[module.id].enabled ? 'Aktivno' : 'Onemogućeno'}
                                    </span>
                                </div>
                            </div>
                            <label className="nc-switch">
                                <input
                                    type="checkbox"
                                    checked={settings[module.id].enabled}
                                    onChange={(e) => updateSettings(module.id, { enabled: e.target.checked })}
                                />
                                <span className="nc-slider"></span>
                            </label>
                        </div>

                        <div className="nc-module-settings">
                            <div className="nc-setting-item">
                                <div className="nc-setting-label">
                                    <Clock size={16} />
                                    <span>Trajanje obaveštenja (sekunde)</span>
                                </div>
                                <div className="nc-setting-control">
                                    <input
                                        type="range"
                                        min="1"
                                        max="30"
                                        value={settings[module.id].duration}
                                        onChange={(e) => updateSettings(module.id, { duration: parseInt(e.target.value) })}
                                        disabled={!settings[module.id].enabled}
                                    />
                                    <span className="nc-value">{settings[module.id].duration}s</span>
                                </div>
                            </div>
                        </div>

                        {settings[module.id].enabled ? (
                            <div className="nc-preview-info">
                                <Check size={14} />
                                <span>Notifikacije će se prikazivati {settings[module.id].duration} sekundi.</span>
                            </div>
                        ) : (
                            <div className="nc-preview-info warning">
                                <AlertCircle size={14} />
                                <span>Notifikacije su isključene za ovaj modul.</span>
                            </div>
                        )}
                    </motion.div>
                ))}
            </div>
        </div>
    );
};

export default NotificationCenter;
