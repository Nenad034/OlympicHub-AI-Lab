import React, { useState, useEffect } from 'react';
import {
    RefreshCw,
    ShieldCheck,
    TrendingUp,
    Globe,
    Clock,
    ArrowRight,
    Search,
    Download,
    History,
    Calendar,
    AlertCircle,
    CheckCircle2,
    ArrowLeftRight,
    Filter,
    DollarSign,
    Euro,
    Banknote,
    ArrowDown
} from 'lucide-react';
import { currencyManager } from '../utils/currencyManager';
import './FXService.css';

const FXService: React.FC = () => {
    const [rate, setRate] = useState<number>(currencyManager.getMidRate('EUR'));
    const [agencyRate, setAgencyRate] = useState<number>(currencyManager.getAgencyRate('EUR'));
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastUpdate, setLastUpdate] = useState<string>(new Date().toLocaleString('sr-RS'));
    const [conversionAmount, setConversionAmount] = useState<string>('100');
    const [showSuccess, setShowSuccess] = useState(false);

    // Filter states
    const [startDate, setStartDate] = useState<string>(
        new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    );
    const [endDate, setEndDate] = useState<string>(
        new Date().toISOString().split('T')[0]
    );

    // Currency & Type states
    const [selectedCurrency, setSelectedCurrency] = useState<'EUR' | 'USD' | 'GBP'>('EUR');
    const [rateType, setRateType] = useState<'mid' | 'buy' | 'sell'>('mid');

    const [historyList, setHistoryList] = useState<any[]>([]);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    const [fromCurrency, setFromCurrency] = useState<string>('EUR');
    const [toCurrency, setToCurrency] = useState<string>('RSD');

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await currencyManager.refreshRate();
        setRate(currencyManager.getMidRate('EUR'));
        setAgencyRate(currencyManager.getAgencyRate('EUR'));
        setLastUpdate(new Date().toLocaleString('sr-RS'));

        setIsRefreshing(false);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
    };

    const fetchHistory = async () => {
        setIsLoadingHistory(true);
        try {
            const results = await currencyManager.fetchHistoricalRates(startDate, endDate, selectedCurrency);
            const formatted = Object.entries(results)
                .sort((a, b) => b[0].localeCompare(a[0]))
                .map(([date, midValue]) => {
                    const rates = currencyManager.calculatePublicRates(midValue);
                    return {
                        date: date.split('-').reverse().join('.'),
                        rate: rateType === 'mid' ? rates.mid : (rateType === 'buy' ? rates.buy : rates.sell),
                    };
                });

            setHistoryList(formatted);
        } catch (err) {
            console.error('Failed to fetch history', err);
        } finally {
            setIsLoadingHistory(false);
        }
    };

    useEffect(() => {
        fetchHistory();
    }, [selectedCurrency, rateType, startDate, endDate]);

    const handleSwap = () => {
        const temp = fromCurrency;
        setFromCurrency(toCurrency);
        setToCurrency(temp);
    };

    const convertedAmountValue = currencyManager.convert(Number(conversionAmount), fromCurrency, toCurrency);

    return (
        <div className="fx-service-container">
            <div className="fx-header">
                <div className="fx-title-area">
                    <div className="fx-icon-wrapper">
                        <RefreshCw size={28} className={isRefreshing ? 'animate-spin' : ''} />
                    </div>
                    <div>
                        <h1>Kursna Lista i Finansijski Štit</h1>
                        <p>Centralizovano upravljanje deviznim kursevima i zaštita od tržišnih oscilacija.</p>
                    </div>
                </div>
                <button
                    className={`refresh-btn ${isRefreshing ? 'loading' : ''}`}
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                >
                    <RefreshCw size={18} />
                    {isRefreshing ? 'Ažuriranje...' : 'Osveži Kurs (NBS)'}
                </button>
            </div>

            <div className="fx-grid">
                {/* Current Rates Card */}
                <div className="fx-card main-rate-card animate-slide-up">
                    <div className="card-header">
                        <Globe size={20} />
                        <h3>Trenutni Kurs EUR/RSD</h3>
                        <span className="status-badge live">SREDNJI KURS</span>
                    </div>

                    <div className="rate-display">
                        <div className="rate-value">
                            <span className="currency-unit">1 EUR =</span>
                            <span className="rate-number">{rate.toFixed(4)}</span>
                            <span className="currency-target">RSD</span>
                        </div>
                        <div className="rate-trend up">
                            <TrendingUp size={16} />
                            <span>Srednji kurs NBS</span>
                        </div>
                    </div>

                    <div className="rate-meta">
                        <div className="meta-item">
                            <Clock size={14} />
                            <span>Poslednje ažuriranje: {lastUpdate}</span>
                        </div>
                        <div className="meta-item">
                            <Search size={14} />
                            <span>Izvor: Frankfurter API / NBS Sync</span>
                        </div>
                    </div>
                </div>

                {/* Financial Shield Card */}
                <div className="fx-card shield-card animate-slide-up" style={{ animationDelay: '0.1s' }}>
                    <div className="card-header">
                        <ShieldCheck size={20} color="#10b981" />
                        <h3>Financial Shield (Zaštitni Kurs)</h3>
                        <span className="status-badge secure">PROTECTED</span>
                    </div>

                    <div className="rate-display">
                        <div className="rate-value secure">
                            <span className="currency-unit">1 EUR =</span>
                            <span className="rate-number">{agencyRate.toFixed(4)}</span>
                            <span className="currency-target">RSD</span>
                        </div>
                        <div className="shield-spread">
                            <span className="spread-label">Spread (Zaštitna Margina):</span>
                            <span className="spread-value">+0.50%</span>
                        </div>
                    </div>

                    <div className="shield-info">
                        <AlertCircle size={16} />
                        <p>Ovaj kurs se koristi za sve prodajne cene u aplikaciji kako bi se agencija zaštitila od gubitaka pri konverziji.</p>
                    </div>
                </div>

                <div className="fx-card convert-card animate-slide-up" style={{ animationDelay: '0.2s' }}>
                    <div className="card-header">
                        <RefreshCw size={20} />
                        <h3>Brza Konverzija</h3>
                        <div className="currency-choice-tags">
                            {['EUR', 'USD', 'GBP'].map(curr => (
                                <button
                                    key={curr}
                                    className={`fx-mini-tag ${fromCurrency === curr ? 'active' : ''}`}
                                    onClick={() => {
                                        setFromCurrency(curr);
                                        setToCurrency('RSD');
                                    }}
                                >
                                    {curr}
                                </button>
                            ))}
                        </div>
                        <button
                            className="swap-direction-btn"
                            onClick={handleSwap}
                            title="Promeni smer konverzije"
                            style={{ marginLeft: '10px' }}
                        >
                            <ArrowLeftRight size={16} />
                        </button>
                    </div>

                    <div className="converter-tool">
                        <div className="input-with-select">
                            <div className="input-group">
                                <label>Iz valute</label>
                                <div className="currency-select-box">
                                    <input
                                        type="number"
                                        value={conversionAmount}
                                        onChange={(e) => setConversionAmount(e.target.value)}
                                    />
                                    <select
                                        value={fromCurrency}
                                        onChange={(e) => setFromCurrency(e.target.value)}
                                        className="inline-currency-select"
                                    >
                                        <option value="RSD">RSD</option>
                                        <option value="EUR">EUR</option>
                                        <option value="USD">USD</option>
                                        <option value="GBP">GBP</option>
                                    </select>
                                </div>
                            </div>

                            <div className="convert-arrow">
                                <ArrowDown size={18} style={{ opacity: 0.4 }} />
                            </div>

                            <div className="result-group">
                                <label>U valutu</label>
                                <div className="result-with-select">
                                    <div className="result-value">
                                        {currencyManager.formatCurrency(convertedAmountValue, toCurrency)}
                                    </div>
                                    <select
                                        value={toCurrency}
                                        onChange={(e) => setToCurrency(e.target.value)}
                                        className="inline-currency-select"
                                    >
                                        <option value="RSD">RSD</option>
                                        <option value="EUR">EUR</option>
                                        <option value="USD">USD</option>
                                        <option value="GBP">GBP</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>


            <div className="fx-bottom-grid">
                {/* History Table */}
                <div className="fx-card history-card animate-slide-up" style={{ animationDelay: '0.3s' }}>
                    <div className="card-header" style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <History size={20} />
                                <h3>Istorijski Pregled Kursa</h3>
                            </div>

                            <div className="fx-filters" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                <div className="date-input-group">
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="fx-date-picker"
                                    />
                                </div>
                                <div className="date-input-group">
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="fx-date-picker"
                                    />
                                </div>
                                <button className="filter-apply-btn-v2" onClick={fetchHistory} title="Osveži rezultate">
                                    <RefreshCw size={14} className={isLoadingHistory ? 'animate-spin' : ''} />
                                </button>
                            </div>
                        </div>

                        <div className="fx-switcher-tags" style={{ display: 'flex', gap: '20px', width: '100%', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '15px' }}>
                            {/* Currency Tabs */}
                            <div className="tag-group">
                                <span className="tag-group-label text-xs uppercase font-bold text-slate-500 mb-2 block">Valuta:</span>
                                <div className="tag-list" style={{ display: 'flex', gap: '8px' }}>
                                    {[
                                        { id: 'EUR', icon: Euro },
                                        { id: 'USD', icon: DollarSign },
                                        { id: 'GBP', icon: Banknote }
                                    ].map(curr => (
                                        <button
                                            key={curr.id}
                                            className={`fx-tag ${selectedCurrency === curr.id ? 'active' : ''}`}
                                            onClick={() => setSelectedCurrency(curr.id as any)}
                                        >
                                            <curr.icon size={13} />
                                            {curr.id}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Rate Type Tabs */}
                            <div className="tag-group" style={{ marginLeft: 'auto' }}>
                                <span className="tag-group-label text-xs uppercase font-bold text-slate-500 mb-2 block" style={{ textAlign: 'right' }}>Tip Kursa:</span>
                                <div className="tag-list" style={{ display: 'flex', gap: '8px' }}>
                                    {[
                                        { id: 'buy', label: 'Kupovni' },
                                        { id: 'mid', label: 'Srednji' },
                                        { id: 'sell', label: 'Prodajni' }
                                    ].map(type => (
                                        <button
                                            key={type.id}
                                            className={`fx-tag ${rateType === type.id ? 'active' : ''} type-${type.id}`}
                                            onClick={() => setRateType(type.id as any)}
                                        >
                                            {type.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="history-table">
                        <div className="table-row header">
                            <span>Datum</span>
                            <span>Iznos ({selectedCurrency}/RSD)</span>
                            <span>Tip</span>
                            <span>Status</span>
                        </div>
                        {isLoadingHistory ? (
                            <div style={{ padding: '60px', textAlign: 'center', color: '#94a3b8' }}>
                                <div className="processing-spinner" style={{ margin: '0 auto 15px' }}></div>
                                <p>Preuzimanje kursne liste...</p>
                            </div>
                        ) : historyList.length > 0 ? (
                            historyList.map((item, idx) => (
                                <div className="table-row" key={idx}>
                                    <span className="date-cell"><Calendar size={14} /> {item.date}</span>
                                    <span className="rate-cell" style={{
                                        fontWeight: 800,
                                        color: rateType === 'buy' ? '#10b981' : (rateType === 'sell' ? '#ef4444' : '#f8fafc'),
                                        fontSize: '16px'
                                    }}>
                                        {item.rate.toFixed(4)} RSD
                                    </span>
                                    <span className="type-cell">
                                        <span className={`type-badge ${rateType}`}>
                                            {rateType.toUpperCase()}
                                        </span>
                                    </span>
                                    <span className="status-cell"><CheckCircle2 size={14} color="#10b981" /> Arhivirano</span>
                                </div>
                            ))
                        ) : (
                            <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                                <AlertCircle size={24} style={{ margin: '0 auto 10px' }} />
                                <p>Nema dostupnih podataka za ovaj period.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Export/Stats Card */}
                <div className="fx-card stats-card animate-slide-up" style={{ animationDelay: '0.4s' }}>
                    <div className="card-header">
                        <TrendingUp size={20} />
                        <h3>Statistika i Period</h3>
                    </div>

                    <div className="stats-content">
                        <div className="stat-row">
                            <span>Relativna stabilnost:</span>
                            <span style={{ color: '#10b981' }}>Visoka (0.02% var)</span>
                        </div>
                        <div className="stat-row">
                            <span>Period praćenja:</span>
                            <span>10 dana</span>
                        </div>

                        <div className="info-box" style={{ marginTop: '20px' }}>
                            <h4>Automatizacija</h4>
                            <p>Sistem automatski usklađuje prodajne cene čim NBS objavi novu zvaničnu listu svakog radnog dana oko 14:00h.</p>
                        </div>

                        <button className="action-btn" style={{ marginTop: '20px', width: '100%', justifyContent: 'center', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                            <Download size={16} /> Preuzmi CSV Arhivu
                        </button>
                    </div>
                </div>
            </div>

            {showSuccess && (
                <div className="fx-toast animate-fade-in-up">
                    <CheckCircle2 size={20} />
                    <span>Sistem je sinhronizovan!</span>
                </div>
            )}
        </div>
    );
};

export default FXService;
