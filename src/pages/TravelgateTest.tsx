import React, { useState } from 'react';
import { Hotel, Globe, CheckCircle, XCircle, Loader2, AlertCircle, Key, Wifi, WifiOff, Search, BookOpen } from 'lucide-react';
import { getTravelgateApiService } from '../integrations/travelgate/api/travelgateApiService';

interface TestResult {
    name: string;
    status: 'pending' | 'running' | 'success' | 'error';
    message?: string;
    data?: string;
}

const TravelgateTest: React.FC = () => {
    const [config, setConfig] = useState({
        apiKey: import.meta.env.VITE_TRAVELGATE_API_KEY || 'test0000-0000-0000-0000-000000000000',
        client: import.meta.env.VITE_TRAVELGATE_CLIENT || 'client_demo',
    });

    const [searchParams, setSearchParams] = useState({
        hotelCode: '1',          // Test hotel code (HOTELTEST supplier)
        checkIn: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        checkOut: new Date(Date.now() + 32 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        adults: '2',
        access: '2',             // Test access code
    });

    const [tests, setTests] = useState<TestResult[]>([]);
    const [isRunning, setIsRunning] = useState(false);

    const updateTest = (name: string, status: TestResult['status'], message?: string, data?: string) => {
        setTests(prev => prev.map(t => t.name === name ? { ...t, status, message, data } : t));
    };

    const runTests = async () => {
        if (!config.apiKey || !config.client) {
            alert('Unesite API Key i Client');
            return;
        }

        setIsRunning(true);
        setTests([
            { name: '🔐 API Konfiguracija', status: 'pending' },
            { name: '🔍 Search (Dostupnost)', status: 'pending' },
            { name: '💰 Quote (Kvotiranje)', status: 'pending' },
        ]);

        // Inicijalizuj service sa unetim config-om
        const { resetTravelgateApiService, getTravelgateApiService } = await import('../integrations/travelgate/api/travelgateApiService');
        resetTravelgateApiService();
        const api = getTravelgateApiService({
            apiKey: config.apiKey,
            client: config.client,
            timeout: 30000,
        });

        // ── Test 1: Konfiguracija ──────────────────────────────────────────────
        updateTest('🔐 API Konfiguracija', 'running');
        if (api.isConfigured()) {
            updateTest('🔐 API Konfiguracija', 'success',
                'API Key i Client OK',
                `Key: ${config.apiKey.substring(0, 20)}...  |  Client: ${config.client}`
            );
        } else {
            updateTest('🔐 API Konfiguracija', 'error', 'Nedostaje API Key ili Client');
            setIsRunning(false);
            return;
        }

        // ── Test 2: Search ────────────────────────────────────────────────────
        updateTest('🔍 Search (Dostupnost)', 'running', 'Šaljem GraphQL query...');
        let optionRefId = '';
        try {
            const options = await api.search({
                criteria: {
                    checkIn: searchParams.checkIn,
                    checkOut: searchParams.checkOut,
                    hotels: [searchParams.hotelCode],
                    occupancies: [{ paxes: Array.from({ length: parseInt(searchParams.adults) }, () => ({ age: 30 })) }],
                    currency: 'EUR',
                    markets: ['ES'],
                    language: 'en',
                },
                accesses: [searchParams.access],
            });

            optionRefId = options[0]?.id || '';
            const cheapest = options.length > 0
                ? `${options[0].price?.net ?? options[0].price?.gross ?? 0} ${options[0].price?.currency}`
                : 'N/A';

            updateTest('🔍 Search (Dostupnost)', 'success',
                `${options.length} opcija pronađeno`,
                `Najjeftinija: ${cheapest} | BoardCode: ${options[0]?.boardCode || 'N/A'} | Supplier: ${options[0]?.supplierCode || 'N/A'}`
            );
        } catch (e: any) {
            updateTest('🔍 Search (Dostupnost)', 'error', e.message);
            setIsRunning(false);
            return;
        }

        // ── Test 3: Quote ─────────────────────────────────────────────────────
        if (optionRefId) {
            updateTest('💰 Quote (Kvotiranje)', 'running', 'Kvotiram izabrani offer...');
            try {
                const quoted = await api.quote({
                    criteria: { optionRefId, language: 'en' },
                });
                const price = quoted.price?.net ?? quoted.price?.gross ?? 0;
                updateTest('💰 Quote (Kvotiranje)', 'success',
                    `Status: ${quoted.status} | Cena: ${price} ${quoted.price?.currency}`,
                    `Refundabilno: ${quoted.cancelPolicy?.refundable ? '✅ Da' : '❌ Ne'} | optionRefId: ${quoted.optionRefId.substring(0, 40)}...`
                );
            } catch (e: any) {
                updateTest('💰 Quote (Kvotiranje)', 'error', e.message);
            }
        } else {
            updateTest('💰 Quote (Kvotiranje)', 'error', 'Preskočeno — nema optionRefId iz Searcha');
        }

        setIsRunning(false);
    };

    const isConfigured = !!(config.apiKey && config.client);
    const statusIcon = (s: TestResult['status']) => {
        if (s === 'running') return <Loader2 size={18} style={{ color: '#3b82f6', animation: 'spin 1s linear infinite' }} />;
        if (s === 'success') return <CheckCircle size={18} style={{ color: '#10b981' }} />;
        if (s === 'error') return <XCircle size={18} style={{ color: '#ef4444' }} />;
        return <AlertCircle size={18} style={{ color: '#6b7280' }} />;
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
            padding: '32px',
            fontFamily: "'Inter', sans-serif",
            color: '#e2e8f0',
        }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                <div style={{
                    width: '56px', height: '56px', borderRadius: '16px',
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 8px 24px rgba(99,102,241,0.35)',
                }}>
                    <Hotel size={28} color="white" />
                </div>
                <div>
                    <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 700, color: '#f1f5f9' }}>Travelgate Hotel-X</h1>
                    <p style={{ margin: 0, color: '#94a3b8', fontSize: '14px' }}>GraphQL API — Hotel Inventory Test Panel</p>
                </div>
                <div style={{
                    marginLeft: 'auto', padding: '6px 16px', borderRadius: '20px',
                    background: isConfigured ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                    border: `1px solid ${isConfigured ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                    display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px',
                    color: isConfigured ? '#10b981' : '#ef4444',
                }}>
                    {isConfigured ? <Wifi size={14} /> : <WifiOff size={14} />}
                    {isConfigured ? 'Konfigurisan' : 'Nije konfigurisan'}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>

                {/* Config Panel */}
                <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', padding: '24px' }}>
                    <h2 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: 600, color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Key size={16} color="#6366f1" /> Konfiguracija
                    </h2>

                    {/* API Key */}
                    <div style={{ marginBottom: '14px' }}>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>API Key</label>
                        <input
                            type="text"
                            value={config.apiKey}
                            onChange={e => setConfig(p => ({ ...p, apiKey: e.target.value }))}
                            style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 14px', color: '#f1f5f9', fontSize: '13px', outline: 'none', fontFamily: 'monospace' }}
                        />
                    </div>

                    {/* Client */}
                    <div style={{ marginBottom: '14px' }}>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Client</label>
                        <input
                            type="text"
                            value={config.client}
                            onChange={e => setConfig(p => ({ ...p, client: e.target.value }))}
                            style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '10px 14px', color: '#f1f5f9', fontSize: '13px', outline: 'none' }}
                        />
                    </div>

                    <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.06)', margin: '20px 0' }} />

                    <h3 style={{ margin: '0 0 14px', fontSize: '13px', fontWeight: 600, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Search size={14} /> Parametri Pretrage
                    </h3>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                        {[
                            { label: 'Hotel Code', key: 'hotelCode', placeholder: '1' },
                            { label: 'Access Code', key: 'access', placeholder: '2' },
                        ].map(f => (
                            <div key={f.key}>
                                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#94a3b8', marginBottom: '4px', textTransform: 'uppercase' }}>{f.label}</label>
                                <input type="text" value={searchParams[f.key as keyof typeof searchParams]} onChange={e => setSearchParams(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder}
                                    style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px 12px', color: '#f1f5f9', fontSize: '13px', outline: 'none' }} />
                            </div>
                        ))}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                        {[
                            { label: 'Check-In', key: 'checkIn', type: 'date' },
                            { label: 'Check-Out', key: 'checkOut', type: 'date' },
                            { label: 'Odrasli', key: 'adults', type: 'number' },
                        ].map(f => (
                            <div key={f.key}>
                                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#94a3b8', marginBottom: '4px', textTransform: 'uppercase' }}>{f.label}</label>
                                <input type={f.type} value={searchParams[f.key as keyof typeof searchParams]} onChange={e => setSearchParams(p => ({ ...p, [f.key]: e.target.value }))}
                                    style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px 12px', color: '#f1f5f9', fontSize: '13px', outline: 'none' }} />
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={runTests}
                        disabled={isRunning || !isConfigured}
                        style={{
                            marginTop: '20px', width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
                            background: isRunning ? 'rgba(99,102,241,0.2)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                            color: 'white', fontWeight: 700, fontSize: '15px',
                            cursor: isRunning || !isConfigured ? 'not-allowed' : 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                            opacity: isConfigured ? 1 : 0.5,
                        }}
                    >
                        {isRunning ? <><Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> Testiranje...</> : <><Hotel size={18} /> Pokreni Testove</>}
                    </button>

                    {/* Test Credentials Info */}
                    <div style={{ marginTop: '16px', padding: '12px', borderRadius: '10px', background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', fontSize: '12px', color: '#a5b4fc' }}>
                        💡 <strong>Test kredencijali (javno dostupni):</strong><br />
                        Key: <code>test0000-0000-0000-0000-000000000000</code><br />
                        Client: <code>client_demo</code> | Hotel: <code>1, 2, 23</code> | Access: <code>2</code> (HOTELTEST) ili <code>5647</code> (TTHOTTEST)
                    </div>
                </div>

                {/* Results Panel */}
                <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)', padding: '24px' }}>
                    <h2 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: 600, color: '#f1f5f9' }}>📊 Rezultati</h2>

                    {tests.length === 0 ? (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '220px', gap: '16px', color: '#475569' }}>
                            <Hotel size={48} style={{ opacity: 0.3 }} />
                            <p>Pokrenite testove za rezultate</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {tests.map(test => (
                                <div key={test.name} style={{
                                    borderRadius: '12px', padding: '16px',
                                    background: test.status === 'success' ? 'rgba(16,185,129,0.08)' : test.status === 'error' ? 'rgba(239,68,68,0.08)' : test.status === 'running' ? 'rgba(59,130,246,0.08)' : 'rgba(255,255,255,0.03)',
                                    border: `1px solid ${test.status === 'success' ? 'rgba(16,185,129,0.2)' : test.status === 'error' ? 'rgba(239,68,68,0.2)' : test.status === 'running' ? 'rgba(59,130,246,0.2)' : 'rgba(255,255,255,0.06)'}`,
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: test.message ? '8px' : 0 }}>
                                        {statusIcon(test.status)}
                                        <span style={{ fontWeight: 600, fontSize: '14px' }}>{test.name}</span>
                                    </div>
                                    {test.message && <p style={{ margin: '0 0 4px 28px', fontSize: '13px', color: '#94a3b8' }}>{test.message}</p>}
                                    {test.data && <p style={{ margin: '4px 0 0 28px', fontSize: '12px', color: '#64748b', fontFamily: 'monospace', background: 'rgba(0,0,0,0.2)', padding: '6px 10px', borderRadius: '6px' }}>{test.data}</p>}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* API Info */}
                    <div style={{ marginTop: '24px', padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                        <h3 style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: 600, color: '#64748b' }}>TRAVELGATE HOTEL-X BOOKING FLOW</h3>
                        {[
                            { step: '1', name: 'hotelX { search }', desc: 'Pretraga dostupnosti (GraphQL Query)' },
                            { step: '2', name: 'hotelX { quote }', desc: 'Kvotiranje izabrane opcije' },
                            { step: '3', name: 'hotelX { book }', desc: 'Kreiranje rezervacije (GraphQL Mutation)' },
                            { step: '4', name: 'hotelX { cancel }', desc: 'Otkazivanje rezervacije' },
                        ].map(s => (
                            <div key={s.step} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: '#818cf8', flexShrink: 0 }}>{s.step}</span>
                                <span style={{ fontFamily: 'monospace', fontSize: '13px', color: '#6366f1' }}>{s.name}</span>
                                <span style={{ fontSize: '12px', color: '#64748b' }}>→ {s.desc}</span>
                            </div>
                        ))}

                        <div style={{ marginTop: '12px', padding: '10px', borderRadius: '8px', background: 'rgba(99,102,241,0.1)', fontSize: '12px', color: '#a5b4fc' }}>
                            <Globe size={12} style={{ display: 'inline', marginRight: '6px' }} />
                            <strong>Endpoint:</strong> <code>https://api.travelgate.com/</code> (jedan GraphQL endpoint za sve operacije)<br />
                            <strong>Auth:</strong> Header <code>TGX-Auth-API-Key: {'{apiKey}'}</code>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                input:focus { border-color: rgba(99,102,241,0.5) !important; box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }
            `}</style>
        </div>
    );
};

export default TravelgateTest;
