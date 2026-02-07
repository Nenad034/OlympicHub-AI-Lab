import React, { useState } from 'react';
import { useAuthStore } from '../stores';
import { Cpu, Zap, Shield, Key, CheckCircle2, AlertTriangle, Save, Sparkles } from 'lucide-react';

const B2BSettings: React.FC = () => {
    const { userName, aiKeys, setAIKeys } = useAuthStore();
    const [keys, setKeys] = useState(aiKeys || { gemini: '', openai: '', claude: '' });
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

    const handleSave = () => {
        setIsSaving(true);
        setSaveStatus('idle');

        // Simulate API call or just save to store
        setTimeout(() => {
            setAIKeys(keys);
            setIsSaving(false);
            setSaveStatus('success');
            setTimeout(() => setSaveStatus('idle'), 3000);
        }, 800);
    };

    return (
        <div className="b2b-settings-container fade-in" style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
            <div className="settings-header" style={{ marginBottom: '30px' }}>
                <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '10px' }}>
                    Podešavanja Naloga
                </h1>
                <p style={{ color: 'var(--text-secondary)' }}>
                    Upravljajte svojim API ključevima i personalizujte svoj AI asistent.
                </p>
            </div>

            <div className="settings-section" style={{ background: 'var(--card-bg)', borderRadius: '24px', padding: '30px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-lg)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}>
                        <Sparkles size={24} />
                    </div>
                    <div>
                        <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>AI Asistent (Personalni Ključevi)</h2>
                        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
                            Unesite svoje API ključeve kako biste koristili AI funkcionalnosti bez dodatnih troškova za agenciju.
                        </p>
                    </div>
                </div>

                <div className="key-inputs" style={{ display: 'grid', gap: '20px' }}>
                    <div className="input-group">
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                            Google Gemini API Key
                        </label>
                        <div style={{ position: 'relative' }}>
                            <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                                <Cpu size={18} />
                            </div>
                            <input
                                type="password"
                                placeholder="sk-proj-..."
                                value={keys.gemini}
                                onChange={(e) => setKeys({ ...keys, gemini: e.target.value })}
                                style={{
                                    width: '100%',
                                    padding: '14px 16px 14px 48px',
                                    borderRadius: '14px',
                                    background: 'rgba(0,0,0,0.2)',
                                    border: '1px solid var(--border-color)',
                                    color: '#fff',
                                    fontSize: '14px'
                                }}
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                            OpenAI API Key (ChatGPT)
                        </label>
                        <div style={{ position: 'relative' }}>
                            <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                                <Zap size={18} />
                            </div>
                            <input
                                type="password"
                                placeholder="sk-..."
                                value={keys.openai}
                                onChange={(e) => setKeys({ ...keys, openai: e.target.value })}
                                style={{
                                    width: '100%',
                                    padding: '14px 16px 14px 48px',
                                    borderRadius: '14px',
                                    background: 'rgba(0,0,0,0.2)',
                                    border: '1px solid var(--border-color)',
                                    color: '#fff',
                                    fontSize: '14px'
                                }}
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                            Anthropic API Key (Claude)
                        </label>
                        <div style={{ position: 'relative' }}>
                            <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>
                                <Shield size={18} />
                            </div>
                            <input
                                type="password"
                                placeholder="sk-ant-..."
                                value={keys.claude}
                                onChange={(e) => setKeys({ ...keys, claude: e.target.value })}
                                style={{
                                    width: '100%',
                                    padding: '14px 16px 14px 48px',
                                    borderRadius: '14px',
                                    background: 'rgba(0,0,0,0.2)',
                                    border: '1px solid var(--border-color)',
                                    color: '#fff',
                                    fontSize: '14px'
                                }}
                            />
                        </div>
                    </div>
                </div>

                <div style={{ marginTop: '30px', padding: '16px', background: 'rgba(234, 179, 8, 0.05)', borderRadius: '14px', border: '1px solid rgba(234, 179, 8, 0.2)', display: 'flex', gap: '12px' }}>
                    <AlertTriangle size={20} color="#eab308" style={{ flexShrink: 0 }} />
                    <p style={{ fontSize: '13px', color: '#facc15', margin: 0 }}>
                        Vaši ključevi se čuvaju lokalno u vašem pretraživaču i koriste se isključivo za vaše pretrage. Olympic Travel nikada ne vidi niti čuva ove ključeve na svojim serverima.
                    </p>
                </div>

                <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '20px' }}>
                    {saveStatus === 'success' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#22c55e', fontSize: '14px', fontWeight: 600 }}>
                            <CheckCircle2 size={18} />
                            Promene su sačuvane!
                        </div>
                    )}
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        style={{
                            padding: '14px 30px',
                            borderRadius: '14px',
                            background: isSaving ? '#64748b' : 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)',
                            color: '#fff',
                            border: 'none',
                            fontWeight: 700,
                            fontSize: '15px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            transition: 'all 0.2s',
                            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
                        }}
                    >
                        {isSaving ? 'Čuvanje...' : <><Save size={18} /> Sačuvaj Podešavanja</>}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default B2BSettings;
