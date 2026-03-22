import React from 'react';
import type { FlightLeg, FlightSearchResult } from '../../types';

// ─────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────
const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('sr-Latn-RS', { hour: '2-digit', minute: '2-digit' });

const formatDuration = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
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
        'FLEX':    { bg: 'rgba(5,150,105,0.1)',  color: '#059669' },
        'PLUS':    { bg: 'rgba(37,99,235,0.1)',  color: '#2563eb' },
        'LITE':    { bg: 'rgba(245,158,11,0.1)', color: '#d97706' },
        'BASIC':   { bg: 'rgba(100,116,139,0.1)', color: '#64748b' },
        'ECONOMY': { bg: 'rgba(100,116,139,0.1)', color: '#64748b' },
    };
    const c = colors[brand] ?? colors['ECONOMY'];
    return (
        <span style={{
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '10px',
            fontWeight: 800,
            letterSpacing: '0.06em',
            background: c.bg,
            color: c.color,
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

    return (
        <div style={{ flex: 1 }}>
            {/* Label: Polazak / Povratak */}
            <div style={{
                fontSize: '10px',
                fontWeight: 800,
                textTransform: 'uppercase' as const,
                letterSpacing: '0.08em',
                color: 'var(--v6-text-muted)',
                marginBottom: '8px',
            }}>
                {label}
            </div>

            {/* Timeline: Polazak —[trajanje]—> Dolazak */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
            }}>
                {/* Polazak */}
                <div style={{ textAlign: 'center' as const, flexShrink: 0 }}>
                    <div style={{ fontSize: 'var(--v6-fs-xl)', fontWeight: 900, color: 'var(--v6-text-primary)', lineHeight: 1 }}>
                        {formatTime(first.departTime)}
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--v6-accent)', marginTop: '2px' }}>
                        {first.origin}
                    </div>
                </div>

                {/* Linija sa info */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' as const, alignItems: 'center', gap: '3px' }}>
                    <div style={{ fontSize: '11px', color: 'var(--v6-text-muted)', fontWeight: 600 }}>
                        {formatDuration(leg.totalDuration)}
                    </div>
                    {/* Linija */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        width: '100%',
                        gap: '0',
                    }}>
                        <div style={{ height: '2px', flex: 1, background: 'var(--v6-border)' }} />
                        {leg.stops > 0 && (
                            <>
                                <div style={{
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    border: '2px solid var(--v6-color-on-request)',
                                    background: 'var(--v6-bg-card)',
                                    flexShrink: 0,
                                }} />
                                <div style={{ height: '2px', flex: 1, background: 'var(--v6-border)' }} />
                            </>
                        )}
                        {leg.stops === 0 && (
                            <span style={{ fontSize: '14px', flexShrink: 0 }}>✈️</span>
                        )}
                        <div style={{ height: '2px', flex: leg.stops === 0 ? 0 : 1, background: 'var(--v6-border)' }} />
                    </div>
                    {/* Presedanje info */}
                    <div style={{ fontSize: '10px', color: leg.stops > 0 ? 'var(--v6-color-on-request-text)' : 'var(--v6-color-instant-text)', fontWeight: 600 }}>
                        {leg.stops === 0
                            ? 'Direktno ✓'
                            : `${leg.stops} presedanje · ${leg.stopoverAirports.join(', ')} · čekanje ${formatDuration(leg.stopoverDuration ?? 0)}`
                        }
                    </div>
                </div>

                {/* Dolazak */}
                <div style={{ textAlign: 'center' as const, flexShrink: 0 }}>
                    <div style={{ fontSize: 'var(--v6-fs-xl)', fontWeight: 900, color: 'var(--v6-text-primary)', lineHeight: 1 }}>
                        {formatTime(last.arriveTime)}
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--v6-accent)', marginTop: '2px' }}>
                        {last.destination}
                    </div>
                </div>
            </div>

            {/* Broj leta + avion */}
            <div style={{
                marginTop: '6px',
                fontSize: '11px',
                color: 'var(--v6-text-muted)',
                display: 'flex',
                gap: '8px',
                flexWrap: 'wrap' as const,
            }}>
                {leg.segments.map(s => (
                    <span key={s.flightNo}>
                        {s.flightNo}
                        {s.aircraft && ` · ${s.aircraft}`}
                        {s.operatedBy && ` · operisan od ${s.operatedBy}`}
                    </span>
                ))}
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
}

export const FlightCard: React.FC<FlightCardProps> = ({ flight, index, paxTotal, onBook }) => {
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
                gap: '10px',
                padding: '12px 18px',
                background: flight.isPrime ? 'linear-gradient(135deg, rgba(180,83,9,0.06), rgba(245,158,11,0.03))' : 'var(--v6-bg-section)',
                borderBottom: '1px solid var(--v6-border)',
                flexWrap: 'wrap' as const,
            }}>
                <span style={{ fontSize: '20px' }}>{flight.airlineLogo}</span>
                <span style={{
                    fontSize: 'var(--v6-fs-sm)',
                    fontWeight: 700,
                    color: 'var(--v6-text-primary)',
                }}>
                    {flight.airline}
                </span>

                {flight.isPrime && (
                    <span style={{
                        padding: '2px 8px',
                        background: 'linear-gradient(135deg, #b45309, #f59e0b)',
                        color: '#ffffff',
                        borderRadius: '999px',
                        fontSize: '10px',
                        fontWeight: 800,
                        letterSpacing: '0.06em',
                    }}>🏆 PRIME</span>
                )}

                <FareBadge brand={flight.outbound.fareBrand} />

                <div style={{ marginLeft: 'auto', display: 'flex', gap: '6px', alignItems: 'center' }}>
                    <StatusBadge status={flight.outbound.status} />
                </div>
            </div>

            {/* ── BODY: Polazak + Povratak letovi ──────── */}
            <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column' as const, gap: '14px' }}>

                {/* Polazak */}
                <LegView leg={flight.outbound} label="✈ Polazak" />

                {/* Povratak */}
                {flight.inbound && (
                    <>
                        <div style={{ height: '1px', background: 'var(--v6-border)' }} />
                        <LegView leg={flight.inbound} label="← Povratak" />
                    </>
                )}

                {/* Prtljag info */}
                <BaggageInfo leg={flight.outbound} />
            </div>

            {/* ── FOOTER: Cena + Rezerviši ──────────────── */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                padding: '14px 18px',
                borderTop: '1px solid var(--v6-border)',
                background: 'var(--v6-bg-section)',
                flexWrap: 'wrap' as const,
            }}>
                {/* Cena */}
                <div>
                    <div style={{
                        fontSize: 'var(--v6-fs-2xl)',
                        fontWeight: 900,
                        color: 'var(--v6-text-primary)',
                        lineHeight: 1,
                    }}>
                        {formatPrice(flight.totalPrice)}
                    </div>
                    <div style={{
                        fontSize: '12px',
                        color: 'var(--v6-text-muted)',
                        marginTop: '3px',
                    }}>
                        Ukupno za {paxTotal} {paxTotal === 1 ? 'putnika' : 'putnika'}
                        {' · '}≈ {formatPrice(pricePerPerson)}/os
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--v6-text-muted)', marginTop: '2px' }}>
                        {flight.outbound.isRefundable
                            ? '✓ Povrat karata dostupan'
                            : '⚠ Karte nisu povratne'}
                    </div>
                </div>

                {/* CTA */}
                <button
                    onClick={() => onBook(flight)}
                    id={`v6-fl-book-${flight.id}`}
                    aria-label={`Odaberi ${flight.airline} let za ${formatPrice(flight.totalPrice)}`}
                    style={{
                        padding: '13px 24px',
                        background: 'var(--v6-accent)',
                        color: 'var(--v6-accent-text)',
                        border: 'none',
                        borderRadius: 'var(--v6-radius-md)',
                        fontSize: 'var(--v6-fs-sm)',
                        fontWeight: 700,
                        cursor: 'pointer',
                        fontFamily: 'var(--v6-font)',
                        transition: 'opacity 0.15s',
                        whiteSpace: 'nowrap',
                    }}
                >
                    Odaberi let →
                </button>
            </div>
        </div>
    );
};

export default FlightCard;
