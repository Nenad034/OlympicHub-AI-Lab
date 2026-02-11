import React, { useState } from 'react';
import { useAuthStore } from '../stores';
import {
    Cpu, Zap, Shield, CheckCircle2, AlertTriangle, Save,
    Sparkles, Search, Building2, Calendar, Database,
    RefreshCw, Loader2
} from 'lucide-react';
import { syncSolvexMedia } from '../services/solvex/solvexMediaService';

const B2BSettings: React.FC = () => {
    const { aiKeys, setAIKeys } = useAuthStore();
    const [activeView, setActiveView] = useState<'keys' | 'docs' | 'providers'>('keys');
    const [activeDocSection, setActiveDocSection] = useState<'search' | 'inventory' | 'ai' | 'booking'>('search');
    const [keys, setKeys] = useState(aiKeys || { gemini: '', openai: '', claude: '' });
    const [isSaving, setIsSaving] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [syncStatus, setSyncStatus] = useState<'idle' | 'success' | 'error'>('idle');

    const handleSave = () => {
        setIsSaving(true);
        setSaveStatus('idle');
        setTimeout(() => {
            setAIKeys(keys);
            setIsSaving(false);
            setSaveStatus('success');
            setTimeout(() => setSaveStatus('idle'), 3000);
        }, 800);
    };

    const handleSyncSolvex = async () => {
        setIsSyncing(true);
        setSyncStatus('idle');
        try {
            const result = await syncSolvexMedia();
            if (result.success) {
                setSyncStatus('success');
            } else {
                setSyncStatus('error');
            }
        } catch (error) {
            setSyncStatus('error');
        } finally {
            setIsSyncing(false);
            setTimeout(() => setSyncStatus('idle'), 5000);
        }
    };

    const renderApiDocs = () => {
        const sections = [
            { id: 'search', label: 'Unified Search', icon: <Search size={22} />, color: '#0ea5e9' },
            { id: 'inventory', label: 'Inventory', icon: <Building2 size={22} />, color: '#8b5cf6' },
            { id: 'ai', label: 'AI Analytics', icon: <Sparkles size={22} />, color: '#10b981' },
            { id: 'booking', label: 'Booking Engine', icon: <Calendar size={22} />, color: '#f59e0b' }
        ];

        const docContent = {
            search: {
                title: 'UNIFIED SEARCH ENDPOINT',
                endpoint: 'POST /v1/search/unified',
                description: 'Federated Search kroz sve izvore. Agregira lokalnu bazu i eksterne API-je (SOAP/JSON) u unificirani model sa geo-podacima.',
                code: `// REQUEST
{
  "params": {
    "destination": "Rhodes, GR",
    "dates": { "in": "2025-07-01", "out": "2025-07-10" },
    "occupancy": [{ "pax": "AD", "count": 2 }]
  }
}

// RESPONSE (UNIFIED)
{
  "hotel_id": "OH-GR-102",
  "name": "Olympic Palace Resort",
  "location": { 
    "city": "Rhodes", 
    "geo": [36.4432, 28.2274],
    "address": "Ialyssos Avenue 12"
  },
  "provider": { "sources": ["Solvex", "Local"] },
  "cheapest_offer": {
    "price": 1450.00,
    "currency": "EUR",
    "board": "All Inclusive"
  }
}`
            },
            inventory: {
                title: 'GLOBAL INVENTORY & PRICELIST',
                endpoint: 'GET /v1/inventory/rates/:hotel_id',
                description: 'Srž Orchestratora. Apstrahuje Solvex SOAP cene and manuelne cenovnike u jedinstvenu Pricing matricu sa doplatama i popustima.',
                code: `// UNIFIED PRICELIST STRUCTURE
{
  "contract": "OH-2025-C12",
  "pricing": {
    "base": [
      {
        "period": ["2025-07-01", "2025-08-31"],
        "net": 85.00, "gross": 105.00,
        "board": "HB",
        "room": "DBL_STD"
      }
    ],
    "supplements": [
      { "type": "Tax", "code": "CITY_TAX", "amount": 4.00, "basis": "Night" },
      { "type": "Room", "code": "SEA_VIEW", "amount": 15.00, "basis": "Night" }
    ],
    "discounts": [
      { "type": "EarlyBooking", "value": "15%", "until": "2025-03-31" }
    ],
    "child_policy": [
      { "age": [0, 2], "price": 0 },
      { "age": [3, 12], "reduction": "50%" }
    ]
  }
}`
            },
            ai: {
                title: 'AI YIELD & ANALYTICS',
                endpoint: 'POST /v1/ai/analyze-yield',
                description: 'Inteligentni sloj koji poredi naš "Internal Price" sa tržišnim (Booking/Expedia) i automatski kalkuliše profitabilnost.',
                code: `// ANALYTICS PAYLOAD
{
  "our_price": 105.00,
  "competitors": [
    { "engine": "Booking", "price": 118.00 },
    { "engine": "Expedia", "price": 115.00 }
  ]
}

// AI STRATEGY
{
  "suggestion": "Adjust Gross +2.5%",
  "market_position": "Competitive",
  "projected_profit": "+18.4%",
  "rules": ["DynamicMarkup", "DemandSpike"]
}`
            },
            booking: {
                title: 'UNIFIED BOOKING ENGINE',
                endpoint: 'POST /v1/booking/execute',
                description: 'Jedinstveni proces potvrde. Automatski vrši asinhroni "Ping" ka provajderu i generiše Voucher i Rezervaciju u OH bazi.',
                code: `// EXECUTION PAYLOAD
{
  "offer_token": "TOK_B2B_992183",
  "pax": [
    { "name": "Miloš Perić", "dob": "1985-05-12", "doc": "009123" }
  ],
  "lead_contact": { "email": "milos@example.com" },
  "billing_mode": "CreditLine"
}

// STATUS
{
  "res_id": "RES-2026-X01",
  "status": "Confirmed",
  "provider_ref": "SOL-2930-X",
  "voucher": "https://api.oh.rs/vouchers/X01"
}`
            }
        };

        const current = (docContent as any)[activeDocSection];

        return (
            <div className="api-gateway-docs" style={{
                background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
                borderRadius: '30px',
                padding: '40px',
                minHeight: '600px',
                position: 'relative',
                overflow: 'hidden',
                color: '#fff',
                display: 'flex',
                gap: '40px',
                border: '1px solid rgba(255,255,255,0.1)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}>
                <div style={{ position: 'absolute', top: '-100px', left: '-100px', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(14, 165, 233, 0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', bottom: '-100px', right: '-100px', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />

                <div className="docs-nav" style={{
                    width: '240px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: '20px',
                    padding: '10px',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    zIndex: 2,
                    flexShrink: 0
                }}>
                    {sections.map(section => (
                        <button
                            key={section.id}
                            onClick={() => setActiveDocSection(section.id as any)}
                            style={{
                                padding: '20px 15px',
                                background: activeDocSection === section.id ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                                border: 'none',
                                borderRadius: '15px',
                                color: activeDocSection === section.id ? '#fff' : '#94a3b8',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '8px',
                                cursor: 'pointer',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                position: 'relative',
                                outline: 'none'
                            }}
                        >
                            {activeDocSection === section.id && (
                                <div style={{
                                    position: 'absolute',
                                    left: '0',
                                    top: '20%',
                                    bottom: '20%',
                                    width: '3px',
                                    background: section.color,
                                    borderRadius: '0 4px 4px 0',
                                    boxShadow: `0 0 10px ${section.color}`
                                }} />
                            )}
                            <div style={{ color: activeDocSection === section.id ? section.color : 'inherit' }}>
                                {section.icon}
                            </div>
                            <span style={{ fontSize: '12px', fontWeight: 600, textAlign: 'center' }}>{section.label}</span>
                        </button>
                    ))}
                </div>

                <div className="docs-main" style={{ flex: 1, zIndex: 2, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ marginBottom: '40px' }}>
                        <h1 style={{ fontSize: '48px', fontWeight: 900, letterSpacing: '-0.02em', margin: 0, lineHeight: 1 }}>
                            OLYMPIC <br />
                            <span style={{ color: 'rgba(255,255,255,0.9)' }}>API GATEWAY</span>
                        </h1>
                        <div style={{ height: '4px', width: '60px', background: '#0ea5e9', marginTop: '20px', borderRadius: '2px' }} />
                    </div>

                    <div className="glass-code-card" style={{
                        flex: 1,
                        background: 'rgba(0, 0, 0, 0.3)',
                        backdropFilter: 'blur(20px)',
                        borderRadius: '24px',
                        padding: '30px',
                        border: '1px solid rgba(255, 255, 255, 0.05)',
                        position: 'relative',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '20px'
                    }}>
                        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '15px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#fff' }}>{current.title}</h3>
                                <span style={{ fontFamily: '"JetBrains Mono", monospace', fontSize: '12px', color: '#0ea5e9', background: 'rgba(14, 165, 233, 0.1)', padding: '4px 10px', borderRadius: '6px' }}>
                                    {current.endpoint}
                                </span>
                            </div>
                            <p style={{ margin: '8px 0 0', fontSize: '14px', color: '#94a3b8' }}>{current.description}</p>
                        </div>

                        <pre style={{
                            margin: 0,
                            padding: '20px',
                            background: 'rgba(0,0,0,0.2)',
                            borderRadius: '16px',
                            fontSize: '14px',
                            fontFamily: '"JetBrains Mono", monospace',
                            lineHeight: 1.6,
                            overflowX: 'auto',
                            color: '#e2e8f0',
                            border: '1px solid rgba(255,255,255,0.03)'
                        }}>
                            {current.code.split('\n').map((line: string, i: number) => {
                                const highlightedLine = line
                                    .replace(/"([^"]+)":/g, '<span style="color: #f472b6">"$1"</span>:')
                                    .replace(/: "(.*)"/g, ': <span style="color: #34d399">"$1"</span>')
                                    .replace(/\/\/ (.*)/g, '<span style="color: #94a3b8; font-style: italic">// $1</span>');

                                return (
                                    <div key={i} dangerouslySetInnerHTML={{ __html: highlightedLine || '&nbsp;' }} />
                                );
                            })}
                        </pre>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="b2b-settings-container fade-in" style={{ padding: '20px', maxWidth: '1000px', margin: '0 auto' }}>
            <div className="settings-nav-tabs" style={{ display: 'flex', gap: '5px', marginBottom: '30px', background: 'rgba(0,0,0,0.05)', padding: '5px', borderRadius: '16px', width: 'fit-content' }}>
                <button
                    onClick={() => setActiveView('keys')}
                    style={{
                        padding: '10px 24px', borderRadius: '12px', border: 'none',
                        background: activeView === 'keys' ? 'var(--card-bg)' : 'transparent',
                        color: activeView === 'keys' ? 'var(--text-primary)' : 'var(--text-secondary)',
                        fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                        boxShadow: activeView === 'keys' ? 'var(--shadow-md)' : 'none'
                    }}
                >
                    Nalog i Ključevi
                </button>
                <button
                    onClick={() => setActiveView('providers')}
                    style={{
                        padding: '10px 24px', borderRadius: '12px', border: 'none',
                        background: activeView === 'providers' ? 'var(--card-bg)' : 'transparent',
                        color: activeView === 'providers' ? 'var(--text-primary)' : 'var(--text-secondary)',
                        fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                        boxShadow: activeView === 'providers' ? 'var(--shadow-md)' : 'none'
                    }}
                >
                    Konekcije (Provajderi)
                </button>
                <button
                    onClick={() => setActiveView('docs')}
                    style={{
                        padding: '10px 24px', borderRadius: '12px', border: 'none',
                        background: activeView === 'docs' ? 'var(--card-bg)' : 'transparent',
                        color: activeView === 'docs' ? 'var(--text-primary)' : 'var(--text-secondary)',
                        fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                        boxShadow: activeView === 'docs' ? 'var(--shadow-md)' : 'none'
                    }}
                >
                    API Dokumentacija
                </button>
            </div>

            {activeView === 'keys' ? (
                <>
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
                                            width: '100%', padding: '14px 16px 14px 48px', borderRadius: '14px',
                                            background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)',
                                            color: 'inherit', fontSize: '14px'
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
                                            width: '100%', padding: '14px 16px 14px 48px', borderRadius: '14px',
                                            background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)',
                                            color: 'inherit', fontSize: '14px'
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
                                            width: '100%', padding: '14px 16px 14px 48px', borderRadius: '14px',
                                            background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-color)',
                                            color: 'inherit', fontSize: '14px'
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        <div style={{ marginTop: '30px', padding: '16px', background: 'rgba(234, 179, 8, 0.05)', borderRadius: '14px', border: '1px solid rgba(234, 179, 8, 0.2)', display: 'flex', gap: '12px' }}>
                            <AlertTriangle size={20} color="#eab308" style={{ flexShrink: 0 }} />
                            <p style={{ fontSize: '13px', color: '#eab308', margin: 0 }}>
                                Vaši ključevi se čuvaju lokalno u vašem pretraživaču i koriste se isključivo za vaše pretrage. Olympic Travel nikada ne vidi niti čuva ove ključeve na svojim serverima.
                            </p>
                        </div>

                        <div style={{ marginTop: '40px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '20px' }}>
                            {saveStatus === 'success' && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#22c55e', fontSize: '14px', fontWeight: 600 }}>
                                    <CheckCircle2 size={18} /> Promene su sačuvane!
                                </div>
                            )}
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                style={{
                                    padding: '14px 30px', borderRadius: '14px',
                                    background: isSaving ? '#64748b' : 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)',
                                    color: '#fff', border: 'none', fontWeight: 700, fontSize: '15px', cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', gap: '10px', transition: 'all 0.2s',
                                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
                                }}
                            >
                                {isSaving ? 'Čuvanje...' : <><Save size={18} /> Sačuvaj Podešavanja</>}
                            </button>
                        </div>
                    </div>
                </>
            ) : activeView === 'providers' ? (
                <div className="providers-settings">
                    <div className="settings-header" style={{ marginBottom: '30px' }}>
                        <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '10px' }}>
                            Upravljanje Konekcijama
                        </h1>
                        <p style={{ color: 'var(--text-secondary)' }}>
                            Konfiguracija eksternih provajdera i sinhronizacija statičkih podataka (hoteli, slike, opisi).
                        </p>
                    </div>

                    <div className="provider-card" style={{ background: 'var(--card-bg)', borderRadius: '24px', padding: '30px', border: '1px solid var(--border-color)', boxShadow: 'var(--shadow-md)', marginBottom: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ display: 'flex', gap: '20px' }}>
                                <div style={{ width: '60px', height: '60px', borderRadius: '16px', background: '#f59e0b', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Database size={32} />
                                </div>
                                <div>
                                    <h2 style={{ fontSize: '20px', fontWeight: 700, margin: 0 }}>SOLVEX (Bugarska)</h2>
                                    <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px' }}>SOAP v4 + JSON Media API</p>
                                    <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                                        <span style={{ fontSize: '11px', background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', padding: '4px 8px', borderRadius: '6px', fontWeight: 700 }}>SOAP AKTIVAN</span>
                                        <span style={{ fontSize: '11px', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', padding: '4px 8px', borderRadius: '6px', fontWeight: 700 }}>MEDIA READY</span>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={handleSyncSolvex}
                                disabled={isSyncing}
                                style={{
                                    padding: '12px 20px', borderRadius: '12px',
                                    background: isSyncing ? '#64748b' : 'var(--accent)',
                                    color: 'white', border: 'none', fontWeight: 700,
                                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s'
                                }}
                            >
                                {isSyncing ? <Loader2 size={18} className="spin" /> : <RefreshCw size={18} />}
                                {isSyncing ? 'Sinhronizacija...' : 'Sinhronizuj Slike i Opise'}
                            </button>
                        </div>

                        <div style={{ marginTop: '25px', padding: '16px', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '14px', border: '1px solid rgba(59, 130, 246, 0.1)' }}>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', color: '#3b82f6', marginBottom: '8px' }}>
                                <Zap size={16} /> <span style={{ fontWeight: 700, fontSize: '13px' }}>TEHNIČKA NAPOMENA</span>
                            </div>
                            <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                                Solvex SOAP API ne isporučuje slike u pretrazi. Ova opcija povlači podatke sa novog JSON Media API-ja i kešira ih u lokalnu bazu kako bi pretraga bila brza i vizuelno bogata.
                            </p>
                            {syncStatus === 'success' && (
                                <div style={{ marginTop: '12px', color: '#22c55e', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <CheckCircle2 size={16} /> Sinhronizacija uspešno završena!
                                </div>
                            )}
                            {syncStatus === 'error' && (
                                <div style={{ marginTop: '12px', color: '#ef4444', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <AlertTriangle size={16} /> Greška prilikom sinhronizacije.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : renderApiDocs()}
        </div>
    );
};

export default B2BSettings;
