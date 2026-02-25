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
    RefreshCw,
    BarChart3,
    Plus,
    Building2
} from 'lucide-react';
import './SupplierFinance.css';
import { supabase } from '../supabaseClient';
import { supplierFinanceService } from '../services/supplierFinanceService';
import supplierService from '../services/SupplierService';
import type { UnifiedSupplier } from '../services/SupplierService';
import { vccService } from '../services/vccService';
import type { VCCDetails } from '../services/vccService';
import { fxService } from '../services/fxService';
import type { ExchangeRate } from '../services/fxService';
import type { SupplierObligation, SupplierFinanceDashboardStats, PaymentCategory, SupplierVCCSettings } from '../types/supplierFinance.types';
import { formatFinanceAmount } from '../utils/supplierFinanceUtils';
import { ModernCalendar } from '../components/ModernCalendar';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend, AreaChart, Area
} from 'recharts';

const SupplierFinance: React.FC = () => {
    const [obligations, setObligations] = useState<SupplierObligation[]>([]);
    const [stats, setStats] = useState<SupplierFinanceDashboardStats | null>(null);
    const [rates, setRates] = useState<ExchangeRate[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'obligations' | 'archive' | 'analytics' | 'vcc-settings'>('obligations');
    const [vccSettings, setVccSettings] = useState<SupplierVCCSettings[]>([]);
    const [allSuppliers, setAllSuppliers] = useState<UnifiedSupplier[]>([]);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    // Date Ranges
    const [bookingRange, setBookingRange] = useState({ from: '', to: '' });
    const [stayRange, setStayRange] = useState({ from: '', to: '' });
    const [analyticsGroupBy, setAnalyticsGroupBy] = useState<'none' | 'supplier' | 'country' | 'destination' | 'subagent' | 'office'>('none');
    const [showVisuals, setShowVisuals] = useState(false);

    // Calendar Popups
    const [showBookingCal, setShowBookingCal] = useState(false);
    const [showStayCal, setShowStayCal] = useState(false);

    // Modal & Payment State
    const [selectedOb, setSelectedOb] = useState<SupplierObligation | null>(null);
    const [paymentMethod, setPaymentMethod] = useState<'vcc' | 'bank'>('vcc');
    const [paymentCategory, setPaymentCategory] = useState<PaymentCategory>('full');
    const [partialAmount, setPartialAmount] = useState<number>(0);
    const [isProcessing, setIsProcessing] = useState(false);
    const [vccDetails, setVccDetails] = useState<VCCDetails | null>(null);
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const [transactions, setTransactions] = useState<any[]>([]); // For Archive tab

    // VCC Settings Edit State
    const [editingVcc, setEditingVcc] = useState<SupplierVCCSettings | null>(null);
    const [isSavingVcc, setIsSavingVcc] = useState(false);

    // Manual Obligation State
    const [showAddModal, setShowAddModal] = useState(false);
    const [newOb, setNewOb] = useState<Partial<SupplierObligation>>({
        cis_code: '',
        supplier_id: '',
        net_amount: 0,
        gross_amount: 0,
        currency: 'EUR',
        status: 'unpaid',
        payment_method_preferred: 'bank',
        is_final_net: false
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [obRes, statsRes, ratesData, vccSettingsResult, supplierData] = await Promise.all([
                supplierFinanceService.getObligations(),
                supplierFinanceService.getDashboardStats(),
                fxService.getCurrentRates(),
                supplierFinanceService.getAllVCCSettings(),
                supplierService.getAllSuppliers()
            ]);

            if (obRes.success && obRes.data) {
                setObligations(obRes.data);
            }

            if (vccSettingsResult) {
                setVccSettings(vccSettingsResult);
            }

            if (Array.isArray(supplierData)) {
                setAllSuppliers(supplierData);
            }


            // Fetch transactions for archive if we are on that tab (or just always for simplicity)
            const { data: txData } = await supabase.from('supplier_transactions').select('*, supplier_obligations(cis_code, supplier_id)').order('executed_at', { ascending: false });
            if (txData) setTransactions(txData);

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
        const suppliers = await supplierService.getAllSuppliers();
        const solvex = suppliers.find(s => s.name.toLowerCase().includes('solvex'))?.name || 'Solvex Hotels';
        const amadeus = suppliers.find(s => s.name.toLowerCase().includes('amadeus'))?.name || 'Amadeus Air';

        const mockObs: Partial<SupplierObligation>[] = [
            {
                cis_code: 'CIS-' + Math.random().toString(36).substr(2, 7).toUpperCase(),
                supplier_id: amadeus,
                net_amount: 5200.00,
                gross_amount: 6000.00,
                currency: 'EUR',
                payment_deadline: new Date(Date.now() + 2 * 86400000).toISOString(),
                status: 'unpaid',
                payment_method_preferred: 'bank',
                is_final_net: false,
                stay_from: '2024-03-20',
                stay_to: '2024-03-22',
                country_id: 'Bulgaria',
                destination_id: 'Sofia',
                notes: 'Urgente plaćanje za avio karte'
            },
            {
                cis_code: 'CIS-' + Math.random().toString(36).substr(2, 7).toUpperCase(),
                supplier_id: solvex,
                net_amount: 1250.50,
                gross_amount: 1500.00,
                currency: 'EUR',
                payment_deadline: new Date(Date.now() + 5 * 86400000).toISOString(),
                status: 'unpaid',
                payment_method_preferred: 'vcc',
                is_final_net: true,
                stay_from: '2024-06-15',
                stay_to: '2024-06-22',
                country_id: 'Bulgaria',
                destination_id: 'Sunny Beach',
                notes: 'Rezervacija iz dosijea'
            }
        ];

        setIsLoading(true);
        try {
            for (const ob of mockObs) {
                await supplierFinanceService.saveObligation(ob);
            }
            alert('Test podaci su uspešno generisani!');
            await loadData();
        } catch (error: any) {
            console.error('Seed process failed:', error);
            alert(`Greška: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleExecutePayment = async () => {
        if (!selectedOb) return;
        setIsProcessing(true);

        const amountToPay = paymentCategory === 'full'
            ? selectedOb.net_amount - selectedOb.paid_amount
            : partialAmount;

        try {
            let cardDetails = null;
            if (paymentMethod === 'vcc') {
                cardDetails = await vccService.generateCard(amountToPay, selectedOb.currency, selectedOb.supplier_id);
                setVccDetails(cardDetails);
            }

            const res = await supplierFinanceService.recordTransaction({
                obligation_id: selectedOb.id,
                amount_paid: amountToPay,
                currency: selectedOb.currency,
                payment_method: paymentMethod,
                payment_category: paymentCategory,
                vcc_id: cardDetails?.id,
                transaction_ref: paymentMethod === 'bank' ? `BANK-TX-${Math.floor(Math.random() * 1000000)}` : undefined,
                executed_by: 'admin@olympic.rs'
            });

            if (res.success) {
                setPaymentSuccess(true);
                await loadData(); // Reload to get updated balance and status
            }
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

    const handleSaveVccSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingVcc) return;

        setIsSavingVcc(true);
        try {
            await supplierFinanceService.saveVCCSettings(editingVcc);
            await loadData(); // Refresh list
            setEditingVcc(null);
        } catch (error) {
            console.error('Failed to save VCC settings', error);
            alert('Greška pri čuvanju postavki.');
        } finally {
            setIsSavingVcc(false);
        }
    };

    const handleSaveNewObligation = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newOb.supplier_id || !newOb.net_amount) {
            alert('Molimo unesite dobavljača i iznos.');
            return;
        }

        setIsLoading(true);
        try {
            const res = await supplierFinanceService.saveObligation({
                ...newOb,
                cis_code: newOb.cis_code || `MANUAL-${Math.floor(Math.random() * 100000)}`
            });
            if (res.success) {
                setShowAddModal(false);
                setNewOb({
                    cis_code: '',
                    supplier_id: '',
                    net_amount: 0,
                    gross_amount: 0,
                    currency: 'EUR',
                    status: 'unpaid',
                    payment_method_preferred: 'bank',
                    is_final_net: false
                });
                await loadData();
            }
        } catch (error) {
            console.error('Failed to save manual obligation', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleApproveVccRequest = async (obligationId: string) => {
        if (!window.confirm('Da li ste sigurni da želite da ODOBRITE generisanje VCC kartice?')) return;

        try {
            await supplierFinanceService.approveVCC(obligationId, 'Admin User'); // Simulate admin user
            await loadData();
            alert('VCC Zahtev odobren!');
        } catch (error) {
            console.error('Failed to approve VCC', error);
            alert('Greška pri odobravanju.');
        }
    };

    const getPriorityLabel = (score: number) => {
        if (score >= 80) return { label: 'HITNO!!!', class: 'priority-high' };
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
        const query = searchQuery.toLowerCase();
        const matchesSearch =
            ob.cis_code.toLowerCase().includes(query) ||
            ob.notes?.toLowerCase().includes(query) ||
            ob.supplier_id.toLowerCase().includes(query) ||
            ob.country_id?.toLowerCase().includes(query) ||
            ob.destination_id?.toLowerCase().includes(query) ||
            ob.property_name?.toLowerCase().includes(query) ||
            ob.subagent_id?.toLowerCase().includes(query) ||
            ob.office_id?.toLowerCase().includes(query);

        const matchesStatus = filterStatus === 'all' || ob.status === filterStatus;

        // Booking Date Filter Logic
        let matchesBooking = true;
        if (bookingRange.from && ob.created_at) {
            matchesBooking = matchesBooking && new Date(ob.created_at) >= new Date(bookingRange.from);
        }
        if (bookingRange.to && ob.created_at) {
            matchesBooking = matchesBooking && new Date(ob.created_at) <= new Date(bookingRange.to);
        }

        // Stay Date Filter Logic
        let matchesStay = true;
        if (stayRange.from && ob.stay_from) {
            matchesStay = matchesStay && new Date(ob.stay_from) >= new Date(stayRange.from);
        }
        if (stayRange.to && ob.stay_from) {
            matchesStay = matchesStay && new Date(ob.stay_from) <= new Date(stayRange.to);
        }

        return matchesSearch && matchesStatus && matchesBooking && matchesStay;
    });

    // Chart Data Preparation
    const getChartData = () => {
        const dimension = analyticsGroupBy === 'none' ? 'supplier' : analyticsGroupBy;
        const groups: Record<string, { name: string, gross: number, net: number, profit: number }> = {};

        filteredObligations.forEach(ob => {
            const key = (ob as any)[`${dimension}_id`] || (ob as any)[dimension] || 'Ostalo';
            if (!groups[key]) groups[key] = { name: key, gross: 0, net: 0, profit: 0 };
            groups[key].gross += ob.gross_amount || 0;
            groups[key].net += ob.net_amount || 0;
            groups[key].profit += (ob.gross_amount || 0) - ob.net_amount;
        });

        return Object.values(groups).sort((a, b) => b.profit - a.profit);
    };

    const chartData = getChartData();
    const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

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
                    <div className="tab-switcher">
                        <button className={activeTab === 'obligations' ? 'active' : ''} onClick={() => setActiveTab('obligations')}>Dugovanja</button>
                        <button className={activeTab === 'archive' ? 'active' : ''} onClick={() => setActiveTab('archive')}>Arhiva</button>
                        <button className={activeTab === 'analytics' ? 'active' : ''} onClick={() => setActiveTab('analytics')}>Yield / Analitika</button>
                        <button className={activeTab === 'vcc-settings' ? 'active' : ''} onClick={() => setActiveTab('vcc-settings')}>VCC Postavke</button>
                    </div>
                    <button className="action-btn-success" onClick={() => setShowAddModal(true)}>
                        <Plus size={16} /> Nova Obaveza
                    </button>
                    <button className="action-btn-info" onClick={seedMockData}>
                        <RefreshCw size={16} /> Test Podaci
                    </button>
                </div>
            </header>

            {/* FX Ticker */}
            <div className="fx-ticker">
                <div className="fx-ticker-header">
                    <ArrowUpRight size={16} />
                    <span>Live FX (Base: EUR)</span>
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

            {/* Controls & Filters */}
            <div className="finance-controls" style={{ flexDirection: 'column', alignItems: 'stretch', gap: '16px' }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <div className="search-wrapper" style={{ flex: 1 }}>
                        <Search size={18} />
                        <input
                            type="text"
                            placeholder="Pretraži (Rezervacija, Dobavljač, Država, Subagent...)"
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
                        <option value="partially_paid">Akontacija plaćena</option>
                        <option value="paid">Plaćeno</option>
                        <option value="disputed">Sporno</option>
                    </select>
                </div>

                <div style={{ display: 'flex', gap: '20px' }}>
                    {/* Booking Date Row */}
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.03)', padding: '10px 16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                        <div style={{ color: 'var(--accent)', fontWeight: '600', fontSize: '12px', minWidth: '130px' }}>Rezervacije od...do:</div>
                        <div
                            className="date-range-display"
                            onClick={() => setShowBookingCal(true)}
                            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}
                        >
                            <Calendar size={16} opacity={0.6} />
                            <span style={{ fontSize: '13px' }}>
                                {bookingRange.from ? `${new Date(bookingRange.from).toLocaleDateString('sr-RS')} - ${bookingRange.to ? new Date(bookingRange.to).toLocaleDateString('sr-RS') : '...'}` : 'Svi datumi'}
                            </span>
                        </div>
                        {bookingRange.from && <X size={14} style={{ cursor: 'pointer', opacity: 0.5 }} onClick={() => setBookingRange({ from: '', to: '' })} />}
                    </div>

                    {/* Stay Date Row */}
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.03)', padding: '10px 16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                        <div style={{ color: 'var(--accent)', fontWeight: '600', fontSize: '12px', minWidth: '130px' }}>Boravak od...do:</div>
                        <div
                            className="date-range-display"
                            onClick={() => setShowStayCal(true)}
                            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}
                        >
                            <Calendar size={16} opacity={0.6} />
                            <span style={{ fontSize: '13px' }}>
                                {stayRange.from ? `${new Date(stayRange.from).toLocaleDateString('sr-RS')} - ${stayRange.to ? new Date(stayRange.to).toLocaleDateString('sr-RS') : '...'}` : 'Svi datumi'}
                            </span>
                        </div>
                        {stayRange.from && <X size={14} style={{ cursor: 'pointer', opacity: 0.5 }} onClick={() => setStayRange({ from: '', to: '' })} />}
                    </div>
                </div>

                {showBookingCal && (
                    <ModernCalendar
                        startDate={bookingRange.from}
                        endDate={bookingRange.to}
                        onChange={(start, end) => setBookingRange({ from: start, to: end })}
                        onClose={() => setShowBookingCal(false)}
                    />
                )}
                {showStayCal && (
                    <ModernCalendar
                        startDate={stayRange.from}
                        endDate={stayRange.to}
                        onChange={(start, end) => setStayRange({ from: start, to: end })}
                        onClose={() => setShowStayCal(false)}
                    />
                )}
            </div>

            {activeTab === 'obligations' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="finance-table-container">
                    <table className="finance-table">
                        <thead>
                            <tr>
                                <th>Status / Prioritet</th>
                                <th>Broj Rezervacije</th>
                                <th>Dobavljač / Valuta</th>
                                <th>Neto Iznos</th>
                                <th>Rok Plaćanja</th>
                                <th>Metod</th>
                                <th>Akcije</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredObligations.filter(o => o.status !== 'paid').map((ob) => {
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
                                            </div>
                                        </td>
                                        <td style={{ fontWeight: '600' }}>{ob.cis_code}</td>
                                        <td>
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span style={{ fontWeight: '500' }}>{ob.supplier_id || 'N/A'}</span>
                                                    {ob.vcc_approval_status === 'pending' && (
                                                        <span style={{
                                                            fontSize: '9px',
                                                            padding: '2px 6px',
                                                            background: '#ef4444',
                                                            color: 'white',
                                                            borderRadius: '4px',
                                                            fontWeight: 'bold',
                                                            animation: 'pulse 2s infinite'
                                                        }}>ČEKA ODOBRENJE VCC</span>
                                                    )}
                                                </div>
                                                {ob.stay_from && <span style={{ fontSize: '10px', opacity: 0.5 }}>Boravak: {new Date(ob.stay_from).toLocaleDateString()}</span>}
                                            </div>
                                        </td>
                                        <td style={{ fontWeight: '700' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span>{formatFinanceAmount(ob.net_amount, ob.currency)}</span>
                                                {ob.paid_amount > 0 && (
                                                    <div style={{ fontSize: '10px', marginTop: '4px', color: '#10b981' }}>
                                                        Uplaćeno: {formatFinanceAmount(ob.paid_amount, ob.currency)}
                                                        <div style={{ width: '100%', height: '3px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', marginTop: '2px' }}>
                                                            <div style={{ width: `${(ob.paid_amount / ob.net_amount) * 100}%`, height: '100%', background: '#10b981', borderRadius: '2px' }} />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: (ob.priority_score >= 80) ? '#ef4444' : 'inherit' }}>
                                                <Calendar size={14} />
                                                {ob.payment_deadline ? new Date(ob.payment_deadline).toLocaleDateString('sr-RS') : 'N/A'}
                                            </div>
                                        </td>
                                        <td>{ob.payment_method_preferred}</td>
                                        <td>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <button className="pay-btn" onClick={() => setSelectedOb(ob)}>Plati</button>
                                                {ob.vcc_approval_status === 'pending' && (
                                                    <button
                                                        className="action-btn-mini"
                                                        style={{ background: '#10b981', color: 'white' }}
                                                        onClick={() => handleApproveVccRequest(ob.id)}
                                                    >
                                                        Odobri VCC
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </motion.div>
            )}

            {activeTab === 'archive' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="finance-table-container">
                    <table className="finance-table">
                        <thead>
                            <tr>
                                <th>Datum Isplate</th>
                                <th>Broj Rezervacije</th>
                                <th>Dobavljač</th>
                                <th>Iznos Uplate</th>
                                <th>Tip / Metod</th>
                                <th>Izvršio</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.map((tx) => (
                                <tr key={tx.id}>
                                    <td>{new Date(tx.executed_at).toLocaleString('sr-RS')}</td>
                                    <td>{tx.supplier_obligations?.cis_code}</td>
                                    <td>{tx.supplier_obligations?.supplier_id}</td>
                                    <td style={{ fontWeight: '700', color: '#10b981' }}>{formatFinanceAmount(tx.amount_paid, tx.currency)}</td>
                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                            <span style={{ fontSize: '10px', textTransform: 'uppercase', opacity: 0.7 }}>{tx.payment_category}</span>
                                            <span style={{ fontSize: '11px', fontWeight: 'bold' }}>{tx.payment_method}</span>
                                        </div>
                                    </td>
                                    <td style={{ opacity: 0.6, fontSize: '11px' }}>{tx.executed_by}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </motion.div>
            )}

            {activeTab === 'analytics' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="analytics-view">
                    <div className="stats-grid">
                        <div className="stat-card success" style={{ background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.1) 0%, rgba(16, 185, 129, 0.02) 100%)' }}>
                            <div className="stat-label">Predviđena Zarada (Yield)</div>
                            <div className="stat-value" style={{ color: '#10b981' }}>{formatFinanceAmount(stats?.totalProfitExpected || 0)}</div>
                            <small style={{ opacity: 0.6 }}>Ukupna margina iz rezervacija</small>
                        </div>
                        <div className="stat-card info" style={{ background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.02) 100%)' }}>
                            <div className="stat-label">Realizovana Zarada</div>
                            <div className="stat-value" style={{ color: '#3b82f6' }}>{formatFinanceAmount(stats?.totalProfitRealized || 0)}</div>
                            <small style={{ opacity: 0.6 }}>Potvrđena dobit</small>
                        </div>
                    </div>

                    <div className="analytics-controls" style={{ marginTop: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '16px', border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontSize: '11px', fontWeight: '700', opacity: 0.5, textTransform: 'uppercase', letterSpacing: '1px' }}>Dimenzija:</span>
                            <div className="tab-switcher" style={{ background: 'rgba(0,0,0,0.2)', padding: '3px' }}>
                                <button className={analyticsGroupBy === 'none' ? 'active' : ''} onClick={() => setAnalyticsGroupBy('none')}>Sve</button>
                                <button className={analyticsGroupBy === 'supplier' ? 'active' : ''} onClick={() => setAnalyticsGroupBy('supplier')}>Dobavljači</button>
                                <button className={analyticsGroupBy === 'country' ? 'active' : ''} onClick={() => setAnalyticsGroupBy('country')}>Države</button>
                                <button className={analyticsGroupBy === 'destination' ? 'active' : ''} onClick={() => setAnalyticsGroupBy('destination')}>Destinacije</button>
                                <button className={analyticsGroupBy === 'subagent' ? 'active' : ''} onClick={() => setAnalyticsGroupBy('subagent')}>Subagenti</button>
                                <button className={analyticsGroupBy === 'office' ? 'active' : ''} onClick={() => setAnalyticsGroupBy('office')}>Poslovnice</button>
                            </div>
                        </div>

                        <button
                            className={`action-btn ${showVisuals ? 'active' : ''}`}
                            onClick={() => setShowVisuals(!showVisuals)}
                            style={{
                                background: showVisuals ? 'var(--accent)' : 'rgba(255,255,255,0.05)',
                                color: showVisuals ? 'white' : 'var(--text-secondary)',
                                border: '1px solid ' + (showVisuals ? 'var(--accent)' : 'var(--border)')
                            }}
                        >
                            <BarChart3 size={16} /> {showVisuals ? 'Sakrij Grafike' : 'Prikaži Grafičku Analizu'}
                        </button>
                    </div>

                    <AnimatePresence>
                        {showVisuals && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                style={{ overflow: 'hidden' }}
                            >
                                <div className="analytics-charts-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginTop: '24px' }}>
                                    <div className="chart-container-card">
                                        <h3>Raspodela Profita (Yield Share)</h3>
                                        <div style={{ height: '280px', marginTop: '16px' }}>
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie
                                                        data={chartData}
                                                        cx="50%"
                                                        cy="50%"
                                                        innerRadius={60}
                                                        outerRadius={90}
                                                        paddingAngle={5}
                                                        dataKey="profit"
                                                    >
                                                        {chartData.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip
                                                        contentStyle={{ background: 'rgba(15, 23, 42, 0.9)', border: '1px solid var(--border)', borderRadius: '12px' }}
                                                        formatter={(value: any) => [`${Number(value || 0).toLocaleString()} €`, 'Profit']}
                                                    />
                                                    <Legend verticalAlign="bottom" height={36} />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    <div className="chart-container-card">
                                        <h3>Prihodi vs Troškovi (Top 8)</h3>
                                        <div style={{ height: '280px', marginTop: '16px' }}>
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={chartData.slice(0, 8)}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                                                    <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.5)' }} />
                                                    <YAxis fontSize={10} axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.5)' }} tickFormatter={(val) => `${val / 1000}k`} />
                                                    <Tooltip
                                                        cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                                                        contentStyle={{ background: 'rgba(15, 23, 42, 0.9)', border: '1px solid var(--border)', borderRadius: '12px' }}
                                                    />
                                                    <Bar dataKey="gross" name="Bruto" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
                                                    <Bar dataKey="net" name="Neto" fill="#64748b" radius={[4, 4, 0, 0]} barSize={20} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="finance-table-container" style={{ marginTop: '16px' }}>
                        <table className="finance-table">
                            <thead>
                                <tr>
                                    <th>{analyticsGroupBy === 'none' ? 'Rezervacija' : analyticsGroupBy.charAt(0).toUpperCase() + analyticsGroupBy.slice(1)}</th>
                                    <th>Bruto (Prodajni)</th>
                                    <th>Neto (Trošak)</th>
                                    <th>Yield (Zarada)</th>
                                    <th>Margina %</th>
                                    {analyticsGroupBy === 'none' && <th>Status</th>}
                                </tr>
                            </thead>
                            <tbody>
                                {(() => {
                                    if (analyticsGroupBy === 'none') {
                                        return filteredObligations.map((ob) => {
                                            const profit = (ob.gross_amount || 0) - ob.net_amount;
                                            const margin = ob.gross_amount ? (profit / ob.gross_amount) * 100 : 0;
                                            return (
                                                <tr key={ob.id}>
                                                    <td>
                                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                            <span style={{ fontWeight: '600' }}>{ob.cis_code}</span>
                                                            <span style={{ fontSize: '10px', opacity: 0.5 }}>{ob.supplier_id}</span>
                                                        </div>
                                                    </td>
                                                    <td>{formatFinanceAmount(ob.gross_amount || 0, ob.currency)}</td>
                                                    <td>{formatFinanceAmount(ob.net_amount, ob.currency)}</td>
                                                    <td style={{ fontWeight: '700', color: profit > 0 ? '#10b981' : '#ef4444' }}>{formatFinanceAmount(profit, ob.currency)}</td>
                                                    <td>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', minWidth: '60px' }}>
                                                                <div style={{ width: `${Math.min(100, margin)}%`, height: '100%', background: margin > 15 ? '#10b981' : margin > 7 ? '#f59e0b' : '#ef4444', borderRadius: '2px' }} />
                                                            </div>
                                                            <span style={{ fontSize: '11px', fontWeight: 'bold' }}>{margin.toFixed(1)}%</span>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span className={`profit-badge ${ob.is_final_net ? 'success' : 'warning'}`}>
                                                            {ob.is_final_net ? 'Realno' : 'Predviđeno'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        });
                                    }

                                    // Grouping Logic
                                    const groups: Record<string, { label: string, gross: number, net: number, count: number }> = {};
                                    filteredObligations.forEach(ob => {
                                        const key = (ob as any)[`${analyticsGroupBy}_id`] || (ob as any)[analyticsGroupBy] || 'Ostalo';
                                        if (!groups[key]) groups[key] = { label: key, gross: 0, net: 0, count: 0 };
                                        groups[key].gross += ob.gross_amount || 0;
                                        groups[key].net += ob.net_amount || 0;
                                        groups[key].count += 1;
                                    });

                                    return Object.values(groups).sort((a, b) => (b.gross - b.net) - (a.gross - a.net)).map((g, idx) => {
                                        const profit = g.gross - g.net;
                                        const margin = g.gross ? (profit / g.gross) * 100 : 0;
                                        return (
                                            <tr key={idx}>
                                                <td>
                                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                        <span style={{ fontWeight: '600' }}>{g.label}</span>
                                                        <span style={{ fontSize: '10px', opacity: 0.5 }}>{g.count} rezervacija</span>
                                                    </div>
                                                </td>
                                                <td>{formatFinanceAmount(g.gross)}</td>
                                                <td>{formatFinanceAmount(g.net)}</td>
                                                <td style={{ fontWeight: '700', color: profit > 0 ? '#10b981' : '#ef4444' }}>{formatFinanceAmount(profit)}</td>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                        <div style={{ flex: 1, height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', minWidth: '80px' }}>
                                                            <div style={{ width: `${Math.min(100, margin)}%`, height: '100%', background: margin > 15 ? '#10b981' : margin > 7 ? '#f59e0b' : '#ef4444', borderRadius: '3px' }} />
                                                        </div>
                                                        <span style={{ fontSize: '11px', fontWeight: 'bold' }}>{margin.toFixed(1)}%</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    });
                                })()}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            )}

            {activeTab === 'vcc-settings' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="vcc-settings-view">
                    <div className="finance-table-container">
                        <table className="finance-table">
                            <thead>
                                <tr>
                                    <th>Dobavljač</th>
                                    <th>Auto-Generisanje</th>
                                    <th>Tip Kartice</th>
                                    <th>Aktivacija (Delay)</th>
                                    <th>Buffer %</th>
                                    <th>Valuta</th>
                                    <th>Akcije</th>
                                </tr>
                            </thead>
                            <tbody>
                                {vccSettings.map((s) => (
                                    <tr key={s.id}>
                                        <td style={{ fontWeight: 'bold' }}>{s.supplier_id}</td>
                                        <td>
                                            <span className={`status-pill ${s.auto_generate ? 'active' : 'inactive'}`}>
                                                {s.auto_generate ? 'UKLJUČENO' : 'ISKLJUČENO'}
                                            </span>
                                        </td>
                                        <td>{s.vcc_type}</td>
                                        <td>{s.activation_delay} dana</td>
                                        <td>{s.max_limit_buffer_percent}%</td>
                                        <td>{s.currency_code}</td>
                                        <td>
                                            <button className="action-btn-mini" onClick={() => setEditingVcc(s)}>Uredi</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            )}

            {/* MANUAL ADD MODAL */}
            <AnimatePresence>
                {showAddModal && (
                    <div className="finance-modal-overlay">
                        <motion.div
                            className="finance-modal larger"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                        >
                            <button className="close-btn" onClick={() => setShowAddModal(false)} style={{ position: 'absolute', right: '20px', top: '20px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                <X size={24} />
                            </button>

                            <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Plus size={24} color="#10b981" /> Nova Obaveza (Manuelni unos)
                            </h2>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '14px' }}>
                                Koristite ovo za unos troškova van standardnih rezervacija ili dodatnih troškova.
                            </p>

                            <form onSubmit={handleSaveNewObligation}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
                                    <div className="form-group-v6">
                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '8px', opacity: 0.7 }}>Interna Oznaka / CIS</label>
                                        <input
                                            type="text"
                                            className="finance-search-input"
                                            style={{ width: '100%' }}
                                            placeholder="npr. CIS-AD-001 ili ostavite prazno"
                                            value={newOb.cis_code}
                                            onChange={e => setNewOb({ ...newOb, cis_code: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group-v6">
                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '8px', opacity: 0.7 }}>Dobavljač (iz baze)</label>
                                        <div style={{ position: 'relative' }}>
                                            <Building2 size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} />
                                            <select
                                                className="finance-search-input"
                                                style={{ width: '100%', paddingLeft: '40px' }}
                                                required
                                                value={newOb.supplier_id}
                                                onChange={e => {
                                                    const selected = allSuppliers.find(s => s.name === e.target.value);
                                                    setNewOb({ ...newOb, supplier_id: e.target.value, country_id: selected?.country });
                                                }}
                                            >
                                                <option value="">Izaberi dobavljača...</option>
                                                {allSuppliers.map(s => (
                                                    <option key={s.id} value={s.name}>{s.name} ({s.country})</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px', marginBottom: '24px' }}>
                                    <div className="form-group-v6">
                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '8px', opacity: 0.7 }}>Neto Iznos (Trošak)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            className="finance-search-input"
                                            style={{ width: '100%' }}
                                            required
                                            value={newOb.net_amount}
                                            onChange={e => setNewOb({ ...newOb, net_amount: parseFloat(e.target.value) })}
                                        />
                                    </div>
                                    <div className="form-group-v6">
                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '8px', opacity: 0.7 }}>Bruto Iznos (Prodajni)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            className="finance-search-input"
                                            style={{ width: '100%' }}
                                            value={newOb.gross_amount}
                                            onChange={e => setNewOb({ ...newOb, gross_amount: parseFloat(e.target.value) })}
                                        />
                                    </div>
                                    <div className="form-group-v6">
                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '8px', opacity: 0.7 }}>Valuta</label>
                                        <select
                                            className="finance-search-input"
                                            style={{ width: '100%' }}
                                            value={newOb.currency}
                                            onChange={e => setNewOb({ ...newOb, currency: e.target.value })}
                                        >
                                            <option value="EUR">EUR</option>
                                            <option value="RSD">RSD</option>
                                            <option value="USD">USD</option>
                                            <option value="BGN">BGN</option>
                                        </select>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
                                    <div className="form-group-v6">
                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '8px', opacity: 0.7 }}>Rok Plaćanja (Kalendar)</label>
                                        <div
                                            className="finance-search-input"
                                            style={{ width: '100%', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '10px' }}
                                            onClick={() => setShowStayCal(true)}
                                        >
                                            <Calendar size={16} />
                                            {newOb.payment_deadline ? new Date(newOb.payment_deadline).toLocaleDateString() : 'Izaberi datum...'}
                                        </div>
                                        {showStayCal && (
                                            <ModernCalendar
                                                startDate={newOb.payment_deadline || null}
                                                endDate={newOb.payment_deadline || null}
                                                singleMode={true}
                                                allowPast={true}
                                                onChange={(start) => setNewOb({ ...newOb, payment_deadline: start })}
                                                onClose={() => setShowStayCal(false)}
                                            />
                                        )}
                                    </div>
                                    <div className="form-group-v6">
                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '8px', opacity: 0.7 }}>Metod Plaćanja</label>
                                        <select
                                            className="finance-search-input"
                                            style={{ width: '100%' }}
                                            value={newOb.payment_method_preferred}
                                            onChange={e => setNewOb({ ...newOb, payment_method_preferred: e.target.value as any })}
                                        >
                                            <option value="bank">Bankarski prenos</option>
                                            <option value="vcc">Virtualna kartica (VCC)</option>
                                            <option value="cash">Gotovina</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="form-group-v6" style={{ marginBottom: '24px' }}>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '8px', opacity: 0.7 }}>Napomena</label>
                                    <textarea
                                        className="finance-search-input"
                                        style={{ width: '100%', minHeight: '100px', paddingTop: '10px', fontSize: '14px' }}
                                        placeholder="Dodatni detalji o ovom trošku..."
                                        value={newOb.notes}
                                        onChange={e => setNewOb({ ...newOb, notes: e.target.value })}
                                    />
                                </div>

                                <div className="form-actions-v6" style={{ marginTop: '40px', display: 'flex', gap: '16px' }}>
                                    <button
                                        type="button"
                                        className="action-btn"
                                        style={{ flex: 1, height: '48px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)' }}
                                        onClick={() => setShowAddModal(false)}
                                    >Odustani</button>
                                    <button
                                        type="submit"
                                        className="pay-btn"
                                        style={{ flex: 1, height: '48px', background: '#10b981', fontSize: '15px' }}
                                        disabled={isLoading}
                                    >
                                        {isLoading ? 'Čuvam...' : 'Snimi Obavezu'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            <AnimatePresence>
                {editingVcc && (
                    <div className="finance-modal-overlay">
                        <motion.div
                            className="finance-modal"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            style={{ maxWidth: '500px' }}
                        >
                            <button className="close-btn" onClick={() => setEditingVcc(null)} style={{ position: 'absolute', right: '20px', top: '20px', background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                <X size={24} />
                            </button>

                            <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Shield size={24} color="var(--accent)" /> VCC Postavke: {editingVcc.supplier_id}
                            </h2>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '14px' }}>
                                Konfiguracija automatizovanog plaćanja za dobavljača.
                            </p>

                            <form onSubmit={handleSaveVccSettings} className="vcc-edit-form">
                                <div className="form-group-v6" style={{ marginBottom: '20px' }}>
                                    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '8px', opacity: 0.7 }}>Automatsko Generisanje</label>
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <button
                                            type="button"
                                            className={`tab-switcher-btn ${editingVcc.auto_generate ? 'active' : ''}`}
                                            style={{ flex: 1, padding: '10px', borderRadius: '8px', border: editingVcc.auto_generate ? '1px solid var(--accent)' : '1px solid var(--border)', background: editingVcc.auto_generate ? 'rgba(0, 150, 255, 0.1)' : 'transparent', color: editingVcc.auto_generate ? 'var(--accent)' : 'var(--text-secondary)' }}
                                            onClick={() => setEditingVcc({ ...editingVcc, auto_generate: true })}
                                        >UKLJUČENO</button>
                                        <button
                                            type="button"
                                            className={`tab-switcher-btn ${!editingVcc.auto_generate ? 'active' : ''}`}
                                            style={{ flex: 1, padding: '10px', borderRadius: '8px', border: !editingVcc.auto_generate ? '1px solid #ef4444' : '1px solid var(--border)', background: !editingVcc.auto_generate ? 'rgba(239, 68, 68, 0.1)' : 'transparent', color: !editingVcc.auto_generate ? '#ef4444' : 'var(--text-secondary)' }}
                                            onClick={() => setEditingVcc({ ...editingVcc, auto_generate: false })}
                                        >ISKLJUČENO</button>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                                    <div className="form-group-v6">
                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '8px', opacity: 0.7 }}>Tip Kartice</label>
                                        <select
                                            value={editingVcc.vcc_type}
                                            onChange={e => setEditingVcc({ ...editingVcc, vcc_type: e.target.value as any })}
                                            className="finance-search-input"
                                            style={{ width: '100%' }}
                                        >
                                            <option value="Visa">Visa</option>
                                            <option value="Mastercard">Mastercard</option>
                                            <option value="AMEX">AMEX</option>
                                        </select>
                                    </div>
                                    <div className="form-group-v6">
                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '8px', opacity: 0.7 }}>Valuta Plaćanja</label>
                                        <input
                                            type="text"
                                            value={editingVcc.currency_code}
                                            onChange={e => setEditingVcc({ ...editingVcc, currency_code: e.target.value })}
                                            className="finance-search-input"
                                            style={{ width: '100%' }}
                                            placeholder="npr. EUR"
                                        />
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                                    <div className="form-group-v6">
                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '8px', opacity: 0.7 }}>Aktivacija (Kašnjenje)</label>
                                        <input
                                            type="number"
                                            value={editingVcc.activation_delay}
                                            onChange={e => setEditingVcc({ ...editingVcc, activation_delay: parseInt(e.target.value) })}
                                            className="finance-search-input"
                                            style={{ width: '100%' }}
                                        />
                                        <p style={{ fontSize: '10px', opacity: 0.5, marginTop: '4px' }}>Negativno = pre check-in dana</p>
                                    </div>
                                    <div className="form-group-v6">
                                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '8px', opacity: 0.7 }}>Buffer Limit (%)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={editingVcc.max_limit_buffer_percent}
                                            onChange={e => setEditingVcc({ ...editingVcc, max_limit_buffer_percent: parseFloat(e.target.value) })}
                                            className="finance-search-input"
                                            style={{ width: '100%' }}
                                        />
                                        <p style={{ fontSize: '10px', opacity: 0.5, marginTop: '4px' }}>Dodatna tolerancija za kurs</p>
                                    </div>
                                </div>

                                <div className="form-actions-v6" style={{ marginTop: '30px', display: 'flex', gap: '12px' }}>
                                    <button
                                        type="button"
                                        className="action-btn"
                                        style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)' }}
                                        onClick={() => setEditingVcc(null)}
                                    >Odustani</button>
                                    <button
                                        type="submit"
                                        className="pay-btn"
                                        style={{ flex: 1 }}
                                        disabled={isSavingVcc}
                                    >
                                        {isSavingVcc ? 'Čuvam...' : 'Sačuvaj Promene'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

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

                                    <div className="payment-type-selector">
                                        <div className={`payment-type-card ${paymentCategory === 'full' ? 'active' : ''}`} onClick={() => setPaymentCategory('full')}>
                                            <span>Puna isplata</span>
                                            <small>{formatFinanceAmount(selectedOb.net_amount - selectedOb.paid_amount, selectedOb.currency)}</small>
                                        </div>
                                        <div className={`payment-type-card ${paymentCategory === 'akontacija' ? 'active' : ''}`} onClick={() => setPaymentCategory('akontacija')}>
                                            <span>Akontacija</span>
                                            <small>Deo iznosa</small>
                                        </div>
                                        <div className={`payment-type-card ${paymentCategory === 'balance' ? 'active' : ''}`} onClick={() => setPaymentCategory('balance')}>
                                            <span>Do pune cene</span>
                                            <small>Ostatak duga</small>
                                        </div>
                                    </div>

                                    {paymentCategory === 'akontacija' && (
                                        <div style={{ marginBottom: '20px' }}>
                                            <label style={{ display: 'block', fontSize: '11px', marginBottom: '8px', opacity: 0.7 }}>Iznos akontacije ({selectedOb.currency}):</label>
                                            <input
                                                type="number"
                                                className="finance-search-input"
                                                style={{ width: '100%' }}
                                                value={partialAmount}
                                                onChange={(e) => setPartialAmount(parseFloat(e.target.value))}
                                            />
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
                                            <p>✨ <strong>VCC Optimizacija:</strong> Sistem će generisati karticu za <strong>{paymentCategory === 'full' ? 'preostali dug' : 'akontaciju'}</strong>.</p>
                                        ) : (
                                            <p>🏦 <strong>Uputstvo:</strong> Potvrdite uplatu nakon izvršenog prenosa. Referenca: {selectedOb.cis_code}.</p>
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
