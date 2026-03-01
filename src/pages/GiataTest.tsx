import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Key, Link2, Download, Search, CheckCircle, Database, AlertCircle, RefreshCw, Image as ImageIcon, MapPin, Star, Hotel } from 'lucide-react';
import { useThemeStore } from '../stores';
import giataApiService from '../integrations/giata/api/giataApiService';
import type { GiataMatchResult, GiataDriveResponse, GiataTextContent } from '../integrations/giata/types/giataTypes';

const GiataTest: React.FC = () => {
    const navigate = useNavigate();
    const [apiKey, setApiKey] = useState(import.meta.env.VITE_GIATA_API_KEY || '');

    // UI State
    const [activeTab, setActiveTab] = useState<'multicodes' | 'drive'>('multicodes');
    const [status, setStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    // Multicodes State
    const [providerMenu, setProviderMenu] = useState('solvex');
    const [providerCode, setProviderCode] = useState('123');
    const [matchResult, setMatchResult] = useState<GiataMatchResult | null>(null);

    // Drive State
    const [giataIdToFetch, setGiataIdToFetch] = useState<number | ''>(101234);
    const [driveResult, setDriveResult] = useState<GiataDriveResponse | null>(null);

    const handleMapCode = async () => {
        if (!providerCode) return;
        setStatus('running');
        setMatchResult(null);
        setErrorMessage('');
        setActiveTab('multicodes');

        try {
            const mapped = await giataApiService.mapProviderCode(providerMenu, providerCode);
            if (!mapped) {
                setStatus('error');
                setErrorMessage('Nema GIATA ID poklapanja za prosleđeni kod.');
            } else {
                setMatchResult(mapped);
                setStatus('success');
                // Automatically set Giata ID for next step
                setGiataIdToFetch(mapped.giataId);
            }
        } catch (e: any) {
            setStatus('error');
            setErrorMessage(e.message || 'Došlo je do greške');
        }
    };

    const handleFetchDriveContent = async () => {
        if (!giataIdToFetch) return;
        setStatus('running');
        setDriveResult(null);
        setErrorMessage('');
        setActiveTab('drive');

        try {
            const content = await giataApiService.getPropertyContent(Number(giataIdToFetch), 'sr');
            if (!content) {
                setStatus('error');
                setErrorMessage(`GIATA ID ${giataIdToFetch} not found in Mock database.`);
            } else {
                setDriveResult(content);
                setStatus('success');
            }
        } catch (e: any) {
            setStatus('error');
            setErrorMessage(e.message || 'Došlo je do greške');
        }
    };

    const isConfigured = !!apiKey;
    const themeColor = activeTab === 'multicodes' ? '#10b981' : '#6366f1'; // Green for map, Indigo for drive
    const themeGradient = activeTab === 'multicodes'
        ? 'linear-gradient(135deg, #10b981, #059669)'
        : 'linear-gradient(135deg, #6366f1, #4f46e5)';

    const { theme } = useThemeStore();
    const isLight = theme === 'light';

    return (
        <div style={{
            minHeight: '100vh',
            background: isLight
                ? 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #f8fafc 100%)'
                : 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
            padding: '32px',
            fontFamily: "'Inter', sans-serif",
            color: isLight ? '#0e4b5e' : '#e2e8f0',
        }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                <button
                    onClick={() => navigate('/api-connections')}
                    style={{
                        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                        color: '#cbd5e1', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600,
                        marginRight: '12px'
                    }}
                >
                    <ArrowLeft size={16} /> Nazad
                </button>
                <div style={{
                    width: '56px', height: '56px', borderRadius: '16px',
                    background: themeGradient,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: activeTab === 'multicodes' ? '0 8px 24px rgba(16,185,129,0.35)' : '0 8px 24px rgba(99,102,241,0.35)',
                    transition: 'all 0.3s ease'
                }}>
                    <Link2 size={28} color="white" />
                </div>
                <div>
                    <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 700, color: isLight ? '#0e4b5e' : '#f1f5f9' }}>GIATA Multicodes & Drive API</h1>
                    <p style={{ margin: 0, color: isLight ? '#475569' : '#94a3b8', fontSize: '14px' }}>Centralno mapiranje hotela i povlačenje statičkih podataka (slike, opisi)</p>
                </div>
                <div style={{
                    marginLeft: 'auto', padding: '6px 16px', borderRadius: '20px',
                    background: isConfigured ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                    border: `1px solid ${isConfigured ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                    display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px',
                    color: isConfigured ? '#10b981' : '#ef4444',
                }}>
                    {isConfigured ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                    {isConfigured ? 'Konfigurisan' : 'Nije konfigurisan'}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>

                {/* Left Column: Config & Actions */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                    {/* Config Panel */}
                    <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', padding: '24px' }}>
                        <h2 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: 600, color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Key size={16} color={themeColor} /> Authentication (REST)
                        </h2>

                        <div style={{ marginBottom: '14px' }}>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Bearer Token (API Key)</label>
                            <input
                                type="password"
                                placeholder="GIATA-xxxxx..."
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 14px', color: '#f1f5f9', fontSize: '13px', outline: 'none', fontFamily: 'monospace' }}
                            />
                        </div>
                        <p style={{ margin: '0', fontSize: '12px', color: '#64748b' }}>Unesite ključ za pristup GIATA servisima iz vašeg console.giatamedia.com naloga.</p>
                    </div>

                    {/* Action Tabs */}
                    <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', padding: '24px' }}>

                        {/* Tab Switcher */}
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', background: 'rgba(0,0,0,0.2)', padding: '6px', borderRadius: '10px' }}>
                            <button
                                onClick={() => setActiveTab('multicodes')}
                                style={{
                                    flex: 1, padding: '10px', borderRadius: '8px', border: 'none',
                                    background: activeTab === 'multicodes' ? 'rgba(16,185,129,0.15)' : 'transparent',
                                    color: activeTab === 'multicodes' ? '#10b981' : '#94a3b8',
                                    fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', transition: 'all 0.2s'
                                }}
                            >
                                <Search size={16} /> Multicodes Mapping
                            </button>
                            <button
                                onClick={() => setActiveTab('drive')}
                                style={{
                                    flex: 1, padding: '10px', borderRadius: '8px', border: 'none',
                                    background: activeTab === 'drive' ? 'rgba(99,102,241,0.15)' : 'transparent',
                                    color: activeTab === 'drive' ? '#818cf8' : '#94a3b8',
                                    fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', transition: 'all 0.2s'
                                }}
                            >
                                <Download size={16} /> Drive Content Fetcher
                            </button>
                        </div>

                        {/* Multicodes Action Area */}
                        {activeTab === 'multicodes' && (
                            <div className="fade-in">
                                <h3 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: 600, color: '#f1f5f9' }}>Testiraj Uparivanje Koda</h3>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase' }}>Dobavljač</label>
                                        <select
                                            value={providerMenu}
                                            onChange={(e) => setProviderMenu(e.target.value)}
                                            style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 12px', color: '#f1f5f9', fontSize: '13px', outline: 'none', appearance: 'none' }}
                                        >
                                            <option value="solvex" style={{ background: '#1e293b' }}>Solvex (Master-Interlook)</option>
                                            <option value="mtsglobe" style={{ background: '#1e293b' }}>MTS Globe</option>
                                            <option value="travelgate" style={{ background: '#1e293b' }}>Travelgate Network</option>
                                            <option value="tct" style={{ background: '#1e293b' }}>TCT</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase' }}>Šifra Hotela</label>
                                        <input
                                            type="text"
                                            placeholder="Npr. 123 ili hotel123"
                                            value={providerCode}
                                            onChange={(e) => setProviderCode(e.target.value)}
                                            style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 12px', color: '#f1f5f9', fontSize: '13px', outline: 'none' }}
                                        />
                                    </div>
                                </div>

                                <button
                                    onClick={handleMapCode}
                                    disabled={status === 'running' || !providerCode}
                                    style={{
                                        width: '100%', padding: '12px', borderRadius: '10px', border: 'none',
                                        background: status === 'running' ? 'rgba(16,185,129,0.2)' : themeGradient,
                                        color: 'white', fontWeight: 600, fontSize: '14px',
                                        cursor: status === 'running' || !providerCode ? 'not-allowed' : 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                        opacity: providerCode ? 1 : 0.5,
                                    }}
                                >
                                    {status === 'running' ? <><RefreshCw size={16} className="spin" /> Mapiranje...</> : <><Search size={16} /> Mapiraj Oznaku</>}
                                </button>
                            </div>
                        )}

                        {/* Drive Action Area */}
                        {activeTab === 'drive' && (
                            <div className="fade-in">
                                <h3 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: 600, color: '#f1f5f9' }}>Preuzmi Sadržaj (Slike, Opisi)</h3>

                                <div style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase' }}>GIATA ID Hotela</label>
                                    <input
                                        type="number"
                                        placeholder="Unesite ID (npr. 101234)"
                                        value={giataIdToFetch}
                                        onChange={(e) => setGiataIdToFetch(e.target.value ? Number(e.target.value) : '')}
                                        style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 12px', color: '#f1f5f9', fontSize: '13px', outline: 'none' }}
                                    />
                                </div>

                                <button
                                    onClick={handleFetchDriveContent}
                                    disabled={status === 'running' || !giataIdToFetch}
                                    style={{
                                        width: '100%', padding: '12px', borderRadius: '10px', border: 'none',
                                        background: status === 'running' ? 'rgba(99,102,241,0.2)' : themeGradient,
                                        color: 'white', fontWeight: 600, fontSize: '14px',
                                        cursor: status === 'running' || !giataIdToFetch ? 'not-allowed' : 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                        opacity: giataIdToFetch ? 1 : 0.5,
                                    }}
                                >
                                    {status === 'running' ? <><RefreshCw size={16} className="spin" /> Preuzimanje...</> : <><Download size={16} /> Povuci Sadržaj</>}
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Educational Hint */}
                    {/* Test Credentials Info */}
                    <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px dotted rgba(255,255,255,0.1)', fontSize: '13px', color: '#cbd5e1', lineHeight: '1.6' }}>
                        <div style={{ display: 'flex', gap: '8px', color: themeColor, fontWeight: 'bold', marginBottom: '8px' }}>
                            <Database size={16} /> Mock DB Dostupnost
                        </div>
                        Za svrhe testiranja integracije: MOCK kodovi <code>123</code>, <code>hotel123</code> vraćaju Grifid Noa (ID: 101234). Kod <code>456</code> vraća Acropolis View (ID: 215432).
                    </div>
                </div>

                {/* Right Column: Results Panel */}
                <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', padding: '24px', display: 'flex', flexDirection: 'column' }}>
                    <h2 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: 600, color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Database size={16} color={themeColor} />
                        {activeTab === 'multicodes' ? 'Multicodes Mapping Rezultat' : 'Drive Content Rezultat'}
                    </h2>

                    {status === 'idle' && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: '16px', color: '#475569' }}>
                            <Link2 size={48} style={{ opacity: 0.3 }} />
                            <p>Čekam na izvršenje zahteva...</p>
                        </div>
                    )}

                    {status === 'running' && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: '16px', color: themeColor }}>
                            <RefreshCw size={36} className="spin" />
                            <p>Konektovanje na GIATA API...</p>
                        </div>
                    )}

                    {status === 'error' && (
                        <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '12px', padding: '16px', color: '#fca5a5', display: 'flex', gap: '12px' }}>
                            <AlertCircle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
                            <div>
                                <h4 style={{ margin: '0 0 4px', fontSize: '14px', color: '#ef4444' }}>Greška u komunikaciji</h4>
                                <p style={{ margin: 0, fontSize: '13px' }}>{errorMessage}</p>
                            </div>
                        </div>
                    )}

                    {status === 'success' && activeTab === 'multicodes' && matchResult && (
                        <div className="fade-in" style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '16px', padding: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                                <div>
                                    <div style={{ display: 'inline-block', padding: '4px 12px', background: '#10b981', color: 'white', borderRadius: '20px', fontSize: '12px', fontWeight: 700, marginBottom: '12px' }}>
                                        GIATA ID: {matchResult.giataId}
                                    </div>
                                    <h3 style={{ margin: '0 0 4px', fontSize: '24px', color: '#f1f5f9' }}>{matchResult.name}</h3>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#94a3b8', fontSize: '14px' }}>
                                        <MapPin size={14} /> {matchResult.destination}, {matchResult.country}
                                    </div>
                                </div>
                                <div style={{ width: '48px', height: '48px', background: 'rgba(16,185,129,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <CheckCircle size={24} color="#10b981" />
                                </div>
                            </div>

                            {/* Confidence Bar */}
                            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', color: '#cbd5e1' }}>
                                    <span>Pouzdanost meča (Confidence)</span>
                                    <span style={{ fontWeight: 600, color: '#10b981' }}>{matchResult.confidence}%</span>
                                </div>
                                <div style={{ height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                                    <div style={{ height: '100%', background: '#10b981', width: `${matchResult.confidence}%`, borderRadius: '3px' }}></div>
                                </div>
                                <p style={{ margin: '12px 0 0', fontSize: '12px', color: '#64748b' }}>
                                    <ArrowLeft size={12} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                                    Prebacite se na "Drive Content" tab kako biste povukli slike za ovaj ID.
                                </p>
                            </div>
                        </div>
                    )}

                    {status === 'success' && activeTab === 'drive' && driveResult && (
                        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {/* Images Grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gridTemplateRows: '160px', gap: '10px' }}>
                                {driveResult.images.map((img, i) => (
                                    <div key={i} style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', background: '#1e293b' }}>
                                        <img src={img.url} alt={`Preview ${i}`} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.9 }} />
                                        {img.heroImage && (
                                            <span style={{ position: 'absolute', top: '8px', left: '8px', background: '#f59e0b', color: 'white', padding: '2px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 700 }}>HERO</span>
                                        )}
                                        <span style={{ position: 'absolute', bottom: '8px', right: '8px', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '10px', textTransform: 'uppercase' }}>
                                            {img.category || 'N/A'}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* Hotel Details */}
                            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '12px', padding: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                                    <div>
                                        <h3 style={{ margin: '0 0 6px', fontSize: '20px', color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            {driveResult.name}
                                            <span style={{ color: '#f59e0b', fontSize: '14px', marginTop: '2px' }}>
                                                {'★'.repeat(driveResult.category)}
                                            </span>
                                        </h3>
                                        <p style={{ margin: 0, color: '#94a3b8', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            <MapPin size={12} /> {driveResult.address.street}, {driveResult.address.city}, {driveResult.address.country}
                                        </p>
                                    </div>
                                    <div style={{ padding: '4px 10px', background: 'rgba(99,102,241,0.1)', color: '#818cf8', borderRadius: '6px', fontSize: '12px', fontWeight: 600 }}>
                                        ID: {driveResult.giataId}
                                    </div>
                                </div>

                                {/* Texts */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {driveResult.texts.map(text => (
                                        <div key={text.language} style={{ background: 'rgba(0,0,0,0.2)', padding: '16px', borderRadius: '10px' }}>
                                            <div style={{ display: 'inline-block', padding: '2px 6px', background: 'rgba(99,102,241,0.1)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '4px', fontSize: '10px', fontWeight: 700, marginBottom: '8px' }}>
                                                {text.language.toUpperCase()}
                                            </div>
                                            <p style={{ margin: '0 0 12px', color: '#e2e8f0', fontSize: '13px', lineHeight: '1.5' }}>
                                                {text.description}
                                            </p>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                                {text.amenities.map(a => (
                                                    <span key={a} style={{ padding: '2px 8px', background: 'rgba(255,255,255,0.05)', borderRadius: '12px', fontSize: '11px', color: '#cbd5e1' }}>
                                                        {a}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .spin { animation: spin 1s linear infinite; }
                .fade-in { animation: fadeIn 0.3s ease; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
                input:focus, select:focus { border-color: rgba(99,102,241,0.5) !important; box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }
            `}</style>
        </div>
    );
};

export default GiataTest;
