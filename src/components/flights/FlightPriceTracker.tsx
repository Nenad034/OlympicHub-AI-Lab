import React, { useState, useEffect, useCallback } from 'react';
import {
  Bell, BellOff, TrendingDown, TrendingUp, Minus, Plus,
  Trash2, RefreshCw, Eye, EyeOff, Calendar, BarChart3,
  ChevronDown, ChevronUp, X, Check, AlertCircle, Loader2
} from 'lucide-react';
import {
  getWatches, addWatch, removeWatch, toggleWatch, checkWatches,
  getItineraryPriceMetrics, getCheapestDates,
  type FlightWatch, type ItineraryPriceMetricsResult, type CheapestDateResult,
} from '../../integrations/amadeus/flightPriceTrackerService';

interface FlightPriceTrackerProps {
  /** Pre-fill from the flight search form */
  prefill?: {
    origin: string;
    destination: string;
    departureDate: string;
    returnDate?: string;
    currentPrice?: number;
  };
  className?: string;
}

// ── Tiny mini-chart bar ────────────────────────────────────────
const SparkBar: React.FC<{ history: { date: string; price: number }[] }> = ({ history }) => {
  if (history.length < 2) return null;
  const max = Math.max(...history.map(h => h.price));
  const min = Math.min(...history.map(h => h.price));
  const range = max - min || 1;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 1, height: 20, width: 60 }}>
      {history.slice(-10).map((h, i) => (
        <div key={i} style={{
          flex: 1,
          background: h.price <= min * 1.05 ? 'var(--ssv3-green)' : h.price >= max * 0.95 ? 'var(--ssv3-red)' : 'var(--ssv3-purple)',
          height: `${((h.price - min) / range) * 80 + 20}%`,
          borderRadius: '1px 1px 0 0',
          opacity: 0.8
        }}/>
      ))}
    </div>
  );
};

// ── Price Gauge ────────────────────────────────────────────────
const PriceGauge: React.FC<{ metrics: ItineraryPriceMetricsResult; currentPrice?: number }> = ({ metrics, currentPrice }) => {
  const min = parseFloat(metrics.priceMetrics.find(m => m.quartileRanking === 'MINIMUM')?.amount || '0');
  const q1  = parseFloat(metrics.priceMetrics.find(m => m.quartileRanking === 'FIRST')?.amount || '0');
  const med = parseFloat(metrics.priceMetrics.find(m => m.quartileRanking === 'MEDIUM')?.amount || '0');
  const q3  = parseFloat(metrics.priceMetrics.find(m => m.quartileRanking === 'THIRD')?.amount || '0');
  const max = parseFloat(metrics.priceMetrics.find(m => m.quartileRanking === 'MAXIMUM')?.amount || '0');
  const range = max - min || 1;

  const pct = (v: number) => `${Math.min(100, Math.max(0, ((v - min) / range) * 100)).toFixed(0)}%`;

  let rating: 'EXCELLENT' | 'GOOD' | 'AVERAGE' | 'EXPENSIVE';
  let ratingColor: string;
  if (!currentPrice || currentPrice <= q1) { rating = 'EXCELLENT'; ratingColor = 'var(--ssv3-green)'; }
  else if (currentPrice <= med) { rating = 'GOOD'; ratingColor = '#4ade80'; }
  else if (currentPrice <= q3) { rating = 'AVERAGE'; ratingColor = 'var(--ssv3-amber)'; }
  else { rating = 'EXPENSIVE'; ratingColor = 'var(--ssv3-red)'; }

  return (
    <div style={{ padding: '10px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--ssv3-text-sec)', marginBottom: 4 }}>
        <span>Min: €{Math.round(min)}</span>
        <span>Prosek: €{Math.round(med)}</span>
        <span>Max: €{Math.round(max)}</span>
      </div>

      {/* Gauge track */}
      <div style={{ position: 'relative', height: 10, borderRadius: 5, overflow: 'hidden', background: 'var(--ssv3-border)' }}>
        {/* Gradient fill */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to right, #10B981 0%, #4ade80 25%, #F59E0B 50%, #f97316 75%, #EF4444 100%)',
          opacity: 0.4
        }}/>
        {/* Quartile markers */}
        {[q1, med, q3].map((v, i) => (
          <div key={i} style={{
            position: 'absolute', top: 0, bottom: 0, width: 1, background: 'rgba(255,255,255,0.4)',
            left: pct(v)
          }}/>
        ))}
        {/* Current price marker */}
        {currentPrice && (
          <div style={{
            position: 'absolute', top: -3, bottom: -3, width: 3, borderRadius: 2,
            background: ratingColor, left: pct(currentPrice), transition: 'left 0.3s'
          }}/>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
        {currentPrice && (
          <span style={{ fontSize: 11, fontWeight: 800, color: ratingColor }}>
            {rating === 'EXCELLENT' ? '🎯' : rating === 'GOOD' ? '✅' : rating === 'AVERAGE' ? '⚠️' : '🔴'} {rating}
          </span>
        )}
        <span style={{ fontSize: 10, color: 'var(--ssv3-text-sec)' }}>u poređenju sa istorijskim cenama</span>
      </div>
    </div>
  );
};

// ── Main Component ─────────────────────────────────────────────
export const FlightPriceTracker: React.FC<FlightPriceTrackerProps> = ({ prefill, className }) => {
  const [watches, setWatches] = useState<FlightWatch[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'watches' | 'analysis' | 'calendar'>('watches');
  const [checking, setChecking] = useState(false);
  const [lastCheckTime, setLastCheckTime] = useState<string | null>(null);

  // Analysis state
  const [anaOrigin, setAnaOrigin] = useState(prefill?.origin || 'BEG');
  const [anaDest, setAnaDest] = useState(prefill?.destination || 'TIV');
  const [anaDate, setAnaDate] = useState(prefill?.departureDate || '2025-06-15');
  const [anaOneWay, setAnaOneWay] = useState(false);
  const [anaLoading, setAnaLoading] = useState(false);
  const [anaResult, setAnaResult] = useState<ItineraryPriceMetricsResult | null>(null);

  // Calendar state
  const [calLoading, setCalLoading] = useState(false);
  const [calDates, setCalDates] = useState<CheapestDateResult[]>([]);
  const [calOrigin, setCalOrigin] = useState(prefill?.origin || 'BEG');
  const [calDest, setCalDest] = useState(prefill?.destination || 'TIV');

  // Add watch form
  const [showAddForm, setShowAddForm] = useState(false);
  const [watchOrigin, setWatchOrigin] = useState(prefill?.origin || '');
  const [watchDest, setWatchDest] = useState(prefill?.destination || '');
  const [watchDep, setWatchDep] = useState(prefill?.departureDate || '');
  const [watchRet, setWatchRet] = useState(prefill?.returnDate || '');
  const [targetPrice, setTargetPrice] = useState(prefill?.currentPrice ? String(Math.round(prefill.currentPrice * 0.9)) : '');
  const [currentPrice, setCurrentPrice] = useState(prefill?.currentPrice ? String(Math.round(prefill.currentPrice)) : '');

  useEffect(() => { setWatches(getWatches()); }, []);

  // Prefill update
  useEffect(() => {
    if (prefill) {
      setWatchOrigin(prefill.origin || '');
      setWatchDest(prefill.destination || '');
      setWatchDep(prefill.departureDate || '');
      setWatchRet(prefill.returnDate || '');
      if (prefill.currentPrice) setCurrentPrice(String(Math.round(prefill.currentPrice)));
      setAnaOrigin(prefill.origin || 'BEG');
      setAnaDest(prefill.destination || 'TIV');
      setAnaDate(prefill.departureDate || '2025-06-15');
      setCalOrigin(prefill.origin || 'BEG');
      setCalDest(prefill.destination || 'TIV');
    }
  }, [JSON.stringify(prefill)]);

  const handleCheckAll = async () => {
    setChecking(true);
    await checkWatches();
    setWatches(getWatches());
    setLastCheckTime(new Date().toLocaleTimeString());
    setChecking(false);
  };

  const handleAddWatch = () => {
    if (!watchOrigin || !watchDest || !watchDep) return;
    addWatch({
      origin: watchOrigin.toUpperCase(),
      destination: watchDest.toUpperCase(),
      departureDate: watchDep,
      returnDate: watchRet || undefined,
      targetPrice: parseFloat(targetPrice) || 0,
      currentPrice: parseFloat(currentPrice) || 0,
      currency: 'EUR',
    });
    setWatches(getWatches());
    setShowAddForm(false);
  };

  const handleAnalysis = async () => {
    setAnaLoading(true);
    const results = await getItineraryPriceMetrics(anaOrigin, anaDest, anaDate, { oneWay: anaOneWay, currencyCode: 'EUR' });
    setAnaResult(results[0] || null);
    setAnaLoading(false);
  };

  const handleCalendar = async () => {
    setCalLoading(true);
    const results = await getCheapestDates(calOrigin, calDest, { viewBy: 'DATE' });
    setCalDates(results);
    setCalLoading(false);
  };

  // Min price from calendar data
  const calMin = calDates.length ? Math.min(...calDates.map(d => parseFloat(d.price.total))) : 0;
  const calMax = calDates.length ? Math.max(...calDates.map(d => parseFloat(d.price.total))) : 1;

  const priceColor = (price: number) => {
    const pct = (price - calMin) / (calMax - calMin || 1);
    if (pct < 0.3) return 'var(--ssv3-green)';
    if (pct < 0.6) return 'var(--ssv3-amber)';
    return 'var(--ssv3-red)';
  };

  return (
    <div className={`ssv3-tracker ${className || ''}`}>
      {/* Header */}
      <div className="ssv3-tracker-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Bell size={16} color="var(--ssv3-purple)"/>
          <span className="ssv3-tracker-title">Praćenje cena letova</span>
          {watches.filter(w => w.active).length > 0 && (
            <span className="ssv3-tracker-badge">{watches.filter(w => w.active).length}</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button className="ssv3-icon-btn" onClick={handleCheckAll} disabled={checking} title="Osveži sve cene">
            <RefreshCw size={13} className={checking ? 'ssv3-spin' : ''}/>
          </button>
          <button className="ssv3-btn-primary" style={{ height: 28, padding: '0 12px', fontSize: 11 }} onClick={() => setShowAddForm(true)}>
            <Plus size={12}/> Dodaj alarm
          </button>
        </div>
      </div>

      {lastCheckTime && (
        <div style={{ fontSize: 10, color: 'var(--ssv3-text-muted)', padding: '2px 14px' }}>
          Poslednja provera: {lastCheckTime}
        </div>
      )}

      {/* Tab navigation */}
      <div className="ssv3-tracker-tabs">
        {([
          { id: 'watches', label: '🔔 Alarmovi' },
          { id: 'analysis', label: '📊 Analiza cena' },
          { id: 'calendar', label: '📅 Najjeftiniji datumi' },
        ] as { id: typeof activeTab; label: string }[]).map(t => (
          <button key={t.id} className={`ssv3-tracker-tab ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── WATCHES TAB ──────────────────────────────────────── */}
      {activeTab === 'watches' && (
        <div className="ssv3-tracker-body">
          {watches.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 20px', color: 'var(--ssv3-text-sec)' }}>
              <Bell size={32} style={{ margin: '0 auto 12px', opacity: 0.3, display: 'block' }}/>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Nema aktivnih alarma</div>
              <div style={{ fontSize: 11, opacity: 0.7 }}>Kliknite "+ Dodaj alarm" da pratite cene za željenu rutu</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '8px 10px' }}>
              {watches.map(w => {
                const priceDiff = w.currentPrice - (w.priceHistory[w.priceHistory.length - 2]?.price || w.currentPrice);
                const diffPct = w.currentPrice > 0 ? (priceDiff / w.currentPrice * 100) : 0;
                const belowTarget = w.currentPrice <= w.targetPrice && w.targetPrice > 0;
                return (
                  <div key={w.id} className={`ssv3-watch-card ${!w.active ? 'inactive' : ''} ${belowTarget ? 'target-hit' : ''}`}>
                    <div className="ssv3-watch-main" onClick={() => setExpanded(expanded === w.id ? null : w.id)}>
                      {/* Route */}
                      <div className="ssv3-watch-route">
                        <span className="ssv3-watch-iata">{w.origin}</span>
                        <span style={{ fontSize: 10, color: 'var(--ssv3-text-muted)' }}>{'→'}</span>
                        <span className="ssv3-watch-iata">{w.destination}</span>
                      </div>

                      {/* Date */}
                      <div style={{ fontSize: 10, color: 'var(--ssv3-text-sec)' }}>
                        {w.departureDate}{w.returnDate ? ` – ${w.returnDate}` : ''}
                      </div>

                      {/* Sparkbar */}
                      <SparkBar history={w.priceHistory}/>

                      {/* Price */}
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 15, fontWeight: 800, color: belowTarget ? 'var(--ssv3-green)' : 'var(--ssv3-text)' }}>
                          €{Math.round(w.currentPrice)}
                        </div>
                        {priceDiff !== 0 && (
                          <div style={{ fontSize: 10, display: 'flex', alignItems: 'center', gap: 2, justifyContent: 'flex-end',
                            color: priceDiff < 0 ? 'var(--ssv3-green)' : 'var(--ssv3-red)' }}>
                            {priceDiff < 0 ? <TrendingDown size={10}/> : <TrendingUp size={10}/>}
                            {Math.abs(diffPct).toFixed(1)}%
                          </div>
                        )}
                        {w.targetPrice > 0 && (
                          <div style={{ fontSize: 9, color: 'var(--ssv3-text-muted)' }}>Cilj: €{Math.round(w.targetPrice)}</div>
                        )}
                      </div>

                      {/* Status */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        {belowTarget && (
                          <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--ssv3-green)', background: 'rgba(16,185,129,0.15)', padding: '1px 6px', borderRadius: 3 }}>
                            🎯 CENA DOSTIGNUTA
                          </span>
                        )}
                        <div style={{ display: 'flex', gap: 3 }}>
                          <button className="ssv3-icon-btn" style={{ width: 24, height: 24 }} onClick={e => { e.stopPropagation(); toggleWatch(w.id); setWatches(getWatches()); }}>
                            {w.active ? <Eye size={11}/> : <EyeOff size={11}/>}
                          </button>
                          <button className="ssv3-icon-btn" style={{ width: 24, height: 24, borderColor: 'var(--ssv3-red)', color: 'var(--ssv3-red)' }}
                            onClick={e => { e.stopPropagation(); removeWatch(w.id); setWatches(getWatches()); }}>
                            <Trash2 size={11}/>
                          </button>
                        </div>
                      </div>

                      <ChevronDown size={12} style={{ color: 'var(--ssv3-text-muted)', transition: '0.2s', transform: expanded === w.id ? 'rotate(180deg)' : 'none' }}/>
                    </div>

                    {/* Expanded: price history + settings */}
                    {expanded === w.id && (
                      <div className="ssv3-watch-details">
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                          <div>
                            <div style={{ fontSize: 9, color: 'var(--ssv3-text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Istorija cena ({w.priceHistory.length} dana)</div>
                            {w.priceHistory.slice(-5).reverse().map((h, i) => (
                              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, padding: '1px 0', borderBottom: '1px solid var(--ssv3-border-soft)' }}>
                                <span style={{ color: 'var(--ssv3-text-sec)' }}>{h.date}</span>
                                <span style={{ fontWeight: 600 }}>€{Math.round(h.price)}</span>
                              </div>
                            ))}
                          </div>
                          <div>
                            <div style={{ fontSize: 9, color: 'var(--ssv3-text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Podešavanja alarma</div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, marginBottom: 4, cursor: 'pointer' }}>
                              <input type="checkbox" checked={w.notifyOnDrop} onChange={() => { w.notifyOnDrop = !w.notifyOnDrop; setWatches([...watches]); }}/>
                              Obavesti kad cena padne
                            </label>
                            <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, cursor: 'pointer' }}>
                              <input type="checkbox" checked={w.notifyOnRise} onChange={() => { w.notifyOnRise = !w.notifyOnRise; setWatches([...watches]); }}/>
                              Obavesti kad cena raste
                            </label>
                            <div style={{ marginTop: 6, fontSize: 10, color: 'var(--ssv3-text-muted)' }}>
                              Poslednja provjera: {new Date(w.lastChecked).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── ANALYSIS TAB ─────────────────────────────────────── */}
      {activeTab === 'analysis' && (
        <div className="ssv3-tracker-body" style={{ padding: 10 }}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div>
              <div style={{ fontSize: 9, color: 'var(--ssv3-text-muted)', marginBottom: 2 }}>POLAZAK</div>
              <input className="ssv3-tracker-input" value={anaOrigin} onChange={e => setAnaOrigin(e.target.value.toUpperCase())} placeholder="BEG" maxLength={3}/>
            </div>
            <div>
              <div style={{ fontSize: 9, color: 'var(--ssv3-text-muted)', marginBottom: 2 }}>ODREDIŠTE</div>
              <input className="ssv3-tracker-input" value={anaDest} onChange={e => setAnaDest(e.target.value.toUpperCase())} placeholder="TIV" maxLength={3}/>
            </div>
            <div>
              <div style={{ fontSize: 9, color: 'var(--ssv3-text-muted)', marginBottom: 2 }}>DATUM POLASKA</div>
              <input className="ssv3-tracker-input" type="date" value={anaDate} onChange={e => setAnaDate(e.target.value)} style={{ width: 130 }}/>
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, cursor: 'pointer', marginBottom: 1 }}>
              <input type="checkbox" checked={anaOneWay} onChange={e => setAnaOneWay(e.target.checked)}/> Jednosmerna
            </label>
            <button className="ssv3-btn-primary" style={{ height: 28, padding: '0 12px', fontSize: 11, marginBottom: 1 }} onClick={handleAnalysis} disabled={anaLoading}>
              {anaLoading ? <Loader2 size={12} className="ssv3-spin"/> : <BarChart3 size={12}/>} Analiziraj
            </button>
          </div>

          {!anaResult && !anaLoading && (
            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--ssv3-text-sec)', fontSize: 11 }}>
              <BarChart3 size={28} style={{ margin: '0 auto 8px', opacity: 0.3, display: 'block' }}/>
              Unesite rutu i datum za analizu istorijskih cena
            </div>
          )}

          {anaLoading && (
            <div style={{ textAlign: 'center', padding: 20 }}>
              <Loader2 size={24} className="ssv3-spin" style={{ margin: '0 auto', display: 'block', color: 'var(--ssv3-purple)' }}/>
              <div style={{ fontSize: 11, color: 'var(--ssv3-text-sec)', marginTop: 8 }}>Dohvatam istorijske podatke...</div>
            </div>
          )}

          {anaResult && !anaLoading && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <div style={{ fontSize: 12, fontWeight: 700 }}>
                  {anaResult.origin} → {anaResult.destination} — {anaResult.departureDate}
                </div>
                <span style={{ fontSize: 10, color: 'var(--ssv3-text-sec)' }}>{anaResult.currencyCode} · {anaResult.oneWay ? 'Jednosmerna' : 'Povratna'}</span>
              </div>

              <PriceGauge metrics={anaResult} currentPrice={prefill?.currentPrice}/>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4, marginTop: 10 }}>
                {anaResult.priceMetrics.map(m => {
                  const labels: Record<string, string> = {
                    MINIMUM: 'Minimum', FIRST: 'Q1 (25%)', MEDIUM: 'Medijana', THIRD: 'Q3 (75%)', MAXIMUM: 'Maksimum'
                  };
                  const colors: Record<string, string> = {
                    MINIMUM: 'var(--ssv3-green)', FIRST: '#4ade80', MEDIUM: 'var(--ssv3-amber)', THIRD: '#f97316', MAXIMUM: 'var(--ssv3-red)'
                  };
                  return (
                    <div key={m.quartileRanking} style={{
                      background: 'var(--ssv3-card)', border: '1px solid var(--ssv3-border)',
                      borderRadius: 4, padding: '6px 8px', textAlign: 'center'
                    }}>
                      <div style={{ fontSize: 9, color: 'var(--ssv3-text-muted)', marginBottom: 2 }}>{labels[m.quartileRanking]}</div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: colors[m.quartileRanking] }}>
                        €{Math.round(parseFloat(m.amount))}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ marginTop: 10, padding: '6px 10px', background: 'var(--ssv3-purple-soft)', borderRadius: 4, fontSize: 11 }}>
                💡 <strong>Preporuka:</strong> {
                  prefill?.currentPrice && prefill.currentPrice <= parseFloat(anaResult.priceMetrics.find(m => m.quartileRanking === 'FIRST')?.amount || '0')
                    ? '🎯 Odlična cena! Rezervišite odmah.'
                    : prefill?.currentPrice && prefill.currentPrice <= parseFloat(anaResult.priceMetrics.find(m => m.quartileRanking === 'MEDIUM')?.amount || '0')
                    ? '✅ Dobra cena, ispod proseka.'
                    : 'Pratite cenu — postavljanjem alarma ćemo vas obavestiti kad padne.'
                }
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── CALENDAR TAB ─────────────────────────────────────── */}
      {activeTab === 'calendar' && (
        <div className="ssv3-tracker-body" style={{ padding: 10 }}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div>
              <div style={{ fontSize: 9, color: 'var(--ssv3-text-muted)', marginBottom: 2 }}>POLAZAK</div>
              <input className="ssv3-tracker-input" value={calOrigin} onChange={e => setCalOrigin(e.target.value.toUpperCase())} placeholder="BEG" maxLength={3}/>
            </div>
            <div>
              <div style={{ fontSize: 9, color: 'var(--ssv3-text-muted)', marginBottom: 2 }}>ODREDIŠTE</div>
              <input className="ssv3-tracker-input" value={calDest} onChange={e => setCalDest(e.target.value.toUpperCase())} placeholder="TIV" maxLength={3}/>
            </div>
            <button className="ssv3-btn-primary" style={{ height: 28, padding: '0 12px', fontSize: 11, marginBottom: 1 }} onClick={handleCalendar} disabled={calLoading}>
              {calLoading ? <Loader2 size={12} className="ssv3-spin"/> : <Calendar size={12}/>} Prikaži datume
            </button>
          </div>

          {calDates.length === 0 && !calLoading && (
            <div style={{ textAlign: 'center', padding: 20, color: 'var(--ssv3-text-sec)', fontSize: 11 }}>
              <Calendar size={28} style={{ margin: '0 auto 8px', opacity: 0.3, display: 'block' }}/>
              Pronađite najjeftinije datume za polazak
            </div>
          )}

          {calLoading && (
            <div style={{ textAlign: 'center', padding: 20 }}>
              <Loader2 size={24} className="ssv3-spin" style={{ margin: '0 auto', display: 'block', color: 'var(--ssv3-purple)' }}/>
              <div style={{ fontSize: 11, color: 'var(--ssv3-text-sec)', marginTop: 8 }}>Dohvatam najjeftinije datume...</div>
            </div>
          )}

          {calDates.length > 0 && !calLoading && (
            <>
              <div style={{ fontSize: 10, color: 'var(--ssv3-text-sec)', marginBottom: 8 }}>
                Prikazano {calDates.length} datuma · {calOrigin} → {calDest} · Povratno
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 4 }}>
                {calDates.slice(0, 30).map(d => {
                  const price = parseFloat(d.price.total);
                  const isMin = price <= calMin * 1.05;
                  return (
                    <button key={d.departureDate} className="ssv3-cal-date-btn" style={{ borderColor: isMin ? 'var(--ssv3-green)' : 'var(--ssv3-border)' }}
                      onClick={() => addWatch({ origin: calOrigin, destination: calDest, departureDate: d.departureDate, returnDate: d.returnDate, targetPrice: price * 0.95, currentPrice: price, currency: 'EUR' }) && setWatches(getWatches())}>
                      <div style={{ fontSize: 9, color: 'var(--ssv3-text-sec)' }}>
                        {new Date(d.departureDate).toLocaleDateString('sr', { day: 'numeric', month: 'short' })}
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: priceColor(price) }}>€{Math.round(price)}</div>
                      {isMin && <div style={{ fontSize: 8, color: 'var(--ssv3-green)', fontWeight: 700 }}>BEST</div>}
                    </button>
                  );
                })}
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 10, fontSize: 10, color: 'var(--ssv3-text-sec)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--ssv3-green)', display: 'inline-block' }}/> Jeftino</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--ssv3-amber)', display: 'inline-block' }}/> Prosek</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--ssv3-red)', display: 'inline-block' }}/> Skupo</span>
                <span style={{ marginLeft: 'auto' }}>Kliknite datum za brzo praćenje 🔔</span>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── ADD WATCH MODAL ───────────────────────────────────── */}
      {showAddForm && (
        <div className="ssv3-modal-overlay" style={{ zIndex: 9999 }}>
          <div className="ssv3-modal" style={{ maxWidth: 420 }}>
            <div className="ssv3-modal-header">
              <div className="ssv3-modal-hotel-name" style={{ fontSize: 14 }}>🔔 Novi alarm cene leta</div>
              <button className="ssv3-modal-close" onClick={() => setShowAddForm(false)}><X size={16}/></button>
            </div>
            <div className="ssv3-modal-body" style={{ padding: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--ssv3-text-sec)', marginBottom: 3 }}>Polazište (IATA)</div>
                  <input className="ssv3-filter-input" value={watchOrigin} onChange={e => setWatchOrigin(e.target.value.toUpperCase())} placeholder="BEG" maxLength={3}/>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--ssv3-text-sec)', marginBottom: 3 }}>Odredište (IATA)</div>
                  <input className="ssv3-filter-input" value={watchDest} onChange={e => setWatchDest(e.target.value.toUpperCase())} placeholder="TIV" maxLength={3}/>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--ssv3-text-sec)', marginBottom: 3 }}>Datum polaska</div>
                  <input className="ssv3-filter-input" type="date" value={watchDep} onChange={e => setWatchDep(e.target.value)}/>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--ssv3-text-sec)', marginBottom: 3 }}>Datum povratka (opt.)</div>
                  <input className="ssv3-filter-input" type="date" value={watchRet} onChange={e => setWatchRet(e.target.value)}/>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--ssv3-text-sec)', marginBottom: 3 }}>Trenutna cena (€)</div>
                  <input className="ssv3-filter-input" type="number" value={currentPrice} onChange={e => setCurrentPrice(e.target.value)} placeholder="0"/>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--ssv3-text-sec)', marginBottom: 3 }}>Ciljana cena (€)</div>
                  <input className="ssv3-filter-input" type="number" value={targetPrice} onChange={e => setTargetPrice(e.target.value)} placeholder="0"/>
                </div>
              </div>
              <div style={{ padding: '10px', background: 'var(--ssv3-purple-soft)', borderRadius: 4, fontSize: 11, marginBottom: 14 }}>
                💡 Sistem će periodično proveravati cene putem Amadeus API-ja i obavestiti vas kad cena dostigne željeni iznos.
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button className="ssv3-btn-ghost" style={{ padding: '0 16px', height: 36, width: 'auto' }} onClick={() => setShowAddForm(false)}>Otkaži</button>
                <button className="ssv3-btn-primary" style={{ height: 36, padding: '0 20px' }}
                  disabled={!watchOrigin || !watchDest || !watchDep}
                  onClick={handleAddWatch}>
                  <Bell size={13}/> Postavi alarm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FlightPriceTracker;
