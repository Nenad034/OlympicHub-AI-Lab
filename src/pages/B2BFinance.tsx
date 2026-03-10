import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    DollarSign,
    TrendingDown,
    CreditCard,
    History,
    ArrowLeft,
    CheckCircle2,
    Clock,
    AlertCircle,
    FileText,
    Download
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const B2BFinance: React.FC = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('limit'); // 'limit' | 'bordero'
    const subagentFinance = {
        creditLimit: 15000,
        currentDebt: 4250.80,
        availableLimit: 10749.20,
        currency: 'EUR',
        history: [
            { id: 1, date: '2025-02-24', cis: 'CIS-12345', amount: 850.00, status: 'Paid', method: 'Bank Transfer' },
            { id: 2, date: '2025-02-20', cis: 'CIS-99210', amount: 1200.00, status: 'Pending', method: 'VCC' },
            { id: 3, date: '2025-02-15', cis: 'CIS-88123', amount: 450.50, status: 'Paid', method: 'Credit Line' },
            { id: 4, date: '2025-02-10', cis: 'CIS-77123', amount: 3100.00, status: 'Overdue', method: 'Bank Transfer' },
        ]
    };

    const mockBordero = [
        { id: 'B-2026-03', period: 'Mart 2026', generated: '2026-03-31', count: 14, totalCommission: 1250.00, status: 'Obračunato' },
        { id: 'B-2026-02', period: 'Februar 2026', generated: '2026-02-28', count: 8, totalCommission: 640.50, status: 'Isplaćeno' },
        { id: 'B-2026-01', period: 'Januar 2026', generated: '2026-01-31', count: 22, totalCommission: 2100.00, status: 'Isplaćeno' },
    ];

    return (
        <div className="b2b-finance-page" style={{ padding: '20px', minHeight: '100vh', background: 'var(--bg-dark)' }}>
            {/* Header */}
            <header style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '30px' }}>
                <button
                    onClick={() => navigate('/')}
                    style={{ background: 'rgba(255,255,255,0.05)', border: 'none', padding: '10px', borderRadius: '12px', color: 'white' }}
                >
                    <ArrowLeft size={20} />
                </button>
                <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'white', margin: 0 }}>Finansije i Balans</h1>
            </header>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                <button
                    onClick={() => setActiveTab('limit')}
                    style={{
                        padding: '12px 24px',
                        background: activeTab === 'limit' ? '#00e5ff' : 'rgba(255,255,255,0.05)',
                        color: activeTab === 'limit' ? '#000' : 'white',
                        border: 'none',
                        borderRadius: '12px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                >
                    Finansijski Limit
                </button>
                <button
                    onClick={() => setActiveTab('bordero')}
                    style={{
                        padding: '12px 24px',
                        background: activeTab === 'bordero' ? '#00e5ff' : 'rgba(255,255,255,0.05)',
                        color: activeTab === 'bordero' ? '#000' : 'white',
                        border: 'none',
                        borderRadius: '12px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                    }}
                >
                    <FileText size={18} /> Bordero Provizije
                </button>
            </div>

            {activeTab === 'limit' ? (
                <>
                    {/* Main Stats Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{
                            background: 'linear-gradient(135deg, #0E4B5E 0%, #062d3a 100%)',
                            borderRadius: '24px',
                            padding: '24px',
                            color: 'white',
                            marginBottom: '24px',
                            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                            border: '1px solid rgba(255,255,255,0.1)'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <span style={{ fontSize: '14px', fontWeight: 600, opacity: 0.8 }}>Dostupan Limit</span>
                            <CreditCard size={20} />
                        </div>
                        <div style={{ fontSize: '36px', fontWeight: 900, marginBottom: '8px' }}>
                            {subagentFinance.availableLimit.toLocaleString()} {subagentFinance.currency}
                        </div>
                        <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px', marginBottom: '20px' }}>
                            <div style={{
                                width: `${(subagentFinance.availableLimit / subagentFinance.creditLimit) * 100}%`,
                                height: '100%',
                                background: '#00e5ff',
                                borderRadius: '3px',
                                boxShadow: '0 0 10px rgba(0,229,255,0.5)'
                            }} />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div>
                                <div style={{ fontSize: '12px', opacity: 0.6, marginBottom: '4px' }}>Ukupni Limit</div>
                                <div style={{ fontSize: '16px', fontWeight: 700 }}>{subagentFinance.creditLimit.toLocaleString()} €</div>
                            </div>
                            <div>
                                <div style={{ fontSize: '12px', opacity: 0.6, marginBottom: '4px' }}>Trenutni Dug</div>
                                <div style={{ fontSize: '16px', fontWeight: 700, color: '#ffb300' }}>{subagentFinance.currentDebt.toLocaleString()} €</div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Actions / History */}
                    <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'white', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <History size={18} color="#00e5ff" />
                        Istorija Uplata
                    </h2>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {subagentFinance.history.map(item => (
                            <motion.div
                                key={item.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                style={{
                                    background: 'rgba(255,255,255,0.03)',
                                    border: '1px solid rgba(255,255,255,0.05)',
                                    borderRadius: '18px',
                                    padding: '16px',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}
                            >
                                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                    <div style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '12px',
                                        background: item.status === 'Paid' ? 'rgba(16, 185, 129, 0.1)' : item.status === 'Overdue' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center'
                                    }}>
                                        {item.status === 'Paid' ? <CheckCircle2 size={18} color="#10b981" /> : item.status === 'Overdue' ? <AlertCircle size={18} color="#ef4444" /> : <Clock size={18} color="#f59e0b" />}
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '14px', fontWeight: 700, color: 'white' }}>{item.cis}</div>
                                        <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>{item.date} • {item.method}</div>
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <div style={{ fontSize: '15px', fontWeight: 800, color: 'white' }}>-{item.amount.toLocaleString()} €</div>
                                    <div style={{
                                        fontSize: '10px',
                                        fontWeight: 600,
                                        color: item.status === 'Paid' ? '#10b981' : item.status === 'Overdue' ? '#ef4444' : '#f59e0b'
                                    }}>
                                        {item.status.toUpperCase()}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* Support Box */}
                    <div style={{
                        marginTop: '40px',
                        padding: '24px',
                        borderRadius: '24px',
                        background: 'rgba(0, 229, 255, 0.05)',
                        border: '1px solid rgba(0, 229, 255, 0.1)',
                        textAlign: 'center'
                    }}>
                        <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 16px 0' }}>Potrebna vam je pomoć oko finansija ili uvećanje limita?</p>
                        <button style={{
                            background: '#00e5ff',
                            color: '#020b0e',
                            border: 'none',
                            padding: '12px 24px',
                            borderRadius: '12px',
                            fontWeight: 800,
                            width: '100%'
                        }}>
                            Kontaktiraj Podršku
                        </button>
                    </div>
                </>
            ) : (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div style={{ background: 'rgba(0,0,0,0.2)', padding: '24px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.05)' }}>
                        <h2 style={{ color: 'white', marginTop: 0, marginBottom: '8px', fontSize: '20px' }}>Automatska Bordero Evidencija</h2>
                        <p style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '24px' }}>Pregled provizija na osnovu zatvorenih Dosijea obračunatih po modelu E.O.M (Kraj Meseca).</p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {mockBordero.map(b => (
                                <div key={b.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', background: 'rgba(255,255,255,0.03)', borderRadius: '16px', borderLeft: b.status === 'Isplaćeno' ? '4px solid #10b981' : '4px solid #ffb300' }}>
                                    <div>
                                        <div style={{ fontSize: '16px', fontWeight: 900, color: 'white', marginBottom: '4px' }}>Bordero Provizija: {b.period}</div>
                                        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>Kreirano: {b.generated} • Broj Rezervacija: {b.count}</div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontSize: '20px', fontWeight: 900, color: '#00e5ff' }}>{b.totalCommission.toLocaleString()} EUR</div>
                                            <div style={{ fontSize: '11px', color: b.status === 'Isplaćeno' ? '#10b981' : '#ffb300', fontWeight: 900 }}>{b.status.toUpperCase()}</div>
                                        </div>
                                        <button style={{ background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', opacity: 0.7, padding: '10px' }} title="Preuzmi PDF">
                                            <Download size={22} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
};

export default B2BFinance;
