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
            background: leg.baggageIncluded ? 'rgba(5,150,105,0.08)' : 'var(--bg-app)',
            color: leg.baggageIncluded ? '#059669' : 'var(--text-muted)',
        }}>
            {leg.baggageIncluded ? '✓ Ručni prtljag' : '✗ Bez prtljaga'}
        </span>
        {leg.checkedBagIncluded && (
             <span style={{
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '4px',
                fontWeight: 600,
                background: 'rgba(37,99,235,0.08)',
                color: '#2563eb',
            }}>
                ✓ Kofer uključen
            </span>
        )}
    </div>
);

const getDestinationImage = (city: string) => {
    const images: Record<string, string> = {
        'Tivat': 'https://images.unsplash.com/photo-1555990201-903820251147?auto=format&fit=crop&q=80&w=400',
        'Pariz': 'https://images.unsplash.com/photo-1502602898657-3e917247a183?auto=format&fit=crop&q=80&w=400',
        'Rim': 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?auto=format&fit=crop&q=80&w=400',
        'Bali': 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&q=80&w=400',
        'Beograd': 'https://images.unsplash.com/photo-1563814674400-f65563914757?auto=format&fit=crop&q=80&w=400',
        'Istanbul': 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&q=80&w=400',
        'Vienna': 'https://images.unsplash.com/photo-1516550893923-42d28e5677af?auto=format&fit=crop&q=80&w=400'
    };
    return images[city] || 'https://images.unsplash.com/photo-1436491865332-7a61a109c0f3?auto=format&fit=crop&q=80&w=400';
};

interface FlightCardProps {
    flight: FlightSearchResult;
    index: number;
    paxTotal: number;
    onBook: (flight: FlightSearchResult) => void;
    customActionLabel?: string;
    isCompact?: boolean;
}

export const FlightCard: React.FC<FlightCardProps> = ({ flight, index, paxTotal, onBook, customActionLabel }) => {
    const [showDetails, setShowDetails] = useState(false);
    const pricePerPerson = Math.round(flight.totalPrice / Math.max(paxTotal, 1));
    const destCity = flight.outbound.segments[flight.outbound.segments.length - 1].destinationCity || 'Tivat';

    return (
        <article
            className="search-result-card v6-fade-in-up"
            style={{ animationDelay: `${index * 0.07}s` }}
        >
            {/* ── COL 1: DESTINATION IMAGE + AIRLINE ── */}
            <div className="card-image-section">
                <img src={getDestinationImage(destCity)} alt={destCity} />
                
                {/* Overlay Airline Logo */}
                <div style={{ 
                    position: 'absolute', 
                    top: '12px', 
                    left: '12px', 
                    background: 'rgba(255,255,255,0.95)', 
                    padding: '6px', 
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: 'var(--shadow-sm)'
                }}>
                    <img src={getAirlineLogo(flight.airline)} alt={flight.airline} style={{ height: '18px', width: 'auto' }} />
                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#1A234E' }}>{flight.airline}</span>
                </div>

                {/* PRIME / STATUS BADGES */}
                <div style={{ position: 'absolute', bottom: '12px', left: '12px', display: 'flex', gap: '6px' }}>
                    {flight.isPrime && <span className="badge-luxury">🏆 PRIME</span>}
                    <StatusBadge status={flight.outbound.status} />
                </div>
            </div>

            {/* ── COL 2: FLIGHT INFO ── */}
            <div className="card-info-section" style={{ padding: '20px 24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <FareBadge brand={flight.outbound.fareBrand} />
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>
                        {flight.outbound.segments[0].origin} → {flight.outbound.segments[flight.outbound.segments.length - 1].destination}
                    </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <LegView leg={flight.outbound} label="Polazak" />
                    {flight.inbound && (
                        <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '16px' }}>
                            <LegView leg={flight.inbound} label="Povratak" />
                        </div>
                    )}
                </div>

                {/* Baggage info simplified */}
                <div style={{ display: 'flex', gap: '12px', marginTop: 'auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)' }}>
                         <Briefcase size={14} className="icon-luxury" />
                         {flight.outbound.baggageIncluded ? 'Ručni prtljag uključen' : 'Bez ručnog prtljaga'}
                    </div>
                </div>
            </div>

            {/* ── COL 3: PRICE & ACTION ── */}
            <div className="price-section">
                <div className="price-label">Cena za {paxTotal} putnika</div>
                <div className="price-amount">
                    {formatPrice(flight.totalPrice, flight.currency)}
                </div>
                <div className="badge-luxury" style={{ background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--brand-accent)' }}>
                    {formatPrice(pricePerPerson, flight.currency)} po osobi
                </div>

                <div style={{ width: '100%', marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button
                        className="v6-card-cta-btn"
                        onClick={() => onBook(flight)}
                        style={{ width: '100%', padding: '12px', borderRadius: '12px' }}
                    >
                        {customActionLabel || 'Odaberi let'}
                    </button>
                    
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                         <button 
                            className="counter-btn-luxury" 
                            onClick={() => setShowDetails(!showDetails)}
                            title="Detalji"
                         >
                            <Info size={18} />
                         </button>
                        <button
                            className="counter-btn-luxury"
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
                                alert('Let sačuvan!');
                            }}
                            title="Sačuvaj"
                        >
                            💾
                        </button>
                    </div>
                </div>
            </div>

            {/* EXPANDABLE DETAILS AREA */}
            {showDetails && (
                <div style={{ 
                    gridColumn: '1 / span 3', 
                    padding: '24px', 
                    background: 'var(--bg-app)', 
                    borderTop: '1px solid var(--border-color)',
                    animation: 'v6FadeInUp 0.3s ease'
                }}>
                     <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
                        <div>
                             <h4 style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--brand-accent)', marginBottom: '12px' }}>Struktura leta</h4>
                             {flight.outbound.segments.map(s => (
                                <div key={s.flightNo} style={{ fontSize: '13px', marginBottom: '8px', color: 'var(--text-main)' }}>
                                    <strong>{s.flightNo}</strong> · {s.aircraft || 'Airbus/ATR'} · Operisan od {s.operatedBy || flight.airline}
                                </div>
                             ))}
                        </div>
                        <div>
                             <h4 style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--brand-accent)', marginBottom: '12px' }}>Pravila i uslovi</h4>
                             <BaggageInfo leg={flight.outbound} />
                             <div style={{ marginTop: '12px', fontSize: '12px', color: flight.outbound.isRefundable ? '#10b981' : '#ef4444', fontWeight: 700 }}>
                                {flight.outbound.isRefundable ? '✓ Refundabilna karta' : '✗ Nerefundabilna karta'}
                             </div>
                        </div>
                     </div>
                </div>
            )}
        </article>
    );
};

export default FlightCard;
