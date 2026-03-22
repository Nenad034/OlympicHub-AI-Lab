import React, { useState } from 'react';
import type { FlightLeg, FlightSearchResult } from '../../types';
import { useSearchStore } from '../../stores/useSearchStore';
import { Plane, ChevronDown, ChevronUp, Briefcase, RefreshCcw, Info } from 'lucide-react';

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('sr-Latn-RS', { hour: '2-digit', minute: '2-digit' });

const formatDate = (iso: string) => 
    new Date(iso).toLocaleDateString('sr-Latn-RS', { day: '2-digit', month: 'short' });

const formatDuration = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

const getAirlineLogo = (airline: string) => {
    // Fallback na logo sa CDN-a
    const codeMap: Record<string, string> = {
        'Air Serbia': 'JU',
        'Lufthansa': 'LH',
        'Turkish Airlines': 'TK',
        'Emirates': 'EK',
        'FlyDubai': 'FZ',
        'Qatar Airways': 'QR',
        'Austrian': 'OS',
        'Swiss': 'LX',
        'Aegean': 'A3',
        'Wizz Air': 'W6',
        'Ryanair': 'FR'
    };
    const code = codeMap[airline] || 'JU';
    return `https://images.kiwi.com/airlines/64/${code}.png`;
};

const formatPrice = (n: number, currency = 'EUR') =>
    new Intl.NumberFormat('de-DE', { style: 'currency', currency, minimumFractionDigits: 0 }).format(n);

// ─────────────────────────────────────────────────────────────
// STATUS BADGE
// ─────────────────────────────────────────────────────────────
import type { AvailabilityStatus } from '../../types';

const StatusBadge: React.FC<{ status: AvailabilityStatus }> = ({ status }) => (
    <span style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '2px 8px',
        borderRadius: '999px',
        fontSize: '11px',
        fontWeight: 700,
        background: status === 'instant' ? 'var(--v6-color-instant-bg)' : 'var(--v6-color-on-request-bg)',
        color: status === 'instant' ? 'var(--v6-color-instant-text)' : 'var(--v6-color-on-request-text)',
        flexShrink: 0,
    }}>
        {status === 'instant' ? '⚡ Odmah' : '❓ Na upit'}
    </span>
);

// ─────────────────────────────────────────────────────────────
// FARE BRAND BADGE
// ─────────────────────────────────────────────────────────────
const FareBadge: React.FC<{ brand?: string }> = ({ brand }) => {
    if (!brand) return null;
    const colors: Record<string, { bg: string; color: string }> = {
        'FLEX':    { bg: 'rgba(5,150,105,0.08)',  color: '#059669' },
        'PLUS':    { bg: 'rgba(37,99,235,0.08)',  color: '#2563eb' },
        'LITE':    { bg: 'rgba(245,158,11,0.08)', color: '#d97706' },
        'BASIC':   { bg: 'rgba(100,116,139,0.08)', color: '#64748b' },
        'ECONOMY': { bg: 'rgba(100,116,139,0.08)', color: '#64748b' },
    };
    const c = colors[brand] ?? colors['ECONOMY'];
    return (
        <span style={{
            padding: '2px 8px',
            borderRadius: '6px',
            fontSize: '10px',
            fontWeight: 800,
            background: c.bg,
            color: c.color,
            border: `1px solid ${c.color}20`
        }}>{brand}</span>
    );
};

// ─────────────────────────────────────────────────────────────
// SINGLE LEG — Timeline vizualizacija
// ─────────────────────────────────────────────────────────────
interface LegViewProps {
    leg: FlightLeg;
    label: string;
}

const LegView: React.FC<LegViewProps> = ({ leg, label }) => {
    const first = leg.segments[0];
    const last = leg.segments[leg.segments.length - 1];
    const stops = leg.segments.length - 1;

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '30px', flex: 1 }}>
            {/* Polazak */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', minWidth: '130px' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--v6-text-muted)', marginBottom: '2px' }}>
                    {formatDate(first.departTime)}
                </div>
                <div style={{ fontSize: '18px', fontWeight: 950, color: 'var(--v6-text-primary)', lineHeight: 1 }}>
                    {formatTime(first.departTime)}
                </div>
                <div style={{ fontSize: '12px', fontWeight: 900, color: 'var(--v6-navy)', marginTop: '4px', textAlign: 'right' }}>
                    {first.originCity || 'Beograd'} ({first.origin})
                </div>
                <div style={{ fontSize: '9px', fontWeight: 600, color: 'var(--v6-text-muted)', textAlign: 'right', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>
                    {first.originAirport || 'Aerodrom Nikola Tesla'}
                </div>
            </div>
            
            {/* Linija i Presedanje */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px', flex: 1, maxWidth: '160px' }}>
                <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--v6-text-muted)' }}>{formatDuration(leg.totalDuration)}</div>
                <div style={{ width: '100%', height: '2px', background: 'var(--v6-border)', position: 'relative', margin: '6px 0' }}>
                    <div style={{ position: 'absolute', top: '-3px', left: '0', width: '8px', height: '8px', borderRadius: '50%', border: '2px solid var(--v6-border)', background: '#fff' }} />
                    <div style={{ position: 'absolute', top: '-3px', right: '0', width: '8px', height: '8px', borderRadius: '50%', border: '2px solid var(--v6-navy)', background: 'var(--v6-navy)' }} />
                </div>
                <div style={{ fontSize: '10px', fontWeight: 900, color: stops > 0 ? '#ef4444' : '#10b981', textTransform: 'uppercase', textAlign: 'center' }}>
                    {stops === 0 ? 'DIREKTAN' : (
                        <span style={{ lineHeight: 1.1, display: 'block' }}>
                            {stops} PRESEDANJE ({leg.stopoverAirports?.[0] || '?'})
                            <br />
                            <span style={{ fontSize: '8px', opacity: 0.8 }}>+ {formatDuration(leg.stopoverDuration || 0)}</span>
                        </span>
                    )}
                </div>
            </div>

            {/* Dolazak */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', minWidth: '130px' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--v6-text-muted)', marginBottom: '2px' }}>
                    {formatDate(last.arriveTime)}
                </div>
                <div style={{ fontSize: '18px', fontWeight: 950, color: 'var(--v6-text-primary)', lineHeight: 1 }}>
                    {formatTime(last.arriveTime)}
                </div>
                <div style={{ fontSize: '12px', fontWeight: 900, color: 'var(--v6-navy)', marginTop: '4px', textAlign: 'left' }}>
                    {last.destinationCity || 'Pariz'} ({last.destination})
                </div>
                <div style={{ fontSize: '9px', fontWeight: 600, color: 'var(--v6-text-muted)', textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '140px' }}>
                    {last.destinationAirport || 'Aerodrom Charles de Gaulle'}
                </div>
            </div>
        </div>
    );
};

// ─────────────────────────────────────────────────────────────
// BAGGAGE INFO
// ─────────────────────────────────────────────────────────────
const BaggageInfo: React.FC<{ leg: FlightLeg }> = ({ leg }) => (
    <div style={{
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap' as const,
        marginTop: '6px',
    }}>
        <span style={{
            fontSize: '11px',
            padding: '2px 8px',
            borderRadius: '4px',
            fontWeight: 600,
            background: leg.baggageIncluded ? 'var(--v6-color-instant-bg)' : 'var(--v6-bg-section)',
            color: leg.baggageIncluded ? 'var(--v6-color-instant-text)' : 'var(--v6-text-muted)',
        }}>
            {leg.baggageIncluded ? '✓ Ručni prtljag' : '✗ Bez prtljaga'}
        </span>
        <span style={{
            fontSize: '11px',
            padding: '2px 8px',
            borderRadius: '4px',
            fontWeight: 600,
            background: leg.checkedBagIncluded ? 'var(--v6-color-instant-bg)' : 'var(--v6-bg-section)',
            color: leg.checkedBagIncluded ? 'var(--v6-color-instant-text)' : 'var(--v6-text-muted)',
        }}>
            {leg.checkedBagIncluded ? '✓ Kufer uključen' : '✗ Kufer se plaća'}
        </span>
        {leg.isRefundable && (
            <span style={{
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '4px',
                fontWeight: 600,
                background: 'var(--v6-color-instant-bg)',
                color: 'var(--v6-color-instant-text)',
            }}>
                ✓ Povrat karata
            </span>
        )}
    </div>
);

// ─────────────────────────────────────────────────────────────
// MAIN: FlightCard
// ─────────────────────────────────────────────────────────────
interface FlightCardProps {
    flight: FlightSearchResult;
    index: number;
    paxTotal: number;
    onBook: (flight: FlightSearchResult) => void;
    customActionLabel?: string;
    isCompact?: boolean;
}

export const FlightCard: React.FC<FlightCardProps> = ({ flight, index, paxTotal, onBook, customActionLabel, isCompact }) => {
    const [showDetails, setShowDetails] = useState(false);
    const pricePerPerson = Math.round(flight.totalPrice / Math.max(paxTotal, 1));

    return (
        <div
            className="v6-fade-in"
            role="article"
            aria-label={`${flight.airline} — ${formatPrice(flight.totalPrice)}`}
            style={{
                animationDelay: `${index * 0.07}s`,
                background: 'var(--v6-bg-card)',
                border: `1.5px solid ${flight.isPrime ? 'var(--v6-color-prime)' : 'var(--v6-border)'}`,
                borderRadius: 'var(--v6-radius-lg)',
                overflow: 'hidden',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                boxShadow: 'var(--v6-shadow-sm)',
            }}
            onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                (e.currentTarget as HTMLElement).style.boxShadow = 'var(--v6-shadow-md)';
            }}
            onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                (e.currentTarget as HTMLElement).style.boxShadow = 'var(--v6-shadow-sm)';
            }}
        >
            {/* ── HEADER: Aviokompanija + Fare + Status ── */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '10px 18px',
                background: flight.isPrime ? 'linear-gradient(135deg, rgba(37,99,235,0.06), rgba(30,41,59,0.03))' : 'var(--v6-bg-section)',
                borderBottom: '1px solid var(--v6-border)',
                flexWrap: 'wrap' as const,
            }}>
                <img src={getAirlineLogo(flight.airline)} alt={flight.airline} style={{ height: '22px', width: 'auto', borderRadius: '4px' }} />
                {!isCompact && <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--v6-text-primary)' }}>{flight.airline}</span>}

                {flight.isPrime && (
                    <span style={{ padding: '1px 6px', background: 'linear-gradient(135deg, #b45309, #f59e0b)', color: '#fff', borderRadius: '999px', fontSize: '9px', fontWeight: 800 }}>🏆 PRIME</span>
                )}

                {!isCompact && <FareBadge brand={flight.outbound.fareBrand} />}

                <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <StatusBadge status={flight.outbound.status} />
                </div>
            </div>

            {/* ── BODY: ULTRA COMPACT ──────── */}
            <div style={{ padding: '12px 18px', display: 'flex', flexDirection: isCompact ? 'column' : 'row', alignItems: isCompact ? 'stretch' : 'center', gap: isCompact ? '15px' : '40px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                        <LegView leg={flight.outbound} label="Polazak" />
                    </div>
                    
                    {flight.inbound && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '15px', borderTop: '1px solid var(--v6-bg-section)', paddingTop: '8px' }}>
                            <LegView leg={flight.inbound} label="Povratak" />
                        </div>
                    )}
                </div>

                {/* Cena desno uz letove za uštedu visine */}
                <div style={{ 
                    borderLeft: isCompact ? 'none' : '1.5px solid var(--v6-border)', 
                    borderTop: isCompact ? '1.5px solid var(--v6-border)' : 'none',
                    paddingLeft: isCompact ? '0' : '24px', 
                    paddingTop: isCompact ? '12px' : '0',
                    textAlign: isCompact ? 'center' : 'right', 
                    minWidth: isCompact ? 'unset' : '150px' 
                }}>
                    <div style={{ fontSize: isCompact ? '20px' : '24px', fontWeight: 950, color: 'var(--v6-text-primary)', lineHeight: 1 }}>{formatPrice(flight.totalPrice)}</div>
                    <div style={{ fontSize: '10px', color: 'var(--v6-text-muted)', marginTop: '4px', fontWeight: 600 }}>Cena za {paxTotal} putnika</div>
                    <div style={{
                        marginTop: '6px',
                        display: 'inline-block',
                        padding: '2px 8px',
                        background: 'rgba(37,99,235,0.08)',
                        color: 'var(--v6-navy)',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontWeight: 900
                    }}>
                        {formatPrice(pricePerPerson)}/os
                    </div>
                </div>
            </div>

            {/* ── EXPANDABLE DETAILS ──────── */}
            {showDetails && (
                <div style={{ padding: '0 18px 15px', borderTop: '1px dashed var(--v6-border)', background: 'var(--v6-bg-section)' }}>
                    <div style={{ paddingTop: '15px', display: 'flex', gap: '30px' }}>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--v6-navy)', marginBottom: '8px', textTransform: 'uppercase' }}>Detalji Letova</div>
                            {flight.outbound.segments.map(s => (
                                <div key={s.flightNo} style={{ fontSize: '12px', color: 'var(--v6-text-secondary)', marginBottom: '4px', display: 'flex', justifyContent: 'space-between' }}>
                                    <span>{s.flightNo} · {s.aircraft}</span>
                                    {s.operatedBy && <span>operisan od {s.operatedBy}</span>}
                                </div>
                            ))}
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--v6-navy)', marginBottom: '8px', textTransform: 'uppercase' }}>Prtljag i Uslovi</div>
                            <BaggageInfo leg={flight.outbound} />
                            <div style={{ marginTop: '8px', fontSize: '11px', color: flight.outbound.isRefundable ? '#10b981' : '#ef4444', fontWeight: 700 }}>
                                {flight.outbound.isRefundable ? '✓ Povrat karata dostupan' : '✗ Karte nisu povratne'}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ── FOOTER: ACTIONS ──────────────── */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '12px',
                padding: '10px 18px',
                borderTop: '1px solid var(--v6-bg-section)',
                background: 'rgba(30,41,59,0.02)',
            }}>
                <div style={{ marginRight: 'auto', display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{ fontSize: '11px', color: flight.outbound.isRefundable ? '#10b981' : 'var(--v6-text-muted)', fontWeight: 800 }}>
                        {flight.outbound.isRefundable ? '✓ Povrat karata dostupan' : '✗ Nerefundabilno'}
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <button
                        onClick={() => setShowDetails(!showDetails)}
                        style={{
                            background: 'transparent',
                            border: '1.5px solid var(--v6-border)',
                            borderRadius: '12px',
                            padding: '8px 16px',
                            fontSize: '13px',
                            fontWeight: 800,
                            color: 'var(--v6-navy)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                        }}
                    >
                        {showDetails ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        {showDetails ? 'Sakrij detalje' : 'Detalji leta'}
                    </button>

                    <button
                        onClick={() => onBook(flight)}
                        id={`v6-fl-book-${flight.id}`}
                        style={{
                            padding: '10px 24px',
                            background: 'var(--v6-navy)',
                            color: '#fff',
                            border: 'none',
                            borderRadius: '12px',
                            fontSize: '14px',
                            fontWeight: 900,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            boxShadow: '0 4px 12px rgba(30,41,59,0.2)'
                        }}
                    >
                        {customActionLabel || 'Odaberi let'}
                    </button>

                    <button
                        onClick={() => {
                            useSearchStore.getState().saveOffer({
                                id: `fl-${flight.id}-${Date.now()}`,
                                type: 'flight',
                                label: `Let: ${flight.airline}`,
                                description: `${flight.outbound.segments[0].origin} → ${flight.outbound.segments[flight.outbound.segments.length-1].destination}`,
                                totalPrice: flight.totalPrice,
                                currency: flight.currency,
                                timestamp: Date.now(),
                                data: { flightId: flight.id },
                                hasPriceDropAlert: false
                            });
                            alert('Let sačuvan u ponude!');
                        }}
                        style={{
                            width: '44px',
                            height: '44px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'var(--v6-bg-card)',
                            border: '1.5px solid var(--v6-border)',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            fontSize: '18px'
                        }}
                        title="Sačuvaj ponudu"
                    >
                        💾
                    </button>

                    <button
                        onClick={() => alert('Share opcije: Viber, WhatsApp, Telegram, Email...')}
                        style={{
                            width: '44px',
                            height: '44px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'var(--v6-bg-card)',
                            border: '1.5px solid var(--v6-border)',
                            borderRadius: '12px',
                            cursor: 'pointer',
                            fontSize: '18px'
                        }}
                        title="Podeli ponudu"
                    >
                        🔗
                    </button>
                </div>
            </div>
        </div>
    );
};

export default FlightCard;
