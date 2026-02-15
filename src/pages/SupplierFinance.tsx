import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    DollarSign,
    CreditCard,
    AlertTriangle,
    Search,
    Filter,
    ArrowUpRight,
    Calendar,
    Wallet,
    ArrowRightLeft,
    MoreVertical,
    FileText,
    Shield,
    X,
    CheckCircle,
    Copy,
    Loader2,
    TrendingDown,
    TrendingUp,
    RefreshCw
} from 'lucide-react';
import './SupplierFinance.css';
import { supplierFinanceService } from '../services/supplierFinanceService';
import { vccService } from '../services/vccService';
import type { VCCDetails } from '../services/vccService';
import { fxService } from '../services/fxService';
import type { ExchangeRate } from '../services/fxService';
import type { SupplierObligation, SupplierFinanceDashboardStats } from '../types/supplierFinance.types';
import { formatFinanceAmount } from '../utils/supplierFinanceUtils';

const SupplierFinance: React.FC = () => {
    const [obligations, setObligations] = useState<SupplierObligation[]>([]);
    const [stats, setStats] = useState<SupplierFinanceDashboardStats | null>(null);
    const [rates, setRates] = useState<ExchangeRate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');

    // Modal & Payment State
    const [selectedOb, setSelectedOb] = useState<SupplierObligation | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<'vcc' | 'bank'>('vcc');
    const [isProcessing, setIsProcessing] = useState(false);
    const [vccDetails, setVccDetails] = useState<VCCDetails | null>(null);
    const [paymentSuccess, setPaymentSuccess] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [obRes, statsRes, ratesData] = await Promise.all([
                supplierFinanceService.getObligations(),
                supplierFinanceService.getDashboardStats(),
                fxService.getCurrentRates()
            ]);

            if (obRes.success && obRes.data && obRes.data.length > 0) {
                setObligations(obRes.data);
            }

            setStats(statsRes);
            setRates(ratesData);
        } catch (error) {
            console.error('Failed to load finance data', error);
        } finally {
            setIsLoading(false);
        }
    };

    /**
     * SEED DATA for Demo Purpose
     */
    const seedMockData = async () => {
        const mockObs: Partial<SupplierObligation>[] = [
            {
                cis_code: 'CIS-20240315-001',
                supplier_id: 'Solvex Hotels',
                net_amount: 1250.50,
                currency: 'EUR',
                payment_deadline: new Date(Date.now() + 86400000).toISOString(),
                status: 'unpaid',
                payment_method_preferred: 'vcc',
                exchange_rate_at_booking: 1.0,
                notes: 'Rezervacija za Hotel RIU Helios'
            },
            {
                cis_code: 'CIS-20240315-002',
                supplier_id: 'Amadeus Air',
                net_amount: 450.00,
                currency: 'USD',
                payment_deadline: new Date(Date.now() - 86400000).toISOString(),
                status: 'unpaid',
                payment_method_preferred: 'bank',
                exchange_rate_at_booking: 1.09, // Fixed rate when booked
                notes: 'Avio karte BEG-JFK'
            },
            {
                cis_code: 'CIS-20240315-003',
                supplier_id: 'DMC Greece',
                net_amount: 3200.00,
                currency: 'EUR',
                payment_deadline: new Date(Date.now() + 5 * 86400000).toISOString(),
                status: 'unpaid',
                payment_method_preferred: 'vcc',
                exchange_rate_at_booking: 1.0,
                notes: 'Transferi i izleti'
            }
        ];

        setIsLoading(true);
        for (const ob of mockObs) {
            await supplierFinanceService.saveObligation(ob);
        }
        await loadData();
    };

    const handleExecutePayment = async () => {
        if (!selectedOb) return;
        setIsProcessing(true);

        try {
            if (paymentMethod === 'vcc') {
                const card = await vccService.generateCard(selectedOb.net_amount, selectedOb.currency, selectedOb.supplier_id);
                setVccDetails(card);

                await supplierFinanceService.recordTransaction({
                    obligation_id: selectedOb.id,
                    amount_paid: selectedOb.net_amount,
                    currency: selectedOb.currency,
                    payment_method: 'vcc',
                    vcc_id: card.id,
                    executed_by: 'admin@olympic.rs'
                });
            } else {
                await new Promise(resolve => setTimeout(resolve, 1500));
                await supplierFinanceService.recordTransaction({
                    obligation_id: selectedOb.id,
                    amount_paid: selectedOb.net_amount,
                    currency: selectedOb.currency,
                    payment_method: 'bank',
                    transaction_ref: `BANK-TX-${Math.floor(Math.random() * 1000000)}`,
                    executed_by: 'admin@olympic.rs'
                });
            }

            setPaymentSuccess(true);
            setObligations(prev => prev.map(o => o.id === selectedOb.id ? { ...o, status: 'paid' } : o));
        } catch (error) {
            console.error('Payment failed', error);
        } finally {
            setIsProcessing(false);
        }
    };

    const closePaymentModal = () => {
        setSelectedOb(null);
        setVccDetails(null);
        setPaymentSuccess(false);
        setIsProcessing(false);
    };

    const getPriorityLabel = (score: number) => {
        if (score >= 80) return { label: 'Visok', class: 'priority-high' };
        if (score >= 40) return { label: 'Srednji', class: 'priority-medium' };
        return { label: 'Nizak', class: 'priority-low' };
    };

    const getFXRisk = (ob: SupplierObligation) => {
        if (!ob.currency || ob.currency === 'EUR' || !ob.exchange_rate_at_booking) return null;

        const currentRate = rates.find(r => r.target === ob.currency)?.rate;
        if (!currentRate) return null;

        const exposure = fxService.calculateExposure(ob.net_amount, ob.exchange_rate_at_booking, currentRate);
        return exposure;
    };

    const filteredObligations = obligations.filter(ob => {
        const matchesSearch = ob.cis_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
            ob.notes?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = filterStatus === 'all' || ob.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    return (
        <div className="supplier-finance-container">
            {/* Header */}
            <header className="finance-header">
                <div>
                    <h1><DollarSign size={32} className="icon-info" /> Finance Hub: Isplate Dobavljačima</h1>
                    <p style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
                        Upravljanje obavezama, rokovima i likvidnošću
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    {obligations.length === 0 && (
                        <button className="action-btn" onClick={seedMockData} style={{ color: '#3b82f6' }}>
                            <RefreshCw size={16} /> Generiši Test Podatke
                        </button>
                    )}
                    <button className="pay-btn" onClick={loadData}>
                        <ArrowRightLeft size={18} style={{ marginRight: '8px' }} /> Osveži Podatke
                    </button>
                </div>
            </header>

            {/* FX Ticker */}
            <div className="fx-ticker">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderRight: '1px solid var(--border)', paddingRight: '16px', marginRight: '16px' }}>
                    <ArrowUpRight size={14} color="#3b82f6" />
                    <span style={{ fontWeight: '700' }}>LIVE FX (Base: EUR):</span>
                </div>
                {rates.map(rate => (
                    <div key={rate.target} className="fx-item">
                        <span style={{ opacity: 0.6 }}>{rate.target}:</span>
                        <span style={{ fontWeight: '600' }}>{rate.rate.toFixed(2)}</span>
                        {rate.trend === 'up' ? <TrendingUp size={12} className="fx-trend-up" /> : <TrendingDown size={12} className="fx-trend-down" />}
                    </div>
                ))}
            </div>

            {/* Stats Summary */}
            <div className="stats-grid">
                <div className="stat-card urgent">
                    <div className="stat-icon icon-urgent">
                        <AlertTriangle size={24} />
                    </div>
                    <div className="stat-value">{stats?.urgentCount || 0}</div>
                    <div className="stat-label">Hitne Obaveze (Danas/Juče)</div>
                </div>
                <div className="stat-card warning">
                    <div className="stat-icon icon-warning">
                        <Wallet size={24} />
                    </div>
                    <div className="stat-value">{stats ? formatFinanceAmount(stats.totalUnpaid) : '0,00 €'}</div>
                    <div className="stat-label">Ukupno za Isplatu</div>
                </div>
                <div className="stat-card success">
                    <div className="stat-icon icon-success">
                        <Shield size={24} />
                    </div>
                    <div className="stat-value">{stats?.pendingVCC || 0}</div>
                    <div className="stat-label">Planiranih VCC Plaćanja</div>
                </div>
                <div className="stat-card info" style={{ borderLeft: '4px solid #3b82f6' }}>
                    <div className="stat-icon icon-info">
                        <ArrowUpRight size={24} />
                    </div>
                    <div className="stat-value">{((stats?.totalUnpaid || 0) * 0.01).toFixed(2)} €</div>
                    <div className="stat-label">Procena VCC Cashback-a</div>
                </div>
            </div>

            {/* Controls */}
            <div className="finance-controls">
                <div className="search-wrapper">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Pretraži po CIS kodu ili napomeni..."
                        className="finance-search-input"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <select
                    className="finance-search-input"
                    style={{ width: 'auto', paddingLeft: '12px' }}
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                >
                    <option value="all">Svi Statusi</option>
                    <option value="unpaid">Neplaćeno</option>
                    <option value="processing">U obradi</option>
                    <option value="paid">Plaćeno</option>
                    <option value="disputed">Sporno</option>
                </select>
            </div>

            {/* Main Ledger Table */}
            <motion.div className="finance-table-container">
                <table className="finance-table">
                    <thead>
                        <tr>
                            <th>Status / Prioritet</th>
                            <th>CIS Kod</th>
                            <th>Dobavljač / Valuta</th>
                            <th>Neto Iznos</th>
                            <th>Rok Plaćanja</th>
                            <th>Metod</th>
                            <th>Akcije</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredObligations.map((ob) => {
                            const priority = getPriorityLabel(ob.priority_score);
                            const fxRisk = getFXRisk(ob);

                            return (
                                <tr key={ob.id}>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            {ob.priority_score >= 80 && ob.status === 'unpaid' && <span className="urgent-pulse" />}
                                            <span className={`priority-chip ${priority.class}`}>
                                                {priority.label}
                                            </span>
                                            {ob.status === 'paid' && <CheckCircle size={14} color="#10b981" />}
                                        </div>
                                    </td>
                                    <td style={{ fontWeight: '600' }}>{ob.cis_code}</td>
                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontWeight: '500' }}>{ob.supplier_id || 'N/A'}</span>
                                            {ob.currency !== 'EUR' && (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                                                    <span className="priority-chip priority-low" style={{ fontSize: '9px', padding: '1px 4px' }}>{ob.currency}</span>
                                                    {fxRisk && (
                                                        <span className={`fx-risk-badge ${fxRisk.isRisk ? 'loss' : 'gain'}`}>
                                                            {fxRisk.isRisk ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                                                            {Math.abs(fxRisk.exposure).toFixed(2)} €
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td style={{ fontWeight: '700' }}>{formatFinanceAmount(ob.net_amount, ob.currency)}</td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: (ob.priority_score >= 80 && ob.status === 'unpaid') ? '#ef4444' : 'inherit' }}>
                                            <Calendar size={14} />
                                            {ob.payment_deadline ? new Date(ob.payment_deadline).toLocaleDateString('sr-RS') : 'N/A'}
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                            {ob.payment_method_preferred === 'vcc' ? <CreditCard size={14} /> : <ArrowRightLeft size={14} />}
                                            <span style={{ textTransform: 'uppercase', fontSize: '11px' }}>{ob.payment_method_preferred}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <button className="action-btn" title="Detalji">
                                                <FileText size={16} />
                                            </button>
                                            <button
                                                className="pay-btn"
                                                style={{ padding: '6px 12px', fontSize: '12px' }}
                                                onClick={() => setSelectedOb(ob)}
                                                disabled={ob.status === 'paid'}
                                            >
                                                {ob.status === 'paid' ? 'Plaćeno' : 'Plati'}
                                            </button>
                                            <button className="action-btn">
                                                <MoreVertical size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </motion.div>

            {/* PAYMENT MODAL (Same as before but with FX context if applicable) */}
            <AnimatePresence>
                {selectedOb && (
                    <div className="finance-modal-overlay">
                        <motion.div
                            className="finance-modal"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                        >
                            <button className="close-btn" onClick={closePaymentModal} style={{ position: 'absolute', right: '20px', top: '20px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                <X size={24} />
                            </button>

                            {!paymentSuccess ? (
                                <>
                                    <h2><CreditCard size={24} color="var(--accent)" /> Izvršenje Plaćanja</h2>
                                    <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
                                        Plaćanje za {selectedOb.supplier_id} | <span style={{ color: 'white' }}>{formatFinanceAmount(selectedOb.net_amount, selectedOb.currency)}</span>
                                    </p>

                                    {/* FX Warning in Modal */}
                                    {selectedOb.currency !== 'EUR' && (
                                        <div style={{ background: 'rgba(239, 68, 68, 0.05)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)', marginBottom: '16px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <AlertTriangle size={16} color="#ef4444" />
                                            <span>
                                                Plaćanje je u <strong>{selectedOb.currency}</strong>. Trenutni kurs je nepovoljniji nego u trenutku rezervacije. Savet: Isplatiti odmah za fiksiranje troška.
                                            </span>
                                        </div>
                                    )}

                                    <div className="payment-options">
                                        <div
                                            className={`payment-option-card ${paymentMethod === 'vcc' ? 'active' : ''}`}
                                            onClick={() => setPaymentMethod('vcc')}
                                        >
                                            <CreditCard size={32} />
                                            <span>Virtual Card (VCC)</span>
                                        </div>
                                        <div
                                            className={`payment-option-card ${paymentMethod === 'bank' ? 'active' : ''}`}
                                            onClick={() => setPaymentMethod('bank')}
                                        >
                                            <ArrowRightLeft size={32} />
                                            <span>Bank Transfer</span>
                                        </div>
                                    </div>

                                    <div style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px', fontSize: '13px', marginBottom: '24px' }}>
                                        {paymentMethod === 'vcc' ? (
                                            <p>✨ <strong>VCC Optimizacija:</strong> Sistem će automatski generisati karticu sa limitom od {formatFinanceAmount(selectedOb.net_amount, selectedOb.currency)}. Očekivani cashback: <strong>{(selectedOb.net_amount * 0.01).toFixed(2)} {selectedOb.currency}</strong>.</p>
                                        ) : (
                                            <p>🏦 <strong>Uputstvo:</strong> Označite ovaj dug kao plaćen nakon izvršene uplate putem e-bankinga. Referenca: {selectedOb.cis_code}.</p>
                                        )}
                                    </div>

                                    <button
                                        className="pay-btn"
                                        style={{ width: '100%', padding: '14px', fontSize: '16px' }}
                                        onClick={handleExecutePayment}
                                        disabled={isProcessing}
                                    >
                                        {isProcessing ? (
                                            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                                <Loader2 className="loading-spinner" size={20} /> Obrađujem...
                                            </span>
                                        ) : (
                                            `Potvrdi Plaćanje (${paymentMethod.toUpperCase()})`
                                        )}
                                    </button>
                                </>
                            ) : (
                                <div style={{ textAlign: 'center' }}>
                                    <div style={{ background: 'rgba(16, 185, 129, 0.1)', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                                        <CheckCircle size={48} color="#10b981" />
                                    </div>
                                    <h2 style={{ justifyContent: 'center' }}>Plaćanje Uspešno!</h2>

                                    {vccDetails && (
                                        <div className="vcc-card-preview">
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <div className="vcc-chip" />
                                                <span style={{ fontSize: '10px', opacity: 0.6 }}>{vccDetails.provider}</span>
                                            </div>
                                            <div className="vcc-number">{vccDetails.cardNumber}</div>
                                            <div className="vcc-details">
                                                <div>
                                                    <div style={{ fontSize: '8px' }}>Card Holder</div>
                                                    <div>{vccDetails.cardHolder}</div>
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '8px' }}>Expiry</div>
                                                    <div>{vccDetails.expiryMonth}/{vccDetails.expiryYear}</div>
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '8px' }}>CVV</div>
                                                    <div>{vccDetails.cvv}</div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                                        Transakcija je uspešno evidentirana u sistemu.
                                    </p>

                                    <button className="pay-btn" style={{ width: '100%' }} onClick={closePaymentModal}>
                                        Zatvori
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SupplierFinance;
