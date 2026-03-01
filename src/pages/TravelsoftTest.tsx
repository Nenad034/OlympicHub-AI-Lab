import React, { useState } from 'react';
import { Plane, Wifi, WifiOff, Loader2, CheckCircle, XCircle, AlertCircle, Key, Globe } from 'lucide-react';
import { useThemeStore } from '../stores';
import { initTravelsoftApi } from '../integrations/travelsoft/api/travelsoftApiService';
import type { TravelsoftConfig } from '../integrations/travelsoft/types/travelsoftTypes';

// ============================================================================
// TYPES
// ============================================================================

interface TestResult {
    name: string;
    status: 'pending' | 'running' | 'success' | 'error';
    message?: string;
    data?: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

const TravelsoftTest: React.FC = () => {
    // Config form state
    const [config, setConfig] = useState({
        baseUrl: import.meta.env.VITE_TRAVELSOFT_BASE_URL || '',
        username: import.meta.env.VITE_TRAVELSOFT_USERNAME || '',
        password: import.meta.env.VITE_TRAVELSOFT_PASSWORD || '',
        provider: import.meta.env.VITE_TRAVELSOFT_PROVIDER || 'SWITCHALLINONE',
        apiVersion: import.meta.env.VITE_TRAVELSOFT_API_VERSION || '1.0'
    });

    // Search params
    const [searchParams, setSearchParams] = useState({
        origin: 'BEG',
        destination: 'CDG',
        departureDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        adults: 1
    });

    const [tests, setTests] = useState<TestResult[]>([]);
    const [isRunning, setIsRunning] = useState(false);

    // ========================================================================
    // HELPER
    // ========================================================================

    const setTestStatus = (name: string, status: TestResult['status'], message?: string, data?: string) => {
        setTests(prev => prev.map(t =>
            t.name === name ? { ...t, status, message, data } : t
        ));
    };

    const addTest = (name: string): TestResult => ({
        name, status: 'pending'
    });

    // ========================================================================
    // RUN TESTS
    // ========================================================================

    const runTests = async () => {
        if (!config.baseUrl || !config.username || !config.password) {
            alert('Molimo unesite sve konfiguracije (Base URL, Username, Password)');
            return;
        }

        setIsRunning(true);

        const testList: TestResult[] = [
            addTest('🔐 Konfiguracija'),
            addTest('🏓 Login / Auth Token'),
            addTest('✈️ AirShopping (pretraga letova)'),
            addTest('💰 OfferPrice (kvotiranje)'),
        ];
        setTests(testList);

        // 1. Konfiguracija
        setTestStatus('🔐 Konfiguracija', 'running');
        const travelsoftConfig: TravelsoftConfig = {
            baseUrl: config.baseUrl,
            username: config.username,
            password: config.password,
            provider: config.provider,
            apiVersion: config.apiVersion,
            timeout: 30000
        };

        try {
            const api = initTravelsoftApi(travelsoftConfig);
            if (api.isConfigured()) {
                setTestStatus('🔐 Konfiguracija', 'success', 'Konfiguracija validna');
            } else {
                setTestStatus('🔐 Konfiguracija', 'error', 'Konfiguracija nevažeća — proverite parametre');
                setIsRunning(false);
                return;
            }
        } catch (e: any) {
            setTestStatus('🔐 Konfiguracija', 'error', e.message);
            setIsRunning(false);
            return;
        }

        // 2. Login
        setTestStatus('🏓 Login / Auth Token', 'running');
        let api;
        let shoppingResponseId = '';
        let offerId = '';

        try {
            api = initTravelsoftApi(travelsoftConfig);
            // Pokušavamo airShopping koji interno radi login
            setTestStatus('🏓 Login / Auth Token', 'running', 'Pokušavam login...');

            // Direktan login test koristeći auth servis
            const { getTravelsoftAuth } = await import('../integrations/travelsoft/api/travelsoftAuthService');
            const token = await getTravelsoftAuth().getAuthToken();

            setTestStatus('🏓 Login / Auth Token', 'success',
                `AuthToken dobijen uspešno! (prikazujem prvih 20 znakova)`,
                `Token: ${token.substring(0, 20)}...`
            );
        } catch (e: any) {
            setTestStatus('🏓 Login / Auth Token', 'error', `Login neuspešan: ${e.message}`);
            setIsRunning(false);
            return;
        }

        // 3. AirShopping
        setTestStatus('✈️ AirShopping (pretraga letova)', 'running');
        try {
            api = initTravelsoftApi(travelsoftConfig);
            const result = await api.searchFlights({
                origin: searchParams.origin,
                destination: searchParams.destination,
                departureDate: searchParams.departureDate,
                passengers: [{ Code: 'ADT', Quantity: searchParams.adults }],
                currency: 'EUR'
            });

            shoppingResponseId = result.shoppingResponseId;
            const firstOffer = result.offers[0];
            if (firstOffer) {
                offerId = firstOffer.id;
            }

            setTestStatus('✈️ AirShopping (pretraga letova)', 'success',
                `Pronađeno ${result.offers.length} letova`,
                result.offers.length > 0 ?
                    `Najjeftinija ponuda: ${result.offers[0].price.total} ${result.offers[0].price.currency} | Provider: ${result.offers[0].provider}` :
                    'Nema rezultata'
            );
        } catch (e: any) {
            setTestStatus('✈️ AirShopping (pretraga letova)', 'error', e.message);
        }

        // 4. OfferPrice (samo ako ima offer)
        if (offerId && shoppingResponseId) {
            setTestStatus('💰 OfferPrice (kvotiranje)', 'running');
            try {
                api = initTravelsoftApi(travelsoftConfig);
                const pricedOffers = await api.priceOffer({
                    offerIds: [offerId],
                    shoppingResponseId,
                    passengers: [{ Code: 'ADT', Quantity: searchParams.adults }]
                });
                setTestStatus('💰 OfferPrice (kvotiranje)', 'success',
                    `OfferPrice uspešan: ${pricedOffers.length} offera kvotirano`,
                    pricedOffers.length > 0 ? `Cena: ${pricedOffers[0].TotalPrice.TotalAmount} ${pricedOffers[0].TotalPrice.CurrencyCode}` : 'OK'
                );
            } catch (e: any) {
                setTestStatus('💰 OfferPrice (kvotiranje)', 'error', e.message);
            }
        } else {
            setTestStatus('💰 OfferPrice (kvotiranje)', 'error', 'Preskočeno — nema offera iz AirShopping-a');
        }

        setIsRunning(false);
    };

    // ========================================================================
    // RENDER
    // ========================================================================

    const statusIcon = (status: TestResult['status']) => {
        switch (status) {
            case 'running': return <Loader2 size={18} className="spin" style={{ color: '#3b82f6' }} />;
            case 'success': return <CheckCircle size={18} style={{ color: '#10b981' }} />;
            case 'error': return <XCircle size={18} style={{ color: '#ef4444' }} />;
            default: return <AlertCircle size={18} style={{ color: '#6b7280' }} />;
        }
    };

    const isConfigured = !!(config.baseUrl && config.username && config.password);

    const { theme } = useThemeStore();
    const isLight = theme === 'light';

    return (
        <div style={{
            minHeight: '100vh',
            background: isLight
                ? 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #f8fafc 100%)'
                : 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
            padding: '32px',
            fontFamily: "'Inter', -apple-system, sans-serif",
            color: isLight ? '#0e4b5e' : '#e2e8f0'
        }}>
            {/* Header */}
            <div style={{ marginBottom: '32px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
                    <div style={{
                        width: '56px', height: '56px', borderRadius: '16px',
                        background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 8px 24px rgba(245,158,11,0.3)'
                    }}>
                        <Plane size={28} color="white" />
                    </div>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 700, color: isLight ? '#0e4b5e' : '#f1f5f9' }}>
                            Travelsoft NDC
                        </h1>
                        <p style={{ margin: 0, color: isLight ? '#475569' : '#94a3b8', fontSize: '14px' }}>
                            IATA NDC 19.2 API Test Panel
                        </p>
                    </div>
                    <div style={{
                        marginLeft: 'auto',
                        padding: '6px 16px',
                        borderRadius: '20px',
                        background: isConfigured ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                        border: `1px solid ${isConfigured ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`,
                        display: 'flex', alignItems: 'center', gap: '8px',
                        fontSize: '13px',
                        color: isConfigured ? '#10b981' : '#ef4444'
                    }}>
                        {isConfigured ? <Wifi size={14} /> : <WifiOff size={14} />}
                        {isConfigured ? 'Konfigurisan' : 'Nije konfigurisan'}
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>

                {/* Config Panel */}
                <div style={{
                    background: isLight ? '#ffffff' : 'rgba(255,255,255,0.04)',
                    borderRadius: '16px',
                    border: `1px solid ${isLight ? '#e2e8f0' : 'rgba(255,255,255,0.08)'}`,
                    padding: '24px',
                    boxShadow: isLight ? '0 4px 12px rgba(0,0,0,0.05)' : 'none',
                }}>
                    <h2 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px', color: isLight ? '#0e4b5e' : '#f1f5f9' }}>
                        <Key size={16} color="#f59e0b" /> Konfiguracija
                    </h2>

                    {[
                        { label: 'Base URL', key: 'baseUrl', placeholder: 'https://....../ndc/ws/rest/19.2', type: 'url' },
                        { label: 'Username', key: 'username', placeholder: 'your_username', type: 'text' },
                        { label: 'Password', key: 'password', placeholder: '••••••••', type: 'password' },
                        { label: 'Provider', key: 'provider', placeholder: 'SWITCHALLINONE', type: 'text' },
                        { label: 'API Version', key: 'apiVersion', placeholder: '1.0', type: 'text' },
                    ].map(field => (
                        <div key={field.key} style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                {field.label}
                            </label>
                            <input
                                type={field.type}
                                value={config[field.key as keyof typeof config]}
                                onChange={e => setConfig(prev => ({ ...prev, [field.key]: e.target.value }))}
                                placeholder={field.placeholder}
                                style={{
                                    width: '100%', boxSizing: 'border-box',
                                    background: isLight ? '#ffffff' : 'rgba(255,255,255,0.06)',
                                    border: `1px solid ${isLight ? '#cbd5e1' : 'rgba(255,255,255,0.1)'}`,
                                    borderRadius: '8px',
                                    padding: '10px 14px',
                                    color: isLight ? '#0f172a' : '#f1f5f9',
                                    fontSize: '14px',
                                    outline: 'none'
                                }}
                            />
                        </div>
                    ))}

                    <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.08)', margin: '20px 0' }} />

                    <h3 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: 600, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Globe size={14} /> Parametri Pretrage
                    </h3>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        {[
                            { label: 'Polazište', key: 'origin', placeholder: 'BEG' },
                            { label: 'Odredište', key: 'destination', placeholder: 'CDG' },
                        ].map(f => (
                            <div key={f.key}>
                                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#94a3b8', marginBottom: '4px', textTransform: 'uppercase' }}>{f.label}</label>
                                <input
                                    type="text"
                                    value={searchParams[f.key as keyof typeof searchParams]}
                                    onChange={e => setSearchParams(prev => ({ ...prev, [f.key]: e.target.value.toUpperCase() }))}
                                    placeholder={f.placeholder}
                                    maxLength={3}
                                    style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px 12px', color: '#f1f5f9', fontSize: '14px', outline: 'none' }}
                                />
                            </div>
                        ))}
                    </div>
                    <div style={{ marginTop: '12px' }}>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#94a3b8', marginBottom: '4px', textTransform: 'uppercase' }}>Datum Polaska</label>
                        <input
                            type="date"
                            value={searchParams.departureDate}
                            onChange={e => setSearchParams(prev => ({ ...prev, departureDate: e.target.value }))}
                            style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '8px 12px', color: '#f1f5f9', fontSize: '14px', outline: 'none' }}
                        />
                    </div>

                    <button
                        onClick={runTests}
                        disabled={isRunning || !isConfigured}
                        style={{
                            marginTop: '20px',
                            width: '100%',
                            padding: '14px',
                            borderRadius: '12px',
                            border: 'none',
                            background: isRunning
                                ? 'rgba(245,158,11,0.2)'
                                : 'linear-gradient(135deg, #f59e0b, #d97706)',
                            color: 'white',
                            fontWeight: 700,
                            fontSize: '15px',
                            cursor: isRunning || !isConfigured ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '10px',
                            transition: 'all 0.2s ease',
                            opacity: isConfigured ? 1 : 0.5
                        }}
                    >
                        {isRunning ? (
                            <><Loader2 size={18} className="spin" /> Testiranje u toku...</>
                        ) : (
                            <><Plane size={18} /> Pokreni NDC Testove</>
                        )}
                    </button>

                    <div style={{
                        marginTop: '16px',
                        padding: '12px',
                        borderRadius: '10px',
                        background: 'rgba(245,158,11,0.08)',
                        border: '1px solid rgba(245,158,11,0.2)',
                        fontSize: '12px',
                        color: '#fbbf24'
                    }}>
                        💡 <strong>env vars:</strong> Postavite <code>VITE_TRAVELSOFT_BASE_URL</code>, <code>VITE_TRAVELSOFT_USERNAME</code>, <code>VITE_TRAVELSOFT_PASSWORD</code> u .env fajl za automatsko punjenje.
                    </div>
                </div>

                {/* Results Panel */}
                <div style={{
                    background: isLight ? '#ffffff' : 'rgba(255,255,255,0.04)',
                    borderRadius: '16px',
                    border: `1px solid ${isLight ? '#e2e8f0' : 'rgba(255,255,255,0.08)'}`,
                    padding: '24px',
                    boxShadow: isLight ? '0 4px 12px rgba(0,0,0,0.05)' : 'none',
                }}>
                    <h2 style={{ margin: '0 0 20px', fontSize: '16px', fontWeight: 600, color: isLight ? '#0e4b5e' : '#f1f5f9' }}>
                        📊 Rezultati Testova
                    </h2>

                    {tests.length === 0 ? (
                        <div style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                            height: '300px', gap: '16px', color: '#475569'
                        }}>
                            <Plane size={48} style={{ opacity: 0.3 }} />
                            <p>Pokrenite testove da biste videli rezultate</p>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {tests.map((test) => (
                                <div
                                    key={test.name}
                                    style={{
                                        borderRadius: '12px',
                                        padding: '16px',
                                        background: test.status === 'success'
                                            ? 'rgba(16,185,129,0.08)'
                                            : test.status === 'error'
                                                ? 'rgba(239,68,68,0.08)'
                                                : test.status === 'running'
                                                    ? 'rgba(59,130,246,0.08)'
                                                    : 'rgba(255,255,255,0.03)',
                                        border: `1px solid ${test.status === 'success'
                                            ? 'rgba(16,185,129,0.2)'
                                            : test.status === 'error'
                                                ? 'rgba(239,68,68,0.2)'
                                                : test.status === 'running'
                                                    ? 'rgba(59,130,246,0.2)'
                                                    : 'rgba(255,255,255,0.06)'
                                            }`
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: test.message ? '8px' : 0 }}>
                                        {statusIcon(test.status)}
                                        <span style={{ fontWeight: 600, fontSize: '14px' }}>{test.name}</span>
                                    </div>
                                    {test.message && (
                                        <p style={{ margin: '0 0 4px 28px', fontSize: '13px', color: '#94a3b8' }}>
                                            {test.message}
                                        </p>
                                    )}
                                    {test.data && (
                                        <p style={{
                                            margin: '4px 0 0 28px', fontSize: '12px',
                                            color: '#64748b',
                                            fontFamily: 'monospace',
                                            background: 'rgba(0,0,0,0.2)',
                                            padding: '6px 10px',
                                            borderRadius: '6px'
                                        }}>
                                            {test.data}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* NDC Flow Info */}
                    <div style={{
                        marginTop: '24px',
                        padding: '16px',
                        borderRadius: '12px',
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid rgba(255,255,255,0.06)'
                    }}>
                        <h3 style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: 600, color: '#64748b' }}>
                            NDC SHOPPING FLOW
                        </h3>
                        {[
                            { step: '1', name: 'login', desc: 'AuthToken (60 min)' },
                            { step: '2', name: 'airShopping', desc: 'Pretraga + ShoppingResponseID' },
                            { step: '3', name: 'serviceList', desc: 'Ancillary usluge' },
                            { step: '4', name: 'seatAvailability', desc: 'Mapa sedišta' },
                            { step: '5', name: 'offerPrice', desc: 'Finalno kvotiranje' },
                            { step: '6', name: 'orderCreate', desc: 'Kreiranje rezervacije' },
                        ].map(s => (
                            <div key={s.step} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                <span style={{
                                    width: '22px', height: '22px', borderRadius: '50%',
                                    background: 'rgba(245,158,11,0.2)',
                                    border: '1px solid rgba(245,158,11,0.4)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '11px', fontWeight: 700, color: '#f59e0b', flexShrink: 0
                                }}>{s.step}</span>
                                <span style={{ fontFamily: 'monospace', fontSize: '13px', color: '#f59e0b' }}>{s.name}</span>
                                <span style={{ fontSize: '12px', color: '#64748b' }}>→ {s.desc}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .spin { animation: spin 1s linear infinite; }
                input:focus { border-color: rgba(245,158,11,0.5) !important; box-shadow: 0 0 0 3px rgba(245,158,11,0.1); }
            `}</style>
        </div>
    );
};

export default TravelsoftTest;
