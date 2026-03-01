import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, CreditCard, Key, ShieldCheck, RefreshCw, AlertCircle,
    CheckCircle, XCircle, DollarSign, RotateCcw, Lock, Unlock,
    Building2, Hash, TrendingUp, AlertTriangle
} from 'lucide-react';
import { useThemeStore } from '../stores';
import worldpayApiService from '../integrations/worldpay/api/worldpayApiService';
import type { WorldpayPaymentResponse, WorldpayTokenResponse, WorldpayTransactionRecord } from '../integrations/worldpay/types/worldpayTypes';

type ActiveTab = 'authorize' | 'tokenize' | 'transactions';

const WorldpayTest: React.FC = () => {
    const navigate = useNavigate();

    // Config
    const [username, setUsername] = useState(import.meta.env.VITE_WORLDPAY_USERNAME || '');
    const [password, setPassword] = useState(import.meta.env.VITE_WORLDPAY_PASSWORD || '');
    const [merchantCode, setMerchantCode] = useState(import.meta.env.VITE_WORLDPAY_MERCHANT || '');
    const [environment, setEnvironment] = useState<'sandbox' | 'production'>('sandbox');
    const [isConfigured, setIsConfigured] = useState(false);

    // UI
    const [activeTab, setActiveTab] = useState<ActiveTab>('authorize');
    const [status, setStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
    const [errorMsg, setErrorMsg] = useState('');

    // Payment form
    const [cardNumber, setCardNumber] = useState('4111111111111111');
    const [expiryMonth, setExpiryMonth] = useState('12');
    const [expiryYear, setExpiryYear] = useState('2027');
    const [cvv, setCvv] = useState('123');
    const [holderName, setHolderName] = useState('Test Korisnik');
    const [amount, setAmount] = useState('129.00');
    const [currency, setCurrency] = useState('EUR');
    const [txRef, setTxRef] = useState(`CTT-${Date.now()}`);

    // Results
    const [paymentResult, setPaymentResult] = useState<WorldpayPaymentResponse | null>(null);
    const [tokenResult, setTokenResult] = useState<WorldpayTokenResponse | null>(null);
    const [transactions] = useState<WorldpayTransactionRecord[]>(() => worldpayApiService.getMockTransactions());

    const handleConfigure = () => {
        if (!username || !password || !merchantCode) {
            setErrorMsg('Sva polja konfiguracije su obavezna.');
            return;
        }
        worldpayApiService.configure({ username, password, merchantCode, environment });
        setIsConfigured(true);
        setErrorMsg('');
    };

    const handleAuthorize = async () => {
        setStatus('running');
        setPaymentResult(null);
        setErrorMsg('');
        try {
            const result = await worldpayApiService.authorizePayment({
                transactionReference: txRef,
                merchant: { entity: merchantCode || 'DEMO_MERCHANT' },
                instruction: {
                    narrative: { line1: 'ClickToTravel Booking' },
                    value: {
                        currency,
                        amount: Math.round(parseFloat(amount) * 100),
                    },
                    paymentInstrument: {
                        type: 'Plain',
                        number: cardNumber.replace(/\s/g, ''),
                        expiryMonth: parseInt(expiryMonth),
                        expiryYear: parseInt(expiryYear),
                        cvv,
                        holderName,
                    },
                },
            });
            setPaymentResult(result);
            setStatus('success');
        } catch (e: any) {
            setStatus('error');
            setErrorMsg(e.message);
        }
    };

    const handleTokenize = async () => {
        setStatus('running');
        setTokenResult(null);
        setErrorMsg('');
        try {
            const result = await worldpayApiService.tokenizeCard({
                reusable: true,
                paymentInstrument: {
                    type: 'Plain',
                    number: cardNumber.replace(/\s/g, ''),
                    expiryMonth: parseInt(expiryMonth),
                    expiryYear: parseInt(expiryYear),
                    cvv,
                    holderName,
                },
                description: `Kartica gosta: ${holderName}`,
            });
            setTokenResult(result);
            setStatus('success');
        } catch (e: any) {
            setStatus('error');
            setErrorMsg(e.message);
        }
    };

    const formatCurrency = (cents: number, currency: string) =>
        `${(cents / 100).toFixed(2)} ${currency}`;

    const outcomeStyle = (outcome: string) => {
        switch (outcome) {
            case 'authorized':
            case 'sent_for_settlement':
                return { color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.3)' };
            case 'refused':
            case 'fraud':
                return { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)' };
            default:
                return { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)' };
        }
    };

    const tabConfig: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
        { id: 'authorize', label: 'Autorizacija', icon: <Lock size={15} /> },
        { id: 'tokenize', label: 'Tokenizacija', icon: <ShieldCheck size={15} /> },
        { id: 'transactions', label: 'Transakcije', icon: <TrendingUp size={15} /> },
    ];

    const { theme } = useThemeStore();
    const isLight = theme === 'light';

    const INPUT_STYLE: React.CSSProperties = {
        width: '100%', boxSizing: 'border-box',
        background: isLight ? '#ffffff' : 'rgba(0,0,0,0.2)',
        border: `1px solid ${isLight ? '#cbd5e1' : 'rgba(255,255,255,0.1)'}`,
        borderRadius: '8px', padding: '10px 12px',
        color: isLight ? '#0f172a' : '#f1f5f9', fontSize: '13px', outline: 'none', fontFamily: 'inherit',
    };
    const LABEL_STYLE: React.CSSProperties = {
        display: 'block', fontSize: '11px', fontWeight: 700,
        color: isLight ? '#475569' : '#94a3b8', marginBottom: '6px',
        textTransform: 'uppercase', letterSpacing: '0.05em',
    };
    const CARD_STYLE: React.CSSProperties = {
        background: isLight ? '#ffffff' : 'rgba(255,255,255,0.04)',
        borderRadius: '16px', border: `1px solid ${isLight ? '#e2e8f0' : 'rgba(255,255,255,0.08)'}`,
        padding: '24px',
        boxShadow: isLight ? '0 4px 12px rgba(0,0,0,0.05)' : 'none',
    };

    return (
        <div style={{
            minHeight: '100vh',
            background: isLight
                ? 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 50%, #f8fafc 100%)'
                : 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
            padding: '32px',
            fontFamily: "'Inter', sans-serif",
            color: isLight ? '#0e4b5e' : '#e2e8f0',
            transition: 'all 0.3s ease',
        }}>
            {/* HEADER */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
                <button
                    onClick={() => navigate('/api-connections')}
                    style={{
                        background: isLight ? '#ffffff' : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${isLight ? '#cbd5e1' : 'rgba(255,255,255,0.1)'}`,
                        color: isLight ? '#475569' : '#cbd5e1',
                        padding: '8px 12px', borderRadius: '8px', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 600, marginRight: '12px',
                        boxShadow: isLight ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                    }}
                >
                    <ArrowLeft size={16} /> Nazad
                </button>
                <div style={{
                    width: '56px', height: '56px', borderRadius: '16px',
                    background: 'linear-gradient(135deg, #1d4ed8, #2563eb)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 8px 24px rgba(37,99,235,0.35)',
                }}>
                    <CreditCard size={28} color="white" />
                </div>
                <div>
                    <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 700, color: isLight ? '#0e4b5e' : '#f1f5f9' }}>Worldpay (FIS)</h1>
                    <p style={{ margin: 0, color: isLight ? '#475569' : '#94a3b8', fontSize: '14px' }}>Access Worldpay REST API — Payments, Tokenization & Settlement</p>
                </div>
                <div style={{
                    marginLeft: 'auto', padding: '6px 16px', borderRadius: '20px',
                    background: isConfigured ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                    border: `1px solid ${isConfigured ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}`,
                    display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px',
                    color: isConfigured ? '#10b981' : '#f59e0b',
                }}>
                    {isConfigured ? <Unlock size={14} /> : <Lock size={14} />}
                    {isConfigured ? 'Konfigurisan (Sandbox)' : 'Čeka konfiguraciju'}
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: '24px', alignItems: 'start' }}>

                {/* LEFT COLUMN */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    {/* Config Panel */}
                    <div style={CARD_STYLE}>
                        <h2 style={{ margin: '0 0 20px', fontSize: '15px', fontWeight: 700, color: isLight ? '#0e4b5e' : '#f1f5f9', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Key size={16} color="#3b82f6" /> Konfiguracija Naloga
                        </h2>

                        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', background: isLight ? '#f1f5f9' : 'rgba(0,0,0,0.2)', padding: '5px', borderRadius: '8px' }}>
                            {(['sandbox', 'production'] as const).map(env => (
                                <button key={env} onClick={() => setEnvironment(env)} style={{
                                    flex: 1, padding: '7px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                                    background: environment === env ? (env === 'sandbox' ? (isLight ? '#dbeafe' : 'rgba(59,130,246,0.2)') : (isLight ? '#fee2e2' : 'rgba(239,68,68,0.2)')) : 'transparent',
                                    color: environment === env ? (env === 'sandbox' ? (isLight ? '#1d4ed8' : '#60a5fa') : (isLight ? '#dc2626' : '#f87171')) : (isLight ? '#64748b' : '#64748b'),
                                }}>
                                    {env === 'sandbox' ? '🧪 Sandbox' : '🔴 Production'}
                                </button>
                            ))}
                        </div>

                        {[
                            { label: 'Username', val: username, set: setUsername, type: 'text', placeholder: 'Vaš Worldpay username' },
                            { label: 'Password', val: password, set: setPassword, type: 'password', placeholder: '••••••••' },
                            { label: 'Merchant Code', val: merchantCode, set: setMerchantCode, type: 'text', placeholder: 'DEMO_MERCHANT_123' },
                        ].map(f => (
                            <div key={f.label} style={{ marginBottom: '12px' }}>
                                <label style={LABEL_STYLE}>{f.label}</label>
                                <input type={f.type} placeholder={f.placeholder} value={f.val}
                                    onChange={e => f.set(e.target.value)} style={INPUT_STYLE} />
                            </div>
                        ))}

                        {errorMsg && !isConfigured && (
                            <p style={{ color: '#f87171', fontSize: '12px', marginBottom: '8px' }}>{errorMsg}</p>
                        )}

                        <button onClick={handleConfigure} style={{
                            width: '100%', padding: '11px', borderRadius: '10px', border: 'none',
                            background: 'linear-gradient(135deg, #1d4ed8, #2563eb)', color: 'white',
                            fontWeight: 700, fontSize: '14px', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                        }}>
                            <ShieldCheck size={16} /> Primeni Konfiguraciju
                        </button>
                    </div>

                    {/* Card Input Panel */}
                    <div style={CARD_STYLE}>
                        <h2 style={{ margin: '0 0 20px', fontSize: '15px', fontWeight: 700, color: isLight ? '#0e4b5e' : '#f1f5f9', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <CreditCard size={16} color="#3b82f6" /> Podaci o Kartici
                        </h2>

                        <div style={{ marginBottom: '14px' }}>
                            <label style={LABEL_STYLE}>Broj Kartice</label>
                            <input value={cardNumber} onChange={e => setCardNumber(e.target.value)} placeholder="4111 1111 1111 1111" style={INPUT_STYLE} />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                            {[
                                { label: 'Mesec', val: expiryMonth, set: setExpiryMonth, placeholder: 'MM' },
                                { label: 'Godina', val: expiryYear, set: setExpiryYear, placeholder: 'YYYY' },
                                { label: 'CVV', val: cvv, set: setCvv, placeholder: '***' },
                            ].map(f => (
                                <div key={f.label}>
                                    <label style={LABEL_STYLE}>{f.label}</label>
                                    <input value={f.val} onChange={e => f.set(e.target.value)} placeholder={f.placeholder} style={INPUT_STYLE} />
                                </div>
                            ))}
                        </div>

                        <div style={{ marginBottom: '14px' }}>
                            <label style={LABEL_STYLE}>Ime Vlasnika</label>
                            <input value={holderName} onChange={e => setHolderName(e.target.value)} style={INPUT_STYLE} />
                        </div>

                        {/* Test Cards Info */}
                        <div style={{ padding: '12px', borderRadius: '10px', background: isLight ? '#eff6ff' : 'rgba(59,130,246,0.08)', border: `1px solid ${isLight ? '#bfdbfe' : 'rgba(59,130,246,0.2)'}`, fontSize: '12px', color: isLight ? '#1e40af' : '#93c5fd' }}>
                            💡 <strong>Test kartice:</strong><br />
                            <code>...1111</code> → Autorizovano ✅<br />
                            <code>...0002</code> → Odbijeno ❌<br />
                            <code>...0003</code> → Fraud Blok 🚫
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    {/* Tab Bar + Content */}
                    <div style={CARD_STYLE}>
                        {/* Tab Bar */}
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', background: isLight ? '#f1f5f9' : 'rgba(0,0,0,0.2)', padding: '6px', borderRadius: '10px' }}>
                            {tabConfig.map(tab => (
                                <button key={tab.id} onClick={() => { setActiveTab(tab.id); setStatus('idle'); }} style={{
                                    flex: 1, padding: '10px', border: 'none', borderRadius: '8px', cursor: 'pointer',
                                    background: activeTab === tab.id ? (isLight ? '#ffffff' : 'rgba(37,99,235,0.2)') : 'transparent',
                                    color: activeTab === tab.id ? (isLight ? '#2563eb' : '#60a5fa') : (isLight ? '#64748b' : '#94a3b8'),
                                    fontWeight: 700, fontSize: '13px',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
                                    transition: 'all 0.2s',
                                    boxShadow: activeTab === tab.id && isLight ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                                }}>
                                    {tab.icon} {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* AUTHORIZE TAB */}
                        {activeTab === 'authorize' && (
                            <div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: '12px', marginBottom: '20px' }}>
                                    <div>
                                        <label style={LABEL_STYLE}>Iznos (EUR)</label>
                                        <input value={amount} onChange={e => setAmount(e.target.value)} style={INPUT_STYLE} />
                                    </div>
                                    <div>
                                        <label style={LABEL_STYLE}>Valuta</label>
                                        <select value={currency} onChange={e => setCurrency(e.target.value)}
                                            style={{ ...INPUT_STYLE, appearance: 'none' }}>
                                            <option value="EUR" style={{ background: isLight ? '#fff' : '#1e293b', color: isLight ? '#000' : '#fff' }}>EUR</option>
                                            <option value="USD" style={{ background: isLight ? '#fff' : '#1e293b', color: isLight ? '#000' : '#fff' }}>USD</option>
                                            <option value="GBP" style={{ background: isLight ? '#fff' : '#1e293b', color: isLight ? '#000' : '#fff' }}>GBP</option>
                                            <option value="RSD" style={{ background: isLight ? '#fff' : '#1e293b', color: isLight ? '#000' : '#fff' }}>RSD</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label style={LABEL_STYLE}>Referenca Transakcije</label>
                                        <input value={txRef} onChange={e => setTxRef(e.target.value)} style={{ ...INPUT_STYLE, fontFamily: 'monospace' }} />
                                    </div>
                                </div>

                                <button onClick={handleAuthorize} disabled={status === 'running'}
                                    style={{
                                        width: '100%', padding: '13px', borderRadius: '10px', border: 'none',
                                        background: status === 'running' ? 'rgba(37,99,235,0.3)' : 'linear-gradient(135deg, #1d4ed8, #2563eb)',
                                        color: 'white', fontWeight: 700, fontSize: '15px', cursor: status === 'running' ? 'not-allowed' : 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                                    }}>
                                    {status === 'running'
                                        ? <><RefreshCw size={18} className="spin" /> Procesiranje...</>
                                        : <><Lock size={18} /> Autorizuj Plaćanje {amount} {currency}</>
                                    }
                                </button>

                                {/* AUTH RESULT */}
                                {status !== 'idle' && status !== 'running' && paymentResult && (
                                    <div className="fade-in" style={{
                                        marginTop: '20px', padding: '20px', borderRadius: '12px',
                                        background: outcomeStyle(paymentResult.outcome).bg,
                                        border: `1px solid ${outcomeStyle(paymentResult.outcome).border}`,
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                            {paymentResult.outcome === 'authorized' || paymentResult.outcome === 'sent_for_settlement'
                                                ? <CheckCircle size={28} color="#10b981" />
                                                : paymentResult.outcome === 'fraud'
                                                    ? <AlertTriangle size={28} color="#f59e0b" />
                                                    : <XCircle size={28} color="#ef4444" />
                                            }
                                            <div>
                                                <div style={{ fontSize: '18px', fontWeight: 700, color: outcomeStyle(paymentResult.outcome).color, textTransform: 'uppercase' }}>
                                                    {paymentResult.outcome.replace(/_/g, ' ')}
                                                </div>
                                                <div style={{ fontSize: '13px', color: '#94a3b8' }}>Ref: {paymentResult.transactionReference}</div>
                                            </div>
                                        </div>
                                        {paymentResult.issuer?.authorizationCode && (
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                                {[
                                                    { label: 'Authorization Code', val: paymentResult.issuer.authorizationCode },
                                                    { label: 'Scheme Reference', val: paymentResult.scheme?.reference },
                                                    { label: 'CVC Check', val: paymentResult.riskFactors?.find(r => r.type === 'cvc')?.risk },
                                                    { label: 'AVS Check', val: paymentResult.riskFactors?.find(r => r.type === 'avs')?.risk },
                                                ].filter(i => i.val).map(item => (
                                                    <div key={item.label} style={{ background: 'rgba(0,0,0,0.2)', padding: '10px 12px', borderRadius: '8px' }}>
                                                        <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>{item.label}</div>
                                                        <div style={{ fontSize: '13px', fontFamily: 'monospace', color: '#e2e8f0' }}>{item.val}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {paymentResult.fraud && (
                                            <div style={{ marginTop: '12px', padding: '10px', borderRadius: '8px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
                                                <div style={{ fontSize: '12px', color: '#fbbf24' }}>🚫 Fraud Score: <strong>{paymentResult.fraud.score}</strong> — {paymentResult.fraud.outcome}</div>
                                            </div>
                                        )}
                                    </div>
                                )}
                                {status === 'error' && (
                                    <div style={{ marginTop: '16px', padding: '16px', borderRadius: '10px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', fontSize: '13px' }}>
                                        <AlertCircle size={16} style={{ display: 'inline', marginRight: '8px' }} />{errorMsg}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* TOKENIZE TAB */}
                        {activeTab === 'tokenize' && (
                            <div>
                                <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: '1.6', marginBottom: '20px' }}>
                                    Tokenizacija bezbedno čuva podatke o kartici bez PCI DSS rizika. Koristite token za svaku narednu naplatu gosta, bez ponovnog unosa kartice.
                                </p>

                                <button onClick={handleTokenize} disabled={status === 'running'}
                                    style={{
                                        width: '100%', padding: '13px', borderRadius: '10px', border: 'none',
                                        background: status === 'running' ? 'rgba(16,185,129,0.2)' : 'linear-gradient(135deg, #059669, #10b981)',
                                        color: 'white', fontWeight: 700, fontSize: '15px', cursor: status === 'running' ? 'not-allowed' : 'pointer',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                                    }}>
                                    {status === 'running'
                                        ? <><RefreshCw size={18} className="spin" /> Kreiranje tokena...</>
                                        : <><ShieldCheck size={18} /> Tokenizuj Karticu</>
                                    }
                                </button>

                                {status === 'success' && tokenResult && (
                                    <div className="fade-in" style={{ marginTop: '20px', padding: '20px', borderRadius: '12px', background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                                            <ShieldCheck size={24} color="#10b981" />
                                            <div style={{ fontSize: '16px', fontWeight: 700, color: '#10b981' }}>Token kreiran uspešno</div>
                                        </div>
                                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px', marginBottom: '12px' }}>
                                            <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', marginBottom: '6px' }}>Token ID</div>
                                            <div style={{ fontFamily: 'monospace', fontSize: '14px', color: '#10b981', wordBreak: 'break-all' }}>{tokenResult.tokenId}</div>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                                            {[
                                                { label: 'Kartični Brend', val: tokenResult.paymentInstrument.cardBrand },
                                                { label: 'Poslednje 4', val: `****${tokenResult.paymentInstrument.last4Digits}` },
                                                { label: 'Ističe', val: `${tokenResult.paymentInstrument.expiryMonth}/${tokenResult.paymentInstrument.expiryYear}` },
                                            ].map(item => (
                                                <div key={item.label} style={{ background: 'rgba(0,0,0,0.2)', padding: '10px 12px', borderRadius: '8px' }}>
                                                    <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>{item.label}</div>
                                                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#e2e8f0' }}>{item.val}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* TRANSACTIONS TAB */}
                        {activeTab === 'transactions' && (
                            <div>
                                <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
                                    {[
                                        { label: 'Ukupno', val: transactions.length, color: '#60a5fa' },
                                        { label: 'Uspešnih', val: transactions.filter(t => t.status === 'authorized' || t.status === 'sent_for_settlement').length, color: '#34d399' },
                                        { label: 'Odbijenih', val: transactions.filter(t => t.status === 'refused' || t.status === 'fraud').length, color: '#f87171' },
                                    ].map(stat => (
                                        <div key={stat.label} style={{ flex: 1, padding: '14px', borderRadius: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
                                            <div style={{ fontSize: '24px', fontWeight: 700, color: stat.color }}>{stat.val}</div>
                                            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>{stat.label}</div>
                                        </div>
                                    ))}
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {transactions.map(tx => {
                                        const style = outcomeStyle(tx.status);
                                        return (
                                            <div key={tx.worldpayRef} style={{
                                                padding: '16px', borderRadius: '12px',
                                                background: style.bg, border: `1px solid ${style.border}`,
                                                display: 'grid', gridTemplateColumns: '1fr auto',
                                                alignItems: 'center', gap: '16px',
                                            }}>
                                                <div>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                                                        <span style={{ fontSize: '14px', fontWeight: 600, color: '#f1f5f9' }}>{tx.internalId}</span>
                                                        <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 700, background: style.bg, color: style.color, border: `1px solid ${style.border}` }}>
                                                            {tx.status.replace(/_/g, ' ')}
                                                        </span>
                                                        {tx.refundedAmount && (
                                                            <span style={{ padding: '2px 8px', borderRadius: '12px', fontSize: '11px', background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)' }}>
                                                                Refund: -{formatCurrency(tx.refundedAmount!, tx.currency)}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div style={{ fontSize: '12px', color: '#64748b', fontFamily: 'monospace' }}>
                                                        {tx.worldpayRef} • {tx.cardBrand} ****{tx.cardLastFour} • {new Date(tx.timestamp).toLocaleDateString('sr')}
                                                    </div>
                                                </div>
                                                <div style={{ textAlign: 'right' }}>
                                                    <div style={{ fontSize: '18px', fontWeight: 700, color: style.color }}>
                                                        {formatCurrency(tx.amount, tx.currency)}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* API Info Card */}
                    <div style={{ ...CARD_STYLE, background: isLight ? '#f0f9ff' : 'rgba(37,99,235,0.04)', borderColor: isLight ? '#bae6fd' : 'rgba(37,99,235,0.15)' }}>
                        <h3 style={{ margin: '0 0 14px', fontSize: '13px', fontWeight: 700, color: isLight ? '#0369a1' : '#60a5fa', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Building2 size={14} /> WORLDPAY ACCESS API — BOOKING FLOW
                        </h3>
                        {[
                            { step: '1', name: 'POST /tokens', desc: 'Tokenizacija kartice gosta pri prvoj rezervaciji' },
                            { step: '2', name: 'POST /payments/authorizations', desc: 'Autorizacija pre potvrde rezervacije' },
                            { step: '3', name: 'POST /payments/{ref}/settlements', desc: 'Poravnanje nakon izvršene usluge' },
                            { step: '4', name: 'POST /payments/{ref}/refunds', desc: 'Parcijalna ili potpuna refundacija' },
                        ].map(s => (
                            <div key={s.step} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                                <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(37,99,235,0.15)', border: '1px solid rgba(37,99,235,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700, color: '#60a5fa', flexShrink: 0 }}>{s.step}</span>
                                <code style={{ fontSize: '12px', color: '#3b82f6' }}>{s.name}</code>
                                <span style={{ fontSize: '12px', color: '#64748b' }}>→ {s.desc}</span>
                            </div>
                        ))}
                        <div style={{ marginTop: '12px', padding: '10px', borderRadius: '8px', background: 'rgba(37,99,235,0.1)', fontSize: '12px', color: '#93c5fd' }}>
                            <strong>Sandbox:</strong> <code>try.access.worldpay.com</code><br />
                            <strong>Production:</strong> <code>access.worldpay.com</code><br />
                            <strong>Auth:</strong> Basic Auth (username:password base64)
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                .spin { animation: spin 1s linear infinite; }
                .fade-in { animation: fadeIn 0.3s ease; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
                input:focus, select:focus { border-color: rgba(37,99,235,0.5) !important; box-shadow: 0 0 0 3px rgba(37,99,235,0.1); }
            `}</style>
        </div>
    );
};

export default WorldpayTest;
